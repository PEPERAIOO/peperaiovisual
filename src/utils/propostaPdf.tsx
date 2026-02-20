import { pdf } from '@react-pdf/renderer';
import PropostaPDF, { PropostaData } from '../components/propostas/PropostaPDF';

export const downloadPropostaPdf = async (
  data: PropostaData,
  fileName: string,
  theme: 'dark' | 'light' = 'dark'
) => {
  const blob = await pdf(<PropostaPDF data={data} theme={theme} />).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  // Solta o blob depois de um tick para garantir download em alguns browsers
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
