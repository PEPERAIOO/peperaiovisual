import { Box, Typography, Paper, Chip, IconButton, Checkbox } from '@mui/material';
import {
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Construction as ConstructionIcon,
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Compromisso,
  COMPROMISSO_TIPO_CONFIG,
  COMPROMISSO_PRIORIDADE_CONFIG,
  formatTime,
} from '../../types/compromissos';

interface CompromissosDiaProps {
  data: Date | null;
  compromissos: Compromisso[];
  onToggleConcluido: (id: string, concluido: boolean) => void;
  onEdit?: (compromisso: Compromisso) => void;
  onDelete: (id: string) => void;
}

const CompromissosDia = ({
  data,
  compromissos,
  onToggleConcluido,
  onDelete,
}: CompromissosDiaProps) => {
  if (!data) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          background: 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          Selecione um dia no calendário para ver os compromissos
        </Typography>
      </Paper>
    );
  }

  // Determinar label do dia
  const getLabelDia = () => {
    if (isToday(data)) return 'Hoje';
    if (isTomorrow(data)) return 'Amanhã';
    return format(data, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  return (
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
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: '#f5f5f5',
            textTransform: 'capitalize',
          }}
        >
          📅 {getLabelDia()}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          {compromissos.length} compromisso{compromissos.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Lista de compromissos */}
      <Box sx={{ p: 2 }}>
        {compromissos.length === 0 ? (
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              Nenhum compromisso neste dia
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {compromissos.map((compromisso) => {
              const tipoConfig = COMPROMISSO_TIPO_CONFIG[compromisso.tipo];
              const prioridadeConfig = COMPROMISSO_PRIORIDADE_CONFIG[compromisso.prioridade];
              const isAtrasado = isPast(new Date(compromisso.data_inicio)) && !compromisso.concluido;

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
                    opacity: compromisso.concluido ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    {/* Checkbox de conclusão */}
                    <Checkbox
                      checked={compromisso.concluido}
                      onChange={() => onToggleConcluido(compromisso.id, !compromisso.concluido)}
                      size="small"
                      sx={{
                        mt: -0.5,
                        color: tipoConfig.color,
                        '&.Mui-checked': { color: '#009246' },
                      }}
                    />

                    {/* Conteúdo */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Título e ações */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
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
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (window.confirm('Excluir este compromisso?')) {
                              onDelete(compromisso.id);
                            }
                          }}
                          sx={{ color: 'rgba(255, 255, 255, 0.3)', p: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Descrição */}
                      {compromisso.descricao && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            display: 'block',
                            mt: 0.5,
                          }}
                        >
                          {compromisso.descricao}
                        </Typography>
                      )}

                      {/* Meta info */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                        {/* Horário */}
                        <Chip
                          icon={<TimeIcon sx={{ fontSize: 14 }} />}
                          label={formatTime(compromisso.data_inicio)}
                          size="small"
                          sx={{
                            height: 22,
                            bgcolor: isAtrasado ? 'rgba(244, 67, 54, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                            color: isAtrasado ? '#f44336' : 'rgba(255, 255, 255, 0.7)',
                            '& .MuiChip-icon': { color: 'inherit' },
                            fontSize: '0.7rem',
                          }}
                        />

                        {/* Prioridade */}
                        <Chip
                          label={prioridadeConfig.label}
                          size="small"
                          sx={{
                            height: 22,
                            bgcolor: prioridadeConfig.bgColor,
                            color: prioridadeConfig.color,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        />

                        {/* Obra vinculada */}
                        {compromisso.obra && (
                          <Chip
                            icon={<ConstructionIcon sx={{ fontSize: 14 }} />}
                            label={compromisso.obra.nome}
                            size="small"
                            sx={{
                              height: 22,
                              bgcolor: 'rgba(0, 146, 70, 0.15)',
                              color: '#009246',
                              '& .MuiChip-icon': { color: '#009246' },
                              fontSize: '0.7rem',
                              maxWidth: 150,
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              },
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default CompromissosDia;
