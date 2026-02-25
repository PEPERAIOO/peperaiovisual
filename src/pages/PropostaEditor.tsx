import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { PropostaData, ItemProposta } from '../components/propostas/PropostaPDF';
import { downloadPropostaPdf } from '../utils/propostaPdf';

// Hook e tipos
import { usePropostas } from '../hooks/usePropostas';
import {
  Proposta,
  PropostaStatus,
  PROPOSTA_STATUS_CONFIG,
  formatCurrency,
  formatNumeroProposta,
} from '../types/propostas';

// Interface para itens em edição
interface ItemForm {
  id?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
}

const PropostaEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Hook
  const { loadPropostaById, addProposta, updateProposta, aprovarECriarObra, loadItens, getProximoNumero, deleteProposta } =
    usePropostas();

  // Estados do formulário
  const [formData, setFormData] = useState<{
    numero_sequencial?: number;
    numero_revisao?: number;
    cliente_nome: string;
    cliente_empresa: string;
    descricao_servicos: string;
    valor_total: number;
    status: PropostaStatus;
    validade: string;
    prazo_producao: string;
    prazo_instalacao: string;
    condicoes_pagamento: string;
    observacoes: string;
    escopo_tecnico: string;
  }>({
    cliente_nome: '',
    cliente_empresa: '',
    descricao_servicos: '',
    valor_total: 0,
    status: 'rascunho',
    validade: '30 dias',
    prazo_producao: '',
    prazo_instalacao: '',
    condicoes_pagamento: '',
    observacoes: '',
    escopo_tecnico: '',
  });

  const [itens, setItens] = useState<ItemForm[]>([]);
  const [propostaOriginal, setPropostaOriginal] = useState<Proposta | null>(null);
  const [loadingData, setLoadingData] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [aprovarDialogOpen, setAprovarDialogOpen] = useState(false);
  const [obraNome, setObraNome] = useState('');
  const [pdfTheme, setPdfTheme] = useState<'dark' | 'light'>('dark');

  // Recalcular valor total quando itens mudam
  useEffect(() => {
    const total = itens.reduce((sum, item) => sum + item.quantidade * item.valor_unitario, 0);
    setFormData((prev) => ({ ...prev, valor_total: total }));
  }, [itens]);

  // Persistir tema do PDF
  useEffect(() => {
    const storedTheme = localStorage.getItem('pdfTheme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setPdfTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pdfTheme', pdfTheme);
  }, [pdfTheme]);

  // Carregar dados se estiver editando
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        // Nova proposta - buscar próximo número
        try {
          const proximoNumero = await getProximoNumero();
          setFormData(prev => ({
            ...prev,
            numero_sequencial: proximoNumero,
            numero_revisao: 1,
          }));
        } catch (err) {
          console.error('Erro ao buscar próximo número:', err);
        }
        return;
      }

      try {
        setLoadingData(true);
        const proposta = await loadPropostaById(id);
        if (proposta) {
          setPropostaOriginal(proposta);
          setFormData({
            numero_sequencial: proposta.numero_sequencial,
            numero_revisao: proposta.numero_revisao,
            cliente_nome: proposta.cliente_nome,
            cliente_empresa: proposta.cliente_empresa || '',
            descricao_servicos: proposta.descricao_servicos,
            valor_total: proposta.valor_total,
            status: proposta.status,
            validade: proposta.validade || '30 dias',
            prazo_producao: proposta.prazo_producao || '',
            prazo_instalacao: proposta.prazo_instalacao || '',
            condicoes_pagamento: proposta.condicoes_pagamento || '',
            observacoes: proposta.observacoes || '',
            escopo_tecnico: proposta.escopo_tecnico || '',
          });

          // Carregar itens
          const propostaItens = await loadItens(id);
          setItens(
            propostaItens.map((item) => ({
              id: item.id,
              descricao: item.descricao,
              quantidade: item.quantidade,
              unidade: item.unidade,
              valor_unitario: item.valor_unitario,
            }))
          );
        }
      } catch (err) {
        console.error('Erro ao carregar proposta:', err);
        setError('Erro ao carregar dados da proposta');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [id, loadPropostaById, loadItens, getProximoNumero]);

  // Handlers de formulário
  const handleChange = useCallback(
    (field: keyof typeof formData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setFormData((prev) => ({
          ...prev,
          [field]:
            field === 'valor_total'
              ? parseFloat(value) || 0
              : value,
        }));
      },
    []
  );

  // Handlers de itens
  const handleAddItem = useCallback(() => {
    setItens((prev) => [
      ...prev,
      {
        descricao: '',
        quantidade: 1,
        unidade: 'un',
        valor_unitario: 0,
      },
    ]);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemChange = useCallback(
    (index: number, field: keyof ItemForm, value: string | number) => {
      setItens((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                [field]:
                  field === 'quantidade' || field === 'valor_unitario'
                    ? parseFloat(value as string) || 0
                    : value,
              }
            : item
        )
      );
    },
    []
  );

  // Validação
  const validateForm = useCallback((): boolean => {
    if (!formData.cliente_nome.trim()) {
      setSnackbar({ open: true, message: 'Nome do cliente é obrigatório', severity: 'error' });
      return false;
    }
    if (!formData.descricao_servicos.trim()) {
      setSnackbar({ open: true, message: 'Descrição do serviço é obrigatória', severity: 'error' });
      return false;
    }
    return true;
  }, [formData]);

  // Salvar proposta
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const propostaData = {
        cliente_nome: formData.cliente_nome,
        cliente_empresa: formData.cliente_empresa || undefined,
        descricao_servicos: formData.descricao_servicos,
        valor_total: formData.valor_total,
        status: formData.status,
        validade: formData.validade || undefined,
        prazo_producao: formData.prazo_producao || undefined,
        prazo_instalacao: formData.prazo_instalacao || undefined,
        condicoes_pagamento: formData.condicoes_pagamento || undefined,
        observacoes: formData.observacoes || undefined,
        escopo_tecnico: formData.escopo_tecnico || undefined,
      };

      const itensData = itens.map((item) => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.quantidade * item.valor_unitario,
      }));

      if (isEditing && id) {
        await updateProposta(id, propostaData, itensData);
        setSnackbar({ open: true, message: 'Proposta atualizada com sucesso!', severity: 'success' });
      } else {
        const result = await addProposta(propostaData, itensData);
        if (result.success && result.data) {
          setSnackbar({ open: true, message: 'Proposta criada com sucesso!', severity: 'success' });
          // Navegar para edição da nova proposta
          navigate(`/propostas/${result.data.id}`, { replace: true });
        }
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setSnackbar({ open: true, message: 'Erro ao salvar proposta', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }, [formData, itens, isEditing, id, validateForm, addProposta, updateProposta, navigate]);

  // Aprovar e criar obra
  const handleConfirmarAprovarECriarObra = useCallback(async () => {
    if (!validateForm()) return;

    // Primeiro salvar se não estiver salvo
    if (!isEditing) {
      setSnackbar({ open: true, message: 'Salve a proposta primeiro antes de aprovar', severity: 'error' });
      return;
    }

    try {
      setAprovando(true);

      // Atualizar dados antes de aprovar
      const propostaData = {
        cliente_nome: formData.cliente_nome,
        cliente_empresa: formData.cliente_empresa || undefined,
        descricao_servicos: formData.descricao_servicos,
        valor_total: formData.valor_total,
        status: 'aprovada' as PropostaStatus,
        validade: formData.validade || undefined,
        prazo_producao: formData.prazo_producao || undefined,
        prazo_instalacao: formData.prazo_instalacao || undefined,
        condicoes_pagamento: formData.condicoes_pagamento || undefined,
        observacoes: formData.observacoes || undefined,
        escopo_tecnico: formData.escopo_tecnico || undefined,
      };

      const itensData = itens.map((item) => ({
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.quantidade * item.valor_unitario,
      }));

      await updateProposta(id!, propostaData, itensData);

      // Aprovar e criar obra
      const nomeFinal = obraNome.trim();
      if (!nomeFinal) {
        setSnackbar({ open: true, message: 'Informe o nome da obra', severity: 'error' });
        return;
      }

      const result = await aprovarECriarObra(id!, nomeFinal);

      if (result.success && result.obraId) {
        setSnackbar({ open: true, message: 'Proposta aprovada! Redirecionando para a obra...', severity: 'success' });
        setAprovarDialogOpen(false);
        
        // Aguardar um pouco e redirecionar
        setTimeout(() => {
          navigate(`/obras/${result.obraId}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      setSnackbar({ open: true, message: 'Erro ao aprovar proposta', severity: 'error' });
    } finally {
      setAprovando(false);
    }
  }, [formData, itens, isEditing, id, validateForm, updateProposta, aprovarECriarObra, navigate, obraNome]);

  const handleOpenAprovarDialog = useCallback(() => {
    setObraNome(formData.descricao_servicos || '');
    setAprovarDialogOpen(true);
  }, [formData.descricao_servicos]);

  // Gerar PDF
  const handleGeneratePdf = useCallback(async () => {
    try {
      const numeroProposta = formatNumeroProposta(formData.numero_sequencial, formData.numero_revisao);

      const entradaPercentual = (() => {
        const match = formData.condicoes_pagamento?.match(/(\d{1,3})\s*%/);
        return match?.[1] ?? '50';
      })();

      const itensPdf: ItemProposta[] = itens.map((item, index) => ({
        id: item.id ?? `tmp-${index}`,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      }));

      const propostaPdfData: PropostaData = {
        cliente: formData.cliente_nome,
        empresa: formData.cliente_empresa ?? '',
        numeroProposta,
        dataEmissao: new Date().toISOString().split('T')[0],
        validadeProposta: formData.validade ?? '30 dias',
        prazoProducao: formData.prazo_producao ?? '',
        prazoInstalacao: formData.prazo_instalacao ?? '',
        entradaPercentual,
        observacoes: formData.observacoes ?? '',
        itens: itensPdf,
        descricaoServico: formData.descricao_servicos ?? '',
        escopoFornecimento: formData.escopo_tecnico ?? '',
      };

      const nomeArquivo = `Proposta_${numeroProposta}_${formData.cliente_nome.replace(/\s+/g, '_')}.pdf`;
      await downloadPropostaPdf(propostaPdfData, nomeArquivo, pdfTheme);

      setSnackbar({ open: true, message: 'PDF gerado com sucesso!', severity: 'success' });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setSnackbar({ open: true, message: 'Erro ao gerar PDF', severity: 'error' });
    }
  }, [formData, itens, propostaOriginal, pdfTheme]);

  const handleDeleteProposta = useCallback(async () => {
    if (!propostaOriginal) return;

    const ok = window.confirm(
      `Tem certeza que deseja excluir a proposta ${formatNumeroProposta(
        propostaOriginal.numero_sequencial,
        propostaOriginal.numero_revisao
      )} de ${propostaOriginal.cliente_nome}?\n\nEssa ação não pode ser desfeita.`
    );
    if (!ok) return;

    const result = await deleteProposta(propostaOriginal.id);
    if (result.success) {
      navigate('/propostas');
    } else {
      setSnackbar({ open: true, message: 'Erro ao excluir proposta', severity: 'error' });
    }
  }, [deleteProposta, navigate, propostaOriginal]);

  // Loading inicial
  if (loadingData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress sx={{ color: '#009246' }} />
      </Box>
    );
  }

  // Verificar se proposta já foi aprovada e tem obra
  const temObra = !!propostaOriginal?.obra_gerada_id;

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            gap: { xs: 1.5, md: 2 },
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Tooltip title="Voltar">
              <IconButton
                onClick={() => navigate('/propostas')}
                size="small"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#f5f5f5',
                  fontSize: { xs: '1.35rem', sm: '1.6rem', md: '2.125rem' },
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                }}
              >
              {isEditing ? `Proposta ${formatNumeroProposta(formData.numero_sequencial, formData.numero_revisao)}` : 'Nova Proposta'}
              </Typography>
              {propostaOriginal && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: PROPOSTA_STATUS_CONFIG[propostaOriginal.status].bgColor,
                      color: PROPOSTA_STATUS_CONFIG[propostaOriginal.status].textColor,
                    }}
                  >
                    {PROPOSTA_STATUS_CONFIG[propostaOriginal.status].label}
                  </Box>
                  {temObra && (
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        bgcolor: 'rgba(0, 146, 70, 0.15)',
                        color: '#009246',
                      }}
                    >
                      Obra criada
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* Botões de ação */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              width: { xs: '100%', md: 'auto' },
            }}
          >
            <FormControl size="small" sx={{ minWidth: 140, flex: { xs: '1 1 160px', md: '0 0 auto' } }}>
              <InputLabel id="pdf-theme-editor-label">Tema do PDF</InputLabel>
              <Select
                labelId="pdf-theme-editor-label"
                value={pdfTheme}
                label="Tema do PDF"
                onChange={(e) => setPdfTheme(e.target.value as 'dark' | 'light')}
              >
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="light">Light</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Gerar PDF">
              <IconButton
                onClick={handleGeneratePdf}
                size="small"
                sx={{
                  color: '#ce2b37',
                  '&:hover': { bgcolor: 'rgba(206, 43, 55, 0.1)' },
                }}
              >
                <PdfIcon />
              </IconButton>
            </Tooltip>

            {isEditing && propostaOriginal && (
              <Tooltip title="Excluir proposta">
                <IconButton
                  onClick={handleDeleteProposta}
                  sx={{
                    color: 'rgba(255,255,255,0.65)',
                    '&:hover': { color: '#ef5350', bgcolor: 'rgba(239, 83, 80, 0.12)' },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Formulário */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Paper
          sx={{
            p: 3,
            bgcolor: 'rgba(255,255,255,0.02)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Número da Proposta */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: 'rgba(0,146,70,0.1)',
                border: '1px solid rgba(0,146,70,0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                Proposta
              </Typography>
              <Typography variant="h6" sx={{ color: '#009246', fontWeight: 800, lineHeight: 1 }}>
                {formatNumeroProposta(formData.numero_sequencial, formData.numero_revisao)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Dados do Cliente */}
          <Typography
            variant="h6"
            sx={{ color: '#009246', fontWeight: 600, mb: 2 }}
          >
            Dados do Cliente
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nome do Cliente *"
                value={formData.cliente_nome}
                onChange={handleChange('cliente_nome')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f5f5f5',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Empresa"
                value={formData.cliente_empresa}
                onChange={handleChange('cliente_empresa')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f5f5f5',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Descrição do Serviço */}
          <Typography
            variant="h6"
            sx={{ color: '#009246', fontWeight: 600, mb: 2 }}
          >
            Descrição do Serviço
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Descrição detalhada do serviço *"
            value={formData.descricao_servicos}
            onChange={handleChange('descricao_servicos')}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                color: '#f5f5f5',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#009246' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
            }}
          />

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Itens */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{ color: '#009246', fontWeight: 600 }}
            >
              Itens
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{
                color: '#009246',
                '&:hover': { bgcolor: 'rgba(0, 146, 70, 0.1)' },
              }}
            >
              Adicionar Item
            </Button>
          </Box>

          {itens.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: 'rgba(255,255,255,0.4)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: 2,
                mb: 3,
              }}
            >
              <Typography variant="body2">
                Nenhum item adicionado. Clique em "Adicionar Item" ou preencha apenas o valor total abaixo.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mb: 3 }}>
              {itens.map((item, index) => (
                <Paper
                  key={index}
                  sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: 'rgba(255,255,255,0.02)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    {/* Descrição - ocupa linha inteira em mobile */}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Descrição"
                        value={item.descricao}
                        onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#f5f5f5',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                        }}
                        size="small"
                      />
                    </Grid>
                    {/* Quantidade */}
                    <Grid size={{ xs: 4, sm: 2, md: 1.5 }}>
                      <TextField
                        fullWidth
                        label="Qtd"
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                        onFocus={(e) => (e.target as HTMLInputElement).select()}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#f5f5f5',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                        }}
                        size="small"
                      />
                    </Grid>
                    {/* Unidade */}
                    <Grid size={{ xs: 4, sm: 2, md: 1.5 }}>
                      <TextField
                        fullWidth
                        label="Un."
                        value={item.unidade}
                        onChange={(e) => handleItemChange(index, 'unidade', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#f5f5f5',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                        }}
                        size="small"
                      />
                    </Grid>
                    {/* Valor Unitário */}
                    <Grid size={{ xs: 4, sm: 2, md: 2 }}>
                      <TextField
                        fullWidth
                        label="Valor Unit."
                        type="number"
                        value={item.valor_unitario}
                        onChange={(e) => handleItemChange(index, 'valor_unitario', e.target.value)}
                        onFocus={(e) => (e.target as HTMLInputElement).select()}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#f5f5f5',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                        }}
                        size="small"
                      />
                    </Grid>
                    {/* Total e botão excluir */}
                    <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Typography
                          sx={{
                            flex: 1,
                            textAlign: { xs: 'left', md: 'right' },
                            color: '#009246',
                            fontWeight: 600,
                            fontSize: '1rem',
                          }}
                        >
                          {formatCurrency(item.quantidade * item.valor_unitario)}
                        </Typography>
                        <IconButton
                          onClick={() => handleRemoveItem(index)}
                          sx={{ color: '#ce2b37' }}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Valor Total, Validade e Status */}
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Valor Total (R$)"
                type="number"
                value={formData.valor_total}
                onChange={handleChange('valor_total')}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                disabled={itens.length > 0}
                helperText={itens.length > 0 ? 'Calculado pelos itens' : ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#009246',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    '& fieldset': { borderColor: 'rgba(0, 146, 70, 0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(0, 146, 70, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: '#009246' },
                  '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.4)' },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Validade"
                value={formData.validade}
                onChange={handleChange('validade')}
                placeholder="Ex: 30 dias"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f5f5f5',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Prazo Produção"
                value={formData.prazo_producao}
                onChange={handleChange('prazo_producao')}
                placeholder="Ex: 15 dias úteis"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f5f5f5',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={handleChange('status')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f5f5f5',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
                  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.5)' },
                }}
              >
                {Object.entries(PROPOSTA_STATUS_CONFIG).map(([value, config]) => (
                  <MenuItem key={value} value={value}>
                    {config.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Prazo de Instalação e Condições de Pagamento */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Prazo de Instalação"
                value={formData.prazo_instalacao}
                onChange={handleChange('prazo_instalacao')}
                placeholder="Ex: A combinar"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f5f5f5',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Condições de Pagamento"
                value={formData.condicoes_pagamento}
                onChange={handleChange('condicoes_pagamento')}
                placeholder="Ex: 50% entrada + 50% na entrega"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#f5f5f5',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#009246' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Escopo Técnico */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Escopo Técnico"
            value={formData.escopo_tecnico}
            onChange={handleChange('escopo_tecnico')}
            placeholder="Especificações técnicas do serviço..."
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                color: '#f5f5f5',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#009246' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
            }}
          />

          {/* Observações */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observações"
            value={formData.observacoes}
            onChange={handleChange('observacoes')}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                color: '#f5f5f5',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#009246' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#009246' },
            }}
          />

          {/* Botões de Ação */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate('/propostas')}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                borderColor: 'rgba(255,255,255,0.2)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.4)',
                  bgcolor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              Voltar
            </Button>

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving || aprovando}
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                color: '#f5f5f5',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.15)',
                },
              }}
            >
              {saving ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>

            {isEditing && !temObra && (
              <Button
                variant="contained"
                startIcon={aprovando ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                onClick={handleOpenAprovarDialog}
                disabled={saving || aprovando}
                sx={{
                  bgcolor: '#009246',
                  color: '#fff',
                  px: 3,
                  '&:hover': {
                    bgcolor: '#007a3a',
                  },
                  boxShadow: '0 4px 20px rgba(0, 146, 70, 0.3)',
                }}
              >
                {aprovando ? 'Aprovando...' : '✅ Aprovar e Gerar Obra'}
              </Button>
            )}

            {temObra && (
              <Button
                variant="contained"
                onClick={() => navigate(`/obras/${propostaOriginal?.obra_gerada_id}`)}
                sx={{
                  bgcolor: '#009246',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: '#007a3a',
                  },
                }}
              >
                Ver Obra
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>

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

      <Dialog
        open={aprovarDialogOpen}
        onClose={() => (aprovando ? undefined : setAprovarDialogOpen(false))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Aprovar proposta</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#f5f5f5', mb: 2 }}>
            Informe o nome da obra que será criada.
          </Typography>
          <TextField
            fullWidth
            label="Nome da obra"
            value={obraNome}
            onChange={(e) => setObraNome(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setAprovarDialogOpen(false)}
            variant="outlined"
            disabled={aprovando}
          >
            Voltar
          </Button>
          <Button
            onClick={handleConfirmarAprovarECriarObra}
            variant="contained"
            color="success"
            disabled={aprovando}
          >
            {aprovando ? 'Aprovando...' : 'Aprovar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropostaEditor;
