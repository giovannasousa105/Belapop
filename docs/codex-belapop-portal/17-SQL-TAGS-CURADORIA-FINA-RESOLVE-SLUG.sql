-- BelaPop - Curadoria fina V3 (resolve slug real por nome e aplica tags)
-- Use este script quando o V2 (slug exato) retornar slug_sem_match.
-- Rode no Supabase SQL Editor.

begin;

alter table public.products
  add column if not exists tags text[] not null default '{}'::text[];

create temp table tmp_seed_by_name (
  name_like text primary key,
  add_tags text[] not null
) on commit drop;

insert into tmp_seed_by_name (name_like, add_tags)
values
  ('radiance 01', array['bp_curated','sensory','skin_hyperpigmentation','glow_deep_skin']::text[]),
  ('barrier celeste', array['bp_curated','barrier_support','sensitive_skin','vegan']::text[]),
  ('mascara lumiere', array['bp_curated','high_pigment']::text[]),
  ('blush veu rose', array['bp_curated','high_pigment','glow_deep_skin','no_gray_cast']::text[]),
  ('oleo capilar nuit', array['bp_curated','hair_cacheado','hair_crespo','sensory']::text[]),
  ('escova ritual zen', array['bp_curated','giftable']::text[]),
  ('body mist rosa profundo', array['bp_curated','sensory','giftable','ritual_pos_banho']::text[]),
  ('velas calm 02', array['bp_curated','sensory','giftable','ritual_noturno']::text[]),
  ('lip tint atelier', array['bp_curated','high_pigment','sem_ressecar','no_gray_cast']::text[]),
  ('gel limpeza veludo', array['bp_curated','sensitive_skin','barrier_support','sem_ressecar']::text[]),
  ('patch olhos aurora', array['bp_curated','glow_deep_skin','sensitive_skin']::text[]),
  ('botanical calm', array['bp_curated','sensory','ritual_noturno','giftable']::text[]);

create temp table tmp_matches on commit drop as
with products_norm as (
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
    ) as name_norm
  from public.products p
  where p.status in ('active', 'published')
)
select
  s.name_like,
  s.add_tags,
  p.id,
  p.slug,
  p.product_name
from tmp_seed_by_name s
left join products_norm p
  on p.name_norm like '%' || s.name_like || '%';

-- QA 1: seeds sem match
select
  s.name_like as seed_sem_match
from tmp_seed_by_name s
left join tmp_matches m on m.name_like = s.name_like and m.id is not null
where m.id is null
order by s.name_like;

-- QA 2: seeds com match ambiguo (mais de 1 produto)
select
  m.name_like,
  count(*) as total_matches
from tmp_matches m
where m.id is not null
group by m.name_like
having count(*) > 1
order by m.name_like;

do $$
declare
  missing_count int;
  ambiguous_count int;
begin
  select count(*)
  into missing_count
  from tmp_seed_by_name s
  left join tmp_matches m on m.name_like = s.name_like and m.id is not null
  where m.id is null;

  select count(*)
  into ambiguous_count
  from (
    select m.name_like
    from tmp_matches m
    where m.id is not null
    group by m.name_like
    having count(*) > 1
  ) t;

  if missing_count > 0 then
    raise exception 'Abortado: % seed(s) sem match. Ajuste os name_like e rode novamente.', missing_count;
  end if;

  if ambiguous_count > 0 then
    raise exception 'Abortado: % seed(s) com match ambiguo. Ajuste os name_like para ficarem unicos.', ambiguous_count;
  end if;
end
$$;

with expanded as (
  select
    p.id,
    unnest(coalesce(p.tags, '{}'::text[])) as tag
  from public.products p
  join tmp_matches m on m.id = p.id

  union all

  select
    m.id,
    unnest(m.add_tags) as tag
  from tmp_matches m
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

-- QA final: produtos atualizados
select
  p.slug,
  coalesce(p.title, p.name) as product_name,
  p.tags
from public.products p
join tmp_matches m on m.id = p.id
order by p.slug;

commit;
