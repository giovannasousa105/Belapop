-- BelaPop - SQL pronto para popular tags oficiais no catalogo
-- Rode no Supabase SQL Editor.

begin;

alter table public.products
  add column if not exists tags text[] not null default '{}'::text[];

-- 1) Curadoria base para itens publicados/ativos
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['bp_curated']::text[]) as t
)
where p.status in ('active', 'published')
  and coalesce(p.curated, false) = true;

update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['bp_curated']::text[]) as t
)
where p.status in ('active', 'published')
  and coalesce(p.is_featured, false) = true;

-- 2) Regras automaticas (pode ajustar depois)
-- Make: alta pigmentacao
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['high_pigment']::text[]) as t
)
where p.status in ('active', 'published')
  and (
    lower(coalesce(p.name, '')) like any (array['%base%', '%corretivo%', '%batom%', '%blush%', '%tint%'])
    or lower(coalesce(p.category, '')) like '%maqui%'
  );

-- Protetor solar sem white cast
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['no_white_cast']::text[]) as t
)
where p.status in ('active', 'published')
  and lower(coalesce(p.name, '')) like any (array['%protetor%', '%sunscreen%']);

-- Cabelos: cacheado/crespo
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['hair_cacheado', 'hair_crespo']::text[]) as t
)
where p.status in ('active', 'published')
  and lower(coalesce(p.category, '')) like '%cabelo%';

-- Transicao capilar
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['hair_transicao']::text[]) as t
)
where p.status in ('active', 'published')
  and lower(coalesce(p.name, '')) like '%transi%';

-- Hiperpigmentacao/manchas
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['skin_hyperpigmentation']::text[]) as t
)
where p.status in ('active', 'published')
  and lower(coalesce(p.name, '')) like any (array['%mancha%', '%pigment%']);

-- Pele sensivel / barreira
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['sensitive_skin', 'barrier_support']::text[]) as t
)
where p.status in ('active', 'published')
  and lower(coalesce(p.name, '')) like any (array['%barrier%', '%calm%', '%suave%', '%sensivel%']);

-- Glow elegante
update public.products p
set tags = (
  select array_agg(distinct t order by t)
  from unnest(coalesce(p.tags, '{}'::text[]) || array['glow_deep_skin']::text[]) as t
)
where p.status in ('active', 'published')
  and lower(coalesce(p.name, '')) like '%glow%';

-- 3) QA rapido
select
  count(*) as total_active,
  count(*) filter (where cardinality(coalesce(tags, '{}'::text[])) > 0) as tagged_active
from public.products
where status in ('active', 'published');

select
  slug,
  name,
  tags
from public.products
where status in ('active', 'published')
order by created_at desc nulls last
limit 100;

commit;
