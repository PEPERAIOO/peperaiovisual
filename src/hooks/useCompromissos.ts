import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isSameDay, startOfDay, endOfDay } from 'date-fns';
import supabase from '../lib/supabaseClient';
import {
  Compromisso,
  CompromissoInsert,
} from '../types/compromissos';
import { Obra } from '../types/obras';

export const useCompromissos = () => {
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mesAtual, setMesAtual] = useState(new Date());

  // Período do mês atual
  const inicioMes = useMemo(() => startOfMonth(mesAtual), [mesAtual]);
  const fimMes = useMemo(() => endOfMonth(mesAtual), [mesAtual]);

  // Carregar compromissos do mês
  const loadCompromissos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const inicio = format(startOfDay(inicioMes), "yyyy-MM-dd'T'HH:mm:ss");
      const fim = format(endOfDay(fimMes), "yyyy-MM-dd'T'HH:mm:ss");

      const { data, error: fetchError } = await supabase
        .from('compromissos')
        .select(`
          *,
          obra:obras!obra_id(id, nome)
        `)
          .gte('data_inicio', inicio)
          .lte('data_inicio', fim)
        .order('data_inicio', { ascending: true });

      if (fetchError) {
        // Se a tabela ou coluna não existe, ou qualquer erro de schema
        // Retornar array vazio sem mostrar erro ao usuário
        console.warn('Compromissos não disponível:', fetchError.message);
        console.warn('Execute o SQL de criação da tabela compromissos no Supabase.');
        setCompromissos([]);
        return;
      }
      setCompromissos(data || []);
    } catch (err) {
      console.error('Erro ao carregar compromissos:', err);
      setCompromissos([]);
    } finally {
      setLoading(false);
    }
  }, [inicioMes, fimMes]);

  // Carregar obras para o select
  const loadObras = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('obras')
        .select('id, nome, status, cliente_id, valor_total_orcamento, created_at')
        .in('status', ['aprovada', 'em_andamento'])
        .order('nome');

      if (fetchError) throw fetchError;
      setObras((data as Obra[]) || []);
    } catch (err) {
      console.error('Erro ao carregar obras:', err);
      setObras([]);
    }
  }, []);

  // Adicionar compromisso
  const addCompromisso = async (data: CompromissoInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: newData, error: insertError } = await supabase
        .from('compromissos')
        .insert([{ ...data, user_id: user.id, concluido: false }])
        .select()
        .single();

      if (insertError) throw insertError;

      await loadCompromissos();
      return { success: true, data: newData };
    } catch (err) {
      console.error('Erro ao adicionar compromisso:', err);
      return { success: false, error: err };
    }
  };

  // Atualizar compromisso
  const updateCompromisso = async (id: string, updates: Partial<Compromisso>) => {
    try {
      const { error: updateError } = await supabase
        .from('compromissos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;

      await loadCompromissos();
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar compromisso:', err);
      return { success: false, error: err };
    }
  };

  // Marcar como concluído
  const toggleConcluido = async (id: string, concluido: boolean) => {
    return updateCompromisso(id, { concluido });
  };

  // Excluir compromisso
  const deleteCompromisso = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('compromissos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await loadCompromissos();
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir compromisso:', err);
      return { success: false, error: err };
    }
  };

  // Obter compromissos de um dia específico
  const getCompromissosDia = (data: Date): Compromisso[] => {
    return compromissos.filter((c) => isSameDay(new Date(c.data_inicio), data));
  };

  // Navegar entre meses
  const proximoMes = () => {
    setMesAtual((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const mesAnterior = () => {
    setMesAtual((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const irParaHoje = () => {
    setMesAtual(new Date());
  };

  // Carregar dados ao montar
  useEffect(() => {
    loadCompromissos();
    loadObras();
  }, [loadCompromissos, loadObras]);

  return {
    compromissos,
    obras,
    loading,
    error,
    mesAtual,
    addCompromisso,
    updateCompromisso,
    toggleConcluido,
    deleteCompromisso,
    getCompromissosDia,
    proximoMes,
    mesAnterior,
    irParaHoje,
    reload: loadCompromissos,
  };
};
