import { useState, useMemo, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  IconButton, 
  Tooltip, 
  CircularProgress, 
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
  Button,
  Collapse,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon, CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componentes
import {
  FinanceiroToolbar,
  CategoryManager,
  MonthSelector,
  TrashDialog,
  TransactionForm,
  SummaryCards,
} from '../components/financeiro';

// Hook e tipos
import { useFinanceiro } from '../hooks/useFinanceiro';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, STATUS_CONFIG } from '../types/financeiro';

// Utils
import { exportFinanceiroPdf } from '../utils/exportPdf.tsx';

// Formatador de moeda BRL
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const Financeiro = () => {
  // Hook principal
  const {
    transactions,
    categories,
    deletedTransactions,
    availableMonths,
    selectedDate,
    currentMonthLabel,
    summary,
    loading,
    error,
    showAllTransactions,
    currentPage,
    totalPages,
    categoryTotals,
    loadingCategoryTotals,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    restoreTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    selectMonth,
    toggleShowAll,
    goToPage,
  } = useFinanceiro();

  // Permissões
  const { canEdit } = usePermissions();
  
  // Autenticação
  const { user, profile } = useAuth();
  
  // Responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Estados dos diálogos
  const [monthSelectorOpen, setMonthSelectorOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [trashDialogOpen, setTrashDialogOpen] = useState(false);
  const [showTransactionsList, setShowTransactionsList] = useState(false);

  // Estado para edição
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Mapeamento de cores por categoria
  const categoryColors = useMemo(() => {
    const colors: Record<string, { bg: string; text: string }> = {};
    categories.forEach((cat) => {
      colors[cat.nome] = {
        bg: `${cat.cor}20`,
        text: cat.cor,
      };
    });
    return colors;
  }, [categories]);

  // Handlers
  const handleOpenTransactionForm = useCallback((transaction?: Transaction) => {
    setEditingTransaction(transaction || null);
    setTransactionFormOpen(true);
  }, []);

  const handleCloseTransactionForm = useCallback(() => {
    setEditingTransaction(null);
    setTransactionFormOpen(false);
  }, []);

  const handleSaveTransaction = useCallback(
    async (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
      if (editingTransaction) {
        const result = await updateTransaction(editingTransaction.id, data);
        if (result.success) {
          handleCloseTransactionForm();
        }
        return result;
      } else {
        const result = await addTransaction(data);
        if (result.success) {
          handleCloseTransactionForm();
        }
        return result;
      }
    },
    [editingTransaction, addTransaction, updateTransaction, handleCloseTransactionForm]
  );

  const handleDeleteTransaction = useCallback(
    async (transaction: Transaction) => {
      if (window.confirm('Deseja mover esta transação para a lixeira?')) {
        await deleteTransaction(transaction);
      }
    },
    [deleteTransaction]
  );

  const handleMarkAsPaid = useCallback(
    async (transaction: Transaction) => {
      if (transaction.status === 'pago') return;
      if (window.confirm('Confirmar pagamento desta despesa?')) {
        await updateTransaction(transaction.id, { status: 'pago', data_pagamento: new Date().toISOString() });
      }
    },
    [updateTransaction]
  );

  const handleExportPdf = useCallback(() => {
    exportFinanceiroPdf({
      transactions,
      summary,
      monthLabel: currentMonthLabel,
      userName: profile?.nome || user?.email || 'Sistema',
    });
  }, [transactions, summary, currentMonthLabel, profile, user]);

  // Função auxiliar para formatar data e hora
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      // Se a hora UTC for exatamente meio-dia (12:00), é uma data sem hora específica
      // Exibir apenas a data usando os valores UTC para evitar problema de timezone
      if (date.getUTCHours() === 12 && date.getUTCMinutes() === 0) {
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Ordenar transações por data (mais recentes primeiro)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = a.data_pagamento || a.data_vencimento || a.created_at || '';
      const dateB = b.data_pagamento || b.data_vencimento || b.created_at || '';
      return dateB.localeCompare(dateA);
    });
  }, [transactions]);

  const categoryExpenseSummary = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }, [categoryTotals]);

  // Loading state
  if (loading && transactions.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress sx={{ color: '#009246' }} />
      </Box>
    );
  }

  return (
    <Box>
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
              fontWeight: 700,
              color: '#f5f5f5',
              mb: 0.5,
            }}
          >
            Financeiro
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {showAllTransactions ? 'Todas as Transações' : currentMonthLabel}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={toggleShowAll}
              sx={{
                textTransform: 'none',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem',
                py: 0.25,
                px: 1,
                '&:hover': {
                  borderColor: '#009246',
                  background: 'rgba(0, 146, 70, 0.1)',
                },
              }}
            >
              {showAllTransactions ? 'Filtrar por Mês' : 'Mostrar Todas'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Toolbar */}
      <FinanceiroToolbar
        onNewTransaction={() => handleOpenTransactionForm()}
        onOpenMonthSelector={() => setMonthSelectorOpen(true)}
        onOpenCategoryManager={() => setCategoryManagerOpen(true)}
        onOpenTrash={() => setTrashDialogOpen(true)}
        onExportPdf={handleExportPdf}
        currentMonthLabel={currentMonthLabel}
        canEdit={canEdit()}
      />

      {/* Cards de Resumo */}
      <SummaryCards summary={summary} currentMonthLabel={currentMonthLabel} />

      {/* Resumo por Categoria */}
      <Paper
        sx={{
          mt: 3,
          mb: 2,
          p: 2.5,
          background: 'rgba(30, 30, 30, 0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            flexDirection: { xs: 'column', md: 'row' },
            mb: 2,
          }}
        >
          <Box>
            <Typography sx={{ color: '#f5f5f5', fontWeight: 600 }}>
              Resumo de Gastos por Categoria
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              {showAllTransactions ? 'Todas as transações' : currentMonthLabel}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => setShowTransactionsList((prev) => !prev)}
              sx={{
                textTransform: 'none',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  borderColor: '#009246',
                  background: 'rgba(0, 146, 70, 0.1)',
                },
              }}
            >
              {showTransactionsList ? 'Ocultar lista completa' : 'Ver lista completa'}
            </Button>
          </Box>
        </Box>

        {loadingCategoryTotals ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress sx={{ color: '#009246' }} />
          </Box>
        ) : categoryExpenseSummary.length === 0 ? (
          <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Nenhum gasto encontrado para o período.
          </Typography>
        ) : (
          <Grid container spacing={1.5}>
            {categoryExpenseSummary.map((item) => {
              const categoryColor = categoryColors[item.categoria] || {
                bg: 'rgba(255,255,255,0.08)',
                text: '#fff',
              };

              return (
                <Grid key={item.categoria} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'rgba(20, 20, 20, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderLeft: `4px solid ${categoryColor.text}`,
                    }}
                  >
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', mb: 0.5 }}>
                      {item.categoria}
                    </Typography>
                    <Typography sx={{ color: '#f5f5f5', fontWeight: 700, fontSize: '1rem' }}>
                      {currencyFormatter.format(item.total)}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      {/* Lista de Gastos (com paginação) */}
      <Collapse in={showTransactionsList}>
        <Box sx={{ mb: 2, mt: 2 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: 'rgba(255,255,255,0.6)', 
              mb: 2,
              fontSize: '0.85rem',
            }}
          >
            {showAllTransactions 
              ? `Exibindo ${sortedTransactions.length} transação(ões) nesta página`
              : `${sortedTransactions.length} transação(ões) encontrada(s)`
            }
          </Typography>
        </Box>

        {loading && sortedTransactions.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#009246' }} />
          </Box>
        ) : sortedTransactions.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'rgba(30, 30, 30, 0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 3,
            }}
          >
            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Nenhuma transação encontrada
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {sortedTransactions.map((transaction) => {
            const isReceita = transaction.tipo === 'receita';
            const statusConfig = STATUS_CONFIG[transaction.status as keyof typeof STATUS_CONFIG];
            const categoryColor = categoryColors[transaction.categoria] || {
              bg: 'rgba(255,255,255,0.1)',
              text: '#fff',
            };
            const displayDate = transaction.data_pagamento || transaction.data_vencimento || transaction.created_at;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={transaction.id}>
                <Paper
                  sx={{
                    p: 2,
                    background: 'rgba(30, 30, 30, 0.6)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 2,
                    borderLeft: `4px solid ${isReceita ? '#009246' : '#ce2b37'}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'rgba(40, 40, 40, 0.7)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  {/* Header do Card - Valor e Ações */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography
                      sx={{
                        color: isReceita ? '#4caf50' : '#ef5350',
                        fontWeight: 700,
                        fontSize: isMobile ? '1.2rem' : '1.4rem',
                      }}
                    >
                      {isReceita ? '+' : '-'} {currencyFormatter.format(transaction.valor)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {transaction.tipo === 'despesa' && transaction.status === 'pendente' && (
                        <Tooltip title="Marcar como pago">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkAsPaid(transaction)}
                            disabled={!canEdit()}
                            sx={{ 
                              color: 'rgba(255,255,255,0.4)', 
                              '&:hover': { color: '#009246', bgcolor: 'rgba(0,146,70,0.1)' } 
                            }}
                          >
                            <CheckCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenTransactionForm(transaction)}
                          disabled={!canEdit()}
                          sx={{ 
                            color: 'rgba(255,255,255,0.4)', 
                            '&:hover': { color: '#2196f3', bgcolor: 'rgba(33,150,243,0.1)' } 
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTransaction(transaction)}
                          disabled={!canEdit()}
                          sx={{ 
                            color: 'rgba(255,255,255,0.4)', 
                            '&:hover': { color: '#ce2b37', bgcolor: 'rgba(206,43,55,0.1)' } 
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Descrição */}
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      mb: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {transaction.descricao}
                  </Typography>

                  {/* Chips de Categoria e Status */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                    <Chip
                      label={transaction.categoria}
                      size="small"
                      sx={{
                        backgroundColor: categoryColor.bg,
                        color: categoryColor.text,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                    <Chip
                      label={statusConfig?.label || transaction.status}
                      size="small"
                      color={statusConfig?.color || 'default'}
                      variant="outlined"
                      sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                    />
                  </Box>

                  {/* Data e Hora */}
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.75rem',
                    }}
                  >
                    {formatDateTime(displayDate)}
                  </Typography>

                  {/* Nome do usuário que lançou */}
                  {transaction.user_nome && (
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.7rem',
                        mt: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 12 }} />
                      {transaction.user_nome}
                    </Typography>
                  )}

                  {/* Obra/Entidade se houver */}
                  {(transaction.obra?.nome || transaction.entidade?.nome) && (
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.75rem',
                        mt: 0.5,
                        fontStyle: 'italic',
                      }}
                    >
                      {transaction.obra?.nome && `Obra: ${transaction.obra.nome}`}
                      {transaction.obra?.nome && transaction.entidade?.nome && ' • '}
                      {transaction.entidade?.nome && transaction.entidade.nome}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
            })}
          </Grid>
        )}

        {/* Controles de Paginação */}
        {showAllTransactions && totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              mt: 4,
              mb: 2,
            }}
          >
            <Button
              variant="outlined"
              disabled={currentPage === 0}
              onClick={() => goToPage(currentPage - 1)}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  borderColor: '#009246',
                  background: 'rgba(0, 146, 70, 0.1)',
                },
                '&.Mui-disabled': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Anterior
            </Button>

            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
              }}
            >
              Página {currentPage + 1} de {totalPages}
            </Typography>

            <Button
              variant="outlined"
              disabled={currentPage >= totalPages - 1}
              onClick={() => goToPage(currentPage + 1)}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  borderColor: '#009246',
                  background: 'rgba(0, 146, 70, 0.1)',
                },
                '&.Mui-disabled': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Próxima
            </Button>
          </Box>
        )}
      </Collapse>

      {/* Diálogos */}
      <MonthSelector
        open={monthSelectorOpen}
        onClose={() => setMonthSelectorOpen(false)}
        availableMonths={availableMonths}
        selectedDate={selectedDate}
        onSelectMonth={selectMonth}
      />

      <CategoryManager
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={categories}
        onAdd={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />

      <TransactionForm
        open={transactionFormOpen}
        onClose={handleCloseTransactionForm}
        onSave={handleSaveTransaction}
        onUpdate={updateTransaction}
        categories={categories}
        transaction={editingTransaction}
      />

      <TrashDialog
        open={trashDialogOpen}
        onClose={() => setTrashDialogOpen(false)}
        deletedTransactions={deletedTransactions}
        onRestore={restoreTransaction}
      />
    </Box>
  );
};

export default Financeiro;
