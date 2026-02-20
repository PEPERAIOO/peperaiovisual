import { useCallback, useMemo } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import supabase from '../lib/supabaseClient';

/**
 * Hook de Permissões RBAC (Role-Based Access Control)
 * 
 * Gerencia todas as verificações de permissão do sistema baseadas no role do usuário.
 * 
 * Roles disponíveis:
 * - admin: Acesso total (editar, delegar, visualizar sensível)
 * - socio_executor: Pode executar obras delegadas e visualizar dados sensíveis
 * - user: Usuário comum (acesso básico, similar a viewer)
 * - viewer: Apenas visualização básica
 */
export const usePermissions = () => {
  const { profile, user } = useAuth();

  // Role atual do usuário (fallback para viewer se não autenticado)
  const role: UserRole = useMemo(() => {
    return profile?.role || 'viewer';
  }, [profile?.role]);

  // ID do usuário atual
  const userId = useMemo(() => {
    return user?.id || profile?.id;
  }, [user?.id, profile?.id]);

  /**
   * canEdit() - Permissão para editar transações financeiras
   * 
   * Permitido APENAS se: role === 'admin'
   * 
   * Usado para:
   * - Botão "Nova Transação" no Financeiro
   * - Edição de transações existentes
   * - Exclusão de registros
   */
  const canEdit = useCallback((): boolean => {
    return role === 'admin';
  }, [role]);

  /**
   * canDelegate() - Permissão para delegar obras
   * 
   * Permitido APENAS se: role === 'admin'
   * 
   * Usado para:
   * - Acesso à página "Gestão de Obras"
   * - Criar novas delegações
   * - Enviar verba para executores
   * - Auditar prestação de contas
   */
  const canDelegate = useCallback((): boolean => {
    return role === 'admin';
  }, [role]);

  /**
   * canExecute(verbaId) - Permissão para executar/gerenciar uma verba específica
   * 
   * Permitido SE:
   * - role === 'admin' OU
   * - O usuário for o delegado da verba (obras_verbas.delegado_para_id === userId)
   * 
   * Usado para:
   * - Registrar gastos em uma obra
   * - Finalizar prestação de contas
   * - Acesso à página "Minhas Obras"
   * 
   * @param verbaId - ID da verba a verificar
   * @returns Promise<boolean>
   */
  const canExecute = useCallback(async (verbaId: string): Promise<boolean> => {
    // Admin pode executar qualquer verba
    if (role === 'admin') {
      return true;
    }

    // Se não há usuário logado, não pode executar
    if (!userId) {
      return false;
    }

    try {
      // Buscar a verba para verificar o delegado
      const { data, error } = await supabase
        .from('obras_verbas')
        .select('delegado_para_id')
        .eq('id', verbaId)
        .single();

      if (error) {
        console.error('Erro ao verificar permissão de execução:', error);
        return false;
      }

      // Verificar se o usuário é o delegado desta verba
      return data?.delegado_para_id === userId;
    } catch (err) {
      console.error('Erro ao verificar canExecute:', err);
      return false;
    }
  }, [role, userId]);

  /**
   * canExecuteSync() - Versão síncrona de canExecute (menos precisa)
   * 
   * Útil para verificações rápidas onde não é possível usar async
   * Verifica apenas se o usuário TEM potencial de executar (é admin ou socio_executor)
   * 
   * Para verificação precisa de uma verba específica, use canExecute(verbaId)
   */
  const canExecuteSync = useCallback((): boolean => {
    return role === 'admin' || role === 'socio_executor';
  }, [role]);

  /**
   * canViewSensitive() - Permissão para visualizar dados sensíveis
   * 
   * Permitido SE: role === 'admin' OU role === 'socio_executor'
   * 
   * Usado para:
   * - Visualizar valores financeiros detalhados
   * - Acessar informações de custos de obras
   * - Ver relatórios completos
   */
  const canViewSensitive = useCallback((): boolean => {
    return role === 'admin' || role === 'socio_executor';
  }, [role]);

  /**
   * isAdmin() - Verificação direta se é admin
   */
  const isAdmin = useCallback((): boolean => {
    return role === 'admin';
  }, [role]);

  /**
   * isSocioExecutor() - Verificação se é sócio executor
   */
  const isSocioExecutor = useCallback((): boolean => {
    return role === 'socio_executor';
  }, [role]);

  /**
   * hasRole() - Verificação genérica de role
   * 
   * @param allowedRoles - Array de roles permitidas
   * @returns boolean
   */
  const hasRole = useCallback((allowedRoles: UserRole[]): boolean => {
    return allowedRoles.includes(role);
  }, [role]);

  return {
    // Dados do usuário
    role,
    userId,
    profile,
    
    // Funções de permissão
    canEdit,
    canDelegate,
    canExecute,
    canExecuteSync,
    canViewSensitive,
    
    // Verificações de role
    isAdmin,
    isSocioExecutor,
    hasRole,
  };
};

export default usePermissions;
