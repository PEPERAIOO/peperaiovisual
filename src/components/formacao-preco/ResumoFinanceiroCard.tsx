import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { ResumoFinanceiro } from '../../types/formacao-preco';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';

interface ResumoFinanceiroCardProps {
  resumo: ResumoFinanceiro;
}

/**
 * Card que exibe o resumo financeiro completo da proposta
 * com BDI, margem de lucro, impostos e preço final
 */
export const ResumoFinanceiroCard: React.FC<ResumoFinanceiroCardProps> = ({ resumo }) => {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarPercentual = (valor: number) => {
    return `${valor.toFixed(2)}%`;
  };

  return (
    <Paper elevation={3}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalculateOutlinedIcon />
        <Typography variant="h6" fontWeight="semibold">
          Resumo Financeiro da Proposta
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Custos Diretos */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AttachMoneyOutlinedIcon fontSize="small" color="success" />
            <Typography variant="h6" fontWeight="semibold">
              Custos Diretos
            </Typography>
          </Box>
          <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Mão de Obra:</Typography>
              <Typography variant="body2" fontWeight="medium">{formatarMoeda(resumo.custoMaoDeObra)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Logística:</Typography>
              <Typography variant="body2" fontWeight="medium">{formatarMoeda(resumo.custoLogistica)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Materiais e Equipamentos:</Typography>
              <Typography variant="body2" fontWeight="medium">{formatarMoeda(resumo.custoMateriais)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider', fontWeight: 'bold' }}>
              <Typography variant="body1" fontWeight="semibold">Subtotal Custos Diretos:</Typography>
              <Typography variant="body1" fontWeight="semibold" color="success.main">
                {formatarMoeda(resumo.subtotalCustosDirectos)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Custos Indiretos */}
        <Box sx={{ mb: 3, bgcolor: 'warning.light', p: 2, borderRadius: 1, color: 'common.black' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PercentOutlinedIcon fontSize="small" color="warning" />
            <Typography variant="h6" fontWeight="semibold">
              Custos Indiretos
            </Typography>
          </Box>
          <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'common.black' }}>BDI (Indiretos):</Typography>
              <Typography variant="body2" fontWeight="medium" sx={{ color: 'common.black' }}>{formatarMoeda(resumo.bdi)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'common.black' }}>Contingência:</Typography>
              <Typography variant="body2" fontWeight="medium" sx={{ color: 'common.black' }}>
                {formatarMoeda(resumo.contingencia)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider', fontWeight: 'bold' }}>
              <Typography variant="body1" fontWeight="semibold">Subtotal Custos Indiretos:</Typography>
              <Typography variant="body1" fontWeight="semibold" sx={{ color: 'common.black' }}>
                {formatarMoeda(resumo.subtotalCustosIndiretos)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Custo Total */}
        <Box sx={{ mb: 3, bgcolor: 'action.hover', p: 2, borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold">CUSTO TOTAL:</Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {formatarMoeda(resumo.custoTotal)}
            </Typography>
          </Box>
        </Box>

        {/* Formação de Preço */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUpOutlinedIcon fontSize="small" color="secondary" />
            <Typography variant="h6" fontWeight="semibold">
              Formação de Preço
            </Typography>
          </Box>
          <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Margem de Lucro:</Typography>
              <Typography variant="body2" fontWeight="medium" color="secondary.main">
                {formatarMoeda(resumo.margemLucro)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight="medium">Preço Antes dos Impostos:</Typography>
              <Typography variant="body2" fontWeight="semibold">{formatarMoeda(resumo.precoAnteImpostos)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Impostos (Gross Up):</Typography>
              <Typography variant="body2" fontWeight="medium" color="error.main">{formatarMoeda(resumo.impostos)}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Preço Final */}
        <Box sx={{ 
          bgcolor: 'success.main', 
          p: 3, 
          borderRadius: 2, 
          color: 'white',
          mb: 3
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: 2,
          }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>PREÇO FINAL DE VENDA</Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  mt: 0.5,
                  lineHeight: 1.1,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {formatarMoeda(resumo.precoFinalVenda)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, minWidth: 0 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Margem Contrib.</Typography>
              <Typography
                variant="h4"
                fontWeight="semibold"
                sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              >
                {formatarPercentual(resumo.margemContribuicao)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Indicadores */}
        <Box sx={{ mb: 3, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
          <Typography variant="subtitle1" fontWeight="semibold" gutterBottom>
            Indicadores
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Markup Total:</Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatarPercentual(resumo.markupTotal)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Horas Totais Ajustadas:</Typography>
              <Typography variant="body2" fontWeight="medium">
                {resumo.horasTotaisAjustadas.toFixed(1)} h
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Custo Hora Médio:</Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatarMoeda(resumo.custoHoraMedio)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Fórmula Explicativa */}
        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" fontWeight="semibold" display="block" gutterBottom>
            📐 Fórmulas Aplicadas:
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0, fontSize: '0.75rem', color: 'text.secondary' }}>
            <li>• Custo Total = Custos Diretos + BDI + Contingência</li>
            <li>• Preço Ante Impostos = Custo Total × (1 + Margem Lucro)</li>
            <li>
              • <strong>Preço Final = Preço Ante Impostos ÷ (1 - Taxa Impostos)</strong>{' '}
              <Typography component="span" variant="caption" color="primary">
                [Gross Up]
              </Typography>
            </li>
            <li>• Margem Contribuição = (Preço Final - Custo Total) ÷ Preço Final × 100</li>
            <li>• Markup Total = (Preço Final ÷ Custo Total - 1) × 100</li>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
