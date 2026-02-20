# DELEGAÇÃO DE OBRAS PARA USUÁRIOS REAIS

## Resumo das Mudanças

A funcionalidade de delegação de obras foi atualizada para permitir apenas a delegação para **usuários reais cadastrados no sistema**, garantindo que as obras delegadas sejam enviadas ao sistema particular do usuário executor.

## Alterações Implementadas

### 1. **Banco de Dados (SQL)**

#### Arquivo: `docs/MIGRATION_DELEGACAO_USER_ID.sql`

- **Modificação da Foreign Key**: `obras_verbas.delegado_para_id` agora referencia `auth.users(id)` ao invés de `entidades(id)`
- **Atualização de RLS Policies**: As políticas de segurança agora verificam se o usuário autenticado é o delegado usando `auth.uid()`
- **Restrição de Integridade**: Apenas usuários cadastrados podem receber delegações

```sql
-- Foreign key atualizada
ALTER TABLE obras_verbas 
ADD CONSTRAINT obras_verbas_delegado_para_id_fkey 
FOREIGN KEY (delegado_para_id) 
REFERENCES auth.users(id) 
ON DELETE RESTRICT;
```

### 2. **Hook de Delegações**

#### Arquivo: `src/hooks/useObrasDelegadas.ts`

**Função `loadSocios`:**
- **Antes**: Buscava da tabela `entidades` com filtro `tipo = 'socio'`
- **Depois**: Busca da tabela `profiles` (usuários cadastrados)
- Retorna: `id`, `nome_completo`, `email`, `avatar_url`

**Função `loadVerbas`:**
- Join atualizado: `delegado_para:profiles!delegado_para_id` ao invés de `entidades`

**Função `loadMinhasVerbas`:**
- Agora usa apenas `currentUserId` (auth.uid)
- Removida a verificação de `entidade_id`

### 3. **Tipos TypeScript**

#### Arquivo: `src/types/delegacao.ts`

Interface `ObraVerba` atualizada:
```typescript
delegado_para?: {
  id: string;
  nome_completo: string; // Antes: nome
  email?: string;
  avatar_url?: string;
};
```

### 4. **Componentes Atualizados**

Os seguintes componentes foram atualizados para usar `nome_completo` ao invés de `nome`:

- **`src/pages/GestaoObras.tsx`**
  - Filtro de busca
  - Exibição do nome do executor nos cards
  - Avatar com inicial do nome
  - Modal de confirmação

- **`src/components/delegacao/AuditoriaDrawer.tsx`**
  - Avatar do executor
  - Exibição do nome do executor

- **`src/components/delegacao/DelegarObraModal.tsx`**
  - Select de usuários mostra apenas usuários reais cadastrados

## Impactos e Benefícios

### ✅ Benefícios

1. **Segurança**: Apenas usuários autenticados podem receber delegações
2. **Rastreabilidade**: Vínculo direto com contas de usuário reais
3. **Isolamento**: Cada executor vê apenas suas próprias obras delegadas
4. **Integridade**: Não é possível delegar para usuários inexistentes

### ⚠️ Considerações

1. **Migração de Dados**: Se houver verbas antigas com `delegado_para_id` apontando para entidades, será necessário migrar esses dados antes de aplicar a migration SQL
2. **Compatibilidade**: O sistema agora requer que todos os executores tenham uma conta cadastrada

## Como Usar

### Para Delegar uma Obra

1. Acesse **Gestão de Obras** (menu Admin)
2. Clique em **Delegar Obra**
3. Selecione a obra no dropdown
4. Selecione o **executor** (apenas usuários cadastrados aparecem)
5. Informe o valor da verba
6. Clique em **Delegar**

### Para Visualizar Obras Delegadas

**Como Executor:**
1. Acesse **Minhas Obras** no menu
2. Visualize todas as obras delegadas para você
3. Registre gastos com comprovantes
4. Aguarde aprovação do admin

**Como Admin:**
1. Acesse **Gestão de Obras**
2. Veja todas as verbas delegadas
3. Aprove ou rejeite gastos
4. Envie verbas adicionais se necessário

## Estrutura de Dados

### Tabela `obras_verbas`

```
id                   | UUID (PK)
obra_id             | UUID (FK -> obras)
delegado_para_id    | UUID (FK -> auth.users) ✨ MUDANÇA
valor_delegado      | NUMERIC
status              | verba_status
created_at          | TIMESTAMPTZ
updated_at          | TIMESTAMPTZ
```

### RLS Policy Exemplo

```sql
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
```

## Próximos Passos (Opcional)

- [ ] Adicionar notificações por email quando uma obra for delegada
- [ ] Dashboard com estatísticas de obras delegadas por executor
- [ ] Relatório de prestação de contas em PDF
- [ ] Sistema de chat entre admin e executor
