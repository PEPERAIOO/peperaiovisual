import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { Category, CATEGORY_COLORS, TransactionType } from '../../types/financeiro';

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (category: Omit<Category, 'id' | 'created_at'>) => Promise<{ success: boolean }>;
  onUpdate: (id: string, updates: Partial<Category>) => Promise<{ success: boolean }>;
  onDelete: (id: string) => Promise<{ success: boolean }>;
}

const CategoryManager = ({
  open,
  onClose,
  categories,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManagerProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cor: CATEGORY_COLORS[0],
    tipo: 'despesa' as TransactionType,
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      cor: CATEGORY_COLORS[0],
      tipo: 'despesa',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!formData.nome.trim()) return;

    const result = await onAdd(formData);
    if (result.success) {
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.nome.trim()) return;

    const result = await onUpdate(editingId, formData);
    if (result.success) {
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      await onDelete(id);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      nome: category.nome,
      cor: category.cor,
      tipo: category.tipo,
    });
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      nome: '',
      cor: CATEGORY_COLORS[0],
      tipo: 'despesa',
    });
  };

  const isEditing = isAdding || editingId !== null;

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
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
          Gerenciar Categorias
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Formulário de Adição/Edição */}
        {isEditing && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
              {isAdding ? 'Nova Categoria' : 'Editar Categoria'}
            </Typography>

            <TextField
              fullWidth
              label="Nome da Categoria"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              size="small"
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1, display: 'block' }}>
              Tipo
            </Typography>
            <ToggleButtonGroup
              value={formData.tipo}
              exclusive
              onChange={(_, value) => value && setFormData({ ...formData, tipo: value })}
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton
                value="receita"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 146, 70, 0.2)',
                    color: '#009246',
                  },
                }}
              >
                Receita
              </ToggleButton>
              <ToggleButton
                value="despesa"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(206, 43, 55, 0.2)',
                    color: '#ce2b37',
                  },
                }}
              >
                Despesa
              </ToggleButton>
            </ToggleButtonGroup>

            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mb: 1, display: 'block' }}>
              Cor
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {CATEGORY_COLORS.map((color) => (
                <Tooltip key={color} title={color}>
                  <Box
                    onClick={() => setFormData({ ...formData, cor: color })}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      backgroundColor: color,
                      cursor: 'pointer',
                      border: formData.cor === color ? '3px solid #fff' : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<CheckIcon />}
                onClick={isAdding ? handleAdd : handleUpdate}
                sx={{
                  backgroundColor: '#009246',
                  '&:hover': { backgroundColor: '#007a38' },
                }}
              >
                {isAdding ? 'Adicionar' : 'Salvar'}
              </Button>
              <Button variant="outlined" size="small" onClick={resetForm}>
                Cancelar
              </Button>
            </Box>
          </Box>
        )}

        {/* Botão para adicionar */}
        {!isEditing && (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={startAdd}
            sx={{
              mb: 2,
              borderStyle: 'dashed',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                borderColor: '#009246',
                backgroundColor: 'rgba(0, 146, 70, 0.1)',
              },
            }}
          >
            Nova Categoria
          </Button>
        )}

        {/* Lista de Categorias */}
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {categories.map((category) => (
            <ListItem
              key={category.id}
              sx={{
                backgroundColor:
                  editingId === category.id ? 'rgba(0, 146, 70, 0.1)' : 'transparent',
                borderRadius: 2,
                mb: 0.5,
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: category.cor,
                  mr: 2,
                  flexShrink: 0,
                }}
              />
              <ListItemText
                primary={category.nome}
                secondary={
                  <Box component="span" sx={{ display: 'inline-block' }}>
                    <Chip
                      label={category.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      size="small"
                      sx={{
                        mt: 0.5,
                        height: 20,
                        fontSize: '0.65rem',
                        backgroundColor:
                          category.tipo === 'receita'
                            ? 'rgba(0, 146, 70, 0.15)'
                            : 'rgba(206, 43, 55, 0.15)',
                        color: category.tipo === 'receita' ? '#009246' : '#ce2b37',
                      }}
                    />
                  </Box>
                }
                primaryTypographyProps={{
                  color: '#f5f5f5',
                  fontWeight: 500,
                }}
                secondaryTypographyProps={{
                  component: 'span',
                }}
              />
              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => startEdit(category)}
                  sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: '#2196f3' } }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(category.id)}
                  sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: '#ce2b37' } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {categories.length === 0 && (
          <Typography
            variant="body2"
            sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', py: 4 }}
          >
            Nenhuma categoria cadastrada
          </Typography>
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

export default CategoryManager;
