-- Formação de Preço (Bottom-up) - Supabase SQL
-- Data: 2025-12-15
--
-- Este script cria as tabelas necessárias para persistir propostas, mão de obra,
-- logística (hospedagem/transporte), materiais e parâmetros financeiros.
-- Inclui RLS e policies básicas por usuário (auth.uid()).

-- Extensão para UUID
create extension if not exists "pgcrypto";

-- ============================================================================
-- TABELA PRINCIPAL: PROPOSTA
-- ============================================================================
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

-- Mantém updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_formacao_preco_propostas_updated_at on public.formacao_preco_propostas;
create trigger trg_formacao_preco_propostas_updated_at
before update on public.formacao_preco_propostas
for each row execute function public.set_updated_at();

-- ============================================================================
-- PARÂMETROS FINANCEIROS (1:1 com proposta)
-- ============================================================================
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

-- ============================================================================
-- MÃO DE OBRA (N:1)
-- ============================================================================
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

-- ============================================================================
-- LOGÍSTICA: HOSPEDAGEM/ALIMENTAÇÃO (N:1)
-- ============================================================================
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

-- ============================================================================
-- LOGÍSTICA: TRANSPORTE (N:1)
-- ============================================================================
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

-- ============================================================================
-- MATERIAIS / EQUIPAMENTOS / SERVIÇOS TERCEIROS (N:1)
-- ============================================================================
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

-- ============================================================================
-- RLS + POLICIES (por usuário)
-- ============================================================================
alter table public.formacao_preco_propostas enable row level security;
alter table public.formacao_preco_parametros enable row level security;
alter table public.formacao_preco_mao_de_obra enable row level security;
alter table public.formacao_preco_hospedagens enable row level security;
alter table public.formacao_preco_transportes enable row level security;
alter table public.formacao_preco_materiais enable row level security;

-- PROPOSTAS

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

-- ITENS (sempre amarrados a proposta do usuário)

-- Parametros (1:1): valida proposta pertence ao usuário

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

-- Mao de obra

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

-- Hospedagens

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

-- Transportes

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

-- Materiais

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
-- (Opcional) Sugestão: ao criar uma proposta, criar parâmetros automaticamente
-- Você pode fazer isso no app ou via trigger. Mantive fora para não impor fluxo.
-- ============================================================================

-- ============================================================================
-- MIGRAÇÃO (SE VOCÊ JÁ TINHA CRIADO COM salario_base)
-- ============================================================================
-- Se sua tabela public.formacao_preco_mao_de_obra já existia com a coluna salario_base,
-- rode este bloco para adicionar valor_diaria e (opcionalmente) migrar dados.

alter table public.formacao_preco_mao_de_obra
  add column if not exists valor_diaria numeric(14,2);

-- Migração sugerida (assume 22 dias úteis/mês). Ajuste se sua regra for diferente.
-- update public.formacao_preco_mao_de_obra
-- set valor_diaria = round((salario_base / 22.0)::numeric, 2)
-- where (valor_diaria is null or valor_diaria = 0) and salario_base is not null;

-- Garanta NOT NULL e constraint após migrar
-- alter table public.formacao_preco_mao_de_obra alter column valor_diaria set not null;
-- alter table public.formacao_preco_mao_de_obra add constraint formacao_preco_mao_de_obra_valor_diaria_chk check (valor_diaria >= 0);

-- Opcional: remover salario_base depois de migrar e atualizar o app
-- alter table public.formacao_preco_mao_de_obra drop column if exists salario_base;
