import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AutoAwesome as AIIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { AreaChart, DonutChart, Card, Grid } from '@tremor/react';
import { analisarGastos } from '../../utils/analisadorInteligente';

interface TransacaoObra {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  status: string;
  categoria: string;
  data_vencimento?: string;
  data_pagamento?: string;
}

interface Obra {
  id: string;
  nome: string;
  orcamento_previsto?: number;
  valor_total?: number;
}

interface InsightIA {
  status: 'Bom' | 'Alerta' | 'Crítico';
  analise: string;
  sugestao: string;
}

interface InsightsObraProps {
  obra: Obra;
  transacoes: TransacaoObra[];
}

const InsightsObra = ({ obra, transacoes }: InsightsObraProps) => {
  const [insightIA, setInsightIA] = useState<InsightIA | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [errorIA, setErrorIA] = useState<string | null>(null);

  // Filtrar apenas despesas pagas
  const despesas = useMemo(() => 
    transacoes.filter(t => t.tipo === 'despesa' && t.status === 'pago'),
    [transacoes]
  );

  // Total gasto
  const totalGasto = useMemo(() => 
    despesas.reduce((acc, t) => acc + t.valor, 0),
    [despesas]
  );

  // Agrupar por categoria
  const gastoPorCategoria = useMemo(() => {
    const categorias: Record<string, number> = {};
    despesas.forEach(t => {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valor;
    });
    return Object.entries(categorias)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [despesas]);

  // Agrupar por dia
  const gastoPorDia = useMemo(() => {
    const dias: Record<string, number> = {};
    
    despesas.forEach(t => {
      // Usar data_pagamento se disponível, senão data_vencimento
      const dataStr = t.data_pagamento || t.data_vencimento;
      if (!dataStr) return;
      
      // Garantir que a data seja tratada corretamente (sem conversão UTC)
      let data: string;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
        // Formato YYYY-MM-DD - usar diretamente
        data = dataStr;
      } else {
        // Outros formatos - fazer parse
        data = format(parseISO(dataStr), 'yyyy-MM-dd');
      }
      
      dias[data] = (dias[data] || 0) + t.valor;
    });

    // Ordenar por data e formatar para o gráfico
    return Object.entries(dias)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, valor]) => {
        // Formatar data para exibição (dd/MM)
        const [year, month, day] = data.split('-');
        return {
          data: `${day}/${month}`,
          dataCompleta: data,
          Gasto: valor,
        };
      });
  }, [despesas]);

  // Últimos 7 dias para enviar para IA
  const ultimos7Dias = useMemo(() => 
    gastoPorDia.slice(-7).map(d => ({
      data: d.dataCompleta,
      valor: d.Gasto,
    })),
    [gastoPorDia]
  );

  // Resumo para IA
  const resumoParaIA = useMemo(() => ({
    resumo_obra: {
      nome_obra: obra.nome,
      total_gasto: totalGasto,
      orcamento_previsto: obra.orcamento_previsto || 0,
      percentual_usado: obra.orcamento_previsto 
        ? (totalGasto / obra.orcamento_previsto) * 100 
        : 0,
      categorias: Object.fromEntries(
        gastoPorCategoria.map(c => [c.name, c.value])
      ),
      ultimos_7_dias: ultimos7Dias,
      total_transacoes: despesas.length,
    }
  }), [obra, totalGasto, gastoPorCategoria, ultimos7Dias, despesas.length]);

  // Obter insights ao montar o componente
  useEffect(() => {
    if (despesas.length > 0) {
      obterInsightsIA();
    }
  }, [despesas.length]);

  // Função para obter insights da IA INTERNA
  const obterInsightsIA = async () => {
    setLoadingIA(true);
    setErrorIA(null);
    
    try {
      // Simular pequeno delay para dar feedback visual
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Usar IA interna para análise completa
      const resultado = analisarGastos(despesas, obra.orcamento_previsto || 0);
      
      setInsightIA({
        status: resultado.status,
        analise: resultado.analise,
        sugestao: resultado.sugestoes.join(' • '),
      });
      
    } catch (err) {
      console.error('Erro ao obter insights:', err);
      setErrorIA('Não foi possível gerar insights');
    } finally {
      setLoadingIA(false);
    }
  };

  // Cores do status
  const statusConfig = {
    Bom: { color: '#4caf50', icon: CheckIcon, bg: 'rgba(76, 175, 80, 0.1)' },
    Alerta: { color: '#ff9800', icon: WarningIcon, bg: 'rgba(255, 152, 0, 0.1)' },
    Crítico: { color: '#f44336', icon: ErrorIcon, bg: 'rgba(244, 67, 54, 0.1)' },
  };

  // Calcular percentual do orçamento
  const percentualOrcamento = obra.orcamento_previsto 
    ? (totalGasto / obra.orcamento_previsto) * 100 
    : 0;

  const corProgressoOrcamento = percentualOrcamento > 90 
    ? '#f44336' 
    : percentualOrcamento > 70 
    ? '#ff9800' 
    : '#4caf50';

  if (despesas.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Não há gastos registrados ainda para gerar insights.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AIIcon sx={{ color: '#2196f3', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f5f5f5' }}>
            Insights de IA
          </Typography>
        </Box>
        <Tooltip title="Atualizar insights">
          <IconButton onClick={obterInsightsIA} disabled={loadingIA}>
            <RefreshIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-4">
        {/* Gráfico de Evolução por Dia */}
        <Card className="glassmorphism">
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#f5f5f5' }}>
            📈 Evolução dos Gastos
          </Typography>
          <AreaChart
            data={gastoPorDia}
            index="data"
            categories={["Gasto"]}
            colors={["emerald"]}
            valueFormatter={(value) => 
              new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(value)
            }
            showLegend={false}
            showGridLines={false}
            className="h-72"
          />
        </Card>

        {/* Gráfico de Distribuição por Categoria */}
        <Card className="glassmorphism">
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#f5f5f5' }}>
            🎯 Distribuição por Categoria
          </Typography>
          <DonutChart
            data={gastoPorCategoria}
            category="value"
            index="name"
            valueFormatter={(value) => 
              new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(value)
            }
            colors={["emerald", "blue", "amber", "rose", "indigo", "cyan"]}
            className="h-72"
          />
        </Card>

        {/* Insights da IA */}
        <Card className="glassmorphism">
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#f5f5f5' }}>
            🤖 Análise Inteligente
          </Typography>
          
          {loadingIA ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress size={40} sx={{ color: '#2196f3' }} />
            </Box>
          ) : errorIA ? (
            <Alert severity="error">{errorIA}</Alert>
          ) : insightIA ? (
            <Box>
              {/* Status */}
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: statusConfig[insightIA.status].bg,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                {(() => {
                  const Icon = statusConfig[insightIA.status].icon;
                  return <Icon sx={{ color: statusConfig[insightIA.status].color, fontSize: 28 }} />;
                })()}
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Status
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      color: statusConfig[insightIA.status].color 
                    }}
                  >
                    {insightIA.status}
                  </Typography>
                </Box>
              </Box>

              {/* Análise */}
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant="caption" 
                  sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, mb: 0.5, display: 'block' }}
                >
                  📊 Análise
                </Typography>
                <Typography variant="body2" sx={{ color: '#f5f5f5', lineHeight: 1.6 }}>
                  {insightIA.analise}
                </Typography>
              </Box>

              {/* Sugestão */}
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(33, 150, 243, 0.1)',
                  border: '1px solid rgba(33, 150, 243, 0.2)',
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ color: '#2196f3', fontWeight: 600, mb: 1, display: 'block' }}
                >
                  💡 Sugestões
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {insightIA.sugestao.split(' • ').map((sug, idx) => (
                    <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                      <ListItemText 
                        primary={sug}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: { color: '#f5f5f5', lineHeight: 1.5, fontSize: '0.875rem' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          ) : null}
        </Card>
      </Grid>

      {/* Comparativo com Orçamento */}
      {obra.orcamento_previsto && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            background: 'rgba(30, 30, 30, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f5f5f5' }}>
              💰 Orçamento vs Gasto Real
            </Typography>
            <Chip 
              label={`${percentualOrcamento.toFixed(1)}% utilizado`}
              sx={{ 
                bgcolor: corProgressoOrcamento, 
                color: '#fff',
                fontWeight: 700,
              }}
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Gasto Real
              </Typography>
              <Typography variant="body2" sx={{ color: '#f5f5f5', fontWeight: 600 }}>
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(totalGasto)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Orçamento Previsto
              </Typography>
              <Typography variant="body2" sx={{ color: '#f5f5f5', fontWeight: 600 }}>
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(obra.orcamento_previsto)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Saldo Disponível
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: obra.orcamento_previsto - totalGasto > 0 ? '#4caf50' : '#f44336',
                  fontWeight: 600 
                }}
              >
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(obra.orcamento_previsto - totalGasto)}
              </Typography>
            </Box>
          </Box>

          <LinearProgress 
            variant="determinate" 
            value={Math.min(percentualOrcamento, 100)}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: corProgressoOrcamento,
                borderRadius: 6,
              }
            }}
          />
          
          {percentualOrcamento > 90 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              ⚠️ ATENÇÃO: A obra ultrapassou 90% do orçamento previsto!
            </Alert>
          )}
        </Paper>
      )}

      <style>{`
        .glassmorphism {
          background: rgba(30, 30, 30, 0.6) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 16px !important;
          padding: 20px;
        }
      `}</style>
    </Box>
  );
};

export default InsightsObra;
