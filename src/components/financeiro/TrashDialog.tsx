import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  RestoreFromTrash as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeletedTransaction } from '../../types/financeiro';

// Formatador de moeda BRL
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

interface TrashDialogProps {
  open: boolean;
  onClose: () => void;
  deletedTransactions: DeletedTransaction[];
  onRestore: (item: DeletedTransaction) => Promise<{ success: boolean }>;
}

const TrashDialog = ({ open, onClose, deletedTransactions, onRestore }: TrashDialogProps) => {
  const handleRestore = async (item: DeletedTransaction) => {
    if (window.confirm('Deseja restaurar esta transação?')) {
      const result = await onRestore(item);
      if (result.success) {
        // Feedback visual poderia ser adicionado aqui
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
          <DeleteForeverIcon sx={{ color: '#ce2b37' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
            Histórico de Exclusões
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Alert
          severity="info"
          sx={{
            mb: 3,
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            color: 'rgba(255, 255, 255, 0.8)',
            '& .MuiAlert-icon': {
              color: '#2196f3',
            },
          }}
        >
          As transações deletadas ficam salvas aqui por segurança. Você pode restaurá-las a qualquer
          momento.
        </Alert>

        {deletedTransactions.length > 0 ? (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {deletedTransactions.map((item) => {
              const transaction = item.transacao_original;
              const isReceita = transaction.tipo === 'receita';

              return (
                <ListItem
                  key={item.id}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 1, sm: 0 },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          variant="body2"
                          sx={{ color: '#f5f5f5', fontWeight: 500 }}
                        >
                          {transaction.descricao}
                        </Typography>
                        <Chip
                          label={isReceita ? 'Receita' : 'Despesa'}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            backgroundColor: isReceita
                              ? 'rgba(0, 146, 70, 0.15)'
                              : 'rgba(206, 43, 55, 0.15)',
                            color: isReceita ? '#009246' : '#ce2b37',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}
                        >
                          Valor:{' '}
                          <span style={{ color: isReceita ? '#009246' : '#ce2b37', fontWeight: 600 }}>
                            {currencyFormatter.format(transaction.valor)}
                          </span>
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block' }}
                        >
                          Data original: {format(parseISO(transaction.data_vencimento || new Date().toISOString()), 'dd/MM/yyyy', { locale: ptBR })}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'rgba(206, 43, 55, 0.7)', display: 'block' }}
                        >
                          Deletado em: {format(parseISO(item.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </Typography>
                      </Box>
                    }
                  />

                  <Box sx={{ display: 'flex', gap: 1, ml: { sm: 2 } }}>
                    <Tooltip title="Restaurar transação">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RestoreIcon />}
                        onClick={() => handleRestore(item)}
                        sx={{
                          borderColor: '#009246',
                          color: '#009246',
                          '&:hover': {
                            borderColor: '#00a850',
                            backgroundColor: 'rgba(0, 146, 70, 0.1)',
                          },
                        }}
                      >
                        Restaurar
                      </Button>
                    </Tooltip>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <DeleteForeverIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)', mb: 1 }}>
              Nenhuma transação deletada
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              Quando você deletar uma transação, ela aparecerá aqui para possível recuperação
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', mr: 'auto' }}>
          {deletedTransactions.length} item(s) na lixeira
        </Typography>
        <Button onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrashDialog;
