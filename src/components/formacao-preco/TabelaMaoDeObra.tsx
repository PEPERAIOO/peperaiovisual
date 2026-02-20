import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { CustoMaoDeObra } from '../../types/formacao-preco';

interface TabelaMaoDeObraProps {
  custos: CustoMaoDeObra[];
  totalMaoDeObra: number;
}

/**
 * Componente que exibe a tabela de custos de mão de obra calculados
 */
export const TabelaMaoDeObra: React.FC<TabelaMaoDeObraProps> = ({ custos, totalMaoDeObra }) => {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="semibold">
          Custo de Mão de Obra
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Cargo</TableCell>
                <TableCell align="right">Diária</TableCell>
                <TableCell align="right">Encargos</TableCell>
                <TableCell align="right">Benefícios</TableCell>
                <TableCell align="right">Custo Hora</TableCell>
                <TableCell align="right">Qtd Pessoas</TableCell>
                <TableCell align="right">Base (Dias)</TableCell>
                <TableCell align="right">HE 50%</TableCell>
                <TableCell align="right">HE 100%</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Total Cargo
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {custos.map((custo) => (
                <TableRow key={custo.cargoId} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{custo.cargo}</TableCell>
                  <TableCell align="right">{formatarMoeda(custo.valorDiaria)}</TableCell>
                  <TableCell align="right" sx={{ color: 'warning.main' }}>
                    {formatarMoeda(custo.encargos)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'info.main' }}>
                    {formatarMoeda(custo.beneficios)}
                  </TableCell>
                  <TableCell align="right">{formatarMoeda(custo.custoHora)}</TableCell>
                  <TableCell align="right">{custo.qtdPessoas}</TableCell>
                  <TableCell align="right">{formatarMoeda(custo.custoHorasNormais)}</TableCell>
                  <TableCell align="right">{formatarMoeda(custo.custoHorasExtras50)}</TableCell>
                  <TableCell align="right">{formatarMoeda(custo.custoHorasExtras100)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatarMoeda(custo.custoTotalCargo)}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell colSpan={9} align="right" sx={{ fontWeight: 800 }}>
                  TOTAL MÃO DE OBRA:
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  {formatarMoeda(totalMaoDeObra)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" fontWeight="semibold" display="block" gutterBottom>
            📌 Fórmulas Aplicadas:
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0, color: 'text.secondary', fontSize: '0.75rem' }}>
            <li>• Encargos = Diária × % Encargos</li>
            <li>• Benefícios = Diária × % Benefícios</li>
            <li>• Base (Dias) = (Diária + Encargos + Benefícios) × Dias × Pessoas × Fator Produtividade</li>
            <li>• Custo Hora (para HE) = ((Diária + Encargos + Benefícios) ÷ 8) × Fator Produtividade</li>
            <li>• HE 50% = Custo Hora × 1.5 × Horas Extras 50% × Pessoas</li>
            <li>• HE 100% = Custo Hora × 2.0 × Horas Extras 100% × Pessoas</li>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
