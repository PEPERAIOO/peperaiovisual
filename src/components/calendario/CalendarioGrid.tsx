import { useMemo } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Compromisso, COMPROMISSO_TIPO_CONFIG } from '../../types/compromissos';

interface CalendarioGridProps {
  mesAtual: Date;
  compromissos: Compromisso[];
  diaSelecionado: Date | null;
  onSelectDia: (data: Date) => void;
  onProximoMes: () => void;
  onMesAnterior: () => void;
  onHoje: () => void;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CalendarioGrid = ({
  mesAtual,
  compromissos,
  diaSelecionado,
  onSelectDia,
  onProximoMes,
  onMesAnterior,
  onHoje,
}: CalendarioGridProps) => {
  // Gerar dias do calendário
  const diasCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesAtual);
    const fimMes = endOfMonth(mesAtual);
    const inicioCalendario = startOfWeek(inicioMes);
    const fimCalendario = endOfWeek(fimMes);

    const dias: Date[] = [];
    let diaAtual = inicioCalendario;

    while (diaAtual <= fimCalendario) {
      dias.push(diaAtual);
      diaAtual = addDays(diaAtual, 1);
    }

    return dias;
  }, [mesAtual]);

  // Mapear compromissos por dia
  const compromissosPorDia = useMemo(() => {
    const map = new Map<string, Compromisso[]>();
    compromissos.forEach((c) => {
      const key = format(new Date(c.data_inicio), 'yyyy-MM-dd');
      const existing = map.get(key) || [];
      existing.push(c);
      map.set(key, existing);
    });
    return map;
  }, [compromissos]);

  return (
    <Box
      sx={{
        background: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {/* Header do Calendário */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={onMesAnterior}
            size="small"
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={onProximoMes}
            size="small"
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#f5f5f5',
            textTransform: 'capitalize',
          }}
        >
          {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
        </Typography>

        <Tooltip title="Ir para hoje">
          <IconButton
            onClick={onHoje}
            size="small"
            sx={{
              color: '#009246',
              bgcolor: 'rgba(0, 146, 70, 0.1)',
              '&:hover': { bgcolor: 'rgba(0, 146, 70, 0.2)' },
            }}
          >
            <TodayIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Cabeçalho dos dias da semana */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        {DIAS_SEMANA.map((dia) => (
          <Box
            key={dia}
            sx={{
              py: 1.5,
              textAlign: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: '0.7rem',
              }}
            >
              {dia}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Grid de dias */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
        }}
      >
        {diasCalendario.map((dia, index) => {
          const keyDia = format(dia, 'yyyy-MM-dd');
          const compromissosDia = compromissosPorDia.get(keyDia) || [];
          const isMesAtual = isSameMonth(dia, mesAtual);
          const isHoje = isToday(dia);
          const isSelecionado = diaSelecionado && isSameDay(dia, diaSelecionado);

          return (
            <Box
              key={index}
              onClick={() => onSelectDia(dia)}
              sx={{
                minHeight: { xs: 60, sm: 80, md: 100 },
                p: 0.5,
                borderRight: (index + 1) % 7 !== 0 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                bgcolor: isSelecionado
                  ? 'rgba(0, 146, 70, 0.15)'
                  : isHoje
                  ? 'rgba(33, 150, 243, 0.08)'
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: isSelecionado
                    ? 'rgba(0, 146, 70, 0.2)'
                    : 'rgba(255, 255, 255, 0.03)',
                },
              }}
            >
              {/* Número do dia */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontWeight: isHoje || isSelecionado ? 700 : 400,
                    color: !isMesAtual
                      ? 'rgba(255, 255, 255, 0.25)'
                      : isHoje
                      ? '#2196f3'
                      : isSelecionado
                      ? '#009246'
                      : '#f5f5f5',
                    bgcolor: isHoje
                      ? 'rgba(33, 150, 243, 0.2)'
                      : isSelecionado
                      ? 'rgba(0, 146, 70, 0.2)'
                      : 'transparent',
                    fontSize: '0.85rem',
                  }}
                >
                  {format(dia, 'd')}
                </Typography>
              </Box>

              {/* Indicadores de compromissos */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                  px: 0.25,
                }}
              >
                {compromissosDia.slice(0, 3).map((c) => {
                  const tipoConfig = COMPROMISSO_TIPO_CONFIG[c.tipo];
                  return (
                    <Box
                      key={c.id}
                      sx={{
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        bgcolor: tipoConfig.bgColor,
                        borderLeft: `2px solid ${tipoConfig.color}`,
                        overflow: 'hidden',
                        display: { xs: 'none', sm: 'block' },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          color: tipoConfig.color,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                        }}
                      >
                        {c.titulo}
                      </Typography>
                    </Box>
                  );
                })}

                {/* Indicador mobile - apenas pontos coloridos */}
                <Box
                  sx={{
                    display: { xs: 'flex', sm: 'none' },
                    gap: 0.25,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {compromissosDia.slice(0, 4).map((c) => {
                    const tipoConfig = COMPROMISSO_TIPO_CONFIG[c.tipo];
                    return (
                      <Box
                        key={c.id}
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: tipoConfig.color,
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Indicador de mais compromissos */}
                {compromissosDia.length > 3 && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'center',
                      display: { xs: 'none', sm: 'block' },
                    }}
                  >
                    +{compromissosDia.length - 3} mais
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default CalendarioGrid;
