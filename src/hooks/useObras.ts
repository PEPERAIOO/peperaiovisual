import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';
import { Obra, ObraStatus } from '../types/obras';
import { Entity } from '../types/entidades';
import { registrarNotificacao } from '../utils/notificationLogger';

// Interface interna para obra com custo calculado
interface ObraComCusto extends Omit<Obra, 'valor_gasto'> {
  valor_gasto: number; // Calculado via SUM de transações (despesas pagas)
  valor_recebido: number; // Calculado via SUM de transações (receitas pagas)
}

export const useObras = () => {
  const [obras, setObras] = useState<ObraComCusto[]>([]);
  const [clientes, setClientes] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar obras com JOIN no cliente E calcular custo via transações
  const loadObras = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Buscar obras com cliente
      const { data: obrasData, error: obrasError } = await supabase
        .from('obras')
        .select(`
          *,
          cliente:entidades!cliente_id(id, nome)
        `)
        .order('created_at', { ascending: false });

      if (obrasError) throw obrasError;

      // 2. Buscar custos de cada obra (SUM de transações tipo='despesa' e status='pago')
      const { data: custosData, error: custosError } = await supabase
        .from('transacoes')
        .select('obra_id, valor')
        .eq('tipo', 'despesa')
        .eq('status', 'pago')
        .not('obra_id', 'is', null);

      if (custosError) throw custosError;

      // 3. Calcular custo total por obra
      const custosPorObra: Record<string, number> = {};
      (custosData || []).forEach((t) => {
        if (t.obra_id) {
          custosPorObra[t.obra_id] = (custosPorObra[t.obra_id] || 0) + t.valor;
        }
      });

      // 4. Buscar receitas de cada obra (SUM de transações tipo='receita' e status='pago')
      const { data: receitasData, error: receitasError } = await supabase
        .from('transacoes')
        .select('obra_id, valor')
        .eq('tipo', 'receita')
        .eq('status', 'pago')
        .not('obra_id', 'is', null);

      if (receitasError) throw receitasError;

      const receitasPorObra: Record<string, number> = {};
      (receitasData || []).forEach((t) => {
        if (t.obra_id) {
          receitasPorObra[t.obra_id] = (receitasPorObra[t.obra_id] || 0) + t.valor;
        }
      });

      // 4. Combinar obras com custos calculados
      const obrasComCusto: ObraComCusto[] = (obrasData || []).map((obra) => ({
        ...obra,
        valor_gasto: custosPorObra[obra.id] || 0,
        valor_recebido: receitasPorObra[obra.id] || 0,
      }));

      setObras(obrasComCusto);
    } catch (err) {
      console.error('Erro ao carregar obras:', err);
      setObras([]);
      setError(
        'Não foi possível carregar obras do banco. ' +
        'Verifique as permissões (RLS) no Supabase para as tabelas obras/transacoes/entidades.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar clientes para o select
  const loadClientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('entidades')
        .select('*')
        .eq('tipo', 'cliente')
        .order('nome');

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setClientes([]);
      setError(
        'Não foi possível carregar clientes do banco. ' +
        'Verifique as permissões (RLS) no Supabase para a tabela entidades.'
      );
    }
  }, []);

  // Adicionar obra (não insere valor_gasto - é calculado)
  const addObra = async (obra: Omit<Obra, 'id' | 'created_at' | 'cliente' | 'valor_gasto' | 'user_id'>) => {
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

      // Montar objeto apenas com campos preenchidos
      const obraData: Record<string, unknown> = {
        user_id: user.id,
        nome: obra.nome,
        cliente_id: obra.cliente_id ?? null,
        status: obra.status,
        valor_total_orcamento: obra.valor_total_orcamento,
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (obra.descricao) obraData.descricao = obra.descricao;
      if (obra.data_inicio) obraData.data_inicio = obra.data_inicio;
      // OBS: coluna data_previsao não existe no schema atual do Supabase (PGRST204)

      const { data, error } = await supabase
        .from('obras')
        .insert([obraData])
        .select(`
          *,
          cliente:entidades!cliente_id(id, nome)
        `)
        .single();

      if (error) throw error;

      await registrarNotificacao({
        tipo: 'obra',
        titulo: 'Obra criada',
        mensagem: `Obra "${obra.nome}" criada por ${userNome}`,
        link: data?.id ? `/obras/${data.id}` : '/obras',
        metadata: { obra_id: data?.id },
      });

      await loadObras();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao adicionar obra:', err);
      return { success: false, error: err };
    }
  };

  // Atualizar obra
  const updateObra = async (id: string, updates: Partial<Obra>) => {
    try {
      // Remove campos que não devem ser atualizados diretamente
      const { cliente, valor_gasto, ...cleanUpdates } = updates;

      // OBS: coluna data_previsao não existe no schema atual do Supabase (PGRST204)
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (cleanUpdates as Partial<Obra>).data_previsao;
      
      const { data, error } = await supabase
        .from('obras')
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await loadObras();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao atualizar obra:', err);
      return { success: false, error: err };
    }
  };

  // Finalizar obra com opção de pagamento completo
  const finalizarObra = async (id: string, dataConclusao: string, pagoCompleto: boolean) => {
    try {
      const { data: obra, error: obraError } = await supabase
        .from('obras')
        .select('id, nome, descricao, cliente_id, valor_total_orcamento')
        .eq('id', id)
        .single();

      if (obraError) throw obraError;

      const { error: updateError } = await supabase
        .from('obras')
        .update({ status: 'concluida', data_conclusao: dataConclusao, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      if (pagoCompleto && obra) {
        const { data: receitasData, error: receitasError } = await supabase
          .from('transacoes')
          .select('valor')
          .eq('obra_id', id)
          .eq('tipo', 'receita')
          .eq('status', 'pago');

        if (receitasError) throw receitasError;

        const valorRecebido = (receitasData || []).reduce((acc, t) => acc + (t.valor || 0), 0);
        const valorTotal = obra.valor_total_orcamento || 0;
        const restante = valorTotal - valorRecebido;

        if (restante > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Usuário não autenticado');

          const { data: profileData } = await supabase
            .from('profiles')
            .select('nome_completo')
            .eq('id', user.id)
            .single();

          const userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';

          const { error: insertError } = await supabase
            .from('transacoes')
            .insert([
              {
                descricao: `Pagamento obra: ${obra.nome}`,
                valor: restante,
                tipo: 'receita',
                status: 'pago',
                categoria: 'Pagamento Cliente',
                data_pagamento: new Date().toISOString(),
                entidade_id: obra.cliente_id ?? null,
                obra_id: obra.id,
                user_id: user.id,
                user_nome: userNome,
                created_at: new Date().toISOString(),
              },
            ]);

          if (insertError) throw insertError;
        }
      }

      await loadObras();
      return { success: true };
    } catch (err) {
      console.error('Erro ao finalizar obra:', err);
      return { success: false, error: err };
    }
  };

  // Deletar obra
  const deleteObra = async (id: string) => {
    try {
      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadObras();
      return { success: true };
    } catch (err) {
      console.error('Erro ao deletar obra:', err);
      return { success: false, error: err };
    }
  };

  // Filtrar por status
  const getObrasByStatus = useCallback(
    (status: ObraStatus | 'pendente' | 'todas'): ObraComCusto[] => {
      if (status === 'todas') return obras;
      if (status === 'pendente') {
        return obras.filter(
          (o) => o.status === 'concluida' && (o.valor_recebido || 0) < (o.valor_total_orcamento || 0)
        );
      }
      return obras.filter((o) => o.status === status);
    },
    [obras]
  );

  // Estatísticas
  const getStats = useCallback(() => {
    const total = obras.length;
    const emAndamento = obras.filter((o) => o.status === 'em_andamento').length;
    const concluidas = obras.filter((o) => o.status === 'concluida').length;
    const orcamentos = obras.filter((o) => o.status === 'orcamento').length;
    const aprovadas = obras.filter((o) => o.status === 'aprovada').length;
    const valorTotalOrcado = obras.reduce((acc, o) => acc + o.valor_total_orcamento, 0);
    const valorTotalGasto = obras.reduce((acc, o) => acc + (o.valor_gasto || 0), 0);

    return {
      total,
      emAndamento,
      concluidas,
      orcamentos,
      aprovadas,
      valorTotalOrcado,
      valorTotalGasto,
    };
  }, [obras]);

  // Carregar ao montar
  useEffect(() => {
    loadObras();
    loadClientes();
  }, [loadObras, loadClientes]);

  return {
    obras,
    clientes,
    loading,
    error,
    addObra,
    updateObra,
    finalizarObra,
    deleteObra,
    getObrasByStatus,
    getStats,
    refresh: loadObras,
  };
};

export default useObras;
