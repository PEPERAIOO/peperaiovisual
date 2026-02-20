import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Button,
  Badge,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  Construction as ConstructionIcon,
  Payment as PaymentIcon,
  DoneAll as DoneAllIcon,
  DeleteSweep as DeleteSweepIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotifications, NotificationType, NotificationPriority } from '../../hooks/useNotifications';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Centro de Notificações - Drawer lateral com todas as notificações
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const {
    notificacoes,
    loading,
    stats,
    carregarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    limparLidas,
  } = useNotifications();

  const getIconByType = (tipo: NotificationType) => {
    switch (tipo) {
      case 'compromisso':
        return <EventIcon />;
      case 'divida':
        return <MoneyIcon />;
      case 'financeiro':
        return <ReceiptIcon />;
      case 'proposta':
        return <DescriptionIcon />;
      case 'obra':
        return <ConstructionIcon />;
      case 'pagamento':
        return <PaymentIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getPriorityColor = (prioridade: NotificationPriority) => {
    switch (prioridade) {
      case 'urgente':
        return '#CF2734'; // Vermelho italiano
      case 'alta':
        return '#FF6B00';
      case 'media':
        return '#FFB800';
      case 'baixa':
        return '#009B3A'; // Verde italiano
      default:
        return '#666666';
    }
  };

  const getPriorityLabel = (prioridade: NotificationPriority) => {
    switch (prioridade) {
      case 'urgente':
        return 'Urgente';
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return 'Normal';
    }
  };

  const getDiasRestantesText = (dias: number) => {
    if (dias < 0) return `Vencido há ${Math.abs(dias)} dia(s)`;
    if (dias === 0) return 'Vence hoje';
    if (dias === 1) return 'Vence amanhã';
    return `Vence em ${dias} dia(s)`;
  };

  const handleNotificationClick = (notificacao: any) => {
    marcarComoLida(notificacao.id);
    if (notificacao.link) {
      navigate(notificacao.link);
      onClose();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          bgcolor: '#1a1a1a',
          color: '#E0E0E0',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          bgcolor: '#222222',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontWeight="bold">
            🔔 Notificações
          </Typography>
          <Badge badgeContent={stats.naoLidas} color="error" />
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#E0E0E0' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Stats Bar */}
      <Box
        sx={{
          p: 2,
          bgcolor: '#1E1E1E',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box display="flex" gap={1} flexWrap="wrap">
          {stats.urgentes > 0 && (
            <Chip
              label={`${stats.urgentes} Urgente${stats.urgentes > 1 ? 's' : ''}`}
              size="small"
              sx={{
                bgcolor: alpha('#CF2734', 0.2),
                color: '#CF2734',
                fontWeight: 'bold',
              }}
            />
          )}
          {stats.altas > 0 && (
            <Chip
              label={`${stats.altas} Alta${stats.altas > 1 ? 's' : ''}`}
              size="small"
              sx={{
                bgcolor: alpha('#FF6B00', 0.2),
                color: '#FF6B00',
              }}
            />
          )}
          {stats.medias > 0 && (
            <Chip
              label={`${stats.medias} Média${stats.medias > 1 ? 's' : ''}`}
              size="small"
              sx={{
                bgcolor: alpha('#FFB800', 0.2),
                color: '#FFB800',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Actions Bar */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          gap: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: '#1a1a1a',
        }}
      >
        <Tooltip title="Atualizar">
          <IconButton
            size="small"
            onClick={carregarNotificacoes}
            disabled={loading}
            sx={{ color: '#E0E0E0' }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Marcar todas como lidas">
          <IconButton
            size="small"
            onClick={marcarTodasComoLidas}
            disabled={stats.naoLidas === 0}
            sx={{ color: '#E0E0E0' }}
          >
            <DoneAllIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Limpar lidas">
          <IconButton
            size="small"
            onClick={limparLidas}
            disabled={stats.naoLidas === stats.total}
            sx={{ color: '#E0E0E0' }}
          >
            <DeleteSweepIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Notifications List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading && notificacoes.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: '#888888',
            }}
          >
            <Typography>Carregando notificações...</Typography>
          </Box>
        ) : notificacoes.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: '#888888',
            }}
          >
            <Typography variant="h6" gutterBottom>
              🎉 Nenhuma notificação
            </Typography>
            <Typography variant="body2">
              Você está em dia com todos os compromissos!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notificacoes.map((notificacao, index) => (
              <React.Fragment key={notificacao.id}>
                {index > 0 && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />}
                <ListItem
                  disablePadding
                  sx={{
                    bgcolor: notificacao.lida
                      ? 'transparent'
                      : alpha(getPriorityColor(notificacao.prioridade), 0.05),
                  }}
                >
                  <ListItemButton
                    onClick={() => handleNotificationClick(notificacao)}
                    sx={{
                      py: 2,
                      px: 2.5,
                      borderLeft: `4px solid ${getPriorityColor(notificacao.prioridade)}`,
                      '&:hover': {
                        bgcolor: alpha(getPriorityColor(notificacao.prioridade), 0.1),
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: getPriorityColor(notificacao.prioridade),
                      }}
                    >
                      {getIconByType(notificacao.tipo)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography
                            variant="body2"
                            fontWeight={notificacao.lida ? 'normal' : 'bold'}
                            sx={{
                              color: notificacao.lida ? '#AAAAAA' : '#FFFFFF',
                              flex: 1,
                            }}
                          >
                            {notificacao.titulo}
                          </Typography>
                          {!notificacao.lida && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: getPriorityColor(notificacao.prioridade),
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: notificacao.lida ? '#666666' : '#CCCCCC',
                              mb: 0.5,
                            }}
                          >
                            {notificacao.mensagem}
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                            <Chip
                              label={getDiasRestantesText(notificacao.dias_antecedencia)}
                              size="small"
                              sx={{
                                bgcolor: alpha(getPriorityColor(notificacao.prioridade), 0.2),
                                color: getPriorityColor(notificacao.prioridade),
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                            <Chip
                              label={format(notificacao.data_referencia, "dd 'de' MMM", {
                                locale: ptBR,
                              })}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                color: '#AAAAAA',
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                            <Chip
                              label={getPriorityLabel(notificacao.prioridade)}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                color: '#888888',
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      {notificacoes.length > 0 && (
        <Box
          sx={{
            p: 2,
            bgcolor: '#222222',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="#888888">
            {stats.total} notificação{stats.total !== 1 ? 'ões' : ''} •{' '}
            {stats.naoLidas} não lida{stats.naoLidas !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};
