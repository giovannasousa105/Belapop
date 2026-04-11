-- BelaPop - Curadoria fina de tags (produto por produto)
-- Pronto para colar no Supabase SQL Editor.

begin;

alter table public.products
  add column if not exists tags text[] not null default '{}'::text[];

-- 1) Seed de curadoria fina por produto (ajuste se quiser)
create temp table tmp_tag_seed (
  product_key text primary key,
  name_like text not null,
  add_tags text[] not null
) on commit drop;

insert into tmp_tag_seed (product_key, name_like, add_tags)
values
  ('serum_radiance_01', 'radiance 01', array['bp_curated','sensory','skin_hyperpigmentation','glow_deep_skin']::text[]),
  ('creme_barrier_celeste', 'barrier celeste', array['bp_curated','barrier_support','sensitive_skin','vegan']::text[]),
  ('mascara_lumiere', 'mascara lumiere', array['bp_curated','high_pigment']::text[]),
  ('blush_veu_rose', 'blush veu rose', array['bp_curated','high_pigment','glow_deep_skin','no_gray_cast']::text[]),
  ('oleo_capilar_nuit', 'oleo capilar nuit', array['bp_curated','hair_cacheado','hair_crespo','sensory']::text[]),
  ('escova_ritual_zen', 'escova ritual zen', array['bp_curated','giftable']::text[]),
  ('body_mist_rosa_profundo', 'body mist rosa profundo', array['bp_curated','sensory','giftable','ritual_pos_banho']::text[]),
  ('velas_calm_02', 'velas calm 02', array['bp_curated','sensory','giftable','ritual_noturno']::text[]),
  ('lip_tint_atelier', 'lip tint atelier', array['bp_curated','high_pigment','sem_ressecar','no_gray_cast']::text[]),
  ('gel_limpeza_veludo', 'gel limpeza veludo', array['bp_curated','sensitive_skin','barrier_support','sem_ressecar']::text[]),
  ('patch_olhos_aurora', 'patch olhos aurora', array['bp_curated','glow_deep_skin','sensitive_skin']::text[]),
  ('cha_botanical_calm', 'botanical calm', array['bp_curated','sensory','ritual_noturno','giftable']::text[]);

-- 2) Match robusto por nome (remove acento e lowercase)
create temp table tmp_tag_match on commit drop as
with target as (
  select
    p.id,
    p.slug,
    coalesce(p.title, p.name) as product_name,
    lower(
      translate(
        coalesce(p.title, p.name, ''),
        'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
        'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
      )
    ) as product_norm
  from public.products p
  where p.status in ('active', 'published')
)
select
  s.product_key,
  s.name_like,
  s.add_tags,
  t.id,
  t.slug,
  t.product_name
from tmp_tag_seed s
left join target t
  on t.product_norm like '%' || s.name_like || '%';

-- 3) Atualiza tags (merge com as existentes, sem duplicar)
with expanded as (
  select
    p.id,
    unnest(coalesce(p.tags, '{}'::text[])) as tag
  from public.products p
  join tmp_tag_match m on m.id = p.id

  union all

  select
    m.id,
    unnest(m.add_tags) as tag
  from tmp_tag_match m
  where m.id is not null
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

-- 4) QA: seed sem match
select
  s.product_key,
  s.name_like
from tmp_tag_seed s
left join tmp_tag_match m on m.product_key = s.product_key and m.id is not null
where m.id is null
order by s.product_key;

-- 5) QA: produtos atualizados
select
  p.slug,
  coalesce(p.title, p.name) as product_name,
  p.tags
from public.products p
join tmp_tag_match m on m.id = p.id
order by coalesce(p.title, p.name);

commit;
