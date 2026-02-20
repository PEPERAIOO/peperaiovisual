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
  Divider,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  AttachFile as AttachFileIcon,
  Category as CategoryIcon,
  Edit as EditIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { GastoDelegadoInsert, GastoDelegado, formatCurrency } from '../../types/delegacao';
import supabase from '../../lib/supabaseClient';

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

interface Entidade {
  id: string;
  nome: string;
  tipo: string;
}

interface RegistrarGastoModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: GastoDelegadoInsert) => Promise<{ success: boolean }>;
  verbaId: string;
  saldoDisponivel: number;
  gastoParaEditar?: GastoDelegado | null;
}

const RegistrarGastoModal = ({
  open,
  onClose,
  onSave,
  verbaId,
  saldoDisponivel,
  gastoParaEditar,
}: RegistrarGastoModalProps) => {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    comprovante_url: '',
    entidade_id: '',
    data_registro: new Date().toISOString().split('T')[0], // Data padrão: hoje
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingEntidades, setLoadingEntidades] = useState(false);

  const isEditando = !!gastoParaEditar;

  // Carregar categorias reais do sistema (categorias de despesa do caixa)
  useEffect(() => {
    const loadCategorias = async () => {
      console.log('[RegistrarGastoModal] Iniciando carregamento de categorias...');
      setLoadingCategorias(true);
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, nome, tipo')
          .eq('tipo', 'despesa')
          .order('nome');

        console.log('[RegistrarGastoModal] Categorias carregadas:', { data, error });
        
        if (error) throw error;
        setCategorias(data || []);
      } catch (err) {
        console.error('[RegistrarGastoModal] Erro ao carregar categorias:', err);
      } finally {
        setLoadingCategorias(false);
      }
    };

    if (open) {
      console.log('[RegistrarGastoModal] Modal aberto, carregando categorias...');
      loadCategorias();
    }
  }, [open]);

  // Carregar entidades (funcionários) do sistema
  useEffect(() => {
    const loadEntidades = async () => {
      setLoadingEntidades(true);
      try {
        const { data, error } = await supabase
          .from('entidades')
          .select('id, nome, tipo')
          .eq('tipo', 'funcionario')
          .order('nome');

        if (error) throw error;
        setEntidades(data || []);
      } catch (err) {
        console.error('Erro ao carregar funcionários:', err);
      } finally {
        setLoadingEntidades(false);
      }
    };

    if (open) {
      loadEntidades();
    }
  }, [open]);

  // Reset form ou preencher com dados para edição
  useEffect(() => {
    if (open) {
      if (gastoParaEditar) {
        // Preencher com dados existentes para edição
        setFormData({
          descricao: gastoParaEditar.descricao || '',
          valor: gastoParaEditar.valor?.toString() || '',
          categoria: gastoParaEditar.categoria || '',
          comprovante_url: gastoParaEditar.comprovante_url || '',
          entidade_id: gastoParaEditar.entidade_id || '',
          data_registro: gastoParaEditar.data_registro || new Date().toISOString().split('T')[0],
        });
      } else {
        // Limpar para novo registro
        setFormData({
          descricao: '',
          valor: '',
          categoria: '',
          comprovante_url: '',
          entidade_id: '',
          data_registro: new Date().toISOString().split('T')[0],
        });
      }
      setErrors({});
    }
  }, [open, gastoParaEditar]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.descricao.trim()) newErrors.descricao = 'Informe uma descrição';
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Informe um valor válido';
    }
    // Ao editar, considerar o valor anterior no saldo
    const saldoParaValidar = isEditando 
      ? saldoDisponivel + (gastoParaEditar?.valor || 0)
      : saldoDisponivel;
    if (parseFloat(formData.valor) > saldoParaValidar) {
      newErrors.valor = `Valor excede o saldo disponível (${formatCurrency(saldoParaValidar)})`;
    }
    if (!formData.categoria) newErrors.categoria = 'Selecione uma categoria';
    if (!formData.comprovante_url.trim()) newErrors.comprovante_url = 'Comprovante é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const result = await onSave({
        verba_id: verbaId,
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        categoria: formData.categoria,
        comprovante_url: formData.comprovante_url.trim(),
        entidade_id: formData.entidade_id || undefined,
        data_registro: formData.data_registro, // Incluir data selecionada
      });
      if (result.success) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  // Simular upload de arquivo (gera URL mock)
  const handleSimularUpload = () => {
    const mockUrl = `https://storage.empresa.com/comprovantes/${Date.now()}-nota.pdf`;
    setFormData({ ...formData, comprovante_url: mockUrl });
  };

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
                background: isEditando 
                  ? 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)'
                  : 'linear-gradient(135deg, #ce2b37 0%, #ff4444 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isEditando ? <EditIcon sx={{ color: '#fff', fontSize: 22 }} /> : <ReceiptIcon sx={{ color: '#fff', fontSize: 22 }} />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f5f5f5' }}>
                {isEditando ? 'Editar Gasto' : 'Registrar Gasto'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Saldo: {formatCurrency(isEditando ? saldoDisponivel + (gastoParaEditar?.valor || 0) : saldoDisponivel)}
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
        {saldoDisponivel <= 0 && !isEditando && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Atenção: Não há saldo disponível para novos gastos.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Descrição */}
          <TextField
            label="Descrição do Gasto"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            error={!!errors.descricao}
            helperText={errors.descricao}
            fullWidth
            placeholder="Ex: 50 sacos de cimento"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              },
            }}
          />

          {/* Categoria */}
          <TextField
            select
            label="Categoria"
            value={formData.categoria}
            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            error={!!errors.categoria}
            helperText={errors.categoria}
            fullWidth
            disabled={loadingCategorias}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CategoryIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
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
            {loadingCategorias && (
              <MenuItem disabled>Carregando categorias...</MenuItem>
            )}
            {!loadingCategorias && categorias.length === 0 && (
              <MenuItem disabled>Nenhuma categoria cadastrada</MenuItem>
            )}
            {categorias.map((cat) => (
              <MenuItem key={cat.id} value={cat.nome}>
                {cat.nome}
              </MenuItem>
            ))}
          </TextField>

          {/* Funcionário (opcional - para diárias) */}
          <TextField
            select
            label="Funcionário (Opcional - para Diárias)"
            value={formData.entidade_id}
            onChange={(e) => setFormData({ ...formData, entidade_id: e.target.value })}
            fullWidth
            disabled={loadingEntidades}
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
            <MenuItem value="">
              <em>Nenhum (gasto geral)</em>
            </MenuItem>
            {loadingEntidades && (
              <MenuItem disabled>Carregando funcionários...</MenuItem>
            )}
            {entidades.map((ent) => (
              <MenuItem key={ent.id} value={ent.id}>
                {ent.nome}
              </MenuItem>
            ))}
          </TextField>

          {/* Data */}
          <TextField
            label="Data do Gasto"
            type="date"
            value={formData.data_registro}
            onChange={(e) => setFormData({ ...formData, data_registro: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              },
            }}
          />

          {/* Valor */}
          <TextField
            label="Valor"
            type="number"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            onFocus={(e) => (e.target as HTMLInputElement).select()}
            error={!!errors.valor}
            helperText={errors.valor}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>R$</Typography>
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

          {/* Comprovante (URL) */}
          <Box>
            <TextField
              label="Comprovante (URL)"
              value={formData.comprovante_url}
              onChange={(e) => setFormData({ ...formData, comprovante_url: e.target.value })}
              error={!!errors.comprovante_url}
              helperText={errors.comprovante_url || 'Link para o comprovante (nota fiscal, recibo, etc.)'}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachFileIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
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
            <Button
              size="small"
              onClick={handleSimularUpload}
              sx={{ mt: 1, color: '#2196f3', textTransform: 'none' }}
            >
              📎 Simular Upload de Arquivo
            </Button>
          </Box>

          {/* Preview do novo saldo */}
          {formData.valor && parseFloat(formData.valor) > 0 && parseFloat(formData.valor) <= saldoDisponivel && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {isEditando ? 'Após edição:' : 'Após este gasto:'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 600 }}>
                Novo Saldo: {formatCurrency(
                  isEditando 
                    ? saldoDisponivel + (gastoParaEditar?.valor || 0) - parseFloat(formData.valor)
                    : saldoDisponivel - parseFloat(formData.valor)
                )}
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
          disabled={saving || (saldoDisponivel <= 0 && !isEditando)}
          sx={{
            bgcolor: isEditando ? '#ff9800' : '#ce2b37',
            '&:hover': { bgcolor: isEditando ? '#f57c00' : '#b02430' },
            borderRadius: 2,
            px: 3,
          }}
        >
          {saving ? 'Salvando...' : isEditando ? 'Salvar Alterações' : 'Registrar Gasto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RegistrarGastoModal;
