-- ============================================
-- SCRIPT SQL PARA NOVAS FUNCIONALIDADES
-- - Anotações com expiração automática
-- - Configurações de usuário
-- - Configurações da empresa
-- - Campo user_nome nas transações
-- ============================================

-- 1. Adicionar campo user_nome na tabela transacoes
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS user_nome TEXT;

-- Comentário explicativo
COMMENT ON COLUMN transacoes.user_nome IS 'Nome do usuário que lançou a transação';

-- 2. Criar tabela de anotações
CREATE TABLE IF NOT EXISTS anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_nome TEXT,
  dias_expiracao INTEGER NOT NULL DEFAULT 7,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_anotacoes_user_id ON anotacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_data_expiracao ON anotacoes(data_expiracao);
CREATE INDEX IF NOT EXISTS idx_anotacoes_created_at ON anotacoes(created_at DESC);

-- Comentários
COMMENT ON TABLE anotacoes IS 'Anotações temporárias com expiração automática';
COMMENT ON COLUMN anotacoes.dias_expiracao IS 'Número de dias até a anotação expirar';
COMMENT ON COLUMN anotacoes.data_expiracao IS 'Data em que a anotação será excluída automaticamente';

-- 3. Criar tabela de configurações de usuário
CREATE TABLE IF NOT EXISTS configuracoes_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tema TEXT NOT NULL DEFAULT 'escuro' CHECK (tema IN ('escuro', 'claro')),
  notificacoes_email BOOLEAN DEFAULT true,
  notificacoes_sistema BOOLEAN DEFAULT true,
  idioma TEXT NOT NULL DEFAULT 'pt-BR' CHECK (idioma IN ('pt-BR', 'en')),
  formato_moeda TEXT NOT NULL DEFAULT 'BRL' CHECK (formato_moeda IN ('BRL', 'USD')),
  formato_data TEXT NOT NULL DEFAULT 'DD/MM/YYYY' CHECK (formato_data IN ('DD/MM/YYYY', 'MM/DD/YYYY')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_configuracoes_usuario_user_id ON configuracoes_usuario(user_id);

-- Comentários
COMMENT ON TABLE configuracoes_usuario IS 'Preferências e configurações personalizadas de cada usuário';

-- 4. Criar tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS configuracoes_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Comentários
COMMENT ON TABLE configuracoes_empresa IS 'Informações gerais da empresa';

-- ============================================
-- RLS (Row Level Security) POLICIES
-- ============================================

-- 1. Políticas para anotacoes
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias anotações
CREATE POLICY "Usuários podem ver suas próprias anotações"
ON anotacoes FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias anotações
CREATE POLICY "Usuários podem criar anotações"
ON anotacoes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias anotações
CREATE POLICY "Usuários podem atualizar suas anotações"
ON anotacoes FOR UPDATE
USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias anotações
CREATE POLICY "Usuários podem deletar suas anotações"
ON anotacoes FOR DELETE
USING (auth.uid() = user_id);

-- 2. Políticas para configuracoes_usuario
ALTER TABLE configuracoes_usuario ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias configurações
CREATE POLICY "Usuários podem ver suas configurações"
ON configuracoes_usuario FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias configurações
CREATE POLICY "Usuários podem criar suas configurações"
ON configuracoes_usuario FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias configurações
CREATE POLICY "Usuários podem atualizar suas configurações"
ON configuracoes_usuario FOR UPDATE
USING (auth.uid() = user_id);

-- 3. Políticas para configuracoes_empresa
ALTER TABLE configuracoes_empresa ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ver
CREATE POLICY "Usuários autenticados podem ver configurações da empresa"
ON configuracoes_empresa FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Apenas admins podem inserir/atualizar
CREATE POLICY "Apenas admins podem modificar configurações da empresa"
ON configuracoes_empresa FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- FUNÇÃO PARA LIMPAR ANOTAÇÕES EXPIRADAS
-- ============================================

CREATE OR REPLACE FUNCTION limpar_anotacoes_expiradas()
RETURNS void AS $$
BEGIN
  DELETE FROM anotacoes
  WHERE data_expiracao < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION limpar_anotacoes_expiradas IS 'Remove anotações que já expiraram';

-- ============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em anotacoes
DROP TRIGGER IF EXISTS update_anotacoes_updated_at ON anotacoes;
CREATE TRIGGER update_anotacoes_updated_at
  BEFORE UPDATE ON anotacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em configuracoes_usuario
DROP TRIGGER IF EXISTS update_configuracoes_usuario_updated_at ON configuracoes_usuario;
CREATE TRIGGER update_configuracoes_usuario_updated_at
  BEFORE UPDATE ON configuracoes_usuario
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em configuracoes_empresa
DROP TRIGGER IF EXISTS update_configuracoes_empresa_updated_at ON configuracoes_empresa;
CREATE TRIGGER update_configuracoes_empresa_updated_at
  BEFORE UPDATE ON configuracoes_empresa
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MENSAGEM DE CONCLUSÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✓ Tabelas e políticas criadas com sucesso!';
  RAISE NOTICE '  - Campo user_nome adicionado em transacoes';
  RAISE NOTICE '  - Tabela anotacoes criada';
  RAISE NOTICE '  - Tabela configuracoes_usuario criada';
  RAISE NOTICE '  - Tabela configuracoes_empresa criada';
  RAISE NOTICE '  - Políticas RLS configuradas';
  RAISE NOTICE '  - Triggers de atualização configurados';
END $$;
