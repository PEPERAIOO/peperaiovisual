import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Transaction } from '../../types/financeiro';

// =============================================================================
// TIPOS
// =============================================================================

export interface RelatorioFinanceiroData {
  mes: string;
  ano: string;
  transacoes: Transaction[];
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  geradoPor: string;
  dataGeracao: string;
  horaGeracao: string;
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const mesesAbreviados = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// =============================================================================
// ESTILOS - Tema Italiano Escuro
// =============================================================================

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#181818',
    color: '#E0E0E0',
    fontFamily: 'Helvetica',
    padding: 0,
  },
  contentContainer: {
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 100,
  },

  // HEADER
  header: {
    marginBottom: 25,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stripesWrapper: {
    flexDirection: 'column',
    marginTop: 8,
    gap: 3,
  },
  stripeGreen: { height: 4, backgroundColor: '#009B3A' },
  stripeWhite: { height: 4, backgroundColor: '#FFFFFF' },
  stripeRed: { height: 4, backgroundColor: '#CF2734' },

  // TÍTULO DO RELATÓRIO
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  reportPeriod: {
    fontSize: 12,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 30,
  },

  // INFORMAÇÕES DE GERAÇÃO
  infoBox: {
    backgroundColor: '#222222',
    padding: 12,
    borderRadius: 4,
    marginBottom: 25,
    borderLeft: 3,
    borderLeftColor: '#C8E600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: '#888888',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // RESUMO FINANCEIRO
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#222222',
    padding: 15,
    borderRadius: 4,
    borderTop: 3,
  },
  summaryCardReceita: {
    borderTopColor: '#009B3A',
  },
  summaryCardDespesa: {
    borderTopColor: '#CF2734',
  },
  summaryCardSaldo: {
    borderTopColor: '#C8E600',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // TABELA
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginBottom: 15,
    marginTop: 10,
    letterSpacing: 1,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tableRowAlt: {
    backgroundColor: '#1E1E1E',
  },
  tableCell: {
    fontSize: 8,
    color: '#CCCCCC',
  },
  tableCellBold: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // COLUNAS DA TABELA
  colData: { width: '12%' },
  colDescricao: { width: '40%' },
  colCategoria: { width: '18%' },
  colValor: { width: '15%', textAlign: 'right' },
  colUsuario: { width: '15%' },

  // RODAPÉ
  pageFooter: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageFooterText: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 1,
    textAlign: 'center',
  },
  pageFooterBold: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // ASSINATURA
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  signatureText: {
    fontSize: 9,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 5,
  },
});

// =============================================================================
// COMPONENTE
// =============================================================================

const RelatorioFinanceiroPDF: React.FC<{ data: RelatorioFinanceiroData }> = ({ data }) => {
  const mesNome = data.mes ? mesesAbreviados[parseInt(data.mes) - 1] : '';
  
  // Agrupar transações por categoria
  const receitasPorCategoria: Record<string, number> = {};
  const despesasPorCategoria: Record<string, number> = {};
  
  data.transacoes.forEach(t => {
    if (t.tipo === 'receita') {
      receitasPorCategoria[t.categoria] = (receitasPorCategoria[t.categoria] || 0) + t.valor;
    } else {
      despesasPorCategoria[t.categoria] = (despesasPorCategoria[t.categoria] || 0) + t.valor;
    }
  });

  const Footer = () => (
    <View style={styles.pageFooter} fixed>
      <Text style={styles.pageFooterBold}>PEPERAIO</Text>
      <Text style={styles.pageFooterText}>Relatório Financeiro</Text>
      <Text style={styles.pageFooterText} render={({ pageNumber, totalPages }) => (
        `Página ${pageNumber} de ${totalPages}`
      )} />
    </View>
  );

  return (
    <Document>
      {/* PÁGINA 1: RESUMO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logoText}>PEPERAIO</Text>
            <View style={styles.stripesWrapper}>
              <View style={styles.stripeGreen} />
              <View style={styles.stripeWhite} />
              <View style={styles.stripeRed} />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.reportTitle}>Relatório Financeiro</Text>
          <Text style={styles.reportPeriod}>
            Período: {mesNome}/{data.ano}
          </Text>

          {/* Informações de Geração */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gerado por:</Text>
              <Text style={styles.infoValue}>{data.geradoPor}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data de Geração:</Text>
              <Text style={styles.infoValue}>{data.dataGeracao}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hora de Geração:</Text>
              <Text style={styles.infoValue}>{data.horaGeracao}</Text>
            </View>
          </View>

          {/* Resumo Financeiro */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, styles.summaryCardReceita]}>
              <Text style={styles.summaryLabel}>Total Receitas</Text>
              <Text style={styles.summaryValue}>{formatCurrency(data.totalReceitas)}</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardDespesa]}>
              <Text style={styles.summaryLabel}>Total Despesas</Text>
              <Text style={styles.summaryValue}>{formatCurrency(data.totalDespesas)}</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardSaldo]}>
              <Text style={styles.summaryLabel}>Saldo</Text>
              <Text style={styles.summaryValue}>{formatCurrency(data.saldo)}</Text>
            </View>
          </View>

          {/* Receitas por Categoria */}
          {Object.keys(receitasPorCategoria).length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Receitas por Categoria</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { width: '70%' }]}>Categoria</Text>
                  <Text style={[styles.tableHeaderText, { width: '30%', textAlign: 'right' }]}>Valor</Text>
                </View>
                {Object.entries(receitasPorCategoria).map(([cat, val], idx) => (
                  <View key={cat} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '70%' }]}>{cat}</Text>
                    <Text style={[styles.tableCellBold, { width: '30%', textAlign: 'right' }]}>
                      {formatCurrency(val)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Despesas por Categoria */}
          {Object.keys(despesasPorCategoria).length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Despesas por Categoria</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { width: '70%' }]}>Categoria</Text>
                  <Text style={[styles.tableHeaderText, { width: '30%', textAlign: 'right' }]}>Valor</Text>
                </View>
                {Object.entries(despesasPorCategoria).map(([cat, val], idx) => (
                  <View key={cat} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '70%' }]}>{cat}</Text>
                    <Text style={[styles.tableCellBold, { width: '30%', textAlign: 'right' }]}>
                      {formatCurrency(val)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
        <Footer />
      </Page>

      {/* PÁGINA 2+: DETALHAMENTO DAS TRANSAÇÕES */}
      <Page size="A4" style={styles.page}>
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logoText}>PEPERAIO</Text>
            <View style={styles.stripesWrapper}>
              <View style={styles.stripeGreen} />
              <View style={styles.stripeWhite} />
              <View style={styles.stripeRed} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Detalhamento de Transações</Text>

          {/* Tabela de Transações */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colData]}>Data</Text>
              <Text style={[styles.tableHeaderText, styles.colDescricao]}>Descrição</Text>
              <Text style={[styles.tableHeaderText, styles.colCategoria]}>Categoria</Text>
              <Text style={[styles.tableHeaderText, styles.colValor]}>Valor</Text>
              <Text style={[styles.tableHeaderText, styles.colUsuario]}>Usuário</Text>
            </View>
            
            {data.transacoes.map((transacao, idx) => (
              <View key={transacao.id} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                <Text style={[styles.tableCell, styles.colData]}>
                  {formatDate(transacao.data_pagamento || transacao.data_vencimento || '')}
                </Text>
                <Text style={[styles.tableCell, styles.colDescricao]}>
                  {transacao.descricao}
                </Text>
                <Text style={[styles.tableCell, styles.colCategoria]}>
                  {transacao.categoria}
                </Text>
                <Text style={[
                  styles.tableCellBold, 
                  styles.colValor,
                  { color: transacao.tipo === 'receita' ? '#009B3A' : '#CF2734' }
                ]}>
                  {transacao.tipo === 'receita' ? '+' : '-'} {formatCurrency(transacao.valor)}
                </Text>
                <Text style={[styles.tableCell, styles.colUsuario]}>
                  {transacao.user_nome || '-'}
                </Text>
              </View>
            ))}
          </View>

          {/* Assinatura */}
          <View style={styles.signatureSection}>
            <Text style={styles.signatureText}>
              Documento gerado eletronicamente por {data.geradoPor}
            </Text>
            <Text style={styles.signatureText}>
              {data.dataGeracao} às {data.horaGeracao}
            </Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
};

export default RelatorioFinanceiroPDF;
