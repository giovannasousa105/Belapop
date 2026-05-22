-- Go-live resilience for catalog search and PDP lote lookup.
-- Idempotent and intentionally conservative: no destructive changes.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lote_status') then
    create type public.lote_status as enum (
      'ABERTO',
      'EM_ESGOTAMENTO',
      'ENCERRADO',
      'REPOSICAO_PREVISTA',
      'SUSPENSO'
    );
  end if;
end
$$;

alter table public.products
  add column if not exists universo text,
  add column if not exists necessidades text[] default '{}',
  add column if not exists tipo_pele_indicado text[] default '{}',
  add column if not exists nivel_sensibilidade_max int default 5,
  add column if not exists passo_rotina text,
  add column if not exists periodo text,
  add column if not exists duracao_media_dias int default 60,
  add column if not exists ativos_principais text[] default '{}',
  add column if not exists total_vendas_30d int default 0,
  add column if not exists rating_medio numeric(3,2) default 0,
  add column if not exists total_avaliacoes int default 0,
  add column if not exists curated boolean default false,
  add column if not exists is_featured boolean default false;

create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid,
  sku_externo varchar(255),
  qtd_total int not null default 0 check (qtd_total >= 0),
  qtd_disponivel int not null default 0 check (qtd_disponivel >= 0),
  qtd_reservada int not null default 0 check (qtd_reservada >= 0),
  limiar_alerta_pct int not null default 20 check (limiar_alerta_pct between 1 and 100),
  status public.lote_status not null default 'ABERTO',
  verificado_em timestamptz,
  aberto_em timestamptz not null default now(),
  encerrado_em timestamptz,
  data_reposicao date,
  notas_internas text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint lotes_qtd_consistente check (qtd_disponivel + qtd_reservada <= qtd_total)
);

create index if not exists idx_lotes_produto_status
  on public.lotes (produto_id, status);

create index if not exists idx_lotes_seller
  on public.lotes (seller_id);

alter table public.lotes enable row level security;

do $$ begin
  create policy lotes_public_read
    on public.lotes for select to public
    using (status <> 'SUSPENSO');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy lotes_service_all
    on public.lotes for all to service_role
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

create table if not exists public.wishlist_itens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  compat_score smallint check (compat_score >= 0 and compat_score <= 100),
  tipo_pele text,
  criado_em timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_wishlist_itens_user
  on public.wishlist_itens (user_id, criado_em desc);

alter table public.wishlist_itens enable row level security;

do $$ begin
  create policy wishlist_itens_self
    on public.wishlist_itens for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy wishlist_itens_service
    on public.wishlist_itens for all to service_role
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

create table if not exists public.produto_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nota smallint not null check (nota >= 1 and nota <= 5),
  titulo text,
  texto text,
  tipo_pele text,
  compat_score smallint check (compat_score >= 0 and compat_score <= 100),
  aprovada boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_produto_avaliacoes_product
  on public.produto_avaliacoes (product_id, aprovada, criado_em desc);

alter table public.produto_avaliacoes enable row level security;

do $$ begin
  create policy produto_avaliacoes_public_read
    on public.produto_avaliacoes for select to public
    using (aprovada = true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy produto_avaliacoes_self
    on public.produto_avaliacoes for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy produto_avaliacoes_service
    on public.produto_avaliacoes for all to service_role
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

create or replace function public.fn_buscar_produtos(
  p_query text default null,
  p_universo text default null,
  p_necessidades text[] default null,
  p_tipo_pele text[] default null,
  p_sensibilidade_max int default null,
  p_passo_rotina text default null,
  p_periodo text default null,
  p_preco_min int default null,
  p_preco_max int default null,
  p_curated boolean default null,
  p_user_id uuid default null,
  p_compat_scores jsonb default null,
  p_limit int default 24,
  p_offset int default 0,
  p_sort text default 'relevancia'
)
returns table (
  id uuid,
  name text,
  brand text,
  price_cents int,
  images jsonb,
  universo text,
  necessidades text[],
  tipo_pele_indicado text[],
  nivel_sensibilidade_max int,
  passo_rotina text,
  periodo text,
  total_vendas_30d int,
  rating_medio numeric,
  total_avaliacoes int,
  curated boolean,
  is_featured boolean,
  stock_quantity int,
  compat_score smallint,
  na_wishlist boolean,
  rank_score double precision,
  total_count bigint
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      p.id,
      p.name::text,
      p.brand::text,
      p.price_cents,
      p.images::jsonb,
      p.universo,
      p.necessidades,
      p.tipo_pele_indicado,
      p.nivel_sensibilidade_max,
      p.passo_rotina,
      p.periodo,
      p.total_vendas_30d,
      p.rating_medio,
      p.total_avaliacoes,
      p.curated,
      p.is_featured,
      p.stock_quantity,
      (p_compat_scores->>p.id::text)::smallint as compat_score,
      (
        p_user_id is not null and exists (
          select 1 from public.wishlist_itens wi
          where wi.user_id = p_user_id and wi.product_id = p.id
        )
      ) as na_wishlist,
      case p_sort
        when 'mais_vendidos' then coalesce(p.total_vendas_30d, 0)::double precision
        when 'melhor_avaliados' then coalesce(p.rating_medio, 0)::double precision * ln(1 + coalesce(p.total_avaliacoes, 0))
        when 'preco_asc' then (100000000 - coalesce(p.price_cents, 0))::double precision
        when 'preco_desc' then coalesce(p.price_cents, 0)::double precision
        else
          (case when coalesce(p.is_featured, false) then 8 else 0 end)::double precision +
          (case when coalesce(p.curated, false) then 5 else 0 end)::double precision +
          ln(1 + coalesce(p.total_vendas_30d, 0)) +
          coalesce(p.rating_medio, 0)::double precision
      end as rank_score
    from public.products p
    where p.status = 'published'
      and coalesce(p.stock_quantity, 0) > 0
      and coalesce(p.price_cents, 0) > 0
      and (
        p_query is null or p_query = '' or
        p.name ilike '%' || p_query || '%' or
        p.brand ilike '%' || p_query || '%' or
        p.description ilike '%' || p_query || '%'
      )
      and (p_universo is null or p.universo = p_universo)
      and (p_necessidades is null or p.necessidades && p_necessidades)
      and (p_tipo_pele is null or p.tipo_pele_indicado && p_tipo_pele)
      and (p_sensibilidade_max is null or p.nivel_sensibilidade_max >= p_sensibilidade_max)
      and (p_passo_rotina is null or p.passo_rotina = p_passo_rotina)
      and (p_periodo is null or p.periodo = p_periodo or p.periodo = 'ambos')
      and (p_preco_min is null or p.price_cents >= p_preco_min)
      and (p_preco_max is null or p.price_cents <= p_preco_max)
      and (p_curated is null or p.curated = p_curated)
  ),
  counted as (
    select *, count(*) over () as total_count
    from base
    order by rank_score desc
    limit greatest(1, least(coalesce(p_limit, 24), 48))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select * from counted;
$$;

grant execute on function public.fn_buscar_produtos to authenticated, service_role;

notify pgrst, 'reload schema';
