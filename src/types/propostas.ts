// Status possíveis da proposta
export type PropostaStatus = 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada';

// Interface principal de Proposta (conforme schema Supabase)
export interface Proposta {
  id: string;
  numero_sequencial?: number;
  numero_revisao?: number;
  cliente_nome: string;
  cliente_empresa?: string;
  descricao_servicos: string;
  valor_total: number;
  status: PropostaStatus;
  data_emissao?: string;
  validade?: string;
  prazo_producao?: string;
  prazo_instalacao?: string;
  condicoes_pagamento?: string;
  observacoes?: string;
  escopo_tecnico?: string;
  obra_gerada_id?: string;
  created_at: string;
}

// Interface para itens da proposta
export interface PropostaItem {
  id: string;
  proposta_id: string;
  descricao: string;
  quantidade: number;
  unidade: string; // 'un', 'm²', 'm', etc.
  valor_unitario: number;
  valor_total: number;
}

// Helper para formatar número da proposta
export const formatNumeroProposta = (sequencial?: number, revisao?: number): string => {
  const ano = new Date().getFullYear();
  const seq = sequencial?.toString().padStart(4, '0') || '0000';
  const rev = (revisao && revisao > 0) ? `-R${revisao.toString().padStart(2, '0')}` : '';
  return `${ano}-${seq}${rev}`;
};

// Configuração visual por status
export const PROPOSTA_STATUS_CONFIG: Record<
  PropostaStatus,
  { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error'; bgColor: string; textColor: string }
> = {
  rascunho: {
    label: 'Rascunho',
    color: 'default',
    bgColor: 'rgba(158, 158, 158, 0.15)',
    textColor: '#9e9e9e',
  },
  enviada: {
    label: 'Enviada',
    color: 'info',
    bgColor: 'rgba(33, 150, 243, 0.15)',
    textColor: '#2196f3',
  },
  aprovada: {
    label: 'Aprovada',
    color: 'success',
    bgColor: 'rgba(0, 146, 70, 0.15)',
    textColor: '#009246',
  },
  rejeitada: {
    label: 'Rejeitada',
    color: 'error',
    bgColor: 'rgba(206, 43, 55, 0.15)',
    textColor: '#ce2b37',
  },
};

// Tabs de filtro
export const PROPOSTA_TABS = [
  { value: 'todas', label: 'Todas' },
  { value: 'rascunho', label: 'Rascunhos' },
  { value: 'enviada', label: 'Enviadas' },
  { value: 'aprovada', label: 'Aprovadas' },
] as const;

export type PropostaTabValue = (typeof PROPOSTA_TABS)[number]['value'];

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
  return new Date(date).toLocaleDateString('pt-BR');
};

// Helper para gerar número da proposta
export const gerarNumeroProposta = (sequencial?: number, revisao: number = 0): string => {
  const ano = new Date().getFullYear();
  const seq = sequencial 
    ? sequencial.toString().padStart(4, '0') 
    : Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  const rev = revisao > 0 ? `-R${revisao.toString().padStart(2, '0')}` : '';
  return `${ano}-${seq}${rev}`;
};
