// Tipos para gestão de obras delegadas

export type VerbaStatus = 'pendente_envio' | 'ativa' | 'prestacao_pendente' | 'finalizada' | 'cancelada';

export interface ObraVerba {
  id: string;
  obra_id: string;
  delegado_para_id: string; // user_id do executor
  valor_delegado: number;
  status: VerbaStatus;
  transacao_caixa_id?: string; // ID da transação de saída do caixa
  created_at: string;
  updated_at?: string;
  
  // Relacionamentos (join)
  obra?: {
    id: string;
    nome: string;
    status: string;
  };
  delegado_para?: {
    id: string;
    nome_completo: string; // Nome do usuário em profiles
    email?: string;
    avatar_url?: string;
  };
}

export interface ObraVerbaInsert {
  obra_id: string;
  delegado_para_id: string;
  valor_delegado: number;
  status?: VerbaStatus;
}

export interface GastoDelegado {
  id: string;
  verba_id: string;
  descricao: string;
  valor: number;
  categoria: string;
  comprovante_url: string; // Obrigatório
  entidade_id?: string; // ID da entidade (funcionário) - opcional
  aprovado?: boolean;
  transacao_obra_id?: string; // ID da transação quando aprovado
  created_at: string;
  aprovado_em?: string;
  
  // Campos de rastreamento
  registrado_por_id?: string; // ID do usuário que registrou
  registrado_por_nome?: string; // Nome do usuário que registrou
  data_registro?: string; // Data do registro (YYYY-MM-DD)
  hora_registro?: string; // Hora do registro (HH:MM)
  
  // Relacionamentos (carregados dinamicamente)
  obra_verba?: ObraVerba;
  funcionario_nome?: string; // Nome do funcionário (se entidade_id existe)
}

export interface GastoDelegadoInsert {
  verba_id: string;
  descricao: string;
  valor: number;
  categoria: string;
  comprovante_url: string;
  entidade_id?: string; // ID da entidade (funcionário) - opcional
  registrado_por_id?: string;
  registrado_por_nome?: string;
  data_registro?: string;
  hora_registro?: string;
}

// Resumo de verba para exibição
export interface ResumoVerba {
  valorEnviado: number;
  gastoAcumulado: number;
  saldoDisponivel: number;
  totalGastos: number;
  gastosAprovados: number;
  gastosPendentes: number;
}

// Status visual config
export const VERBA_STATUS_CONFIG: Record<VerbaStatus, { label: string; color: string; bgColor: string }> = {
  pendente_envio: {
    label: 'Pendente Envio',
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.15)',
  },
  ativa: {
    label: 'Ativa',
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.15)',
  },
  prestacao_pendente: {
    label: 'Prestação Pendente',
    color: '#2196f3',
    bgColor: 'rgba(33, 150, 243, 0.15)',
  },
  finalizada: {
    label: 'Finalizada',
    color: '#9e9e9e',
    bgColor: 'rgba(158, 158, 158, 0.15)',
  },
  cancelada: {
    label: 'Cancelada',
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.15)',
  },
};

// Categorias de gastos delegados
export const CATEGORIAS_GASTO_DELEGADO = [
  'Material de Construção',
  'Mão de Obra',
  'Equipamento',
  'Transporte',
  'Alimentação',
  'Combustível',
  'Ferramentas',
  'Elétrica',
  'Hidráulica',
  'Acabamento',
  'Outros',
] as const;

export type CategoriaGastoDelegado = (typeof CATEGORIAS_GASTO_DELEGADO)[number];

// Helpers
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const calcularResumoVerba = (verba: ObraVerba, gastos: GastoDelegado[]): ResumoVerba => {
  const gastoAcumulado = gastos.reduce((acc, g) => acc + g.valor, 0);

  return {
    valorEnviado: verba.valor_delegado,
    gastoAcumulado,
    saldoDisponivel: verba.valor_delegado - gastoAcumulado,
    totalGastos: gastos.length,
    gastosAprovados: 0, // Gastos aprovados são excluídos da tabela
    gastosPendentes: gastos.length, // Todos os gastos existentes são pendentes
  };
};
