import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Skeleton,
  Alert,
  InputAdornment,
  Snackbar,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  BuildCircle as FixIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import supabase from '../lib/supabaseClient';
import { registrarNotificacao } from '../utils/notificationLogger';
import { Entity, getInitials } from '../types/entidades';
import { formatCurrency } from '../types/obras';

// Interface para sócio com retiradas calculadas
interface SocioComRetiradas extends Entity {
  totalRetirado: number;
  disponivelParaRetirar: number;
  ultimaRetirada?: string;
}

interface RetiradaItem {
  id: string;
  descricao: string;
  valor: number;
  data_pagamento?: string | null;
}

// Componente de Card do Sócio
interface SocioCardProps {
  socio: SocioComRetiradas;
  maxRetirado: number;
  onClick: () => void;
}

const SocioCard = ({ socio, onClick }: SocioCardProps) => {
  const temDireitoRetirar = socio.disponivelParaRetirar > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          height: '100%',
          minHeight: 280,
          background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: temDireitoRetirar ? 'rgba(0, 146, 70, 0.4)' : 'rgba(255, 255, 255, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': temDireitoRetirar ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #009246, #00c853)',
          } : {},
        }}
      >
        <CardActionArea
          onClick={onClick}
          sx={{
            height: '100%',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          {/* Avatar */}
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: '1.8rem',
              fontWeight: 700,
              bgcolor: temDireitoRetirar ? '#009246' : '#ce2b37',
              border: '3px solid',
              borderColor: temDireitoRetirar ? 'rgba(0, 146, 70, 0.3)' : 'rgba(206, 43, 55, 0.3)',
              mb: 2,
            }}
          >
            {getInitials(socio.nome)}
          </Avatar>

          {/* Nome */}
          <Typography
            variant="h6"
            sx={{
              color: '#fff',
              fontWeight: 600,
              textAlign: 'center',
              mb: 1,
            }}
          >
            {socio.nome}
          </Typography>

          {/* Total Retirado */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'block',
                mb: 0.5,
              }}
            >
              Total já retirado
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 700,
              }}
            >
              {formatCurrency(socio.totalRetirado)}
            </Typography>
          </Box>

          {/* Disponível para Retirar */}
          <Box
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: temDireitoRetirar 
                ? 'rgba(0, 146, 70, 0.15)' 
                : 'rgba(255, 255, 255, 0.05)',
              width: '100%',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: temDireitoRetirar ? '#4caf50' : 'rgba(255, 255, 255, 0.5)',
                display: 'block',
                mb: 0.5,
                fontWeight: 500,
              }}
            >
              {temDireitoRetirar ? '✓ Disponível para retirar' : 'Equalizado'}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: temDireitoRetirar ? '#4caf50' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: 800,
              }}
            >
              {formatCurrency(socio.disponivelParaRetirar)}
            </Typography>
          </Box>

          {/* Última retirada */}
          {socio.ultimaRetirada && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                mt: 2,
              }}
            >
              Última retirada: {format(new Date(socio.ultimaRetirada), "dd/MM/yyyy", { locale: ptBR })}
            </Typography>
          )}
        </CardActionArea>
      </Card>
    </motion.div>
  );
};

// Modal de Nova Retirada
interface NovaRetiradaModalProps {
  open: boolean;
  onClose: () => void;
  socio: SocioComRetiradas | null;
  onSave: (valor: number, descricao: string, data: string) => Promise<void>;
  saving: boolean;
  retiradas: RetiradaItem[];
  loadingRetiradas: boolean;
  onDeleteRetirada: (retiradaId: string) => void;
}

const NovaRetiradaModal = ({
  open,
  onClose,
  socio,
  onSave,
  saving,
  retiradas,
  loadingRetiradas,
  onDeleteRetirada,
}: NovaRetiradaModalProps) => {
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (open) {
      setValor('');
      setDescricao(`Retirada de lucro - ${socio?.nome || ''}`);
      setData(format(new Date(), 'yyyy-MM-dd'));
      setError('');
    }
  }, [open, socio]);

  const handleSave = async () => {
    const valorNum = parseFloat(valor.replace(',', '.'));
    
    if (!valorNum || valorNum <= 0) {
      setError('Digite um valor válido maior que zero');
      return;
    }

    if (socio && valorNum > socio.disponivelParaRetirar && socio.disponivelParaRetirar > 0) {
      setError(`Valor máximo disponível: ${formatCurrency(socio.disponivelParaRetirar)}`);
      return;
    }

    if (!data) {
      setError('Selecione uma data para a retirada');
      return;
    }

    setError('');
    await onSave(valorNum, descricao, data);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          backgroundImage: 'none',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{ 
              bgcolor: '#009246',
              width: 48,
              height: 48,
            }}
          >
            {socio ? getInitials(socio.nome) : <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nova Retirada de Lucro
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {socio?.nome}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        {/* Info de saldo disponível */}
        {socio && socio.disponivelParaRetirar > 0 && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              bgcolor: 'rgba(0, 146, 70, 0.15)',
              color: '#4caf50',
              '& .MuiAlert-icon': { color: '#4caf50' },
            }}
          >
            Disponível para equalização: <strong>{formatCurrency(socio.disponivelParaRetirar)}</strong>
          </Alert>
        )}

        {socio && socio.disponivelParaRetirar === 0 && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              bgcolor: 'rgba(33, 150, 243, 0.15)',
              color: '#2196f3',
              '& .MuiAlert-icon': { color: '#2196f3' },
            }}
          >
            Este sócio está equalizado. Uma nova retirada irá desbalancear a divisão.
          </Alert>
        )}

        <TextField
          label="Valor da Retirada"
          fullWidth
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
          }}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)',
            },
          }}
          autoFocus
        />

        <TextField
          label="Descrição"
          fullWidth
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          multiline
          rows={2}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)',
            },
          }}
        />

        <TextField
          type="date"
          label="Data da Retirada"
          fullWidth
          value={data}
          onChange={(e) => setData(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)',
              color: '#fff',
            },
            '& input[type="date"]::-webkit-calendar-picker-indicator': {
              filter: 'invert(1)',
              cursor: 'pointer',
            },
          }}
        />

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
          Retiradas registradas
        </Typography>

        {loadingRetiradas ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        ) : retiradas.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Nenhuma retirada registrada para este sócio.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {retiradas.map((r) => (
              <Box
                key={r.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }} noWrap>
                    {r.descricao}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {r.data_pagamento || '-'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: '#ce2b37', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatCurrency(r.valor)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => onDeleteRetirada(r.id)}
                    sx={{
                      color: 'rgba(255,255,255,0.55)',
                      '&:hover': { color: '#ce2b37', bgcolor: 'rgba(206, 43, 55, 0.08)' },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Info pré-preenchida */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Dados pré-preenchidos:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(206, 43, 55, 0.2)', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: '#ce2b37' }}>
                Tipo: Despesa
              </Typography>
            </Box>
            <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(0, 146, 70, 0.2)', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: '#4caf50' }}>
                Status: Pago
              </Typography>
            </Box>
            <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'rgba(255, 193, 7, 0.2)', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: '#ffc107' }}>
                Categoria: Retirada de Lucro
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !valor}
          startIcon={saving ? <CircularProgress size={18} /> : <AddIcon />}
          sx={{
            bgcolor: '#009246',
            '&:hover': { bgcolor: '#007a3d' },
          }}
        >
          {saving ? 'Salvando...' : 'Registrar Retirada'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente Principal
const Socios = () => {
  const [socios, setSocios] = useState<SocioComRetiradas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSocio, setSelectedSocio] = useState<SocioComRetiradas | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fixingOldWithdrawals, setFixingOldWithdrawals] = useState(false);
  const [retiradasSocio, setRetiradasSocio] = useState<RetiradaItem[]>([]);
  const [loadingRetiradasSocio, setLoadingRetiradasSocio] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Carregar sócios e calcular retiradas
  const loadSocios = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Buscar todos os sócios
      const { data: sociosData, error: sociosError } = await supabase
        .from('entidades')
        .select('*')
        .eq('tipo', 'socio')
        .order('nome');

      if (sociosError) throw sociosError;

      if (!sociosData || sociosData.length === 0) {
        setSocios([]);
        setLoading(false);
        return;
      }

      // 2. Buscar retiradas de cada sócio
      const sociosIds = sociosData.map(s => s.id);
      
      const { data: retiradasData, error: retiradasError } = await supabase
        .from('transacoes')
        .select('entidade_id, valor, data_pagamento')
        .in('entidade_id', sociosIds)
        .eq('categoria', 'Retirada de Lucro')
        .eq('status', 'pago');

      if (retiradasError) throw retiradasError;

      // 3. Calcular totais por sócio
      const retiradasPorSocio = new Map<string, { total: number; ultima?: string }>();
      
      (retiradasData || []).forEach((r) => {
        const atual = retiradasPorSocio.get(r.entidade_id) || { total: 0 };
        atual.total += r.valor || 0;
        if (r.data_pagamento && (!atual.ultima || r.data_pagamento > atual.ultima)) {
          atual.ultima = r.data_pagamento;
        }
        retiradasPorSocio.set(r.entidade_id, atual);
      });

      // 4. Encontrar o máximo retirado
      let maxRetirado = 0;
      retiradasPorSocio.forEach(({ total }) => {
        if (total > maxRetirado) maxRetirado = total;
      });

      // 5. Montar array de sócios com cálculos
      const sociosCalculados: SocioComRetiradas[] = sociosData.map((socio) => {
        const retiradas = retiradasPorSocio.get(socio.id) || { total: 0 };
        return {
          ...socio,
          totalRetirado: retiradas.total,
          disponivelParaRetirar: Math.max(0, maxRetirado - retiradas.total),
          ultimaRetirada: retiradas.ultima,
        };
      });

      setSocios(sociosCalculados);
    } catch (err) {
      console.error('Erro ao carregar sócios:', err);
      setError('Erro ao carregar dados dos sócios. Tente novamente.');
      setSocios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSocios();
  }, [loadSocios]);

  // Calcular máximo retirado (para exibição)
  const maxRetirado = useMemo(() => {
    return Math.max(...socios.map(s => s.totalRetirado), 0);
  }, [socios]);

  // Total geral de retiradas
  const totalGeral = useMemo(() => {
    return socios.reduce((acc, s) => acc + s.totalRetirado, 0);
  }, [socios]);

  // Abrir modal de nova retirada
  const handleOpenModal = (socio: SocioComRetiradas) => {
    setSelectedSocio(socio);
    setModalOpen(true);
  };

  const loadRetiradasDoSocioSelecionado = useCallback(async () => {
    if (!selectedSocio) {
      setRetiradasSocio([]);
      return;
    }

    setLoadingRetiradasSocio(true);
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('id, descricao, valor, data_pagamento')
        .eq('entidade_id', selectedSocio.id)
        .eq('categoria', 'Retirada de Lucro')
        .eq('status', 'pago')
        .order('data_pagamento', { ascending: false });

      if (error) throw error;

      setRetiradasSocio((data as RetiradaItem[]) || []);
    } catch (err) {
      console.error('Erro ao carregar retiradas do sócio:', err);
      setRetiradasSocio([]);
    } finally {
      setLoadingRetiradasSocio(false);
    }
  }, [selectedSocio]);

  useEffect(() => {
    if (modalOpen) loadRetiradasDoSocioSelecionado();
  }, [modalOpen, loadRetiradasDoSocioSelecionado]);

  const handleDeleteRetirada = async (retiradaId: string) => {
    if (!selectedSocio) return;
    if (!window.confirm('Deseja excluir esta retirada? Ela também sairá do caixa.')) return;

    try {
      const { error: deleteError } = await supabase.from('transacoes').delete().eq('id', retiradaId);
      if (deleteError) throw deleteError;

      setSnackbar({
        open: true,
        message: 'Retirada excluída com sucesso!',
        severity: 'success',
      });

      await loadSocios();
      await loadRetiradasDoSocioSelecionado();
    } catch (err) {
      console.error('Erro ao excluir retirada:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir retirada. Tente novamente.',
        severity: 'error',
      });
    }
  };

  const handleFixOldWithdrawals = async () => {
    if (!window.confirm('Corrigir retiradas antigas sem usuário? Isso faz elas aparecerem no caixa.')) return;

    setFixingOldWithdrawals(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';

      const { error: updateError } = await supabase
        .from('transacoes')
        .update({ user_id: user.id, user_nome: userNome })
        .eq('categoria', 'Retirada de Lucro')
        .is('user_id', null);

      if (updateError) throw updateError;

      setSnackbar({
        open: true,
        message: 'Retiradas antigas corrigidas (user_id preenchido).',
        severity: 'success',
      });

      await loadSocios();
      await loadRetiradasDoSocioSelecionado();
    } catch (err) {
      console.error('Erro ao corrigir retiradas antigas:', err);
      setSnackbar({
        open: true,
        message: 'Não foi possível corrigir pelo app (provável RLS). Use o SQL em docs.',
        severity: 'error',
      });
    } finally {
      setFixingOldWithdrawals(false);
    }
  };

  // Salvar nova retirada
  const handleSaveRetirada = async (valor: number, descricao: string, data: string) => {
    if (!selectedSocio) return;

    setSaving(true);
    try {
      // Obter user_id (evita registros sem dono quando há RLS)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';

      // Criar timestamp ISO com a data selecionada mantendo a hora atual
      const dataSelecionada = new Date(data + 'T00:00:00');
      const agora = new Date();
      dataSelecionada.setHours(agora.getHours(), agora.getMinutes(), agora.getSeconds());
      const dataISO = dataSelecionada.toISOString();

      const { error: insertError } = await supabase
        .from('transacoes')
        .insert({
          user_id: user.id,
          user_nome: userNome,
          descricao,
          valor,
          tipo: 'despesa',
          status: 'pago',
          categoria: 'Retirada de Lucro',
          entidade_id: selectedSocio.id,
          data_vencimento: dataISO,
          data_pagamento: dataISO,
        });

      if (insertError) throw insertError;

      await registrarNotificacao({
        tipo: 'financeiro',
        titulo: 'Movimentação financeira',
        mensagem: `Retirada de sócio • R$ ${valor.toFixed(2)} • por ${userNome}`,
        link: '/financeiro',
        metadata: { entidade_id: selectedSocio.id },
      });

      setSnackbar({
        open: true,
        message: `Retirada de ${formatCurrency(valor)} registrada com sucesso!`,
        severity: 'success',
      });

      setModalOpen(false);
      
      // Recarregar dados para recalcular saldos
      await loadSocios();
      await loadRetiradasDoSocioSelecionado();
    } catch (err) {
      console.error('Erro ao salvar retirada:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao registrar retirada. Tente novamente.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            Painel dos Sócios
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Equalizador de retiradas de lucro
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<FixIcon />}
            onClick={handleFixOldWithdrawals}
            disabled={loading || fixingOldWithdrawals}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.4)',
                bgcolor: 'rgba(255,255,255,0.05)',
              },
            }}
          >
            {fixingOldWithdrawals ? 'Corrigindo...' : 'Corrigir retiradas antigas'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSocios}
            disabled={loading}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.8)',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.4)',
                bgcolor: 'rgba(255,255,255,0.05)',
              },
            }}
          >
            Atualizar
          </Button>
        </Box>
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              bgcolor: 'rgba(0, 146, 70, 0.1)',
              border: '1px solid rgba(0, 146, 70, 0.2)',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#009246', width: 48, height: 48 }}>
                <AccountBalanceIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Total de Retiradas
                </Typography>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                  {formatCurrency(totalGeral)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card
            sx={{
              bgcolor: 'rgba(206, 43, 55, 0.1)',
              border: '1px solid rgba(206, 43, 55, 0.2)',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#ce2b37', width: 48, height: 48 }}>
                <TrendingUpIcon />
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Maior Retirada Individual
                </Typography>
                <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                  {formatCurrency(maxRetirado)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Loading */}
      {loading && (
        <Grid container spacing={3}>
          {[1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton
                variant="rounded"
                height={280}
                sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Error */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Sem sócios cadastrados */}
      {!loading && !error && socios.length === 0 && (
        <Card
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 3,
          }}
        >
          <PersonIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
            Nenhum sócio cadastrado
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Cadastre sócios na página de Entidades com o tipo "Sócio" para usar o equalizador.
          </Typography>
        </Card>
      )}

      {/* Grid de Sócios */}
      {!loading && socios.length > 0 && (
        <Grid container spacing={3}>
          <AnimatePresence mode="popLayout">
            {socios.map((socio) => (
              <Grid key={socio.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <SocioCard
                  socio={socio}
                  maxRetirado={maxRetirado}
                  onClick={() => handleOpenModal(socio)}
                />
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      <NovaRetiradaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        socio={selectedSocio}
        onSave={handleSaveRetirada}
        saving={saving}
        retiradas={retiradasSocio}
        loadingRetiradas={loadingRetiradasSocio}
        onDeleteRetirada={handleDeleteRetirada}
      />

      {/* Legenda */}
      {!loading && socios.length > 0 && (
        <Box
          sx={{
            mt: 4,
            p: 2,
            bgcolor: 'rgba(255,255,255,0.02)',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <strong>Como funciona o equalizador:</strong> O sistema encontra o sócio que mais retirou e 
            calcula quanto os outros podem retirar para ficarem iguais. Cards com borda verde indicam 
            saldo positivo disponível para retirada. Clique no card para registrar uma nova retirada.
          </Typography>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Socios;
