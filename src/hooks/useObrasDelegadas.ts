import { useState, useCallback } from 'react';
import supabase from '../lib/supabaseClient';
import { useAuth } from '../contexts';
import { registrarNotificacao } from '../utils/notificationLogger';
import {
  ObraVerba,
  ObraVerbaInsert,
  GastoDelegado,
  GastoDelegadoInsert,
} from '../types/delegacao';
import { Obra } from '../types/obras';

interface Socio {
  id: string;
  nome: string;
  email?: string;
  avatar_url?: string;
}

export const useObrasDelegadas = () => {
  const { user, profile } = useAuth(); // Usa o user e profile do AuthContext
  const [verbas, setVerbas] = useState<ObraVerba[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ID do usuário atual (vem do AuthContext)
  const currentUserId = user?.id || null;
  // ID da entidade associada ao usuário (para sócios executores)
  const currentEntidadeId = profile?.entidade_id || null;
  // Nome do usuário atual
  const currentUserName = profile?.nome || user?.email || 'Usuário';

  // Carregar todas as verbas (para Admin)
  const loadVerbas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar verbas com obra
      const { data: verbasData, error: fetchError } = await supabase
        .from('obras_verbas')
        .select('*, obra:obras(id, nome, status)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Buscar perfis dos delegados
      const delegadoIds = verbasData?.map(v => v.delegado_para_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nome_completo, email, avatar_url')
        .in('id', delegadoIds);

      // Combinar os dados
      const verbasComDelegados = (verbasData || []).map(verba => ({
        ...verba,
        delegado_para: profilesData?.find(p => p.id === verba.delegado_para_id),
      }));

      console.log('Verbas carregadas:', verbasComDelegados);

      setVerbas(verbasComDelegados as ObraVerba[]);
    } catch (err) {
      console.error('Erro ao carregar verbas:', err);
      setError('Erro ao carregar verbas delegadas');
      setVerbas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar verbas do executor atual (Minhas Obras)
  const loadMinhasVerbas = useCallback(async () => {
    // Usa apenas o user_id do usuário autenticado
    if (!currentUserId) {
      console.log('Usuário não autenticado');
      return;
    }

    console.log('Buscando verbas para usuário:', currentUserId);

    setLoading(true);
    setError(null);
    try {
      // Buscar verbas com obra
      const { data: verbasData, error: fetchError } = await supabase
        .from('obras_verbas')
        .select('*, obra:obras(id, nome, status)')
        .eq('delegado_para_id', currentUserId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Buscar perfil do delegado (usuário atual)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, nome_completo, email, avatar_url')
        .eq('id', currentUserId)
        .single();

      // Combinar os dados
      const verbasComDelegado = (verbasData || []).map(verba => ({
        ...verba,
        delegado_para: profileData,
      }));

      console.log('Resultado verbas:', verbasComDelegado);

      setVerbas(verbasComDelegado as ObraVerba[]);
    } catch (err) {
      console.error('Erro ao carregar minhas verbas:', err);
      setError('Erro ao carregar suas obras delegadas');
    } finally {
      setLoading(false);
    }
  }, [currentEntidadeId, currentUserId]);

  // Carregar obras sem delegação (para modal de delegar)
  const loadObras = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('obras')
        .select('*')
        .in('status', ['aprovada', 'em_andamento'])
        .order('nome');

      if (fetchError) throw fetchError;
      setObras((data as Obra[]) || []);
    } catch (err) {
      console.error('Erro ao carregar obras:', err);
      setObras([]);
    }
  }, []);

  // Carregar usuários cadastrados no sistema (para select de delegados)
  const loadSocios = useCallback(async () => {
    try {
      // Buscar TODOS os usuários para debug
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, nome_completo, email, avatar_url, role');

      console.log('Query profiles - data:', data, 'error:', fetchError);
      
      if (fetchError) {
        console.error('Erro ao buscar profiles:', fetchError);
        throw fetchError;
      }
      
      console.log('Todos os usuários encontrados (sem filtro):', data);
      
      // Mapear para o formato esperado
      const usuarios = (data || []).map(user => ({
        id: user.id,
        nome: user.nome_completo || user.email?.split('@')[0] || 'Usuário',
        email: user.email,
        avatar_url: user.avatar_url,
      }));
      
      console.log('Usuários mapeados:', usuarios);
      
      setSocios(usuarios as Socio[]);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setSocios([]);
    }
  }, []);

  // Criar delegação (pendente_envio)
  const criarDelegacao = async (data: ObraVerbaInsert) => {
    try {
      const { data: newVerba, error: insertError } = await supabase
        .from('obras_verbas')
        .insert([{ ...data, status: 'pendente_envio' }])
        .select()
        .single();

      if (insertError) throw insertError;

      await loadVerbas();
      return { success: true, data: newVerba };
    } catch (err) {
      console.error('Erro ao criar delegação:', err);
      return { success: false, error: err };
    }
  };

  // Enviar verba (aprova saída de caixa)
  const enviarVerba = async (verbaId: string) => {
    console.log('Enviando verba:', verbaId);
    try {
      const verba = verbas.find((v) => v.id === verbaId);
      if (!verba) throw new Error('Verba não encontrada');

      const userId = user?.id;
      const userNome = profile?.nome_completo || user?.email?.split('@')[0] || 'Usuário';

      // 1. Criar transação de despesa no caixa (vinculada à obra)
      const hoje = new Date().toISOString().split('T')[0];
      const transacaoData = {
        tipo: 'despesa',
        status: 'pago', // Status pago para aparecer no caixa como saída realizada
        categoria: 'Envio de Verba',
        descricao: `Verba delegada para ${verba.delegado_para?.nome_completo || 'executor'} - ${verba.obra?.nome || 'Obra'}`,
        valor: verba.valor_delegado,
        data_vencimento: hoje, // Necessário para aparecer no filtro do mês
        data_pagamento: hoje,
        obra_id: verba.obra_id, // Vincular à obra para aparecer nos custos da obra
        user_id: userId,
        user_nome: userNome,
      };
      
      console.log('Criando transação:', transacaoData);
      
      const { data: transacao, error: transacaoError } = await supabase
        .from('transacoes')
        .insert([transacaoData])
        .select()
        .single();

      console.log('Resultado transação:', { transacao, transacaoError });

      if (transacaoError) throw transacaoError;

      await registrarNotificacao({
        tipo: 'financeiro',
        titulo: 'Movimentação financeira',
        mensagem: `Envio de verba: R$ ${verba.valor_delegado.toFixed(2)} • por ${userNome}`,
        link: '/financeiro',
        metadata: { transacao_id: transacao?.id, obra_id: verba.obra_id },
      });

      // 2. Atualizar status da verba para 'ativa'
      const { error: updateError } = await supabase
        .from('obras_verbas')
        .update({ status: 'ativa' })
        .eq('id', verbaId);

      console.log('Resultado update verba:', { updateError });

      if (updateError) throw updateError;

      await loadVerbas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao enviar verba:', err);
      return { success: false, error: err };
    }
  };

  // Carregar gastos de uma verba específica
  const loadGastos = async (verbaId: string): Promise<GastoDelegado[]> => {
    try {
      // Buscar gastos
      const { data, error: fetchError } = await supabase
        .from('gastos_delegados')
        .select('*')
        .eq('verba_id', verbaId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Se não há gastos, retornar array vazio
      if (!data || data.length === 0) return [];

      // Buscar informações dos funcionários (se houver entidade_id)
      const gastosComEntidade = data.filter(g => g.entidade_id);
      const entidadeIds = [...new Set(gastosComEntidade.map(g => g.entidade_id))];

      let entidadesMap = new Map();

      if (entidadeIds.length > 0) {
        const { data: entidades } = await supabase
          .from('entidades')
          .select('id, nome')
          .in('id', entidadeIds);

        if (entidades) {
          entidades.forEach(ent => entidadesMap.set(ent.id, ent));
        }
      }

      // Adicionar informações do funcionário aos gastos
      const gastosComDetalhes = data.map(gasto => ({
        ...gasto,
        funcionario_nome: gasto.entidade_id ? entidadesMap.get(gasto.entidade_id)?.nome : undefined,
      }));

      return (gastosComDetalhes as GastoDelegado[]) || [];
    } catch (err) {
      console.error('Erro ao carregar gastos:', err);
      return [];
    }
  };

  // Registrar gasto (executor)
  const registrarGasto = async (data: GastoDelegadoInsert) => {
    const now = new Date();
    const dataComRastreamento = {
      ...data,
      registrado_por_id: currentUserId,
      registrado_por_nome: currentUserName,
      // Usar data_registro do formulário ou hoje como fallback
      data_registro: data.data_registro || now.toISOString().split('T')[0], // YYYY-MM-DD
      hora_registro: now.toTimeString().slice(0, 5), // HH:MM
    };
    
    console.log('Registrando gasto:', dataComRastreamento);
    try {
      const { data: newGasto, error: insertError } = await supabase
        .from('gastos_delegados')
        .insert([dataComRastreamento])
        .select()
        .single();

      console.log('Resultado insert gasto:', { newGasto, insertError });

      if (insertError) throw insertError;
      return { success: true, data: newGasto };
    } catch (err) {
      console.error('Erro ao registrar gasto:', err);
      return { success: false, error: err };
    }
  };

  // Finalizar prestação de contas (executor)
  const finalizarPrestacao = async (verbaId: string) => {
    console.log('Finalizando prestação:', verbaId);
    try {
      const { error: updateError } = await supabase
        .from('obras_verbas')
        .update({ status: 'prestacao_pendente' })
        .eq('id', verbaId);

      console.log('Resultado update verba:', { updateError });

      if (updateError) throw updateError;

      await loadMinhasVerbas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao finalizar prestação:', err);
      return { success: false, error: err };
    }
  };

  // Editar gasto
  const editarGasto = async (gastoId: string, data: Partial<GastoDelegadoInsert>) => {
    console.log('Editando gasto:', gastoId, data);
    try {
      const { data: updatedGasto, error: updateError } = await supabase
        .from('gastos_delegados')
        .update(data)
        .eq('id', gastoId)
        .select()
        .single();

      console.log('Resultado update gasto:', { updatedGasto, updateError });

      if (updateError) throw updateError;
      return { success: true, data: updatedGasto };
    } catch (err) {
      console.error('Erro ao editar gasto:', err);
      return { success: false, error: err };
    }
  };

  // Excluir gasto
  const excluirGasto = async (gastoId: string) => {
    console.log('Excluindo gasto:', gastoId);
    try {
      const { error: deleteError } = await supabase
        .from('gastos_delegados')
        .delete()
        .eq('id', gastoId);

      console.log('Resultado delete gasto:', { deleteError });

      if (deleteError) throw deleteError;
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir gasto:', err);
      return { success: false, error: err };
    }
  };

  // Adicionar mais verba a uma delegação existente
  const adicionarVerba = async (verbaId: string, valorAdicional: number) => {
    console.log('Adicionando verba:', verbaId, valorAdicional);
    try {
      // Buscar verba atual
      const verba = verbas.find(v => v.id === verbaId);
      if (!verba) throw new Error('Verba não encontrada');

      const userId = user?.id;
      const userNome = profile?.nome_completo || user?.email?.split('@')[0] || 'Usuário';

      // 1. Criar transação de despesa no caixa para o valor adicional
      const hoje = new Date().toISOString().split('T')[0];
      const transacaoData = {
        tipo: 'despesa',
        status: 'pago',
        categoria: 'Envio de Verba',
        descricao: `Verba adicional para ${verba.delegado_para?.nome_completo || 'executor'} - ${verba.obra?.nome || 'Obra'}`,
        valor: valorAdicional,
        data_vencimento: hoje, // Necessário para aparecer no filtro do mês
        data_pagamento: hoje,
        obra_id: verba.obra_id,
        user_id: userId,
        user_nome: userNome,
      };
      
      console.log('Criando transação adicional:', transacaoData);
      
      const { data: transacao, error: transacaoError } = await supabase
        .from('transacoes')
        .insert([transacaoData])
        .select()
        .single();

      console.log('Resultado transação adicional:', { transacao, transacaoError });

      if (transacaoError) throw transacaoError;

      await registrarNotificacao({
        tipo: 'financeiro',
        titulo: 'Movimentação financeira',
        mensagem: `Verba adicional: R$ ${valorAdicional.toFixed(2)} • por ${userNome}`,
        link: '/financeiro',
        metadata: { transacao_id: transacao?.id, obra_id: verba.obra_id },
      });

      // 2. Atualizar valor da verba
      const novoValor = verba.valor_delegado + valorAdicional;

      const { error: updateError } = await supabase
        .from('obras_verbas')
        .update({ valor_delegado: novoValor })
        .eq('id', verbaId);

      if (updateError) throw updateError;

      await loadVerbas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao adicionar verba:', err);
      return { success: false, error: err };
    }
  };

  // Aprovar gasto (admin)
  const aprovarGasto = async (gastoId: string, _verbaId: string, obraId: string) => {
    try {
      console.log('[aprovarGasto] Iniciando aprovação de gasto:', { gastoId, obraId });
      
      // Buscar gasto completo com informações do executor
      const { data: gasto, error: gastoError } = await supabase
        .from('gastos_delegados')
        .select('*')
        .eq('id', gastoId)
        .single();

      if (gastoError) {
        console.error('[aprovarGasto] Erro ao buscar gasto:', gastoError);
        throw gastoError;
      }
      
      console.log('[aprovarGasto] Gasto encontrado:', gasto);

      // Obter informações do admin que está aprovando
      let user_id = currentUserId;
      let user_nome = currentUserName;
      
      // Fallback: se não temos as informações do usuário no contexto, buscar
      if (!user_id) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('[aprovarGasto] Erro de autenticação:', authError);
          throw new Error('Erro de autenticação. Faça login novamente.');
        }
        
        if (!user) {
          throw new Error('Usuário não autenticado');
        }
        
        user_id = user.id;
        
        // Buscar nome do admin
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('nome_completo, email')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('[aprovarGasto] Erro ao buscar perfil, usando email:', profileError);
        }
        
        user_nome = profileData?.nome_completo || profileData?.email?.split('@')[0] || 'Admin';
      }

      // Buscar informações da obra para incluir na descrição
      const { data: obraData } = await supabase
        .from('obras')
        .select('nome')
        .eq('id', obraId)
        .maybeSingle();

      const obraNome = obraData?.nome || 'Obra';

      // Determinar a data: usar data_registro se existir, senão usar data de criação
      let dataTransacao = gasto.data_registro || new Date().toISOString().split('T')[0];
      
      // Converter para formato ISO mantendo a data local (sem perder dia por causa de UTC)
      // Usamos a data diretamente no formato YYYY-MM-DD sem converter para UTC
      const dataISO = dataTransacao;

      // Preparar descrição detalhada
      let descricaoCompleta = gasto.descricao;
      
      // Se for diária de funcionário (tem entidade_id), adicionar informação da obra
      if (gasto.entidade_id) {
        // Buscar informações do funcionário
        const { data: funcionarioData } = await supabase
          .from('entidades')
          .select('nome')
          .eq('id', gasto.entidade_id)
          .maybeSingle();

        const funcionarioNome = funcionarioData?.nome || 'Funcionário';
        descricaoCompleta = `${descricaoCompleta} | Funcionário: ${funcionarioNome} | Obra: ${obraNome}`;
      }

      // Se tem informações do executor que registrou, adicionar ao histórico
      if (gasto.registrado_por_nome) {
        descricaoCompleta += ` | Registrado por: ${gasto.registrado_por_nome}`;
      }

      // 1. Criar transação na obra
      const transacaoData: any = {
        user_id: user_id,
        user_nome: user_nome,
        tipo: 'despesa',
        status: 'pago',
        categoria: gasto.categoria,
        descricao: descricaoCompleta,
        valor: gasto.valor,
        data_vencimento: dataISO,
        data_pagamento: dataISO,
        obra_id: obraId,
        created_at: new Date().toISOString(),
      };

      // Se é diária de funcionário, vincular à entidade
      if (gasto.entidade_id) {
        transacaoData.entidade_id = gasto.entidade_id;
      }

      console.log('[aprovarGasto] Criando transação:', transacaoData);

      const { data: transacaoCriada, error: transacaoError } = await supabase
        .from('transacoes')
        .insert([transacaoData])
        .select()
        .single();

      if (transacaoError) {
        console.error('[aprovarGasto] Erro ao criar transação:', transacaoError);
        throw transacaoError;
      }
      
      console.log('[aprovarGasto] Transação criada:', transacaoCriada);

      // 2. Atualizar o gasto delegado: marcar como aprovado e vincular à transação
      const { error: updateError } = await supabase
        .from('gastos_delegados')
        .update({
          aprovado: true,
          aprovado_em: new Date().toISOString(),
          transacao_obra_id: transacaoCriada.id,
        })
        .eq('id', gastoId);

      if (updateError) {
        console.error('[aprovarGasto] Erro ao atualizar gasto:', updateError);
        throw updateError;
      }

      console.log(`[aprovarGasto] Gasto aprovado com sucesso:`, {
        gastoId,
        transacaoId: transacaoCriada.id,
        obraId,
        entidadeId: gasto.entidade_id,
        valor: gasto.valor,
        categoria: gasto.categoria,
      });

      return { success: true };
    } catch (err) {
      console.error('[aprovarGasto] Erro ao aprovar gasto:', err);
      return { success: false, error: err };
    }
  };

  // Estornar saldo (admin)
  const estornarSaldo = async (verbaId: string, valorEstorno: number, obraId: string) => {
    try {
      console.log('[estornarSaldo] Iniciando estorno:', { verbaId, valorEstorno, obraId });
      
      const verba = verbas.find((v) => v.id === verbaId);
      if (!verba) throw new Error('Verba não encontrada');

      const hoje = new Date().toISOString().split('T')[0];
      const dataISO = `${hoje}T12:00:00.000Z`;

      // Obter informações do usuário
      let user_id = currentUserId;
      let user_nome = currentUserName;
      
      if (!user_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          user_id = user.id;
          const { data: profileData } = await supabase
            .from('profiles')
            .select('nome_completo, email')
            .eq('id', user.id)
            .maybeSingle();
          user_nome = profileData?.nome_completo || profileData?.email?.split('@')[0] || 'Admin';
        }
      }

      // Buscar nome da obra
      const { data: obraData } = await supabase
        .from('obras')
        .select('nome')
        .eq('id', obraId)
        .maybeSingle();

      const obraNome = obraData?.nome || 'Obra';

      // APENAS criar transação de receita na obra (reduz o custo da obra)
      // Isso já faz o valor não utilizado "voltar" corretamente
      const { error: obraTransacaoError } = await supabase
        .from('transacoes')
        .insert([{
          user_id: user_id,
          user_nome: user_nome,
          tipo: 'receita', // Receita na obra = reduz custo
          status: 'pago',
          categoria: 'Estorno de Verba',
          descricao: `Saldo não utilizado - Verba delegada em ${verba.delegado_para?.nome_completo || 'Executor'} | Obra: ${obraNome}`,
          valor: valorEstorno,
          data_vencimento: dataISO,
          data_pagamento: dataISO,
          obra_id: obraId,
          created_at: new Date().toISOString(),
        }]);

      if (obraTransacaoError) {
        console.error('[estornarSaldo] Erro ao criar transação:', obraTransacaoError);
        throw obraTransacaoError;
      }

      console.log('[estornarSaldo] Transação de estorno criada com sucesso');

      // Finalizar verba
      const { error: updateError } = await supabase
        .from('obras_verbas')
        .update({ status: 'finalizada' })
        .eq('id', verbaId);

      if (updateError) {
        console.error('[estornarSaldo] Erro ao finalizar verba:', updateError);
        throw updateError;
      }

      console.log('[estornarSaldo] Verba finalizada com sucesso');

      await loadVerbas();
      return { success: true };
    } catch (err) {
      console.error('[estornarSaldo] Erro ao estornar saldo:', err);
      return { success: false, error: err };
    }
  };

  // Aprovar tudo e finalizar
  const finalizarAuditoria = async (verbaId: string, obraId: string) => {
    try {
      const gastos = await loadGastos(verbaId);

      // Calcular saldo ANTES de aprovar os gastos
      const verba = verbas.find((v) => v.id === verbaId);
      const gastoAcumulado = gastos.reduce((acc, g) => acc + g.valor, 0);
      const saldoDisponivel = verba ? verba.valor_delegado - gastoAcumulado : 0;

      // Aprovar todos os gastos (converte em transação e exclui)
      for (const gasto of gastos) {
        await aprovarGasto(gasto.id, verbaId, obraId);
      }

      // Estornar saldo se houver
      if (verba && saldoDisponivel > 0) {
        await estornarSaldo(verbaId, saldoDisponivel, obraId);
      } else {
        // Apenas finalizar
        await supabase
          .from('obras_verbas')
          .update({ status: 'finalizada' })
          .eq('id', verbaId);
      }

      await loadVerbas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao finalizar auditoria:', err);
      return { success: false, error: err };
    }
  };

  // Excluir delegação (apenas se status = pendente_envio)
  const excluirDelegacao = async (verbaId: string) => {
    try {
      const verba = verbas.find(v => v.id === verbaId);
      
      if (!verba) {
        throw new Error('Delegação não encontrada');
      }

      // Só permite excluir se ainda não foi enviada
      if (verba.status !== 'pendente_envio') {
        throw new Error('Apenas delegações pendentes podem ser excluídas');
      }

      const { error: deleteError } = await supabase
        .from('obras_verbas')
        .delete()
        .eq('id', verbaId);

      if (deleteError) throw deleteError;

      await loadVerbas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir delegação:', err);
      return { success: false, error: err };
    }
  };

  return {
    verbas,
    obras,
    socios,
    loading,
    error,
    currentUserId,
    loadVerbas,
    loadMinhasVerbas,
    loadObras,
    loadSocios,
    loadGastos,
    criarDelegacao,
    enviarVerba,
    excluirDelegacao,
    registrarGasto,
    editarGasto,
    excluirGasto,
    adicionarVerba,
    finalizarPrestacao,
    aprovarGasto,
    estornarSaldo,
    finalizarAuditoria,
  };
};
