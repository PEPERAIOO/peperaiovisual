import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
} from '@mui/material';
import { Transporte } from '../../types/formacao-preco';

interface FormularioTransporteProps {
  open: boolean;
  onClose: () => void;
  onSalvar: (transporte: Omit<Transporte, 'id'>) => void;
}

export const FormularioTransporte: React.FC<FormularioTransporteProps> = ({
  open,
  onClose,
  onSalvar,
}) => {
  const [formData, setFormData] = useState<Omit<Transporte, 'id'>>({
    descricao: '',
    distanciaKm: 0,
    consumoKmPorLitro: 10,
    precoCombustivel: 0,
    pedagios: 0,
    qtdViagens: 1,
  });

  const handleChange = (field: keyof Omit<Transporte, 'id'>, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar(formData);
    onClose();
    setFormData({
      descricao: '',
      distanciaKm: 0,
      consumoKmPorLitro: 10,
      precoCombustivel: 0,
      pedagios: 0,
      qtdViagens: 1,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Adicionar Transporte</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descrição"
                placeholder="Ex: Veículo leve (ida e volta)"
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Distância Total (km)"
                value={formData.distanciaKm}
                onChange={(e) => handleChange('distanciaKm', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ step: '0.1', min: '0' }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Consumo (km/L)"
                value={formData.consumoKmPorLitro}
                onChange={(e) => handleChange('consumoKmPorLitro', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ step: '0.1', min: '0.1' }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Preço Combustível (R$/L)"
                value={formData.precoCombustivel}
                onChange={(e) => handleChange('precoCombustivel', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ step: '0.01', min: '0' }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Pedágios (R$)"
                value={formData.pedagios}
                onChange={(e) => handleChange('pedagios', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Qtd Viagens"
                value={formData.qtdViagens}
                onChange={(e) => handleChange('qtdViagens', parseInt(e.target.value) || 1)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ min: '1' }}
                required
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="semibold">
              Fórmula
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Total = ((Distância / Consumo) × Preço Combustível + Pedágios) × Viagens
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
