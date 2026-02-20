import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  MenuItem,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
  CompromissoInsert,
  CompromissoTipo,
  CompromissoPrioridade,
  COMPROMISSO_TIPO_CONFIG,
  COMPROMISSO_PRIORIDADE_CONFIG,
} from '../../types/compromissos';
import { Obra } from '../../types/obras';

interface CompromissoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CompromissoInsert) => Promise<{ success: boolean; error?: unknown }>;
  obras: Obra[];
  dataSelecionada?: Date;
}

const CompromissoModal = ({ open, onClose, onSave, obras, dataSelecionada }: CompromissoModalProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data_inicio: '',
    hora_inicio: '09:00',
    data_fim: '',
    hora_fim: '10:00',
    tipo: 'reuniao' as CompromissoTipo,
    prioridade: 'media' as CompromissoPrioridade,
    obra_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset form quando modal abre
  useEffect(() => {
    if (open) {
      const dataBase = dataSelecionada || new Date();
      setFormData({
        titulo: '',
        descricao: '',
        data_inicio: format(dataBase, 'yyyy-MM-dd'),
        hora_inicio: '09:00',
        data_fim: format(dataBase, 'yyyy-MM-dd'),
        hora_fim: '10:00',
        tipo: 'reuniao',
        prioridade: 'media',
        obra_id: '',
      });
      setErrors({});
    }
  }, [open, dataSelecionada]);

  // Validação
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.titulo.trim()) newErrors.titulo = 'Título obrigatório';
    if (!formData.data_inicio) newErrors.data_inicio = 'Data obrigatória';
    if (!formData.hora_inicio) newErrors.hora_inicio = 'Hora obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const dataInicio = `${formData.data_inicio}T${formData.hora_inicio}`;
      const dataFim = formData.data_fim && formData.hora_fim
        ? `${formData.data_fim}T${formData.hora_fim}`
        : undefined;

      const compromisso: CompromissoInsert = {
        titulo: formData.titulo,
        descricao: formData.descricao || undefined,
        data_inicio: dataInicio,
        data_fim: dataFim,
        tipo: formData.tipo,
        prioridade: formData.prioridade,
        obra_id: formData.obra_id || undefined,
      };

      const result = await onSave(compromisso);
      if (result.success) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  // Estilos
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          backgroundImage: 'none',
          border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100%' : '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(0, 146, 70, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon sx={{ color: '#009246' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
            Novo Compromisso
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Título */}
        <TextField
          fullWidth
          label="Título do Compromisso"
          size="small"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          error={!!errors.titulo}
          helperText={errors.titulo}
          placeholder="Ex: Reunião com cliente"
          sx={inputSx}
          autoFocus
        />

        {/* Tipo e Prioridade */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Tipo"
            size="small"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as CompromissoTipo })}
            sx={{ ...inputSx, flex: 1 }}
          >
            {Object.entries(COMPROMISSO_TIPO_CONFIG).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{config.icon}</span>
                  <Typography variant="body2">{config.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Prioridade"
            size="small"
            value={formData.prioridade}
            onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as CompromissoPrioridade })}
            sx={{ ...inputSx, flex: 1 }}
          >
            {Object.entries(COMPROMISSO_PRIORIDADE_CONFIG).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: config.color,
                    }}
                  />
                  <Typography variant="body2">{config.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

        {/* Data e Hora Início */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1, display: 'block' }}
          >
            <TimeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
            Início
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              type="date"
              size="small"
              value={formData.data_inicio}
              onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              error={!!errors.data_inicio}
              InputLabelProps={{ shrink: true }}
              sx={{ ...inputSx, flex: 1, '& input': { colorScheme: 'dark' } }}
            />
            <TextField
              type="time"
              size="small"
              value={formData.hora_inicio}
              onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              error={!!errors.hora_inicio}
              InputLabelProps={{ shrink: true }}
              sx={{ ...inputSx, width: 120, '& input': { colorScheme: 'dark' } }}
            />
          </Box>
        </Box>

        {/* Data e Hora Fim */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1, display: 'block' }}
          >
            Fim (opcional)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              type="date"
              size="small"
              value={formData.data_fim}
              onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ ...inputSx, flex: 1, '& input': { colorScheme: 'dark' } }}
            />
            <TextField
              type="time"
              size="small"
              value={formData.hora_fim}
              onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ ...inputSx, width: 120, '& input': { colorScheme: 'dark' } }}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

        {/* Vincular a Obra */}
        <TextField
          select
          label="Vincular a Obra (opcional)"
          size="small"
          value={formData.obra_id}
          onChange={(e) => setFormData({ ...formData, obra_id: e.target.value })}
          sx={inputSx}
        >
          <MenuItem value="">
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Nenhuma
            </Typography>
          </MenuItem>
          {obras.map((obra) => (
            <MenuItem key={obra.id} value={obra.id}>
              <Typography variant="body2">{obra.nome}</Typography>
            </MenuItem>
          ))}
        </TextField>

        {/* Descrição */}
        <TextField
          fullWidth
          label="Descrição (opcional)"
          size="small"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          multiline
          rows={3}
          placeholder="Detalhes adicionais..."
          sx={inputSx}
        />
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          p: 2,
          pt: 1.5,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          size="small"
          sx={{ color: 'rgba(255, 255, 255, 0.6)', textTransform: 'none', px: 2 }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          disabled={saving}
          sx={{
            textTransform: 'none',
            px: 3,
            fontWeight: 600,
            backgroundColor: '#009246',
            boxShadow: '0 4px 12px rgba(0, 146, 70, 0.3)',
            '&:hover': { backgroundColor: '#007838' },
            '&.Mui-disabled': { bgcolor: 'rgba(0, 146, 70, 0.3)' },
          }}
        >
          {saving ? 'Salvando...' : 'Criar Compromisso'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompromissoModal;
