// Tipos de entidade disponíveis (conforme ENUM tipo_entidade do Supabase)
export type EntityType = 'cliente' | 'fornecedor' | 'funcionario' | 'parceiro' | 'socio';

// Interface principal de Entidade (conforme schema Supabase)
export interface Entity {
  id: string;
  user_id?: string;
  nome: string;
  tipo: EntityType;
  documento?: string; // CPF ou CNPJ
  telefone?: string; // Usado para link do WhatsApp
  email?: string;
  endereco?: string;
  observacoes?: string;
  created_at: string;
}

// Configuração visual por tipo de entidade
export const ENTITY_TYPE_CONFIG: Record<
  EntityType,
  { label: string; color: 'info' | 'success' | 'warning' | 'secondary' | 'error'; bgColor: string; textColor: string }
> = {
  cliente: {
    label: 'Cliente',
    color: 'info',
    bgColor: 'rgba(33, 150, 243, 0.15)',
    textColor: '#2196f3',
  },
  funcionario: {
    label: 'Funcionário',
    color: 'success',
    bgColor: 'rgba(0, 146, 70, 0.15)',
    textColor: '#009246',
  },
  fornecedor: {
    label: 'Fornecedor',
    color: 'warning',
    bgColor: 'rgba(255, 152, 0, 0.15)',
    textColor: '#ff9800',
  },
  parceiro: {
    label: 'Parceiro',
    color: 'secondary',
    bgColor: 'rgba(156, 39, 176, 0.15)',
    textColor: '#9c27b0',
  },
  socio: {
    label: 'Sócio',
    color: 'error',
    bgColor: 'rgba(206, 43, 55, 0.15)',
    textColor: '#ce2b37',
  },
};

// Opções de tabs para filtro
export const ENTITY_TABS = [
  { value: 'todos', label: 'Todos' },
  { value: 'funcionario', label: 'Funcionários' },
  { value: 'socio', label: 'Sócios' },
  { value: 'cliente', label: 'Clientes' },
  { value: 'fornecedor', label: 'Fornecedores' },
] as const;

export type EntityTabValue = (typeof ENTITY_TABS)[number]['value'];

// Helper para formatar telefone
export const formatPhone = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// Helper para limpar telefone (apenas números)
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Helper para gerar link do WhatsApp
export const getWhatsAppLink = (phone: string | undefined): string | null => {
  if (!phone) return null;
  const cleaned = cleanPhone(phone);
  if (cleaned.length < 10) return null;
  // Adiciona código do Brasil se não tiver
  const fullNumber = cleaned.length <= 11 ? `55${cleaned}` : cleaned;
  return `https://wa.me/${fullNumber}`;
};

// Helper para formatar documento (CPF/CNPJ)
export const formatDocument = (doc: string | undefined): string => {
  if (!doc) return '';
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 11) {
    // CPF: 000.000.000-00
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  return doc;
};

// Helper para obter iniciais do nome
export const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
