import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Skeleton,
  Alert,
  Card,
  LinearProgress,
  List,
  ListItem,
  Divider,
  Collapse,
  Grid,
} from '@mui/material';
import {
  Construction as ConstructionIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useObrasDelegadas } from '../hooks/useObrasDelegadas';
import { RegistrarGastoModal } from '../components/delegacao';
import {
  ObraVerba,
  GastoDelegado,
  GastoDelegadoInsert,
  ResumoVerba,
  calcularResumoVerba,
  formatCurrency,
} from '../types/delegacao';
import { useAuth } from '../contexts';

const MinhasObras = () => {
  const { profile } = useAuth();
  const {
    verbas,
    loading,
    error,
    loadMinhasVerbas,
    loadGastos,
    registrarGasto,
    editarGasto,
    excluirGasto,
    finalizarPrestacao,
  } = useObrasDelegadas();

  // Estados
  const [gastosMap, setGastosMap] = useState<Record<string, GastoDelegado[]>>({});
  const [resumosMap, setResumosMap] = useState<Record<string, ResumoVerba>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVerba, setSelectedVerba] = useState<ObraVerba | null>(null);
  const [loadingGastos, setLoadingGastos] = useState<Record<string, boolean>>({});
  const [finalizando, setFinalizando] = useState<string | null>(null);
  const [editandoGasto, setEditandoGasto] = useState<GastoDelegado | null>(null);
  const [excluindoGasto, setExcluindoGasto] = useState<string | null>(null);

  // Carregar minhas verbas quando profile estiver disponível
  useEffect(() => {
    if (profile?.id) {
      loadMinhasVerbas();
    }
  }, [profile?.id, profile?.entidade_id, loadMinhasVerbas]);

  // Filtrar apenas verbas enviadas (ativas ou superiores)
  const verbasAtivas = verbas.filter(
    (v) => v.status !== 'pendente_envio' && v.status !== 'cancelada'
  );

  // Carregar gastos de cada verba
  const carregarGastos = async (verbaId: string) => {
    console.log('Recarregando gastos para verba:', verbaId);
    setLoadingGastos((prev) => ({ ...prev, [verbaId]: true }));
    try {
      const gastos = await loadGastos(verbaId);
      console.log('Gastos recarregados:', gastos);
      setGastosMap((prev) => ({ ...prev, [verbaId]: gastos }));

      // Calcular resumo
      const verba = verbas.find((v) => v.id === verbaId);
      if (verba) {
        setResumosMap((prev) => ({
          ...prev,
          [verbaId]: calcularResumoVerba(verba, gastos),
        }));
      }
    } finally {
      setLoadingGastos((prev) => ({ ...prev, [verbaId]: false }));
    }
  };

  // Expandir/Colapsar card
  const toggleExpand = (verbaId: string) => {
    const newExpanded = !expandedCards[verbaId];
    setExpandedCards((prev) => ({ ...prev, [verbaId]: newExpanded }));

    // Carregar gastos se expandindo e não carregado ainda
    if (newExpanded && !gastosMap[verbaId]) {
      carregarGastos(verbaId);
    }
  };

  // Abrir modal de registro
  const handleOpenRegistrar = (verba: ObraVerba) => {
    setSelectedVerba(verba);
    setEditandoGasto(null); // Limpar edição
    setModalOpen(true);
  };

  // Abrir modal para editar gasto
  const handleEditarGasto = (gasto: GastoDelegado, verba: ObraVerba) => {
    setSelectedVerba(verba);
    setEditandoGasto(gasto);
    setModalOpen(true);
  };

  // Excluir gasto
  const handleExcluirGasto = async (gastoId: string, verbaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este gasto?')) return;
    
    setExcluindoGasto(gastoId);
    try {
      const result = await excluirGasto(gastoId);
      if (result.success) {
        await carregarGastos(verbaId);
      }
    } finally {
      setExcluindoGasto(null);
    }
  };

  // Registrar ou editar gasto
  const handleRegistrarGasto = async (data: GastoDelegadoInsert) => {
    let result;
    if (editandoGasto) {
      // Editar gasto existente
      result = await editarGasto(editandoGasto.id, data);
    } else {
      // Novo gasto
      result = await registrarGasto(data);
    }
    
    if (result.success && selectedVerba) {
      // Recarregar gastos
      await carregarGastos(selectedVerba.id);
    }
    return result;
  };

  // Fechar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditandoGasto(null);
  };

  // Finalizar prestação de contas
  const handleFinalizarPrestacao = async (verbaId: string) => {
    const gastos = gastosMap[verbaId] || [];
    if (gastos.length === 0) {
      alert('Você precisa registrar pelo menos um gasto antes de finalizar.');
      return;
    }

    if (!window.confirm('Confirma a finalização? Os gastos serão enviados para auditoria.')) return;

    setFinalizando(verbaId);
    try {
      await finalizarPrestacao(verbaId);
      await loadMinhasVerbas();
    } finally {
      setFinalizando(null);
    }
  };

  // Loading
  if (loading && verbas.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rectangular" height={250} sx={{ borderRadius: 3, mb: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'hidden', maxWidth: '100%' }}>
        {/* Header */}
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
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #2196f3, #64b5f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.5rem', sm: '2.125rem' },
              }}
            >
              👷 Minhas Obras
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Obras delegadas para você gerenciar
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadMinhasVerbas}
            size="small"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Atualizar
          </Button>
        </Box>

        {/* Error */}
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Lista de Obras */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {verbasAtivas.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Nenhuma obra delegada ainda. Aguarde o administrador enviar verbas para você.
            </Alert>
          )}
          
          {verbasAtivas.map((verba) => {
            const gastos = gastosMap[verba.id] || [];
            const resumo = resumosMap[verba.id];
            const isExpanded = expandedCards[verba.id];
            const isLoadingGastos = loadingGastos[verba.id];

            // Calcular progresso (gastos/verba)
            const progressPercent = resumo
              ? Math.min((resumo.gastoAcumulado / resumo.valorEnviado) * 100, 100)
              : 0;

            return (
              <motion.div
                key={verba.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    bgcolor: 'rgba(30, 30, 30, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  {/* Header do Card */}
                  <Box
                    sx={{
                      p: { xs: 1.5, sm: 2.5 },
                      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: 1 }}>
                          <Avatar
                            sx={{
                              width: { xs: 36, sm: 44 },
                              height: { xs: 36, sm: 44 },
                              bgcolor: 'rgba(33, 150, 243, 0.2)',
                              flexShrink: 0,
                            }}
                          >
                            <ConstructionIcon sx={{ color: '#2196f3', fontSize: { xs: 20, sm: 24 } }} />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f5f5f5', fontSize: { xs: '0.95rem', sm: '1.25rem' } }} noWrap>
                              {verba.obra?.nome || 'Obra'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                              Status: {verba.obra?.status || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Chip
                        label={verba.status === 'ativa' ? 'Ativa' : 'Prestação Pendente'}
                        size="small"
                        sx={{
                          bgcolor: verba.status === 'ativa' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(33, 150, 243, 0.15)',
                          color: verba.status === 'ativa' ? '#4caf50' : '#2196f3',
                          fontWeight: 600,
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          flexShrink: 0,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Card de Verba - DESTAQUE */}
                  <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        background: 'linear-gradient(135deg, rgba(0, 146, 70, 0.12) 0%, rgba(0, 100, 50, 0.08) 100%)',
                        border: '1px solid rgba(0, 146, 70, 0.25)',
                        borderRadius: 3,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: { xs: 1.5, sm: 2 }, textTransform: 'uppercase', letterSpacing: 1, fontSize: { xs: '0.65rem', sm: '0.875rem' } }}
                      >
                        💰 Controle de Verba
                      </Typography>

                      <Grid container spacing={{ xs: 1, sm: 2 }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                              Valor Enviado
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#009246', fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                              {formatCurrency(verba.valor_delegado)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                              Gasto Acumulado
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#ce2b37', fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                              {formatCurrency(resumo?.gastoAcumulado || 0)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 4 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                              Saldo Disponível
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                color: (resumo?.saldoDisponivel || verba.valor_delegado) >= 0 ? '#2196f3' : '#f44336',
                                fontWeight: 800,
                                fontSize: { xs: '0.95rem', sm: '1.25rem' },
                              }}
                            >
                              {formatCurrency(resumo?.saldoDisponivel ?? verba.valor_delegado)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Barra de Progresso */}
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            Utilização da verba
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            {progressPercent.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progressPercent}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor:
                                progressPercent < 70 ? '#009246' : progressPercent < 90 ? '#ff9800' : '#ce2b37',
                            },
                          }}
                        />
                      </Box>
                    </Paper>

                    {/* Ações */}
                    <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                      {verba.status !== 'prestacao_pendente' && verba.status !== 'finalizada' && verba.status !== 'cancelada' && (
                        <Button
                          variant="contained"
                          startIcon={<ReceiptIcon />}
                          onClick={() => handleOpenRegistrar(verba)}
                          size="small"
                          sx={{
                            flex: 1,
                            bgcolor: '#ce2b37',
                            '&:hover': { bgcolor: '#b02430' },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            py: { xs: 1, sm: 0.75 },
                          }}
                        >
                          Registrar Gasto
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={finalizando === verba.id ? null : <SendIcon />}
                        onClick={() => handleFinalizarPrestacao(verba.id)}
                        disabled={verba.status === 'finalizada' || verba.status === 'cancelada' || finalizando === verba.id}
                        size="small"
                        sx={{
                          flex: 1,
                          borderColor: '#2196f3',
                          color: '#2196f3',
                          '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.1)' },
                          fontSize: { xs: '0.7rem', sm: '0.875rem' },
                          py: { xs: 1, sm: 0.75 },
                        }}
                      >
                        {finalizando === verba.id ? 'Finalizando...' : 'Finalizar e Prestar Contas'}
                      </Button>
                    </Box>

                    {/* Expandir gastos */}
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        size="small"
                        onClick={() => toggleExpand(verba.id)}
                        endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      >
                        {isExpanded ? 'Ocultar Gastos' : `Ver Gastos (${resumo?.totalGastos || 0})`}
                      </Button>
                    </Box>

                    {/* Lista de Gastos (colapsável) */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2 }}>
                        {isLoadingGastos ? (
                          <Box sx={{ py: 2, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                              Carregando gastos...
                            </Typography>
                          </Box>
                        ) : gastos.length === 0 ? (
                          <Box sx={{ py: 3, textAlign: 'center' }}>
                            <ReceiptIcon sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.2)', mb: 1 }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                              Nenhum gasto registrado ainda
                            </Typography>
                          </Box>
                        ) : (
                          <List sx={{ p: 0 }}>
                            {gastos.map((gasto, idx) => (
                              <Box key={gasto.id}>
                                {idx > 0 && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />}
                                <ListItem
                                  sx={{
                                    px: 0,
                                    py: 1.5,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                  }}
                                >
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <ScheduleIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#f5f5f5' }} noWrap>
                                        {gasto.descricao}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                      <Chip
                                        label={gasto.categoria}
                                        size="small"
                                        sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(255, 255, 255, 0.08)' }}
                                      />
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                                        {gasto.data_registro 
                                          ? `${gasto.data_registro.split('-').reverse().join('/')}` 
                                          : format(parseISO(gasto.created_at), 'dd/MM/yyyy')}
                                        {gasto.hora_registro && ` às ${gasto.hora_registro}`}
                                      </Typography>
                                      {gasto.registrado_por_nome && (
                                        <Typography variant="caption" sx={{ color: 'rgba(33, 150, 243, 0.8)' }}>
                                          • {gasto.registrado_por_nome}
                                        </Typography>
                                      )}
                                      {gasto.comprovante_url && (
                                        <Tooltip title="Ver comprovante">
                                          <IconButton
                                            size="small"
                                            onClick={() => window.open(gasto.comprovante_url, '_blank')}
                                            sx={{ p: 0.25, color: '#2196f3' }}
                                          >
                                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 700,
                                        color: '#ce2b37',
                                        mr: 1,
                                      }}
                                    >
                                      {formatCurrency(gasto.valor)}
                                    </Typography>
                                    {verba.status !== 'finalizada' && verba.status !== 'prestacao_pendente' && verba.status !== 'cancelada' && (
                                      <>
                                        <Tooltip title="Editar">
                                          <IconButton
                                            size="small"
                                            onClick={() => handleEditarGasto(gasto, verba)}
                                            sx={{ p: 0.25, color: '#ff9800' }}
                                          >
                                            <EditIcon sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                          <IconButton
                                            size="small"
                                            onClick={() => handleExcluirGasto(gasto.id, verba.id)}
                                            disabled={excluindoGasto === gasto.id}
                                            sx={{ p: 0.25, color: '#f44336' }}
                                          >
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                  </Box>
                                </ListItem>
                              </Box>
                            ))}
                          </List>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                </Card>
              </motion.div>
            );
          })}
        </Box>

        {/* Empty State */}
        {verbas.length === 0 && !loading && (
          <Box
            sx={{
              py: 8,
              textAlign: 'center',
            }}
          >
            <ConstructionIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              Nenhuma obra delegada para você
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)', mt: 1 }}>
              Aguarde a delegação do administrador
            </Typography>
          </Box>
        )}

        {/* Modal de Registro de Gasto */}
        {selectedVerba && (
          <RegistrarGastoModal
            open={modalOpen}
            onClose={handleCloseModal}
            onSave={handleRegistrarGasto}
            verbaId={selectedVerba.id}
            saldoDisponivel={resumosMap[selectedVerba.id]?.saldoDisponivel ?? selectedVerba.valor_delegado}
            gastoParaEditar={editandoGasto}
          />
        )}
      </Box>
    </motion.div>
  );
};

export default MinhasObras;
