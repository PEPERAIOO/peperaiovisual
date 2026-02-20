import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Today as TodayIcon,
  CalendarViewMonth as CalendarIcon,
  List as ListIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format, isToday, isThisWeek, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCompromissos } from '../hooks/useCompromissos';
import { CalendarioGrid, CompromissoModal, CompromissosDia } from '../components/calendario';
import { CompromissoInsert, COMPROMISSO_TIPO_CONFIG, COMPROMISSO_PRIORIDADE_CONFIG, formatTime } from '../types/compromissos';

type ViewMode = 'calendar' | 'list';

const Calendario = () => {
  const {
    compromissos,
    obras,
    mesAtual,
    reload,
    addCompromisso,
    toggleConcluido,
    deleteCompromisso,
    getCompromissosDia,
    proximoMes,
    mesAnterior,
    irParaHoje,
  } = useCompromissos();

  const [modalOpen, setModalOpen] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  // Carregar compromissos
  useEffect(() => {
    reload();
  }, [reload]);

  // Compromissos do dia selecionado
  const compromissosDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    return getCompromissosDia(diaSelecionado);
  }, [diaSelecionado, getCompromissosDia]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      hoje: compromissos.filter((c) => isToday(new Date(c.data_inicio)) && !c.concluido).length,
      semana: compromissos.filter((c) => isThisWeek(new Date(c.data_inicio), { locale: ptBR }) && !c.concluido).length,
      atrasados: compromissos.filter((c) => isPast(new Date(c.data_inicio)) && !isToday(new Date(c.data_inicio)) && !c.concluido).length,
      concluidos: compromissos.filter((c) => c.concluido).length,
    };
  }, [compromissos]);

  // Handlers
  const handleSaveCompromisso = async (data: CompromissoInsert) => {
    const result = await addCompromisso(data);
    setModalOpen(false);
    return result;
  };

  const handleDiaSelecionado = (dia: Date) => {
    setDiaSelecionado(dia);
  };

  // Lista de compromissos para modo lista
  const compromissosOrdenados = useMemo(() => {
    return [...compromissos].sort((a, b) => {
      // Não concluídos primeiro
      if (a.concluido !== b.concluido) return a.concluido ? 1 : -1;
      // Por data
      return new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime();
    });
  }, [compromissos]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 4,
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #009246, #00b359)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
              }}
            >
              📅 Calendário
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Gerencie seus compromissos e agenda
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {/* Toggle view mode */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                '& .MuiToggleButton-root': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  border: 'none',
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(0, 146, 70, 0.2)',
                    color: '#009246',
                  },
                },
              }}
            >
              <ToggleButton value="calendar">
                <CalendarIcon sx={{ mr: 0.5, fontSize: 18 }} /> Calendário
              </ToggleButton>
              <ToggleButton value="list">
                <ListIcon sx={{ mr: 0.5, fontSize: 18 }} /> Lista
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #009246, #00b359)',
                color: '#fff',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                boxShadow: '0 4px 14px 0 rgba(0, 146, 70, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00b359, #009246)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px 0 rgba(0, 146, 70, 0.4)',
                },
              }}
            >
              Novo Compromisso
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 4,
          }}
        >
          {[
            { label: 'Hoje', value: stats.hoje, color: '#009246', icon: '📌' },
            { label: 'Esta Semana', value: stats.semana, color: '#2196f3', icon: '📆' },
            { label: 'Atrasados', value: stats.atrasados, color: '#f44336', icon: '⚠️' },
            { label: 'Concluídos', value: stats.concluidos, color: '#4caf50', icon: '✅' },
          ].map((stat, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: 2,
                background: 'rgba(30, 30, 30, 0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 3,
              }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {stat.icon} {stat.label}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: stat.value > 0 ? stat.color : 'rgba(255, 255, 255, 0.3)',
                }}
              >
                {stat.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Content */}
        {viewMode === 'calendar' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
              gap: 3,
            }}
          >
            {/* Calendário Grid */}
            <Box>
              {/* Navegação do mês */}
              <Paper
                elevation={0}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  mb: 2,
                  background: 'rgba(30, 30, 30, 0.6)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 3,
                }}
              >
                <IconButton onClick={mesAnterior} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <ChevronLeftIcon />
                </IconButton>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#f5f5f5',
                      textTransform: 'capitalize',
                    }}
                  >
                    {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Ir para hoje">
                    <IconButton onClick={irParaHoje} sx={{ color: '#009246' }}>
                      <TodayIcon />
                    </IconButton>
                  </Tooltip>
                  <IconButton onClick={proximoMes} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              </Paper>

              <CalendarioGrid
                mesAtual={mesAtual}
                compromissos={compromissos}
                diaSelecionado={diaSelecionado}
                onSelectDia={handleDiaSelecionado}
                onProximoMes={proximoMes}
                onMesAnterior={mesAnterior}
                onHoje={irParaHoje}
              />
            </Box>

            {/* Lista do dia selecionado */}
            <Box>
              <CompromissosDia
                data={diaSelecionado}
                compromissos={compromissosDoDia}
                onToggleConcluido={toggleConcluido}
                onDelete={deleteCompromisso}
              />
            </Box>
          </Box>
        ) : (
          /* Modo Lista */
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
            {/* Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f5f5f5' }}>
                📋 Todos os Compromissos do Mês
              </Typography>
              <Tooltip title="Atualizar">
                <IconButton onClick={reload} sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Lista */}
            <Box sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
              {compromissosOrdenados.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                    Nenhum compromisso neste mês
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {compromissosOrdenados.map((compromisso) => {
                    const tipoConfig = COMPROMISSO_TIPO_CONFIG[compromisso.tipo];
                    const prioridadeConfig = COMPROMISSO_PRIORIDADE_CONFIG[compromisso.prioridade];
                    const dataCompromisso = new Date(compromisso.data_inicio);
                    const isAtrasado = isPast(dataCompromisso) && !isToday(dataCompromisso) && !compromisso.concluido;

                    return (
                      <Box
                        key={compromisso.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: compromisso.concluido
                            ? 'rgba(255, 255, 255, 0.02)'
                            : tipoConfig.bgColor,
                          border: `1px solid ${compromisso.concluido ? 'rgba(255, 255, 255, 0.06)' : tipoConfig.color}30`,
                          opacity: compromisso.concluido ? 0.5 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        {/* Data */}
                        <Box
                          sx={{
                            minWidth: 70,
                            textAlign: 'center',
                            p: 1,
                            borderRadius: 2,
                            bgcolor: isAtrasado ? 'rgba(244, 67, 54, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              color: isAtrasado ? '#f44336' : '#f5f5f5',
                              lineHeight: 1,
                            }}
                          >
                            {format(dataCompromisso, 'dd')}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isAtrasado ? '#f44336' : 'rgba(255, 255, 255, 0.5)',
                              textTransform: 'uppercase',
                              fontSize: '0.65rem',
                            }}
                          >
                            {format(dataCompromisso, 'MMM', { locale: ptBR })}
                          </Typography>
                        </Box>

                        {/* Conteúdo */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: compromisso.concluido ? 'rgba(255, 255, 255, 0.5)' : '#f5f5f5',
                              textDecoration: compromisso.concluido ? 'line-through' : 'none',
                            }}
                          >
                            {tipoConfig.icon} {compromisso.titulo}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            {formatTime(compromisso.data_inicio)}
                            {compromisso.obra && ` • ${compromisso.obra.nome}`}
                          </Typography>
                        </Box>

                        {/* Status */}
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: prioridadeConfig.color,
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* Modal de Novo Compromisso */}
        <CompromissoModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveCompromisso}
          obras={obras}
        />
      </Box>
    </motion.div>
  );
};

export default Calendario;
