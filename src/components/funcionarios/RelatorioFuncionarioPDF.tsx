import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface RelatorioFuncionarioPagamento {
  data: string;
  descricao: string;
  valor: number;
  obra?: string;
}

export interface RelatorioFuncionarioPresenca {
  data: string;
  trabalhou: boolean;
  observacao?: string;
}

export interface RelatorioFuncionarioData {
  funcionarioNome: string;
  mesLabel: string;
  totalPago: number;
  pagamentos: RelatorioFuncionarioPagamento[];
  presencas: RelatorioFuncionarioPresenca[];
  obras: string[];
  geradoEm: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#111111',
    color: '#f5f5f5',
    fontFamily: 'Helvetica',
    padding: 32,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 11,
    color: '#cfcfcf',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#2f2f2f',
    fontSize: 9,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#ffffff',
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1b1b1b',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2b2b2b',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
  colDate: { flex: 1.2 },
  colDesc: { flex: 2.2 },
  colObra: { flex: 2 },
  colValor: { flex: 1, textAlign: 'right' },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#f5f5f5',
  },
  cellText: {
    fontSize: 9,
    color: '#d6d6d6',
  },
  highlight: {
    color: '#ce2b37',
    fontWeight: 'bold',
  },
  small: {
    fontSize: 9,
    color: '#bdbdbd',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#888',
  },
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const RelatorioFuncionarioPDF: React.FC<{ data: RelatorioFuncionarioData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatório Mensal do Funcionário</Text>
        <Text style={styles.subtitle}>{data.funcionarioNome} • {data.mesLabel}</Text>
        <View style={styles.chipRow}>
          <Text style={styles.chip}>Total pago: {formatCurrency(data.totalPago)}</Text>
          <Text style={styles.chip}>Diárias pagas: {data.pagamentos.length}</Text>
          <Text style={styles.chip}>Presenças: {data.presencas.length}</Text>
        </View>
        <Text style={[styles.subtitle, { marginTop: 6 }]}>Gerado em {data.geradoEm}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Obras atendidas no mês</Text>
        <Text style={styles.small}>{data.obras.length ? data.obras.join(' • ') : 'Nenhuma obra vinculada'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diárias pagas</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDate]}>Data</Text>
            <Text style={[styles.headerText, styles.colDesc]}>Descrição</Text>
            <Text style={[styles.headerText, styles.colObra]}>Obra</Text>
            <Text style={[styles.headerText, styles.colValor]}>Valor</Text>
          </View>
          {data.pagamentos.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colDesc]}>Nenhuma diária paga no período.</Text>
            </View>
          ) : (
            data.pagamentos.map((p, idx) => (
              <View key={`${p.data}-${idx}`} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.colDate]}>{p.data}</Text>
                <Text style={[styles.cellText, styles.colDesc]}>{p.descricao}</Text>
                <Text style={[styles.cellText, styles.colObra]}>{p.obra || '-'}</Text>
                <Text style={[styles.cellText, styles.colValor, styles.highlight]}>{formatCurrency(p.valor)}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Presenças e observações</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDate]}>Data</Text>
            <Text style={[styles.headerText, styles.colDesc]}>Status</Text>
            <Text style={[styles.headerText, styles.colObra]}>Observação</Text>
          </View>
          {data.presencas.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.cellText, styles.colDesc]}>Nenhum registro de presença no período.</Text>
            </View>
          ) : (
            data.presencas.map((p, idx) => (
              <View key={`${p.data}-${idx}`} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.colDate]}>{p.data}</Text>
                <Text style={[styles.cellText, styles.colDesc]}>{p.trabalhou ? 'Trabalhou' : 'Não trabalhou'}</Text>
                <Text style={[styles.cellText, styles.colObra]}>{p.observacao || '-'}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <Text style={styles.footer}>PEPERAIO • Gestão de Funcionários</Text>
    </Page>
  </Document>
);

export default RelatorioFuncionarioPDF;
