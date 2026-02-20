import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Chip,
  InputAdornment,
  MenuItem,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  StickyNote2 as NoteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAnotacoes } from '../hooks/useAnotacoes';
import { AnotacaoInsert } from '../types/anotacoes';

const Anotacoes = () => {
  const {
    anotacoes,
    loading,
    error,
    loadAnotacoes,
    addAnotacao,
    updateAnotacao,
    deleteAnotacao,
    limparExpiradas,
  } = useAnotacoes();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    dias_expiracao: 7,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Abrir modal para criar ou editar
  const handleOpenModal = (anotacaoId?: string) => {
    if (anotacaoId) {
      const anotacao = anotacoes.find((a) => a.id === anotacaoId);
      if (anotacao) {
        setFormData({
          titulo: anotacao.titulo,
          conteudo: anotacao.conteudo,
          dias_expiracao: anotacao.dias_expiracao,
        });
        setEditingId(anotacaoId);
      }
    } else {
      setFormData({ titulo: '', conteudo: '', dias_expiracao: 7 });
      setEditingId(null);
    }
    setErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({ titulo: '', conteudo: '', dias_expiracao: 7 });
    setErrors({});
  };

  // Validação
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.titulo.trim()) newErrors.titulo = 'Título obrigatório';
    if (!formData.conteudo.trim()) newErrors.conteudo = 'Conteúdo obrigatório';
    if (formData.dias_expiracao < 1) newErrors.dias_expiracao = 'Mínimo 1 dia';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Salvar
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      let result;
      if (editingId) {
        result = await updateAnotacao(editingId, formData);
      } else {
        result = await addAnotacao(formData);
      }

      if (result.success) {
        handleCloseModal();
      }
    } finally {
      setSaving(false);
    }
  };

  // Deletar
  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta anotação?')) return;
    await deleteAnotacao(id);
  };

  // Limpar expiradas
  const handleLimparExpiradas = async () => {
    if (!window.confirm('Deseja limpar todas as anotações expiradas?')) return;
    await limparExpiradas();
  };

  // Calcular dias restantes
  const getDiasRestantes = (dataExpiracao: string) => {
    return differenceInDays(parseISO(dataExpiracao), new Date());
  };

  // Cor do chip baseado em dias restantes
  const getChipColor = (diasRestantes: number) => {
    if (diasRestantes <= 1) return { bg: 'rgba(206, 43, 55, 0.2)', color: '#ce2b37' };
    if (diasRestantes <= 3) return { bg: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' };
    return { bg: 'rgba(0, 146, 70, 0.2)', color: '#009246' };
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&.Mui-focused fieldset': { borderColor: '#009246' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
    '& .MuiInputBase-input': { color: '#f5f5f5' },
  };

  if (loading && anotacoes.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ width: 150, height: 40, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, mb: 1 }} />
          <Box sx={{ width: 250, height: 20, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ height: 200, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            mb: 3,
            gap: { xs: 1.5, md: 2 },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.35rem', sm: '1.6rem', md: '2.125rem' },
                lineHeight: 1.2,
              }}
            >
              📝 Anotações
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
            >
              Lembretes temporários com expiração automática
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Limpar expiradas">
              <Button
                variant="outlined"
                startIcon={<DeleteSweepIcon />}
                onClick={handleLimparExpiradas}
                sx={{
                  borderColor: 'rgba(206, 43, 55, 0.3)',
                  color: '#ce2b37',
                  '&:hover': { borderColor: '#ce2b37', bgcolor: 'rgba(206, 43, 55, 0.1)' },
                }}
              >
                Limpar
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadAnotacoes}
              size="small"
              sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Atualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal()}
              size="small"
              sx={{
                bgcolor: '#ff9800',
                '&:hover': { bgcolor: '#f57c00' },
                boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
              }}
            >
              Nova Anotação
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Cards de Anotações */}
      {anotacoes.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'rgba(30, 30, 30, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 4,
          }}
        >
          <NoteIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Nenhuma anotação ativa. Crie uma nova!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
          {anotacoes.map((anotacao) => {
            const diasRestantes = getDiasRestantes(anotacao.data_expiracao);
            const chipColors = getChipColor(diasRestantes);

            return (
              <motion.div
                key={anotacao.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  sx={{
                    background: 'rgba(30, 30, 30, 0.6)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: '#f5f5f5', fontWeight: 700, flex: 1 }}>
                        {anotacao.titulo}
                      </Typography>
                      <Chip
                        icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                        label={diasRestantes <= 0 ? 'Hoje' : `${diasRestantes}d`}
                        size="small"
                        sx={{
                          bgcolor: chipColors.bg,
                          color: chipColors.color,
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: chipColors.color },
                        }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        mb: 2,
                        whiteSpace: 'pre-wrap',
                        minHeight: 60,
                      }}
                    >
                      {anotacao.conteudo}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto' }}>
                      <PersonIcon sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.4)' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {anotacao.user_nome || 'Usuário'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)', mx: 1 }}>
                        •
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {format(parseISO(anotacao.created_at), "dd 'de' MMMM", { locale: ptBR })}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                    <IconButton size="small" onClick={() => handleOpenModal(anotacao.id)} sx={{ color: '#ff9800' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(anotacao.id)} sx={{ color: '#ce2b37' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </motion.div>
            );
          })}
        </Box>
      )}

      {/* Modal de Criar/Editar */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
            px: 2.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NoteIcon sx={{ color: '#ff9800' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
              {editingId ? 'Editar Anotação' : 'Nova Anotação'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseModal} size="small" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            label="Título"
            size="small"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            error={!!errors.titulo}
            helperText={errors.titulo}
            placeholder="Ex: Lembrar de..."
            sx={inputSx}
            autoFocus
          />

          <TextField
            fullWidth
            label="Conteúdo"
            multiline
            rows={4}
            value={formData.conteudo}
            onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
            error={!!errors.conteudo}
            helperText={errors.conteudo}
            placeholder="Descreva o lembrete..."
            sx={inputSx}
          />

          <TextField
            select
            fullWidth
            label="Expirar em"
            size="small"
            value={formData.dias_expiracao}
            onChange={(e) => setFormData({ ...formData, dias_expiracao: Number(e.target.value) })}
            error={!!errors.dias_expiracao}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ScheduleIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          >
            <MenuItem value={1}>1 dia</MenuItem>
            <MenuItem value={3}>3 dias</MenuItem>
            <MenuItem value={7}>1 semana</MenuItem>
            <MenuItem value={14}>2 semanas</MenuItem>
            <MenuItem value={30}>1 mês</MenuItem>
            <MenuItem value={60}>2 meses</MenuItem>
            <MenuItem value={90}>3 meses</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.06)', gap: 1 }}>
          <Button onClick={handleCloseModal} sx={{ color: 'rgba(255, 255, 255, 0.6)', textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              backgroundColor: '#ff9800',
              '&:hover': { backgroundColor: '#f57c00' },
            }}
          >
            {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Anotacoes;
