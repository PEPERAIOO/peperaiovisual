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
import {
  Close as CloseIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material';
import { Obra, ObraStatus, OBRA_STATUS_CONFIG } from '../../types/obras';
import { Entity } from '../../types/entidades';

interface ObraModalProps {
  open: boolean;
  onClose: () => void;
  obra?: Obra | null;
  clientes: Entity[];
  onSave: (
    data: Omit<Obra, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'valor_gasto'>
  ) => Promise<{ success: boolean }>;
  onUpdate?: (id: string, data: Partial<Obra>) => Promise<{ success: boolean }>;
}

const ObraModal = ({ open, onClose, obra, clientes, onSave, onUpdate }: ObraModalProps) => {
  const isEditing = !!obra;

  const [formData, setFormData] = useState({
    nome: '',
    cliente_id: '',
    status: 'em_andamento' as ObraStatus,
    valor_total_orcamento: '',
    data_inicio: '',
    data_previsao: '',
    descricao: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Preencher dados ao editar
  useEffect(() => {
    if (obra) {
      setFormData({
        nome: obra.nome || '',
        cliente_id: obra.cliente_id || '',
        status: obra.status || 'orcamento',
        valor_total_orcamento: obra.valor_total_orcamento?.toString() || '',
        data_inicio: obra.data_inicio || '',
        data_previsao: obra.data_previsao || '',
        descricao: obra.descricao || '',
      });
    } else {
      setFormData({
        nome: '',
        cliente_id: '',
        status: 'em_andamento',
        valor_total_orcamento: '',
        data_inicio: '',
        data_previsao: '',
        descricao: '',
      });
    }
    setErrors({});
  }, [obra, open]);

  const statusOptions = Object.entries(OBRA_STATUS_CONFIG).filter(([value]) => {
    if (isEditing) return true;
    return value !== 'orcamento' && value !== 'aprovada';
  });

  // Validação
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome da obra é obrigatório';
    }

    if (!formData.valor_total_orcamento || parseFloat(formData.valor_total_orcamento) <= 0) {
      newErrors.valor_total_orcamento = 'Informe um valor válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formatar valor como moeda
  const handleValorChange = (value: string) => {
    // Remove tudo exceto números e vírgula
    const cleaned = value.replace(/[^\d,]/g, '');
    // Substitui vírgula por ponto para o valor real
    setFormData((prev) => ({ ...prev, valor_total_orcamento: cleaned.replace(',', '.') }));
  };

  // Salvar
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      const dataToSave = {
        nome: formData.nome.trim(),
        cliente_id: formData.cliente_id || null,
        status: formData.status,
        valor_total_orcamento: parseFloat(formData.valor_total_orcamento) || 0,
        data_inicio: formData.data_inicio || undefined,
        data_previsao: formData.data_previsao || undefined,
        descricao: formData.descricao.trim() || undefined,
      };

      if (isEditing && obra && onUpdate) {
        const result = await onUpdate(obra.id, dataToSave);
        if (result.success) {
          onClose();
        }
      } else {
        const result = await onSave(dataToSave as Omit<Obra, 'id' | 'created_at' | 'cliente' | 'valor_gasto' | 'user_id'>);
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
              backgroundColor: 'rgba(33, 150, 243, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ConstructionIcon sx={{ color: '#2196f3' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
            {isEditing ? 'Editar Obra' : 'Nova Obra'}
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
        {/* Nome da Obra */}
        <TextField
          label="Nome da Obra"
          value={formData.nome}
          onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
          error={!!errors.nome}
          helperText={errors.nome}
          fullWidth
          required
          size="small"
          variant="outlined"
          placeholder="Ex: Residencial Vila Nova"
          sx={inputStyles}
        />

        {/* Cliente e Status - mesma linha */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            select
            label="Cliente"
            value={formData.cliente_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, cliente_id: e.target.value }))}
            fullWidth
            size="small"
            variant="outlined"
            sx={inputStyles}
          >
            <MenuItem value="">Sem cliente</MenuItem>
            {clientes.map((cliente) => (
              <MenuItem key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as ObraStatus }))}
            fullWidth
            size="small"
            variant="outlined"
            sx={inputStyles}
          >
            {statusOptions.map(([value, config]) => (
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
        </Box>

        {/* Valor do Orçamento */}
        <TextField
          label="Valor do Orçamento"
          value={formData.valor_total_orcamento}
          onChange={(e) => handleValorChange(e.target.value)}
          error={!!errors.valor_total_orcamento}
          helperText={errors.valor_total_orcamento}
          fullWidth
          required
          size="small"
          variant="outlined"
          placeholder="0,00"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>R$</Typography>
              </InputAdornment>
            ),
          }}
          sx={inputStyles}
        />

        {/* Datas - mesma linha */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Data de Início"
            type="date"
            value={formData.data_inicio}
            onChange={(e) => setFormData((prev) => ({ ...prev, data_inicio: e.target.value }))}
            fullWidth
            size="small"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: { colorScheme: 'dark' },
            }}
            sx={inputStyles}
          />

          <TextField
            label="Previsão de Término"
            type="date"
            value={formData.data_previsao}
            onChange={(e) => setFormData((prev) => ({ ...prev, data_previsao: e.target.value }))}
            fullWidth
            size="small"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: { colorScheme: 'dark' },
            }}
            sx={inputStyles}
          />
        </Box>

        {/* Descrição */}
        <TextField
          label="Descrição"
          value={formData.descricao}
          onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
          fullWidth
          size="small"
          variant="outlined"
          multiline
          rows={3}
          placeholder="Detalhes sobre a obra..."
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
            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            color: '#fff',
            fontWeight: 600,
            px: 3,
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': {
              background: 'linear-gradient(135deg, #42a5f5 0%, #2196f3 100%)',
            },
            '&:disabled': {
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Obra'}
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
      borderColor: '#2196f3',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.5)',
    '&.Mui-focused': {
      color: '#2196f3',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#f5f5f5',
  },
  '& .MuiFormHelperText-root': {
    color: '#ce2b37',
  },
};

export default ObraModal;
