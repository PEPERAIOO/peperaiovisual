import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  PropostaFormacaoPreco,
  CargoMaoDeObra,
  HospedagemAlimentacao,
  Transporte,
  Material,
  CustoMaoDeObra,
  CustoLogistica,
  ResumoFinanceiro,
  CONSTANTES_CALCULO,
  ParametrosFinanceiros,
} from '../types/formacao-preco';
import supabase from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para cálculo de Formação de Preço de Venda
 * Implementa toda a lógica de orçamentação bottom-up
 */
export const useFormacaoPreco = (propostaId?: string) => {
  const { user } = useAuth();
  const [proposta, setProposta] = useState<PropostaFormacaoPreco>({
    nome: '',
    cliente: '',
    obra: '',
    dataElaboracao: new Date(),
    maoDeObra: [],
    hospedagens: [],
    transportes: [],
    materiais: [],
    parametrosFinanceiros: {
      bdi: 0.20, // 20%
      margemLucro: 0.15, // 15%
      taxaImpostos: 0.165, // 16.5%
      contingencia: 0.05, // 5%
      encargosSociais: 0.70, // 70%
      beneficios: 0.12, // 12%
      fatorProdutividade: 1.08, // 8% de improdutividade
    },
    status: 'rascunho',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propostas, setPropostas] = useState<PropostaFormacaoPreco[]>([]);

  // ============================================================================
  // CÁLCULOS DE MÃO DE OBRA
  // ============================================================================

  /**
   * Calcula o custo por hora a partir da diária, considerando encargos, benefícios
   * e o ajuste de produtividade
   * Fórmula: ((Diária * (1 + Encargos + Benefícios)) / 8) × Fator Produtividade
   */
  const calcularCustoHora = useCallback(
    (valorDiaria: number, encargosSociais: number, beneficios: number, fatorProdutividade: number): number => {
      const { HORAS_DIA } = CONSTANTES_CALCULO;
      const diariaComEncargosBeneficios = valorDiaria * (1 + encargosSociais + beneficios);
      const custoHoraBase = diariaComEncargosBeneficios / HORAS_DIA;
      return custoHoraBase * fatorProdutividade;
    },
    []
  );

  /**
   * Calcula o custo total de um cargo específico
   */
  const calcularCustoCargo = useCallback((cargo: CargoMaoDeObra): CustoMaoDeObra => {
    const { ADICIONAL_HE_50, ADICIONAL_HE_100 } = CONSTANTES_CALCULO;
    const {
      encargosSociais,
      beneficios,
      fatorProdutividade,
    } = proposta.parametrosFinanceiros;

    const fatorAjustado = Math.max(1, fatorProdutividade || 1);

    // Encargos e benefícios sobre a diária
    const encargos = cargo.valorDiaria * encargosSociais;
    const beneficiosValor = cargo.valorDiaria * beneficios;
    const diariaComEncargos = cargo.valorDiaria + encargos;
    const diariaComEncargosBeneficios = cargo.valorDiaria + encargos + beneficiosValor;

    // Custo por hora (com ajustes)
    const custoHora = calcularCustoHora(
      cargo.valorDiaria,
      encargosSociais,
      beneficios,
      fatorAjustado
    );

    // Base por dia: diária com encargos × dias × pessoas
    const diasNaObra = Math.max(0, cargo.diasNaObra || 0);
    const custoBaseDias = diariaComEncargosBeneficios * diasNaObra * cargo.qtdPessoas * fatorAjustado;

    // Horas extras (derivadas do custo/hora)
    const horasExtras50 = Math.max(0, cargo.horasExtras50 || 0);
    const horasExtras100 = Math.max(0, cargo.horasExtras100 || 0);

    const custoHorasExtras50 = custoHora * ADICIONAL_HE_50 * horasExtras50 * cargo.qtdPessoas;
    const custoHorasExtras100 = custoHora * ADICIONAL_HE_100 * horasExtras100 * cargo.qtdPessoas;

    // Mantém o campo existente, mas agora representa o custo base por dias (mais intuitivo)
    const custoHorasNormais = custoBaseDias;

    // Custo total do cargo
    const custoTotalCargo = custoBaseDias + custoHorasExtras50 + custoHorasExtras100;

    return {
      cargoId: cargo.id,
      cargo: cargo.cargo,
      valorDiaria: cargo.valorDiaria,
      encargos,
      beneficios: beneficiosValor,
      diariaComEncargos,
      diariaComEncargosBeneficios,
      custoHora,
      fatorProdutividade: fatorAjustado,
      custoHorasNormais,
      custoHorasExtras50,
      custoHorasExtras100,
      custoTotalCargo,
      qtdPessoas: cargo.qtdPessoas,
    };
  }, [calcularCustoHora, proposta.parametrosFinanceiros]);

  /**
   * Calcula o custo total de mão de obra
   */
  const custosTotalMaoDeObra = useMemo((): CustoMaoDeObra[] => {
    return proposta.maoDeObra.map(calcularCustoCargo);
  }, [proposta.maoDeObra, calcularCustoCargo]);

  const totalMaoDeObra = useMemo(() => {
    return custosTotalMaoDeObra.reduce((acc, custo) => acc + custo.custoTotalCargo, 0);
  }, [custosTotalMaoDeObra]);

  // ============================================================================
  // CÁLCULOS DE LOGÍSTICA
  // ============================================================================

  /**
   * Calcula custo de hospedagem e alimentação
   * Fórmula: (Dias Viajados * Valor Diária) * Qtd Pessoas
   */
  const calcularHospedagem = useCallback((hosp: HospedagemAlimentacao): number => {
    return hosp.valorDiaria * hosp.diasViajados * hosp.qtdPessoas;
  }, []);

  /**
   * Calcula custo de transporte
   * Fórmula: ((Distância / Consumo) * Preço Combustível + Pedágios) * Qtd Viagens
   */
  const calcularTransporte = useCallback((trans: Transporte): number => {
    const custoCombustivel = (trans.distanciaKm / trans.consumoKmPorLitro) * trans.precoCombustivel;
    const custoTotalPorViagem = custoCombustivel + trans.pedagios;
    return custoTotalPorViagem * trans.qtdViagens;
  }, []);

  const custoLogistica = useMemo((): CustoLogistica => {
    const hospedagemTotal = proposta.hospedagens.reduce(
      (acc, hosp) => acc + calcularHospedagem(hosp),
      0
    );

    const transporteTotal = proposta.transportes.reduce(
      (acc, trans) => acc + calcularTransporte(trans),
      0
    );

    return {
      hospedagemTotal,
      transporteTotal,
      totalLogistica: hospedagemTotal + transporteTotal,
    };
  }, [proposta.hospedagens, proposta.transportes, calcularHospedagem, calcularTransporte]);

  // ============================================================================
  // CÁLCULOS DE MATERIAIS
  // ============================================================================

  const totalMateriais = useMemo(() => {
    return proposta.materiais.reduce((acc, mat) => {
      if (mat.categoria === 'material') {
        return acc + mat.quantidade * mat.precoUnitario;
      }
      return acc;
    }, 0);
  }, [proposta.materiais]);

  const totalEquipamentos = useMemo(() => {
    return proposta.materiais.reduce((acc, mat) => {
      if (mat.categoria === 'equipamento') {
        return acc + mat.quantidade * mat.precoUnitario;
      }
      return acc;
    }, 0);
  }, [proposta.materiais]);

  const totalServicosTerceiros = useMemo(() => {
    return proposta.materiais.reduce((acc, mat) => {
      if (mat.categoria === 'servico_terceiro') {
        return acc + mat.quantidade * mat.precoUnitario;
      }
      return acc;
    }, 0);
  }, [proposta.materiais]);

  // ============================================================================
  // ENGENHARIA FINANCEIRA (FECHAMENTO)
  // ============================================================================

  /**
   * Calcula o resumo financeiro completo com BDI, margem e impostos
   */
  const resumoFinanceiro = useMemo((): ResumoFinanceiro => {
    const {
      bdi,
      margemLucro,
      taxaImpostos,
      contingencia,
      fatorProdutividade,
    } = proposta.parametrosFinanceiros;

    // Custos Diretos
    const custoMaoDeObra = totalMaoDeObra;
    const custoLogisticaTotal = custoLogistica.totalLogistica;
    const custoMateriais = totalMateriais + totalEquipamentos + totalServicosTerceiros;
    const subtotalCustosDirectos = custoMaoDeObra + custoLogisticaTotal + custoMateriais;

    // Custos Indiretos
    const bdiValor = subtotalCustosDirectos * bdi;
    const contingenciaValor = subtotalCustosDirectos * contingencia;
    const subtotalCustosIndiretos = bdiValor + contingenciaValor;

    // Custo Total
    const custoTotal = subtotalCustosDirectos + subtotalCustosIndiretos;

    // Formação de Preço
    const margemLucroValor = custoTotal * margemLucro;
    const precoAnteImpostos = custoTotal + margemLucroValor;

    /**
     * Cálculo de Impostos "por fora" (Gross Up)
     * Para chegar ao preço final, dividimos pelo (1 - taxa de impostos)
     * Exemplo: Se o preço antes de impostos é R$ 100 e impostos são 16.5%
     * Preço Final = 100 / (1 - 0.165) = 100 / 0.835 = R$ 119.76
     * Impostos = 119.76 - 100 = R$ 19.76 (que é ~16.5% de R$ 119.76)
     */
    const precoFinalVenda = precoAnteImpostos / (1 - taxaImpostos);
    const impostosValor = precoFinalVenda - precoAnteImpostos;

    // Horas e métricas
    const { HORAS_DIA } = CONSTANTES_CALCULO;
    const fatorAjustado = Math.max(1, fatorProdutividade || 1);
    const horasBase = proposta.maoDeObra.reduce(
      (acc, cargo) => acc + Math.max(0, cargo.diasNaObra || 0) * HORAS_DIA * cargo.qtdPessoas,
      0
    );
    const horasExtras = proposta.maoDeObra.reduce(
      (acc, cargo) => acc + (Math.max(0, cargo.horasExtras50 || 0) + Math.max(0, cargo.horasExtras100 || 0)) * cargo.qtdPessoas,
      0
    );
    const horasTotaisAjustadas = (horasBase + horasExtras) * fatorAjustado;
    const custoHoraMedio = horasTotaisAjustadas > 0 ? custoMaoDeObra / horasTotaisAjustadas : 0;

    const margemLucroPercentual = (margemLucroValor / precoFinalVenda) * 100;
    const margemContribuicao = ((precoFinalVenda - custoTotal) / precoFinalVenda) * 100;
    const markupTotal = custoTotal > 0 ? ((precoFinalVenda / custoTotal) - 1) * 100 : 0;

    return {
      custoMaoDeObra,
      custoLogistica: custoLogisticaTotal,
      custoMateriais,
      subtotalCustosDirectos,
      bdi: bdiValor,
      contingencia: contingenciaValor,
      subtotalCustosIndiretos,
      custoTotal,
      margemLucro: margemLucroValor,
      precoAnteImpostos,
      impostos: impostosValor,
      precoFinalVenda,
      margemLucroPercentual,
      margemContribuicao,
      markupTotal,
      horasTotaisAjustadas,
      custoHoraMedio,
    };
  }, [
    totalMaoDeObra,
    custoLogistica.totalLogistica,
    totalMateriais,
    totalEquipamentos,
    totalServicosTerceiros,
    proposta.parametrosFinanceiros,
    proposta.maoDeObra,
  ]);

  // ============================================================================
  // MÉTODOS DE MANIPULAÇÃO
  // ============================================================================

  const adicionarCargo = useCallback((cargo: Omit<CargoMaoDeObra, 'id'>) => {
    setProposta((prev) => ({
      ...prev,
      maoDeObra: [...prev.maoDeObra, { ...cargo, id: crypto.randomUUID() }],
    }));
  }, []);

  const removerCargo = useCallback((id: string) => {
    setProposta((prev) => ({
      ...prev,
      maoDeObra: prev.maoDeObra.filter((cargo) => cargo.id !== id),
    }));
  }, []);

  const atualizarCargo = useCallback((id: string, cargo: Partial<CargoMaoDeObra>) => {
    setProposta((prev) => ({
      ...prev,
      maoDeObra: prev.maoDeObra.map((c) => (c.id === id ? { ...c, ...cargo } : c)),
    }));
  }, []);

  const adicionarHospedagem = useCallback((hosp: Omit<HospedagemAlimentacao, 'id'>) => {
    setProposta((prev) => ({
      ...prev,
      hospedagens: [...prev.hospedagens, { ...hosp, id: crypto.randomUUID() }],
    }));
  }, []);

  const adicionarTransporte = useCallback((trans: Omit<Transporte, 'id'>) => {
    setProposta((prev) => ({
      ...prev,
      transportes: [...prev.transportes, { ...trans, id: crypto.randomUUID() }],
    }));
  }, []);

  const adicionarMaterial = useCallback((mat: Omit<Material, 'id'>) => {
    setProposta((prev) => ({
      ...prev,
      materiais: [...prev.materiais, { ...mat, id: crypto.randomUUID() }],
    }));
  }, []);

  const atualizarParametrosFinanceiros = useCallback(
    (parametros: Partial<ParametrosFinanceiros>) => {
      setProposta((prev) => ({
        ...prev,
        parametrosFinanceiros: { ...prev.parametrosFinanceiros, ...parametros },
      }));
    },
    []
  );

  const limparProposta = useCallback(() => {
    setProposta({
      nome: '',
      cliente: '',
      obra: '',
      dataElaboracao: new Date(),
      maoDeObra: [],
      hospedagens: [],
      transportes: [],
      materiais: [],
      parametrosFinanceiros: {
        bdi: 0.20,
        margemLucro: 0.15,
        taxaImpostos: 0.165,
        contingencia: 0.05,
        encargosSociais: 0.70,
        beneficios: 0.12,
        fatorProdutividade: 1.08,
      },
      status: 'rascunho',
    });
  }, []);

  // ============================================================================
  // PERSISTÊNCIA NO SUPABASE
  // ============================================================================

  /**
   * Salva ou atualiza a proposta no Supabase
   */
  const salvarProposta = useCallback(async (): Promise<string | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Salvar proposta principal
      const propostaData = {
        user_id: user.id,
        nome: proposta.nome || 'Proposta sem nome',
        cliente: proposta.cliente || '',
        obra: proposta.obra || '',
        data_elaboracao: proposta.dataElaboracao.toISOString().split('T')[0],
        status: proposta.status,
        observacoes: proposta.observacoes,
      };

      let propostaIdFinal = proposta.id;

      if (proposta.id) {
        // Atualizar existente
        const { error: updateError } = await supabase
          .from('formacao_preco_propostas')
          .update(propostaData)
          .eq('id', proposta.id);

        if (updateError) throw updateError;
      } else {
        // Criar nova
        const { data: novaProposta, error: insertError } = await supabase
          .from('formacao_preco_propostas')
          .insert([propostaData])
          .select()
          .single();

        if (insertError) throw insertError;
        propostaIdFinal = novaProposta.id;
        setProposta(prev => ({ ...prev, id: propostaIdFinal }));
      }

      if (!propostaIdFinal) throw new Error('ID da proposta não encontrado');

      // 2. Salvar parâmetros financeiros
      const { error: paramError } = await supabase
        .from('formacao_preco_parametros')
        .upsert({
          proposta_id: propostaIdFinal,
          bdi: proposta.parametrosFinanceiros.bdi,
          margem_lucro: proposta.parametrosFinanceiros.margemLucro,
          taxa_impostos: proposta.parametrosFinanceiros.taxaImpostos,
          contingencia: proposta.parametrosFinanceiros.contingencia,
          encargos_sociais: proposta.parametrosFinanceiros.encargosSociais,
          beneficios: proposta.parametrosFinanceiros.beneficios,
          fator_produtividade: proposta.parametrosFinanceiros.fatorProdutividade,
        });

      if (paramError) throw paramError;

      // 3. Deletar itens antigos e inserir novos
      await supabase.from('formacao_preco_mao_de_obra').delete().eq('proposta_id', propostaIdFinal);
      await supabase.from('formacao_preco_hospedagens').delete().eq('proposta_id', propostaIdFinal);
      await supabase.from('formacao_preco_transportes').delete().eq('proposta_id', propostaIdFinal);
      await supabase.from('formacao_preco_materiais').delete().eq('proposta_id', propostaIdFinal);

      // 4. Inserir mão de obra
      if (proposta.maoDeObra.length > 0) {
        const maoDeObraData = proposta.maoDeObra.map(item => ({
          proposta_id: propostaIdFinal,
          user_id: user.id,
          cargo: item.cargo,
          valor_diaria: item.valorDiaria,
          qtd_pessoas: item.qtdPessoas,
          dias_na_obra: item.diasNaObra,
          horas_normais: item.horasNormais,
          horas_extras_50: item.horasExtras50,
          horas_extras_100: item.horasExtras100,
        }));

        const { error: maoObraError } = await supabase
          .from('formacao_preco_mao_de_obra')
          .insert(maoDeObraData);

        if (maoObraError) throw maoObraError;
      }

      // 5. Inserir hospedagens
      if (proposta.hospedagens.length > 0) {
        const hospedagensData = proposta.hospedagens.map(item => ({
          proposta_id: propostaIdFinal,
          user_id: user.id,
          descricao: item.descricao,
          valor_diaria: item.valorDiaria,
          dias_viajados: item.diasViajados,
          qtd_pessoas: item.qtdPessoas,
        }));

        const { error: hospError } = await supabase
          .from('formacao_preco_hospedagens')
          .insert(hospedagensData);

        if (hospError) throw hospError;
      }

      // 6. Inserir transportes
      if (proposta.transportes.length > 0) {
        const transportesData = proposta.transportes.map(item => ({
          proposta_id: propostaIdFinal,
          user_id: user.id,
          descricao: item.descricao,
          distancia_km: item.distanciaKm,
          consumo_km_por_litro: item.consumoKmPorLitro,
          preco_combustivel: item.precoCombustivel,
          pedagios: item.pedagios,
          qtd_viagens: item.qtdViagens,
        }));

        const { error: transError } = await supabase
          .from('formacao_preco_transportes')
          .insert(transportesData);

        if (transError) throw transError;
      }

      // 7. Inserir materiais
      if (proposta.materiais.length > 0) {
        const materiaisData = proposta.materiais.map(item => ({
          proposta_id: propostaIdFinal,
          user_id: user.id,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: item.quantidade,
          preco_unitario: item.precoUnitario,
          categoria: item.categoria,
        }));

        const { error: matError } = await supabase
          .from('formacao_preco_materiais')
          .insert(materiaisData);

        if (matError) throw matError;
      }

      setLoading(false);
      return propostaIdFinal;
    } catch (err) {
      console.error('Erro ao salvar proposta:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLoading(false);
      return null;
    }
  }, [proposta, user]);

  /**
   * Carrega uma proposta específica do Supabase
   */
  const carregarProposta = useCallback(async (id: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Carregar proposta principal
      const { data: propostaData, error: propostaError } = await supabase
        .from('formacao_preco_propostas')
        .select('*')
        .eq('id', id)
        .single();

      if (propostaError) throw propostaError;

      // 2. Carregar parâmetros
      const { data: parametros, error: paramError } = await supabase
        .from('formacao_preco_parametros')
        .select('*')
        .eq('proposta_id', id)
        .single();

      if (paramError && paramError.code !== 'PGRST116') throw paramError;

      // 3. Carregar mão de obra
      const { data: maoDeObra, error: maoError } = await supabase
        .from('formacao_preco_mao_de_obra')
        .select('*')
        .eq('proposta_id', id);

      if (maoError) throw maoError;

      // 4. Carregar hospedagens
      const { data: hospedagens, error: hospError } = await supabase
        .from('formacao_preco_hospedagens')
        .select('*')
        .eq('proposta_id', id);

      if (hospError) throw hospError;

      // 5. Carregar transportes
      const { data: transportes, error: transError } = await supabase
        .from('formacao_preco_transportes')
        .select('*')
        .eq('proposta_id', id);

      if (transError) throw transError;

      // 6. Carregar materiais
      const { data: materiais, error: matError } = await supabase
        .from('formacao_preco_materiais')
        .select('*')
        .eq('proposta_id', id);

      if (matError) throw matError;

      // Montar objeto da proposta
      setProposta({
        id: propostaData.id,
        nome: propostaData.nome,
        cliente: propostaData.cliente,
        obra: propostaData.obra,
        dataElaboracao: new Date(propostaData.data_elaboracao),
        status: propostaData.status,
        observacoes: propostaData.observacoes,
        maoDeObra: (maoDeObra || []).map(item => ({
          id: item.id,
          cargo: item.cargo,
          valorDiaria: item.valor_diaria,
          qtdPessoas: item.qtd_pessoas,
          diasNaObra: item.dias_na_obra,
          horasNormais: item.horas_normais,
          horasExtras50: item.horas_extras_50,
          horasExtras100: item.horas_extras_100,
        })),
        hospedagens: (hospedagens || []).map(item => ({
          id: item.id,
          descricao: item.descricao,
          valorDiaria: item.valor_diaria,
          diasViajados: item.dias_viajados,
          qtdPessoas: item.qtd_pessoas ?? 1,
        })),
        transportes: (transportes || []).map(item => ({
          id: item.id,
          descricao: item.descricao,
          distanciaKm: item.distancia_km,
          consumoKmPorLitro: item.consumo_km_por_litro,
          precoCombustivel: item.preco_combustivel,
          pedagios: item.pedagios,
          qtdViagens: item.qtd_viagens,
        })),
        materiais: (materiais || []).map(item => ({
          id: item.id,
          descricao: item.descricao,
          unidade: item.unidade,
          quantidade: item.quantidade,
          precoUnitario: item.preco_unitario,
          categoria: item.categoria,
        })),
        parametrosFinanceiros: parametros ? {
          bdi: parametros.bdi,
          margemLucro: parametros.margem_lucro,
          taxaImpostos: parametros.taxa_impostos,
          contingencia: parametros.contingencia,
          encargosSociais: parametros.encargos_sociais ?? 0.70,
          beneficios: parametros.beneficios ?? 0.12,
          fatorProdutividade: parametros.fator_produtividade ?? 1.08,
        } : {
          bdi: 0.20,
          margemLucro: 0.15,
          taxaImpostos: 0.165,
          contingencia: 0.05,
          encargosSociais: 0.70,
          beneficios: 0.12,
          fatorProdutividade: 1.08,
        },
      });

      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar proposta:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLoading(false);
    }
  }, [user]);

  /**
   * Lista todas as propostas do usuário
   */
  const listarPropostas = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('formacao_preco_propostas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const propostasCarregadas = (data || []).map(item => ({
        id: item.id,
        nome: item.nome,
        cliente: item.cliente,
        obra: item.obra,
        dataElaboracao: new Date(item.data_elaboracao),
        status: item.status,
        observacoes: item.observacoes,
        maoDeObra: [],
        hospedagens: [],
        transportes: [],
        materiais: [],
        parametrosFinanceiros: {
          bdi: 0.20,
          margemLucro: 0.15,
          taxaImpostos: 0.165,
          contingencia: 0.05,
          encargosSociais: 0.70,
          beneficios: 0.12,
          fatorProdutividade: 1.08,
        },
      }));

      setPropostas(propostasCarregadas);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao listar propostas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLoading(false);
    }
  }, [user]);

  /**
   * Deleta uma proposta
   */
  const deletarProposta = useCallback(async (id: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('formacao_preco_propostas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPropostas(prev => prev.filter(p => p.id !== id));
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Erro ao deletar proposta:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLoading(false);
      return false;
    }
  }, [user]);

  // Carrega proposta específica ao montar, se propostaId for fornecido
  useEffect(() => {
    if (propostaId && user) {
      carregarProposta(propostaId);
    }
  }, [propostaId, user, carregarProposta]);

  return {
    // Estado
    proposta,
    setProposta,
    loading,
    error,
    propostas,

    // Cálculos
    custosTotalMaoDeObra,
    totalMaoDeObra,
    custoLogistica,
    totalMateriais,
    totalEquipamentos,
    totalServicosTerceiros,
    resumoFinanceiro,

    // Métodos de manipulação
    adicionarCargo,
    removerCargo,
    atualizarCargo,
    adicionarHospedagem,
    adicionarTransporte,
    adicionarMaterial,
    atualizarParametrosFinanceiros,
    limparProposta,

    // Persistência
    salvarProposta,
    carregarProposta,
    listarPropostas,
    deletarProposta,
  };
};
