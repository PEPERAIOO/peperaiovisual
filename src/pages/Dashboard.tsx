import { useMemo } from 'react';
import { Box, Paper, Typography, Skeleton, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Construction as ConstructionIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  AttachMoney as AttachMoneyIcon,
  MoneyOff as MoneyOffIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { addDays, differenceInCalendarDays, startOfDay, parseISO } from 'date-fns';
import { DashboardCard, DashboardCardColor } from '../components/dashboard';
import { useAuth } from '../contexts/AuthContext';
import { useObras } from '../hooks/useObras';
import { useFinanceiro } from '../hooks/useFinanceiro';
import { useDividas } from '../hooks/useDividas';
import { useCompromissos } from '../hooks/useCompromissos';
import { isDividaAtrasada, formatCurrency as formatCurrencyFull } from '../types/dividas';

// Helper para formatar moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Interface para cards
interface StatCard {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendLabel?: string;
  color: DashboardCardColor;
}

// Ações rápidas
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { label: 'Nova Obra', icon: <AddIcon />, path: '/obras', color: '#009246' },
  { label: 'Lançar Receita', icon: <AttachMoneyIcon />, path: '/financeiro', color: '#2196f3' },
  { label: 'Lançar Despesa', icon: <MoneyOffIcon />, path: '/financeiro', color: '#ce2b37' },
  { label: 'Novo Cliente', icon: <PersonAddIcon />, path: '/entidades', color: '#ff9800' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const nomeUsuario = profile?.nome?.trim();
  
  // Hooks para dados reais - todos carregam automaticamente no mount
  const { obras, loading: loadingObras } = useObras();
  const { transactions, summary: financeiroSummary, loading: loadingFinanceiro } = useFinanceiro();
  const { dividas, summary: dividasSummary, loading: loadingDividas } = useDividas();
  const { compromissos, loading: loadingCompromissos } = useCompromissos();

  // Calcular estatísticas reais
  const statsData = useMemo<StatCard[]>(() => {
    // Obras ativas (status diferente de 'finalizada' e 'cancelada')
    const obrasAtivas = obras.filter(o => o.status !== 'concluida' && o.status !== 'cancelada');
    const obrasEsteMes = obras.filter(o => {
      const createdAt = new Date(o.created_at);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    });

    // Calcular saldo (receitas - despesas do mês)
    const saldo = financeiroSummary.saldo;

    // Contas a pagar (dívidas pendentes)
    const contasAPagar = dividasSummary.totalPendente;
    const parcelasPendentes = dividasSummary.qtdParcelasPendentes + dividasSummary.qtdDividasAtivas;

    // Faturamento mensal (receitas do mês)
    const faturamento = financeiroSummary.totalReceitas;

    return [
      {
        title: 'Obras Ativas',
        value: String(obrasAtivas.length),
        subtitle: `${obrasEsteMes.length} iniciadas este mês`,
        icon: <ConstructionIcon />,
        trend: obrasAtivas.length > 0 ? `${obrasAtivas.length}` : '0',
        trendLabel: 'em andamento',
        color: 'success',
      },
      {
        title: 'Saldo do Mês',
        value: formatCurrency(saldo),
        subtitle: saldo >= 0 ? 'Balanço positivo' : 'Balanço negativo',
        icon: <WalletIcon />,
        trend: saldo >= 0 ? '+' : '-',
        trendLabel: 'resultado',
        color: saldo >= 0 ? 'info' : 'error',
      },
      {
        title: 'Contas a Pagar',
        value: formatCurrency(contasAPagar),
        subtitle: `${parcelasPendentes} pendentes`,
        icon: <ReceiptIcon />,
        trend: String(parcelasPendentes),
        trendLabel: 'parcelas/dívidas',
        color: 'error',
      },
      {
        title: 'Faturamento Mensal',
        value: formatCurrency(faturamento),
        subtitle: `Despesas: ${formatCurrency(financeiroSummary.totalDespesas)}`,
        icon: <TrendingUpIcon />,
        trend: faturamento > 0 ? '+' : '',
        trendLabel: 'receitas',
        color: 'warning',
      },
    ];
  }, [obras, financeiroSummary, dividasSummary]);

  const muralDividas = useMemo(() => {
    const hoje = startOfDay(new Date());
    const limite = addDays(hoje, 5);

    return dividas
      .filter((d) => d.status !== 'pago' && d.status !== 'cancelado')
      .map((d) => {
        const vencimento = parseISO(d.data_vencimento);
        const dias = differenceInCalendarDays(vencimento, hoje);
        const atrasada = isDividaAtrasada(d.data_vencimento, d.status);

        if (atrasada) {
          return {
            id: d.id,
            descricao: d.descricao,
            valor: d.valor,
            data: vencimento,
            label: dias < 0 ? `Atrasada ${Math.abs(dias)}d` : 'Atrasada',
            color: '#ce2b37',
            bg: 'rgba(206, 43, 55, 0.12)',
          };
        }

        if (vencimento >= hoje && vencimento <= limite) {
          return {
            id: d.id,
            descricao: d.descricao,
            valor: d.valor,
            data: vencimento,
            label: dias === 0 ? 'Vence hoje' : `Vence em ${dias}d`,
            color: '#ff9800',
            bg: 'rgba(255, 152, 0, 0.15)',
          };
        }

        return null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.data.getTime() - b.data.getTime())
      .slice(0, 4);
  }, [dividas]);

  const muralCompromissos = useMemo(() => {
    const hoje = startOfDay(new Date());
    const limite = addDays(hoje, 7);

    return compromissos
      .filter((c) => !c.concluido)
      .map((c) => {
        const data = new Date(c.data_inicio);
        const dia = startOfDay(data);

        if (dia < hoje || dia > limite) return null;

        return {
          id: c.id,
          titulo: c.titulo,
          data,
          tipo: c.tipo,
          obra: c.obra?.nome,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.data.getTime() - b.data.getTime())
      .slice(0, 4);
  }, [compromissos]);

  // Estado de loading geral
  const isLoading = loadingObras || loadingFinanceiro || loadingDividas;

  return (
    <Box>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#f5f5f5',
              mb: 0.5,
            }}
          >
            {nomeUsuario ? `Bem-vindo, ${nomeUsuario}` : 'Bem-vindo'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 400,
            }}
          >
            Aqui está o resumo do seu negócio
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <DashboardCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                trend={stat.trend}
                trendLabel={stat.trendLabel}
                color={stat.color}
                subtitle={stat.subtitle}
              />
            </motion.div>
          ))}
        </Box>
      </motion.div>

      {/* Mural de Avisos */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 600,
              letterSpacing: 1.5,
              display: 'block',
              mb: 2,
            }}
          >
            Mural de Avisos
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                background: 'rgba(30, 30, 30, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 4,
                minHeight: 260,
                maxHeight: 260,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="body2" sx={{ color: '#f5f5f5', fontWeight: 600, mb: 2 }}>
                Dívidas em alerta
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1 }}>
                {loadingDividas ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Box key={index}>
                      <Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                      <Skeleton variant="text" width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                    </Box>
                  ))
                ) : muralDividas.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    Sem dívidas atrasadas ou vencendo nos próximos 5 dias.
                  </Typography>
                ) : (
                  muralDividas.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        background: item.bg,
                        border: `1px solid ${item.color}40`,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ color: '#f5f5f5', fontWeight: 600 }} noWrap>
                          {item.descricao}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          {item.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {formatCurrencyFull(item.valor)}
                        </Typography>
                      </Box>
                      <Chip
                        label={item.label}
                        size="small"
                        sx={{
                          bgcolor: item.bg,
                          color: item.color,
                          border: `1px solid ${item.color}50`,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  ))
                )}
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                background: 'rgba(30, 30, 30, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 4,
                minHeight: 260,
                maxHeight: 260,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="body2" sx={{ color: '#f5f5f5', fontWeight: 600, mb: 2 }}>
                Compromissos próximos
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1 }}>
                {loadingCompromissos ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Box key={index}>
                      <Skeleton variant="text" width="65%" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                      <Skeleton variant="text" width="45%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                    </Box>
                  ))
                ) : muralCompromissos.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    Nenhum compromisso nos próximos 7 dias.
                  </Typography>
                ) : (
                  muralCompromissos.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        background: 'rgba(33, 150, 243, 0.08)',
                        border: '1px solid rgba(33, 150, 243, 0.2)',
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ color: '#f5f5f5', fontWeight: 600 }} noWrap>
                          {item.titulo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          {item.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {item.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {item.obra ? ` • ${item.obra}` : ''}
                        </Typography>
                      </Box>
                      <Chip
                        label={item.tipo}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(33, 150, 243, 0.15)',
                          color: '#2196f3',
                          border: '1px solid rgba(33, 150, 243, 0.4)',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                    </Box>
                  ))
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </motion.div>

      {/* Quick Actions Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 600,
              letterSpacing: 1.5,
              display: 'block',
              mb: 2,
            }}
          >
            Ações Rápidas
          </Typography>
          
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            {quickActions.map((action) => (
              <Paper
                key={action.label}
                onClick={() => navigate(action.path)}
                sx={{
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  background: 'rgba(30, 30, 30, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 3,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: `${action.color}15`,
                    border: `1px solid ${action.color}50`,
                    transform: 'translateY(-2px)',
                    '& .action-icon': {
                      background: `${action.color}30`,
                      color: action.color,
                    },
                  },
                }}
              >
                <Box
                  className="action-icon"
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {action.icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 500,
                    textAlign: 'center',
                  }}
                >
                  {action.label}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="overline"
            sx={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 600,
              letterSpacing: 1.5,
              display: 'block',
              mb: 2,
            }}
          >
            Atividade Recente
          </Typography>
          
          <Paper
            elevation={0}
            sx={{
              background: 'rgba(30, 30, 30, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {isLoading ? (
              // Skeleton loading
              Array.from({ length: 4 }).map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderBottom: index < 3 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                  }}
                >
                  <Skeleton variant="circular" width={8} height={8} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Skeleton variant="text" width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                  </Box>
                  <Skeleton variant="text" width={60} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                </Box>
              ))
            ) : (
              // Dados reais - combinar transações recentes e obras
              (() => {
                // Formatar tempo relativo
                const formatRelativeTime = (dateStr: string) => {
                  const date = new Date(dateStr);
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  
                  if (diffHours < 1) return 'Agora';
                  if (diffHours < 24) return `Há ${diffHours}h`;
                  if (diffDays === 1) return 'Ontem';
                  if (diffDays < 7) return `Há ${diffDays} dias`;
                  return date.toLocaleDateString('pt-BR');
                };

                // Criar lista de atividades
                const activities: { action: string; detail: string; time: string; color: string; date: Date }[] = [];

                // Adicionar transações recentes
                transactions.slice(0, 5).forEach(t => {
                  const dateStr = t.created_at || t.data_pagamento || t.data_vencimento;
                  if (!dateStr) return;
                  activities.push({
                    action: t.tipo === 'receita' ? 'Receita lançada' : 'Despesa lançada',
                    detail: `${t.descricao} - ${formatCurrency(t.valor)}`,
                    time: formatRelativeTime(dateStr),
                    color: t.tipo === 'receita' ? '#2196f3' : '#ce2b37',
                    date: new Date(dateStr),
                  });
                });

                // Adicionar obras recentes
                obras.slice(0, 3).forEach(o => {
                  activities.push({
                    action: 'Obra cadastrada',
                    detail: o.nome,
                    time: formatRelativeTime(o.created_at),
                    color: '#009246',
                    date: new Date(o.created_at),
                  });
                });

                // Ordenar por data e pegar as 4 mais recentes
                const recentActivities = activities
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .slice(0, 4);

                // Fallback se não houver atividades
                if (recentActivities.length === 0) {
                  return (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        Nenhuma atividade recente
                      </Typography>
                    </Box>
                  );
                }

                return recentActivities.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      borderBottom: index < recentActivities.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                      transition: 'background 0.2s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.02)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#f5f5f5',
                          fontWeight: 500,
                        }}
                      >
                        {item.action}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {item.detail}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.3)',
                        flexShrink: 0,
                      }}
                    >
                      {item.time}
                    </Typography>
                  </Box>
                ));
              })()
            )}
          </Paper>
        </Box>
      </motion.div>
    </Box>
  );
};

export default Dashboard;
