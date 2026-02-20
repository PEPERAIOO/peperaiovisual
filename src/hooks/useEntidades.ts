import { useState, useEffect, useCallback } from 'react';
import supabase from '../lib/supabaseClient';
import { Entity, cleanPhone } from '../types/entidades';

export const useEntidades = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar entidades
  const loadEntities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('entidades')
        .select('*')
        // Esconde registros desativados (soft delete), mas mantém compatível com dados antigos sem a coluna
        .or('ativo.is.null,ativo.eq.true')
        .order('nome');

      if (error) throw error;
      setEntities(data || []);
    } catch (err) {
      console.error('Erro ao carregar entidades:', err);
      setEntities([]);
      setError(
        'Não foi possível carregar Pessoas/Empresas do banco. ' +
        'Verifique as permissões (RLS) no Supabase para a tabela entidades.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Adicionar entidade
  const addEntity = async (entity: Omit<Entity, 'id' | 'created_at' | 'updated_at' | 'ativo'>) => {
    try {
      // Obter user_id da sessão atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Limpar telefone antes de salvar
      const cleanedEntity = {
        ...entity,
        user_id: user.id,
        telefone: entity.telefone ? cleanPhone(entity.telefone) : null,
      };

      const { data, error } = await supabase
        .from('entidades')
        .insert([cleanedEntity])
        .select()
        .single();

      if (error) throw error;

      await loadEntities();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao adicionar entidade:', err);
      return { success: false, error: err };
    }
  };

  // Atualizar entidade
  const updateEntity = async (id: string, updates: Partial<Entity>) => {
    try {
      // Limpar telefone se estiver sendo atualizado
      const cleanedUpdates = {
        ...updates,
        telefone: updates.telefone ? cleanPhone(updates.telefone) : updates.telefone,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('entidades')
        .update(cleanedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await loadEntities();
      return { success: true, data };
    } catch (err) {
      console.error('Erro ao atualizar entidade:', err);
      return { success: false, error: err };
    }
  };

  // Soft delete (desativar)
  const deactivateEntity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entidades')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await loadEntities();
      return { success: true };
    } catch (err) {
      console.error('Erro ao deletar entidade:', err);
      return { success: false, error: err };
    }
  };

  // Hard delete (apagar)
  const removeEntity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entidades')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadEntities();
      return { success: true };
    } catch (err) {
      console.error('Erro ao apagar entidade:', err);
      return { success: false, error: err };
    }
  };

  // Filtrar por tipo
  const getFilteredEntities = useCallback(
    (tipo: string): Entity[] => {
      if (tipo === 'todos') return entities;
      return entities.filter((e) => e.tipo === tipo);
    },
    [entities]
  );

  // Carregar ao montar
  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  return {
    entities,
    loading,
    error,
    addEntity,
    updateEntity,
    deactivateEntity,
    removeEntity,
    getFilteredEntities,
    refresh: loadEntities,
  };
};

export default useEntidades;
