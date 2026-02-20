// Tipos para o módulo de Calendário/Compromissos

export type CompromissoTipo = 'reuniao' | 'visita' | 'entrega' | 'pagamento' | 'prazo' | 'outro';
export type CompromissoPrioridade = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Compromisso {
  id: string;
  user_id?: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  tipo: CompromissoTipo;
  prioridade: CompromissoPrioridade;
  obra_id?: string;
  obra?: {
    id: string;
    nome: string;
  };
  concluido: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CompromissoInsert {
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  tipo: CompromissoTipo;
  prioridade: CompromissoPrioridade;
  obra_id?: string;
  concluido?: boolean;
}

// Configuração visual por tipo
export const COMPROMISSO_TIPO_CONFIG: Record<
  CompromissoTipo,
  { label: string; icon: string; color: string; bgColor: string }
> = {
  reuniao: {
    label: 'Reunião',
    icon: '👥',
    color: '#2196f3',
    bgColor: 'rgba(33, 150, 243, 0.15)',
  },
  visita: {
    label: 'Visita',
    icon: '🏠',
    color: '#009246',
    bgColor: 'rgba(0, 146, 70, 0.15)',
  },
  entrega: {
    label: 'Entrega',
    icon: '📦',
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.15)',
  },
  pagamento: {
    label: 'Pagamento',
    icon: '💰',
    color: '#ce2b37',
    bgColor: 'rgba(206, 43, 55, 0.15)',
  },
  prazo: {
    label: 'Prazo',
    icon: '⏰',
    color: '#9c27b0',
    bgColor: 'rgba(156, 39, 176, 0.15)',
  },
  outro: {
    label: 'Outro',
    icon: '📌',
    color: '#607d8b',
    bgColor: 'rgba(96, 125, 138, 0.15)',
  },
};

// Configuração visual por prioridade
export const COMPROMISSO_PRIORIDADE_CONFIG: Record<
  CompromissoPrioridade,
  { label: string; color: string; bgColor: string }
> = {
  baixa: {
    label: 'Baixa',
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.15)',
  },
  media: {
    label: 'Média',
    color: '#2196f3',
    bgColor: 'rgba(33, 150, 243, 0.15)',
  },
  alta: {
    label: 'Alta',
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.15)',
  },
  urgente: {
    label: 'Urgente',
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.15)',
  },
};

// Helper para formatar data/hora
export const formatDateTime = (date: string): string => {
  try {
    const d = new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

// Helper para formatar apenas hora
export const formatTime = (date: string): string => {
  try {
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};
