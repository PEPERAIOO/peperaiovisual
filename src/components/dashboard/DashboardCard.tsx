import { ReactNode } from 'react';
import { Paper, Box, Typography, Avatar, Chip, Stack } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

// Cores disponíveis para o card
export type DashboardCardColor = 'success' | 'error' | 'warning' | 'info' | 'primary';

// Configuração de cores
const COLOR_CONFIG: Record<DashboardCardColor, { bg: string; icon: string; light: string }> = {
  success: {
    bg: 'rgba(0, 146, 70, 0.12)',
    icon: '#009246',
    light: 'rgba(0, 146, 70, 0.08)',
  },
  error: {
    bg: 'rgba(206, 43, 55, 0.12)',
    icon: '#ce2b37',
    light: 'rgba(206, 43, 55, 0.08)',
  },
  warning: {
    bg: 'rgba(255, 152, 0, 0.12)',
    icon: '#ff9800',
    light: 'rgba(255, 152, 0, 0.08)',
  },
  info: {
    bg: 'rgba(33, 150, 243, 0.12)',
    icon: '#2196f3',
    light: 'rgba(33, 150, 243, 0.08)',
  },
  primary: {
    bg: 'rgba(255, 255, 255, 0.08)',
    icon: '#f5f5f5',
    light: 'rgba(255, 255, 255, 0.04)',
  },
};

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendLabel?: string;
  color?: DashboardCardColor;
  subtitle?: string;
}

const DashboardCard = ({
  title,
  value,
  icon,
  trend,
  trendLabel = 'vs mês anterior',
  color = 'primary',
  subtitle,
}: DashboardCardProps) => {
  const colorConfig = COLOR_CONFIG[color];
  
  // Determina se a tendência é positiva ou negativa
  const isTrendPositive = trend ? !trend.startsWith('-') : true;
  const trendColor = isTrendPositive ? '#009246' : '#ce2b37';
  const TrendIcon = isTrendPositive ? TrendingUpIcon : TrendingDownIcon;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 3,
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      {/* Header: Título + Ícone */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 700,
            letterSpacing: '1px',
            fontSize: '0.7rem',
            lineHeight: 1.5,
          }}
        >
          {title}
        </Typography>
        
        <Avatar
          variant="rounded"
          sx={{
            width: 44,
            height: 44,
            backgroundColor: colorConfig.bg,
            color: colorConfig.icon,
            borderRadius: 2,
          }}
        >
          {icon}
        </Avatar>
      </Box>

      {/* Valor Principal */}
      <Box sx={{ mt: 2, mb: trend ? 0 : 1 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#f5f5f5',
            fontSize: { xs: '1.75rem', md: '2rem' },
            lineHeight: 1.2,
          }}
        >
          {value}
        </Typography>
        
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.4)',
              mt: 0.5,
              fontSize: '0.8rem',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Footer: Tendência */}
      {trend && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <Chip
            icon={<TrendIcon sx={{ fontSize: 14, color: `${trendColor} !important` }} />}
            label={trend}
            size="small"
            sx={{
              height: 24,
              backgroundColor: isTrendPositive
                ? 'rgba(0, 146, 70, 0.12)'
                : 'rgba(206, 43, 55, 0.12)',
              color: trendColor,
              fontWeight: 700,
              fontSize: '0.75rem',
              '& .MuiChip-icon': {
                marginLeft: '6px',
              },
              '& .MuiChip-label': {
                paddingRight: '10px',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.75rem',
            }}
          >
            {trendLabel}
          </Typography>
        </Stack>
      )}
    </Paper>
  );
};

export default DashboardCard;
