import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../lib/supabaseClient';

// Tipos de role do sistema
export type UserRole = 'admin' | 'socio_executor' | 'user' | 'viewer';

// Interface do perfil do usuário
export interface UserProfile {
  id: string;
  email: string;
  nome?: string;
  role: UserRole;
  entidade_id?: string; // ID da entidade associada (para sócios)
  avatar_url?: string;
}

// Interface do contexto de autenticação
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Criar o contexto com valor inicial para evitar erros durante HMR
const defaultContextValue: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Props do Provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider do contexto
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar perfil do usuário da tabela profiles do Supabase
  const loadProfile = async (userId: string, userEmail: string, retryCount = 0) => {
    const maxRetries = 1;
    const timeout = 3000; // 3 segundos
    
    console.log('Buscando perfil para userId:', userId, 'email:', userEmail);
    
    try {
      // Criar timeout para a requisição
      const timeoutId = setTimeout(() => {
        console.warn('Timeout ao carregar profile, usando fallback');
      }, timeout);
      
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, email, nome_completo, role, avatar_url, entidade_id')
        .eq('id', userId)
        .maybeSingle();
      
      clearTimeout(timeoutId);
      
      console.log('Resposta do Supabase - status:', status, 'data:', data, 'error:', error);

      if (error) {
        // Se for erro de abort/timeout e ainda temos retries, tentar novamente
        if (error.message?.includes('abort') && retryCount < maxRetries) {
          console.warn(`Tentativa ${retryCount + 1} falhou, tentando novamente...`);
          return loadProfile(userId, userEmail, retryCount + 1);
        }
        console.error('Erro ao carregar perfil:', error);
        setProfile({
          id: userId,
          email: userEmail,
          nome: userEmail.split('@')[0],
          role: 'viewer',
        });
        return;
      }

      if (data) {
        console.log('Perfil carregado:', data);
        setProfile({
          id: data.id,
          email: data.email || userEmail,
          nome: data.nome_completo || userEmail.split('@')[0],
          role: (data.role as UserRole) || 'viewer',
          avatar_url: data.avatar_url,
          entidade_id: data.entidade_id,
        });
      } else {
        console.warn('Perfil não encontrado para userId:', userId, '- usando fallback. Verifique se o RLS da tabela profiles permite leitura.');
        setProfile({
          id: userId,
          email: userEmail,
          nome: userEmail.split('@')[0],
          role: 'viewer',
        });
      }
    } catch (err) {
      // Se for erro de abort e ainda temos retries, tentar novamente
      if (err instanceof Error && err.name === 'AbortError' && retryCount < maxRetries) {
        console.warn(`Timeout na tentativa ${retryCount + 1}, tentando novamente...`);
        return loadProfile(userId, userEmail, retryCount + 1);
      }
      console.error('Erro ao carregar perfil:', err);
      setProfile({
        id: userId,
        email: userEmail,
        nome: userEmail.split('@')[0],
        role: 'viewer',
      });
    }
  };

  // Atualizar perfil
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id, user.email || '');
    }
  };

  // Fazer logout
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  // Efeito para monitorar sessão
  useEffect(() => {
    let isMounted = true;
    
    // Verificar sessão inicial - RÁPIDO, sem esperar perfil
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Liberar loading IMEDIATAMENTE após obter sessão
        loadingResolved = true;
        setLoading(false);

        // Carregar perfil em background (não bloqueia a UI)
        if (currentSession?.user) {
          loadProfile(currentSession.user.id, currentSession.user.email || '');
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Timeout de segurança - referência mutável para controle
    let loadingResolved = false;
    const timeout = setTimeout(() => {
      if (isMounted && !loadingResolved) {
        console.warn('Timeout ao carregar sessão');
        setLoading(false);
      }
    }, 1500);

    checkSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Carregar perfil em background
          loadProfile(currentSession.user.id, currentSession.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  return context;
};

export default AuthContext;
