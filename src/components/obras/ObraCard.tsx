import {
  Card,
  CardContent,
  CardActionArea,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useState, MouseEvent } from 'react';
import {
  Obra,
  OBRA_STATUS_CONFIG,
  calcularProgressoFinanceiro,
  isAtrasado,
  formatCurrency,
  formatDate,
} from '../../types/obras';

interface ObraCardProps {
  obra: Obra;
  onClick: () => void;
  onFinalizarObra?: (obraId: string) => void;
  onEditarObra?: (obra: Obra) => void;
  onIniciarObra?: (obra: Obra) => void;
  onDeleteObra?: (obra: Obra) => void;
}

const ObraCard = ({ obra, onClick, onFinalizarObra, onEditarObra, onIniciarObra, onDeleteObra }: ObraCardProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: MouseEvent) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const handleFinalizar = (event: MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    if (onFinalizarObra) {
      onFinalizarObra(obra.id);
    }
  };

  const handleEditar = (event: MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    if (onEditarObra) {
      onEditarObra(obra);
    }
  };

  const handleIniciar = (event: MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    if (onIniciarObra) {
      onIniciarObra(obra);
    }
  };

  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    if (onDeleteObra) {
      onDeleteObra(obra);
    }
  };

  const statusConfig = OBRA_STATUS_CONFIG[obra.status];
  const valorGasto: number = obra.valor_gasto ?? 0;
  const progresso = calcularProgressoFinanceiro(valorGasto, obra.valor_total_orcamento);
  const atrasado = isAtrasado(obra.data_previsao, obra.status);
  const estouro = progresso > 100;

  return (
    <Card
      sx={{
        background: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 3,
        transition: 'all 0.2s ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      {/* Botão de Menu - Fora do CardActionArea */}
      {(onFinalizarObra || onEditarObra || onIniciarObra || onDeleteObra) && (
        <IconButton
          size="small"
          onClick={handleMenuClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            color: 'rgba(255, 255, 255, 0.6)',
            bgcolor: 'rgba(0, 0, 0, 0.3)',
            '&:hover': { 
              color: '#2196f3', 
              bgcolor: 'rgba(33, 150, 243, 0.2)' 
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )}

      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => handleMenuClose()}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          },
        }}
      >
        {onEditarObra && (
          <MenuItem onClick={handleEditar}>
            <ListItemIcon>
              <EditIcon fontSize="small" sx={{ color: '#2196f3' }} />
            </ListItemIcon>
            <ListItemText primary="Editar Obra" />
          </MenuItem>
        )}
        {obra.status === 'aprovada' && onIniciarObra && (
          <MenuItem onClick={handleIniciar}>
            <ListItemIcon>
              <PlayArrowIcon fontSize="small" sx={{ color: '#4caf50' }} />
            </ListItemIcon>
            <ListItemText primary="Iniciar Obra" />
          </MenuItem>
        )}
        {obra.status === 'em_andamento' && onFinalizarObra && (
          <MenuItem onClick={handleFinalizar}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" sx={{ color: '#4caf50' }} />
            </ListItemIcon>
            <ListItemText primary="Finalizar Obra" />
          </MenuItem>
        )}
        {onDeleteObra && (
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: '#ef5350' }} />
            </ListItemIcon>
            <ListItemText primary="Excluir Obra" />
          </MenuItem>
        )}
      </Menu>

      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header: Nome + Status */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#f5f5f5',
                fontSize: '1.1rem',
                lineHeight: 1.3,
                flex: 1,
              }}
            >
              {obra.nome}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                label={statusConfig.label}
                size="small"
                sx={{
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.textColor,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                }}
              />
            </Box>
          </Box>

          {/* Cliente */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PersonIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              {obra.cliente?.nome || 'Cliente não definido'}
            </Typography>
          </Box>

          {/* Barra de Progresso Financeiro */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                Progresso Financeiro
              </Typography>
              <Tooltip
                title={estouro ? 'Orçamento estourado!' : `${progresso}% do orçamento utilizado`}
                arrow
              >
                <Typography
                  sx={{
                    color: estouro ? '#ce2b37' : progresso > 80 ? '#ff9800' : '#009246',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {estouro && <WarningIcon sx={{ fontSize: 14 }} />}
                  {progresso}%
                </Typography>
              </Tooltip>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(progresso, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: estouro
                    ? 'linear-gradient(90deg, #ce2b37 0%, #ff5252 100%)'
                    : progresso > 80
                      ? 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)'
                      : 'linear-gradient(90deg, #009246 0%, #00c853 100%)',
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, gap: 1 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', wordBreak: 'break-word' }}>
                {formatCurrency(valorGasto)}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', wordBreak: 'break-word' }}>
                {formatCurrency(obra.valor_total_orcamento)}
              </Typography>
            </Box>
          </Box>

          {/* Data de Entrega */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 'auto',
              pt: 1,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <CalendarIcon
              sx={{
                fontSize: 16,
                color: atrasado ? '#ce2b37' : 'rgba(255,255,255,0.4)',
              }}
            />
            <Typography
              sx={{
                color: atrasado ? '#ce2b37' : 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                fontWeight: atrasado ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {obra.data_conclusao ? (
                <>Concluída em {formatDate(obra.data_conclusao)}</>
              ) : obra.data_previsao ? (
                <>
                  Previsão: {formatDate(obra.data_previsao)}
                  {atrasado && (
                    <Chip
                      label="Atrasada"
                      size="small"
                      sx={{
                        ml: 1,
                        height: 18,
                        fontSize: '0.65rem',
                        backgroundColor: 'rgba(206, 43, 55, 0.2)',
                        color: '#ce2b37',
                      }}
                    />
                  )}
                </>
              ) : (
                'Data não definida'
              )}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ObraCard;
