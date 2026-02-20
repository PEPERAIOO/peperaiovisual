import React, { useEffect, useMemo, useState } from 'react';
import { Paper, Box, Typography, TextField, Grid } from '@mui/material';
import { ParametrosFinanceiros } from '../../types/formacao-preco';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

interface ConfiguracoesFinanceirasProps {
  parametros: ParametrosFinanceiros;
  onAtualizarParametros: (parametros: Partial<ParametrosFinanceiros>) => void;
}

/**
 * Componente para configurar os parâmetros financeiros da proposta
 * (BDI, Margem de Lucro, Impostos, Contingência)
 */
export const ConfiguracoesFinanceiras: React.FC<ConfiguracoesFinanceirasProps> = ({
  parametros,
  onAtualizarParametros,
}) => {
  const formatPercent = useMemo(() => {
    return (valor: number) => (valor * 100).toFixed(2);
  }, []);

  const [editandoCampo, setEditandoCampo] = useState<keyof ParametrosFinanceiros | null>(null);

  const [bdiText, setBdiText] = useState(() => formatPercent(parametros.bdi));
  const [margemText, setMargemText] = useState(() => formatPercent(parametros.margemLucro));
  const [impostosText, setImpostosText] = useState(() => formatPercent(parametros.taxaImpostos));
  const [contingenciaText, setContingenciaText] = useState(() => formatPercent(parametros.contingencia));
  const [encargosText, setEncargosText] = useState(() => formatPercent(parametros.encargosSociais));
  const [beneficiosText, setBeneficiosText] = useState(() => formatPercent(parametros.beneficios));
  const [produtividadeText, setProdutividadeText] = useState(() =>
    ((Math.max(1, parametros.fatorProdutividade) - 1) * 100).toFixed(2)
  );

  useEffect(() => {
    if (editandoCampo !== 'bdi') setBdiText(formatPercent(parametros.bdi));
    if (editandoCampo !== 'margemLucro') setMargemText(formatPercent(parametros.margemLucro));
    if (editandoCampo !== 'taxaImpostos') setImpostosText(formatPercent(parametros.taxaImpostos));
    if (editandoCampo !== 'contingencia') setContingenciaText(formatPercent(parametros.contingencia));
    if (editandoCampo !== 'encargosSociais') setEncargosText(formatPercent(parametros.encargosSociais));
    if (editandoCampo !== 'beneficios') setBeneficiosText(formatPercent(parametros.beneficios));
    if (editandoCampo !== 'fatorProdutividade') {
      setProdutividadeText(((Math.max(1, parametros.fatorProdutividade) - 1) * 100).toFixed(2));
    }
  }, [
    parametros.bdi,
    parametros.margemLucro,
    parametros.taxaImpostos,
    parametros.contingencia,
    parametros.encargosSociais,
    parametros.beneficios,
    parametros.fatorProdutividade,
    editandoCampo,
    formatPercent,
  ]);

  const parsePercent = (raw: string): number | null => {
    const normalized = raw.replace(',', '.').trim();
    if (normalized === '') return null;
    const value = Number(normalized);
    if (!Number.isFinite(value)) return null;
    return Math.min(100, Math.max(0, value));
  };

  const commitPercent = (campo: keyof ParametrosFinanceiros, raw: string) => {
    const parsed = parsePercent(raw);
    if (parsed === null) {
      // Reverte para o valor atual do estado caso o usuário deixe vazio/inválido
      if (campo === 'bdi') setBdiText(formatPercent(parametros.bdi));
      if (campo === 'margemLucro') setMargemText(formatPercent(parametros.margemLucro));
      if (campo === 'taxaImpostos') setImpostosText(formatPercent(parametros.taxaImpostos));
      if (campo === 'contingencia') setContingenciaText(formatPercent(parametros.contingencia));
      if (campo === 'encargosSociais') setEncargosText(formatPercent(parametros.encargosSociais));
      if (campo === 'beneficios') setBeneficiosText(formatPercent(parametros.beneficios));
      return;
    }
    onAtualizarParametros({ [campo]: parsed / 100 });
  };

  const commitProdutividade = (raw: string) => {
    const parsed = parsePercent(raw);
    if (parsed === null) {
      setProdutividadeText(((Math.max(1, parametros.fatorProdutividade) - 1) * 100).toFixed(2));
      return;
    }
    const fator = 1 + parsed / 100;
    onAtualizarParametros({ fatorProdutividade: fator });
  };

  return (
    <Paper elevation={2}>
      <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsOutlinedIcon fontSize="small" />
        <Typography variant="h6" fontWeight="semibold">
          Parâmetros Financeiros
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Ajustes de Mão de Obra
            </Typography>
          </Grid>

          {/* Encargos Sociais */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Encargos Sociais (%)"
              value={encargosText}
              onFocus={() => setEditandoCampo('encargosSociais')}
              onBlur={() => {
                commitPercent('encargosSociais', encargosText);
                setEditandoCampo(null);
              }}
              onChange={(e) => setEncargosText(e.target.value)}
              inputProps={{ inputMode: 'decimal' }}
              helperText="INSS, FGTS e encargos obrigatórios"
            />
          </Grid>

          {/* Benefícios */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Benefícios (%)"
              value={beneficiosText}
              onFocus={() => setEditandoCampo('beneficios')}
              onBlur={() => {
                commitPercent('beneficios', beneficiosText);
                setEditandoCampo(null);
              }}
              onChange={(e) => setBeneficiosText(e.target.value)}
              inputProps={{ inputMode: 'decimal' }}
              helperText="Vale alimentação, transporte, EPI, etc."
            />
          </Grid>

          {/* Produtividade */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Improdutividade / Retrabalho (%)"
              value={produtividadeText}
              onFocus={() => setEditandoCampo('fatorProdutividade')}
              onBlur={() => {
                commitProdutividade(produtividadeText);
                setEditandoCampo(null);
              }}
              onChange={(e) => setProdutividadeText(e.target.value)}
              inputProps={{ inputMode: 'decimal' }}
              helperText="Ajuste de tempo extra por perdas"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Custos e Impostos
            </Typography>
          </Grid>

          {/* BDI */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="BDI - Custos Indiretos (%)"
              value={bdiText}
              onFocus={() => setEditandoCampo('bdi')}
              onBlur={() => {
                commitPercent('bdi', bdiText);
                setEditandoCampo(null);
              }}
              onChange={(e) => setBdiText(e.target.value)}
              inputProps={{ inputMode: 'decimal' }}
              helperText="Administração, seguros, canteiro, etc."
            />
          </Grid>

          {/* Margem de Lucro */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Margem de Lucro (%)"
              value={margemText}
              onFocus={() => setEditandoCampo('margemLucro')}
              onBlur={() => {
                commitPercent('margemLucro', margemText);
                setEditandoCampo(null);
              }}
              onChange={(e) => setMargemText(e.target.value)}
              inputProps={{ inputMode: 'decimal' }}
              helperText="Ganho desejado sobre o custo total"
            />
          </Grid>

          {/* Taxa de Impostos */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Impostos (%)"
              value={impostosText}
              onFocus={() => setEditandoCampo('taxaImpostos')}
              onBlur={() => {
                commitPercent('taxaImpostos', impostosText);
                setEditandoCampo(null);
              }}
              onChange={(e) => setImpostosText(e.target.value)}
              inputProps={{ inputMode: 'decimal' }}
              helperText="Impostos calculados por fora (gross up)"
            />
          </Grid>

          {/* Contingência */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Contingência (%)"
              value={contingenciaText}
              onFocus={() => setEditandoCampo('contingencia')}
              onBlur={() => {
                commitPercent('contingencia', contingenciaText);
                setEditandoCampo(null);
              }}
              onChange={(e) => setContingenciaText(e.target.value)}
              inputProps={{ inputMode: 'decimal' }}
              helperText="Reserva para riscos e imprevistos"
            />
          </Grid>
        </Grid>

        {/* Informação Adicional */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'common.black' }}>
          <Typography variant="body2" fontWeight="semibold" sx={{ color: 'common.black' }}>
            ⚠️ Atenção
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'common.black' }}>
            Os impostos são calculados <strong>"por fora" (Gross Up)</strong>, ou seja, o preço
            final será calculado de forma que, após retirar os impostos, reste o valor esperado
            com a margem de lucro desejada.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
