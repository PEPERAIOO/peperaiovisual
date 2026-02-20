// Tipos para Configurações do Sistema

export interface ConfiguracaoUsuario {
  id: string;
  user_id: string;
  tema: 'escuro' | 'claro';
  notificacoes_email: boolean;
  notificacoes_sistema: boolean;
  idioma: 'pt-BR' | 'en';
  formato_moeda: 'BRL' | 'USD';
  formato_data: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  created_at?: string;
  updated_at?: string;
}

export interface ConfiguracaoEmpresa {
  id: string;
  nome_empresa: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}
