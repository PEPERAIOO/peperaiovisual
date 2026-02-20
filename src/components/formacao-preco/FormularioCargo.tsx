import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
} from '@mui/material';
import { CargoMaoDeObra } from '../../types/formacao-preco';

interface FormularioCargoProps {
  open: boolean;
  onClose: () => void;
  onSalvar: (cargo: Omit<CargoMaoDeObra, 'id'>) => void;
  cargoInicial?: CargoMaoDeObra;
}

/**
 * Formulário para adicionar/editar um cargo na equipe de mão de obra
 */
export const FormularioCargo: React.FC<FormularioCargoProps> = ({
  open,
  onClose,
  onSalvar,
  cargoInicial,
}) => {
  const diasInicial = cargoInicial?.diasNaObra ?? 22;
  const horasNormaisInicial = cargoInicial?.horasNormais ?? diasInicial * 8;

  // Data de hoje no formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Omit<CargoMaoDeObra, 'id'>>({
    cargo: cargoInicial?.cargo || '',
    valorDiaria: cargoInicial?.valorDiaria || 0,
    qtdPessoas: cargoInicial?.qtdPessoas || 1,
    diasNaObra: diasInicial,
    horasNormais: horasNormaisInicial,
    horasExtras50: cargoInicial?.horasExtras50 || 0,
    horasExtras100: cargoInicial?.horasExtras100 || 0,
  });

  const [dataPagamento, setDataPagamento] = useState<string>(today);

  const handleChange = (field: keyof Omit<CargoMaoDeObra, 'id'>, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar(formData);
    onClose();
    // Reset form
    setFormData({
      cargo: '',
      valorDiaria: 0,
      qtdPessoas: 1,
      diasNaObra: 22,
      horasNormais: 22 * 8,
      horasExtras50: 0,
      horasExtras100: 0,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {cargoInicial ? 'Editar Cargo' : 'Adicionar Cargo à Equipe'}
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Cargo */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Cargo / Função"
                placeholder="Ex: Engenheiro Eletricista"
                value={formData.cargo}
                onChange={(e) => handleChange('cargo', e.target.value)}
                required
              />
            </Grid>

            {/* Diária */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Diária (R$/dia)"
                value={formData.valorDiaria}
                onChange={(e) => handleChange('valorDiaria', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                required
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>

            {/* Quantidade de Pessoas */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Qtd de Pessoas"
                value={formData.qtdPessoas}
                onChange={(e) => handleChange('qtdPessoas', parseInt(e.target.value) || 1)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                required
                inputProps={{ min: '1' }}
              />
            </Grid>

            {/* Data de Pagamento */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Data de Pagamento da Diária"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                helperText="Data em que a diária será paga"
              />
            </Grid>

            {/* Dias na Obra */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Dias na Obra"
                value={formData.diasNaObra}
                onChange={(e) => {
                  const dias = parseInt(e.target.value) || 0;
                  handleChange('diasNaObra', dias);
                  // Ajuste simples: por padrão 8h/dia
                  if (dias > 0) handleChange('horasNormais', dias * 8);
                }}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                required
                inputProps={{ min: '1' }}
              />
            </Grid>

            {/* Horas Normais */}
            <Grid size={{ xs: 12, md: 12 }}>
              <TextField
                fullWidth
                type="number"
                label="Horas Normais (auto)"
                value={formData.horasNormais}
                disabled
                inputProps={{ step: '0.5', min: '0' }}
                helperText="Calculado automaticamente: dias × 8h"
              />
            </Grid>

            {/* Horas Extras 50% */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Horas Extras 50%"
                value={formData.horasExtras50}
                onChange={(e) => handleChange('horasExtras50', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ step: '0.5', min: '0' }}
                helperText="Adicional de 50% sobre custo HH"
              />
            </Grid>

            {/* Horas Extras 100% */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Horas Extras 100%"
                value={formData.horasExtras100}
                onChange={(e) => handleChange('horasExtras100', parseFloat(e.target.value) || 0)}
                onFocus={(e) => (e.target as HTMLInputElement).select()}
                inputProps={{ step: '0.5', min: '0' }}
                helperText="Adicional de 100% sobre custo HH"
              />
            </Grid>
          </Grid>

          {/* Informação sobre Encargos */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="semibold" color="primary">
              ℹ️ Informação
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Encargos e benefícios são aplicados automaticamente conforme os parâmetros laterais.
              O ajuste de produtividade adiciona uma margem de tempo para perdas/retrabalho.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="outlined">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {cargoInicial ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
