import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthOption } from '../../types/financeiro';

interface MonthSelectorProps {
  open: boolean;
  onClose: () => void;
  availableMonths: MonthOption[];
  selectedDate: Date;
  onSelectMonth: (year: number, month: number) => void;
}

const MonthSelector = ({
  open,
  onClose,
  availableMonths,
  selectedDate,
  onSelectMonth,
}: MonthSelectorProps) => {
  const currentMonthKey = format(selectedDate, 'yyyy-MM');

  const handleSelect = (year: number, month: number) => {
    onSelectMonth(year, month);
    onClose();
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    onSelectMonth(now.getFullYear(), now.getMonth());
    onClose();
  };

  // Agrupar meses por ano
  const monthsByYear = availableMonths.reduce((acc, month) => {
    if (!acc[month.year]) {
      acc[month.year] = [];
    }
    acc[month.year].push(month);
    return acc;
  }, {} as Record<number, MonthOption[]>);

  const years = Object.keys(monthsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(30, 30, 30, 0.98)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
            📅 Selecionar Mês
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Botão para mês atual */}
        <Button
          fullWidth
          variant="outlined"
          onClick={goToCurrentMonth}
          sx={{
            mb: 3,
            py: 1.5,
            borderColor: '#009246',
            color: '#009246',
            '&:hover': {
              borderColor: '#00a850',
              backgroundColor: 'rgba(0, 146, 70, 0.1)',
            },
          }}
        >
          📆 Ir para o Mês Atual
        </Button>

        {/* Meses arquivados por ano */}
        {years.length > 0 ? (
          years.map((year) => (
            <Box key={year} sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  mb: 1.5,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontSize: '0.7rem',
                }}
              >
                {year}
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 1.5,
                }}
              >
                {monthsByYear[year].map((monthOption) => {
                  const monthKey = `${monthOption.year}-${String(monthOption.month + 1).padStart(2, '0')}`;
                  const isSelected = monthKey === currentMonthKey;
                  const monthName = format(new Date(monthOption.year, monthOption.month, 1), 'MMMM', {
                    locale: ptBR,
                  });

                  return (
                    <Box
                      key={monthKey}
                      onClick={() => handleSelect(monthOption.year, monthOption.month)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? 'rgba(0, 146, 70, 0.15)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '2px solid #009246'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: isSelected
                            ? 'rgba(0, 146, 70, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {isSelected ? (
                          <FolderOpenIcon sx={{ color: '#009246', fontSize: 20 }} />
                        ) : (
                          <FolderIcon sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 20 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: isSelected ? '#009246' : '#f5f5f5',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {monthName}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${monthOption.transactionCount} transações`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)', mb: 1 }}>
              Nenhum mês com transações arquivadas
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              As transações aparecerão aqui organizadas por mês
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MonthSelector;
