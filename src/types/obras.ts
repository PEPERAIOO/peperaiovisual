// Status possíveis da obra (conforme ENUM status_obra do Supabase)
export type ObraStatus = 'orcamento' | 'aprovada' | 'em_andamento' | 'concluida' | 'cancelada';

// Interface principal de Obra (conforme schema Supabase)
export interface Obra {
  id: string;
  user_id?: string;
  cliente_id?: string | null;
  cliente?: {
    id: string;
    nome: string;
  };
  nome: string;
  descricao?: string;
  status: ObraStatus;
  data_inicio?: string;
  data_previsao?: string; // Nome correto no Supabase
  data_conclusao?: string; // Nome correto no Supabase
  valor_total_orcamento: number; // Nome correto no Supabase
  // valor_gasto é CALCULADO em tempo real (SUM de transacoes onde obra_id = this.id e tipo = 'despesa')
  valor_gasto?: number; // Propriedade computada, não vem do banco
  created_at: string;
}

// Interface para Obra com custo calculado (usado nas queries)
export interface ObraComCusto extends Obra {
  custo_total: number; // SUM(transacoes.valor) WHERE obra_id = X AND tipo = 'despesa'
}

// Configuração visual por status
export const OBRA_STATUS_CONFIG: Record<
  ObraStatus,
  { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error'; bgColor: string; textColor: string }
> = {
  orcamento: {
    label: 'Orçamento',
    color: 'default',
    bgColor: 'rgba(158, 158, 158, 0.15)',
    textColor: '#9e9e9e',
  },
  aprovada: {
    label: 'Aprovada',
    color: 'info',
    bgColor: 'rgba(33, 150, 243, 0.15)',
    textColor: '#2196f3',
  },
  em_andamento: {
    label: 'Em Andamento',
    color: 'warning',
    bgColor: 'rgba(255, 152, 0, 0.15)',
    textColor: '#ff9800',
  },
  concluida: {
    label: 'Concluída',
    color: 'success',
    bgColor: 'rgba(0, 146, 70, 0.15)',
    textColor: '#009246',
  },
  cancelada: {
    label: 'Cancelada',
    color: 'error',
    bgColor: 'rgba(206, 43, 55, 0.15)',
    textColor: '#ce2b37',
  },
};

// Helper para calcular progresso financeiro
export const calcularProgressoFinanceiro = (gasto: number, orcamento: number): number => {
  if (orcamento <= 0) return 0;
  return Math.round((gasto / orcamento) * 100);
};

// Helper para verificar se está atrasado
export const isAtrasado = (dataPrevisao: string | undefined, status: ObraStatus): boolean => {
  if (!dataPrevisao || status === 'concluida' || status === 'cancelada') return false;
  const hoje = new Date();
  const previsao = new Date(dataPrevisao);
  return hoje > previsao;
};

// Helper para formatar moeda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Helper para formatar data
export const formatDate = (date: string | undefined): string => {
  if (!date) return '-';
  // Se a data está no formato YYYY-MM-DD, usar diretamente sem conversão UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
  // Para outros formatos, usar toLocaleDateString
  return new Date(date).toLocaleDateString('pt-BR');
};
