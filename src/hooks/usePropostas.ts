import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';
import { Proposta, PropostaItem, PropostaStatus } from '../types/propostas';
import { registrarNotificacao } from '../utils/notificationLogger';

export const usePropostas = () => {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(false); // Começa como false
  const [error, setError] = useState<string | null>(null);

  // Buscar próximo número sequencial de proposta
  const getProximoNumero = useCallback(async (): Promise<number> => {
    try {
      // Tenta buscar da tabela de sequência primeiro
      const { data: sequencia } = await supabase
        .from('propostas_sequencia')
        .select('ultimo_numero')
        .eq('id', 1)
        .single();

      if (sequencia?.ultimo_numero !== undefined) {
        return sequencia.ultimo_numero + 1;
      }

      // Se não existir tabela de sequência, buscar último número das propostas
      const { data: ultimaProposta } = await supabase
        .from('propostas')
        .select('numero_sequencial')
        .order('numero_sequencial', { ascending: false })
        .limit(1)
        .single();

      return (ultimaProposta?.numero_sequencial || 0) + 1;
    } catch {
      // Em caso de erro, retorna número baseado em timestamp
      return Math.floor(Date.now() / 1000) % 9999;
    }
  }, []);

  // Incrementar número sequencial na tabela
  const incrementarNumeroSequencial = useCallback(async (novoNumero: number): Promise<void> => {
    try {
      await supabase
        .from('propostas_sequencia')
        .upsert({ id: 1, ultimo_numero: novoNumero });
    } catch (err) {
      console.error('Erro ao incrementar sequência:', err);
    }
  }, []);

  // Carregar propostas
  const loadPropostas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('propostas')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Erro fetch propostas:', fetchError);
        throw fetchError;
      }
      setPropostas(data || []);
    } catch (err) {
      console.error('Erro ao carregar propostas:', err);
      setPropostas([]);
      setError(
        'Não foi possível carregar propostas do banco. ' +
        'Verifique as permissões (RLS) no Supabase para as tabelas propostas/proposta_itens.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar proposta por ID
  const loadPropostaById = useCallback(async (id: string): Promise<Proposta | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('propostas')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      console.error('Erro ao carregar proposta:', err);
      setError(
        'Não foi possível carregar a proposta do banco. ' +
        'Verifique as permissões (RLS) no Supabase para a tabela propostas.'
      );
      return null;
    }
  }, []);

  // Carregar itens de uma proposta
  const loadItens = useCallback(async (propostaId: string): Promise<PropostaItem[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('proposta_itens')
        .select('*')
        .eq('proposta_id', propostaId);

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
      setError(
        'Não foi possível carregar itens da proposta do banco. ' +
        'Verifique as permissões (RLS) no Supabase para a tabela proposta_itens.'
      );
      return [];
    }
  }, []);

  // Adicionar proposta
  const addProposta = async (proposta: Omit<Proposta, 'id' | 'created_at'>, itens: Omit<PropostaItem, 'id' | 'proposta_id'>[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';

      // Buscar próximo número sequencial
      const proximoNumero = await getProximoNumero();

      // Extrair apenas campos válidos da tabela propostas
      const propostaData: Record<string, unknown> = {
        numero_sequencial: proximoNumero,
        numero_revisao: 0, // Nova proposta inicia sem revisão
        cliente_nome: proposta.cliente_nome,
        descricao_servicos: proposta.descricao_servicos,
        valor_total: proposta.valor_total,
        status: proposta.status || 'rascunho',
      };

      // Campos opcionais
      if (proposta.cliente_empresa) propostaData.cliente_empresa = proposta.cliente_empresa;
      if (proposta.validade) propostaData.validade = proposta.validade;
      if (proposta.prazo_producao) propostaData.prazo_producao = proposta.prazo_producao;
      if (proposta.prazo_instalacao) propostaData.prazo_instalacao = proposta.prazo_instalacao;
      if (proposta.condicoes_pagamento) propostaData.condicoes_pagamento = proposta.condicoes_pagamento;
      if (proposta.observacoes) propostaData.observacoes = proposta.observacoes;
      if (proposta.escopo_tecnico) propostaData.escopo_tecnico = proposta.escopo_tecnico;

      const { data, error: insertError } = await supabase
        .from('propostas')
        .insert([propostaData])
        .select()
        .single();

      if (insertError) throw insertError;

      await registrarNotificacao({
        tipo: 'proposta',
        titulo: 'Proposta criada',
        mensagem: `Proposta criada para ${proposta.cliente_nome} por ${userNome}`,
        link: '/propostas',
        metadata: { proposta_id: data?.id },
      });

      // Atualizar sequência
      await incrementarNumeroSequencial(proximoNumero);

      // Inserir itens
      if (itens.length > 0 && data) {
        const itensComProposta = itens.map((item) => ({
          ...item,
          proposta_id: data.id,
        }));

        const { error: itensError } = await supabase
          .from('proposta_itens')
          .insert(itensComProposta);

        if (itensError) throw itensError;
      }

      await loadPropostas();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao adicionar proposta:', err);
      return { success: false, error: err };
    }
  };

  // Atualizar proposta
  const updateProposta = async (id: string, updates: Partial<Proposta>, itens?: Omit<PropostaItem, 'id' | 'proposta_id'>[]) => {
    try {
      // Extrair apenas campos válidos da tabela propostas
      const updateData: Record<string, unknown> = {};

      // Incrementar revisão a cada edição
      const propostaAtual = await loadPropostaById(id);
      if (propostaAtual?.status === 'aprovada') {
        return { success: false, error: new Error('Proposta aprovada não pode ser editada') };
      }
      const revisaoAtual = propostaAtual?.numero_revisao ?? 0;
      updateData.numero_revisao = revisaoAtual + 1;
      
      if (updates.cliente_nome !== undefined) updateData.cliente_nome = updates.cliente_nome;
      if (updates.cliente_empresa !== undefined) updateData.cliente_empresa = updates.cliente_empresa;
      if (updates.descricao_servicos !== undefined) updateData.descricao_servicos = updates.descricao_servicos;
      if (updates.valor_total !== undefined) updateData.valor_total = updates.valor_total;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.validade !== undefined) updateData.validade = updates.validade;
      if (updates.prazo_producao !== undefined) updateData.prazo_producao = updates.prazo_producao;
      if (updates.prazo_instalacao !== undefined) updateData.prazo_instalacao = updates.prazo_instalacao;
      if (updates.condicoes_pagamento !== undefined) updateData.condicoes_pagamento = updates.condicoes_pagamento;
      if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
      if (updates.escopo_tecnico !== undefined) updateData.escopo_tecnico = updates.escopo_tecnico;

      const { data, error: updateError } = await supabase
        .from('propostas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Se houver itens, deletar antigos e inserir novos
      if (itens) {
        await supabase.from('proposta_itens').delete().eq('proposta_id', id);

        if (itens.length > 0) {
          const itensComProposta = itens.map((item) => ({
            ...item,
            proposta_id: id,
          }));

          const { error: itensError } = await supabase
            .from('proposta_itens')
            .insert(itensComProposta);

          if (itensError) throw itensError;
        }
      }

      await loadPropostas();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao atualizar proposta:', err);
      return { success: false, error: err };
    }
  };

  // Aprovar proposta e criar obra
  const aprovarECriarObra = async (id: string, obraNome?: string) => {
    try {
      // Obter user_id da sessão atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';

      // 1. Buscar proposta
      const proposta = await loadPropostaById(id);
      if (!proposta) throw new Error('Proposta não encontrada');
      if (proposta.obra_gerada_id) {
        return { success: true, obraId: proposta.obra_gerada_id };
      }

      // 2. Buscar ou criar cliente
      let clienteId: string | null = null;
      
      const { data: clienteExistente } = await supabase
        .from('entidades')
        .select('id')
        .eq('nome', proposta.cliente_nome)
        .eq('tipo', 'cliente')
        .single();

      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        // Criar novo cliente
        const { data: novoCliente, error: clienteError } = await supabase
          .from('entidades')
          .insert([{
            user_id: user.id,
            nome: proposta.cliente_nome,
            tipo: 'cliente',
          }])
          .select()
          .single();

        if (clienteError) throw clienteError;
        clienteId = novoCliente?.id || null;
      }

      // 3. Criar obra
      const nomeObra = (obraNome || proposta.descricao_servicos || '').trim();
      const nomeFinal = (nomeObra.length > 0 ? nomeObra : proposta.descricao_servicos).substring(0, 100);

      const { data: novaObra, error: obraError } = await supabase
        .from('obras')
        .insert([{
          user_id: user.id,
          nome: nomeFinal, // Limitar nome
          descricao: proposta.descricao_servicos,
          valor_total_orcamento: proposta.valor_total,
          status: 'aprovada',
          cliente_id: clienteId,
        }])
        .select()
        .single();

      if (obraError) throw obraError;

      // 4. Atualizar proposta com obra_gerada_id
      const { error: updateError } = await supabase
        .from('propostas')
        .update({
          status: 'aprovada',
          obra_gerada_id: novaObra?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await registrarNotificacao({
        tipo: 'proposta',
        titulo: 'Proposta aprovada',
        mensagem: `Proposta aprovada por ${userNome}`,
        link: '/propostas',
        metadata: { proposta_id: id, obra_id: novaObra?.id },
      });

      await registrarNotificacao({
        tipo: 'obra',
        titulo: 'Obra criada',
        mensagem: `Obra "${nomeFinal}" criada por ${userNome}`,
        link: novaObra?.id ? `/obras/${novaObra.id}` : '/obras',
        metadata: { obra_id: novaObra?.id, proposta_id: id },
      });

      await loadPropostas();
      return { success: true, obraId: novaObra?.id };
    } catch (err) {
      console.error('Erro ao aprovar proposta:', err);
      return { success: false, error: err };
    }
  };

  // Rejeitar (cancelar) proposta
  const rejeitarProposta = async (id: string) => {
    try {
      const { error: updateError } = await supabase
        .from('propostas')
        .update({
          status: 'rejeitada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await loadPropostas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao rejeitar proposta:', err);
      return { success: false, error: err };
    }
  };

  // Deletar proposta
  const deleteProposta = async (id: string) => {
    try {
      // Deletar itens primeiro
      await supabase.from('proposta_itens').delete().eq('proposta_id', id);

      const { error: deleteError } = await supabase
        .from('propostas')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await loadPropostas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao deletar proposta:', err);
      return { success: false, error: err };
    }
  };

  // Filtrar por status
  const getPropostasByStatus = useCallback(
    (status: PropostaStatus | 'todas') => {
      if (status === 'todas') return propostas;
      return propostas.filter((p) => p.status === status);
    },
    [propostas]
  );

  // Estatísticas
  const getStats = useCallback(() => {
    return {
      total: propostas.length,
      rascunhos: propostas.filter((p) => p.status === 'rascunho').length,
      enviadas: propostas.filter((p) => p.status === 'enviada').length,
      aprovadas: propostas.filter((p) => p.status === 'aprovada').length,
      valorTotal: propostas.reduce((acc, p) => acc + p.valor_total, 0),
    };
  }, [propostas]);

  // Carregar ao montar
  useEffect(() => {
    loadPropostas();
  }, [loadPropostas]);

  return {
    propostas,
    loading,
    error,
    loadPropostas,
    loadPropostaById,
    loadItens,
    addProposta,
    updateProposta,
    aprovarECriarObra,
    rejeitarProposta,
    deleteProposta,
    getPropostasByStatus,
    getStats,
    getProximoNumero,
    refresh: loadPropostas,
  };
};

export default usePropostas;
