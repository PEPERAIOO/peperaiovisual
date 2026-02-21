import { useState, useEffect, useCallback } from 'react';
import { addMonths, format } from 'date-fns';
import supabase from '../lib/supabaseClient';
import {
  DividaTransacao,
  DividaParcela,
  DividaInsert,
  ParcelaInsert,
  DividasSummary,
} from '../types/dividas';

export const useDividas = () => {
  const [dividas, setDividas] = useState<DividaTransacao[]>([]);
  const [parcelas, setParcelasMap] = useState<Map<string, DividaParcela[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular resumo
  const summary: DividasSummary = {
    totalDividas: dividas.reduce((acc, d) => acc + d.valor, 0),
    totalPago: dividas
      .filter((d) => d.status === 'pago')
      .reduce((acc, d) => acc + d.valor, 0) +
      Array.from(parcelas.values())
        .flat()
        .filter((p) => p.status === 'pago')
        .reduce((acc, p) => acc + p.valor, 0),
    totalPendente: dividas
      .filter((d) => d.status === 'pendente' || d.status === 'atrasado')
      .filter((d) => !d.is_parcelada)
      .reduce((acc, d) => acc + d.valor, 0) +
      Array.from(parcelas.values())
        .flat()
        .filter((p) => p.status === 'pendente' || p.status === 'atrasado')
        .reduce((acc, p) => acc + p.valor, 0),
    qtdDividasAtivas: dividas.filter((d) => d.status === 'pendente' || d.status === 'atrasado').length,
    qtdParcelasPendentes: Array.from(parcelas.values())
      .flat()
      .filter((p) => p.status === 'pendente' || p.status === 'atrasado').length,
  };

  // Carregar dívidas (transações tipo despesa pendentes)
  const loadDividas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar transações de dívida (despesas pendentes ou parceladas)
      const { data, error: fetchError } = await supabase
        .from('transacoes')
        .select(`
          *,
          entidade:entidades!entidade_id(id, nome, tipo)
        `)
        .eq('tipo', 'despesa')
        .or('status.eq.pendente,status.eq.atrasado,is_parcelada.eq.true')
        .order('data_vencimento', { ascending: true });

      if (fetchError) throw fetchError;

      // Carregar parcelas para dívidas parceladas
      const dividasParceladas = (data || []).filter((d: DividaTransacao) => d.is_parcelada);
      const parcelasMap = new Map<string, DividaParcela[]>();

      if (dividasParceladas.length > 0) {
        const dividaIds = dividasParceladas.map((d: DividaTransacao) => d.id);
        const { data: parcelasData, error: parcelasError } = await supabase
          .from('dividas_parcelas')
          .select('*')
          .in('transacao_id', dividaIds)
          .order('numero_parcela', { ascending: true });

        if (parcelasError) throw parcelasError;

        // Agrupar parcelas por transacao_id
        (parcelasData || []).forEach((p: DividaParcela) => {
          const existing = parcelasMap.get(p.transacao_id) || [];
          existing.push(p);
          parcelasMap.set(p.transacao_id, existing);
        });
      }

      // Calcular dados agregados para cada dívida
      const dividasComCalculo = (data || []).map((d: DividaTransacao) => {
        if (d.is_parcelada) {
          const parcelasDivida = parcelasMap.get(d.id) || [];
          const pagas = parcelasDivida.filter((p) => p.status === 'pago').length;
          const pendentes = parcelasDivida.filter((p) => p.status !== 'pago').length;
          return {
            ...d,
            parcelas_pagas: pagas,
            parcelas_pendentes: pendentes,
          };
        }
        return d;
      });

      setDividas(dividasComCalculo);
      setParcelasMap(parcelasMap);
    } catch (err) {
      console.error('Erro ao carregar dívidas:', err);
      setDividas([]);
      setParcelasMap(new Map());
      setError(
        'Não foi possível carregar dívidas do banco. ' +
        'Verifique as permissões (RLS) no Supabase para as tabelas transacoes/dividas_parcelas.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Adicionar nova dívida
  const addDivida = async (data: DividaInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Inserir transação mestre
      const transacaoMestre = {
        user_id: user.id,
        descricao: data.descricao,
        valor: data.valor,
        tipo: 'despesa' as const,
        status: 'pendente' as const,
        categoria: data.categoria,
        data_vencimento: data.data_vencimento,
        entidade_id: data.entidade_id,
        observacao: data.observacao,
        is_parcelada: data.is_parcelada,
        numero_parcelas: data.numero_parcelas,
      };

      const { data: mestreData, error: mestreError } = await supabase
        .from('transacoes')
        .insert([transacaoMestre])
        .select()
        .single();

      if (mestreError) throw mestreError;

      // 2. Se parcelada, inserir parcelas filhas
      if (data.is_parcelada && data.numero_parcelas && data.numero_parcelas > 1) {
        const valorParcela = data.valor / data.numero_parcelas;
        const dataBase = new Date(data.data_vencimento);

        const parcelasInsert: ParcelaInsert[] = Array.from({ length: data.numero_parcelas }, (_, i) => ({
          transacao_id: mestreData.id,
          numero_parcela: i + 1,
          valor: valorParcela,
          data_vencimento: format(addMonths(dataBase, i), 'yyyy-MM-dd'),
          status: 'pendente' as const,
        }));

        const { error: parcelasError } = await supabase
          .from('dividas_parcelas')
          .insert(parcelasInsert);

        if (parcelasError) throw parcelasError;
      }

      await loadDividas();
      return { success: true, data: mestreData };
    } catch (err) {
      console.error('Erro ao adicionar dívida:', err);
      return { success: false, error: err };
    }
  };

  // Pagar dívida única (não parcelada)
  const pagarDivida = async (dividaId: string) => {
    try {
      const hoje = format(new Date(), 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('transacoes')
        .update({
          status: 'pago',
          data_pagamento: hoje,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dividaId);

      if (error) throw error;

      await loadDividas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao pagar dívida:', err);
      return { success: false, error: err };
    }
  };

  // Pagar parcelas selecionadas
  const pagarParcelas = async (parcelaIds: string[]) => {
    try {
      const hoje = format(new Date(), 'yyyy-MM-dd');

      const { error } = await supabase
        .from('dividas_parcelas')
        .update({
          status: 'pago',
          data_pagamento: hoje,
          updated_at: new Date().toISOString(),
        })
        .in('id', parcelaIds);

      if (error) throw error;

      // Verificar se todas as parcelas da dívida foram pagas
      // e atualizar status da transação mestre se necessário
      await loadDividas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao pagar parcelas:', err);
      return { success: false, error: err };
    }
  };

  // Obter parcelas de uma dívida específica
  const getParcelasDivida = (dividaId: string): DividaParcela[] => {
    return parcelas.get(dividaId) || [];
  };

  // Cancelar dívida
  const cancelarDivida = async (dividaId: string) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .update({
          status: 'cancelado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dividaId);

      if (error) throw error;

      await loadDividas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao cancelar dívida:', err);
      return { success: false, error: err };
    }
  };

  // Excluir dívida (e parcelas, se houver)
  const deleteDivida = async (dividaId: string) => {
    try {
      const { error: parcelasError } = await supabase
        .from('dividas_parcelas')
        .delete()
        .eq('transacao_id', dividaId);

      if (parcelasError) throw parcelasError;

      const { error: deleteError } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', dividaId);

      if (deleteError) throw deleteError;

      await loadDividas();
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir dívida:', err);
      return { success: false, error: err };
    }
  };

  // Carregar dados ao montar
  useEffect(() => {
    loadDividas();
  }, [loadDividas]);

  return {
    dividas,
    parcelas,
    summary,
    loading,
    error,
    addDivida,
    pagarDivida,
    pagarParcelas,
    getParcelasDivida,
    cancelarDivida,
    deleteDivida,
    reload: loadDividas,
  };
};
