import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { PropostaFormacaoPreco } from '../../types/formacao-preco';

interface ListaPropostasProps {
  open: boolean;
  onClose: () => void;
  propostas: PropostaFormacaoPreco[];
  loading: boolean;
  onCarregar: (id: string) => void;
  onDeletar: (id: string) => void;
  onListar: () => void;
}

/**
 * Modal para listar e gerenciar propostas salvas
 */
export const ListaPropostas: React.FC<ListaPropostasProps> = ({
  open,
  onClose,
  propostas,
  loading,
  onCarregar,
  onDeletar,
  onListar,
}) => {
  useEffect(() => {
    if (open) {
      onListar();
    }
  }, [open, onListar]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'success';
      case 'em_analise':
        return 'warning';
      case 'rejeitada':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'Aprovada';
      case 'em_analise':
        return 'Em Análise';
      case 'rejeitada':
        return 'Rejeitada';
      default:
        return 'Rascunho';
    }
  };

  const handleCarregar = (id: string) => {
    onCarregar(id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Minhas Propostas</Typography>
          <Typography variant="body2" color="text.secondary">
            {propostas.length} {propostas.length === 1 ? 'proposta' : 'propostas'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 400 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        ) : propostas.length === 0 ? (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight={300}
            gap={2}
          >
            <Typography variant="h6" color="text.secondary">
              Nenhuma proposta salva
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Crie sua primeira proposta para começar
            </Typography>
          </Box>
        ) : (
          <List>
            {propostas.map((proposta, index) => (
              <React.Fragment key={proposta.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    py: 2,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {proposta.nome || 'Sem nome'}
                        </Typography>
                        <Chip
                          label={getStatusLabel(proposta.status)}
                          color={getStatusColor(proposta.status)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Cliente: {proposta.cliente || 'Não informado'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Obra: {proposta.obra || 'Não informada'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Criado em:{' '}
                          {new Date(proposta.dataElaboracao).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1}>
                      <IconButton
                        edge="end"
                        aria-label="carregar"
                        onClick={() => handleCarregar(proposta.id!)}
                        color="primary"
                        title="Carregar proposta"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="deletar"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Tem certeza que deseja deletar a proposta "${proposta.nome}"?`
                            )
                          ) {
                            onDeletar(proposta.id!);
                          }
                        }}
                        color="error"
                        title="Deletar proposta"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
