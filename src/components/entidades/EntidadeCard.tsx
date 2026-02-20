import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Box,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { WhatsApp as WhatsAppIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  Entity,
  EntityType,
  ENTITY_TYPE_CONFIG,
  formatPhone,
  getWhatsAppLink,
  getInitials,
} from '../../types/entidades';

// Cores específicas para borda lateral por tipo
const BORDER_COLORS: Record<EntityType, string> = {
  cliente: '#2196f3',      // Azul
  funcionario: '#009246',  // Verde
  fornecedor: '#ff9800',   // Laranja
  parceiro: '#FFD700',     // Dourado
  socio: '#ce2b37',        // Vermelho
};

interface EntidadeCardProps {
  entidade: Entity;
  onWhatsApp?: (phone: string) => void;
  onDelete?: (entidade: Entity) => void;
}

const MotionPaper = motion.create(Paper);

const EntidadeCard = ({ entidade, onWhatsApp, onDelete }: EntidadeCardProps) => {
  const navigate = useNavigate();
  const typeConfig = ENTITY_TYPE_CONFIG[entidade.tipo];
  const borderColor = BORDER_COLORS[entidade.tipo];
  const whatsAppLink = getWhatsAppLink(entidade.telefone);

  const handleCardClick = useCallback(() => {
    navigate(`/entidades/${entidade.id}`);
  }, [navigate, entidade.id]);

  const handleWhatsAppClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Não propaga para o card
      if (whatsAppLink) {
        window.open(whatsAppLink, '_blank');
      }
      if (onWhatsApp && entidade.telefone) {
        onWhatsApp(entidade.telefone);
      }
    },
    [whatsAppLink, onWhatsApp, entidade.telefone]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(entidade);
    },
    [onDelete, entidade]
  );

  return (
    <MotionPaper
      elevation={1}
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      sx={{
        p: 2,
        cursor: 'pointer',
        borderRadius: 3,
        borderLeft: `4px solid ${borderColor}`,
        background: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderLeftColor: borderColor,
        borderLeftWidth: 4,
        borderLeftStyle: 'solid',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          background: 'rgba(40, 40, 40, 0.7)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderLeftColor: borderColor,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Avatar à esquerda */}
        <Avatar
          sx={{
            width: 56,
            height: 56,
            backgroundColor: typeConfig.bgColor,
            color: typeConfig.textColor,
            fontSize: '1.2rem',
            fontWeight: 700,
            flexShrink: 0,
            border: `2px solid ${borderColor}`,
          }}
        >
          {getInitials(entidade.nome)}
        </Avatar>

        {/* Conteúdo central */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Nome truncado */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#f5f5f5',
              fontSize: '1rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              mb: 0.5,
            }}
          >
            {entidade.nome}
          </Typography>

          {/* Chip de tipo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Chip
              label={typeConfig.label}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.textColor,
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          </Box>

          {/* Telefone */}
          {entidade.telefone && (
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.8rem',
              }}
            >
              {formatPhone(entidade.telefone)}
            </Typography>
          )}

          {/* Email (se não tiver telefone) */}
          {!entidade.telefone && entidade.email && (
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.8rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {entidade.email}
            </Typography>
          )}
        </Box>

        {/* Ações à direita */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {whatsAppLink && (
            <Tooltip title="Abrir WhatsApp" arrow>
              <IconButton
                onClick={handleWhatsAppClick}
                sx={{
                  width: 44,
                  height: 44,
                  backgroundColor: 'rgba(37, 211, 102, 0.1)',
                  color: '#25D366',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#25D366',
                    color: '#fff',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <WhatsAppIcon />
              </IconButton>
            </Tooltip>
          )}

          {onDelete && (
            <Tooltip title="Apagar" arrow>
              <IconButton
                onClick={handleDeleteClick}
                sx={{
                  width: 44,
                  height: 44,
                  backgroundColor: 'rgba(206, 43, 55, 0.12)',
                  color: '#ce2b37',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#ce2b37',
                    color: '#fff',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </MotionPaper>
  );
};

export default EntidadeCard;
