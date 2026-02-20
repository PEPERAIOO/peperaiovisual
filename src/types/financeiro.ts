// Tipos para o módulo Financeiro (conforme ENUMS do Supabase)

export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

// Categorias pré-definidas do sistema
export const CATEGORIAS_PADRAO = [
  'Mão de Obra',
  'Material',
  'Alimentação',
  'Transporte',
  'Equipamentos',
  'Serviços Terceiros',
  'Administrativo',
  'Impostos',
  'Pagamento Cliente',
  'Outros',
] as const;

export interface Category {
  id: string;
  nome: string;
  cor: string;
  tipo: TransactionType;
  created_at?: string;
}

// Interface principal de Transação (coração financeiro)
export interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: TransactionType; // 'receita' ou 'despesa'
  status: TransactionStatus; // 'pendente' (dívida) ou 'pago' (caixa realizado)
  categoria: string; // Ex: 'Mão de Obra', 'Material', 'Alimentação'
  data_vencimento?: string; // Para contas a pagar
  data_pagamento?: string; // Quando efetivamente saiu/entrou o dinheiro
  
  // Informações do usuário
  user_id?: string;
  user_nome?: string; // Nome de quem lançou a transação
  
  // Relacionamentos (FKs)
  entidade_id?: string; // FK para entidades (quem recebeu/pagou)
  entidade?: {
    id: string;
    nome: string;
    tipo: string;
  };
  obra_id?: string; // FK para obras - SE PREENCHIDO, é custo/receita da obra
  obra?: {
    id: string;
    nome: string;
  };
  
  observacao?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para inserção de transação
export interface TransactionInsert {
  descricao: string;
  valor: number;
  tipo: TransactionType;
  status: TransactionStatus;
  categoria: string;
  data_vencimento?: string;
  data_pagamento?: string;
  entidade_id?: string;
  obra_id?: string;
  observacao?: string;
}

export interface DeletedTransaction {
  id: string;
  transacao_original: Transaction;
  deleted_at: string;
  deleted_by?: string;
}

export interface MonthOption {
  year: number;
  month: number;
  label: string;
  transactionCount: number;
}

export interface FinanceiroSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  contasAPagar: number; // transacoes pendentes tipo='despesa'
  contasAReceber: number; // transacoes pendentes tipo='receita'
}

// Cores pré-definidas para categorias
export const CATEGORY_COLORS = [
  '#009246', // Verde Itália
  '#ce2b37', // Vermelho Itália
  '#2196f3', // Azul
  '#ff9800', // Laranja
  '#9c27b0', // Roxo
  '#00bcd4', // Ciano
  '#4caf50', // Verde
  '#f44336', // Vermelho
  '#e91e63', // Rosa
  '#673ab7', // Roxo Escuro
  '#3f51b5', // Índigo
  '#009688', // Teal
  '#ffc107', // Âmbar
  '#795548', // Marrom
  '#607d8b', // Cinza Azulado
];

// Status configuration
export const STATUS_CONFIG: Record<TransactionStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  pago: { label: 'Pago', color: 'success' },
  pendente: { label: 'Pendente', color: 'warning' },
  atrasado: { label: 'Atrasado', color: 'error' },
  cancelado: { label: 'Cancelado', color: 'default' },
};

