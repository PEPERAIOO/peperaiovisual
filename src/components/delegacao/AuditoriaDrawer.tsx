import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Chip,
  Avatar,
  List,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon,
  OpenInNew as OpenInNewIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  ObraVerba,
  GastoDelegado,
  ResumoVerba,
  calcularResumoVerba,
  formatCurrency,
} from '../../types/delegacao';

interface AuditoriaDrawerProps {
  open: boolean;
  onClose: () => void;
  verba: ObraVerba | null;
  gastos: GastoDelegado[];
  loading: boolean;
  onAprovarGasto: (gastoId: string) => Promise<void>;
  onEstornarSaldo?: (valor: number) => Promise<void>; // Reserved for future use
  onFinalizarTudo: () => Promise<void>;
}

const AuditoriaDrawer = ({
  open,
  onClose,
  verba,
  gastos,
  loading,
  onAprovarGasto,
  // onEstornarSaldo, // Reserved for future use
  onFinalizarTudo,
}: AuditoriaDrawerProps) => {
  const [resumo, setResumo] = useState<ResumoVerba | null>(null);
  const [aprovando, setAprovando] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  // Calcular resumo
  useEffect(() => {
    if (verba) {
      setResumo(calcularResumoVerba(verba, gastos));
    }
  }, [verba, gastos]);

  const handleAprovarGasto = async (gastoId: string) => {
    setAprovando(gastoId);
    try {
      await onAprovarGasto(gastoId);
    } finally {
      setAprovando(null);
    }
  };

  const handleFinalizarTudo = async () => {
    setFinalizando(true);
    try {
      await onFinalizarTudo();
      onClose();
    } finally {
      setFinalizando(false);
    }
  };

  if (!verba) return null;

  // Todos os gastos na tabela são pendentes (os aprovados são excluídos)
  const gastosPendentes = gastos;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 500 },
          background: 'linear-gradient(180deg, rgba(25, 25, 25, 0.98) 0%, rgba(18, 18, 18, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Container com scroll para todo o conteúdo no mobile */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f5f5f5' }}>
              📋 Auditoria de Verba
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
              {verba.obra?.nome}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Avatar sx={{ width: 24, height: 24, bgcolor: '#009246', fontSize: '0.7rem' }}>
                {verba.delegado_para?.nome_completo?.charAt(0) || 'E'}
              </Avatar>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Executor: {verba.delegado_para?.nome_completo}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Resumo Financeiro */}
      {resumo && (
        <Box sx={{ p: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Resumo Financeiro
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, 
            gap: 2 
          }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'rgba(0, 146, 70, 0.1)',
                border: '1px solid rgba(0, 146, 70, 0.2)',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Verba Enviada
              </Typography>
              <Typography variant="h6" sx={{ color: '#009246', fontWeight: 700 }}>
                {formatCurrency(resumo.valorEnviado)}
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: 'rgba(206, 43, 55, 0.1)',
                border: '1px solid rgba(206, 43, 55, 0.2)',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Gasto Total
              </Typography>
              <Typography variant="h6" sx={{ color: '#ce2b37', fontWeight: 700 }}>
                {formatCurrency(resumo.gastoAcumulado)}
              </Typography>
            </Paper>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: resumo.saldoDisponivel >= 0 ? 'rgba(33, 150, 243, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                border: `1px solid ${resumo.saldoDisponivel >= 0 ? 'rgba(33, 150, 243, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`,
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Saldo
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: resumo.saldoDisponivel >= 0 ? '#2196f3' : '#f44336', fontWeight: 700 }}
              >
                {formatCurrency(resumo.saldoDisponivel)}
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

      {/* Lista de Gastos */}
      <Box sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#009246' }} />
          </Box>
        ) : (
          <>
            {/* Gastos Pendentes */}
            {gastosPendentes.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: '#ff9800',
                    mb: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 18 }} />
                  Pendentes de Aprovação ({gastosPendentes.length})
                </Typography>
                <List sx={{ p: 0 }}>
                  {gastosPendentes.map((gasto) => (
                    <Paper
                      key={gasto.id}
                      elevation={0}
                      sx={{
                        mb: 1.5,
                        p: 2,
                        bgcolor: 'rgba(255, 152, 0, 0.08)',
                        border: '1px solid rgba(255, 152, 0, 0.15)',
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
                            {gasto.descricao}
                          </Typography>
                          {gasto.funcionario_nome && (
                            <Typography variant="caption" sx={{ color: '#2196f3', display: 'block', mt: 0.5 }}>
                              👤 {gasto.funcionario_nome}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={gasto.categoria}
                              size="small"
                              sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', fontSize: '0.7rem' }}
                            />
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              {format(parseISO(gasto.created_at), 'dd/MM/yyyy')}
                            </Typography>
                          </Box>
                          {gasto.comprovante_url && (
                            <Button
                              size="small"
                              startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                              onClick={() => window.open(gasto.comprovante_url, '_blank')}
                              sx={{ mt: 1, color: '#2196f3', textTransform: 'none', fontSize: '0.75rem' }}
                            >
                              Ver Comprovante
                            </Button>
                          )}
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#ce2b37' }}>
                            {formatCurrency(gasto.valor)}
                          </Typography>
                          <Tooltip title="Aprovar Gasto">
                            <IconButton
                              size="small"
                              onClick={() => handleAprovarGasto(gasto.id)}
                              disabled={aprovando === gasto.id}
                              sx={{
                                mt: 1,
                                bgcolor: 'rgba(0, 146, 70, 0.15)',
                                color: '#009246',
                                '&:hover': { bgcolor: 'rgba(0, 146, 70, 0.25)' },
                              }}
                            >
                              {aprovando === gasto.id ? (
                                <CircularProgress size={16} sx={{ color: '#009246' }} />
                              ) : (
                                <DoneIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </List>
              </Box>
            )}

            {gastos.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <ReceiptIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.2)', mb: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  Nenhum gasto registrado
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Footer Actions - dentro do scroll no mobile */}
      <Box
        sx={{
          p: 3,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.3)',
          mt: 'auto',
        }}
      >
        {resumo && resumo.saldoDisponivel > 0 && gastosPendentes.length === 0 && (
          <Alert
            severity="info"
            icon={<UndoIcon />}
            sx={{ mb: 2, bgcolor: 'rgba(33, 150, 243, 0.1)' }}
          >
            Saldo de <strong>{formatCurrency(resumo.saldoDisponivel)}</strong> será estornado ao caixa.
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          startIcon={finalizando ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <DoneAllIcon />}
          onClick={handleFinalizarTudo}
          disabled={finalizando || gastos.length === 0}
          sx={{
            bgcolor: '#009246',
            '&:hover': { bgcolor: '#00b359' },
            py: 1.5,
            borderRadius: 2,
          }}
        >
          {finalizando ? 'Finalizando...' : 'Aprovar Tudo e Finalizar'}
        </Button>

        {gastosPendentes.length > 0 && (
          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', mt: 1.5, color: 'rgba(255, 255, 255, 0.4)' }}
          >
            {gastosPendentes.length} gasto(s) pendente(s) serão aprovados automaticamente
          </Typography>
        )}
      </Box>
      </Box>
    </Drawer>
  );
};

export default AuditoriaDrawer;
