# Supabase RLS — Financeiro compartilhado (todos veem os lançamentos)

## Sintoma
Somente o usuário que lançou consegue ver as transações no Financeiro. Outros usuários autenticados não enxergam os mesmos lançamentos.

Isso normalmente acontece quando a tabela `transacoes` está com **RLS (Row Level Security)** habilitado e a política de `SELECT` restringe por `user_id = auth.uid()`.

## Objetivo
Permitir que **qualquer usuário autenticado** consiga **ler (SELECT)** todas as transações e categorias, para que o Financeiro seja compartilhado.

## SQL (rode no Supabase → SQL Editor)

> Este script **não** abre acesso público: ele libera leitura apenas para o role `authenticated`.

```sql
-- 1) Garantir RLS habilitado (ajuste se você preferir manter RLS desabilitado)
alter table if exists public.transacoes enable row level security;
alter table if exists public.categorias enable row level security;
alter table if exists public.transacoes_deletadas enable row level security;

-- 2) Política de leitura compartilhada (qualquer usuário autenticado vê tudo)
-- Observação: políticas são somadas (OR). Então, mesmo que exista uma política antiga
-- restritiva, esta aqui permite SELECT para todos autenticados.

do $$
begin
  -- transacoes
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'transacoes'
      and policyname = 'transacoes_select_authenticated_all'
  ) then
    execute $$
      create policy "transacoes_select_authenticated_all"
      on public.transacoes
      for select
      to authenticated
      using (true);
    $$;
  end if;

  -- categorias
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'categorias'
      and policyname = 'categorias_select_authenticated_all'
  ) then
    execute $$
      create policy "categorias_select_authenticated_all"
      on public.categorias
      for select
      to authenticated
      using (true);
    $$;
  end if;

  -- transacoes_deletadas (histórico)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'transacoes_deletadas'
      and policyname = 'transacoes_deletadas_select_authenticated_all'
  ) then
    execute $$
      create policy "transacoes_deletadas_select_authenticated_all"
      on public.transacoes_deletadas
      for select
      to authenticated
      using (true);
    $$;
  end if;
end $$;
```

## Observações importantes
- Se você também quer que todos possam **editar/apagar** lançamentos de todos, é preciso criar políticas `UPDATE`/`DELETE` semelhantes. (Este arquivo foca no problema de “ver os lançamentos”.)
- Se existir uma tabela/view diferente sendo usada no seu projeto (ex.: `lancamentos`), ajuste o nome no SQL.
