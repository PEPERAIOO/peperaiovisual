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
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { 
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { Transaction, Category, TransactionType, TransactionStatus } from '../../types/financeiro';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  transaction?: Transaction | null;
  onSave: (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean }>;
  onUpdate?: (id: string, data: Partial<Transaction>) => Promise<{ success: boolean }>;
}

const TransactionForm = ({
  open,
  onClose,
  categories,
  transaction,
  onSave,
  onUpdate,
}: TransactionFormProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = !!transaction;

  const [formData, setFormData] = useState({
    data_vencimento: new Date().toISOString(),
    descricao: '',
    categoria: '',
    tipo: 'despesa' as TransactionType,
    valor: '',
    status: 'pendente' as TransactionStatus,
    observacao: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transaction) {
      setFormData({
        data_vencimento: transaction.data_vencimento || new Date().toISOString(),
        descricao: transaction.descricao,
        categoria: transaction.categoria,
        tipo: transaction.tipo,
        valor: transaction.valor.toString(),
        status: transaction.status,
        observacao: transaction.observacao || '',
      });
    } else {
      setFormData({
        data_vencimento: new Date().toISOString(),
        descricao: '',
        categoria: '',
        tipo: 'despesa',
        valor: '',
        status: 'pendente',
        observacao: '',
      });
    }
    setErrors({});
  }, [transaction, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.descricao.trim()) newErrors.descricao = 'Obrigatório';
    if (!formData.valor || parseFloat(formData.valor) <= 0) newErrors.valor = 'Inválido';
    if (!formData.categoria) newErrors.categoria = 'Selecione';
    if (!formData.data_vencimento) newErrors.data_vencimento = 'Obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const data = { ...formData, valor: parseFloat(formData.valor) };
    
    let result;
    if (isEditing && onUpdate && transaction) {
      result = await onUpdate(transaction.id, data);
    } else {
      result = await onSave(data);
    }
    if (result.success) onClose();
  };

  const filteredCategories = categories.filter((c) => c.tipo === formData.tipo);

  // Estilos compartilhados para inputs
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&.Mui-focused fieldset': { borderColor: '#009246' },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
    '& .MuiInputBase-input': { color: '#f5f5f5' },
    '& .MuiInputAdornment-root': { color: 'rgba(255, 255, 255, 0.5)' },
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
      {/* Header compacto */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
          {isEditing ? '✏️ Editar' : '➕ Nova Transação'}
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        
        {/* Toggle Receita/Despesa - Design clean */}
        <Box>
          <Typography 
            variant="caption" 
            sx={{ color: 'rgba(255, 255, 255, 0.4)', mb: 1, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}
          >
            Tipo
          </Typography>
          <ToggleButtonGroup
            value={formData.tipo}
            exclusive
            onChange={(_, value) => {
              if (value) setFormData({ ...formData, tipo: value, categoria: '' });
            }}
            fullWidth
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                py: 1.2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 500,
                fontSize: '0.85rem',
                gap: 1,
                transition: 'all 0.2s ease',
                '&:first-of-type': { borderRadius: '8px 0 0 8px' },
                '&:last-of-type': { borderRadius: '0 8px 8px 0' },
              },
            }}
          >
            <ToggleButton
              value="receita"
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 146, 70, 0.25)',
                  color: '#4caf50',
                  borderColor: 'rgba(0, 146, 70, 0.5)',
                  '&:hover': { backgroundColor: 'rgba(0, 146, 70, 0.35)' },
                },
              }}
            >
              <TrendingUpIcon fontSize="small" /> Receita
            </ToggleButton>
            <ToggleButton
              value="despesa"
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(206, 43, 55, 0.25)',
                  color: '#ef5350',
                  borderColor: 'rgba(206, 43, 55, 0.5)',
                  '&:hover': { backgroundColor: 'rgba(206, 43, 55, 0.35)' },
                },
              }}
            >
              <TrendingDownIcon fontSize="small" /> Despesa
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Data e Valor - Layout lado a lado */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Data e Hora"
            type="datetime-local"
            size="small"
            value={formData.data_vencimento ? formData.data_vencimento.substring(0, 16) : ''}
            onChange={(e) => {
              const isoString = e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString();
              setFormData({ ...formData, data_vencimento: isoString });
            }}
            error={!!errors.data_vencimento}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: { colorScheme: 'dark' },
            }}
            sx={{ ...inputSx, flex: 1 }}
          />
          <TextField
            label="Valor"
            type="number"
            size="small"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            error={!!errors.valor}
            placeholder="0,00"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.85rem' }}>
                    R$
                  </Typography>
                </InputAdornment>
              ),
            }}
            sx={{ ...inputSx, flex: 1 }}
          />
        </Box>

        {/* Descrição */}
        <TextField
          fullWidth
          label="Descrição"
          size="small"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          error={!!errors.descricao}
          placeholder="Ex: Pagamento cliente Silva"
          sx={inputSx}
        />

        {/* Categoria e Status - Layout lado a lado */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label="Categoria"
            size="small"
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            error={!!errors.categoria}
            sx={{ ...inputSx, flex: 1.5 }}
          >
            {filteredCategories.length === 0 ? (
              <MenuItem disabled value="">
                <Typography variant="caption" color="text.secondary">
                  Nenhuma categoria
                </Typography>
              </MenuItem>
            ) : (
              filteredCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: cat.cor,
                      }}
                    />
                    <Typography variant="body2">{cat.nome}</Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </TextField>

          <TextField
            select
            label="Status"
            size="small"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as TransactionStatus })}
            sx={{ ...inputSx, flex: 1 }}
          >
            <MenuItem value="pago">✅ Pago</MenuItem>
            <MenuItem value="pendente">⏳ Pendente</MenuItem>
            <MenuItem value="atrasado">⚠️ Atrasado</MenuItem>
          </TextField>
        </Box>

        {/* Observação - Opcional, colapsável */}
        <TextField
          fullWidth
          label="Observação (opcional)"
          size="small"
          value={formData.observacao}
          onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
          multiline
          rows={2}
          placeholder="Notas adicionais..."
          sx={inputSx}
        />
      </DialogContent>

      {/* Footer com ações */}
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
          sx={{ 
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'none',
            px: 2,
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleSubmit}
          sx={{
            textTransform: 'none',
            px: 3,
            fontWeight: 600,
            backgroundColor: formData.tipo === 'receita' ? '#009246' : '#ce2b37',
            boxShadow: formData.tipo === 'receita' 
              ? '0 4px 12px rgba(0, 146, 70, 0.3)' 
              : '0 4px 12px rgba(206, 43, 55, 0.3)',
            '&:hover': {
              backgroundColor: formData.tipo === 'receita' ? '#007a38' : '#b02430',
            },
          }}
        >
          {isEditing ? 'Salvar' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionForm;
