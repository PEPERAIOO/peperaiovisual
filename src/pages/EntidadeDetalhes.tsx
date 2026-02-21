import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
  Skeleton,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  LocationOn as LocationIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  Construction as ConstructionIcon,
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon,
  Handshake as HandshakeIcon,
  AccountBalance as AccountBalanceIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Delete as DeleteIcon,
  AttachMoney as AttachMoneyIcon,
  MoneyOff as MoneyOffIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { pdf } from '@react-pdf/renderer';

import supabase from '../lib/supabaseClient';
import { EntityModal } from '../components/entidades';
import {
  Entity,
  EntityType,
  ENTITY_TYPE_CONFIG,
  formatPhone,
  formatDocument,
  getWhatsAppLink,
  getInitials,
} from '../types/entidades';
import { Obra, OBRA_STATUS_CONFIG, formatCurrency } from '../types/obras';
import ReciboPagamentoPDF, { ReciboPagamentoData } from '../components/financeiro/ReciboPagamentoPDF';
import { downloadFuncionarioPdf } from '../utils/funcionarioPdf';

// Interfaces para dados relacionados
interface Pagamento {
  id: string;
  descricao: string;
  valor: number;
  status: string;
  data_vencimento?: string;
  data_pagamento?: string;
  obra_id?: string;
  obra?: {
    id: string;
    nome: string;
  };
}

interface Fornecimento {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento?: string;
  status: string;
  obra?: {
    id: string;
    nome: string;
  };
}

// Interface para retirada de sócio
interface Retirada {
  id: string;
  descricao: string;
  valor: number;
  data_pagamento: string;
  categoria: string;
}

// Interface para dados de equalização
interface DadosEqualizacao {
  totalRetirado: number;
  disponivelParaRetirar: number;
  maxRetirado: number;
}

// Tab Panel Component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
    {value === index && children}
  </Box>
);

const MotionBox = motion.create(Box);

// Cores de borda por tipo
const BORDER_COLORS: Record<EntityType, string> = {
  cliente: '#2196f3',
  funcionario: '#009246',
  fornecedor: '#ff9800',
  parceiro: '#FFD700',
  socio: '#ce2b37',
};

// Ícones por tipo
const TYPE_ICONS: Record<EntityType, React.ReactNode> = {
  cliente: <BusinessIcon />,
  funcionario: <BadgeIcon />,
  fornecedor: <LocalShippingIcon />,
  parceiro: <HandshakeIcon />,
  socio: <HandshakeIcon />,
};

// Modal de Nova Retirada (Sócio)
interface NovaRetiradaModalProps {
  open: boolean;
  onClose: () => void;
  socioNome: string;
  disponivelParaRetirar: number;
  onSave: (valor: number, descricao: string, data: string) => Promise<void>;
  saving: boolean;
}

const NovaRetiradaModal = ({ open, onClose, socioNome, disponivelParaRetirar, onSave, saving }: NovaRetiradaModalProps) => {
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (open) {
      setValor('');
      setDescricao(`Retirada de lucro - ${socioNome}`);
      setData(format(new Date(), 'yyyy-MM-dd'));
      setError('');
    }
  }, [open, socioNome]);

  const handleSave = async () => {
    const valorNum = parseFloat(valor.replace(',', '.'));
    
    if (!valorNum || valorNum <= 0) {
      setError('Digite um valor válido maior que zero');
      return;
    }

    if (valorNum > disponivelParaRetirar && disponivelParaRetirar > 0) {
      setError(`Valor máximo para equalização: ${formatCurrency(disponivelParaRetirar)}`);
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
              bgcolor: '#ce2b37',
              width: 48,
              height: 48,
            }}
          >
            {getInitials(socioNome)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nova Retirada de Lucro
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {socioNome}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        {/* Info de saldo disponível */}
        {disponivelParaRetirar > 0 && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              bgcolor: 'rgba(0, 146, 70, 0.15)',
              color: '#4caf50',
              '& .MuiAlert-icon': { color: '#4caf50' },
            }}
          >
            Disponível para equalização: <strong>{formatCurrency(disponivelParaRetirar)}</strong>
          </Alert>
        )}

        {disponivelParaRetirar === 0 && (
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
              color: '#f5f5f5',
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
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
              color: '#f5f5f5',
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
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
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
            '& input[type="date"]::-webkit-calendar-picker-indicator': {
              filter: 'invert(1)',
              cursor: 'pointer',
            },
          }}
        />

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
            bgcolor: '#ce2b37',
            '&:hover': { bgcolor: '#b02530' },
          }}
        >
          {saving ? 'Salvando...' : 'Registrar Retirada'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Modal de Nova Diária (Funcionário)
interface NovaDiariaModalProps {
  open: boolean;
  onClose: () => void;
  funcionarioNome: string;
  onSave: (dados: DadosDiaria) => Promise<void>;
  saving: boolean;
  obras: Obra[];
}

interface DadosDiaria {
  valorBase: number;
  horasExtras: number;
  valorHoraExtra: number;
  passagens: number;
  outrosExtras: number;
  valorTotal: number;
  descricao: string;
  obraId?: string;
  dataPagamento: string;
  statusPagamento: 'adiantado' | 'pendente' | 'pago';
}

interface PresencaRegistro {
  id: string;
  funcionario_id: string;
  data: string;
  trabalhou: boolean;
  observacao?: string;
  created_at?: string;
}

const NovaDiariaModal = ({ open, onClose, funcionarioNome, onSave, saving, obras }: NovaDiariaModalProps) => {
  const [valorBase, setValorBase] = useState('');
  const [horasExtras, setHorasExtras] = useState('');
  const [valorHoraExtra, setValorHoraExtra] = useState('');
  const [passagens, setPassagens] = useState('');
  const [outrosExtras, setOutrosExtras] = useState('');
  const [descricao, setDescricao] = useState('');
  const [obraId, setObraId] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [statusPagamento, setStatusPagamento] = useState<'adiantado' | 'pendente' | 'pago'>('pago');
  const [error, setError] = useState('');

  // Calcular valor total
  const valorTotal = useMemo(() => {
    const base = parseFloat(valorBase.replace(',', '.')) || 0;
    const horas = parseFloat(horasExtras.replace(',', '.')) || 0;
    const valorHora = parseFloat(valorHoraExtra.replace(',', '.')) || 0;
    const pass = parseFloat(passagens.replace(',', '.')) || 0;
    const outros = parseFloat(outrosExtras.replace(',', '.')) || 0;
    
    return base + (horas * valorHora) + pass + outros;
  }, [valorBase, horasExtras, valorHoraExtra, passagens, outrosExtras]);

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (open) {
      setValorBase('');
      setHorasExtras('');
      setValorHoraExtra('');
      setPassagens('');
      setOutrosExtras('');
      setDescricao(`Diária - ${funcionarioNome}`);
      setObraId('');
      const today = new Date().toISOString().split('T')[0];
      setDataPagamento(today);
      setStatusPagamento('pago');
      setError('');
    }
  }, [open, funcionarioNome]);

  const handleSave = async () => {
    const baseNum = parseFloat(valorBase.replace(',', '.'));
    
    if (!baseNum || baseNum <= 0) {
      setError('Digite um valor base válido maior que zero');
      return;
    }

    if (!dataPagamento) {
      setError('Selecione a data de pagamento');
      return;
    }

    setError('');
    await onSave({
      valorBase: baseNum,
      horasExtras: parseFloat(horasExtras.replace(',', '.')) || 0,
      valorHoraExtra: parseFloat(valorHoraExtra.replace(',', '.')) || 0,
      passagens: parseFloat(passagens.replace(',', '.')) || 0,
      outrosExtras: parseFloat(outrosExtras.replace(',', '.')) || 0,
      valorTotal,
      descricao,
      obraId: obraId || undefined,
      dataPagamento,
      statusPagamento,
    });
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
            {getInitials(funcionarioNome)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Nova Diária
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {funcionarioNome}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, pb: 2, px: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Status de Pagamento */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>
            Status do Pagamento
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="Adiantado"
              icon={<AttachMoneyIcon />}
              onClick={() => setStatusPagamento('adiantado')}
              variant={statusPagamento === 'adiantado' ? 'filled' : 'outlined'}
              color={statusPagamento === 'adiantado' ? 'primary' : 'default'}
              sx={{
                bgcolor: statusPagamento === 'adiantado' ? '#2196f3' : 'rgba(255,255,255,0.05)',
                color: statusPagamento === 'adiantado' ? '#fff' : 'rgba(255,255,255,0.7)',
                borderColor: statusPagamento === 'adiantado' ? '#2196f3' : 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: statusPagamento === 'adiantado' ? '#1976d2' : 'rgba(255,255,255,0.1)' },
              }}
            />
            <Chip
              label="Pendente"
              icon={<MoneyOffIcon />}
              onClick={() => setStatusPagamento('pendente')}
              variant={statusPagamento === 'pendente' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusPagamento === 'pendente' ? '#ff9800' : 'rgba(255,255,255,0.05)',
                color: statusPagamento === 'pendente' ? '#fff' : 'rgba(255,255,255,0.7)',
                borderColor: statusPagamento === 'pendente' ? '#ff9800' : 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: statusPagamento === 'pendente' ? '#f57c00' : 'rgba(255,255,255,0.1)' },
              }}
            />
            <Chip
              label="Pago"
              icon={<AttachMoneyIcon />}
              onClick={() => setStatusPagamento('pago')}
              variant={statusPagamento === 'pago' ? 'filled' : 'outlined'}
              sx={{
                bgcolor: statusPagamento === 'pago' ? '#009246' : 'rgba(255,255,255,0.05)',
                color: statusPagamento === 'pago' ? '#fff' : 'rgba(255,255,255,0.7)',
                borderColor: statusPagamento === 'pago' ? '#009246' : 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: statusPagamento === 'pago' ? '#007838' : 'rgba(255,255,255,0.1)' },
              }}
            />
          </Box>
        </Box>

        {/* Datas */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Data de Pagamento"
            type="date"
            value={dataPagamento}
            onChange={(e) => setDataPagamento(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            fullWidth
            sx={{ 
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.03)',
                color: '#f5f5f5',
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
            }}
          />
        </Box>

        {/* Valor Base */}
        <TextField
          label="Valor Base da Diária"
          fullWidth
          value={valorBase}
          onChange={(e) => setValorBase(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
          }}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)',
              color: '#f5f5f5',
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
          }}
          autoFocus
          required
        />

        {/* Extras - Grid Responsivo */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>
            Extras (opcional)
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Horas Extras"
              type="number"
              value={horasExtras}
              onChange={(e) => setHorasExtras(e.target.value)}
              inputProps={{ step: '0.5', min: '0' }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: '#f5f5f5',
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
            <TextField
              label="Valor por Hora Extra"
              value={valorHoraExtra}
              onChange={(e) => setValorHoraExtra(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: '#f5f5f5',
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
            <TextField
              label="Passagens / Vale Transporte"
              value={passagens}
              onChange={(e) => setPassagens(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: '#f5f5f5',
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
            <TextField
              label="Outros Extras"
              value={outrosExtras}
              onChange={(e) => setOutrosExtras(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: '#f5f5f5',
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
          </Box>
        </Box>

        {/* Total Calculado */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(33, 150, 243, 0.1)', borderRadius: 2, border: '1px solid rgba(33, 150, 243, 0.3)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Valor Total
          </Typography>
          <Typography variant="h5" sx={{ color: '#2196f3', fontWeight: 700, mt: 0.5 }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
          </Typography>
        </Box>

        {/* Descrição */}
        <TextField
          label="Descrição"
          fullWidth
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          multiline
          rows={2}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)',
              color: '#f5f5f5',
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
          }}
        />

        {/* Obra */}
        <FormControl fullWidth>
          <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Vincular a uma Obra (opcional)
          </InputLabel>
          <Select
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            label="Vincular a uma Obra (opcional)"
            sx={{
              bgcolor: 'rgba(255,255,255,0.03)',
              color: '#f5f5f5',
              '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.5)' },
            }}
          >
            <MenuItem value="">
              <em>Sem vínculo com obra</em>
            </MenuItem>
            {obras.map((obra) => (
              <MenuItem key={obra.id} value={obra.id}>
                {obra.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button 
          onClick={onClose} 
          sx={{ color: 'rgba(255,255,255,0.7)', width: { xs: '100%', sm: 'auto' } }}
          fullWidth={false}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !valorBase || !dataPagamento}
          startIcon={saving ? <CircularProgress size={18} /> : <AddIcon />}
          sx={{
            bgcolor: '#009246',
            '&:hover': { bgcolor: '#007838' },
            width: { xs: '100%', sm: 'auto' },
            minWidth: { sm: 180 },
          }}
        >
          {saving ? 'Salvando...' : 'Registrar Diária'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Modal de Realizar Pagamento (Diária Pendente)
interface PagamentoDiariaModalProps {
  open: boolean;
  onClose: () => void;
  diaria: Pagamento | null;
  onPagar: (diariaId: string, valorFinal: number, extras: string) => Promise<void>;
  saving: boolean;
}

const PagamentoDiariaModal = ({ open, onClose, diaria, onPagar, saving }: PagamentoDiariaModalProps) => {
  const [valorFinal, setValorFinal] = useState('');
  const [extras, setExtras] = useState('');

  useEffect(() => {
    if (open && diaria) {
      setValorFinal(diaria.valor.toFixed(2).replace('.', ','));
      setExtras('');
    }
  }, [open, diaria]);

  const handlePagar = async () => {
    if (!diaria) return;
    const valor = parseFloat(valorFinal.replace(',', '.'));
    await onPagar(diaria.id, valor, extras);
  };

  if (!diaria) return null;

  const valorOriginal = diaria.valor;
  const valorAtual = parseFloat(valorFinal.replace(',', '.')) || 0;
  const diferenca = valorAtual - valorOriginal;

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
          <AttachMoneyIcon sx={{ color: '#009246', fontSize: 36 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Realizar Pagamento
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {diaria.descricao}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, pb: 2, px: { xs: 2, sm: 3 } }}>
        {/* Valor Original */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Valor Cadastrado
          </Typography>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
            {formatCurrency(valorOriginal)}
          </Typography>
        </Box>

        {/* Valor Final */}
        <TextField
          label="Valor a Pagar"
          fullWidth
          value={valorFinal}
          onChange={(e) => setValorFinal(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
          }}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)',
              color: '#f5f5f5',
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
          }}
          autoFocus
        />

        {/* Diferença */}
        {diferenca !== 0 && (
          <Alert 
            severity={diferenca > 0 ? 'info' : 'warning'}
            sx={{ mb: 2 }}
          >
            {diferenca > 0 
              ? `Valor ${formatCurrency(diferenca)} maior que o cadastrado` 
              : `Valor ${formatCurrency(Math.abs(diferenca))} menor que o cadastrado`
            }
          </Alert>
        )}

        {/* Extras */}
        <TextField
          label="Observações sobre o pagamento (opcional)"
          fullWidth
          value={extras}
          onChange={(e) => setExtras(e.target.value)}
          multiline
          rows={2}
          placeholder="Ex: Hora extra adicionada, desconto aplicado..."
          sx={{ 
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255,255,255,0.03)',
              color: '#f5f5f5',
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
          }}
        />

        {/* Data do Pagamento */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 146, 70, 0.1)', borderRadius: 2, border: '1px solid rgba(0, 146, 70, 0.3)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Data do Pagamento
          </Typography>
          <Typography variant="body1" sx={{ color: '#009246', fontWeight: 600, mt: 0.5 }}>
            {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button 
          onClick={onClose} 
          sx={{ color: 'rgba(255,255,255,0.7)', width: { xs: '100%', sm: 'auto' } }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handlePagar}
          disabled={saving || !valorFinal}
          startIcon={saving ? <CircularProgress size={18} /> : <AttachMoneyIcon />}
          sx={{
            bgcolor: '#009246',
            '&:hover': { bgcolor: '#007838' },
            width: { xs: '100%', sm: 'auto' },
            minWidth: { sm: 180 },
          }}
        >
          {saving ? 'Processando...' : 'Confirmar Pagamento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EntidadeDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados
  const [entidade, setEntidade] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // Dados por tipo
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [obrasCliente, setObrasCliente] = useState<Obra[]>([]);
  const [fornecimentos, setFornecimentos] = useState<Fornecimento[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [presencas, setPresencas] = useState<PresencaRegistro[]>([]);
  const [loadingPresencas, setLoadingPresencas] = useState(false);

  // Dados específicos para sócios
  const [retiradas, setRetiradas] = useState<Retirada[]>([]);
  const [dadosEqualizacao, setDadosEqualizacao] = useState<DadosEqualizacao>({
    totalRetirado: 0,
    disponivelParaRetirar: 0,
    maxRetirado: 0,
  });
  const [retiradaModalOpen, setRetiradaModalOpen] = useState(false);
  const [savingRetirada, setSavingRetirada] = useState(false);

  // Modal de nova diária (funcionário)
  const [diariaModalOpen, setDiariaModalOpen] = useState(false);
  const [savingDiaria, setSavingDiaria] = useState(false);
  const [obrasDisponiveis, setObrasDisponiveis] = useState<Obra[]>([]);

  // Modal de pagamento de diária pendente
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [diariaSelecionada, setDiariaSelecionada] = useState<Pagamento | null>(null);
  const [savingPagamento, setSavingPagamento] = useState(false);

  const [presencaData, setPresencaData] = useState(new Date().toISOString().split('T')[0]);
  const [presencaTrabalhou, setPresencaTrabalhou] = useState<'sim' | 'nao'>('sim');
  const [presencaObservacao, setPresencaObservacao] = useState('');
  const [savingPresenca, setSavingPresenca] = useState(false);
  const [mesRelatorio, setMesRelatorio] = useState(format(new Date(), 'yyyy-MM'));

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Carregar entidade
  const loadEntidade = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entidades')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setEntidade(data);
    } catch (err) {
      console.error('Erro ao carregar entidade:', err);
      setEntidade(null);
      setSnackbar({
        open: true,
        message: 'Não foi possível carregar a entidade do banco (possível RLS no Supabase).',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Carregar histórico de pagamentos (para funcionários)
  const loadPagamentos = useCallback(async () => {
    if (!id || !entidade || entidade.tipo !== 'funcionario') return;

    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          id,
          descricao,
          valor,
          data_vencimento,
          data_pagamento,
          status,
          obra_id,
          obras!transacoes_obra_id_fkey(id, nome)
        `)
        .eq('entidade_id', id)
        .eq('categoria', 'Mão de Obra')
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      
      // Mapear dados do Supabase (obra vem como objeto ou null)
      const mappedData = (data || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        descricao: item.descricao as string,
        valor: item.valor as number,
        status: item.status as string,
        data_vencimento: item.data_vencimento as string | undefined,
        data_pagamento: item.data_pagamento as string | undefined,
        obra_id: item.obra_id as string | undefined,
        obra: item.obras && typeof item.obras === 'object' && !Array.isArray(item.obras)
          ? { id: (item.obras as {id: string; nome: string}).id, nome: (item.obras as {id: string; nome: string}).nome }
          : undefined,
      }));
      setPagamentos(mappedData);
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err);
      setPagamentos([]);
      setSnackbar({
        open: true,
        message: 'Não foi possível carregar pagamentos do banco (possível RLS no Supabase).',
        severity: 'error',
      });
    } finally {
      setLoadingData(false);
    }
  }, [id, entidade]);

  // Carregar presenças (para funcionários)
  const loadPresencas = useCallback(async () => {
    if (!id || !entidade || entidade.tipo !== 'funcionario') return;

    setLoadingPresencas(true);
    try {
      const { data, error } = await supabase
        .from('funcionario_presencas')
        .select('*')
        .eq('funcionario_id', id)
        .order('data', { ascending: false });

      if (error) throw error;
      setPresencas((data as PresencaRegistro[]) || []);
    } catch (err) {
      console.error('Erro ao carregar presenças:', err);
      setPresencas([]);
      setSnackbar({
        open: true,
        message: 'Não foi possível carregar presenças do funcionário.',
        severity: 'error',
      });
    } finally {
      setLoadingPresencas(false);
    }
  }, [id, entidade]);

  const handleSavePresenca = async () => {
    if (!id || !entidade) return;
    if (!presencaData) return;

    setSavingPresenca(true);
    try {
      const { error } = await supabase
        .from('funcionario_presencas')
        .upsert({
          funcionario_id: id,
          data: presencaData,
          trabalhou: presencaTrabalhou === 'sim',
          observacao: presencaObservacao?.trim() || null,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      setPresencaObservacao('');
      await loadPresencas();
      setSnackbar({
        open: true,
        message: 'Registro de presença salvo com sucesso!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Erro ao salvar presença:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar presença. Tente novamente.',
        severity: 'error',
      });
    } finally {
      setSavingPresenca(false);
    }
  };

  const handleDeletePresenca = async (presencaId: string) => {
    if (!window.confirm('Deseja excluir este lançamento de presença?')) return;

    try {
      const { error } = await supabase
        .from('funcionario_presencas')
        .delete()
        .eq('id', presencaId);

      if (error) throw error;

      await loadPresencas();
      setSnackbar({
        open: true,
        message: 'Lançamento de presença excluído com sucesso!',
        severity: 'success',
      });
    } catch (err) {
      console.error('Erro ao excluir presença:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir presença. Tente novamente.',
        severity: 'error',
      });
    }
  };

  const handleDownloadRelatorio = async () => {
    if (!entidade) return;

    const [ano, mes] = mesRelatorio.split('-').map(Number);
    const mesLabel = format(new Date(ano, mes - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });

    const pagamentosMes = pagamentos.filter((p) => {
      if (p.status !== 'pago') return false;
      const data = p.data_pagamento || p.data_vencimento;
      if (!data) return false;
      const d = parseISO(data);
      return d.getFullYear() === ano && d.getMonth() === mes - 1;
    });

    const presencasMes = presencas.filter((p) => {
      if (!p.data) return false;
      const d = parseISO(p.data);
      return d.getFullYear() === ano && d.getMonth() === mes - 1;
    });

    const totalPago = pagamentosMes.reduce((acc, p) => acc + p.valor, 0);
    const obras = Array.from(
      new Set(pagamentosMes.map((p) => p.obra?.nome).filter(Boolean))
    ) as string[];

    await downloadFuncionarioPdf(
      {
        funcionarioNome: entidade.nome,
        mesLabel,
        totalPago,
        pagamentos: pagamentosMes.map((p) => ({
          data: p.data_pagamento
            ? format(parseISO(p.data_pagamento), 'dd/MM/yyyy')
            : p.data_vencimento
              ? format(parseISO(p.data_vencimento), 'dd/MM/yyyy')
              : '-',
          descricao: p.descricao,
          valor: p.valor,
          obra: p.obra?.nome,
        })),
        presencas: presencasMes.map((p) => ({
          data: p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : '-',
          trabalhou: p.trabalhou,
          observacao: p.observacao,
        })),
        obras,
        geradoEm: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      },
      `Relatorio_${entidade.nome.replace(/\s+/g, '_')}_${mesRelatorio}.pdf`
    );
  };

  // Carregar obras do cliente
  const loadObrasCliente = useCallback(async () => {
    if (!id || !entidade || entidade.tipo !== 'cliente') return;

    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('cliente_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setObrasCliente(data || []);
    } catch (err) {
      console.error('Erro ao carregar obras do cliente:', err);
      setObrasCliente([]);
      setSnackbar({
        open: true,
        message: 'Não foi possível carregar obras do cliente do banco (possível RLS no Supabase).',
        severity: 'error',
      });
    } finally {
      setLoadingData(false);
    }
  }, [id, entidade]);

  // Carregar fornecimentos (para fornecedores)
  const loadFornecimentos = useCallback(async () => {
    if (!id || !entidade || entidade.tipo !== 'fornecedor') return;

    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          id,
          descricao,
          valor,
          data_vencimento,
          status,
          obra:obras!obra_id(id, nome)
        `)
        .eq('entidade_id', id)
        .eq('tipo', 'despesa')
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      
      // Mapear dados do Supabase (obra vem como array, pegamos primeiro item)
      const mappedData = (data || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        descricao: item.descricao as string,
        valor: item.valor as number,
        data_vencimento: item.data_vencimento as string | undefined,
        status: item.status as string,
        obra: Array.isArray(item.obra) && item.obra.length > 0 
          ? { id: item.obra[0].id, nome: item.obra[0].nome }
          : undefined,
      }));
      setFornecimentos(mappedData);
    } catch (err) {
      console.error('Erro ao carregar fornecimentos:', err);
      setFornecimentos([]);
      setSnackbar({
        open: true,
        message: 'Não foi possível carregar fornecimentos do banco (possível RLS no Supabase).',
        severity: 'error',
      });
    } finally {
      setLoadingData(false);
    }
  }, [id, entidade]);

  // Carregar obras disponíveis (para vincular diárias)
  const loadObrasDisponiveis = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('id, nome, status')
        .neq('status', 'concluida')
        .order('nome');

      if (error) throw error;
      setObrasDisponiveis(data as Obra[] || []);
    } catch (err) {
      console.error('Erro ao carregar obras disponíveis:', err);
      setObrasDisponiveis([]);
    }
  }, []);

  // Carregar retiradas e dados de equalização (para sócios)
  const loadRetiradasSocio = useCallback(async () => {
    if (!id || !entidade || entidade.tipo !== 'socio') return;

    setLoadingData(true);
    try {
      // 1. Buscar todos os sócios para calcular equalização
      const { data: sociosData, error: sociosError } = await supabase
        .from('entidades')
        .select('id')
        .eq('tipo', 'socio');

      if (sociosError) throw sociosError;

      const sociosIds = (sociosData || []).map(s => s.id);

      // 2. Buscar todas as retiradas de todos os sócios
      const { data: todasRetiradas, error: retiradasError } = await supabase
        .from('transacoes')
        .select('entidade_id, valor, data_pagamento, descricao, id')
        .in('entidade_id', sociosIds)
        .eq('categoria', 'Retirada de Lucro')
        .eq('status', 'pago')
        .order('data_pagamento', { ascending: false });

      if (retiradasError) throw retiradasError;

      // 3. Calcular totais por sócio
      const totaisPorSocio = new Map<string, number>();
      (todasRetiradas || []).forEach((r) => {
        const atual = totaisPorSocio.get(r.entidade_id) || 0;
        totaisPorSocio.set(r.entidade_id, atual + (r.valor || 0));
      });

      // 4. Encontrar o máximo retirado
      let maxRetirado = 0;
      totaisPorSocio.forEach((total) => {
        if (total > maxRetirado) maxRetirado = total;
      });

      // 5. Calcular dados do sócio atual
      const totalRetiradoSocio = totaisPorSocio.get(id) || 0;
      const disponivelParaRetirar = Math.max(0, maxRetirado - totalRetiradoSocio);

      setDadosEqualizacao({
        totalRetirado: totalRetiradoSocio,
        disponivelParaRetirar,
        maxRetirado,
      });

      // 6. Filtrar apenas retiradas deste sócio
      const retiradasDoSocio: Retirada[] = (todasRetiradas || [])
        .filter((r) => r.entidade_id === id)
        .map((r) => ({
          id: r.id,
          descricao: r.descricao,
          valor: r.valor,
          data_pagamento: r.data_pagamento,
          categoria: 'Retirada de Lucro',
        }));

      setRetiradas(retiradasDoSocio);
    } catch (err) {
      console.error('Erro ao carregar retiradas do sócio:', err);
      setDadosEqualizacao({
        totalRetirado: 0,
        disponivelParaRetirar: 0,
        maxRetirado: 0,
      });
      setRetiradas([]);
      setSnackbar({
        open: true,
        message: 'Não foi possível carregar retiradas/equalização do banco (possível RLS no Supabase).',
        severity: 'error',
      });
    } finally {
      setLoadingData(false);
    }
  }, [id, entidade]);

  const handleDeleteRetirada = async (retiradaId: string) => {
    if (!window.confirm('Deseja excluir esta retirada? Ela também sairá do caixa.')) return;

    try {
      const { error: deleteError } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', retiradaId);

      if (deleteError) throw deleteError;

      setSnackbar({
        open: true,
        message: 'Retirada excluída com sucesso.',
        severity: 'success',
      });

      await loadRetiradasSocio();
    } catch (err) {
      console.error('Erro ao excluir retirada:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir retirada. Tente novamente.',
        severity: 'error',
      });
    }
  };

  // Salvar nova retirada
  const handleSaveRetirada = async (valor: number, descricao: string, data: string) => {
    if (!entidade || !id) return;

    setSavingRetirada(true);
    try {
      // Obter user_id e user_nome
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar nome do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo, email')
        .eq('id', user.id)
        .single();

      const user_nome = profileData?.nome_completo || profileData?.email?.split('@')[0] || 'Usuário';

      // Criar timestamp ISO com a data selecionada mantendo a hora atual
      const dataSelecionada = new Date(data + 'T00:00:00');
      const agora = new Date();
      dataSelecionada.setHours(agora.getHours(), agora.getMinutes(), agora.getSeconds());
      const dataISO = dataSelecionada.toISOString();

      const { error: insertError } = await supabase
        .from('transacoes')
        .insert({
          user_id: user.id,
          user_nome,
          descricao,
          valor,
          tipo: 'despesa',
          status: 'pago',
          categoria: 'Retirada de Lucro',
          entidade_id: id,
          data_vencimento: dataISO,
          data_pagamento: dataISO,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      setSnackbar({
        open: true,
        message: `Retirada de ${formatCurrency(valor)} registrada com sucesso!`,
        severity: 'success',
      });

      setRetiradaModalOpen(false);
      
      // Recarregar dados
      await loadRetiradasSocio();
    } catch (err) {
      console.error('Erro ao salvar retirada:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao registrar retirada. Tente novamente.',
        severity: 'error',
      });
    } finally {
      setSavingRetirada(false);
    }
  };

  // Salvar nova diária (funcionário)
  const handleSaveDiaria = async (dados: DadosDiaria) => {
    if (!entidade || !id) return;

    setSavingDiaria(true);
    try {
      // Obter user_id e user_nome
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar nome do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo, email')
        .eq('id', user.id)
        .single();

      const user_nome = profileData?.nome_completo || profileData?.email?.split('@')[0] || 'Usuário';

      // Determinar status da transação baseado no status de pagamento
      let statusTransacao: 'pago' | 'pendente' = 'pago';
      if (dados.statusPagamento === 'pendente') {
        statusTransacao = 'pendente';
      }

      // Construir descrição detalhada
      let descricaoCompleta = dados.descricao;
      if (dados.horasExtras > 0) {
        descricaoCompleta += ` | ${dados.horasExtras}h extras`;
      }
      if (dados.passagens > 0) {
        descricaoCompleta += ` | Vale transporte`;
      }
      if (dados.outrosExtras > 0) {
        descricaoCompleta += ` | Extras adicionais`;
      }

      // Criar timestamp ISO com a data selecionada mantendo a hora atual
      const dataSelecionada = new Date(dados.dataPagamento + 'T00:00:00');
      const agora = new Date();
      dataSelecionada.setHours(agora.getHours(), agora.getMinutes(), agora.getSeconds());
      const dataISO = dataSelecionada.toISOString();

      const { error: insertError } = await supabase
        .from('transacoes')
        .insert({
          user_id: user.id,
          user_nome,
          descricao: descricaoCompleta,
          valor: dados.valorTotal,
          tipo: 'despesa',
          status: statusTransacao,
          categoria: 'Mão de Obra',
          entidade_id: id,
          obra_id: dados.obraId || null,
          data_vencimento: dataISO,
          data_pagamento: dados.statusPagamento === 'pendente' ? null : dataISO,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      const statusText = dados.statusPagamento === 'adiantado' ? 'adiantada' : 
                         dados.statusPagamento === 'pendente' ? 'pendente' : 'paga';

      setSnackbar({
        open: true,
        message: `Diária de ${formatCurrency(dados.valorTotal)} registrada como ${statusText}!`,
        severity: 'success',
      });

      setDiariaModalOpen(false);
      
      // Recarregar dados
      await loadPagamentos();
    } catch (err) {
      console.error('Erro ao salvar diária:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao registrar diária. Tente novamente.',
        severity: 'error',
      });
    } finally {
      setSavingDiaria(false);
    }
  };

  // Realizar pagamento de diária pendente
  const handleRealizarPagamento = async (diariaId: string, valorFinal: number, extras: string) => {
    setSavingPagamento(true);
    try {
      const agora = new Date().toISOString();

      // Atualizar descrição se houver extras
      let updateData: Record<string, unknown> = {
        status: 'pago',
        data_pagamento: agora,
        valor: valorFinal,
      };

      if (extras && diariaSelecionada) {
        updateData.descricao = `${diariaSelecionada.descricao} | ${extras}`;
      }

      const { error } = await supabase
        .from('transacoes')
        .update(updateData)
        .eq('id', diariaId);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: `Pagamento de ${formatCurrency(valorFinal)} realizado com sucesso!`,
        severity: 'success',
      });

      setPagamentoModalOpen(false);
      setDiariaSelecionada(null);
      await loadPagamentos();
    } catch (err) {
      console.error('Erro ao realizar pagamento:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao realizar pagamento. Tente novamente.',
        severity: 'error',
      });
    } finally {
      setSavingPagamento(false);
    }
  };

  // Deletar diária pendente
  const handleDeletarDiariaPendente = async (diariaId: string) => {
    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', diariaId);

      if (error) throw error;

      setSnackbar({
        open: true,
        message: 'Diária pendente excluída com sucesso!',
        severity: 'success',
      });

      await loadPagamentos();
    } catch (err) {
      console.error('Erro ao deletar diária:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir diária. Tente novamente.',
        severity: 'error',
      });
    }
  };

  // Effects
  useEffect(() => {
    loadEntidade();
  }, [loadEntidade]);

  useEffect(() => {
    if (entidade) {
      if (entidade.tipo === 'funcionario') {
        loadPagamentos();
        loadObrasDisponiveis(); // Carregar obras para vincular diárias
        loadPresencas();
      } else if (entidade.tipo === 'cliente') {
        loadObrasCliente();
      } else if (entidade.tipo === 'fornecedor') {
        loadFornecimentos();
      } else if (entidade.tipo === 'socio') {
        loadRetiradasSocio();
      }
    }
  }, [entidade, loadPagamentos, loadObrasCliente, loadFornecimentos, loadRetiradasSocio, loadObrasDisponiveis, loadPresencas]);

  // Gerar recibo PDF
  const gerarReciboPDF = useCallback(async (pagamento: Pagamento) => {
    if (!entidade) return;

    const dataFormatada = pagamento.data_pagamento 
      ? format(parseISO(pagamento.data_pagamento), "dd/MM/yyyy", { locale: ptBR })
      : format(new Date(), "dd/MM/yyyy", { locale: ptBR });

    const horaGeracao = format(new Date(), 'HH:mm', { locale: ptBR });
    
    // Gerar número do recibo baseado no ID da transação
    const numeroRecibo = `REC-${pagamento.id.substring(0, 8).toUpperCase()}`;

    const reciboData: ReciboPagamentoData = {
      numeroRecibo,
      dataEmissao: dataFormatada,
      beneficiario: {
        nome: entidade.nome,
        documento: entidade.documento ? formatDocument(entidade.documento) : undefined,
        endereco: entidade.endereco,
        telefone: entidade.telefone ? formatPhone(entidade.telefone) : undefined,
      },
      pagador: {
        nome: 'Peperaio Construções',
        documento: '00.000.000/0001-00', // Ajustar com CNPJ real
        endereco: 'Endereço da empresa', // Ajustar com endereço real
      },
      valor: pagamento.valor,
      descricao: pagamento.descricao,
      obra: pagamento.obra?.nome,
      formaPagamento: 'Transferência Bancária', // Pode adicionar campo no formulário
      geradoPor: 'Sistema Peperaio',
      horaGeracao,
    };

    // Gerar PDF
    const blob = await pdf(<ReciboPagamentoPDF data={reciboData} />).toBlob();

    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recibo-${entidade.nome.replace(/\s+/g, '-')}-${dataFormatada.replace(/\//g, '-')}.pdf`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [entidade]);

  // Totais calculados
  const totalObras = useMemo(() => 
    obrasCliente.reduce((acc, o) => acc + o.valor_total_orcamento, 0),
  [obrasCliente]);

  const totalFornecimentos = useMemo(() => 
    fornecimentos.reduce((acc, f) => acc + f.valor, 0),
  [fornecimentos]);

  // WhatsApp link
  const whatsAppLink = entidade ? getWhatsAppLink(entidade.telefone) : null;

  // Handlers
  const handleEditEntity = async (id: string, data: Partial<Entity>) => {
    try {
      const { error } = await supabase
        .from('entidades')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      // Atualiza localmente
      setEntidade(prev => prev ? { ...prev, ...data } : null);
      return { success: true };
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      setSnackbar({
        open: true,
        message: 'Não foi possível salvar alterações no banco (possível RLS no Supabase).',
        severity: 'error',
      });
      return { success: false };
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, mb: 3 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  if (!entidade) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Entidade não encontrada
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/entidades')}
          sx={{ mt: 2 }}
        >
          Voltar
        </Button>
      </Box>
    );
  }

  const typeConfig = ENTITY_TYPE_CONFIG[entidade.tipo];
  const borderColor = BORDER_COLORS[entidade.tipo];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header com botão voltar */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/entidades')}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 2,
            '&:hover': { color: '#f5f5f5' },
          }}
        >
          Voltar para Entidades
        </Button>

        {/* Card Principal - Perfil */}
        <Paper
          sx={{
            p: { xs: 2, md: 3 },
            mb: 3,
            borderRadius: 4,
            background: 'rgba(30, 30, 30, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderLeft: `4px solid ${borderColor}`,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Avatar e Info Principal */}
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, md: 3 }, flex: 1, minWidth: 0 }}>
              <Avatar
                sx={{
                  width: { xs: 64, md: 100 },
                  height: { xs: 64, md: 100 },
                  flexShrink: 0,
                  backgroundColor: typeConfig.bgColor,
                  color: typeConfig.textColor,
                  fontSize: { xs: '1.5rem', md: '2.5rem' },
                  fontWeight: 700,
                  border: `3px solid ${borderColor}`,
                }}
              >
                {getInitials(entidade.nome)}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      color: '#f5f5f5',
                      letterSpacing: '-0.5px',
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {entidade.nome}
                  </Typography>
                  <Chip
                    icon={TYPE_ICONS[entidade.tipo] as React.ReactElement}
                    label={typeConfig.label}
                    size="small"
                    sx={{
                      backgroundColor: typeConfig.bgColor,
                      color: typeConfig.textColor,
                      fontWeight: 600,
                      flexShrink: 0,
                      '& .MuiChip-icon': {
                        color: typeConfig.textColor,
                      },
                    }}
                  />
                </Box>

                {/* Dados de Contato */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, md: 2 }, mt: 1 }}>
                  {entidade.telefone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.75rem', md: '0.9rem' } }}>
                        {formatPhone(entidade.telefone)}
                      </Typography>
                    </Box>
                  )}
                  {entidade.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                      <EmailIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                      <Typography 
                        sx={{ 
                          color: 'rgba(255,255,255,0.7)', 
                          fontSize: { xs: '0.75rem', md: '0.9rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entidade.email}
                      </Typography>
                    </Box>
                  )}
                  {entidade.documento && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BadgeIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.75rem', md: '0.9rem' } }}>
                        {formatDocument(entidade.documento)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {entidade.endereco && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 1 }}>
                    <LocationIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', flexShrink: 0, mt: 0.25 }} />
                    <Typography 
                      sx={{ 
                        color: 'rgba(255,255,255,0.5)', 
                        fontSize: { xs: '0.75rem', md: '0.85rem' },
                        wordBreak: 'break-word',
                      }}
                    >
                      {entidade.endereco}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Botões de Ação */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              {whatsAppLink && (
                <Tooltip title="Abrir WhatsApp">
                  <IconButton
                    href={whatsAppLink}
                    target="_blank"
                    sx={{
                      backgroundColor: 'rgba(37, 211, 102, 0.1)',
                      color: '#25D366',
                      '&:hover': {
                        backgroundColor: '#25D366',
                        color: '#fff',
                      },
                    }}
                  >
                    <WhatsAppIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setModalOpen(true)}
                sx={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: '#f5f5f5',
                  '&:hover': {
                    borderColor: '#009246',
                    backgroundColor: 'rgba(0, 146, 70, 0.1)',
                  },
                }}
              >
                Editar Cadastro
              </Button>
            </Box>
          </Box>

          {/* Observações */}
          {entidade.observacoes && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Observações
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
                {entidade.observacoes}
              </Typography>
            </Box>
          )}
        </Paper>
      </MotionBox>

      {/* Conteúdo baseado no tipo */}
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* === FUNCIONÁRIO === */}
        {entidade.tipo === 'funcionario' && (
          <Paper
            sx={{
              borderRadius: 4,
              background: 'rgba(30, 30, 30, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography sx={{ color: '#f5f5f5', fontWeight: 600 }}>
                  Relatório Mensal do Funcionário
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  Diárias pagas, presenças e obras do mês
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <TextField
                  type="month"
                  label="Mês"
                  value={mesRelatorio}
                  onChange={(e) => setMesRelatorio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    minWidth: 160,
                    '& .MuiOutlinedInput-root': {
                      color: '#f5f5f5',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#009246' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                    '& input[type="month"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleDownloadRelatorio}
                  sx={{
                    bgcolor: '#ce2b37',
                    '&:hover': { bgcolor: '#b02530' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Baixar PDF
                </Button>
              </Box>
            </Box>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': { color: '#009246' },
                },
                '& .MuiTabs-indicator': { backgroundColor: '#009246' },
              }}
            >
              <Tab 
                icon={<AttachMoneyIcon />} 
                iconPosition="start" 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Diárias Pendentes
                    {pagamentos.filter(p => p.status === 'pendente').length > 0 && (
                      <Chip 
                        label={pagamentos.filter(p => p.status === 'pendente').length}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: '#ff9800',
                          color: '#fff',
                        }}
                      />
                    )}
                  </Box>
                }
              />
              <Tab icon={<ReceiptIcon />} iconPosition="start" label="Pagamentos Realizados" />
              <Tab icon={<BadgeIcon />} iconPosition="start" label="Presenças" />
            </Tabs>

            {/* ABA 0: Diárias Pendentes */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ px: 3, mb: 3 }}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'rgba(255, 152, 0, 0.08)',
                    border: '1px solid rgba(255, 152, 0, 0.2)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Total a Pagar
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800' }}>
                      {formatCurrency(pagamentos.filter(p => p.status === 'pendente').reduce((acc, p) => acc + p.valor, 0))}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {pagamentos.filter(p => p.status === 'pendente').length} diária(s) pendente(s)
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setDiariaModalOpen(true)}
                    sx={{
                      bgcolor: '#009246',
                      '&:hover': { bgcolor: '#007838' },
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Nova Diária
                  </Button>
                </Paper>
              </Box>

              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#ff9800' }} />
                </Box>
              ) : pagamentos.filter(p => p.status === 'pendente').length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                  <AttachMoneyIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Nenhuma diária pendente
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ px: { xs: 1, sm: 3 }, pb: 2 }}>
                  {pagamentos.filter(p => p.status === 'pendente').map((pag) => (
                    <motion.div
                      key={pag.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          mb: 2,
                          background: 'rgba(255, 152, 0, 0.05)',
                          border: '1px solid rgba(255, 152, 0, 0.2)',
                          borderRadius: 2,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'stretch', sm: 'center' },
                          justifyContent: 'space-between',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" sx={{ color: '#f5f5f5', fontWeight: 600, mb: 0.5 }}>
                            {pag.descricao}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
                            <Chip
                              label={pag.data_vencimento ? format(parseISO(pag.data_vencimento), 'dd/MM/yyyy') : 'Sem data'}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.75rem',
                              }}
                            />
                            {pag.obra?.nome && (
                              <Chip
                                label={pag.obra.nome}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(33, 150, 243, 0.15)',
                                  color: '#2196f3',
                                  fontSize: '0.75rem',
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 700 }}>
                            {formatCurrency(pag.valor)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'row', sm: 'column', md: 'row' } }}>
                          <Button
                            variant="contained"
                            startIcon={<AttachMoneyIcon />}
                            onClick={() => {
                              setDiariaSelecionada(pag);
                              setPagamentoModalOpen(true);
                            }}
                            sx={{
                              bgcolor: '#009246',
                              '&:hover': { bgcolor: '#007838' },
                              textTransform: 'none',
                              fontWeight: 600,
                              flex: 1,
                              minWidth: { xs: 'auto', sm: 120 },
                            }}
                          >
                            Pagar
                          </Button>
                          <IconButton
                            onClick={() => {
                              if (window.confirm('Tem certeza que deseja excluir esta diária pendente?')) {
                                handleDeletarDiariaPendente(pag.id);
                              }
                            }}
                            sx={{
                              color: 'rgba(206, 43, 55, 0.7)',
                              border: '1px solid rgba(206, 43, 55, 0.3)',
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: 'rgba(206, 43, 55, 0.1)',
                                color: '#ce2b37',
                                borderColor: '#ce2b37',
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              )}
            </TabPanel>

            {/* ABA 1: Pagamentos Realizados */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ px: 3, mb: 3 }}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'rgba(0, 146, 70, 0.08)',
                    border: '1px solid rgba(0, 146, 70, 0.2)',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Total Pago
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#009246' }}>
                    {formatCurrency(pagamentos.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0))}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {pagamentos.filter(p => p.status === 'pago').length} pagamento(s) realizado(s)
                  </Typography>
                </Paper>
              </Box>

              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#009246' }} />
                </Box>
              ) : pagamentos.filter(p => p.status === 'pago').length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                  <ReceiptIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Nenhum pagamento realizado
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Data</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Descrição</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Obra</TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Valor</TableCell>
                        <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Recibo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagamentos.filter(p => p.status === 'pago').map((pag) => (
                        <TableRow key={pag.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                          <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {pag.data_pagamento
                              ? format(parseISO(pag.data_pagamento), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {pag.descricao}
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {pag.obra?.nome || '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#009246', fontWeight: 600, borderColor: 'rgba(255,255,255,0.06)' }}>
                            {formatCurrency(pag.valor)}
                          </TableCell>
                          <TableCell align="center" sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <Tooltip title="Imprimir Recibo">
                              <IconButton
                                size="small"
                                onClick={() => gerarReciboPDF(pag)}
                                sx={{
                                  color: 'rgba(255,255,255,0.5)',
                                  '&:hover': { color: '#009246', bgcolor: 'rgba(0,146,70,0.1)' },
                                }}
                              >
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            {/* ABA 2: Presenças */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ px: 3, mb: 3 }}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'rgba(33, 150, 243, 0.08)',
                    border: '1px solid rgba(33, 150, 243, 0.2)',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    alignItems: { xs: 'stretch', md: 'center' },
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Controle de Presenças
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2196f3' }}>
                      {presencas.length} registro(s)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Acompanhe presença diária e observações
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      type="date"
                      label="Data"
                      value={presencaData}
                      onChange={(e) => setPresencaData(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        minWidth: 160,
                        '& .MuiOutlinedInput-root': {
                          color: '#f5f5f5',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                          '&.Mui-focused fieldset': { borderColor: '#2196f3' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                        '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(1)' },
                      }}
                    />
                    <FormControl sx={{ minWidth: 140 }}>
                      <InputLabel id="presenca-status-label">Trabalhou</InputLabel>
                      <Select
                        labelId="presenca-status-label"
                        value={presencaTrabalhou}
                        label="Trabalhou"
                        onChange={(e) => setPresencaTrabalhou(e.target.value as 'sim' | 'nao')}
                      >
                        <MenuItem value="sim">Sim</MenuItem>
                        <MenuItem value="nao">Não</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Observação"
                      value={presencaObservacao}
                      onChange={(e) => setPresencaObservacao(e.target.value)}
                      placeholder="Ex: Chegou atrasado, faltou com aviso..."
                      sx={{ minWidth: 220 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSavePresenca}
                      disabled={savingPresenca}
                      sx={{
                        bgcolor: '#2196f3',
                        '&:hover': { bgcolor: '#1976d2' },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {savingPresenca ? 'Salvando...' : 'Registrar'}
                    </Button>
                  </Box>
                </Paper>
              </Box>

              {loadingPresencas ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#2196f3' }} />
                </Box>
              ) : presencas.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                  <BadgeIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Nenhum registro de presença
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Data</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Status</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Observação</TableCell>
                        <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {presencas.map((p) => (
                        <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                          <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <Chip
                              label={p.trabalhou ? 'Trabalhou' : 'Não trabalhou'}
                              size="small"
                              sx={{
                                bgcolor: p.trabalhou ? 'rgba(0, 146, 70, 0.15)' : 'rgba(206, 43, 55, 0.15)',
                                color: p.trabalhou ? '#009246' : '#ce2b37',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {p.observacao || '-'}
                          </TableCell>
                          <TableCell align="center" sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <Tooltip title="Excluir lançamento">
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePresenca(p.id)}
                                sx={{
                                  color: 'rgba(255,255,255,0.5)',
                                  '&:hover': { color: '#ce2b37', bgcolor: 'rgba(206, 43, 55, 0.1)' },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </Paper>
        )}

        {/* === CLIENTE === */}
        {entidade.tipo === 'cliente' && (
          <Paper
            sx={{
              borderRadius: 4,
              background: 'rgba(30, 30, 30, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': { color: '#2196f3' },
                },
                '& .MuiTabs-indicator': { backgroundColor: '#2196f3' },
              }}
            >
              <Tab icon={<ConstructionIcon />} iconPosition="start" label="Obras Realizadas" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {/* Resumo */}
              <Box sx={{ px: 3, mb: 3 }}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'rgba(33, 150, 243, 0.08)',
                    border: '1px solid rgba(33, 150, 243, 0.2)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Total em Obras
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#2196f3' }}>
                      {formatCurrency(totalObras)}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {obrasCliente.length} obra{obrasCliente.length !== 1 ? 's' : ''}
                  </Typography>
                </Paper>
              </Box>

              {/* Grid de Obras */}
              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#2196f3' }} />
                </Box>
              ) : obrasCliente.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                  <ConstructionIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Nenhuma obra registrada para este cliente
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {obrasCliente.map((obra) => {
                    const statusConfig = OBRA_STATUS_CONFIG[obra.status];
                    return (
                      <Card
                        key={obra.id}
                        sx={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: 'rgba(255,255,255,0.1)',
                          },
                        }}
                      >
                        <CardActionArea onClick={() => navigate(`/obras/${obra.id}`)}>
                          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: statusConfig.bgColor,
                              }}
                            >
                              <ConstructionIcon sx={{ color: statusConfig.textColor }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography sx={{ fontWeight: 600, color: '#f5f5f5' }}>
                                  {obra.nome}
                                </Typography>
                                <Chip
                                  label={statusConfig.label}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.7rem',
                                    backgroundColor: statusConfig.bgColor,
                                    color: statusConfig.textColor,
                                  }}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 2 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                  Orçamento: {formatCurrency(obra.valor_total_orcamento)}
                                </Typography>
                                {obra.data_previsao && (
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    Previsão: {format(parseISO(obra.data_previsao), 'dd/MM/yyyy')}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </TabPanel>
          </Paper>
        )}

        {/* === FORNECEDOR === */}
        {entidade.tipo === 'fornecedor' && (
          <Paper
            sx={{
              borderRadius: 4,
              background: 'rgba(30, 30, 30, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': { color: '#ff9800' },
                },
                '& .MuiTabs-indicator': { backgroundColor: '#ff9800' },
              }}
            >
              <Tab icon={<LocalShippingIcon />} iconPosition="start" label="Histórico de Compras" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {/* Resumo */}
              <Box sx={{ px: 3, mb: 3 }}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'rgba(255, 152, 0, 0.08)',
                    border: '1px solid rgba(255, 152, 0, 0.2)',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Total em Compras
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800' }}>
                      {formatCurrency(totalFornecimentos)}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {fornecimentos.length} fornecimento{fornecimentos.length !== 1 ? 's' : ''}
                  </Typography>
                </Paper>
              </Box>

              {/* Tabela */}
              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#ff9800' }} />
                </Box>
              ) : fornecimentos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                  <LocalShippingIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Nenhuma compra registrada
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Data</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Descrição</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Obra</TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Valor</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fornecimentos.map((forn) => (
                        <TableRow key={forn.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                          <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {forn.data_vencimento
                              ? format(parseISO(forn.data_vencimento), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {forn.descricao}
                          </TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {forn.obra?.nome || '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#ce2b37', fontWeight: 600, borderColor: 'rgba(255,255,255,0.06)' }}>
                            {formatCurrency(forn.valor)}
                          </TableCell>
                          <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <Chip
                              label={forn.status === 'pago' ? 'Pago' : 'Pendente'}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                backgroundColor: forn.status === 'pago'
                                  ? 'rgba(0, 146, 70, 0.15)'
                                  : 'rgba(255, 152, 0, 0.15)',
                                color: forn.status === 'pago' ? '#009246' : '#ff9800',
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </Paper>
        )}

        {/* === SÓCIO === */}
        {entidade.tipo === 'socio' && (
          <>
            {/* Painel de Equalização */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(206, 43, 55, 0.08) 0%, rgba(30, 30, 30, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(206, 43, 55, 0.2)',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {/* Total Retirado */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccountBalanceIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Total já retirado
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#f5f5f5' }}>
                    {formatCurrency(dadosEqualizacao.totalRetirado)}
                  </Typography>
                </Box>

                {/* Disponível para Retirar */}
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: dadosEqualizacao.disponivelParaRetirar > 0
                      ? 'rgba(0, 146, 70, 0.15)'
                      : 'rgba(255,255,255,0.03)',
                    border: dadosEqualizacao.disponivelParaRetirar > 0
                      ? '1px solid rgba(0, 146, 70, 0.3)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUpIcon sx={{ color: dadosEqualizacao.disponivelParaRetirar > 0 ? '#4caf50' : 'rgba(255,255,255,0.5)' }} />
                    <Typography variant="overline" sx={{ color: dadosEqualizacao.disponivelParaRetirar > 0 ? '#4caf50' : 'rgba(255,255,255,0.5)' }}>
                      {dadosEqualizacao.disponivelParaRetirar > 0 ? '✓ Disponível para equalização' : 'Equalizado'}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: dadosEqualizacao.disponivelParaRetirar > 0 ? '#4caf50' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {formatCurrency(dadosEqualizacao.disponivelParaRetirar)}
                  </Typography>
                </Box>

                {/* Botão Nova Retirada */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setRetiradaModalOpen(true)}
                    sx={{
                      bgcolor: '#ce2b37',
                      px: 3,
                      py: 1.5,
                      '&:hover': { bgcolor: '#b02530' },
                    }}
                  >
                    Nova Retirada
                  </Button>
                </Box>
              </Box>

              {/* Info sobre equalização */}
              {dadosEqualizacao.disponivelParaRetirar > 0 && (
                <Alert
                  severity="info"
                  sx={{
                    mt: 2,
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    color: '#90caf9',
                    '& .MuiAlert-icon': { color: '#90caf9' },
                  }}
                >
                  Este sócio pode retirar até <strong>{formatCurrency(dadosEqualizacao.disponivelParaRetirar)}</strong> para equalizar com o sócio que mais retirou.
                </Alert>
              )}
            </Paper>

            {/* Histórico de Retiradas */}
            <Paper
              sx={{
                borderRadius: 4,
                background: 'rgba(30, 30, 30, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ReceiptIcon sx={{ color: '#ce2b37' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
                  Histórico de Retiradas
                </Typography>
                <Chip
                  label={`${retiradas.length} registro${retiradas.length !== 1 ? 's' : ''}`}
                  size="small"
                  sx={{
                    ml: 'auto',
                    bgcolor: 'rgba(206, 43, 55, 0.15)',
                    color: '#ce2b37',
                  }}
                />
              </Box>

              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#ce2b37' }} />
                </Box>
              ) : retiradas.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
                  <AccountBalanceIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Nenhuma retirada registrada
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                    Clique em "Nova Retirada" para registrar
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Data</TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Descrição</TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}>Valor</TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.06)', width: 56 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {retiradas.map((ret) => (
                        <TableRow key={ret.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                          <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {ret.data_pagamento
                              ? format(parseISO(ret.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255,255,255,0.06)' }}>
                            {ret.descricao}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#ce2b37', fontWeight: 600, borderColor: 'rgba(255,255,255,0.06)' }}>
                            {formatCurrency(ret.valor)}
                          </TableCell>
                          <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRetirada(ret.id)}
                              sx={{
                                color: 'rgba(255,255,255,0.5)',
                                '&:hover': { color: '#ce2b37', bgcolor: 'rgba(206, 43, 55, 0.08)' },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}

        {/* === PARCEIRO === */}
        {entidade.tipo === 'parceiro' && (
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
              background: 'rgba(30, 30, 30, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              textAlign: 'center',
            }}
          >
            <HandshakeIcon sx={{ fontSize: 64, color: 'rgba(255, 215, 0, 0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#f5f5f5', mb: 1 }}>
              Parceiro de Negócios
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', maxWidth: 400, mx: 'auto' }}>
              Este cadastro é um parceiro comercial. Informações adicionais sobre parcerias serão exibidas aqui.
            </Typography>
          </Paper>
        )}
      </MotionBox>

      {/* Modal de Edição */}
      <EntityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        entity={entidade}
        onSave={async () => ({ success: true })}
        onUpdate={handleEditEntity}
      />

      {/* Modal de Nova Retirada (Sócio) */}
      <NovaRetiradaModal
        open={retiradaModalOpen}
        onClose={() => setRetiradaModalOpen(false)}
        socioNome={entidade?.nome || ''}
        disponivelParaRetirar={dadosEqualizacao.disponivelParaRetirar}
        onSave={handleSaveRetirada}
        saving={savingRetirada}
      />

      {/* Modal de Nova Diária (Funcionário) */}
      <NovaDiariaModal
        open={diariaModalOpen}
        onClose={() => setDiariaModalOpen(false)}
        funcionarioNome={entidade?.nome || ''}
        onSave={handleSaveDiaria}
        saving={savingDiaria}
        obras={obrasDisponiveis}
      />

      {/* Modal de Pagamento de Diária Pendente */}
      <PagamentoDiariaModal
        open={pagamentoModalOpen}
        onClose={() => {
          setPagamentoModalOpen(false);
          setDiariaSelecionada(null);
        }}
        diaria={diariaSelecionada}
        onPagar={handleRealizarPagamento}
        saving={savingPagamento}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EntidadeDetalhes;
