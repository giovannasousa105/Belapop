-- BelaPop - Curadoria fina V4 (auto, sem depender de slug fixo)
-- Objetivo: aplicar tags oficiais por heuristica em todos os produtos "vivos"
-- e permitir ajuste manual por slug exato no mesmo script.
-- Rode no Supabase SQL Editor.

begin;

create extension if not exists unaccent;

alter table public.products
  add column if not exists tags text[] not null default '{}'::text[];

-- =========================================================
-- 0) Base de produtos para curadoria
-- =========================================================
create temp table tmp_products_scope on commit drop as
select
  p.id,
  p.slug,
  coalesce(p.title, p.name) as product_name,
  lower(unaccent(coalesce(p.title, p.name, ''))) as name_norm,
  lower(unaccent(coalesce(p.category, ''))) as category_norm,
  p.status,
  coalesce(p.curated, false) as curated_flag,
  coalesce(p.is_featured, false) as featured_flag
from public.products p
where coalesce(p.status, '') not in ('archived', 'rejected');

-- =========================================================
-- 1) Tag base de curadoria (featured/curated/publicado)
-- =========================================================
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['bp_curated']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and (
    s.curated_flag = true
    or s.featured_flag = true
    or s.status in ('active', 'published')
  );

-- =========================================================
-- 2) Heuristicas por nome/categoria (Brasilidades + Editorial)
-- =========================================================
-- Hair: cacheado/crespo/transicao
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['hair_cacheado', 'hair_crespo']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and (
    s.category_norm like '%cabelo%'
    or s.name_norm like any (array['%cachea%', '%cresp%', '%curly%', '%definicao%'])
  );

update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['hair_transicao']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like '%transi%';

-- Make: alta pigmentacao / nao acinzenta / glow
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['high_pigment']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and (
    s.category_norm like '%maqui%'
    or s.name_norm like any (array['%base%', '%corretivo%', '%batom%', '%blush%', '%tint%', '%mascara%'])
  );

update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['no_gray_cast']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like any (array['%base%', '%corretivo%', '%contorno%', '%blush%']);

update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['glow_deep_skin']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like '%glow%';

-- Skin: manchas/barreira/sensivel/sem ressecar
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['skin_hyperpigmentation']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like any (array['%mancha%', '%pigment%', '%melasma%']);

update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['sensitive_skin', 'barrier_support']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like any (array['%barrier%', '%calm%', '%suave%', '%sensivel%', '%repair%', '%reparador%']);

update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['sem_ressecar']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like any (array['%sem ressecar%', '%hidrata%', '%hidratante%', '%conforto%']);

-- Sunscreen: sem efeito esbranquicado
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['no_white_cast']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like any (array['%protetor%', '%sunscreen%', '%fps%', '%uv%']);

-- Editorial: sensorial / presenteavel / ritual
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['sensory']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like any (array['%mist%', '%vela%', '%aroma%', '%sensorial%', '%essencia%', '%cha%']);

update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['giftable']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like any (array['%kit%', '%gift%', '%vela%', '%cha%', '%box%']);

update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['ritual_noturno']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like any (array['%night%', '%nuit%', '%noturno%', '%calm%']);

update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['ritual_pos_banho']::text[]) as t
)
from tmp_products_scope s
where s.id = p.id
  and s.name_norm like any (array['%body mist%', '%pos banho%', '%bruma corporal%']);

-- =========================================================
-- 3) Override manual por slug (opcional)
--    Edite as linhas abaixo para ajustes finos.
-- =========================================================
create temp table tmp_manual_slug_tags (
  slug text primary key,
  add_tags text[] not null
) on commit drop;

insert into tmp_manual_slug_tags (slug, add_tags)
values
  -- Exemplo:
  -- ('slug-real-do-produto', array['skin_tone_deep','no_gray_cast']::text[])
  ('__sem_override__', array[]::text[])
on conflict (slug) do nothing;

with manual_expanded as (
  select
    p.id,
    unnest(coalesce(p.tags, '{}'::text[])) as tag
  from public.products p
  join tmp_manual_slug_tags m on m.slug = p.slug
  where m.slug <> '__sem_override__'

  union all

  select
    p.id,
    unnest(m.add_tags) as tag
  from public.products p
  join tmp_manual_slug_tags m on m.slug = p.slug
  where m.slug <> '__sem_override__'
),
manual_merged as (
  select id, array_agg(distinct tag order by tag) as final_tags
  from manual_expanded
  group by id
)
update public.products p
set tags = mm.final_tags
from manual_merged mm
where p.id = mm.id;

-- =========================================================
-- 4) QA final
-- =========================================================
-- 4.1 Distribuicao por status
select
  status,
  count(*) as total
from public.products
group by status
order by status;

-- 4.1b Total de produtos (qualquer status)
select count(*) as total_products from public.products;

-- 4.1c Quantos estao tagueados (qualquer status)
select
  count(*) as total_any_status,
  count(*) filter (where cardinality(coalesce(tags, '{}'::text[])) > 0) as tagged_any_status
from public.products;

-- 4.2 Quantos ativos/publicados estao tagueados
select
  count(*) as total_live,
  count(*) filter (where cardinality(coalesce(tags, '{}'::text[])) > 0) as tagged_live
from public.products
where status in ('active', 'published');

-- 4.2b (Opcional) Publicar produtos para teste de vitrine/filtros
-- Use so se sua curadoria decidir liberar itens de draft/review.
-- update public.products
-- set status = 'published'
-- where status in ('draft', 'pending_review', 'needs_adjustment', 'review');

-- update public.products
-- set stock_quantity = 10
-- where coalesce(stock_quantity, 0) <= 0
--   and status in ('active', 'published');

-- 4.3 Produtos ativos/publicados sem tags (curadoria manual)
select
  slug,
  coalesce(title, name) as product_name,
  status
from public.products
where status in ('active', 'published')
  and cardinality(coalesce(tags, '{}'::text[])) = 0
order by created_at desc nulls last;

-- 4.4 Amostra final
select
  slug,
  coalesce(title, name) as product_name,
  status,
  tags
from public.products
where status in ('active', 'published')
order by created_at desc nulls last
limit 100;

commit;
