-- BelaPop - Refino editorial Brasilidades (6 produtos publicados)
-- Rode no Supabase SQL Editor.
-- Ajuste os slugs no bloco `manual_map` se necessario.

begin;

alter table public.products
  add column if not exists tags text[] not null default '{}'::text[];

create temp table manual_map (
  slug text primary key,
  add_tags text[] not null
) on commit drop;

insert into manual_map (slug, add_tags)
values
  ('serum-radiance-01', array['bp_curated', 'skin_tone_deep', 'skin_hyperpigmentation']::text[]),
  ('creme-barrier-celeste', array['bp_curated', 'skin_tone_deep', 'sensitive_skin', 'barrier_support']::text[]),
  ('blush-veu-rose', array['bp_curated', 'skin_tone_deep', 'high_pigment', 'no_gray_cast']::text[]),
  ('oleo-capilar-nuit', array['bp_curated', 'hair_crespo', 'hair_cacheado', 'hair_transicao']::text[]),
  ('patch-olhos-aurora', array['bp_curated', 'skin_tone_deep', 'sensitive_skin']::text[]),
  ('body-mist-rosa-profundo', array['bp_curated', 'sensory', 'giftable', 'ritual_pos_banho']::text[]);

-- QA 1: slugs do mapa que nao existem no banco
select
  m.slug as slug_sem_match
from manual_map m
left join public.products p on p.slug = m.slug
where p.id is null
order by m.slug;

with expanded as (
  select
    p.id,
    unnest(coalesce(p.tags, '{}'::text[])) as tag
  from public.products p
  join manual_map m on m.slug = p.slug
  where coalesce(lower(p.status), '') in ('active', 'published')

  union all

  select
    p.id,
    unnest(m.add_tags) as tag
  from public.products p
  join manual_map m on m.slug = p.slug
  where coalesce(lower(p.status), '') in ('active', 'published')
),
merged as (
  select
    id,
    array_agg(distinct tag order by tag) as final_tags
  from expanded
  group by id
)
update public.products p
set tags = merged.final_tags
from merged
where p.id = merged.id;

-- QA 2: cobertura de tags Brasilidades
select
  tag,
  count(*) as total
from public.products p
cross join lateral unnest(coalesce(p.tags, '{}'::text[])) as tag
where coalesce(lower(p.status), '') in ('active', 'published')
  and tag in (
    'skin_tone_deep',
    'skin_tone_rich',
    'skin_tone_medium',
    'skin_hyperpigmentation',
    'hair_crespo',
    'hair_cacheado',
    'hair_transicao',
    'no_gray_cast',
    'no_white_cast',
    'high_pigment'
  )
group by tag
order by total desc, tag;

-- QA 3: conferir os produtos refinados
select
  p.slug,
  coalesce(p.title, p.name) as product_name,
  p.status,
  p.tags
from public.products p
join manual_map m on m.slug = p.slug
order by p.slug;

commit;
