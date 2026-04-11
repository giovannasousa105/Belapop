-- BelaPop - SQL template para preencher tags oficiais (Brasilidades + Editorial)
-- Onde rodar: Supabase SQL Editor (projeto remoto)
-- Objetivo: padronizar tags em snake_case e preencher produtos com tags corretas.

begin;

-- =========================================================
-- 0) Backup rapido (recomendado)
-- =========================================================
create table if not exists public.products_tags_backup as
select
  id,
  slug,
  coalesce(title, name) as product_name,
  tags,
  now() as backup_at
from public.products
where false;

insert into public.products_tags_backup (id, slug, product_name, tags, backup_at)
select
  id,
  slug,
  coalesce(title, name) as product_name,
  tags,
  now()
from public.products;

-- =========================================================
-- 1) Normalizar tags legadas (se existirem)
-- =========================================================
update public.products p
set tags = coalesce((
  select array_agg(distinct norm_tag order by norm_tag)
  from (
    select
      case lower(trim(tag_value))
        when 'vegano' then 'vegan'
        when 'cruelty-free' then 'cruelty_free'
        when 'sem-fragrancia' then 'fragrance_free'
        when 'presenteavel' then 'giftable'
        when 'glow-elegante' then 'glow_deep_skin'
        else lower(trim(replace(tag_value, '-', '_')))
      end as norm_tag
    from unnest(coalesce(p.tags, '{}'::text[])) as tag_value
  ) normalized
  where norm_tag is not null and norm_tag <> ''
), '{}'::text[]);

-- =========================================================
-- 2) Preenchimento manual (EDITAR esta lista)
-- =========================================================
-- Regra: 4-6 tags por produto (max 8).
-- Use slug exato de cada produto.
with manual(slug, add_tags) as (
  values
    -- EXEMPLOS (troque pelos seus slugs reais):
    -- ('protetor-solar-invisivel-x', array['no_white_cast','bp_curated','sensitive_skin']::text[]),
    -- ('base-liquida-y', array['no_gray_cast','high_pigment','skin_tone_deep','bp_curated']::text[]),
    -- ('creme-pentear-z', array['hair_cacheado','hair_crespo','hair_transicao','sensory']::text[])
    ('__preencher_slug_1__', array['bp_curated']::text[]),
    ('__preencher_slug_2__', array['bp_curated']::text[])
)
update public.products p
set tags = (
  select array_agg(distinct tag order by tag)
  from unnest(coalesce(p.tags, '{}'::text[]) || m.add_tags) as tag
)
from manual m
where p.slug = m.slug
  and m.slug not like '__preencher_%__';

-- =========================================================
-- 3) (Opcional) Regras automaticas por heuristica de titulo
-- =========================================================
-- Descomente apenas se quiser aplicar heuristica em lote.
-- Cuidado: revise resultados antes de manter.
--
-- update public.products
-- set tags = (
--   select array_agg(distinct tag order by tag)
--   from unnest(coalesce(tags, '{}'::text[]) || array['no_white_cast']::text[]) as tag
-- )
-- where coalesce(title, name, '') ilike any (array['%protetor%', '%sunscreen%']);
--
-- update public.products
-- set tags = (
--   select array_agg(distinct tag order by tag)
--   from unnest(coalesce(tags, '{}'::text[]) || array['high_pigment']::text[]) as tag
-- )
-- where coalesce(title, name, '') ilike any (array['%base%', '%corretivo%', '%batom%', '%blush%']);

-- =========================================================
-- 4) QA - conferir o resultado
-- =========================================================
-- 4.1 Produtos com tags
select
  count(*) filter (where cardinality(coalesce(tags, '{}'::text[])) > 0) as products_with_tags,
  count(*) as total_products
from public.products
where status in ('active', 'published');

-- 4.2 Produtos sem tag (prioridade de curadoria)
select
  slug,
  coalesce(title, name) as product_name,
  brand,
  status
from public.products
where status in ('active', 'published')
  and cardinality(coalesce(tags, '{}'::text[])) = 0
order by created_at desc nulls last;

-- 4.3 Tags fora do dicionario oficial
with allowed(tag) as (
  select unnest(array[
    'hair_crespo',
    'hair_cacheado',
    'hair_ondulado',
    'hair_transicao',
    'skin_tone_deep',
    'skin_tone_rich',
    'skin_tone_medium',
    'skin_hyperpigmentation',
    'no_gray_cast',
    'glow_deep_skin',
    'no_white_cast',
    'high_pigment',
    'bp_curated',
    'giftable',
    'sensory',
    'vegan',
    'cruelty_free',
    'fragrance_free',
    'sensitive_skin',
    'barrier_support',
    'sem_ressecar',
    'ritual_noturno',
    'ritual_diurno',
    'ritual_evento',
    'ritual_pos_banho',
    'ritual_plantao'
  ]::text[])
),
exploded as (
  select
    p.slug,
    unnest(coalesce(p.tags, '{}'::text[])) as tag
  from public.products p
  where p.status in ('active', 'published')
)
select e.slug, e.tag
from exploded e
left join allowed a on a.tag = e.tag
where a.tag is null
order by e.slug, e.tag;

commit;

