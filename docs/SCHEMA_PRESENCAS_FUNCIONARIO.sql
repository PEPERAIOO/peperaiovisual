-- Tabela para registro de presenças de funcionários
-- Execute no Supabase SQL Editor

create table if not exists funcionario_presencas (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references entidades(id) on delete cascade,
  data date not null,
  trabalhou boolean not null default true,
  observacao text,
  created_at timestamptz not null default now()
);

-- Evita duplicidade por funcionário/dia
create unique index if not exists funcionario_presencas_unique
  on funcionario_presencas (funcionario_id, data);

-- RLS (ajuste conforme sua política)
alter table funcionario_presencas enable row level security;

drop policy if exists "select_presencas" on funcionario_presencas;
drop policy if exists "insert_presencas" on funcionario_presencas;
drop policy if exists "update_presencas" on funcionario_presencas;
drop policy if exists "delete_presencas" on funcionario_presencas;

create policy "select_presencas" on funcionario_presencas
  for select using (true);

create policy "insert_presencas" on funcionario_presencas
  for insert with check (true);

create policy "update_presencas" on funcionario_presencas
  for update using (true);

create policy "delete_presencas" on funcionario_presencas
  for delete using (true);
