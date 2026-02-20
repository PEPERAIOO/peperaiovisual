import { useCallback } from 'react';
import {
  Card,
  CardContent,

  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import {
  Proposta,
  PROPOSTA_STATUS_CONFIG,
  formatCurrency,
  formatDate,
  formatNumeroProposta,
} from '../../types/propostas';

interface PropostaCardProps {
  proposta: Proposta;
  onEdit: (proposta: Proposta) => void;
  onGeneratePdf: (proposta: Proposta) => void;
  onDelete: (proposta: Proposta) => void;
  onApprove?: (proposta: Proposta) => void;
  onReject?: (proposta: Proposta) => void;
  onClick?: (proposta: Proposta) => void;
}

const MotionCard = motion.create(Card);

const PropostaCard = ({ proposta, onEdit, onGeneratePdf, onDelete, onApprove, onReject, onClick }: PropostaCardProps) => {
  const statusConfig = PROPOSTA_STATUS_CONFIG[proposta.status];

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(proposta);
    },
    [onEdit, proposta]
  );

  const handlePdf = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onGeneratePdf(proposta);
    },
    [onGeneratePdf, proposta]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(proposta);
    },
    [onDelete, proposta]
  );

  const handleApprove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onApprove?.(proposta);
    },
    [onApprove, proposta]
  );

  const handleReject = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onReject?.(proposta);
    },
    [onReject, proposta]
  );

  const handleClick = useCallback(() => {
    onClick?.(proposta);
  }, [onClick, proposta]);

  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        overflow: 'hidden',
        position: 'relative',
        '&:hover': {
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      {/* Barra de status no topo */}
      <Box
        sx={{
          height: 4,
          background: statusConfig.textColor,
        }}
      />

      <CardContent sx={{ p: 2.5, height: 'calc(100% - 4px)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={handleClick}>
          {/* Header: Número + Status + Ações */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#f5f5f5',
                  fontSize: '1rem',
                  fontFamily: 'monospace',
                }}
              >
                {formatNumeroProposta(proposta.numero_sequencial, proposta.numero_revisao)}
              </Typography>
              <Chip
                label={statusConfig.label}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.textColor,
                }}
              />
            </Box>

            {/* Botões de ação */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {proposta.status !== 'aprovada' && (
                <Tooltip title="Aprovar e criar obra">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleApprove(e); }}
                    sx={{
                      color: 'rgba(0, 146, 70, 0.7)',
                      '&:hover': { color: '#009246', bgcolor: 'rgba(0, 146, 70, 0.12)' },
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {proposta.status !== 'aprovada' && proposta.status !== 'rejeitada' && (
                <Tooltip title="Cancelar proposta">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleReject(e); }}
                    sx={{
                      color: 'rgba(206, 43, 55, 0.7)',
                      '&:hover': { color: '#ce2b37', bgcolor: 'rgba(206, 43, 55, 0.12)' },
                    }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {proposta.status !== 'aprovada' && (
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleEdit(e); }}
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      '&:hover': { color: '#2196f3', bgcolor: 'rgba(33, 150, 243, 0.1)' },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Gerar PDF">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handlePdf(e); }}
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    '&:hover': { color: '#ce2b37', bgcolor: 'rgba(206, 43, 55, 0.1)' },
                  }}
                >
                  <PdfIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Excluir">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleDelete(e); }}
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    '&:hover': { color: '#ef5350', bgcolor: 'rgba(239, 83, 80, 0.12)' },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Cliente */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <PersonIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              {proposta.cliente_nome}
            </Typography>
          </Box>

          {/* Descrição */}
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 'auto',
              minHeight: 40,
            }}
          >
            {proposta.descricao_servicos}
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 2 }} />

          {/* Footer: Valor + Data */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.7rem',
                  mb: 0.5,
                }}
              >
                Valor Total
              </Typography>
              <Typography
                sx={{
                  color: '#009246',
                  fontWeight: 700,
                  fontSize: '1.4rem',
                }}
              >
                {formatCurrency(proposta.valor_total)}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                <CalendarIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.75rem',
                  }}
                >
                  {formatDate(proposta.created_at)}
                </Typography>
              </Box>
              {proposta.obra_gerada_id && (
                <Chip
                  label="Obra criada"
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 18,
                    fontSize: '0.65rem',
                    backgroundColor: 'rgba(0, 146, 70, 0.15)',
                    color: '#009246',
                  }}
                />
              )}
            </Box>
          </Box>
        </CardContent>
    </MotionCard>
  );
};

export default PropostaCard;
