import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction, FinanceiroSummary } from '../types/financeiro';
import RelatorioFinanceiroPDF, { RelatorioFinanceiroData } from '../components/financeiro/RelatorioFinanceiroPDF';

interface ExportPdfOptions {
  transactions: Transaction[];
  summary: FinanceiroSummary;
  monthLabel: string;
  userName: string;
}

export const exportFinanceiroPdf = async (options: ExportPdfOptions) => {
  const { transactions, summary, monthLabel, userName } = options;

  // Preparar dados para o PDF
  const data: RelatorioFinanceiroData = {
    transactions,
    monthLabel,
    totalReceitas: summary.totalReceitas,
    totalDespesas: summary.totalDespesas,
    saldo: summary.saldo,
    geradoPor: userName,
    dataGeracao: format(new Date(), 'dd/MM/yyyy', { locale: ptBR }),
    horaGeracao: format(new Date(), 'HH:mm', { locale: ptBR }),
  };

  // Gerar PDF
  const blob = await pdf(<RelatorioFinanceiroPDF data={data} />).toBlob();

  // Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Relatorio-Financeiro-${monthLabel.replace(/ /g, '-')}.pdf`;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export default exportFinanceiroPdf;
