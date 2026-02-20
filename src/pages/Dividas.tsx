import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Avatar,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  Layers as LayersIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

// Componentes
import { DividasModal, ParcelasDrawer } from '../components/dividas';

// Hook e tipos
import { useDividas } from '../hooks/useDividas';
import { usePermissions } from '../hooks/usePermissions';
import { DividaTransacao, formatCurrency, isDividaAtrasada } from '../types/dividas';

// Filtros
type FiltroStatus = 'todas' | 'pendentes' | 'atrasadas' | 'pagas';

const Dividas = () => {
  const {
    dividas,
    summary,
    loading,
    error,
    addDivida,
    pagarDivida,
    pagarParcelas,
    getParcelasDivida,
    deleteDivida,
    reload,
  } = useDividas();

  const { canEdit } = usePermissions();
  const canManageDividas = canEdit();

  // Estados
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDivida, setSelectedDivida] = useState<DividaTransacao | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('pendentes');

  // Filtrar dívidas
  const dividasFiltradas = useMemo(() => {
    let result = [...dividas];

    // Filtro por status
    switch (filtroStatus) {
      case 'pendentes':
        result = result.filter((d) => d.status === 'pendente' && !isDividaAtrasada(d.data_vencimento, d.status));
        break;
      case 'atrasadas':
        result = result.filter((d) => d.status === 'atrasado' || isDividaAtrasada(d.data_vencimento, d.status));
        break;
      case 'pagas':
        result = result.filter((d) => d.status === 'pago');
        break;
      // 'todas' não filtra
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.descricao.toLowerCase().includes(term) ||
          d.entidade?.nome?.toLowerCase().includes(term) ||
          d.categoria.toLowerCase().includes(term)
      );
    }

    return result;
  }, [dividas, filtroStatus, searchTerm]);

  // Handlers
  const handleOpenParcelas = useCallback((divida: DividaTransacao) => {
    setSelectedDivida(divida);
    setDrawerOpen(true);
  }, []);

  const handlePagar = useCallback(
    async (divida: DividaTransacao) => {
      if (!canManageDividas) return;
      if (divida.is_parcelada) {
        handleOpenParcelas(divida);
      } else {
        if (window.confirm(`Confirma o pagamento de ${formatCurrency(divida.valor)}?`)) {
          await pagarDivida(divida.id);
        }
      }
    },
    [handleOpenParcelas, pagarDivida, canManageDividas]
  );

  const handleExcluir = useCallback(
    async (divida: DividaTransacao) => {
      if (!canManageDividas) return;
      if (window.confirm(`Deseja realmente excluir a dívida "${divida.descricao}"?`)) {
        await deleteDivida(divida.id);
      }
    },
    [deleteDivida, canManageDividas]
  );

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ width: 150, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, mb: 1 }} />
          <Box sx={{ width: 250, height: 20, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ height: 100, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ height: 250, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'hidden', maxWidth: '100%' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              💳 Dívidas
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Gerencie suas dívidas e parcelamentos
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={reload}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { borderColor: 'rgba(255, 255, 255, 0.4)', bgcolor: 'rgba(255, 255, 255, 0.05)' },
              }}
            >
              Atualizar
            </Button>
            {canManageDividas && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setModalOpen(true)}
                sx={{
                  bgcolor: '#ce2b37',
                  '&:hover': { bgcolor: '#b02430' },
                  boxShadow: '0 4px 12px rgba(206, 43, 55, 0.3)',
                }}
              >
                Nova Dívida
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* Cards de resumo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: { xs: 1.5, sm: 2 },
            mb: 3,
          }}
        >
          {/* Total Pendente */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              background: 'rgba(206, 43, 55, 0.1)',
              border: '1px solid rgba(206, 43, 55, 0.2)',
              borderRadius: 3,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <Avatar sx={{ bgcolor: 'rgba(206, 43, 55, 0.2)', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                <TrendingDownIcon sx={{ color: '#ce2b37', fontSize: { xs: 18, sm: 24 } }} />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block' }} noWrap>
                  Total Pendente
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ce2b37', fontSize: { xs: '0.95rem', sm: '1.25rem' } }} noWrap>
                  {formatCurrency(summary.totalPendente)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Total Pago */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              background: 'rgba(0, 146, 70, 0.1)',
              border: '1px solid rgba(0, 146, 70, 0.2)',
              borderRadius: 3,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <Avatar sx={{ bgcolor: 'rgba(0, 146, 70, 0.2)', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                <CheckCircleIcon sx={{ color: '#009246', fontSize: { xs: 18, sm: 24 } }} />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block' }} noWrap>
                  Total Pago
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#009246', fontSize: { xs: '0.95rem', sm: '1.25rem' } }} noWrap>
                  {formatCurrency(summary.totalPago)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Dívidas Ativas */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              borderRadius: 3,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                <ScheduleIcon sx={{ color: '#ff9800', fontSize: { xs: 18, sm: 24 } }} />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block' }} noWrap>
                  Dívidas Ativas
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800', fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                  {summary.qtdDividasAtivas}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Parcelas Pendentes */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              background: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              borderRadius: 3,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.2)', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                <LayersIcon sx={{ color: '#2196f3', fontSize: { xs: 18, sm: 24 } }} />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block' }} noWrap>
                  Parcelas Pendentes
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2196f3', fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                  {summary.qtdParcelasPendentes}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </motion.div>

      {/* Toolbar de filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            background: 'rgba(30, 30, 30, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          {/* Busca */}
          <TextField
            placeholder="Buscar dívida..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#ce2b37' },
              },
              '& .MuiInputBase-input': { color: '#f5f5f5' },
            }}
          />

          {/* Toggle de filtro por status - com scroll horizontal no mobile */}
          <Box sx={{ width: '100%', overflow: 'auto', pb: 0.5 }}>
            <ToggleButtonGroup
              value={filtroStatus}
              exclusive
              onChange={(_, value) => value && setFiltroStatus(value)}
              size="small"
              sx={{
                minWidth: 'fit-content',
                '& .MuiToggleButton-root': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  textTransform: 'none',
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(206, 43, 55, 0.2)',
                    color: '#ce2b37',
                    borderColor: 'rgba(206, 43, 55, 0.3)',
                    '&:hover': { bgcolor: 'rgba(206, 43, 55, 0.3)' },
                  },
                },
              }}
            >
              <ToggleButton value="todas">Todas</ToggleButton>
              <ToggleButton value="pendentes">Pendentes</ToggleButton>
              <ToggleButton value="atrasadas">Atrasadas</ToggleButton>
              <ToggleButton value="pagas">Pagas</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Paper>
      </motion.div>

      {/* Cards de Dívidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {dividasFiltradas.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'rgba(30, 30, 30, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 4,
            }}
          >
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Nenhuma dívida encontrada
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
            {dividasFiltradas.map((divida) => {
              const isAtrasada = isDividaAtrasada(divida.data_vencimento, divida.status);
              const isPaga = divida.status === 'pago';

              return (
                <Paper
                  key={divida.id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    background: isPaga 
                      ? 'rgba(0, 146, 70, 0.08)' 
                      : isAtrasada 
                      ? 'rgba(206, 43, 55, 0.1)' 
                      : 'rgba(30, 30, 30, 0.6)',
                    backdropFilter: 'blur(12px)',
                    border: isPaga
                      ? '1px solid rgba(0, 146, 70, 0.3)'
                      : isAtrasada
                      ? '1px solid rgba(206, 43, 55, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: isPaga
                        ? '0 8px 24px rgba(0, 146, 70, 0.2)'
                        : isAtrasada
                        ? '0 8px 24px rgba(206, 43, 55, 0.2)'
                        : '0 8px 24px rgba(0, 0, 0, 0.3)',
                    },
                  }}
                >
                  {/* Header do Card */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ color: '#f5f5f5', fontWeight: 700, mb: 0.5 }}>
                        {divida.descricao}
                      </Typography>
                      {divida.entidade && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <PersonIcon sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.4)' }} />
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {divida.entidade.nome}
                          </Typography>
                        </Box>
                      )}
                      <Chip
                        label={divida.categoria}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                    </Box>

                    {/* Status Badge */}
                    {isPaga && (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        label="Pago"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0, 146, 70, 0.2)',
                          color: '#009246',
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: '#009246' },
                        }}
                      />
                    )}
                    {isAtrasada && !isPaga && (
                      <Chip
                        icon={<WarningIcon sx={{ fontSize: 16 }} />}
                        label="Atrasado"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(206, 43, 55, 0.2)',
                          color: '#ce2b37',
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: '#ce2b37' },
                        }}
                      />
                    )}
                    {!isPaga && !isAtrasada && (
                      <Chip
                        icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                        label="Pendente"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 152, 0, 0.2)',
                          color: '#ff9800',
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: '#ff9800' },
                        }}
                      />
                    )}
                  </Box>

                  {/* Informações Principais */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: isAtrasada ? '#ce2b37' : 'rgba(255, 255, 255, 0.4)' }} />
                        <Typography variant="body2" sx={{ color: isAtrasada ? '#ce2b37' : 'rgba(255, 255, 255, 0.7)', fontWeight: isAtrasada ? 600 : 400 }}>
                          {format(parseISO(divida.data_vencimento), 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                      <Typography variant="h5" sx={{ color: isPaga ? '#009246' : '#ce2b37', fontWeight: 700 }}>
                        {formatCurrency(divida.valor)}
                      </Typography>
                    </Box>

                    {/* Parcelamento */}
                    {divida.is_parcelada && (
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(33, 150, 243, 0.1)', 
                        border: '1px solid rgba(33, 150, 243, 0.2)',
                        mb: 1.5
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <LayersIcon sx={{ fontSize: 18, color: '#2196f3' }} />
                          <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 600 }}>
                            Parcelamento
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {divida.parcelas_pagas || 0} de {divida.numero_parcelas} pagas
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          {(divida.numero_parcelas || 0) - (divida.parcelas_pagas || 0)} parcelas pendentes
                        </Typography>
                      </Box>
                    )}

                    {/* Observação */}
                    {divida.observacao && (
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 0.5 }}>
                          Observação:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {divida.observacao}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Ações */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {!isPaga && canManageDividas && (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={divida.is_parcelada ? <LayersIcon /> : <PaymentIcon />}
                        onClick={() => handlePagar(divida)}
                        sx={{
                          bgcolor: '#009246',
                          '&:hover': { bgcolor: '#00b359' },
                          fontWeight: 600,
                          textTransform: 'none',
                          flex: 1,
                        }}
                      >
                        {divida.is_parcelada ? 'Gerenciar Parcelas' : 'Pagar'}
                      </Button>
                    )}
                    {canManageDividas && (
                      <Button
                        fullWidth
                        variant={isPaga ? 'contained' : 'outlined'}
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => handleExcluir(divida)}
                        sx={{
                          color: '#ce2b37',
                          borderColor: 'rgba(206, 43, 55, 0.5)',
                          bgcolor: isPaga ? 'rgba(206, 43, 55, 0.15)' : 'transparent',
                          '&:hover': {
                            borderColor: '#ce2b37',
                            bgcolor: 'rgba(206, 43, 55, 0.12)',
                          },
                          fontWeight: 600,
                          textTransform: 'none',
                          flex: 1,
                        }}
                      >
                        Excluir
                      </Button>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </motion.div>

      {/* Modal de nova dívida */}
      {canManageDividas && (
        <DividasModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={addDivida}
        />
      )}

      {/* Drawer de parcelas */}
      <ParcelasDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedDivida(null);
        }}
        divida={selectedDivida}
        parcelas={selectedDivida ? getParcelasDivida(selectedDivida.id) : []}
        onPagarParcelas={async (ids) => {
          if (!canManageDividas) return { success: false };
          return pagarParcelas(ids);
        }}
        canPay={canManageDividas}
      />
    </Box>
  );
};

export default Dividas;
