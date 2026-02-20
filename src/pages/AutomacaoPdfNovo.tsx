import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  Paper,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import PropostaPDF, { PropostaData, ItemProposta } from '../components/propostas/PropostaPDF';
import supabase from '../lib/supabaseClient';

// =============================================================================
// CONSTANTES
// =============================================================================

const VALIDADE_OPTIONS = [
  { value: '7 dias', label: '7 dias' },
  { value: '15 dias', label: '15 dias' },
  { value: '30 dias', label: '30 dias' },
  { value: '45 dias', label: '45 dias' },
  { value: '60 dias', label: '60 dias' },
];

const ENTRADA_OPTIONS = [
  { value: '30', label: '30%' },
  { value: '40', label: '40%' },
  { value: '50', label: '50%' },
  { value: '60', label: '60%' },
  { value: '70', label: '70%' },
  { value: '100', label: '100%' },
];

const generateId = () => Math.random().toString(36).substring(2, 15);

const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

const AutomacaoPdfNovo: React.FC = () => {
  // Estados do formulário
  const [cliente, setCliente] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [descricaoServico, setDescricaoServico] = useState('');
  const [escopoFornecimento, setEscopoFornecimento] = useState('');
  const [validadeProposta, setValidadeProposta] = useState('30 dias');
  const [prazoProducao, setPrazoProducao] = useState('');
  const [prazoInstalacao, setPrazoInstalacao] = useState('');
  const [entradaPercentual, setEntradaPercentual] = useState('50');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemProposta[]>([
    { id: generateId(), descricao: '', detalhes: '', quantidade: 1, valor_unitario: 0 },
  ]);

  // Estados de controle
  const [numeroProposta, setNumeroProposta] = useState('');
  const [dataEmissao] = useState(formatDateToISO(new Date()));
  const [showPreview, setShowPreview] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<'dark' | 'light'>('dark');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // =============================================================================
  // GERAÇÃO DO NÚMERO DA PROPOSTA
  // =============================================================================

  const gerarNumeroProposta = useCallback(async () => {
    try {
      const ano = new Date().getFullYear();

      // Tenta buscar último número na tabela de sequência
      const { data: sequenciaData } = await supabase
        .from('propostas_sequencia')
        .select('ultimo_numero')
        .eq('id', 1)
        .single();

      let ultimoNumero = sequenciaData?.ultimo_numero || 0;

      // Se não encontrou, busca o maior número na tabela propostas
      if (!ultimoNumero) {
        const { data: propostasData } = await supabase
          .from('propostas')
          .select('numero_sequencial')
          .order('numero_sequencial', { ascending: false })
          .limit(1);

        ultimoNumero = propostasData?.[0]?.numero_sequencial || 0;
      }

      const novoNumero = ultimoNumero + 1;
      const numeroFormatado = `${ano}-${novoNumero.toString().padStart(4, '0')}-R01`;

      setNumeroProposta(numeroFormatado);
    } catch (error) {
      console.error('Erro ao gerar número da proposta:', error);
      // Fallback: gera número baseado em timestamp
      const timestamp = Date.now().toString().slice(-6);
      setNumeroProposta(`${new Date().getFullYear()}-${timestamp}-R01`);
    }
  }, []);

  useEffect(() => {
    gerarNumeroProposta();
  }, [gerarNumeroProposta]);

  // =============================================================================
  // MANIPULAÇÃO DE ITENS
  // =============================================================================

  const handleAddItem = () => {
    setItens([
      ...itens,
      { id: generateId(), descricao: '', detalhes: '', quantidade: 1, valor_unitario: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (itens.length > 1) {
      setItens(itens.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof ItemProposta, value: string | number) => {
    setItens(
      itens.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'quantidade' || field === 'valor_unitario' ? Number(value) : value }
          : item
      )
    );
  };

  // =============================================================================
  // CÁLCULOS
  // =============================================================================

  const valorTotal = useMemo(() => {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0);
  }, [itens]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // =============================================================================
  // DADOS DA PROPOSTA
  // =============================================================================

  const propostaData: PropostaData = useMemo(
    () => ({
      cliente,
      empresa,
      numeroProposta,
      dataEmissao,
      validadeProposta,
      prazoProducao,
      prazoInstalacao,
      entradaPercentual,
      observacoes,
      itens,
      descricaoServico,
      escopoFornecimento,
    }),
    [
      cliente,
      empresa,
      numeroProposta,
      dataEmissao,
      validadeProposta,
      prazoProducao,
      prazoInstalacao,
      entradaPercentual,
      observacoes,
      itens,
      descricaoServico,
      escopoFornecimento,
    ]
  );

  // =============================================================================
  // VALIDAÇÃO
  // =============================================================================

  const isValid = useMemo(() => {
    if (!cliente.trim()) return false;
    if (itens.length === 0) return false;
    for (const item of itens) {
      if (!item.descricao.trim()) return false;
      if (item.quantidade < 1) return false;
      if (item.valor_unitario <= 0) return false;
    }
    return true;
  }, [cliente, itens]);

  // =============================================================================
  // SALVAR PROPOSTA
  // =============================================================================

  const handleSaveProposta = async () => {
    if (!isValid) {
      setSnackbar({
        open: true,
        message: 'Preencha todos os campos obrigatórios',
        severity: 'error',
      });
      return;
    }

    setSaving(true);

    try {
      // Extrai número sequencial e revisão do formato YYYY-XXXX-RNN
      const parts = numeroProposta.split('-');
      const numeroSequencial = parseInt(parts[1], 10);
      const numeroRevisao = parseInt(parts[2].replace('R', ''), 10);

      const propostaToSave = {
        numero_sequencial: numeroSequencial,
        numero_revisao: numeroRevisao,
        cliente_nome: cliente,
        cliente_empresa: empresa || null,
        descricao_servicos: descricaoServico || null,
        valor_total: valorTotal,
        status: 'rascunho',
        data_emissao: dataEmissao,
        validade: validadeProposta,
        prazo_producao: prazoProducao || null,
        prazo_instalacao: prazoInstalacao || null,
        condicoes_pagamento: `${entradaPercentual}% entrada`,
        observacoes: observacoes || null,
        escopo_tecnico: escopoFornecimento || null,
        price_items: itens,
      };

      const { error } = await supabase.from('propostas').insert(propostaToSave);

      if (error) throw error;

      // Atualiza sequência
      await supabase
        .from('propostas_sequencia')
        .upsert({ id: 1, ultimo_numero: numeroSequencial });

      setSnackbar({
        open: true,
        message: 'Proposta salva com sucesso!',
        severity: 'success',
      });

      // Limpa formulário
      handleClearForm();
    } catch (error) {
      console.error('Erro ao salvar proposta:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar proposta. Tente novamente.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearForm = () => {
    setCliente('');
    setEmpresa('');
    setDescricaoServico('');
    setEscopoFornecimento('');
    setValidadeProposta('30 dias');
    setPrazoProducao('');
    setPrazoInstalacao('');
    setEntradaPercentual('50');
    setObservacoes('');
    setItens([{ id: generateId(), descricao: '', detalhes: '', quantidade: 1, valor_unitario: 0 }]);
    setShowPreview(false);
    gerarNumeroProposta();
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <PdfIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Gerador de Propostas PDF
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crie propostas comerciais profissionais para seus clientes
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Coluna do Formulário */}
        <Grid size={{ xs: 12, lg: showPreview ? 6 : 12 }}>
          {/* Seção 1: Dados da Proposta */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📋 Dados da Proposta
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Nº Proposta"
                    value={numeroProposta}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Data de Emissão"
                    value={new Date(dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR')}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Validade</InputLabel>
                    <Select
                      value={validadeProposta}
                      label="Validade"
                      onChange={(e) => setValidadeProposta(e.target.value)}
                    >
                      {VALIDADE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Seção 2: Dados do Cliente */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                👤 Dados do Cliente
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    required
                    label="Nome do Cliente"
                    placeholder="Digite o nome completo"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    size="small"
                    error={!cliente.trim() && cliente !== ''}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Empresa"
                    placeholder="Nome da empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Seção 3: Carta de Apresentação */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ✉️ Carta de Apresentação
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Descrição do Serviço"
                placeholder="Ex: Produção de Logomarcas e Letreiro em PVC"
                value={descricaoServico}
                onChange={(e) => setDescricaoServico(e.target.value)}
                size="small"
                helperText="Será usado na carta de apresentação da proposta"
              />
            </CardContent>
          </Card>

          {/* Seção 4: Escopo de Fornecimento */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📝 Escopo de Fornecimento
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Escopo Personalizado (opcional)"
                placeholder="Deixe vazio para gerar automaticamente a partir dos itens..."
                value={escopoFornecimento}
                onChange={(e) => setEscopoFornecimento(e.target.value)}
                size="small"
                helperText="Se vazio, o escopo será gerado automaticamente com base nos itens abaixo"
              />
            </CardContent>
          </Card>

          {/* Seção 5: Itens da Proposta */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  📦 Itens da Proposta
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  size="small"
                >
                  Adicionar Item
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {itens.map((item, index) => (
                <Paper key={item.id} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }} elevation={0}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">
                      Item {index + 1}
                    </Typography>
                    <Tooltip title="Remover item">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={itens.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        required
                        label="Descrição"
                        placeholder="Nome do produto/serviço"
                        value={item.descricao}
                        onChange={(e) => handleItemChange(item.id, 'descricao', e.target.value)}
                        size="small"
                        error={!item.descricao.trim() && item.descricao !== ''}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Detalhes Técnicos"
                        placeholder="Especificações técnicas"
                        value={item.detalhes}
                        onChange={(e) => handleItemChange(item.id, 'detalhes', e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Quantidade"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(item.id, 'quantidade', e.target.value)}
                        onFocus={(e) => (e.target as HTMLInputElement).select()}
                        size="small"
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="number"
                        label="Valor Unitário"
                        value={item.valor_unitario || ''}
                        onChange={(e) => handleItemChange(item.id, 'valor_unitario', e.target.value)}
                        onFocus={(e) => (e.target as HTMLInputElement).select()}
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Subtotal"
                        value={formatCurrency(item.quantidade * item.valor_unitario)}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}

              {/* Total */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" color="primary.contrastText">
                  VALOR TOTAL
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.contrastText">
                  {formatCurrency(valorTotal)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Seção 6: Condições Gerais */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ⚙️ Condições Gerais
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Prazo de Produção"
                    placeholder="Ex: 15 dias úteis"
                    value={prazoProducao}
                    onChange={(e) => setPrazoProducao(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Prazo de Instalação"
                    placeholder="Ex: 5 dias úteis"
                    value={prazoInstalacao}
                    onChange={(e) => setPrazoInstalacao(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Entrada (%)</InputLabel>
                    <Select
                      value={entradaPercentual}
                      label="Entrada (%)"
                      onChange={(e) => setEntradaPercentual(e.target.value)}
                    >
                      {ENTRADA_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Seção 7: Observações */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                💬 Observações
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observações"
                placeholder="Observações adicionais para a proposta..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                size="small"
              />
            </CardContent>
          </Card>

          {/* Validação */}
          {!isValid && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Preencha todos os campos obrigatórios: Nome do Cliente, e pelo menos um item com descrição, 
              quantidade e valor unitário.
            </Alert>
          )}

          {/* Ações */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="pdf-theme-label">Tema do PDF</InputLabel>
              <Select
                labelId="pdf-theme-label"
                value={pdfTheme}
                label="Tema do PDF"
                onChange={(e) => setPdfTheme(e.target.value as 'dark' | 'light')}
              >
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="light">Light</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => setShowPreview(!showPreview)}
              disabled={!isValid}
            >
              {showPreview ? 'Ocultar Preview' : 'Visualizar PDF'}
            </Button>

            {isValid && (
              <PDFDownloadLink
                document={<PropostaPDF data={propostaData} theme={pdfTheme} />}
                fileName={`Proposta_${numeroProposta}_${cliente.replace(/\s+/g, '_')}.pdf`}
                style={{ textDecoration: 'none' }}
              >
                {({ loading }) => (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Gerando...' : 'Baixar PDF'}
                  </Button>
                )}
              </PDFDownloadLink>
            )}

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveProposta}
              disabled={!isValid || saving}
            >
              {saving ? 'Salvando...' : 'Salvar Proposta'}
            </Button>

            <Button variant="text" color="inherit" onClick={handleClearForm}>
              Limpar Formulário
            </Button>
          </Box>
        </Grid>

        {/* Coluna do Preview */}
        {showPreview && isValid && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ height: 'calc(100vh - 150px)', position: 'sticky', top: 20 }}>
              <CardContent sx={{ height: '100%', p: 0 }}>
                <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                  <PropostaPDF data={propostaData} theme={pdfTheme} />
                </PDFViewer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Snackbar de Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AutomacaoPdfNovo;
