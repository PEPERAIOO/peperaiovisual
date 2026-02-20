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
import { HospedagemAlimentacao } from '../../types/formacao-preco';

interface FormularioHospedagemProps {
  open: boolean;
  onClose: () => void;
  onSalvar: (hospedagem: Omit<HospedagemAlimentacao, 'id'>) => void;
}

export const FormularioHospedagem: React.FC<FormularioHospedagemProps> = ({
  open,
  onClose,
  onSalvar,
}) => {
  const [formData, setFormData] = useState<Omit<HospedagemAlimentacao, 'id'>>({
    descricao: '',
    valorDiaria: 0,
    diasViajados: 1,
    qtdPessoas: 1,
  });

  const handleChange = (
    field: keyof Omit<HospedagemAlimentacao, 'id'>,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar(formData);
    onClose();
    setFormData({ descricao: '', valorDiaria: 0, diasViajados: 1, qtdPessoas: 1 });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Adicionar Hospedagem / Alimentação</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Descrição"
                placeholder="Ex: Hotel + alimentação"
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Valor Diária (R$)"
                value={formData.valorDiaria}
                onChange={(e) => handleChange('valorDiaria', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ step: '0.01', min: '0' }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Dias"
                value={formData.diasViajados}
                onChange={(e) => handleChange('diasViajados', parseInt(e.target.value) || 1)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ min: '1' }}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                type="number"
                label="Qtd Pessoas"
                value={formData.qtdPessoas}
                onChange={(e) => handleChange('qtdPessoas', parseInt(e.target.value) || 1)}
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
              Total = Valor Diária × Dias × Pessoas
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
