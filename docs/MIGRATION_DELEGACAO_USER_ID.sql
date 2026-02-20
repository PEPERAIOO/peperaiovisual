-- ============================================
-- MIGRAÇÃO: DELEGAÇÃO PARA USUÁRIOS REAIS
-- ============================================
-- Objetivo: Alterar obras_verbas.delegado_para_id para referenciar
--           auth.users ao invés de entidades, permitindo delegação
--           apenas para usuários cadastrados no sistema.
-- ============================================

-- 1. Remover a constraint antiga (foreign key para entidades)
ALTER TABLE obras_verbas 
DROP CONSTRAINT IF EXISTS obras_verbas_delegado_para_id_fkey;

-- 2. Adicionar nova constraint (foreign key para auth.users)
ALTER TABLE obras_verbas 
ADD CONSTRAINT obras_verbas_delegado_para_id_fkey 
FOREIGN KEY (delegado_para_id) 
REFERENCES auth.users(id) 
ON DELETE RESTRICT;

-- 3. Atualizar comentário da coluna
COMMENT ON COLUMN obras_verbas.delegado_para_id IS 'ID do usuário (auth.users) para quem a obra foi delegada';

-- 4. Atualizar RLS policies para verificar se o delegado é o usuário autenticado
-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Executores veem apenas suas verbas" ON obras_verbas;
DROP POLICY IF EXISTS "Executores veem apenas suas verbas delegadas" ON obras_verbas;

-- Criar nova policy baseada em user_id
CREATE POLICY "Executores veem apenas suas verbas delegadas"
ON obras_verbas FOR SELECT
USING (
  delegado_para_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. Atualizar gastos_delegados se necessário (manter compatibilidade)
COMMENT ON TABLE gastos_delegados IS 'Gastos registrados pelos executores com a verba delegada';

-- ============================================
-- MENSAGEM DE CONCLUSÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✓ Migração concluída com sucesso!';
  RAISE NOTICE '  - obras_verbas.delegado_para_id agora referencia auth.users';
  RAISE NOTICE '  - Apenas usuários cadastrados podem receber delegações';
  RAISE NOTICE '  - RLS policies atualizadas';
  RAISE NOTICE '';
  RAISE NOTICE '⚠ IMPORTANTE: Execute esta migração APENAS se não houver verbas ativas';
  RAISE NOTICE '  com delegado_para_id apontando para entidades antigas.';
  RAISE NOTICE '  Caso contrário, você precisará migrar os dados primeiro.';
END $$;
