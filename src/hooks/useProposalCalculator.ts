import { useCallback, useMemo } from 'react';
import {
  CONSTANTES_CALCULO,
  CargoMaoDeObra,
  CustoLogistica,
  CustoMaoDeObra,
  HospedagemAlimentacao,
  PropostaFormacaoPreco,
  ResumoFinanceiro,
  Transporte,
} from '../types/formacao-preco';

/**
 * useProposalCalculator
 *
 * Hook de cálculo (puro): recebe os inputs da proposta e retorna os totais
 * em tempo real via `useMemo`.
 */
export const useProposalCalculator = (proposta: Pick<
  PropostaFormacaoPreco,
  'maoDeObra' | 'hospedagens' | 'transportes' | 'materiais' | 'parametrosFinanceiros'
>) => {
  // ============================================================================
  // CÁLCULOS DE MÃO DE OBRA
  // ============================================================================

  /**
   * Custo/hora: ((Diária * (1 + Encargos + Benefícios)) / 8) × Fator Produtividade
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

  const calcularCustoCargo = useCallback(
    (cargo: CargoMaoDeObra): CustoMaoDeObra => {
      const { ADICIONAL_HE_50, ADICIONAL_HE_100 } = CONSTANTES_CALCULO;
      const { encargosSociais, beneficios, fatorProdutividade } = proposta.parametrosFinanceiros;
      const fatorAjustado = Math.max(1, fatorProdutividade || 1);

      const encargos = cargo.valorDiaria * encargosSociais;
      const beneficiosValor = cargo.valorDiaria * beneficios;
      const diariaComEncargos = cargo.valorDiaria + encargos;
      const diariaComEncargosBeneficios = cargo.valorDiaria + encargos + beneficiosValor;
      const custoHora = calcularCustoHora(
        cargo.valorDiaria,
        encargosSociais,
        beneficios,
        fatorAjustado
      );

      const diasNaObra = Math.max(0, cargo.diasNaObra || 0);
      const custoBaseDias = diariaComEncargosBeneficios * diasNaObra * cargo.qtdPessoas * fatorAjustado;

      const horasExtras50 = Math.max(0, cargo.horasExtras50 || 0);
      const horasExtras100 = Math.max(0, cargo.horasExtras100 || 0);

      const custoHorasExtras50 =
        custoHora * ADICIONAL_HE_50 * horasExtras50 * cargo.qtdPessoas;
      const custoHorasExtras100 =
        custoHora * ADICIONAL_HE_100 * horasExtras100 * cargo.qtdPessoas;

      const custoHorasNormais = custoBaseDias;
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
    },
    [calcularCustoHora, proposta.parametrosFinanceiros]
  );

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
   * Hospedagem/Alimentação: (Dias Viajados * Valor Diária) * Qtd Pessoas
   */
  const calcularHospedagem = useCallback((hosp: HospedagemAlimentacao): number => {
    return hosp.valorDiaria * hosp.diasViajados * hosp.qtdPessoas;
  }, []);

  /**
   * Transporte: ((Distância/Consumo) * Preço Combustível + Pedágios) * Qtd Viagens
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
      if (mat.categoria === 'material') return acc + mat.quantidade * mat.precoUnitario;
      return acc;
    }, 0);
  }, [proposta.materiais]);

  const totalEquipamentos = useMemo(() => {
    return proposta.materiais.reduce((acc, mat) => {
      if (mat.categoria === 'equipamento') return acc + mat.quantidade * mat.precoUnitario;
      return acc;
    }, 0);
  }, [proposta.materiais]);

  const totalServicosTerceiros = useMemo(() => {
    return proposta.materiais.reduce((acc, mat) => {
      if (mat.categoria === 'servico_terceiro') return acc + mat.quantidade * mat.precoUnitario;
      return acc;
    }, 0);
  }, [proposta.materiais]);

  // ============================================================================
  // FECHAMENTO FINANCEIRO
  // ============================================================================

  const resumoFinanceiro = useMemo((): ResumoFinanceiro => {
    const { bdi, margemLucro, taxaImpostos, contingencia, fatorProdutividade } = proposta.parametrosFinanceiros;

    const custoMaoDeObra = totalMaoDeObra;
    const custoLogisticaTotal = custoLogistica.totalLogistica;
    const custoMateriais = totalMateriais + totalEquipamentos + totalServicosTerceiros;
    const subtotalCustosDirectos = custoMaoDeObra + custoLogisticaTotal + custoMateriais;

    const bdiValor = subtotalCustosDirectos * bdi;
    const contingenciaValor = subtotalCustosDirectos * contingencia;
    const subtotalCustosIndiretos = bdiValor + contingenciaValor;

    const custoTotal = subtotalCustosDirectos + subtotalCustosIndiretos;

    const margemLucroValor = custoTotal * margemLucro;
    const precoAnteImpostos = custoTotal + margemLucroValor;

    // Gross Up: Preço Final = Preço Ante Impostos ÷ (1 - Taxa Impostos)
    const precoFinalVenda = precoAnteImpostos / (1 - taxaImpostos);
    const impostosValor = precoFinalVenda - precoAnteImpostos;

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
    proposta.parametrosFinanceiros,
    totalMaoDeObra,
    custoLogistica.totalLogistica,
    totalMateriais,
    totalEquipamentos,
    totalServicosTerceiros,
    proposta.maoDeObra,
  ]);

  return {
    custosTotalMaoDeObra,
    totalMaoDeObra,
    custoLogistica,
    totalMateriais,
    totalEquipamentos,
    totalServicosTerceiros,
    resumoFinanceiro,
  };
};
