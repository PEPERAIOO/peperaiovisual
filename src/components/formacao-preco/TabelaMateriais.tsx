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
  Chip,
  Divider,
} from '@mui/material';
import { Material } from '../../types/formacao-preco';

interface TabelaMateriaisProps {
  materiais: Material[];
  totalMateriais: number;
  totalEquipamentos: number;
  totalServicosTerceiros: number;
}

const labelCategoria: Record<Material['categoria'], string> = {
  material: 'Material',
  equipamento: 'Equipamento',
  servico_terceiro: 'Serviço Terceiro',
};

export const TabelaMateriais: React.FC<TabelaMateriaisProps> = ({
  materiais,
  totalMateriais,
  totalEquipamentos,
  totalServicosTerceiros,
}) => {
  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const totalItem = (m: Material) => m.quantidade * m.precoUnitario;
  const totalGeral = totalMateriais + totalEquipamentos + totalServicosTerceiros;

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="semibold">
          Materiais, Equipamentos e Terceiros
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Descrição</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell align="right">Qtd</TableCell>
                <TableCell>Unid.</TableCell>
                <TableCell align="right">Preço Unit.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materiais.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{m.descricao}</TableCell>
                  <TableCell>
                    <Chip size="small" label={labelCategoria[m.categoria]} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{m.quantidade}</TableCell>
                  <TableCell>{m.unidade}</TableCell>
                  <TableCell align="right">{formatarMoeda(m.precoUnitario)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatarMoeda(totalItem(m))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Total Materiais:
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {formatarMoeda(totalMateriais)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Total Equipamentos:
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {formatarMoeda(totalEquipamentos)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Total Serviços Terceiros:
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {formatarMoeda(totalServicosTerceiros)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body1" fontWeight={800}>
              Total Geral:
            </Typography>
            <Typography variant="body1" fontWeight={900} color="success.main">
              {formatarMoeda(totalGeral)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
