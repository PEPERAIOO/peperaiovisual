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
  MenuItem,
  InputAdornment,
  IconButton,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material';
import { Obra } from '../../types/obras';
import { ObraVerbaInsert, formatCurrency } from '../../types/delegacao';

interface Socio {
  id: string;
  nome: string;
  email?: string;
}

interface DelegarObraModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ObraVerbaInsert) => Promise<{ success: boolean }>;
  obras: Obra[];
  socios: Socio[];
  obraSelecionada?: Obra | null;
}

const DelegarObraModal = ({
  open,
  onClose,
  onSave,
  obras,
  socios,
  obraSelecionada,
}: DelegarObraModalProps) => {
  const [formData, setFormData] = useState({
    obra_id: '',
    delegado_para_id: '',
    valor_delegado: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset form
  useEffect(() => {
    if (open) {
      setFormData({
        obra_id: obraSelecionada?.id || '',
        delegado_para_id: '',
        valor_delegado: '',
      });
      setErrors({});
    }
  }, [open, obraSelecionada]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.obra_id) newErrors.obra_id = 'Selecione uma obra';
    if (!formData.delegado_para_id) newErrors.delegado_para_id = 'Selecione um executor';
    if (!formData.valor_delegado || parseFloat(formData.valor_delegado) <= 0) {
      newErrors.valor_delegado = 'Informe um valor válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const result = await onSave({
        obra_id: formData.obra_id,
        delegado_para_id: formData.delegado_para_id,
        valor_delegado: parseFloat(formData.valor_delegado),
      });
      if (result.success) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const obraSelecionadaData = obras.find((o) => o.id === formData.obra_id);
  const socioSelecionado = socios.find((s) => s.id === formData.delegado_para_id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #009246 0%, #00b359 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ConstructionIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f5f5f5' }}>
                Delegar Obra
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Defina o executor e a verba inicial
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Selecionar Obra */}
          <TextField
            select
            label="Obra"
            value={formData.obra_id}
            onChange={(e) => setFormData({ ...formData, obra_id: e.target.value })}
            error={!!errors.obra_id}
            helperText={errors.obra_id}
            disabled={!!obraSelecionada}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <ConstructionIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              },
            }}
          >
            {obras.map((obra) => (
              <MenuItem key={obra.id} value={obra.id}>
                <Box>
                  <Typography variant="body2">{obra.nome}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Orçamento: {formatCurrency(obra.valor_total_orcamento)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>

          {/* Selecionar Executor */}
          <TextField
            select
            label="Executor (Delegado Para)"
            value={formData.delegado_para_id}
            onChange={(e) => setFormData({ ...formData, delegado_para_id: e.target.value })}
            error={!!errors.delegado_para_id}
            helperText={errors.delegado_para_id}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              },
            }}
          >
            {socios.map((socio) => (
              <MenuItem key={socio.id} value={socio.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: '#009246', fontSize: '0.8rem' }}>
                    {socio.nome.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{socio.nome}</Typography>
                    {socio.email && (
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {socio.email}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </TextField>

          {/* Valor da Verba */}
          <TextField
            label="Valor da Verba"
            type="number"
            value={formData.valor_delegado}
            onChange={(e) => setFormData({ ...formData, valor_delegado: e.target.value })}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            error={!!errors.valor_delegado}
            helperText={errors.valor_delegado || 'Valor inicial para o executor gerenciar'}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MoneyIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                  <Typography sx={{ ml: 0.5, color: 'rgba(255, 255, 255, 0.6)' }}>R$</Typography>
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

          {/* Preview */}
          {formData.obra_id && formData.delegado_para_id && formData.valor_delegado && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(0, 146, 70, 0.1)',
                border: '1px solid rgba(0, 146, 70, 0.2)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mb: 1 }}>
                📋 Resumo da Delegação
              </Typography>
              <Typography variant="body2" sx={{ color: '#f5f5f5' }}>
                <strong>{socioSelecionado?.nome}</strong> será responsável pela obra{' '}
                <strong>{obraSelecionadaData?.nome}</strong> com verba de{' '}
                <strong style={{ color: '#009246' }}>{formatCurrency(parseFloat(formData.valor_delegado) || 0)}</strong>
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ color: 'rgba(255, 255, 255, 0.6)', borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          sx={{
            bgcolor: '#009246',
            '&:hover': { bgcolor: '#00b359' },
            borderRadius: 2,
            px: 3,
          }}
        >
          {saving ? 'Salvando...' : 'Criar Delegação'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DelegarObraModal;
