import { Box, Paper, Typography } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { FinanceiroSummary } from '../../types/financeiro';

// Formatador de moeda BRL
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface SummaryCardsProps {
  summary: FinanceiroSummary;
  currentMonthLabel: string;
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const SummaryCard = ({ title, value, icon, color, bgColor }: SummaryCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, sm: 2.5 },
      background: 'rgba(30, 30, 30, 0.6)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
      },
    }}
  >
    <Box
      sx={{
        width: { xs: 40, sm: 48 },
        height: { xs: 40, sm: 48 },
        borderRadius: 2,
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontSize: '0.65rem',
          display: 'block',
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          color: color,
          fontWeight: 700,
          lineHeight: 1.2,
          fontSize: { xs: '1rem', sm: '1.25rem' },
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {currencyFormatter.format(value)}
      </Typography>
    </Box>
  </Paper>
);

const SummaryCards = ({ summary, currentMonthLabel }: SummaryCardsProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Título do mês */}
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontSize: '0.65rem',
          mb: 1.5,
          display: 'block',
        }}
      >
        Resumo de {currentMonthLabel}
      </Typography>

      {/* Cards de resumo */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(3, 1fr)',
          },
          gap: 2,
        }}
      >
        <SummaryCard
          title="Receitas"
          value={summary.totalReceitas}
          icon={<TrendingUpIcon />}
          color="#009246"
          bgColor="rgba(0, 146, 70, 0.15)"
        />
        <SummaryCard
          title="Despesas"
          value={summary.totalDespesas}
          icon={<TrendingDownIcon />}
          color="#ce2b37"
          bgColor="rgba(206, 43, 55, 0.15)"
        />
        <SummaryCard
          title="Saldo"
          value={summary.saldo}
          icon={<WalletIcon />}
          color={summary.saldo >= 0 ? '#009246' : '#ce2b37'}
          bgColor={summary.saldo >= 0 ? 'rgba(0, 146, 70, 0.15)' : 'rgba(206, 43, 55, 0.15)'}
        />
      </Box>
    </Box>
  );
};

export default SummaryCards;
