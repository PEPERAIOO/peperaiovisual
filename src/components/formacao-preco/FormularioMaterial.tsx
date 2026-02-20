import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
} from '@mui/material';
import { Material } from '../../types/formacao-preco';

interface FormularioMaterialProps {
  open: boolean;
  onClose: () => void;
  onSalvar: (material: Omit<Material, 'id'>) => void;
}

export const FormularioMaterial: React.FC<FormularioMaterialProps> = ({
  open,
  onClose,
  onSalvar,
}) => {
  const [formData, setFormData] = useState<Omit<Material, 'id'>>({
    descricao: '',
    unidade: 'un',
    quantidade: 1,
    precoUnitario: 0,
    categoria: 'material',
  });

  const handleChange = (field: keyof Omit<Material, 'id'>, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar(formData);
    onClose();
    setFormData({ descricao: '', unidade: 'un', quantidade: 1, precoUnitario: 0, categoria: 'material' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Adicionar Material / Equipamento / Serviço</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <TextField
                fullWidth
                label="Descrição"
                placeholder="Ex: Cabo 10mm"
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                select
                fullWidth
                label="Categoria"
                value={formData.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                required
              >
                <MenuItem value="material">Material</MenuItem>
                <MenuItem value="equipamento">Equipamento</MenuItem>
                <MenuItem value="servico_terceiro">Serviço Terceiro</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                fullWidth
                label="Unidade"
                value={formData.unidade}
                onChange={(e) => handleChange('unidade', e.target.value)}
                placeholder="Ex: m, kg, un"
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Quantidade"
                value={formData.quantidade}
                onChange={(e) => handleChange('quantidade', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ step: '0.01', min: '0' }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Preço Unitário (R$)"
                value={formData.precoUnitario}
                onChange={(e) => handleChange('precoUnitario', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ step: '0.01', min: '0' }}
                required
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="semibold">
              Fórmula
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Total = Quantidade × Preço Unitário
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="outlined">
            Cancelar
          </Button>
          <Button type="submit" variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
