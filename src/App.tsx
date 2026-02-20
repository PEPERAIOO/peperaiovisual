import React, { Suspense } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import peperaioTheme from './theme/peperaioTheme';
import { AuthProvider, useAuth } from './contexts';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Financeiro from './pages/Financeiro';
import Dividas from './pages/Dividas';
import Calendario from './pages/Calendario';
import GestaoObras from './pages/GestaoObras';
import MinhasObras from './pages/MinhasObras';
import Entidades from './pages/Entidades';
import EntidadeDetalhes from './pages/EntidadeDetalhes';
import Obras from './pages/Obras';
import ObraDetalhes from './pages/ObraDetalhes';
import PropostasLista from './pages/PropostasLista';
import PropostaEditor from './pages/PropostaEditor';
import FormacaoPreco from './pages/FormacaoPreco';
import Configuracoes from './pages/Configuracoes';
import Anotacoes from './pages/Anotacoes';

// Lazy load da página de PDF (pesada)
const AutomacaoPdfNovo = React.lazy(() => import('./pages/AutomacaoPdfNovo'));

// Variantes de animação para transições de página (mais rápidas)
const pageVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.1,
    },
  },
} as const;

// Componente de Loading centralizado
const LoadingScreen = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(25, 25, 25, 1) 0%, rgba(12, 12, 12, 1) 100%)',
    }}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress
          size={48}
          thickness={4}
          sx={{
            color: '#009246',
            mb: 2,
          }}
        />
        <Box
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.85rem',
            letterSpacing: '1px',
          }}
        >
          Carregando...
        </Box>
      </Box>
    </motion.div>
  </Box>
);

// Wrapper animado para páginas
interface AnimatedPageProps {
  children: React.ReactNode;
  keyName: string;
}

const AnimatedPage = ({ children, keyName }: AnimatedPageProps) => (
  <motion.div
    key={keyName}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ minHeight: '100vh' }}
  >
    {children}
  </motion.div>
);

// Componente para proteger rotas autenticadas
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Componente para rota que requer permissão de delegação (admin)
const AdminRoute = ({ children }: ProtectedRouteProps) => {
  const { profile, loading } = useAuth();
  
  // Se ainda está carregando, mostra loading inline
  if (loading || !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={32} sx={{ color: '#009246' }} />
      </Box>
    );
  }
  
  // Se não é admin, redireciona
  if (profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Componente para rota de executor (não-admin)
const ExecutorRoute = ({ children }: ProtectedRouteProps) => {
  const { profile, loading } = useAuth();
  
  // Se ainda está carregando, mostra loading inline
  if (loading || !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress size={32} sx={{ color: '#009246' }} />
      </Box>
    );
  }
  
  // Se for admin, redireciona para gestão de obras
  if (profile.role === 'admin') {
    return <Navigate to="/gestao-obras" replace />;
  }
  
  return <>{children}</>;
};

// Componente principal do App (interno ao AuthProvider)
const AppContent = () => {
  const { session, loading } = useAuth();

  // Tela de loading enquanto verifica sessão
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <AnimatePresence mode="sync">
        {!session ? (
          // Usuário não autenticado - Mostra Login
          <AnimatedPage keyName="login">
            <Routes>
              <Route path="*" element={<Login />} />
            </Routes>
          </AnimatedPage>
        ) : (
          // Usuário autenticado - Mostra Dashboard
          <AnimatedPage keyName="app">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="obras" element={<Obras />} />
                <Route path="obras/:id" element={<ObraDetalhes />} />
                {/* Gestão de Obras - Apenas Admin */}
                <Route path="gestao-obras" element={<AdminRoute><GestaoObras /></AdminRoute>} />
                {/* Minhas Obras - Apenas não-Admin (executor) */}
                <Route path="minhas-obras" element={<ExecutorRoute><MinhasObras /></ExecutorRoute>} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="dividas" element={<Dividas />} />
                <Route path="calendario" element={<Calendario />} />
                <Route path="entidades" element={<Entidades />} />
                <Route path="entidades/:id" element={<EntidadeDetalhes />} />
                <Route path="propostas" element={<PropostasLista />} />
                <Route path="propostas/nova" element={<PropostaEditor />} />
                <Route path="propostas/:id" element={<PropostaEditor />} />
                <Route path="formacao-preco" element={<FormacaoPreco />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="anotacoes" element={<Anotacoes />} />
                <Route path="automacao-pdf" element={
                  <Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                      <CircularProgress size={48} sx={{ color: '#009246' }} />
                    </Box>
                  }>
                    <AutomacaoPdfNovo />
                  </Suspense>
                } />
                <Route path="clientes" element={<Navigate to="/entidades" replace />} />
                <Route path="funcionarios" element={<Navigate to="/entidades" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatedPage>
        )}
      </AnimatePresence>
    </BrowserRouter>
  );
};

function App() {
  return (
    <ThemeProvider theme={peperaioTheme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
