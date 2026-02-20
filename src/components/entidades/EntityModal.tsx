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
  InputAdornment,
} from '@mui/material';
import { Close as CloseIcon, Person as PersonIcon } from '@mui/icons-material';
import {
  Entity,
  EntityType,
  ENTITY_TYPE_CONFIG,
  formatPhone,
  cleanPhone,
} from '../../types/entidades';

interface EntityModalProps {
  open: boolean;
  onClose: () => void;
  entity?: Entity | null;
  onSave: (
    data: Omit<Entity, 'id' | 'created_at' | 'updated_at' | 'ativo'>
  ) => Promise<{ success: boolean }>;
  onUpdate?: (id: string, data: Partial<Entity>) => Promise<{ success: boolean }>;
  presetType?: EntityType;
}

const EntityModal = ({ open, onClose, entity, onSave, onUpdate, presetType }: EntityModalProps) => {
  const isEditing = !!entity;

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'cliente' as EntityType,
    documento: '',
    telefone: '',
    email: '',
    observacoes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Preencher dados ao editar
  useEffect(() => {
    if (entity) {
      setFormData({
        nome: entity.nome || '',
        tipo: entity.tipo || 'cliente',
        documento: entity.documento || '',
        telefone: entity.telefone ? formatPhone(entity.telefone) : '',
        email: entity.email || '',
        observacoes: entity.observacoes || '',
      });
    } else {
      setFormData({
        nome: '',
        tipo: presetType || 'cliente',
        documento: '',
        telefone: '',
        email: '',
        observacoes: '',
      });
    }
    setErrors({});
  }, [entity, open, presetType]);

  // Validação
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (formData.documento) {
      const cleaned = formData.documento.replace(/\D/g, '');
      if (cleaned.length !== 11 && cleaned.length !== 14) {
        newErrors.documento = 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Máscara de telefone
  const handlePhoneChange = (value: string) => {
    const cleaned = cleanPhone(value);
    if (cleaned.length <= 11) {
      setFormData((prev) => ({ ...prev, telefone: formatPhone(cleaned) }));
    }
  };

  // Máscara de documento (CPF/CNPJ)
  const handleDocumentChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.length <= 11) {
      // CPF: 000.000.000-00
      if (cleaned.length > 9) {
        formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
      } else if (cleaned.length > 6) {
        formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
      } else if (cleaned.length > 3) {
        formatted = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
      }
    } else {
      // CNPJ: 00.000.000/0000-00
      if (cleaned.length > 12) {
        formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
      } else if (cleaned.length > 8) {
        formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
      } else if (cleaned.length > 5) {
        formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
      } else if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
      }
    }

    setFormData((prev) => ({ ...prev, documento: formatted }));
  };

  // Salvar
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      const dataToSave = {
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        documento: formData.documento.replace(/\D/g, '') || undefined,
        telefone: cleanPhone(formData.telefone) || undefined,
        email: formData.email.trim() || undefined,
        observacoes: formData.observacoes.trim() || undefined,
      };

      if (isEditing && entity && onUpdate) {
        const result = await onUpdate(entity.id, dataToSave);
        if (result.success) {
          onClose();
        }
      } else {
        const result = await onSave(dataToSave as Omit<Entity, 'id' | 'created_at' | 'updated_at' | 'ativo'>);
        if (result.success) {
          onClose();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 3,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 146, 70, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonIcon sx={{ color: '#009246' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
            {isEditing ? 'Editar Cadastro' : 'Novo Cadastro'}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#fff' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Nome */}
        <TextField
          label="Nome / Razão Social"
          value={formData.nome}
          onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
          error={!!errors.nome}
          helperText={errors.nome}
          fullWidth
          required
          size="small"
          variant="outlined"
          sx={inputStyles}
        />

        {/* Tipo e Documento - mesma linha */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            select
            label="Tipo"
            value={formData.tipo}
            onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value as EntityType }))}
            fullWidth
            size="small"
            variant="outlined"
            sx={inputStyles}
          >
            {Object.entries(ENTITY_TYPE_CONFIG).map(([value, config]) => (
              <MenuItem key={value} value={value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: config.textColor,
                    }}
                  />
                  {config.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="CPF / CNPJ"
            value={formData.documento}
            onChange={(e) => handleDocumentChange(e.target.value)}
            error={!!errors.documento}
            helperText={errors.documento}
            fullWidth
            size="small"
            variant="outlined"
            placeholder="000.000.000-00"
            sx={inputStyles}
          />
        </Box>

        {/* Telefone e Email - mesma linha */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Telefone"
            value={formData.telefone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            fullWidth
            size="small"
            variant="outlined"
            placeholder="(00) 00000-0000"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                    📱
                  </Typography>
                </InputAdornment>
              ),
            }}
            sx={inputStyles}
          />

          <TextField
            label="E-mail"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            error={!!errors.email}
            helperText={errors.email}
            fullWidth
            size="small"
            variant="outlined"
            type="email"
            placeholder="email@exemplo.com"
            sx={inputStyles}
          />
        </Box>

        {/* Observações */}
        <TextField
          label="Observações"
          value={formData.observacoes}
          onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
          fullWidth
          size="small"
          variant="outlined"
          multiline
          rows={3}
          placeholder="Anotações adicionais sobre este cadastro..."
          sx={inputStyles}
        />
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'none',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #009246 0%, #007a38 100%)',
            color: '#fff',
            fontWeight: 600,
            px: 3,
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': {
              background: 'linear-gradient(135deg, #00a850 0%, #008a42 100%)',
            },
            '&:disabled': {
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Estilos dos inputs
const inputStyles = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 2,
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#009246',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.5)',
    '&.Mui-focused': {
      color: '#009246',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#f5f5f5',
  },
  '& .MuiFormHelperText-root': {
    color: '#ce2b37',
  },
};

export default EntityModal;
