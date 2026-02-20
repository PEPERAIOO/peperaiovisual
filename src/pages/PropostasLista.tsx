import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Fab,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Snackbar,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import type { PropostaData, ItemProposta } from '../components/propostas/PropostaPDF';
import { downloadPropostaPdf } from '../utils/propostaPdf';

// Componentes
import { PropostaCard } from '../components/propostas';

// Hook e tipos
import { usePropostas } from '../hooks/usePropostas';
import {
  Proposta,
  PropostaStatus,
  PROPOSTA_TABS,
  PropostaTabValue,
  PROPOSTA_STATUS_CONFIG,
  formatCurrency,
  formatNumeroProposta,
} from '../types/propostas';

const PropostasLista = () => {
  const navigate = useNavigate();

  // Hook principal
  const { propostas, loading, error, getPropostasByStatus, getStats, refresh, loadItens, deleteProposta, aprovarECriarObra, rejeitarProposta } =
    usePropostas();

  // Estados
  const [activeTab, setActiveTab] = useState<PropostaTabValue>('todas');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    proposta: Proposta | null;
  }>({
    open: false,
    action: null,
    proposta: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [obraNome, setObraNome] = useState('');
  const [pdfTheme, setPdfTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('pdfTheme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setPdfTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pdfTheme', pdfTheme);
  }, [pdfTheme]);

  // Propostas filtradas
  const filteredPropostas = useMemo(
    () => getPropostasByStatus(activeTab as PropostaStatus | 'todas'),
    [getPropostasByStatus, activeTab]
  );

  // Stats
  const stats = useMemo(() => getStats(), [getStats]);

  // Handlers
  const handleEdit = useCallback(
    (proposta: Proposta) => {
      navigate(`/propostas/${proposta.id}`);
    },
    [navigate]
  );

  const handleCardClick = useCallback(
    (proposta: Proposta) => {
      navigate(`/propostas/${proposta.id}`);
    },
    [navigate]
  );

  const handleNewProposta = useCallback(() => {
    navigate('/propostas/nova');
  }, [navigate]);

  // Gerar PDF da proposta
  const handleGeneratePdf = useCallback(
    async (proposta: Proposta) => {
      try {
        const itens = await loadItens(proposta.id);

        const numeroProposta = formatNumeroProposta(proposta.numero_sequencial, proposta.numero_revisao);
        const entradaPercentual = (() => {
          const match = proposta.condicoes_pagamento?.match(/(\d{1,3})\s*%/);
          return match?.[1] ?? '50';
        })();

        const itensPdf: ItemProposta[] = itens.map((item) => ({
          id: item.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
        }));

        const propostaPdfData: PropostaData = {
          cliente: proposta.cliente_nome,
          empresa: proposta.cliente_empresa ?? '',
          numeroProposta,
          dataEmissao: proposta.data_emissao ?? proposta.created_at,
          validadeProposta: proposta.validade ?? '30 dias',
          prazoProducao: proposta.prazo_producao ?? '',
          prazoInstalacao: proposta.prazo_instalacao ?? '',
          entradaPercentual,
          observacoes: proposta.observacoes ?? '',
          itens: itensPdf,
          descricaoServico: proposta.descricao_servicos ?? '',
          escopoFornecimento: proposta.escopo_tecnico ?? '',
        };

        const nomeArquivo = `Proposta_${numeroProposta}_${proposta.cliente_nome.replace(/\s+/g, '_')}.pdf`;
        await downloadPropostaPdf(propostaPdfData, nomeArquivo, pdfTheme);

        setSnackbar({ open: true, message: 'PDF gerado com sucesso!' });
      } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        setSnackbar({ open: true, message: 'Erro ao gerar PDF' });
      }
    },
    [loadItens, pdfTheme]
  );

  const handleDelete = useCallback(
    async (proposta: Proposta) => {
      const ok = window.confirm(
        `Tem certeza que deseja excluir a proposta ${formatNumeroProposta(
          proposta.numero_sequencial,
          proposta.numero_revisao
        )} de ${proposta.cliente_nome}?\n\nEssa ação não pode ser desfeita.`
      );

      if (!ok) return;

      const result = await deleteProposta(proposta.id);
      if (result.success) {
        setSnackbar({ open: true, message: 'Proposta excluída com sucesso!' });
      } else {
        setSnackbar({ open: true, message: 'Erro ao excluir proposta' });
      }
    },
    [deleteProposta]
  );

  const handleApprove = useCallback(
    async (proposta: Proposta) => {
      setObraNome(proposta.descricao_servicos || '');
      setConfirmDialog({ open: true, action: 'approve', proposta });
    },
    [aprovarECriarObra]
  );

  const handleReject = useCallback(
    async (proposta: Proposta) => {
      setConfirmDialog({ open: true, action: 'reject', proposta });
    },
    [rejeitarProposta]
  );

  const handleConfirmAction = useCallback(async () => {
    if (!confirmDialog.proposta || !confirmDialog.action) return;

    if (confirmLoading) return;
    setConfirmLoading(true);

    if (confirmDialog.action === 'approve') {
      const nomeFinal = obraNome.trim();
      if (!nomeFinal) {
        setSnackbar({ open: true, message: 'Informe o nome da obra' });
        setConfirmLoading(false);
        return;
      }

      const result = await aprovarECriarObra(confirmDialog.proposta.id, nomeFinal);
      if (result.success) {
        setSnackbar({ open: true, message: 'Proposta aprovada e obra criada!' });
      } else {
        setSnackbar({ open: true, message: 'Erro ao aprovar proposta' });
      }
    }

    if (confirmDialog.action === 'reject') {
      const result = await rejeitarProposta(confirmDialog.proposta.id);
      if (result.success) {
        setSnackbar({ open: true, message: 'Proposta cancelada com sucesso!' });
      } else {
        setSnackbar({ open: true, message: 'Erro ao cancelar proposta' });
      }
    }

    setConfirmDialog({ open: false, action: null, proposta: null });
    setConfirmLoading(false);
  }, [confirmDialog, aprovarECriarObra, rejeitarProposta, obraNome, confirmLoading]);


  // Loading state
  if (loading && propostas.length === 0) {
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

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <DescriptionIcon sx={{ fontSize: 32, color: '#009246' }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#f5f5f5',
                }}
              >
                Propostas
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {stats.total} {stats.total === 1 ? 'proposta' : 'propostas'} •{' '}
              {formatCurrency(stats.valorTotal)} em orçamentos
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="pdf-theme-list-label">Tema do PDF</InputLabel>
              <Select
                labelId="pdf-theme-list-label"
                value={pdfTheme}
                label="Tema do PDF"
                onChange={(e) => setPdfTheme(e.target.value as 'dark' | 'light')}
              >
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="light">Light</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Atualizar">
              <IconButton
                onClick={refresh}
                sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#009246' } }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* Cards de Resumo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: 2,
            mb: 3,
          }}
        >
          {[
            { label: 'Total', value: stats.total, color: '#fff' },
            { label: 'Rascunhos', value: stats.rascunhos, color: '#9e9e9e' },
            { label: 'Enviadas', value: stats.enviadas, color: '#2196f3' },
            { label: 'Aprovadas', value: stats.aprovadas, color: '#009246' },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                p: 2,
                bgcolor: 'rgba(255,255,255,0.03)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: stat.color,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </motion.div>

      {/* Tabs de Filtro */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Box
          sx={{
            mb: 3,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 500,
                minHeight: 48,
                textTransform: 'none',
                '&.Mui-selected': {
                  color: '#009246',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#009246',
              },
            }}
          >
            {PROPOSTA_TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    <Box
                      component="span"
                      sx={{
                        bgcolor:
                          tab.value === 'todas'
                            ? 'rgba(255,255,255,0.1)'
                            : PROPOSTA_STATUS_CONFIG[tab.value as PropostaStatus]?.bgColor ||
                              'rgba(255,255,255,0.1)',
                        color:
                          tab.value === 'todas'
                            ? 'rgba(255,255,255,0.7)'
                            : PROPOSTA_STATUS_CONFIG[tab.value as PropostaStatus]?.textColor ||
                              'rgba(255,255,255,0.7)',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {tab.value === 'todas'
                        ? stats.total
                        : tab.value === 'rascunho'
                        ? stats.rascunhos
                        : tab.value === 'enviada'
                        ? stats.enviadas
                        : tab.value === 'aprovada'
                        ? stats.aprovadas
                        : 0}
                    </Box>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>
      </motion.div>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Grid de Cards */}
      <AnimatePresence mode="wait">
        {filteredPropostas.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              <DescriptionIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Nenhuma proposta encontrada
              </Typography>
              <Typography variant="body2">
                Clique no botão "+" para criar uma nova proposta
              </Typography>
            </Box>
          </motion.div>
        ) : (
          <Grid container spacing={2}>
            {filteredPropostas.map((proposta, index) => (
              <Grid
                key={proposta.id}
                size={{ xs: 12, sm: 6, md: 6, lg: 4, xl: 3 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <PropostaCard
                    proposta={proposta}
                    onEdit={handleEdit}
                    onGeneratePdf={handleGeneratePdf}
                    onDelete={handleDelete}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onClick={handleCardClick}
                  />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </AnimatePresence>

      {/* FAB - Nova Proposta */}
      <Fab
        color="primary"
        aria-label="Nova Proposta"
        onClick={handleNewProposta}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#009246',
          '&:hover': {
            bgcolor: '#007a3a',
          },
          boxShadow: '0 8px 32px rgba(0, 146, 70, 0.4)',
        }}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null, proposta: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.action === 'approve' ? 'Aprovar proposta' : 'Cancelar proposta'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#f5f5f5' }}>
            {confirmDialog.action === 'approve'
              ? `Deseja aprovar a proposta ${formatNumeroProposta(
                  confirmDialog.proposta?.numero_sequencial,
                  confirmDialog.proposta?.numero_revisao
                )} e criar a obra?`
              : `Deseja cancelar a proposta ${formatNumeroProposta(
                  confirmDialog.proposta?.numero_sequencial,
                  confirmDialog.proposta?.numero_revisao
                )}?`}
          </Typography>
          {confirmDialog.action === 'approve' && (
            <TextField
              fullWidth
              label="Nome da obra"
              value={obraNome}
              onChange={(e) => setObraNome(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmDialog({ open: false, action: null, proposta: null })}
            variant="outlined"
            disabled={confirmLoading}
          >
            Voltar
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={confirmDialog.action === 'approve' ? 'success' : 'error'}
            disabled={confirmLoading}
          >
            {confirmDialog.action === 'approve'
              ? (confirmLoading ? 'Aprovando...' : 'Aprovar')
              : (confirmLoading ? 'Cancelando...' : 'Cancelar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropostasLista;
