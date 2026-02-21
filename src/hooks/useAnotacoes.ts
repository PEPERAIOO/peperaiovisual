import { useState, useEffect, useCallback } from 'react';
import { addDays } from 'date-fns';
import supabase from '../lib/supabaseClient';
import { Anotacao, AnotacaoInsert } from '../types/anotacoes';

export const useAnotacoes = () => {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar anotações ativas (não expiradas)
  const loadAnotacoes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hoje = new Date().toISOString();

      const { data, error: fetchError } = await supabase
        .from('anotacoes')
        .select('*')
        .gte('data_expiracao', hoje)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAnotacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar anotações:', err);
      setAnotacoes([]);
      setError('Não foi possível carregar as anotações.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Adicionar anotação
  const addAnotacao = async (anotacao: AnotacaoInsert) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar nome do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const hoje = new Date();
      const dataExpiracao = addDays(hoje, anotacao.dias_expiracao);

      const anotacaoData = {
        ...anotacao,
        user_id: user.id,
        user_nome: profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário',
        data_criacao: hoje.toISOString(),
        data_expiracao: dataExpiracao.toISOString(),
        created_at: hoje.toISOString(),
      };

      const { data, error } = await supabase
        .from('anotacoes')
        .insert([anotacaoData])
        .select()
        .single();

      if (error) throw error;

      await loadAnotacoes();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao adicionar anotação:', err);
      return { success: false, error: err };
    }
  };

  // Atualizar anotação
  const updateAnotacao = async (id: string, updates: Partial<AnotacaoInsert>) => {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Se alterou dias_expiracao, recalcular data_expiracao
      if (updates.dias_expiracao !== undefined) {
        const { data: anotacaoAtual } = await supabase
          .from('anotacoes')
          .select('data_criacao')
          .eq('id', id)
          .single();

        if (anotacaoAtual) {
          const dataCriacao = new Date(anotacaoAtual.data_criacao);
          updateData.data_expiracao = addDays(dataCriacao, updates.dias_expiracao).toISOString();
        }
      }

      const { data, error } = await supabase
        .from('anotacoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await loadAnotacoes();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao atualizar anotação:', err);
      return { success: false, error: err };
    }
  };

  // Deletar anotação
  const deleteAnotacao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('anotacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadAnotacoes();
      return { success: true };
    } catch (err) {
      console.error('Erro ao deletar anotação:', err);
      return { success: false, error: err };
    }
  };

  // Limpar anotações expiradas
  const limparExpiradas = async () => {
    try {
      const hoje = new Date().toISOString();

      const { error } = await supabase
        .from('anotacoes')
        .delete()
        .lt('data_expiracao', hoje);

      if (error) throw error;

      await loadAnotacoes();
      return { success: true };
    } catch (err) {
      console.error('Erro ao limpar anotações expiradas:', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    loadAnotacoes();
  }, [loadAnotacoes]);

  return {
    anotacoes,
    loading,
    error,
    loadAnotacoes,
    addAnotacao,
    updateAnotacao,
    deleteAnotacao,
    limparExpiradas,
  };
};
