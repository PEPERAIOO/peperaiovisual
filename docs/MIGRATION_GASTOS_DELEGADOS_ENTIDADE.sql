-- ============================================================================
-- MIGRATION: Adicionar coluna entidade_id à tabela gastos_delegados
-- ============================================================================
-- Esta migration adiciona a coluna entidade_id para permitir que executores
-- registrem pagamentos de diárias vinculados a funcionários específicos.
-- 
-- Quando o admin aprovar gastos com entidade_id, a transação será criada
-- corretamente vinculada ao funcionário, com todos os detalhes da obra.
--
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna entidade_id (opcional)
ALTER TABLE public.gastos_delegados 
ADD COLUMN IF NOT EXISTS entidade_id UUID;

-- Adicionar foreign key para entidades
ALTER TABLE public.gastos_delegados
ADD CONSTRAINT gastos_delegados_entidade_id_fkey 
FOREIGN KEY (entidade_id) 
REFERENCES public.entidades(id) 
ON DELETE SET NULL;

-- Adicionar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_gastos_delegados_entidade_id 
ON public.gastos_delegados (entidade_id);

-- Comentário explicando o campo
COMMENT ON COLUMN public.gastos_delegados.entidade_id IS 
'ID da entidade (funcionário) quando o gasto é uma diária. Opcional. Quando aprovado pelo admin, a transação será vinculada ao funcionário automaticamente.';
