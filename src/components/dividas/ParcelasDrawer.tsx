import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Checkbox,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Payment as PaymentIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { DividaTransacao, DividaParcela, formatCurrency, isDividaAtrasada } from '../../types/dividas';

interface ParcelasDrawerProps {
  open: boolean;
  onClose: () => void;
  divida: DividaTransacao | null;
  parcelas: DividaParcela[];
  onPagarParcelas: (parcelaIds: string[]) => Promise<{ success: boolean }>;
  canPay?: boolean;
}

const ParcelasDrawer = ({ open, onClose, divida, parcelas, onPagarParcelas, canPay = true }: ParcelasDrawerProps) => {
  const [selectedParcelas, setSelectedParcelas] = useState<string[]>([]);
  const [paying, setPaying] = useState(false);

  // Reset seleção ao abrir/fechar
  useEffect(() => {
    if (open) {
      setSelectedParcelas([]);
    }
  }, [open]);

  if (!divida) return null;

  // Cálculos
  const parcelasPendentes = parcelas.filter((p) => p.status === 'pendente' || p.status === 'atrasado');
  const parcelasPagas = parcelas.filter((p) => p.status === 'pago');
  const totalPago = parcelasPagas.reduce((acc, p) => acc + p.valor, 0);
  const totalPendente = parcelasPendentes.reduce((acc, p) => acc + p.valor, 0);
  const progresso = parcelas.length > 0 ? (parcelasPagas.length / parcelas.length) * 100 : 0;

  // Valor total selecionado
  const valorSelecionado = parcelas
    .filter((p) => selectedParcelas.includes(p.id))
    .reduce((acc, p) => acc + p.valor, 0);

  // Handlers
  const handleSelectParcela = (id: string) => {
    setSelectedParcelas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (!canPay) return;
    if (checked) {
      setSelectedParcelas(parcelasPendentes.map((p) => p.id));
    } else {
      setSelectedParcelas([]);
    }
  };

  const handlePagar = async () => {
    if (!canPay) return;
    if (selectedParcelas.length === 0) return;
    setPaying(true);
    try {
      const result = await onPagarParcelas(selectedParcelas);
      if (result.success) {
        setSelectedParcelas([]);
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 450 },
          backgroundColor: '#1a1a1a',
          backgroundImage: 'none',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(135deg, rgba(206, 43, 55, 0.15) 0%, rgba(206, 43, 55, 0.05) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1.5 }}>
              Gerenciar Parcelas
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f5f5f5', mt: 0.5 }}>
              {divida.descricao}
            </Typography>
            {divida.entidade && (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 0.5 }}>
                Credor: {divida.entidade.nome}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Barra de progresso */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {parcelasPagas.length} de {parcelas.length} parcelas pagas
            </Typography>
            <Typography variant="caption" sx={{ color: '#009246', fontWeight: 600 }}>
              {progresso.toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progresso}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#009246',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Resumo de valores */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'rgba(0, 146, 70, 0.1)',
              border: '1px solid rgba(0, 146, 70, 0.2)',
            }}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Pago
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#009246' }}>
              {formatCurrency(totalPago)}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
            }}
          >
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Pendente
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#ff9800' }}>
              {formatCurrency(totalPendente)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Lista de parcelas */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  <Checkbox
                    indeterminate={selectedParcelas.length > 0 && selectedParcelas.length < parcelasPendentes.length}
                    checked={parcelasPendentes.length > 0 && selectedParcelas.length === parcelasPendentes.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    disabled={!canPay || parcelasPendentes.length === 0}
                    sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                  />
                </TableCell>
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  Parcela
                </TableCell>
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  Vencimento
                </TableCell>
                <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  Valor
                </TableCell>
                <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parcelas.map((parcela) => {
                const isAtrasada = isDividaAtrasada(parcela.data_vencimento, parcela.status);
                const isPago = parcela.status === 'pago';
                return (
                  <TableRow
                    key={parcela.id}
                    hover
                    selected={selectedParcelas.includes(parcela.id)}
                    sx={{
                      opacity: isPago ? 0.6 : 1,
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' },
                      '&.Mui-selected': { bgcolor: 'rgba(206, 43, 55, 0.08)' },
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <Checkbox
                        checked={selectedParcelas.includes(parcela.id)}
                        onChange={() => handleSelectParcela(parcela.id)}
                        disabled={!canPay || isPago}
                        sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <Typography variant="body2" sx={{ color: '#f5f5f5', fontWeight: 600 }}>
                        {parcela.numero_parcela}/{divida.numero_parcelas}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 14, color: isAtrasada ? '#ce2b37' : 'rgba(255, 255, 255, 0.4)' }} />
                        <Typography
                          variant="body2"
                          sx={{ color: isAtrasada ? '#ce2b37' : 'rgba(255, 255, 255, 0.7)' }}
                        >
                          {format(new Date(parcela.data_vencimento), 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <Typography
                        variant="body2"
                        sx={{ color: isPago ? '#009246' : '#f5f5f5', fontWeight: 600 }}
                      >
                        {formatCurrency(parcela.valor)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                      <Chip
                        label={isPago ? 'Pago' : isAtrasada ? 'Atrasado' : 'Pendente'}
                        size="small"
                        sx={{
                          bgcolor: isPago
                            ? 'rgba(0, 146, 70, 0.15)'
                            : isAtrasada
                            ? 'rgba(206, 43, 55, 0.15)'
                            : 'rgba(255, 152, 0, 0.15)',
                          color: isPago ? '#009246' : isAtrasada ? '#ce2b37' : '#ff9800',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Footer com ação de pagamento */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        {selectedParcelas.length > 0 && canPay ? (
          <>
            <Alert
              severity="info"
              icon={false}
              sx={{
                mb: 2,
                bgcolor: 'rgba(206, 43, 55, 0.1)',
                color: '#ce2b37',
                border: '1px solid rgba(206, 43, 55, 0.2)',
              }}
            >
              <Typography variant="body2">
                <strong>{selectedParcelas.length}</strong> parcela(s) selecionada(s)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                Total: {formatCurrency(valorSelecionado)}
              </Typography>
            </Alert>
            <Button
              fullWidth
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={handlePagar}
              disabled={paying}
              sx={{
                bgcolor: '#009246',
                '&:hover': { bgcolor: '#007838' },
                textTransform: 'none',
                fontWeight: 600,
                py: 1.2,
              }}
            >
              {paying ? 'Processando...' : `Pagar ${selectedParcelas.length} Parcela(s)`}
            </Button>
          </>
        ) : (
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
            {canPay ? 'Selecione parcelas para realizar o pagamento' : 'Pagamento de parcelas indisponível para este usuário'}
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};

export default ParcelasDrawer;
