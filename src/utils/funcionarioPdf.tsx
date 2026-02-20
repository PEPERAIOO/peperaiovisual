import { pdf } from '@react-pdf/renderer';
import RelatorioFuncionarioPDF, { RelatorioFuncionarioData } from '../components/funcionarios/RelatorioFuncionarioPDF';

export const downloadFuncionarioPdf = async (data: RelatorioFuncionarioData, fileName: string) => {
  const blob = await pdf(<RelatorioFuncionarioPDF data={data} />).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 0);
};
