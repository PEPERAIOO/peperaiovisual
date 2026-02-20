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
  Divider,
} from '@mui/material';
import {
  HospedagemAlimentacao,
  Transporte,
  CustoLogistica,
} from '../../types/formacao-preco';

interface TabelaLogisticaProps {
  hospedagens: HospedagemAlimentacao[];
  transportes: Transporte[];
  custoLogistica: CustoLogistica;
}

export const TabelaLogistica: React.FC<TabelaLogisticaProps> = ({
  hospedagens,
  transportes,
  custoLogistica,
}) => {
  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const calcularTotalHospedagem = (h: HospedagemAlimentacao) =>
    h.valorDiaria * h.diasViajados * h.qtdPessoas;

  const calcularTotalTransporte = (t: Transporte) => {
    const custoCombustivel = (t.distanciaKm / t.consumoKmPorLitro) * t.precoCombustivel;
    const custoTotalPorViagem = custoCombustivel + t.pedagios;
    return custoTotalPorViagem * t.qtdViagens;
  };

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="semibold">
          Custos de Logística
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Hospedagem */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Hospedagem e Alimentação
        </Typography>

        {hospedagens.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Nenhuma hospedagem/alimentação adicionada.
          </Typography>
        ) : (
          <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto', mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Descrição</TableCell>
                  <TableCell align="right">Valor Diária</TableCell>
                  <TableCell align="right">Dias</TableCell>
                  <TableCell align="right">Pessoas</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hospedagens.map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{h.descricao}</TableCell>
                    <TableCell align="right">{formatarMoeda(h.valorDiaria)}</TableCell>
                    <TableCell align="right">{h.diasViajados}</TableCell>
                    <TableCell align="right">{h.qtdPessoas}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatarMoeda(calcularTotalHospedagem(h))}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={4} align="right" sx={{ fontWeight: 800 }}>
                    Subtotal Hospedagem:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main' }}>
                    {formatarMoeda(custoLogistica.hospedagemTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Transporte */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Transporte
        </Typography>

        {transportes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Nenhum transporte adicionado.
          </Typography>
        ) : (
          <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto', mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Descrição</TableCell>
                  <TableCell align="right">Distância (km)</TableCell>
                  <TableCell align="right">Consumo (km/L)</TableCell>
                  <TableCell align="right">Combustível (R$/L)</TableCell>
                  <TableCell align="right">Pedágios</TableCell>
                  <TableCell align="right">Viagens</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transportes.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{t.descricao}</TableCell>
                    <TableCell align="right">{t.distanciaKm}</TableCell>
                    <TableCell align="right">{t.consumoKmPorLitro}</TableCell>
                    <TableCell align="right">{formatarMoeda(t.precoCombustivel)}</TableCell>
                    <TableCell align="right">{formatarMoeda(t.pedagios)}</TableCell>
                    <TableCell align="right">{t.qtdViagens}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatarMoeda(calcularTotalTransporte(t))}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={6} align="right" sx={{ fontWeight: 800 }}>
                    Subtotal Transporte:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'primary.main' }}>
                    {formatarMoeda(custoLogistica.transporteTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={800}>
            Total Logística:
          </Typography>
          <Typography variant="h6" fontWeight={900} color="success.main">
            {formatarMoeda(custoLogistica.totalLogistica)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
