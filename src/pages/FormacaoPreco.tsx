import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Tabs,
  Tab,
  Paper,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useFormacaoPreco } from '@/hooks/useFormacaoPreco';
import {
  TabelaMaoDeObra,
  FormularioCargo,
  ResumoFinanceiroCard,
  ConfiguracoesFinanceiras,
  TabelaLogistica,
  FormularioHospedagem,
  FormularioTransporte,
  TabelaMateriais,
  FormularioMaterial,
  ListaPropostas,
} from '../components/formacao-preco';

/**
 * Página principal do módulo de Formação de Preço de Venda
 * Sistema de orçamentação Bottom-up para Engenharia
 */
export const FormacaoPreco: React.FC = () => {
  const {
    proposta,
    loading,
    error,
    propostas,
    custosTotalMaoDeObra,
    totalMaoDeObra,
    custoLogistica,
    totalMateriais,
    totalEquipamentos,
    totalServicosTerceiros,
    resumoFinanceiro,
    adicionarCargo,
    adicionarHospedagem,
    adicionarTransporte,
    adicionarMaterial,
    atualizarParametrosFinanceiros,
    salvarProposta,
    carregarProposta,
    listarPropostas,
    deletarProposta,
  } = useFormacaoPreco();

  // Estado da UI
  const [abaAtiva, setAbaAtiva] = useState(0);
  const [modalCargoAberto, setModalCargoAberto] = useState(false);
  const [modalHospedagemAberto, setModalHospedagemAberto] = useState(false);
  const [modalTransporteAberto, setModalTransporteAberto] = useState(false);
  const [modalMaterialAberto, setModalMaterialAberto] = useState(false);
  const [modalListaPropostasAberto, setModalListaPropostasAberto] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleChangeAba = (_event: React.SyntheticEvent, novaAba: number) => {
    setAbaAtiva(novaAba);
  };

  const handleSalvarProposta = async () => {
    try {
      const id = await salvarProposta();
      if (id) {
        setSnackbarMessage('Proposta salva com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        throw new Error('Erro ao salvar proposta');
      }
    } catch (err) {
      setSnackbarMessage(err instanceof Error ? err.message : 'Erro ao salvar proposta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCarregarProposta = async (id: string) => {
    try {
      await carregarProposta(id);
      setSnackbarMessage('Proposta carregada com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage(err instanceof Error ? err.message : 'Erro ao carregar proposta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeletarProposta = async (id: string) => {
    const sucesso = await deletarProposta(id);
    if (sucesso) {
      setSnackbarMessage('Proposta deletada com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage('Erro ao deletar proposta');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Cabeçalho */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'flex-start' },
          gap: { xs: 1.5, md: 2 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            gutterBottom
            sx={{ fontSize: { xs: '1.35rem', sm: '1.6rem', md: '2.125rem' }, lineHeight: 1.2 }}
          >
            📊 Formação de Preço de Venda
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Defina equipe, logística e materiais. Ajuste taxas e veja o preço final em tempo real.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FolderOpenIcon />}
          onClick={() => setModalListaPropostasAberto(true)}
          sx={{ alignSelf: { xs: 'flex-start', md: 'flex-start' }, width: { xs: 'fit-content', md: 'auto' } }}
        >
          Minhas Propostas
        </Button>
      </Box>

      {/* Abas de Navegação */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={abaAtiva}
          onChange={handleChangeAba}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              minHeight: 56,
              minWidth: { xs: 140, sm: 170 },
              whiteSpace: 'nowrap',
            },
          }}
        >
          <Tab
            icon={<CalculateOutlinedIcon fontSize="small" />}
            label="Equipe"
            iconPosition="start"
          />
          <Tab
            icon={<LocalShippingOutlinedIcon fontSize="small" />}
            label="Logística"
            iconPosition="start"
          />
          <Tab
            icon={<Inventory2OutlinedIcon fontSize="small" />}
            label="Materiais"
            iconPosition="start"
          />
          <Tab
            icon={<DescriptionOutlinedIcon fontSize="small" />}
            label="Fechamento"
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {/* Coluna Principal - Conteúdo das Abas */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* ABA 1: MÃO DE OBRA */}
          {abaAtiva === 0 && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="semibold">
                  Equipe e Horas Trabalhadas
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddOutlinedIcon />}
                  onClick={() => setModalCargoAberto(true)}
                >
                  Adicionar Função
                </Button>
              </Box>

              {proposta.maoDeObra.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Nenhuma função adicionada
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clique em "Adicionar Função" para montar a equipe
                  </Typography>
                </Paper>
              ) : (
                <TabelaMaoDeObra
                  custos={custosTotalMaoDeObra}
                  totalMaoDeObra={totalMaoDeObra}
                />
              )}
            </Box>
          )}

          {/* ABA 2: LOGÍSTICA */}
          {abaAtiva === 1 && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight="semibold">
                  Logística e Deslocamento
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddOutlinedIcon />}
                    onClick={() => setModalHospedagemAberto(true)}
                  >
                    Adicionar Hospedagem
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddOutlinedIcon />}
                    onClick={() => setModalTransporteAberto(true)}
                  >
                    Adicionar Transporte
                  </Button>
                </Box>
              </Box>

              {proposta.hospedagens.length === 0 && proposta.transportes.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                  <LocalShippingOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Nenhum item de logística adicionado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use os botões acima para adicionar hospedagem/alimentação e transporte
                  </Typography>
                </Paper>
              ) : (
                <TabelaLogistica
                  hospedagens={proposta.hospedagens}
                  transportes={proposta.transportes}
                  custoLogistica={custoLogistica}
                />
              )}
            </Box>
          )}

          {/* ABA 3: MATERIAIS */}
          {abaAtiva === 2 && (
            <Box>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight="semibold">
                  Materiais, Equipamentos e Terceiros
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddOutlinedIcon />}
                  onClick={() => setModalMaterialAberto(true)}
                >
                  Adicionar Material
                </Button>
              </Box>

              {proposta.materiais.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                  <Inventory2OutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Nenhum item adicionado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clique em "Adicionar Material" para começar
                  </Typography>
                </Paper>
              ) : (
                <TabelaMateriais
                  materiais={proposta.materiais}
                  totalMateriais={totalMateriais}
                  totalEquipamentos={totalEquipamentos}
                  totalServicosTerceiros={totalServicosTerceiros}
                />
              )}
            </Box>
          )}

          {/* ABA 4: RESUMO FINAL */}
          {abaAtiva === 3 && (
            <Box>
              <Typography variant="h6" fontWeight="semibold" gutterBottom>
                Fechamento Financeiro
              </Typography>
              <ResumoFinanceiroCard resumo={resumoFinanceiro} />
            </Box>
          )}
        </Grid>

        {/* Coluna Lateral - Configurações e Resumo Rápido */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Parâmetros Financeiros */}
          <ConfiguracoesFinanceiras
            parametros={proposta.parametrosFinanceiros}
            onAtualizarParametros={atualizarParametrosFinanceiros}
          />

          {/* Card de Resumo Rápido */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" fontWeight="semibold" gutterBottom>
              💰 Resumo Rápido
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Mão de Obra:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalMaoDeObra)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Logística:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(custoLogistica.totalLogistica)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Materiais:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalMateriais + totalEquipamentos + totalServicosTerceiros)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" fontWeight="bold">
                  Preço Final:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="success.main">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(resumoFinanceiro.precoFinalVenda)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Botões de Ação */}
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveOutlinedIcon />}
              onClick={handleSalvarProposta}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Salvando...' : 'Salvar Proposta'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              startIcon={<DescriptionOutlinedIcon />}
              fullWidth
            >
              Exportar PDF
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Modal de Formulário de Cargo */}
      <FormularioCargo
        open={modalCargoAberto}
        onClose={() => setModalCargoAberto(false)}
        onSalvar={adicionarCargo}
      />

      <FormularioHospedagem
        open={modalHospedagemAberto}
        onClose={() => setModalHospedagemAberto(false)}
        onSalvar={adicionarHospedagem}
      />

      <FormularioTransporte
        open={modalTransporteAberto}
        onClose={() => setModalTransporteAberto(false)}
        onSalvar={adicionarTransporte}
      />

      <FormularioMaterial
        open={modalMaterialAberto}
        onClose={() => setModalMaterialAberto(false)}
        onSalvar={adicionarMaterial}
      />

      {/* Modal Lista de Propostas */}
      <ListaPropostas
        open={modalListaPropostasAberto}
        onClose={() => setModalListaPropostasAberto(false)}
        propostas={propostas}
        loading={loading}
        onCarregar={handleCarregarProposta}
        onDeletar={handleDeletarProposta}
        onListar={listarPropostas}
      />

      {/* Snackbar de Feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Indicador de erro global */}
      {error && (
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" variant="filled" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default FormacaoPreco;
