# Supabase RLS — Pessoas e Empresas compartilhado (todos veem os mesmos cadastros)

## Sintoma
Ao entrar com contas diferentes (ex.: DAVI vs. Marcos/Isaac), a tela de Pessoas/Empresas mostra dados “fakes/mocks” ou vazios.

Isso geralmente acontece quando a tabela `entidades` está com **RLS (Row Level Security)** habilitado e as políticas restringem a leitura por `user_id = auth.uid()`.

## Objetivo
Garantir que **qualquer usuário autenticado** enxergue **as mesmas entidades** (clientes, funcionários, fornecedores, sócios, etc.).

## SQL (rode no Supabase → SQL Editor)

> Este script libera **leitura (SELECT)** para o role `authenticated`. Assim, todos os usuários logados veem os mesmos cadastros.

```sql
-- Habilitar RLS (se você já usa RLS). Se você não quer RLS, você pode DISABLE em vez disso.
alter table if exists public.entidades enable row level security;

-- Política de leitura compartilhada (authenticated vê tudo)
-- Políticas são somadas (OR). Então, mesmo que exista política antiga restritiva,
-- esta aqui permite SELECT para todos autenticados.

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'entidades'
      and policyname = 'entidades_select_authenticated_all'
  ) then
    execute $$
      create policy "entidades_select_authenticated_all"
      on public.entidades
      for select
      to authenticated
      using (true);
    $$;
  end if;
end $$;
```

## Opcional: escrita compartilhada (UPDATE/DELETE)
Se você quer que qualquer usuário autenticado também consiga **editar/apagar** qualquer entidade, crie políticas adicionais.

Atenção: isso é mais permissivo e deve ser usado apenas se essa for a regra do seu negócio.

```sql
alter table if exists public.entidades enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'entidades'
      and policyname = 'entidades_update_authenticated_all'
  ) then
    execute $$
      create policy "entidades_update_authenticated_all"
      on public.entidades
      for update
      to authenticated
      using (true)
      with check (true);
    $$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'entidades'
      and policyname = 'entidades_delete_authenticated_all'
  ) then
    execute $$
      create policy "entidades_delete_authenticated_all"
      on public.entidades
      for delete
      to authenticated
      using (true);
    $$;
  end if;
end $$;
```

## Resultado esperado
- DAVI, Marcos e Isaac passam a ver os **mesmos clientes/funcionários/fornecedores**.
- O app para de exibir “dados fakes” quando há erro: se RLS bloquear, ele mostrará erro real.
