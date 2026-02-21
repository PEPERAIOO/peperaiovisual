/**
 * Analisador Inteligente de Gastos - IA Interna
 * Análise avançada de gastos sem dependência de APIs externas
 */

import { format, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transacao {
  valor: number;
  categoria: string;
  data_vencimento?: string;
  data_pagamento?: string;
}

interface GastoDia {
  data: string;
  valor: number;
}

interface GastoCategoria {
  categoria: string;
  valor: number;
  quantidade: number;
}

interface Tendencia {
  direcao: 'crescente' | 'decrescente' | 'estavel';
  percentual: number;
  descricao: string;
}

interface Anomalia {
  data: string;
  valor: number;
  desvio: number;
  tipo: 'alto' | 'baixo';
  descricao: string;
}

interface Previsao {
  diasRestantes: number;
  dataEsgotamento: string;
  gastoDiarioMedio: number;
  alertaUrgencia: 'baixa' | 'media' | 'alta';
}

interface PadraoTemporal {
  diaMaisCaro: string;
  diaMaisBarato: string;
  tendenciaFimDeSemana: string;
}

interface InsightCompleto {
  status: 'Bom' | 'Alerta' | 'Crítico';
  score: number; // 0-100
  analise: string;
  sugestoes: string[];
  tendencia: Tendencia;
  anomalias: Anomalia[];
  previsao: Previsao | null;
  padraoTemporal: PadraoTemporal;
  eficienciaPorCategoria: Array<{
    categoria: string;
    percentual: number;
    status: 'otimo' | 'atencao' | 'critico';
    sugestao: string;
  }>;
  comparativo: {
    primeiraSemana: number;
    ultimaSemana: number;
    variacao: number;
  };
}

export class AnalisadorInteligente {
  private transacoes: Transacao[];
  private totalGasto: number;
  private orcamentoPrevisto: number;
  private gastosPorDia: GastoDia[];
  private gastosPorCategoria: GastoCategoria[];

  constructor(transacoes: Transacao[], orcamentoPrevisto: number = 0) {
    this.transacoes = transacoes.filter(t => t.valor > 0);
    this.orcamentoPrevisto = orcamentoPrevisto;
    this.totalGasto = this.calcularTotal();
    this.gastosPorDia = this.agruparPorDia();
    this.gastosPorCategoria = this.agruparPorCategoria();
  }

  private calcularTotal(): number {
    return this.transacoes.reduce((acc, t) => acc + t.valor, 0);
  }

  private agruparPorDia(): GastoDia[] {
    const dias: Record<string, number> = {};
    
    this.transacoes.forEach(t => {
      const dataStr = t.data_pagamento || t.data_vencimento;
      if (!dataStr) return;
      
      let data: string;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
        data = dataStr;
      } else {
        data = format(parseISO(dataStr), 'yyyy-MM-dd');
      }
      
      dias[data] = (dias[data] || 0) + t.valor;
    });

    return Object.entries(dias)
      .map(([data, valor]) => ({ data, valor }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }

  private agruparPorCategoria(): GastoCategoria[] {
    const categorias: Record<string, { valor: number; quantidade: number }> = {};
    
    this.transacoes.forEach(t => {
      if (!categorias[t.categoria]) {
        categorias[t.categoria] = { valor: 0, quantidade: 0 };
      }
      categorias[t.categoria].valor += t.valor;
      categorias[t.categoria].quantidade += 1;
    });

    return Object.entries(categorias)
      .map(([categoria, data]) => ({
        categoria,
        valor: data.valor,
        quantidade: data.quantidade,
      }))
      .sort((a, b) => b.valor - a.valor);
  }

  // Análise de Tendência
  private analisarTendencia(): Tendencia {
    if (this.gastosPorDia.length < 3) {
      return {
        direcao: 'estavel',
        percentual: 0,
        descricao: 'Dados insuficientes para análise de tendência',
      };
    }

    const metade = Math.floor(this.gastosPorDia.length / 2);
    const primeiraMetade = this.gastosPorDia.slice(0, metade);
    const segundaMetade = this.gastosPorDia.slice(metade);

    const mediaPrimeira = primeiraMetade.reduce((acc, d) => acc + d.valor, 0) / primeiraMetade.length;
    const mediaSegunda = segundaMetade.reduce((acc, d) => acc + d.valor, 0) / segundaMetade.length;

    const variacao = ((mediaSegunda - mediaPrimeira) / mediaPrimeira) * 100;

    let direcao: 'crescente' | 'decrescente' | 'estavel';
    let descricao: string;

    if (variacao > 15) {
      direcao = 'crescente';
      descricao = `Os gastos aumentaram ${variacao.toFixed(1)}% na segunda metade do período. Tendência preocupante!`;
    } else if (variacao < -15) {
      direcao = 'decrescente';
      descricao = `Os gastos diminuíram ${Math.abs(variacao).toFixed(1)}% na segunda metade. Ótimo controle!`;
    } else {
      direcao = 'estavel';
      descricao = `Os gastos estão estáveis, com variação de apenas ${Math.abs(variacao).toFixed(1)}%.`;
    }

    return { direcao, percentual: variacao, descricao };
  }

  // Detecção de Anomalias
  private detectarAnomalias(): Anomalia[] {
    if (this.gastosPorDia.length < 5) return [];

    const valores = this.gastosPorDia.map(d => d.valor);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const desvioPadrao = Math.sqrt(
      valores.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / valores.length
    );

    const anomalias: Anomalia[] = [];

    this.gastosPorDia.forEach(dia => {
      const desvio = Math.abs(dia.valor - media) / desvioPadrao;
      
      if (desvio > 2) { // Mais de 2 desvios padrão = anomalia
        const [year, month, day] = dia.data.split('-');
        const dataFormatada = `${day}/${month}/${year}`;
        
        anomalias.push({
          data: dataFormatada,
          valor: dia.valor,
          desvio: desvio,
          tipo: dia.valor > media ? 'alto' : 'baixo',
          descricao: dia.valor > media
            ? `Gasto anormalmente ALTO de R$ ${dia.valor.toFixed(2)} no dia ${dataFormatada} (${(desvio * 100).toFixed(0)}% acima da média)`
            : `Gasto anormalmente BAIXO de R$ ${dia.valor.toFixed(2)} no dia ${dataFormatada}`,
        });
      }
    });

    return anomalias.slice(0, 3); // Top 3 anomalias
  }

  // Previsão de Esgotamento do Orçamento
  private preverEsgotamento(): Previsao | null {
    if (this.orcamentoPrevisto === 0 || this.gastosPorDia.length === 0) {
      return null;
    }

    const saldoRestante = this.orcamentoPrevisto - this.totalGasto;
    if (saldoRestante <= 0) {
      return {
        diasRestantes: 0,
        dataEsgotamento: 'Orçamento esgotado',
        gastoDiarioMedio: 0,
        alertaUrgencia: 'alta',
      };
    }

    // Calcular média dos últimos 7 dias (ou todos se menos de 7)
    const ultimosDias = this.gastosPorDia.slice(-7);
    const gastoDiarioMedio = ultimosDias.reduce((acc, d) => acc + d.valor, 0) / ultimosDias.length;

    const diasRestantes = Math.floor(saldoRestante / gastoDiarioMedio);
    
    // Estimar data de esgotamento
    const ultimaData = new Date(this.gastosPorDia[this.gastosPorDia.length - 1].data);
    const dataEsgotamento = new Date(ultimaData);
    dataEsgotamento.setDate(dataEsgotamento.getDate() + diasRestantes);
    
    const alertaUrgencia = diasRestantes < 7 ? 'alta' : diasRestantes < 15 ? 'media' : 'baixa';

    return {
      diasRestantes,
      dataEsgotamento: format(dataEsgotamento, 'dd/MM/yyyy', { locale: ptBR }),
      gastoDiarioMedio,
      alertaUrgencia,
    };
  }

  // Análise de Padrão Temporal
  private analisarPadraoTemporal(): PadraoTemporal {
    const diasSemana: Record<string, number[]> = {
      'Domingo': [],
      'Segunda': [],
      'Terça': [],
      'Quarta': [],
      'Quinta': [],
      'Sexta': [],
      'Sábado': [],
    };

    const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    this.gastosPorDia.forEach(d => {
      const date = new Date(d.data + 'T12:00:00'); // Forçar meio-dia para evitar problemas de timezone
      const diaSemana = getDay(date);
      diasSemana[nomesDias[diaSemana]].push(d.valor);
    });

    // Calcular médias por dia da semana
    const medias = Object.entries(diasSemana).map(([dia, valores]) => ({
      dia,
      media: valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0,
    }));

    const diaMaisCaro = medias.reduce((max, curr) => curr.media > max.media ? curr : max, medias[0]);
    const diaMaisBarato = medias.filter(m => m.media > 0).reduce((min, curr) => curr.media < min.media ? curr : min, medias[0]);

    // Análise fim de semana vs semana
    const fimDeSemana = [diasSemana['Sábado'], diasSemana['Domingo']].flat();
    const semana = [diasSemana['Segunda'], diasSemana['Terça'], diasSemana['Quarta'], 
                    diasSemana['Quinta'], diasSemana['Sexta']].flat();

    const mediaFimDeSemana = fimDeSemana.length > 0 ? fimDeSemana.reduce((a, b) => a + b, 0) / fimDeSemana.length : 0;
    const mediaSemana = semana.length > 0 ? semana.reduce((a, b) => a + b, 0) / semana.length : 0;

    let tendenciaFimDeSemana = 'Não há padrão claro';
    if (mediaFimDeSemana > mediaSemana * 1.2) {
      tendenciaFimDeSemana = 'Gastos significativamente maiores no fim de semana';
    } else if (mediaSemana > mediaFimDeSemana * 1.2) {
      tendenciaFimDeSemana = 'Gastos concentrados nos dias úteis';
    } else {
      tendenciaFimDeSemana = 'Gastos equilibrados entre semana e fim de semana';
    }

    return {
      diaMaisCaro: diaMaisCaro.dia,
      diaMaisBarato: diaMaisBarato.dia,
      tendenciaFimDeSemana,
    };
  }

  // Análise de Eficiência por Categoria
  private analisarEficienciaCategorias() {
    const limitesPorCategoria: Record<string, number> = {
      'Material': 0.40, // Máximo 40% do total
      'Mão de Obra': 0.35, // Máximo 35%
      'Equipamento': 0.15,
      'Outros': 0.10,
    };

    return this.gastosPorCategoria.map(cat => {
      const percentual = (cat.valor / this.totalGasto) * 100;
      const limiteIdeal = limitesPorCategoria[cat.categoria] || 0.20;
      const limitePercentual = limiteIdeal * 100;

      let status: 'otimo' | 'atencao' | 'critico';
      let sugestao: string;

      if (percentual <= limitePercentual) {
        status = 'otimo';
        sugestao = `${cat.categoria} está dentro do ideal (${percentual.toFixed(1)}% vs máx. ${limitePercentual}%)`;
      } else if (percentual <= limitePercentual * 1.2) {
        status = 'atencao';
        sugestao = `${cat.categoria} está ${(percentual - limitePercentual).toFixed(1)}% acima do ideal. Monitore de perto.`;
      } else {
        status = 'critico';
        sugestao = `${cat.categoria} está ${(percentual - limitePercentual).toFixed(1)}% ACIMA do recomendado! Revise urgentemente.`;
      }

      return { categoria: cat.categoria, percentual, status, sugestao };
    });
  }

  // Comparativo de Períodos
  private compararPeriodos() {
    if (this.gastosPorDia.length < 14) {
      return { primeiraSemana: 0, ultimaSemana: 0, variacao: 0 };
    }

    const primeiros7 = this.gastosPorDia.slice(0, 7);
    const ultimos7 = this.gastosPorDia.slice(-7);

    const totalPrimeiraSemana = primeiros7.reduce((acc, d) => acc + d.valor, 0);
    const totalUltimaSemana = ultimos7.reduce((acc, d) => acc + d.valor, 0);

    const variacao = ((totalUltimaSemana - totalPrimeiraSemana) / totalPrimeiraSemana) * 100;

    return {
      primeiraSemana: totalPrimeiraSemana,
      ultimaSemana: totalUltimaSemana,
      variacao,
    };
  }

  // Gerar Score de Saúde Financeira (0-100)
  private calcularScore(): number {
    let score = 100;

    // Penalizar se passou do orçamento
    if (this.orcamentoPrevisto > 0) {
      const percentualGasto = (this.totalGasto / this.orcamentoPrevisto) * 100;
      if (percentualGasto > 100) score -= 40;
      else if (percentualGasto > 90) score -= 25;
      else if (percentualGasto > 75) score -= 15;
      else if (percentualGasto > 60) score -= 5;
    }

    // Penalizar tendência crescente
    const tendencia = this.analisarTendencia();
    if (tendencia.direcao === 'crescente' && tendencia.percentual > 20) score -= 15;
    else if (tendencia.direcao === 'crescente' && tendencia.percentual > 10) score -= 10;

    // Bonificar tendência decrescente
    if (tendencia.direcao === 'decrescente') score += 10;

    // Penalizar anomalias
    const anomalias = this.detectarAnomalias();
    score -= anomalias.length * 5;

    // Penalizar desbalanceamento de categorias
    const eficiencia = this.analisarEficienciaCategorias();
    const categoriasCriticas = eficiencia.filter(e => e.status === 'critico').length;
    score -= categoriasCriticas * 10;

    return Math.max(0, Math.min(100, score));
  }

  // Análise Completa
  public analisar(): InsightCompleto {
    const score = this.calcularScore();
    const tendencia = this.analisarTendencia();
    const anomalias = this.detectarAnomalias();
    const previsao = this.preverEsgotamento();
    const padraoTemporal = this.analisarPadraoTemporal();
    const eficienciaPorCategoria = this.analisarEficienciaCategorias();
    const comparativo = this.compararPeriodos();

    // Determinar status
    let status: 'Bom' | 'Alerta' | 'Crítico';
    if (score >= 70) status = 'Bom';
    else if (score >= 40) status = 'Alerta';
    else status = 'Crítico';

    // Gerar análise textual
    const percentualOrcamento = this.orcamentoPrevisto > 0 
      ? (this.totalGasto / this.orcamentoPrevisto) * 100 
      : 0;

    let analise = '';
    
    if (status === 'Crítico') {
      analise = `🔴 SITUAÇÃO CRÍTICA (Score: ${score}/100): `;
      if (percentualOrcamento > 100) {
        analise += `O orçamento foi ultrapassado em ${(percentualOrcamento - 100).toFixed(1)}%. `;
      }
      analise += `${tendencia.descricao} `;
      if (anomalias.length > 0) {
        analise += `Detectadas ${anomalias.length} anomalia(s) significativa(s) nos gastos. `;
      }
      analise += `A categoria "${this.gastosPorCategoria[0]?.categoria}" representa ${((this.gastosPorCategoria[0]?.valor / this.totalGasto) * 100).toFixed(1)}% do total.`;
    } else if (status === 'Alerta') {
      analise = `🟡 ATENÇÃO NECESSÁRIA (Score: ${score}/100): `;
      analise += `A obra utilizou ${percentualOrcamento.toFixed(1)}% do orçamento previsto. `;
      analise += `${tendencia.descricao} `;
      if (comparativo.variacao > 20) {
        analise += `Os gastos da última semana aumentaram ${comparativo.variacao.toFixed(1)}% em relação à primeira semana. `;
      }
    } else {
      analise = `🟢 SITUAÇÃO SAUDÁVEL (Score: ${score}/100): `;
      analise += `A obra está bem gerenciada, com ${percentualOrcamento.toFixed(1)}% do orçamento utilizado. `;
      analise += `${tendencia.descricao} `;
      analise += `A distribuição de gastos entre categorias está equilibrada.`;
    }

    // Gerar sugestões
    const sugestoes: string[] = [];

    if (percentualOrcamento > 90) {
      sugestoes.push('🚨 URGENTE: Interrompa gastos não essenciais imediatamente');
      sugestoes.push('📋 Revise o escopo da obra com o cliente para possível aditivo');
    } else if (percentualOrcamento > 75) {
      sugestoes.push('⚠️ Monitore todos os gastos diariamente');
      sugestoes.push('💰 Busque alternativas mais econômicas para materiais restantes');
    }

    if (tendencia.direcao === 'crescente' && tendencia.percentual > 15) {
      sugestoes.push('📉 Implemente controle rígido de gastos - tendência de aumento detectada');
    }

    anomalias.forEach(a => {
      if (a.tipo === 'alto') {
        sugestoes.push(`🔍 Investigue o gasto anormal de ${a.data}: R$ ${a.valor.toFixed(2)}`);
      }
    });

    eficienciaPorCategoria.filter(e => e.status === 'critico').forEach(e => {
      sugestoes.push(`📊 ${e.sugestao}`);
    });

    if (previsao && previsao.alertaUrgencia === 'alta') {
      sugestoes.push(`⏰ Orçamento estimado para esgotar em ${previsao.diasRestantes} dias (${previsao.dataEsgotamento})`);
    }

    if (padraoTemporal.diaMaisCaro && this.gastosPorDia.length > 7) {
      sugestoes.push(`📅 Padrão identificado: gastos maiores às ${padraoTemporal.diaMaisCaro}s`);
    }

    if (sugestoes.length === 0) {
      sugestoes.push('✅ Continue o planejamento atual e mantenha o registro detalhado');
      sugestoes.push('📊 Use os dados desta obra como referência para futuros orçamentos');
    }

    return {
      status,
      score,
      analise,
      sugestoes,
      tendencia,
      anomalias,
      previsao,
      padraoTemporal,
      eficienciaPorCategoria,
      comparativo,
    };
  }
}

// Função helper para usar diretamente
export function analisarGastos(transacoes: Transacao[], orcamentoPrevisto: number = 0): InsightCompleto {
  const analisador = new AnalisadorInteligente(transacoes, orcamentoPrevisto);
  return analisador.analisar();
}
