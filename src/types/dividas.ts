// Tipos para o módulo de Dívidas

import { TransactionStatus } from './financeiro';

// Interface principal de Transação de Dívida (registro MESTRE)
export interface DividaTransacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'despesa';
  status: TransactionStatus;
  categoria: string;
  data_vencimento: string;
  data_pagamento?: string;
  
  // Campos de parcelamento
  is_parcelada: boolean;
  numero_parcelas?: number;
  
  // Relacionamentos
  entidade_id?: string;
  entidade?: {
    id: string;
    nome: string;
    tipo: string;
  };
  obra_id?: string;
  
  observacao?: string;
  created_at: string;
  updated_at?: string;
  
  // Dados calculados (não persistidos)
  parcelas?: DividaParcela[];
  parcelas_pagas?: number;
  parcelas_pendentes?: number;
}

// Interface para parcelas individuais (registros FILHOS)
export interface DividaParcela {
  id: string;
  transacao_id: string; // FK para transacao mestre
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: TransactionStatus;
  created_at: string;
  updated_at?: string;
}

// Interface para inserção de nova dívida
export interface DividaInsert {
  descricao: string;
  valor: number;
  categoria: string;
  data_vencimento: string;
  entidade_id?: string;
  obra_id?: string;
  observacao?: string;
  is_parcelada: boolean;
  numero_parcelas?: number;
}

// Interface para inserção de parcela
export interface ParcelaInsert {
  transacao_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  status: TransactionStatus;
}

// Resumo de dívidas
export interface DividasSummary {
  totalDividas: number;
  totalPago: number;
  totalPendente: number;
  qtdDividasAtivas: number;
  qtdParcelasPendentes: number;
}

// Formatador de moeda
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Formatador de data curta
export const formatDateShort = (date: string | undefined): string => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '-';
  }
};

// Verificar se dívida está atrasada
export const isDividaAtrasada = (dataVencimento: string, status: TransactionStatus): boolean => {
  if (status === 'pago' || status === 'cancelado') return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  return vencimento < hoje;
};
