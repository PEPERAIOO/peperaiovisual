-- ============================================================================
-- FIX: Políticas RLS para categorias serem globais (visíveis para todos)
-- ============================================================================
-- Este script garante que a tabela categorias seja global, sem filtro por user_id
-- Todos os usuários autenticados podem ver, inserir, atualizar e deletar categorias
-- 
-- Execute este script no Supabase SQL Editor

-- Habilitar RLS na tabela categorias
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS categorias_select_authenticated_all ON public.categorias;
DROP POLICY IF EXISTS categorias_insert_authenticated_all ON public.categorias;
DROP POLICY IF EXISTS categorias_update_authenticated_all ON public.categorias;
DROP POLICY IF EXISTS categorias_delete_authenticated_all ON public.categorias;

-- Criar políticas permissivas para todos os usuários autenticados

-- SELECT: Qualquer usuário autenticado pode ver TODAS as categorias
CREATE POLICY categorias_select_authenticated_all 
ON public.categorias 
FOR SELECT 
TO authenticated 
USING (true);

-- INSERT: Qualquer usuário autenticado pode criar categorias
CREATE POLICY categorias_insert_authenticated_all 
ON public.categorias 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- UPDATE: Qualquer usuário autenticado pode atualizar categorias
CREATE POLICY categorias_update_authenticated_all 
ON public.categorias 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- DELETE: Qualquer usuário autenticado pode deletar categorias
CREATE POLICY categorias_delete_authenticated_all 
ON public.categorias 
FOR DELETE 
TO authenticated 
USING (true);

-- Comentário explicando o modelo
COMMENT ON TABLE public.categorias IS 
'Categorias financeiras globais. Visíveis e editáveis por todos os usuários autenticados.';

-- ============================================================================
-- INSERIR CATEGORIAS PADRÃO (se não existirem)
-- ============================================================================
-- Categorias de Despesa
INSERT INTO public.categorias (nome, tipo, cor)
VALUES 
  ('Mão de Obra', 'despesa', '#2196f3'),
  ('Material', 'despesa', '#ff9800'),
  ('Alimentação', 'despesa', '#4caf50'),
  ('Transporte', 'despesa', '#9c27b0'),
  ('Equipamentos', 'despesa', '#f44336'),
  ('Serviços Terceiros', 'despesa', '#00bcd4'),
  ('Administrativo', 'despesa', '#607d8b'),
  ('Impostos', 'despesa', '#e91e63'),
  ('Outros', 'despesa', '#795548')
ON CONFLICT (nome, tipo) DO NOTHING;

-- Categorias de Receita
INSERT INTO public.categorias (nome, tipo, cor)
VALUES 
  ('Pagamento Cliente', 'receita', '#4caf50'),
  ('Outros', 'receita', '#795548')
ON CONFLICT (nome, tipo) DO NOTHING;
