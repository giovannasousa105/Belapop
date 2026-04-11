-- BelaPop - Refino editorial manual por slug (foco Brasilidades)
-- Objetivo:
-- 1) garantir cobertura das tags-chave nos produtos live (active/published)
-- 2) aplicar manualmente por slug, sem heuristica
-- 3) falhar cedo se algum produto live ficar sem mapeamento
--
-- Rode no Supabase SQL Editor.

begin;

alter table public.products
  add column if not exists tags text[] not null default '{}'::text[];

-- =========================================================
-- 0) Escopo live atual
-- =========================================================
create temp table live_scope on commit drop as
select
  p.id,
  p.slug,
  coalesce(p.title, p.name) as product_name,
  coalesce(lower(p.status), '') as status_norm
from public.products p
where coalesce(lower(p.status), '') in ('active', 'published');

-- QA 0: lista live atual
select slug, product_name from live_scope order by slug;

-- =========================================================
-- 1) Mapa manual (ajuste aqui se necessario)
-- =========================================================
create temp table manual_map (
  slug text primary key,
  add_tags text[] not null
) on commit drop;

insert into manual_map (slug, add_tags)
values
  ('serum-radiance-01', array['bp_curated','skin_tone_deep','skin_hyperpigmentation','glow_deep_skin']::text[]),
  ('creme-barrier-celeste', array['bp_curated','skin_tone_deep','sensitive_skin','barrier_support']::text[]),
  ('blush-veu-rose', array['bp_curated','skin_tone_deep','high_pigment','no_gray_cast']::text[]),
  ('oleo-capilar-nuit', array['bp_curated','hair_crespo','hair_cacheado','hair_transicao','sensory']::text[]),
  ('patch-olhos-aurora', array['bp_curated','skin_tone_deep','sensitive_skin']::text[]),
  ('body-mist-rosa-profundo', array['bp_curated','skin_tone_deep','sensory','giftable','no_white_cast','ritual_pos_banho']::text[]);

-- =========================================================
-- 2) QA de cobertura do mapeamento
-- =========================================================
-- 2.1 Produtos live sem mapeamento
select
  l.slug as live_sem_map
from live_scope l
left join manual_map m on m.slug = l.slug
where m.slug is null
order by l.slug;

-- 2.2 Slugs mapeados que nao estao live
select
  m.slug as map_fora_do_live
from manual_map m
left join live_scope l on l.slug = m.slug
where l.slug is null
order by m.slug;

do $$
declare
  missing_live_count int;
begin
  select count(*)
  into missing_live_count
  from live_scope l
  left join manual_map m on m.slug = l.slug
  where m.slug is null;

  if missing_live_count > 0 then
    raise exception 'Abortado: % produto(s) live sem mapeamento manual.', missing_live_count;
  end if;
end
$$;

-- =========================================================
-- 3) Merge das tags (sem duplicacao)
-- =========================================================
with expanded as (
  select
    p.id,
    unnest(coalesce(p.tags, '{}'::text[])) as tag
  from public.products p
  join manual_map m on m.slug = p.slug

  union all

  select
    p.id,
    unnest(m.add_tags) as tag
  from public.products p
  join manual_map m on m.slug = p.slug
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

-- =========================================================
-- 4) QA final
-- =========================================================
-- 4.1 Cobertura Brasilidades nos live
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

-- 4.2 Conferencia final dos produtos live
select
  p.slug,
  coalesce(p.title, p.name) as product_name,
  p.status,
  p.tags
from public.products p
where coalesce(lower(p.status), '') in ('active', 'published')
order by p.slug;

commit;
