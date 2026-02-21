import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Skeleton,
  Alert,
  Snackbar,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Construction as ConstructionIcon,
  AccountBalanceWallet as WalletIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  PictureAsPdf as PdfIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import supabase from '../lib/supabaseClient';
import { registrarNotificacao } from '../utils/notificationLogger';
import { Obra, OBRA_STATUS_CONFIG, formatCurrency, formatDate, calcularProgressoFinanceiro } from '../types/obras';
import { Entity } from '../types/entidades';
import { CATEGORIAS_PADRAO } from '../types/financeiro';
import { InsightsObra } from '../components/obras';

// Interface para Diária/Transação de mão de obra (conforme tabela transacoes)
interface Diaria {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'despesa';
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  categoria: string;
  data_vencimento?: string; // Quando a diária foi trabalhada
  data_pagamento?: string; // Quando foi efetivamente pago
  entidade_id: string;
  entidade?: Entity;
  obra_id: string;
  created_at: string;
}

// Interface para transação financeira da obra
interface TransacaoObra {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  status: 'pago' | 'pendente' | 'atrasado' | 'cancelado';
  categoria: string;
  data_vencimento?: string;
  data_pagamento?: string;
  entidade_id?: string;
  entidade?: {
    id: string;
    nome: string;
  };
}

// Tab Panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
const ObraDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados principais
  const [obra, setObra] = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Estados para diárias
  const [diarias, setDiarias] = useState<Diaria[]>([]);
  const [funcionarios, setFuncionarios] = useState<Entity[]>([]);
  const [selectedDiarias, setSelectedDiarias] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [savingDiaria, setSavingDiaria] = useState(false);
  const [payingDiarias, setPayingDiarias] = useState(false);
  const [dataPagamentoDiarias, setDataPagamentoDiarias] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Estados para transações financeiras
  const [transacoes, setTransacoes] = useState<TransacaoObra[]>([]);

  // Estados para lançar gasto (despesa) na obra
  const [gastoDialogOpen, setGastoDialogOpen] = useState(false);
  const [savingGasto, setSavingGasto] = useState(false);
  const [novoGasto, setNovoGasto] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    categoria: 'Material',
    valor: '',
    status: 'pago' as 'pago' | 'pendente',
  });

  // Estados para pagamento parcial do cliente
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const [novoPagamento, setNovoPagamento] = useState({
    valor: '',
    data: new Date().toISOString().split('T')[0],
    descricao: 'Pagamento parcial',
  });
  const [savingPagamento, setSavingPagamento] = useState(false);

  // Form de nova diária
  const [novaDiaria, setNovaDiaria] = useState({
    funcionario_id: '',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    descricao: '',
  });

  const handleCloseSnackbar = (_?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Carregar obra
  const loadObra = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('obras')
        .select(`
          *,
          cliente:entidades!cliente_id(id, nome)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setObra(data);
    } catch (err) {
      console.error('Erro ao carregar obra:', err);
      setObra(null);
      setSnackbar({
        open: true,
        message: 'Não foi possível carregar a obra do banco (possível RLS no Supabase).',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Carregar diárias (transações de mão de obra desta obra)
  const loadDiarias = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          entidade:entidades!entidade_id(id, nome, tipo)
        `)
        .eq('obra_id', id)
        .eq('categoria', 'Mão de Obra')
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      setDiarias(data || []);
    } catch (err) {
      console.error('Erro ao carregar diárias:', err);
      setDiarias([]);
      setSnackbar({
        open: true,
        message: 'Não foi possível carregar diárias do banco (possível RLS no Supabase).',
        severity: 'error',
      });
    }
  }, [id]);

  // Carregar funcionários
  const loadFuncionarios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('entidades')
        .select('*')
        .eq('tipo', 'funcionario')
        .order('nome');

      if (error) throw error;
      setFuncionarios(data || []);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      setFuncionarios([]);
      setSnackbar({
        open: true,
        message: 'Não foi possível carregar funcionários do banco (possível RLS no Supabase).',
        severity: 'error',
      });
    }
  }, []);

  // Carregar transações (todas: receitas e despesas da obra)
  const loadTransacoes = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          entidade:entidades!entidade_id(id, nome)
        `)
        .eq('obra_id', id)
        .order('data_vencimento', { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      setTransacoes([]);
    }
  }, [id]);

  // Effects
  useEffect(() => {
    loadObra();
    loadDiarias();
    loadFuncionarios();
    loadTransacoes();
  }, [loadObra, loadDiarias, loadFuncionarios, loadTransacoes]);

  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = () => {
    setNovaDiaria({
      funcionario_id: '',
      data: new Date().toISOString().split('T')[0],
      valor: '',
      descricao: '',
    });
    setDialogOpen(true);
  };

  const handleSaveDiaria = async () => {
    if (!novaDiaria.funcionario_id || !novaDiaria.valor || !id) return;

    setSavingDiaria(true);
    const funcionario = funcionarios.find(f => f.id === novaDiaria.funcionario_id);

    try {
      // Obter user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';

      // Inserir transação conforme schema: usa data_vencimento para quando deve ser pago
      const { error } = await supabase
        .from('transacoes')
        .insert([{
          user_id: user.id,
          user_nome: userNome,
          obra_id: id,
          entidade_id: novaDiaria.funcionario_id,
          descricao: novaDiaria.descricao || `Diária - ${funcionario?.nome || 'Funcionário'}`,
          valor: parseFloat(novaDiaria.valor),
          categoria: 'Mão de Obra',
          tipo: 'despesa',
          status: 'pendente', // REGRA: Cria como pendente (dívida criada, dinheiro não saiu)
          data_vencimento: novaDiaria.data, // Quando a diária foi trabalhada / deve ser paga
        }]);

      if (error) throw error;

      await registrarNotificacao({
        tipo: 'financeiro',
        titulo: 'Movimentação financeira',
        mensagem: `Diária registrada • R$ ${parseFloat(novaDiaria.valor).toFixed(2)} • por ${userNome}`,
        link: '/financeiro',
        metadata: { obra_id: id },
      });
      
      await loadDiarias();
      setDialogOpen(false);
    } catch (err) {
      console.error('Erro ao salvar diária:', err);
      // Para mock, adiciona localmente
      const newDiaria: Diaria = {
        id: Date.now().toString(),
        descricao: novaDiaria.descricao || `Diária - ${funcionario?.nome || 'Funcionário'}`,
        valor: parseFloat(novaDiaria.valor),
        tipo: 'despesa',
        status: 'pendente',
        categoria: 'Mão de Obra',
        data_vencimento: novaDiaria.data,
        entidade_id: novaDiaria.funcionario_id,
        entidade: funcionario ? { ...funcionario } : undefined,
        obra_id: id,
        created_at: new Date().toISOString(),
      };
      setDiarias(prev => [newDiaria, ...prev]);
      setDialogOpen(false);
    } finally {
      setSavingDiaria(false);
    }
  };

  const handleSelectDiaria = (id: string) => {
    setSelectedDiarias(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendentes = diarias.filter(d => d.status === 'pendente').map(d => d.id);
      setSelectedDiarias(pendentes);
    } else {
      setSelectedDiarias([]);
    }
  };

  const handleRealizarPagamento = async () => {
    if (selectedDiarias.length === 0) return;

    setPayingDiarias(true);

    try {
      const dataPagamento = dataPagamentoDiarias || new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('transacoes')
        .update({
          status: 'pago',
          data_pagamento: dataPagamento,
        })
        .in('id', selectedDiarias);

      if (error) throw error;

      await loadDiarias();
      setSelectedDiarias([]);
    } catch (err) {
      console.error('Erro ao realizar pagamento:', err);
      // Para mock, atualiza localmente
      setDiarias(prev => prev.map(d =>
        selectedDiarias.includes(d.id)
          ? { ...d, status: 'pago' as const, data_pagamento: dataPagamentoDiarias || new Date().toISOString().split('T')[0] }
          : d
      ));
      setSelectedDiarias([]);
    } finally {
      setPayingDiarias(false);
    }
  };

  const handleOpenGastoDialog = () => {
    if (obra?.status === 'concluida' || obra?.status === 'cancelada') return;
    const hoje = new Date().toISOString().split('T')[0];
    setNovoGasto({
      data: hoje,
      descricao: '',
      categoria: 'Material',
      valor: '',
      status: 'pago',
    });
    setGastoDialogOpen(true);
  };

  const handleSaveGasto = async () => {
    if (!id) return;
    if (obra?.status === 'concluida' || obra?.status === 'cancelada') return;
    if (!novoGasto.descricao.trim() || !novoGasto.categoria || !novoGasto.valor) return;
    const valor = parseFloat(novoGasto.valor);
    if (!Number.isFinite(valor) || valor <= 0) return;

    setSavingGasto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';

      const payload: Record<string, unknown> = {
        user_id: user.id,
        user_nome: userNome,
        obra_id: id,
        descricao: novoGasto.descricao.trim(),
        valor,
        categoria: novoGasto.categoria,
        tipo: 'despesa',
        status: novoGasto.status,
        data_vencimento: novoGasto.data,
      };

      // Se está pago, usar a mesma data para o pagamento
      if (novoGasto.status === 'pago') {
        payload.data_pagamento = novoGasto.data;
      }

      const { error } = await supabase
        .from('transacoes')
        .insert([payload]);

      if (error) throw error;

      await registrarNotificacao({
        tipo: 'financeiro',
        titulo: 'Movimentação financeira',
        mensagem: `Gasto registrado • R$ ${valor.toFixed(2)} • por ${userNome}`,
        link: '/financeiro',
        metadata: { obra_id: id },
      });

      await loadTransacoes();
      setGastoDialogOpen(false);
    } catch (err) {
      console.error('Erro ao salvar gasto:', err);
    } finally {
      setSavingGasto(false);
    }
  };

  // Salvar pagamento parcial do cliente
  const handleSavePagamento = async () => {
    if (!novoPagamento.valor || !id || !obra) return;

    setSavingPagamento(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const userNome = profileData?.nome_completo || user.email?.split('@')[0] || 'Usuário';

      const { error } = await supabase
        .from('transacoes')
        .insert([{
          user_id: user.id,
          user_nome: userNome,
          obra_id: id,
          entidade_id: obra.cliente_id,
          descricao: novoPagamento.descricao,
          valor: parseFloat(novoPagamento.valor),
          categoria: 'Pagamento Cliente',
          tipo: 'receita',
          status: 'pago',
          data_vencimento: novoPagamento.data,
          data_pagamento: novoPagamento.data,
        }]);

      if (error) throw error;

      await registrarNotificacao({
        tipo: 'financeiro',
        titulo: 'Movimentação financeira',
        mensagem: `Pagamento recebido • R$ ${parseFloat(novoPagamento.valor).toFixed(2)} • por ${userNome}`,
        link: '/financeiro',
        metadata: { obra_id: id },
      });

      await loadTransacoes();
      setPagamentoDialogOpen(false);
      setNovoPagamento({
        valor: '',
        data: new Date().toISOString().split('T')[0],
        descricao: 'Pagamento parcial',
      });
    } catch (err) {
      console.error('Erro ao salvar pagamento:', err);
    } finally {
      setSavingPagamento(false);
    }
  };

  // Exportar PDF de gastos detalhados
  const exportarPDF = () => {
    if (!obra) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const greenItaly: [number, number, number] = [0, 146, 70];
    const darkBg: [number, number, number] = [26, 26, 26];
    const lightText: [number, number, number] = [245, 245, 245];

    // Fundo escuro
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageWidth, 297, 'F');

    // Header verde
    doc.setFillColor(...greenItaly);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Gastos', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(obra.nome, pageWidth / 2, 25, { align: 'center' });
    doc.text(`Cliente: ${obra.cliente?.nome || '-'}`, pageWidth / 2, 32, { align: 'center' });

    // Resumo Financeiro
    doc.setTextColor(...lightText);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Financeiro', 14, 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Orçamento Total: ${formatCurrency(obra.valor_total_orcamento)}`, 14, 60);
    doc.text(`Total Gasto: ${formatCurrency(valorGasto)}`, 14, 67);
    doc.text(`Saldo: ${formatCurrency(obra.valor_total_orcamento - valorGasto)}`, 14, 74);
    doc.text(`Progresso: ${progresso.toFixed(1)}%`, 14, 81);

    // Gráfico de progresso visual
    const barY = 88;
    const barWidth = pageWidth - 28;
    const barHeight = 8;
    
    // Barra de fundo
    doc.setFillColor(60, 60, 60);
    doc.roundedRect(14, barY, barWidth, barHeight, 2, 2, 'F');
    
    // Barra de progresso
    const progressWidth = (barWidth * progresso) / 100;
    if (progresso <= 70) {
      doc.setFillColor(0, 146, 70); // Verde
    } else if (progresso <= 90) {
      doc.setFillColor(255, 152, 0); // Laranja
    } else {
      doc.setFillColor(206, 43, 55); // Vermelho
    }
    doc.roundedRect(14, barY, progressWidth, barHeight, 2, 2, 'F');

    // Tabela de Diárias
    let startY = 105;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Diárias Registradas', 14, startY);

    const tableData = diarias.map(d => [
      d.entidade?.nome || '-',
      d.descricao,
      formatDate(d.data_vencimento),
      formatCurrency(d.valor),
      d.status === 'pago' ? 'Pago' : 'Pendente',
    ]);

    autoTable(doc, {
      startY: startY + 5,
      head: [['Funcionário', 'Descrição', 'Data', 'Valor', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: greenItaly,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        fillColor: [40, 40, 40],
        textColor: lightText,
      },
      alternateRowStyles: {
        fillColor: [50, 50, 50],
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });

    // Rodapé
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, finalY);
    doc.text('Peperaio ERP', pageWidth - 14, finalY, { align: 'right' });

    // Salvar
    doc.save(`relatorio-${obra.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  // Cálculos de diárias
  const totalPendente = diarias.filter(d => d.status === 'pendente').reduce((acc, d) => acc + d.valor, 0);
  const totalPago = diarias.filter(d => d.status === 'pago').reduce((acc, d) => acc + d.valor, 0);
  
  // Cálculos de receitas e despesas (incluindo diárias)
  const totalRecebido = transacoes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
  const totalDespesasTransacoes = transacoes.filter(t => t.tipo === 'despesa' && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0);
  
  // Total gasto = diárias pagas + outras despesas pagas da obra
  const valorGasto: number = totalDespesasTransacoes;
  const progresso = obra ? calcularProgressoFinanceiro(valorGasto, obra.valor_total_orcamento) : 0;
  const valorRestante = (obra?.valor_total_orcamento ?? 0) - totalRecebido;

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, mb: 3 }} />
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  if (!obra) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Obra não encontrada</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/obras')} sx={{ mt: 2 }}>
          Voltar para Obras
        </Button>
      </Box>
    );
  }

  const statusConfig = OBRA_STATUS_CONFIG[obra.status];

  return (
    <Box>
      {/* Header com voltar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton
            onClick={() => navigate('/obras')}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#009246' },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Obras /
          </Typography>
          <Typography variant="body2" sx={{ color: '#f5f5f5' }}>
            {obra.nome}
          </Typography>
        </Box>
      </motion.div>

      {/* Card Principal - Header da Obra */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: 'rgba(30, 30, 30, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 4,
          }}
        >
          {/* Título e Status */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: { xs: '100%', sm: 0 } }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'rgba(0, 146, 70, 0.15)',
                  color: '#009246',
                  flexShrink: 0,
                }}
              >
                <ConstructionIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#f5f5f5', 
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: { xs: 'normal', sm: 'nowrap' },
                  }}
                >
                  {obra.nome}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Cliente: {obra.cliente?.nome || '-'}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={statusConfig.label}
              sx={{
                bgcolor: statusConfig.bgColor,
                color: statusConfig.textColor,
                fontWeight: 600,
                fontSize: '0.85rem',
                px: 1,
                flexShrink: 0,
              }}
            />
          </Box>

          {/* Totais - Orçamento vs Gasto */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 3,
            }}
          >
            {/* Orçamento */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1.5 }}>
                Orçamento Total
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#f5f5f5', 
                  mt: 0.5,
                  wordBreak: 'break-word',
                }}
              >
                {formatCurrency(obra.valor_total_orcamento)}
              </Typography>
            </Box>

            {/* Gasto */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: 'rgba(206, 43, 55, 0.08)',
                border: '1px solid rgba(206, 43, 55, 0.2)',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1.5 }}>
                Total Gasto
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#ce2b37', 
                    mt: 0.5,
                    wordBreak: 'break-word',
                  }}
                >
                  {formatCurrency(valorGasto)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  ({progresso}%)
                </Typography>
              </Box>
            </Box>

            {/* Saldo Restante */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: 'rgba(0, 146, 70, 0.08)',
                border: '1px solid rgba(0, 146, 70, 0.2)',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1.5 }}>
                Saldo Restante
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: '#009246', 
                  mt: 0.5,
                  wordBreak: 'break-word',
                }}
              >
                {formatCurrency(obra.valor_total_orcamento - valorGasto)}
              </Typography>
            </Box>
          </Box>

          {/* Barra de Progresso */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Progresso Financeiro
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: progresso > 100 ? '#ce2b37' : progresso > 80 ? '#ff9800' : '#009246',
                  fontWeight: 600,
                }}
              >
                {progresso}% utilizado
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(progresso, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: progresso > 100 ? '#ce2b37' : progresso > 80 ? '#ff9800' : '#009246',
                },
              }}
            />
          </Box>
        </Paper>
      </motion.div>

      {/* Cards de Pagamentos do Cliente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
          {/* Total Recebido */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              background: 'rgba(0, 146, 70, 0.1)',
              border: '1px solid rgba(0, 146, 70, 0.2)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <TrendingUpIcon sx={{ color: '#009246', fontSize: 32 }} />
            <Box>
              <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1 }}>
                Total Recebido
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#009246' }}>
                {formatCurrency(totalRecebido)}
              </Typography>
            </Box>
          </Paper>

          {/* Valor Restante */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <WalletIcon sx={{ color: '#ff9800', fontSize: 32 }} />
            <Box>
              <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1 }}>
                A Receber
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ff9800' }}>
                {formatCurrency(valorRestante)}
              </Typography>
            </Box>
          </Paper>

          {/* Botões de Ação */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => setPagamentoDialogOpen(true)}
              sx={{
                bgcolor: '#009246',
                '&:hover': { bgcolor: '#007838' },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Lançar Pagamento
            </Button>
            <Button
              variant="outlined"
              onClick={exportarPDF}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#f5f5f5',
                '&:hover': {
                  borderColor: '#009246',
                  bgcolor: 'rgba(0, 146, 70, 0.1)',
                },
              }}
            >
              <PdfIcon />
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Tabs de Navegação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Paper
          elevation={0}
          sx={{
            background: 'rgba(30, 30, 30, 0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 500,
                py: 2,
                minWidth: 'auto',
                '&.Mui-selected': {
                  color: '#009246',
                },
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#009246',
                height: 3,
              },
            }}
          >
            <Tab icon={<InfoIcon />} iconPosition="start" label="Visão Geral" />
            <Tab icon={<WalletIcon />} iconPosition="start" label="Financeiro" />
            <Tab icon={<PeopleIcon />} iconPosition="start" label="Diárias & Equipe" />
            <Tab icon={<AIIcon />} iconPosition="start" label="Insights de IA" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* ========================== */}
            {/* ABA: VISÃO GERAL */}
            {/* ========================== */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Informações da Obra */}
                <Box>
                  <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1.5, mb: 2, display: 'block' }}>
                    Informações
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Data de Início
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#f5f5f5' }}>
                          {formatDate(obra.data_inicio)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ScheduleIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Previsão de Término
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#f5f5f5' }}>
                          {formatDate(obra.data_previsao)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PersonIcon sx={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          Cliente
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#f5f5f5' }}>
                          {obra.cliente?.nome || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Box>

                {/* Descrição */}
                <Box>
                  <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1.5, mb: 2, display: 'block' }}>
                    Descrição
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8 }}>
                    {obra.descricao || 'Nenhuma descrição informada.'}
                  </Typography>
                </Box>
              </Box>
            </TabPanel>

            {/* ========================== */}
            {/* ABA: FINANCEIRO */}
            {/* ========================== */}
            <TabPanel value={tabValue} index={1}>
              {/* Resumo Financeiro */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(0, 146, 70, 0.1)',
                    border: '1px solid rgba(0, 146, 70, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <TrendingUpIcon sx={{ color: '#009246', fontSize: 32 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Total Receitas
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#009246', fontWeight: 700 }}>
                      {formatCurrency(transacoes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0))}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(206, 43, 55, 0.1)',
                    border: '1px solid rgba(206, 43, 55, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <TrendingDownIcon sx={{ color: '#ce2b37', fontSize: 32 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Total Despesas
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ce2b37', fontWeight: 700 }}>
                      {formatCurrency(transacoes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0))}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Lista de Transações */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
                <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: 1.5, display: 'block' }}>
                  Movimentações
                </Typography>
                {obra?.status !== 'concluida' && obra?.status !== 'cancelada' && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleOpenGastoDialog}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#f5f5f5',
                      '&:hover': {
                        borderColor: '#009246',
                        bgcolor: 'rgba(0, 146, 70, 0.1)',
                      },
                    }}
                  >
                    Lançar Gasto
                  </Button>
                )}
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Data</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Descrição</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Categoria</TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Valor</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transacoes.map((t) => (
                      <TableRow key={t.id} hover sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' } }}>
                        <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          {formatDate(t.data_vencimento)}
                        </TableCell>
                        <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          {t.descricao}
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          {t.categoria}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: t.tipo === 'receita' ? '#009246' : '#ce2b37',
                            fontWeight: 600,
                            borderColor: 'rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          {t.tipo === 'receita' ? '+' : '-'} {formatCurrency(t.valor)}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          <Chip
                            label={t.status === 'pago' ? 'Pago' : 'Pendente'}
                            size="small"
                            sx={{
                              bgcolor: t.status === 'pago' ? 'rgba(0, 146, 70, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                              color: t.status === 'pago' ? '#009246' : '#ff9800',
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {transacoes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', py: 4 }}>
                          Nenhuma transação registrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* ========================== */}
            {/* ABA: DIÁRIAS & EQUIPE */}
            {/* ========================== */}
            <TabPanel value={tabValue} index={2}>
              {/* Header com totais e botões */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Totais */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      background: 'rgba(255, 152, 0, 0.1)',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Pendente
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 700 }}>
                      {formatCurrency(totalPendente)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      background: 'rgba(0, 146, 70, 0.1)',
                      border: '1px solid rgba(0, 146, 70, 0.2)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Pago
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#009246', fontWeight: 700 }}>
                      {formatCurrency(totalPago)}
                    </Typography>
                  </Box>
                </Box>

                {/* Botões */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  {selectedDiarias.length > 0 && (
                    <>
                      <TextField
                        type="date"
                        label="Data do Pagamento"
                        value={dataPagamentoDiarias}
                        onChange={(e) => setDataPagamentoDiarias(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          minWidth: 190,
                          '& .MuiOutlinedInput-root': {
                            color: '#f5f5f5',
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: '#009246' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
                          '& input[type="date"]::-webkit-calendar-picker-indicator': {
                            filter: 'invert(1)',
                            cursor: 'pointer',
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<PaymentIcon />}
                        onClick={handleRealizarPagamento}
                        disabled={payingDiarias || !dataPagamentoDiarias}
                        sx={{
                          bgcolor: '#009246',
                          '&:hover': { bgcolor: '#007a3a' },
                        }}
                      >
                        Realizar Pagamento ({selectedDiarias.length})
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#f5f5f5',
                      '&:hover': {
                        borderColor: '#009246',
                        bgcolor: 'rgba(0, 146, 70, 0.1)',
                      },
                    }}
                  >
                    Lançar Diária
                  </Button>
                </Box>
              </Box>

              {/* Tabela de Diárias */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <Checkbox
                          indeterminate={
                            selectedDiarias.length > 0 &&
                            selectedDiarias.length < diarias.filter(d => d.status === 'pendente').length
                          }
                          checked={
                            diarias.filter(d => d.status === 'pendente').length > 0 &&
                            selectedDiarias.length === diarias.filter(d => d.status === 'pendente').length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Data</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Funcionário</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Descrição</TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Valor</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Status</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Pagamento</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diarias.map((diaria) => (
                      <TableRow
                        key={diaria.id}
                        hover
                        selected={selectedDiarias.includes(diaria.id)}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' },
                          '&.Mui-selected': { bgcolor: 'rgba(0, 146, 70, 0.08)' },
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          <Checkbox
                            checked={selectedDiarias.includes(diaria.id)}
                            onChange={() => handleSelectDiaria(diaria.id)}
                            disabled={diaria.status === 'pago'}
                            sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#f5f5f5', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          {formatDate(diaria.data_vencimento)}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(0, 146, 70, 0.15)', fontSize: 12 }}>
                              {diaria.entidade?.nome?.charAt(0) || 'F'}
                            </Avatar>
                            <Typography variant="body2" sx={{ color: '#f5f5f5' }}>
                              {diaria.entidade?.nome || 'Funcionário'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          {diaria.descricao}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#ce2b37', fontWeight: 600, borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          {formatCurrency(diaria.valor)}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          <Chip
                            label={diaria.status === 'pago' ? 'Pago' : 'Pendente'}
                            size="small"
                            sx={{
                              bgcolor: diaria.status === 'pago' ? 'rgba(0, 146, 70, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                              color: diaria.status === 'pago' ? '#009246' : '#ff9800',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.5)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                          {diaria.data_pagamento ? formatDate(diaria.data_pagamento) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {diarias.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', py: 4 }}>
                          Nenhuma diária lançada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* ========================== */}
            {/* ABA: INSIGHTS DE IA */}
            {/* ========================== */}
            <TabPanel value={tabValue} index={3}>
              {obra && <InsightsObra obra={obra} transacoes={transacoes} />}
            </TabPanel>
          </Box>
        </Paper>
      </motion.div>

      {/* ========================== */}
      {/* DIALOG: LANÇAR DIÁRIA */}
      {/* ========================== */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: '#f5f5f5', display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon sx={{ color: '#009246' }} />
          Lançar Diária
        </DialogTitle>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {/* Select Funcionário */}
            <TextField
              select
              label="Funcionário"
              value={novaDiaria.funcionario_id}
              onChange={(e) => setNovaDiaria({ ...novaDiaria, funcionario_id: e.target.value })}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
                '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.5)' },
              }}
            >
              {funcionarios.map((func) => (
                <MenuItem key={func.id} value={func.id}>
                  {func.nome}
                </MenuItem>
              ))}
            </TextField>

            {/* Data */}
            <TextField
              type="date"
              label="Data do Trabalho"
              value={novaDiaria.data}
              onChange={(e) => setNovaDiaria({ ...novaDiaria, data: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  filter: 'invert(1)',
                  cursor: 'pointer',
                },
              }}
            />

            {/* Valor */}
            <TextField
              type="number"
              label="Valor da Diária"
              value={novaDiaria.valor}
              onChange={(e) => setNovaDiaria({ ...novaDiaria, valor: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }}>R$</Typography>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
              }}
            />

            {/* Descrição */}
            <TextField
              label="Descrição (opcional)"
              value={novaDiaria.descricao}
              onChange={(e) => setNovaDiaria({ ...novaDiaria, descricao: e.target.value })}
              fullWidth
              placeholder="Ex: Diária - Acabamento"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
              }}
            />

            {/* Info box */}
            <Alert
              severity="info"
              sx={{
                bgcolor: 'rgba(33, 150, 243, 0.1)',
                color: '#2196f3',
                '& .MuiAlert-icon': { color: '#2196f3' },
              }}
            >
              A diária será registrada como <strong>pendente</strong>. O valor só será debitado do caixa quando você realizar o pagamento.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveDiaria}
            variant="contained"
            disabled={!novaDiaria.funcionario_id || !novaDiaria.valor || savingDiaria}
            sx={{
              bgcolor: '#009246',
              '&:hover': { bgcolor: '#007a3a' },
            }}
          >
            {savingDiaria ? 'Salvando...' : 'Salvar Diária'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================== */}
      {/* DIALOG: LANÇAR GASTO */}
      {/* ========================== */}
      <Dialog
        open={gastoDialogOpen}
        onClose={() => setGastoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: '#f5f5f5', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingDownIcon sx={{ color: '#ce2b37' }} />
          Lançar Gasto
        </DialogTitle>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Descrição"
              value={novoGasto.descricao}
              onChange={(e) => setNovoGasto({ ...novoGasto, descricao: e.target.value })}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
              }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                type="date"
                label="Data"
                value={novoGasto.data}
                onChange={(e) => setNovoGasto({ ...novoGasto, data: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f5f5f5',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    cursor: 'pointer',
                  },
                }}
              />

              <TextField
                type="number"
                label="Valor"
                value={novoGasto.valor}
                onChange={(e) => setNovoGasto({ ...novoGasto, valor: e.target.value })}
                fullWidth
                required
                InputProps={{
                  startAdornment: <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }}>R$</Typography>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f5f5f5',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
                }}
              />
            </Box>

            <TextField
              select
              label="Categoria"
              value={novoGasto.categoria}
              onChange={(e) => setNovoGasto({ ...novoGasto, categoria: e.target.value })}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
                '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.5)' },
              }}
            >
              {CATEGORIAS_PADRAO.filter((c) => c !== 'Pagamento Cliente' && c !== 'Mão de Obra').map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={novoGasto.status}
              onChange={(e) => setNovoGasto({ ...novoGasto, status: e.target.value as 'pago' | 'pendente' })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
                '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.5)' },
              }}
            >
              <MenuItem value="pago">Pago</MenuItem>
              <MenuItem value="pendente">Pendente</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setGastoDialogOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveGasto}
            variant="contained"
            disabled={savingGasto || !novoGasto.descricao.trim() || !novoGasto.valor || !novoGasto.categoria || !novoGasto.data}
            sx={{
              bgcolor: '#009246',
              '&:hover': { bgcolor: '#007a3a' },
            }}
          >
            {savingGasto ? 'Salvando...' : 'Salvar Gasto'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog - Lançar Pagamento do Cliente */}
      <Dialog
        open={pagamentoDialogOpen}
        onClose={() => setPagamentoDialogOpen(false)}
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
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PaymentIcon sx={{ color: '#009246' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lançar Pagamento do Cliente
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            {/* Cliente */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(0, 146, 70, 0.1)',
                border: '1px solid rgba(0, 146, 70, 0.2)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Cliente
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#009246' }}>
                {obra?.cliente?.nome || '-'}
              </Typography>
            </Box>

            {/* Valor */}
            <TextField
              type="number"
              label="Valor do Pagamento"
              value={novoPagamento.valor}
              onChange={(e) => setNovoPagamento({ ...novoPagamento, valor: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }}>R$</Typography>,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
              }}
            />

            {/* Data */}
            <TextField
              type="date"
              label="Data do Pagamento"
              value={novoPagamento.data}
              onChange={(e) => setNovoPagamento({ ...novoPagamento, data: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  filter: 'invert(1)',
                  cursor: 'pointer',
                },
              }}
            />

            {/* Descrição */}
            <TextField
              label="Descrição"
              value={novoPagamento.descricao}
              onChange={(e) => setNovoPagamento({ ...novoPagamento, descricao: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#f5f5f5',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#009246' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.5)' },
              }}
            />

            {/* Resumo */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Situação após este pagamento:
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total Recebido:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#009246' }}>
                  {formatCurrency(totalRecebido + (parseFloat(novoPagamento.valor) || 0))}
                </Typography>
              </Box>
              <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  A Receber:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff9800' }}>
                  {formatCurrency(valorRestante - (parseFloat(novoPagamento.valor) || 0))}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setPagamentoDialogOpen(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSavePagamento}
            variant="contained"
            disabled={!novoPagamento.valor || savingPagamento}
            sx={{
              bgcolor: '#009246',
              '&:hover': { bgcolor: '#007a3a' },
            }}
          >
            {savingPagamento ? 'Salvando...' : 'Registrar Pagamento'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ObraDetalhes;
