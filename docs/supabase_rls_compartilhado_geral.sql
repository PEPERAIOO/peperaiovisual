-- RLS compartilhado ("tudo igual para todos")
-- Aplica políticas permissivas para usuários autenticados.
-- Rode no Supabase (SQL Editor).

-- Tabelas principais do app
alter table if exists public.entidades enable row level security;
alter table if exists public.transacoes enable row level security;
alter table if exists public.categorias enable row level security;
alter table if exists public.obras enable row level security;
alter table if exists public.propostas enable row level security;
alter table if exists public.proposta_itens enable row level security;
alter table if exists public.propostas_sequencia enable row level security;
alter table if exists public.compromissos enable row level security;
alter table if exists public.dividas_parcelas enable row level security;
alter table if exists public.transacoes_deletadas enable row level security;

-- Delegação / verbas / gastos delegados (se existirem)
alter table if exists public.obras_verbas enable row level security;
alter table if exists public.gastos_delegados enable row level security;

-- Helper: cria políticas somente se não existirem
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'entidades',
    'transacoes',
    'categorias',
    'obras',
    'propostas',
    'proposta_itens',
    'propostas_sequencia',
    'compromissos',
    'dividas_parcelas',
    'transacoes_deletadas',
    'obras_verbas',
    'gastos_delegados'
  ]
  LOOP
    -- SELECT
    pol := tbl || '_select_authenticated_all';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=tbl AND policyname=pol
    ) THEN
      EXECUTE format(
        'create policy %I on public.%I for select to authenticated using (true);',
        pol, tbl
      );
    END IF;

    -- INSERT
    pol := tbl || '_insert_authenticated_all';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=tbl AND policyname=pol
    ) THEN
      EXECUTE format(
        'create policy %I on public.%I for insert to authenticated with check (true);',
        pol, tbl
      );
    END IF;

    -- UPDATE
    pol := tbl || '_update_authenticated_all';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=tbl AND policyname=pol
    ) THEN
      EXECUTE format(
        'create policy %I on public.%I for update to authenticated using (true) with check (true);',
        pol, tbl
      );
    END IF;

    -- DELETE
    pol := tbl || '_delete_authenticated_all';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=tbl AND policyname=pol
    ) THEN
      EXECUTE format(
        'create policy %I on public.%I for delete to authenticated using (true);',
        pol, tbl
      );
    END IF;
  END LOOP;
END $$;
