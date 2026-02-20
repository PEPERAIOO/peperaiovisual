-- ============================================================================
-- TABELA: NOTIFICACOES
-- Armazena notificações do sistema (ações importantes)
-- ============================================================================

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  tipo text not null,
  titulo text not null,
  mensagem text not null,
  prioridade text not null default 'baixa',
  lida boolean not null default false,

  link text,
  metadata jsonb,

  data_referencia timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Índices úteis
create index if not exists notificacoes_user_id_idx on public.notificacoes(user_id);
create index if not exists notificacoes_created_at_idx on public.notificacoes(created_at desc);

-- RLS
alter table public.notificacoes enable row level security;

-- Política: cada usuário acessa apenas suas notificações
create policy "notificacoes_select_own"
  on public.notificacoes
  for select
  using (auth.uid() = user_id);

create policy "notificacoes_insert_own"
  on public.notificacoes
  for insert
  with check (auth.uid() = user_id);

create policy "notificacoes_update_own"
  on public.notificacoes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
