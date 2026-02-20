import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Fab,
  Tabs,
  Tab,
  Chip,
  Tooltip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

// Componentes
import { ObraModal, ObraCard } from '../components/obras';

// Hook e tipos
import { useObras } from '../hooks/useObras';
import { Obra, ObraStatus, OBRA_STATUS_CONFIG, formatCurrency } from '../types/obras';

// Tabs de filtro (conforme ENUM status_obra)
const OBRA_TABS = [
  { value: 'pendente', label: 'Pendentes' },
  { value: 'aprovada', label: 'Aprovadas' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluídas' },
] as const;

type ObraTabValue = (typeof OBRA_TABS)[number]['value'];

const Obras = () => {
  const navigate = useNavigate();
  
  // Hook principal
  const { obras, clientes, loading, error, addObra, updateObra, finalizarObra, deleteObra, getObrasByStatus, getStats } =
    useObras();

  // Estados
  const [activeTab, setActiveTab] = useState<ObraTabValue>('aprovada');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [finalizarDialogOpen, setFinalizarDialogOpen] = useState(false);
  const [obraParaFinalizar, setObraParaFinalizar] = useState<string | null>(null);
  const [dataConclusao, setDataConclusao] = useState(new Date().toISOString().split('T')[0]);
  const [pagoCompleto, setPagoCompleto] = useState(true);

  // Obras filtradas
  const filteredObras = useMemo(
    () => getObrasByStatus(activeTab as ObraStatus | 'pendente' | 'todas'),
    [getObrasByStatus, activeTab]
  );

  // Stats
  const stats = useMemo(() => getStats(), [getStats]);

  // Handlers
  const handleOpenModal = useCallback((obra?: Obra) => {
    setEditingObra(obra || null);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingObra(null);
    setModalOpen(false);
  }, []);

  const handleCardClick = useCallback(
    (obra: Obra) => {
      // Navega para a página de detalhes da obra
      navigate(`/obras/${obra.id}`);
    },
    [navigate]
  );

  const handleFinalizarObra = useCallback((obraId: string) => {
    setObraParaFinalizar(obraId);
    setDataConclusao(new Date().toISOString().split('T')[0]);
    setPagoCompleto(true);
    setFinalizarDialogOpen(true);
  }, []);

  const handleConfirmarFinalizacao = useCallback(async () => {
    if (!obraParaFinalizar) return;

    try {
      await finalizarObra(obraParaFinalizar, dataConclusao, pagoCompleto);
      setFinalizarDialogOpen(false);
      setObraParaFinalizar(null);
    } catch (error) {
      console.error('Erro ao finalizar obra:', error);
    }
  }, [obraParaFinalizar, dataConclusao, pagoCompleto, finalizarObra]);

  const handleIniciarObra = useCallback(async (obra: Obra) => {
    try {
      await updateObra(obra.id, {
        status: 'em_andamento',
        data_inicio: obra.data_inicio || new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Erro ao iniciar obra:', error);
    }
  }, [updateObra]);

  const handleEditarObra = useCallback((obra: Obra) => {
    handleOpenModal(obra);
  }, [handleOpenModal]);

  const handleDeleteObra = useCallback(async (obra: Obra) => {
    const ok = window.confirm(`Deseja excluir a obra "${obra.nome}"? Essa ação não pode ser desfeita.`);
    if (!ok) return;
    await deleteObra(obra.id);
  }, [deleteObra]);

  // Loading state
  if (loading && obras.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress sx={{ color: '#2196f3' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 10 }}>
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
                fontWeight: 700,
                color: '#f5f5f5',
                mb: 0.5,
              }}
            >
              Obras
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {stats.total} {stats.total === 1 ? 'projeto' : 'projetos'} • {stats.emAndamento} em
              andamento
            </Typography>
          </Box>
          <Tooltip title="Atualizar">
            <IconButton
              onClick={() => window.location.reload()}
              sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#2196f3' } }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </motion.div>

      {/* Cards de Resumo Financeiro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              borderRadius: 3,
            }}
          >
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
              Em Andamento
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>
              {stats.emAndamento}
            </Typography>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'rgba(0, 146, 70, 0.1)',
              border: '1px solid rgba(0, 146, 70, 0.2)',
              borderRadius: 3,
            }}
          >
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
              Concluídas
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#009246' }}>
              {stats.concluidas}
            </Typography>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              borderRadius: 3,
            }}
          >
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
              Total Orçado
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
              {formatCurrency(stats.valorTotalOrcado)}
            </Typography>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: 'rgba(206, 43, 55, 0.1)',
              border: '1px solid rgba(206, 43, 55, 0.2)',
              borderRadius: 3,
            }}
          >
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
              Total Gasto
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ce2b37' }}>
              {formatCurrency(stats.valorTotalGasto)}
            </Typography>
          </Paper>
        </Box>
      </motion.div>

      {/* Erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabs de Filtro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Box
          sx={{
            mb: 3,
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#2196f3',
                height: 3,
              },
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                minHeight: 48,
                '&.Mui-selected': {
                  color: '#2196f3',
                },
              },
            }}
          >
            {OBRA_TABS.map((tab) => (
              <Tab
                key={tab.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    <Chip
                      label={getObrasByStatus(tab.value as ObraStatus | 'pendente' | 'todas').length}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        backgroundColor: OBRA_STATUS_CONFIG[tab.value as ObraStatus]?.bgColor || 'rgba(255,255,255,0.1)',
                        color: OBRA_STATUS_CONFIG[tab.value as ObraStatus]?.textColor || 'rgba(255,255,255,0.7)',
                      }}
                    />
                  </Box>
                }
                value={tab.value}
              />
            ))}
          </Tabs>
        </Box>
      </motion.div>

      {/* Grid de Cards */}
      {filteredObras.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
              🏗️
            </Typography>
            <Typography sx={{ fontSize: '1.1rem', mb: 1 }}>Nenhuma obra encontrada</Typography>
            <Typography sx={{ fontSize: '0.85rem' }}>
              Clique no botão + para criar uma nova obra
            </Typography>
          </Box>
        </motion.div>
      ) : (
        <>
          {/* Desktop/Tablet: Grid normal */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'grid' },
              gridTemplateColumns: {
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2.5,
            }}
          >
            {filteredObras.map((obra, index) => (
              <motion.div
                key={obra.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.3 + index * 0.05,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <ObraCard 
                  obra={obra} 
                  onClick={() => handleCardClick(obra)}
                  onFinalizarObra={handleFinalizarObra}
                  onEditarObra={handleEditarObra}
                  onIniciarObra={handleIniciarObra}
                  onDeleteObra={handleDeleteObra}
                />
              </motion.div>
            ))}
          </Box>

          {/* Mobile: Carrossel horizontal */}
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              overflowX: 'auto',
              gap: 2,
              pb: 2,
              px: 0.5,
              '&::-webkit-scrollbar': {
                height: 8,
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(33, 150, 243, 0.5)',
                borderRadius: 4,
                '&:hover': {
                  background: 'rgba(33, 150, 243, 0.7)',
                },
              },
            }}
          >
            {filteredObras.map((obra, index) => (
              <motion.div
                key={obra.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.3 + index * 0.05,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{ minWidth: '85vw', maxWidth: '85vw' }}
              >
                <ObraCard 
                  obra={obra} 
                  onClick={() => handleCardClick(obra)}
                  onFinalizarObra={handleFinalizarObra}
                  onEditarObra={handleEditarObra}
                  onIniciarObra={handleIniciarObra}
                  onDeleteObra={handleDeleteObra}
                />
              </motion.div>
            ))}
          </Box>
        </>
      )}

      {/* FAB - Nova Obra */}
      <Tooltip title="Nova Obra" placement="left">
        <Fab
          color="primary"
          onClick={() => handleOpenModal()}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            boxShadow: '0 4px 20px rgba(33, 150, 243, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)',
              boxShadow: '0 6px 24px rgba(33, 150, 243, 0.5)',
            },
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Modal */}
      <ObraModal
        open={modalOpen}
        onClose={handleCloseModal}
        obra={editingObra}
        clientes={clientes}
        onSave={addObra}
        onUpdate={updateObra}
      />

      {/* Dialog de Finalização */}
      <Dialog
        open={finalizarDialogOpen}
        onClose={() => setFinalizarDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: '#f5f5f5' }}>
          ✅ Finalizar Obra
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            Confirma a finalização desta obra? Esta ação irá marcar a obra como concluída.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={pagoCompleto}
                onChange={(e) => setPagoCompleto(e.target.checked)}
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  '&.Mui-checked': { color: '#4caf50' },
                }}
              />
            }
            label="Pagamento completo"
            sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}
          />
          <TextField
            type="date"
            label="Data de Conclusão"
            value={dataConclusao}
            onChange={(e) => setDataConclusao(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f5f5f5',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#4caf50' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                filter: 'invert(1)',
                cursor: 'pointer',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setFinalizarDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmarFinalizacao}
            variant="contained"
            sx={{
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#45a049' },
            }}
          >
            Confirmar Finalização
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Obras;
