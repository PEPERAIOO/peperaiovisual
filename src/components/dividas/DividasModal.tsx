import { useState, useEffect, useCallback } from 'react';
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
  Switch,
  FormControlLabel,
  Collapse,
  Alert,
  Autocomplete,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { format, addMonths } from 'date-fns';
import { DividaInsert } from '../../types/dividas';
import { Entity } from '../../types/entidades';
import supabase from '../../lib/supabaseClient';

interface DividasModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: DividaInsert) => Promise<{ success: boolean; error?: unknown }>;
}

// Categorias de dívida
const CATEGORIAS_DIVIDA = [
  'Empréstimo',
  'Financiamento',
  'Cartão de Crédito',
  'Fornecedor',
  'Material',
  'Equipamento',
  'Aluguel',
  'Serviços',
  'Impostos',
  'Outros',
];

const DividasModal = ({ open, onClose, onSave }: DividasModalProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Estados do formulário
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    data_vencimento: format(new Date(), 'yyyy-MM-dd'),
    entidade_id: '',
    observacao: '',
    is_parcelada: false,
    numero_parcelas: 2,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [credores, setCredores] = useState<Entity[]>([]);
  const [selectedCredor, setSelectedCredor] = useState<Entity | null>(null);
  const [loadingCredores, setLoadingCredores] = useState(false);
  const [credoresError, setCredoresError] = useState<string | null>(null);

  // Carregar credores (fornecedores, parceiros, etc.)
  const loadCredores = useCallback(async () => {
    setLoadingCredores(true);
    setCredoresError(null);
    try {
      const { data, error } = await supabase
        .from('entidades')
        .select('*')
        .in('tipo', ['fornecedor', 'parceiro', 'funcionario'])
        .order('nome');

      if (error) throw error;
      setCredores(data || []);
    } catch (err) {
      console.error('Erro ao carregar credores:', err);
      setCredores([]);
      setCredoresError(
        'Não foi possível carregar credores do banco. ' +
        'Verifique as permissões (RLS) no Supabase para a tabela entidades.'
      );
    } finally {
      setLoadingCredores(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadCredores();
      // Reset form - mantém a data atual do sistema mas permite edição
      const dataAtual = format(new Date(), 'yyyy-MM-dd');
      setFormData({
        descricao: '',
        valor: '',
        categoria: '',
        data_vencimento: dataAtual,
        entidade_id: '',
        observacao: '',
        is_parcelada: false,
        numero_parcelas: 2,
      });
      setSelectedCredor(null);
      setErrors({});
    }
  }, [open, loadCredores]);

  // Calcular valor da parcela
  const valorParcela = formData.is_parcelada && formData.numero_parcelas > 0
    ? parseFloat(formData.valor || '0') / formData.numero_parcelas
    : parseFloat(formData.valor || '0');

  // Gerar preview das parcelas
  const parcelasPreview = formData.is_parcelada
    ? Array.from({ length: Math.min(formData.numero_parcelas, 12) }, (_, i) => ({
        numero: i + 1,
        valor: valorParcela,
        vencimento: addMonths(new Date(formData.data_vencimento), i),
      }))
    : [];

  // Validação
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.descricao.trim()) newErrors.descricao = 'Descrição obrigatória';
    if (!formData.valor || parseFloat(formData.valor) <= 0) newErrors.valor = 'Valor inválido';
    if (!formData.categoria) newErrors.categoria = 'Selecione uma categoria';
    if (!formData.data_vencimento) newErrors.data_vencimento = 'Data obrigatória';
    if (formData.is_parcelada && formData.numero_parcelas < 2) {
      newErrors.numero_parcelas = 'Mínimo 2 parcelas';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const dadosDivida: DividaInsert = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        categoria: formData.categoria,
        data_vencimento: formData.data_vencimento,
        entidade_id: selectedCredor?.id,
        observacao: formData.observacao || undefined,
        is_parcelada: formData.is_parcelada,
        numero_parcelas: formData.is_parcelada ? formData.numero_parcelas : undefined,
      };

      const result = await onSave(dadosDivida);
      if (result.success) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  // Estilos compartilhados
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
      '&.Mui-focused fieldset': { borderColor: '#ce2b37' },
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
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(206, 43, 55, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
            💳 Nova Dívida
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Descrição */}
        <TextField
          fullWidth
          label="Descrição da Dívida"
          size="small"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          error={!!errors.descricao}
          helperText={errors.descricao}
          placeholder="Ex: Financiamento da Van"
          sx={inputSx}
        />

        {credoresError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {credoresError}
          </Alert>
        )}

        {/* Credor (Autocomplete) */}
        <Autocomplete
          options={credores}
          loading={loadingCredores}
          value={selectedCredor}
          onChange={(_, value) => setSelectedCredor(value)}
          getOptionLabel={(option) => option.nome}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 18 }} />
              <Box>
                <Typography variant="body2">{option.nome}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {option.tipo}
                </Typography>
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Credor (opcional)"
              size="small"
              placeholder="Buscar credor..."
              sx={inputSx}
            />
          )}
          sx={{
            '& .MuiAutocomplete-popupIndicator': { color: 'rgba(255, 255, 255, 0.5)' },
            '& .MuiAutocomplete-clearIndicator': { color: 'rgba(255, 255, 255, 0.5)' },
          }}
        />

        {/* Valor e Categoria */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Valor Total"
            type="number"
            size="small"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            error={!!errors.valor}
            helperText={errors.valor}
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
          <TextField
            select
            label="Categoria"
            size="small"
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            error={!!errors.categoria}
            sx={{ ...inputSx, flex: 1 }}
          >
            {CATEGORIAS_DIVIDA.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Data de Vencimento */}
        <TextField
          label="Data de Vencimento"
          type="date"
          size="small"
          value={formData.data_vencimento}
          onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
          error={!!errors.data_vencimento}
          helperText={formData.is_parcelada ? 'Vencimento da 1ª parcela' : undefined}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 18 }} />
              </InputAdornment>
            ),
            sx: { colorScheme: 'dark' },
          }}
          sx={inputSx}
        />

        {/* Divider visual */}
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 1 }} />

        {/* Toggle Parcelamento */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: formData.is_parcelada
              ? 'rgba(206, 43, 55, 0.1)'
              : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${formData.is_parcelada ? 'rgba(206, 43, 55, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
            transition: 'all 0.2s ease',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_parcelada}
                onChange={(e) => setFormData({ ...formData, is_parcelada: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#ce2b37',
                    '& + .MuiSwitch-track': {
                      backgroundColor: '#ce2b37',
                    },
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LayersIcon sx={{ color: formData.is_parcelada ? '#ce2b37' : 'rgba(255, 255, 255, 0.4)', fontSize: 20 }} />
                <Typography sx={{ color: '#f5f5f5', fontWeight: 500 }}>
                  Dívida Parcelada
                </Typography>
              </Box>
            }
          />

          {/* Campos de parcelamento (aparecem quando toggle ativo) */}
          <Collapse in={formData.is_parcelada}>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Número de Parcelas"
                type="number"
                size="small"
                value={formData.numero_parcelas}
                onChange={(e) => setFormData({ ...formData, numero_parcelas: parseInt(e.target.value) || 2 })}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                error={!!errors.numero_parcelas}
                helperText={errors.numero_parcelas}
                inputProps={{ min: 2, max: 120 }}
                sx={inputSx}
              />

              {/* Preview das parcelas */}
              {formData.valor && formData.numero_parcelas >= 2 && (
                <Alert
                  severity="info"
                  icon={false}
                  sx={{
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    color: '#2196f3',
                    border: '1px solid rgba(33, 150, 243, 0.2)',
                    '& .MuiAlert-message': { width: '100%' },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    📋 Prévia do Parcelamento
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    Valor de cada parcela: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorParcela)}</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {parcelasPreview.map((p) => (
                      <Box
                        key={p.numero}
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          fontSize: '0.7rem',
                        }}
                      >
                        {p.numero}/{formData.numero_parcelas} - {format(p.vencimento, 'dd/MM/yy')}
                      </Box>
                    ))}
                    {formData.numero_parcelas > 12 && (
                      <Box sx={{ px: 1, py: 0.5, fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                        +{formData.numero_parcelas - 12} parcelas...
                      </Box>
                    )}
                  </Box>
                </Alert>
              )}
            </Box>
          </Collapse>
        </Box>

        {/* Observação */}
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
            backgroundColor: '#ce2b37',
            boxShadow: '0 4px 12px rgba(206, 43, 55, 0.3)',
            '&:hover': { backgroundColor: '#b02430' },
            '&.Mui-disabled': { bgcolor: 'rgba(206, 43, 55, 0.3)' },
          }}
        >
          {saving ? 'Salvando...' : formData.is_parcelada ? `Criar ${formData.numero_parcelas} Parcelas` : 'Criar Dívida'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DividasModal;
