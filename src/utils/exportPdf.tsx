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
  const monthPart = (monthLabel.split(' de ')[0] || '').toLowerCase().trim();
  const normalizedMonth = monthPart.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const monthMap: Record<string, string> = {
    janeiro: '01',
    fevereiro: '02',
    marco: '03',
    abril: '04',
    maio: '05',
    junho: '06',
    julho: '07',
    agosto: '08',
    setembro: '09',
    outubro: '10',
    novembro: '11',
    dezembro: '12',
  };
  const mesNumero = monthMap[normalizedMonth] || format(new Date(), 'MM', { locale: ptBR });
  const anoNumero = monthLabel.split(' ').pop() || format(new Date(), 'yyyy', { locale: ptBR });

  // Preparar dados para o PDF
  const data: RelatorioFinanceiroData = {
    transacoes: transactions,
    mes: mesNumero,
    ano: anoNumero,
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
