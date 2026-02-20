import { useState, useEffect, useCallback } from 'react';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import supabase from '../lib/supabaseClient';
import { registrarNotificacao } from '../utils/notificationLogger';
import {
  Transaction,
  Category,
  DeletedTransaction,
  MonthOption,
  FinanceiroSummary,
} from '../types/financeiro';

export const useFinanceiro = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deletedTransactions, setDeletedTransactions] = useState<DeletedTransaction[]>([]);
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAllTransactions, setShowAllTransactions] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<Transaction[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [loadingCategoryTotals, setLoadingCategoryTotals] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  // Calcular período do mês selecionado
  const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
  const currentMonthLabel = format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });

  // Calcular resumo financeiro (apenas transações pagas contam no saldo)
  const summary: FinanceiroSummary = {
    totalReceitas: summaryData
      .filter((t) => t.tipo === 'receita' && t.status === 'pago')
      .reduce((acc, t) => acc + t.valor, 0),
    totalDespesas: summaryData
      .filter((t) => t.tipo === 'despesa' && t.status === 'pago')
      .reduce((acc, t) => acc + t.valor, 0),
    saldo: 0,
    contasAPagar: summaryData
      .filter((t) => t.tipo === 'despesa' && t.status === 'pendente')
      .reduce((acc, t) => acc + t.valor, 0),
    contasAReceber: summaryData
      .filter((t) => t.tipo === 'receita' && t.status === 'pendente')
      .reduce((acc, t) => acc + t.valor, 0),
  };
  summary.saldo = summary.totalReceitas - summary.totalDespesas;

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      setCategories([]);
      setError(
        'Não foi possível carregar categorias do banco. ' +
        'Verifique as permissões (RLS) no Supabase para a tabela categorias.'
      );
    }
  }, []);

  // Carregar transações do mês selecionado OU todas (com paginação)
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('transacoes')
        .select('*', { count: 'exact' });

      // Se não for "exibir todos", filtra pelo mês
      if (!showAllTransactions) {
        query = query.or(
          `and(data_vencimento.gte.${startDate},data_vencimento.lte.${endDate}),and(data_pagamento.gte.${startDate},data_pagamento.lte.${endDate})`
        );
      }

      // Paginação
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query
        .order('data_vencimento', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setTransactions(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      setTransactions([]);
      setTotalCount(0);
      setError(
        'Não foi possível carregar lançamentos do banco. ' +
        'Verifique as permissões (RLS) no Supabase para a tabela transacoes.'
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, showAllTransactions, currentPage, ITEMS_PER_PAGE]);

  // Carregar dados completos para o resumo (sem paginação)
  const loadSummaryData = useCallback(async () => {
    try {
      let query = supabase
        .from('transacoes')
        .select('tipo, status, valor, data_vencimento, data_pagamento');

      if (!showAllTransactions) {
        query = query.or(
          `and(data_vencimento.gte.${startDate},data_vencimento.lte.${endDate}),and(data_pagamento.gte.${startDate},data_pagamento.lte.${endDate})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      setSummaryData(data || []);
    } catch (err) {
      console.error('Erro ao carregar resumo financeiro:', err);
      setSummaryData([]);
    }
  }, [showAllTransactions, startDate, endDate]);

  // Carregar totais por categoria (apenas despesas)
  const loadCategoryTotals = useCallback(async () => {
    setLoadingCategoryTotals(true);
    try {
      let query = supabase
        .from('transacoes')
        .select('categoria, valor, tipo');

      if (!showAllTransactions) {
        query = query.or(
          `and(data_vencimento.gte.${startDate},data_vencimento.lte.${endDate}),and(data_pagamento.gte.${startDate},data_pagamento.lte.${endDate})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const totals = (data || [])
        .filter((t) => t.tipo === 'despesa')
        .reduce<Record<string, number>>((acc, t) => {
          const key = t.categoria || 'Sem categoria';
          acc[key] = (acc[key] || 0) + (t.valor || 0);
          return acc;
        }, {});

      setCategoryTotals(totals);
    } catch (err) {
      console.error('Erro ao carregar totais por categoria:', err);
      setCategoryTotals({});
    } finally {
      setLoadingCategoryTotals(false);
    }
  }, [showAllTransactions, startDate, endDate]);

  // Carregar meses disponíveis (que têm transações)
  const loadAvailableMonths = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('data_vencimento, data_pagamento')
        .order('data_vencimento', { ascending: false });

      if (error) throw error;

      // Agrupar por mês/ano
      const monthsMap = new Map<string, MonthOption>();

      (data || []).forEach((t) => {
        const rawDate = t.data_pagamento || t.data_vencimento;
        if (!rawDate) return;

        const date = parseISO(rawDate);
        const key = format(date, 'yyyy-MM');
        const existing = monthsMap.get(key);

        if (existing) {
          existing.transactionCount++;
        } else {
          monthsMap.set(key, {
            year: date.getFullYear(),
            month: date.getMonth(),
            label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
            transactionCount: 1,
          });
        }
      });

      setAvailableMonths(Array.from(monthsMap.values()));
    } catch (err) {
      console.error('Erro ao carregar meses:', err);
      setAvailableMonths([]);
    }
  }, []);

  // Carregar transações deletadas
  const loadDeletedTransactions = useCallback(async () => {
    try {
      // Tabela transacoes_deletadas não existe ainda - comentado temporariamente
      // const { data, error } = await supabase
      //   .from('transacoes_deletadas')
      //   .select('*')
      //   .order('deleted_at', { ascending: false });

      // if (error) throw error;
      // setDeletedTransactions(data || []);
      setDeletedTransactions([]);
    } catch (err) {
      console.error('Erro ao carregar transações deletadas:', err);
      setDeletedTransactions([]);
    }
  }, []);

  // Adicionar transação
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Obter user_id da sessão atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar nome do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';

      // Se status for "pago", garantir que data_pagamento tenha timestamp completo
      const transactionData = {
        ...transaction,
        user_id: user.id,
        user_nome: userNome,
        created_at: new Date().toISOString(),
      };

      // Se está pago mas não tem data_pagamento ou tem apenas data (sem hora), adicionar timestamp completo
      if (transaction.status === 'pago') {
        if (!transaction.data_pagamento || transaction.data_pagamento.length === 10) {
          transactionData.data_pagamento = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('transacoes')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;

      await registrarNotificacao({
        tipo: 'financeiro',
        titulo: 'Movimentação financeira',
        mensagem: `${transaction.tipo === 'receita' ? 'Receita' : 'Despesa'}: ${transaction.descricao} • R$ ${transaction.valor.toFixed(2)} • por ${userNome}`,
        link: '/financeiro',
        metadata: { transacao_id: data?.id },
      });

      await loadTransactions();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
      return { success: false, error: err };
    }
  };

  // Atualizar transação
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      let userNome: string | null = null;
      if (updates.status === 'pago') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('nome_completo')
            .eq('id', user.id)
            .single();

          userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';
        }
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Se mudou para "pago" e não tem data_pagamento ou tem apenas data, adicionar timestamp
      if (updates.status === 'pago' && (!updates.data_pagamento || (updates.data_pagamento && updates.data_pagamento.length === 10))) {
        updateData.data_pagamento = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('transacoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (updates.status === 'pago' && userNome) {
        await registrarNotificacao({
          tipo: 'financeiro',
          titulo: 'Movimentação no caixa',
          mensagem: `Pagamento registrado por ${userNome}`,
          link: '/financeiro',
          metadata: { transacao_id: data?.id },
        });
      }

      await loadTransactions();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao atualizar transação:', err);
      return { success: false, error: err };
    }
  };

  // Deletar transação (soft delete - move para histórico)
  const deleteTransaction = async (transaction: Transaction) => {
    try {
      // 1. Salvar na tabela de deletados
      const { error: insertError } = await supabase
        .from('transacoes_deletadas')
        .insert([
          {
            transacao_original: transaction,
            deleted_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.warn('Aviso: Não foi possível salvar no histórico:', insertError);
      }

      // 2. Deletar da tabela principal
      const { error: deleteError } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', transaction.id);

      if (deleteError) throw deleteError;

      await loadTransactions();
      await loadDeletedTransactions();
      return { success: true };
    } catch (err) {
      console.error('Erro ao deletar transação:', err);
      return { success: false, error: err };
    }
  };

  // Restaurar transação deletada
  const restoreTransaction = async (deletedItem: DeletedTransaction) => {
    try {
      // 1. Reinserir na tabela principal
      const { id, ...transactionData } = deletedItem.transacao_original;
      const { error: insertError } = await supabase
        .from('transacoes')
        .insert([transactionData]);

      if (insertError) throw insertError;

      // 2. Remover do histórico
      const { error: deleteError } = await supabase
        .from('transacoes_deletadas')
        .delete()
        .eq('id', deletedItem.id);

      if (deleteError) throw deleteError;

      await loadTransactions();
      await loadDeletedTransactions();
      return { success: true };
    } catch (err) {
      console.error('Erro ao restaurar transação:', err);
      return { success: false, error: err };
    }
  };

  // CRUD de Categorias
  const addCategory = async (category: Omit<Category, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert([category])
        .select()
        .single();

      if (error) throw error;

      await loadCategories();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao adicionar categoria:', err);
      return { success: false, error: err };
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await loadCategories();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err);
      return { success: false, error: err };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('categorias').delete().eq('id', id);

      if (error) throw error;

      await loadCategories();
      return { success: true };
    } catch (err) {
      console.error('Erro ao deletar categoria:', err);
      return { success: false, error: err };
    }
  };

  // Mudar mês selecionado
  const selectMonth = (year: number, month: number) => {
    setSelectedDate(new Date(year, month, 1));
    setCurrentPage(0); // Reset pagination
  };

  // Toggle exibir todas as transações
  const toggleShowAll = () => {
    setShowAllTransactions(prev => !prev);
    setCurrentPage(0); // Reset pagination
  };

  // Navegar páginas
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    loadCategories();
    loadAvailableMonths();
    loadDeletedTransactions();
  }, [loadCategories, loadAvailableMonths, loadDeletedTransactions]);

  // Efeito para recarregar transações quando o mês muda
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData]);

  useEffect(() => {
    loadCategoryTotals();
  }, [loadCategoryTotals, transactions]);

  return {
    // Estado
    transactions,
    categories,
    deletedTransactions,
    availableMonths,
    selectedDate,
    currentMonthLabel,
    summary,
    loading,
    error,
    showAllTransactions,
    currentPage,
    totalCount,
    itemsPerPage: ITEMS_PER_PAGE,
    totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
      categoryTotals,
      loadingCategoryTotals,

    // Ações de transação
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreTransaction,

    // Ações de categoria
    addCategory,
    updateCategory,
    deleteCategory,

    // Navegação
    selectMonth,
    toggleShowAll,
    goToPage,

    // Reload
    refresh: loadTransactions,
  };
};

export default useFinanceiro;
