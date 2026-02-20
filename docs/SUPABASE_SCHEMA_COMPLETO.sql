-- SUPABASE_SCHEMA_COMPLETO.sql
-- Gerado em: 2025-12-18
--
-- Este script tenta criar "TUDO" que o app usa:
-- - Enums
-- - Tabelas: profiles, entidades, categorias, transacoes, transacoes_deletadas,
--           obras, propostas, proposta_itens, propostas_sequencia,
--           compromissos, dividas_parcelas,
--           obras_verbas, gastos_delegados,
--           e módulo Formação de Preço (formacao_preco_*)
-- - Triggers de updated_at
-- - RLS + policies (modo compartilhado para as tabelas do app)
--
-- Como rodar:
-- Supabase Dashboard -> SQL Editor -> New query -> cole e execute.

-- ============================================================================
-- EXTENSÕES
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Cria/atualiza profile automaticamente ao criar usuário (opcional, mas recomendado)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, nome_completo, role)
  values (new.id, new.email, display_name, 'viewer')
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

-- ============================================================================
-- ENUMS
-- ============================================================================
DO $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'socio_executor', 'user', 'viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'tipo_entidade') then
    create type public.tipo_entidade as enum ('cliente', 'fornecedor', 'funcionario', 'parceiro', 'socio');
  end if;

  if not exists (select 1 from pg_type where typname = 'tipo_transacao') then
    create type public.tipo_transacao as enum ('receita', 'despesa');
  end if;

  if not exists (select 1 from pg_type where typname = 'status_transacao') then
    create type public.status_transacao as enum ('pendente', 'pago', 'atrasado', 'cancelado');
  end if;

  if not exists (select 1 from pg_type where typname = 'status_obra') then
    create type public.status_obra as enum ('orcamento', 'aprovada', 'em_andamento', 'concluida', 'cancelada');
  end if;

  if not exists (select 1 from pg_type where typname = 'status_proposta') then
    create type public.status_proposta as enum ('rascunho', 'enviada', 'aprovada', 'rejeitada');
  end if;

  if not exists (select 1 from pg_type where typname = 'compromisso_tipo') then
    create type public.compromisso_tipo as enum ('reuniao', 'visita', 'entrega', 'pagamento', 'prazo', 'outro');
  end if;

  if not exists (select 1 from pg_type where typname = 'compromisso_prioridade') then
    create type public.compromisso_prioridade as enum ('baixa', 'media', 'alta', 'urgente');
  end if;

  if not exists (select 1 from pg_type where typname = 'verba_status') then
    create type public.verba_status as enum ('pendente_envio', 'ativa', 'prestacao_pendente', 'finalizada', 'cancelada');
  end if;
end $$;

-- ============================================================================
-- TABELA: PROFILES (perfil do usuário)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nome_completo text,
  role public.user_role not null default 'viewer',
  avatar_url text,
  entidade_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FK para entidades (criada depois que entidades existir). Se já existir, não recria.
DO $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='profiles')
     and exists (select 1 from information_schema.tables where table_schema='public' and table_name='entidades') then
    -- nada
    null;
  end if;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Trigger no auth.users (cria profile automaticamente)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================================
-- TABELA: ENTIDADES
-- ============================================================================
create table if not exists public.entidades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  nome text not null,
  tipo public.tipo_entidade not null,

  documento text,
  telefone text,
  email text,
  endereco text,
  observacoes text,

  ativo boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entidades_nome on public.entidades (nome);
create index if not exists idx_entidades_tipo on public.entidades (tipo);
create index if not exists idx_entidades_ativo on public.entidades (ativo);

drop trigger if exists trg_entidades_updated_at on public.entidades;
create trigger trg_entidades_updated_at
before update on public.entidades
for each row execute function public.set_updated_at();

-- Agora que entidades existe, cria FK do profiles.entidade_id se ainda não existir
DO $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema='public'
      and table_name='profiles'
      and constraint_name='profiles_entidade_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_entidade_id_fkey
      foreign key (entidade_id) references public.entidades(id) on delete set null;
  end if;
end $$;

-- ============================================================================
-- TABELA: CATEGORIAS
-- ============================================================================
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cor text not null default '#607d8b',
  tipo public.tipo_transacao not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_categorias_nome_tipo on public.categorias (nome, tipo);

drop trigger if exists trg_categorias_updated_at on public.categorias;
create trigger trg_categorias_updated_at
before update on public.categorias
for each row execute function public.set_updated_at();

-- ============================================================================
-- TABELA: OBRAS
-- ============================================================================
create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  cliente_id uuid references public.entidades(id) on delete set null,

  nome text not null,
  descricao text,
  status public.status_obra not null default 'orcamento',

  data_inicio date,
  data_previsao date,
  data_conclusao date,

  valor_total_orcamento numeric(14,2) not null default 0 check (valor_total_orcamento >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_obras_status on public.obras (status);
create index if not exists idx_obras_cliente_id on public.obras (cliente_id);

drop trigger if exists trg_obras_updated_at on public.obras;
create trigger trg_obras_updated_at
before update on public.obras
for each row execute function public.set_updated_at();

-- ============================================================================
-- TABELA: TRANSACOES
-- ============================================================================
create table if not exists public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  descricao text not null,
  valor numeric(14,2) not null check (valor >= 0),

  tipo public.tipo_transacao not null,
  status public.status_transacao not null default 'pendente',

  categoria text not null,

  data_vencimento date,
  data_pagamento date,

  entidade_id uuid references public.entidades(id) on delete set null,
  obra_id uuid references public.obras(id) on delete set null,

  observacao text,

  is_parcelada boolean not null default false,
  numero_parcelas integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transacoes_tipo on public.transacoes (tipo);
create index if not exists idx_transacoes_status on public.transacoes (status);
create index if not exists idx_transacoes_data_vencimento on public.transacoes (data_vencimento);
create index if not exists idx_transacoes_data_pagamento on public.transacoes (data_pagamento);
create index if not exists idx_transacoes_entidade_id on public.transacoes (entidade_id);
create index if not exists idx_transacoes_obra_id on public.transacoes (obra_id);

drop trigger if exists trg_transacoes_updated_at on public.transacoes;
create trigger trg_transacoes_updated_at
before update on public.transacoes
for each row execute function public.set_updated_at();

-- ============================================================================
-- TABELA: TRANSACOES_DELETADAS (histórico)
-- ============================================================================
create table if not exists public.transacoes_deletadas (
  id uuid primary key default gen_random_uuid(),
  transacao_original jsonb not null,
  deleted_at timestamptz not null default now(),
  deleted_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_transacoes_deletadas_deleted_at on public.transacoes_deletadas (deleted_at);

-- ============================================================================
-- TABELA: DIVIDAS_PARCELAS
-- ============================================================================
create table if not exists public.dividas_parcelas (
  id uuid primary key default gen_random_uuid(),
  transacao_id uuid not null references public.transacoes(id) on delete cascade,

  numero_parcela integer not null check (numero_parcela >= 1),
  valor numeric(14,2) not null check (valor >= 0),
  data_vencimento date not null,
  data_pagamento date,
  status public.status_transacao not null default 'pendente',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dividas_parcelas_transacao_id on public.dividas_parcelas (transacao_id);
create index if not exists idx_dividas_parcelas_status on public.dividas_parcelas (status);

drop trigger if exists trg_dividas_parcelas_updated_at on public.dividas_parcelas;
create trigger trg_dividas_parcelas_updated_at
before update on public.dividas_parcelas
for each row execute function public.set_updated_at();

-- ============================================================================
-- TABELA: PROPOSTAS
-- ============================================================================
create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  numero_sequencial integer,
  numero_revisao integer not null default 1,

  cliente_nome text not null,
  cliente_empresa text,
  descricao_servicos text not null,
  valor_total numeric(14,2) not null default 0 check (valor_total >= 0),
  status public.status_proposta not null default 'rascunho',

  data_emissao date default (now()::date),
  validade text,
  prazo_producao text,
  prazo_instalacao text,
  condicoes_pagamento text,
  observacoes text,
  escopo_tecnico text,

  obra_gerada_id uuid references public.obras(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_propostas_status on public.propostas (status);
create index if not exists idx_propostas_numero_sequencial on public.propostas (numero_sequencial);

drop trigger if exists trg_propostas_updated_at on public.propostas;
create trigger trg_propostas_updated_at
before update on public.propostas
for each row execute function public.set_updated_at();

-- ============================================================================
-- TABELA: PROPOSTA_ITENS
-- ============================================================================
create table if not exists public.proposta_itens (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.propostas(id) on delete cascade,

  descricao text not null,
  quantidade numeric(14,4) not null default 0 check (quantidade >= 0),
  unidade text not null default 'un',
  valor_unitario numeric(14,2) not null default 0 check (valor_unitario >= 0),
  valor_total numeric(14,2) not null default 0 check (valor_total >= 0),

  created_at timestamptz not null default now()
);

create index if not exists idx_proposta_itens_proposta_id on public.proposta_itens (proposta_id);

-- ============================================================================
-- TABELA: PROPOSTAS_SEQUENCIA
-- ============================================================================
create table if not exists public.propostas_sequencia (
  id integer primary key,
  ultimo_numero integer not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_propostas_sequencia_updated_at on public.propostas_sequencia;
create trigger trg_propostas_sequencia_updated_at
before update on public.propostas_sequencia
for each row execute function public.set_updated_at();

-- ============================================================================
-- TABELA: COMPROMISSOS
-- ============================================================================
create table if not exists public.compromissos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  titulo text not null,
  descricao text,
  data_inicio timestamptz not null,
  data_fim timestamptz,

  tipo public.compromisso_tipo not null default 'outro',
  prioridade public.compromisso_prioridade not null default 'media',

  obra_id uuid references public.obras(id) on delete set null,

  concluido boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_compromissos_data_inicio on public.compromissos (data_inicio);
create index if not exists idx_compromissos_obra_id on public.compromissos (obra_id);

drop trigger if exists trg_compromissos_updated_at on public.compromissos;
create trigger trg_compromissos_updated_at
before update on public.compromissos
for each row execute function public.set_updated_at();

-- ============================================================================
-- TABELAS: DELEGAÇÃO DE OBRAS
-- ============================================================================
create table if not exists public.obras_verbas (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  delegado_para_id uuid not null references public.entidades(id) on delete restrict,

  valor_delegado numeric(14,2) not null default 0 check (valor_delegado >= 0),
  status public.verba_status not null default 'pendente_envio',

  transacao_caixa_id uuid references public.transacoes(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_obras_verbas_obra_id on public.obras_verbas (obra_id);
create index if not exists idx_obras_verbas_delegado_para_id on public.obras_verbas (delegado_para_id);
create index if not exists idx_obras_verbas_status on public.obras_verbas (status);

drop trigger if exists trg_obras_verbas_updated_at on public.obras_verbas;
create trigger trg_obras_verbas_updated_at
before update on public.obras_verbas
for each row execute function public.set_updated_at();

create table if not exists public.gastos_delegados (
  id uuid primary key default gen_random_uuid(),
  verba_id uuid not null references public.obras_verbas(id) on delete cascade,

  descricao text not null,
  valor numeric(14,2) not null check (valor >= 0),
  categoria text not null,
  comprovante_url text not null,

  aprovado boolean,
  aprovado_em timestamptz,

  transacao_obra_id uuid references public.transacoes(id) on delete set null,

  registrado_por_id uuid,
  registrado_por_nome text,
  data_registro date,
  hora_registro text,

  created_at timestamptz not null default now()
);

create index if not exists idx_gastos_delegados_verba_id on public.gastos_delegados (verba_id);
create index if not exists idx_gastos_delegados_created_at on public.gastos_delegados (created_at);

-- ============================================================================
-- MÓDULO: FORMAÇÃO DE PREÇO (copiado do docs/supabase_formacao_preco.sql)
-- ============================================================================

-- TABELA PRINCIPAL: PROPOSTA (formação de preço)
create table if not exists public.formacao_preco_propostas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  nome text not null default '',
  cliente text not null default '',
  obra text not null default '',
  data_elaboracao date not null default (now()::date),

  status text not null default 'rascunho' check (status in ('rascunho','em_analise','aprovada','rejeitada')),
  observacoes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_formacao_preco_propostas_user_id
  on public.formacao_preco_propostas(user_id);

create index if not exists idx_formacao_preco_propostas_status
  on public.formacao_preco_propostas(status);

drop trigger if exists trg_formacao_preco_propostas_updated_at on public.formacao_preco_propostas;
create trigger trg_formacao_preco_propostas_updated_at
before update on public.formacao_preco_propostas
for each row execute function public.set_updated_at();

-- PARÂMETROS FINANCEIROS (1:1 com proposta)
create table if not exists public.formacao_preco_parametros (
  proposta_id uuid primary key references public.formacao_preco_propostas(id) on delete cascade,

  bdi numeric(10,6) not null default 0.20 check (bdi >= 0 and bdi <= 1),
  margem_lucro numeric(10,6) not null default 0.15 check (margem_lucro >= 0 and margem_lucro <= 1),
  taxa_impostos numeric(10,6) not null default 0.165 check (taxa_impostos >= 0 and taxa_impostos < 1),
  contingencia numeric(10,6) not null default 0.05 check (contingencia >= 0 and contingencia <= 1),
  encargos_sociais numeric(10,6) not null default 0.70 check (encargos_sociais >= 0 and encargos_sociais <= 1),
  beneficios numeric(10,6) not null default 0.12 check (beneficios >= 0 and beneficios <= 1),
  fator_produtividade numeric(10,6) not null default 1.08 check (fator_produtividade >= 1 and fator_produtividade <= 3),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_formacao_preco_parametros_updated_at on public.formacao_preco_parametros;
create trigger trg_formacao_preco_parametros_updated_at
before update on public.formacao_preco_parametros
for each row execute function public.set_updated_at();

-- MÃO DE OBRA (N:1)
create table if not exists public.formacao_preco_mao_de_obra (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.formacao_preco_propostas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  cargo text not null,
  valor_diaria numeric(14,2) not null default 0 check (valor_diaria >= 0),
  qtd_pessoas integer not null default 1 check (qtd_pessoas >= 1),
  dias_na_obra integer not null default 22 check (dias_na_obra >= 0),
  horas_normais numeric(12,2) not null default 0 check (horas_normais >= 0),
  horas_extras_50 numeric(12,2) not null default 0 check (horas_extras_50 >= 0),
  horas_extras_100 numeric(12,2) not null default 0 check (horas_extras_100 >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_formacao_preco_mao_de_obra_proposta_id
  on public.formacao_preco_mao_de_obra(proposta_id);

create index if not exists idx_formacao_preco_mao_de_obra_user_id
  on public.formacao_preco_mao_de_obra(user_id);

drop trigger if exists trg_formacao_preco_mao_de_obra_updated_at on public.formacao_preco_mao_de_obra;
create trigger trg_formacao_preco_mao_de_obra_updated_at
before update on public.formacao_preco_mao_de_obra
for each row execute function public.set_updated_at();

-- LOGÍSTICA: HOSPEDAGEM/ALIMENTAÇÃO (N:1)
create table if not exists public.formacao_preco_hospedagens (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.formacao_preco_propostas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  descricao text not null,
  valor_diaria numeric(14,2) not null default 0 check (valor_diaria >= 0),
  dias_viajados integer not null default 0 check (dias_viajados >= 0),
  qtd_pessoas integer not null default 1 check (qtd_pessoas >= 1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_formacao_preco_hospedagens_proposta_id
  on public.formacao_preco_hospedagens(proposta_id);

create index if not exists idx_formacao_preco_hospedagens_user_id
  on public.formacao_preco_hospedagens(user_id);

drop trigger if exists trg_formacao_preco_hospedagens_updated_at on public.formacao_preco_hospedagens;
create trigger trg_formacao_preco_hospedagens_updated_at
before update on public.formacao_preco_hospedagens
for each row execute function public.set_updated_at();

-- LOGÍSTICA: TRANSPORTE (N:1)
create table if not exists public.formacao_preco_transportes (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.formacao_preco_propostas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  descricao text not null,
  distancia_km numeric(14,2) not null default 0 check (distancia_km >= 0),
  consumo_km_por_litro numeric(14,4) not null default 10 check (consumo_km_por_litro > 0),
  preco_combustivel numeric(14,2) not null default 0 check (preco_combustivel >= 0),
  pedagios numeric(14,2) not null default 0 check (pedagios >= 0),
  qtd_viagens integer not null default 1 check (qtd_viagens >= 1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_formacao_preco_transportes_proposta_id
  on public.formacao_preco_transportes(proposta_id);

create index if not exists idx_formacao_preco_transportes_user_id
  on public.formacao_preco_transportes(user_id);

drop trigger if exists trg_formacao_preco_transportes_updated_at on public.formacao_preco_transportes;
create trigger trg_formacao_preco_transportes_updated_at
before update on public.formacao_preco_transportes
for each row execute function public.set_updated_at();

-- MATERIAIS / EQUIPAMENTOS / SERVIÇOS TERCEIROS (N:1)
create table if not exists public.formacao_preco_materiais (
  id uuid primary key default gen_random_uuid(),
  proposta_id uuid not null references public.formacao_preco_propostas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  descricao text not null,
  unidade text not null default 'un',
  quantidade numeric(14,4) not null default 0 check (quantidade >= 0),
  preco_unitario numeric(14,2) not null default 0 check (preco_unitario >= 0),
  categoria text not null check (categoria in ('material','equipamento','servico_terceiro')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_formacao_preco_materiais_proposta_id
  on public.formacao_preco_materiais(proposta_id);

create index if not exists idx_formacao_preco_materiais_user_id
  on public.formacao_preco_materiais(user_id);

drop trigger if exists trg_formacao_preco_materiais_updated_at on public.formacao_preco_materiais;
create trigger trg_formacao_preco_materiais_updated_at
before update on public.formacao_preco_materiais
for each row execute function public.set_updated_at();

-- RLS + POLICIES (Formação de Preço por usuário)
alter table public.formacao_preco_propostas enable row level security;
alter table public.formacao_preco_parametros enable row level security;
alter table public.formacao_preco_mao_de_obra enable row level security;
alter table public.formacao_preco_hospedagens enable row level security;
alter table public.formacao_preco_transportes enable row level security;
alter table public.formacao_preco_materiais enable row level security;

drop policy if exists "fp_propostas_select" on public.formacao_preco_propostas;
create policy "fp_propostas_select"
on public.formacao_preco_propostas
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "fp_propostas_insert" on public.formacao_preco_propostas;
create policy "fp_propostas_insert"
on public.formacao_preco_propostas
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "fp_propostas_update" on public.formacao_preco_propostas;
create policy "fp_propostas_update"
on public.formacao_preco_propostas
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "fp_propostas_delete" on public.formacao_preco_propostas;
create policy "fp_propostas_delete"
on public.formacao_preco_propostas
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "fp_parametros_select" on public.formacao_preco_parametros;
create policy "fp_parametros_select"
on public.formacao_preco_parametros
for select
to authenticated
using (
  exists (
    select 1 from public.formacao_preco_propostas p
    where p.id = proposta_id and p.user_id = auth.uid()
  )
);

drop policy if exists "fp_parametros_insert" on public.formacao_preco_parametros;
create policy "fp_parametros_insert"
on public.formacao_preco_parametros
for insert
to authenticated
with check (
  exists (
    select 1 from public.formacao_preco_propostas p
    where p.id = proposta_id and p.user_id = auth.uid()
  )
);

drop policy if exists "fp_parametros_update" on public.formacao_preco_parametros;
create policy "fp_parametros_update"
on public.formacao_preco_parametros
for update
to authenticated
using (
  exists (
    select 1 from public.formacao_preco_propostas p
    where p.id = proposta_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.formacao_preco_propostas p
    where p.id = proposta_id and p.user_id = auth.uid()
  )
);

drop policy if exists "fp_parametros_delete" on public.formacao_preco_parametros;
create policy "fp_parametros_delete"
on public.formacao_preco_parametros
for delete
to authenticated
using (
  exists (
    select 1 from public.formacao_preco_propostas p
    where p.id = proposta_id and p.user_id = auth.uid()
  )
);

drop policy if exists "fp_mdo_select" on public.formacao_preco_mao_de_obra;
create policy "fp_mdo_select"
on public.formacao_preco_mao_de_obra
for select
to authenticated
using (
  user_id = auth.uid() and
  exists (select 1 from public.formacao_preco_propostas p where p.id = proposta_id and p.user_id = auth.uid())
);

drop policy if exists "fp_mdo_insert" on public.formacao_preco_mao_de_obra;
create policy "fp_mdo_insert"
on public.formacao_preco_mao_de_obra
for insert
to authenticated
with check (
  user_id = auth.uid() and
  exists (select 1 from public.formacao_preco_propostas p where p.id = proposta_id and p.user_id = auth.uid())
);

drop policy if exists "fp_mdo_update" on public.formacao_preco_mao_de_obra;
create policy "fp_mdo_update"
on public.formacao_preco_mao_de_obra
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "fp_mdo_delete" on public.formacao_preco_mao_de_obra;
create policy "fp_mdo_delete"
on public.formacao_preco_mao_de_obra
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "fp_hosp_select" on public.formacao_preco_hospedagens;
create policy "fp_hosp_select"
on public.formacao_preco_hospedagens
for select
to authenticated
using (
  user_id = auth.uid() and
  exists (select 1 from public.formacao_preco_propostas p where p.id = proposta_id and p.user_id = auth.uid())
);

drop policy if exists "fp_hosp_insert" on public.formacao_preco_hospedagens;
create policy "fp_hosp_insert"
on public.formacao_preco_hospedagens
for insert
to authenticated
with check (
  user_id = auth.uid() and
  exists (select 1 from public.formacao_preco_propostas p where p.id = proposta_id and p.user_id = auth.uid())
);

drop policy if exists "fp_hosp_update" on public.formacao_preco_hospedagens;
create policy "fp_hosp_update"
on public.formacao_preco_hospedagens
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "fp_hosp_delete" on public.formacao_preco_hospedagens;
create policy "fp_hosp_delete"
on public.formacao_preco_hospedagens
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "fp_transp_select" on public.formacao_preco_transportes;
create policy "fp_transp_select"
on public.formacao_preco_transportes
for select
to authenticated
using (
  user_id = auth.uid() and
  exists (select 1 from public.formacao_preco_propostas p where p.id = proposta_id and p.user_id = auth.uid())
);

drop policy if exists "fp_transp_insert" on public.formacao_preco_transportes;
create policy "fp_transp_insert"
on public.formacao_preco_transportes
for insert
to authenticated
with check (
  user_id = auth.uid() and
  exists (select 1 from public.formacao_preco_propostas p where p.id = proposta_id and p.user_id = auth.uid())
);

drop policy if exists "fp_transp_update" on public.formacao_preco_transportes;
create policy "fp_transp_update"
on public.formacao_preco_transportes
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "fp_transp_delete" on public.formacao_preco_transportes;
create policy "fp_transp_delete"
on public.formacao_preco_transportes
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "fp_mat_select" on public.formacao_preco_materiais;
create policy "fp_mat_select"
on public.formacao_preco_materiais
for select
to authenticated
using (
  user_id = auth.uid() and
  exists (select 1 from public.formacao_preco_propostas p where p.id = proposta_id and p.user_id = auth.uid())
);

drop policy if exists "fp_mat_insert" on public.formacao_preco_materiais;
create policy "fp_mat_insert"
on public.formacao_preco_materiais
for insert
to authenticated
with check (
  user_id = auth.uid() and
  exists (select 1 from public.formacao_preco_propostas p where p.id = proposta_id and p.user_id = auth.uid())
);

drop policy if exists "fp_mat_update" on public.formacao_preco_materiais;
create policy "fp_mat_update"
on public.formacao_preco_materiais
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "fp_mat_delete" on public.formacao_preco_materiais;
create policy "fp_mat_delete"
on public.formacao_preco_materiais
for delete
to authenticated
using (user_id = auth.uid());

-- ============================================================================
-- RLS: MODO COMPARTILHADO (authenticated vê/insere/edita/apaga tudo)
-- ============================================================================

-- Profiles: por padrão, apenas o próprio usuário.
alter table if exists public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Tabelas principais do app: permissivo (conforme docs/supabase_rls_compartilhado_geral.sql)
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
alter table if exists public.obras_verbas enable row level security;
alter table if exists public.gastos_delegados enable row level security;

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
