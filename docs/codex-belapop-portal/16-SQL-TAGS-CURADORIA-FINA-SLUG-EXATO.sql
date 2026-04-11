-- BelaPop - Curadoria fina V2 (match por slug exato)
-- Rode no Supabase SQL Editor.
-- Mais rigido: so aplica tag quando o slug bate exatamente.

begin;

alter table public.products
  add column if not exists tags text[] not null default '{}'::text[];

create temp table tmp_slug_tags (
  slug text primary key,
  add_tags text[] not null
) on commit drop;

insert into tmp_slug_tags (slug, add_tags)
values
  ('serum-radiance-01', array['bp_curated','sensory','skin_hyperpigmentation','glow_deep_skin']::text[]),
  ('creme-barrier-celeste', array['bp_curated','barrier_support','sensitive_skin','vegan']::text[]),
  ('mascara-lumiere', array['bp_curated','high_pigment']::text[]),
  ('blush-veu-rose', array['bp_curated','high_pigment','glow_deep_skin','no_gray_cast']::text[]),
  ('oleo-capilar-nuit', array['bp_curated','hair_cacheado','hair_crespo','sensory']::text[]),
  ('escova-ritual-zen', array['bp_curated','giftable']::text[]),
  ('body-mist-rosa-profundo', array['bp_curated','sensory','giftable','ritual_pos_banho']::text[]),
  ('velas-calm-02', array['bp_curated','sensory','giftable','ritual_noturno']::text[]),
  ('lip-tint-atelier', array['bp_curated','high_pigment','sem_ressecar','no_gray_cast']::text[]),
  ('gel-limpeza-veludo', array['bp_curated','sensitive_skin','barrier_support','sem_ressecar']::text[]),
  ('patch-olhos-aurora', array['bp_curated','glow_deep_skin','sensitive_skin']::text[]),
  ('cha-botanical-calm', array['bp_curated','sensory','ritual_noturno','giftable']::text[]);

-- 1) QA antes: slugs do seed que nao existem no banco
select
  s.slug as slug_sem_match
from tmp_slug_tags s
left join public.products p on p.slug = s.slug
where p.id is null
order by s.slug;

-- 2) Atualiza somente slugs existentes e ativos/publicados
with expanded as (
  select
    p.id,
    unnest(coalesce(p.tags, '{}'::text[])) as tag
  from public.products p
  join tmp_slug_tags s on s.slug = p.slug
  where p.status in ('active', 'published')

  union all

  select
    p.id,
    unnest(s.add_tags) as tag
  from public.products p
  join tmp_slug_tags s on s.slug = p.slug
  where p.status in ('active', 'published')
),
merged as (
  select
    id,
    array_agg(distinct tag order by tag) as final_tags
  from expanded
  group by id
)
update public.products p
set tags = m.final_tags
from merged m
where p.id = m.id;

-- 3) QA depois: conferir aplicacao
select
  p.slug,
  coalesce(p.title, p.name) as product_name,
  p.tags
from public.products p
join tmp_slug_tags s on s.slug = p.slug
order by p.slug;

commit;
