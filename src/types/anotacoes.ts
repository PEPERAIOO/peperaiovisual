// Tipos para o módulo de Anotações

export interface Anotacao {
  id: string;
  titulo: string;
  conteudo: string;
  user_id: string;
  user_nome?: string;
  dias_expiracao: number;
  data_criacao: string;
  data_expiracao: string;
  created_at: string;
  updated_at?: string;
}

export interface AnotacaoInsert {
  titulo: string;
  conteudo: string;
  dias_expiracao: number;
}
