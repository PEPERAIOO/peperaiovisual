import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Skeleton,
  Alert,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Construction as ConstructionIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useObrasDelegadas } from '../hooks/useObrasDelegadas';
import supabase from '../lib/supabaseClient';
import { DelegarObraModal, AuditoriaDrawer } from '../components/delegacao';
import {
  ObraVerba,
  GastoDelegado,
  VERBA_STATUS_CONFIG,
  formatCurrency,
} from '../types/delegacao';

type FiltroStatus = 'todas' | 'pendente_envio' | 'ativa' | 'prestacao_pendente' | 'finalizada';

const GestaoObras = () => {
  const {
    verbas,
    obras,
    socios,
    loading,
    error,
    loadVerbas,
    loadObras,
    loadSocios,
    loadGastos,
    criarDelegacao,
    enviarVerba,
    excluirDelegacao,
    adicionarVerba,
    aprovarGasto,
    estornarSaldo,
    finalizarAuditoria,
  } = useObrasDelegadas();

  // Estados
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVerba, setSelectedVerba] = useState<ObraVerba | null>(null);
  const [gastosVerba, setGastosVerba] = useState<GastoDelegado[]>([]);
  const [loadingGastos, setLoadingGastos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');
  const [enviando, setEnviando] = useState<string | null>(null);
  const [modalMaisVerba, setModalMaisVerba] = useState(false);
  const [verbaParaAdicionar, setVerbaParaAdicionar] = useState<ObraVerba | null>(null);
  const [valorAdicional, setValorAdicional] = useState('');

  // Carregar dados iniciais
  useEffect(() => {
    loadVerbas();
    loadObras();
    loadSocios();
  }, [loadVerbas, loadObras, loadSocios]);

  // Filtrar verbas
  const verbasFiltradas = verbas.filter((v) => {
    // Filtro por status
    if (filtroStatus !== 'todas' && v.status !== filtroStatus) return false;

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        v.obra?.nome?.toLowerCase().includes(term) ||
        v.delegado_para?.nome_completo?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Handlers
  const handleEnviarVerba = async (verbaId: string) => {
    if (!window.confirm('Confirma o envio da verba? Uma despesa será registrada no caixa.')) return;

    setEnviando(verbaId);
    try {
      await enviarVerba(verbaId);
    } finally {
      setEnviando(null);
    }
  };

  const handleExcluirDelegacao = async (verbaId: string, nomeObra: string) => {
    if (!window.confirm(`Confirma a exclusão da delegação da obra "${nomeObra}"?\n\nEsta ação não pode ser desfeita.`)) return;

    try {
      const result = await excluirDelegacao(verbaId);
      if (!result.success) {
        alert('Erro: Apenas delegações pendentes podem ser excluídas.');
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir delegação');
    }
  };

  const handleExcluirObraFinalizada = async (verbaId: string, nomeObra: string) => {
    if (!window.confirm(`Confirma a exclusão da obra finalizada "${nomeObra}"?\n\nEsta ação irá remover permanentemente todos os dados desta delegação.`)) return;

    try {
      // Para obras finalizadas, fazemos uma exclusão direta sem validação de status
      const { error } = await supabase
        .from('obras_verbas')
        .delete()
        .eq('id', verbaId);

      if (error) {
        console.error('Erro ao excluir obra finalizada:', error);
        alert('Erro ao excluir obra finalizada: ' + error.message);
      } else {
        // Recarregar a lista de verbas
        loadVerbas();
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir obra finalizada');
    }
  };

  // Abrir modal para adicionar mais verba
  const handleAdicionarVerba = (verba: ObraVerba) => {
    setVerbaParaAdicionar(verba);
    setValorAdicional('');
    setModalMaisVerba(true);
  };

  // Confirmar adição de verba
  const handleConfirmarAdicionarVerba = async () => {
    if (!verbaParaAdicionar || !valorAdicional) return;
    const valor = parseFloat(valorAdicional);
    if (isNaN(valor) || valor <= 0) {
      alert('Informe um valor válido');
      return;
    }
    
    setEnviando(verbaParaAdicionar.id);
    try {
      await adicionarVerba(verbaParaAdicionar.id, valor);
      setModalMaisVerba(false);
      setVerbaParaAdicionar(null);
    } finally {
      setEnviando(null);
    }
  };

  const handleOpenAuditoria = async (verba: ObraVerba) => {
    setSelectedVerba(verba);
    setDrawerOpen(true);
    setLoadingGastos(true);
    try {
      const gastos = await loadGastos(verba.id);
      setGastosVerba(gastos);
    } finally {
      setLoadingGastos(false);
    }
  };

  const handleAprovarGasto = async (gastoId: string) => {
    if (!selectedVerba) return;
    
    try {
      const result = await aprovarGasto(gastoId, selectedVerba.id, selectedVerba.obra_id);
      
      if (!result.success) {
        console.error('Erro ao aprovar gasto:', result.error);
        alert('Erro ao aprovar gasto. Verifique o console para mais detalhes.');
        return;
      }
      
      // Recarregar gastos
      const gastos = await loadGastos(selectedVerba.id);
      setGastosVerba(gastos);
    } catch (err) {
      console.error('Erro inesperado ao aprovar gasto:', err);
      alert('Erro inesperado ao aprovar gasto.');
    }
  };

  const handleEstornar = async (valor: number) => {
    if (!selectedVerba) return;
    await estornarSaldo(selectedVerba.id, valor, selectedVerba.obra_id);
  };

  const handleFinalizarAuditoria = async () => {
    if (!selectedVerba) return;
    await finalizarAuditoria(selectedVerba.id, selectedVerba.obra_id);
    setDrawerOpen(false);
    loadVerbas();
  };

  // Estatísticas
  const stats = {
    pendentes: verbas.filter((v) => v.status === 'pendente_envio').length,
    ativas: verbas.filter((v) => v.status === 'ativa').length,
    prestacao: verbas.filter((v) => v.status === 'prestacao_pendente').length,
    valorTotal: verbas
      .filter((v) => ['pendente_envio', 'ativa', 'prestacao_pendente'].includes(v.status))
      .reduce((acc, v) => acc + v.valor_delegado, 0),
  };

  // Loading
  if (loading && verbas.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 3 }} />
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'hidden', maxWidth: '100%' }}>
        {/* Header */}
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
                background: 'linear-gradient(135deg, #009246, #00b359)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              🏗️ Gestão de Obras
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Delegue obras e gerencie verbas
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadVerbas}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              Atualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
              sx={{
                bgcolor: '#009246',
                '&:hover': { bgcolor: '#00b359' },
                boxShadow: '0 4px 12px rgba(0, 146, 70, 0.3)',
              }}
            >
              Nova Delegação
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: { xs: 1.5, sm: 2 },
            mb: 3,
            overflow: 'hidden',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              bgcolor: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              borderRadius: 3,
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', width: 36, height: 36, flexShrink: 0 }}>
                <ScheduleIcon sx={{ color: '#ff9800', fontSize: 20 }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }} noWrap>
                  Pend. Envio
                </Typography>
                <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 700 }} noWrap>
                  {stats.pendentes}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
              borderRadius: 3,
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.2)', width: 36, height: 36, flexShrink: 0 }}>
                <PlayIcon sx={{ color: '#4caf50', fontSize: 20 }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }} noWrap>
                  Ativas
                </Typography>
                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 700 }} noWrap>
                  {stats.ativas}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              borderRadius: 3,
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.2)', width: 36, height: 36, flexShrink: 0 }}>
                <AssignmentIcon sx={{ color: '#2196f3', fontSize: 20 }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }} noWrap>
                  Prestação
                </Typography>
                <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 700 }} noWrap>
                  {stats.prestacao}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              bgcolor: 'rgba(206, 43, 55, 0.1)',
              border: '1px solid rgba(206, 43, 55, 0.2)',
              borderRadius: 3,
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Avatar sx={{ bgcolor: 'rgba(206, 43, 55, 0.2)', width: 36, height: 36, flexShrink: 0 }}>
                <MoneyIcon sx={{ color: '#ce2b37', fontSize: 20 }} />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }} noWrap>
                  Total Delegado
                </Typography>
                <Typography variant="h6" sx={{ color: '#ce2b37', fontWeight: 700, fontSize: { xs: '0.85rem', sm: '1.25rem' } }} noWrap>
                  {formatCurrency(stats.valorTotal)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Filtros */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 3,
            bgcolor: 'rgba(30, 30, 30, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <TextField
            placeholder="Buscar por obra ou executor..."
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
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              },
            }}
          />
          <Box sx={{ width: '100%', overflow: 'auto' }}>
            <ToggleButtonGroup
              value={filtroStatus}
              exclusive
              onChange={(_, v) => v && setFiltroStatus(v)}
              size="small"
              sx={{
                minWidth: 'fit-content',
                '& .MuiToggleButton-root': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  textTransform: 'none',
                  px: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(0, 146, 70, 0.2)',
                    color: '#009246',
                    borderColor: 'rgba(0, 146, 70, 0.3)',
                  },
                },
              }}
            >
              <ToggleButton value="todas">Todas</ToggleButton>
              <ToggleButton value="pendente_envio">Pend. Envio</ToggleButton>
              <ToggleButton value="ativa">Ativas</ToggleButton>
              <ToggleButton value="prestacao_pendente">Prestação</ToggleButton>
              <ToggleButton value="finalizada">Finalizadas</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Paper>

        {/* Error */}
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Grid de Cards */}
        <Grid container spacing={2}>
          {verbasFiltradas.map((verba) => {
            const statusConfig = VERBA_STATUS_CONFIG[verba.status];

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={verba.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: 'rgba(30, 30, 30, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 3,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'rgba(0, 146, 70, 0.3)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f5f5f5' }} noWrap>
                            {verba.obra?.nome || 'Obra'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            Status: {verba.obra?.status || '-'}
                          </Typography>
                        </Box>
                        <Chip
                          label={statusConfig.label}
                          size="small"
                          sx={{
                            bgcolor: statusConfig.bgColor,
                            color: statusConfig.color,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>

                      {/* Executor */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          p: 1.5,
                          bgcolor: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: 2,
                          mb: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: '#009246',
                            fontSize: '1rem',
                          }}
                        >
                          {verba.delegado_para?.nome_completo?.charAt(0) || <PersonIcon />}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            Executor
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f5f5f5' }} noWrap>
                            {verba.delegado_para?.nome_completo || 'Não definido'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Valor */}
                      <Box sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                          Verba Delegada
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#009246' }}>
                          {formatCurrency(verba.valor_delegado)}
                        </Typography>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2, flexDirection: 'column', gap: 1 }}>
                      {/* Botão baseado no status */}
                      {verba.status === 'pendente_envio' && (
                        <>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={enviando === verba.id ? null : <SendIcon />}
                            onClick={() => handleEnviarVerba(verba.id)}
                            disabled={enviando === verba.id}
                            sx={{
                              bgcolor: '#ff9800',
                              '&:hover': { bgcolor: '#f57c00' },
                            }}
                          >
                            {enviando === verba.id ? 'Enviando...' : 'Enviar Verba'}
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleExcluirDelegacao(verba.id, verba.obra?.nome || 'obra')}
                            sx={{
                              borderColor: '#ef5350',
                              color: '#ef5350',
                              '&:hover': { bgcolor: 'rgba(239, 83, 80, 0.1)' },
                            }}
                          >
                            Excluir Delegação
                          </Button>
                        </>
                      )}

                      {verba.status === 'ativa' && (
                        <>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleOpenAuditoria(verba)}
                            sx={{
                              borderColor: '#4caf50',
                              color: '#4caf50',
                              '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.1)' },
                            }}
                          >
                            Acompanhar
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<MoneyIcon />}
                            onClick={() => handleAdicionarVerba(verba)}
                            sx={{
                              borderColor: '#ff9800',
                              color: '#ff9800',
                              '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' },
                            }}
                          >
                            Enviar Mais Verba
                          </Button>
                        </>
                      )}

                      {verba.status === 'prestacao_pendente' && (
                        <>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<AssignmentIcon />}
                            onClick={() => handleOpenAuditoria(verba)}
                            sx={{
                              bgcolor: '#2196f3',
                              '&:hover': { bgcolor: '#1976d2' },
                            }}
                          >
                            Auditar Prestação
                          </Button>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<MoneyIcon />}
                            onClick={() => handleAdicionarVerba(verba)}
                            sx={{
                              borderColor: '#ff9800',
                              color: '#ff9800',
                              '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' },
                            }}
                          >
                            Enviar Mais Verba
                          </Button>
                        </>
                      )}

                      {verba.status === 'finalizada' && (
                        <>
                          <Tooltip title="Verba finalizada">
                            <Button
                              fullWidth
                              variant="outlined"
                              disabled
                              sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                            >
                              ✓ Finalizada
                            </Button>
                          </Tooltip>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleExcluirObraFinalizada(verba.id, verba.obra?.nome || 'obra')}
                            sx={{
                              borderColor: '#ef5350',
                              color: '#ef5350',
                              '&:hover': { 
                                bgcolor: 'rgba(239, 83, 80, 0.1)',
                                borderColor: '#f44336'
                              },
                            }}
                          >
                            Excluir Obra Finalizada
                          </Button>
                        </>
                      )}
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* Empty State */}
        {verbasFiltradas.length === 0 && !loading && (
          <Box
            sx={{
              py: 8,
              textAlign: 'center',
            }}
          >
            <ConstructionIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              Nenhuma delegação encontrada
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)', mt: 1 }}>
              Crie uma nova delegação para começar
            </Typography>
          </Box>
        )}

        {/* Modal de Delegação */}
        <DelegarObraModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={criarDelegacao}
          obras={obras}
          socios={socios}
        />

        {/* Drawer de Auditoria */}
        <AuditoriaDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          verba={selectedVerba}
          gastos={gastosVerba}
          loading={loadingGastos}
          onAprovarGasto={handleAprovarGasto}
          onEstornarSaldo={handleEstornar}
          onFinalizarTudo={handleFinalizarAuditoria}
        />

        {/* Modal de Adicionar Mais Verba */}
        <Dialog
          open={modalMaisVerba}
          onClose={() => setModalMaisVerba(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 4,
            },
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <MoneyIcon sx={{ color: '#ff9800' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f5f5f5' }}>
                Enviar Mais Verba
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {verbaParaAdicionar && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 0.5 }}>
                  Obra: <strong style={{ color: '#f5f5f5' }}>{verbaParaAdicionar.obra?.nome}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2 }}>
                  Executor: <strong style={{ color: '#f5f5f5' }}>{verbaParaAdicionar.delegado_para?.nome_completo}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 2 }}>
                  Verba Atual: <strong style={{ color: '#009246' }}>{formatCurrency(verbaParaAdicionar.valor_delegado)}</strong>
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              label="Valor Adicional"
              type="number"
              value={valorAdicional}
              onChange={(e) => setValorAdicional(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                },
              }}
            />
            {valorAdicional && parseFloat(valorAdicional) > 0 && verbaParaAdicionar && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(0, 146, 70, 0.1)', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#009246' }}>
                  Nova verba total: <strong>{formatCurrency(verbaParaAdicionar.valor_delegado + parseFloat(valorAdicional))}</strong>
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setModalMaisVerba(false)} sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmarAdicionarVerba}
              disabled={!valorAdicional || parseFloat(valorAdicional) <= 0 || enviando === verbaParaAdicionar?.id}
              sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
            >
              {enviando === verbaParaAdicionar?.id ? 'Enviando...' : 'Adicionar Verba'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default GestaoObras;
