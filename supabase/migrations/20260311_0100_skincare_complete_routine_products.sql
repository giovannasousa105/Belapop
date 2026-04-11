-- Seed additional skincare products to complete the routine builder.
-- Safe to re-run.

with seller as (
  select id
  from public.sellers
  where store_name = 'BelaPop Curadoria'
  limit 1
),
seed_products as (
  select *
  from (
    values
      (
        'gel-limpeza-veludo',
        'Gel Limpeza Veludo',
        'Gel Limpeza Veludo',
        'BelaPop',
        'Cleanser calmante com centella asiatica e ceramidas para limpar sem repuxar.',
        'Skincare',
        21900,
        'Gel',
        'Reset delicado',
        array['sensitive','combination','acne_prone']::text[],
        array['cleanser','barrier_support','bp_curated','sensitive_skin']::text[],
        array['Limpeza gentil','Sem repuxar','Uso diario']::text[],
        array['editorial','daily']::text[],
        array['calmante','limpo']::text[],
        array['pele confortavel','barreira preservada']::text[],
        array['natural']::text[],
        array['Massageie sobre a pele umida por 60 segundos.','Enxague com agua fria ou morna.']::text[]
      ),
      (
        'tonico-nuvem-de-rosa',
        'Tonico Nuvem de Rosa',
        'Tonico Nuvem de Rosa',
        'BelaPop',
        'Toner de hidratação leve com acido hialuronico e niacinamida para equilibrar e preparar a pele.',
        'Skincare',
        23900,
        'Liquido',
        'Camada de equilibrio',
        array['sensitive','dry','combination']::text[],
        array['toner','hydration','bp_curated','glass_skin']::text[],
        array['Equilibrio imediato','Toque leve','Preparo para serum']::text[],
        array['editorial','daily']::text[],
        array['aquoso','macio']::text[],
        array['pele viçosa','hidratação leve']::text[],
        array['luminoso']::text[],
        array['Aplique com as maos em leves pressoes.','Repita uma segunda camada quando a pele pedir mais agua.']::text[]
      ),
      (
        'protetor-solar-luz-de-vela-fps50',
        'Protetor Solar Luz de Vela FPS 50',
        'Protetor Solar Luz de Vela FPS 50',
        'BelaPop',
        'Sunscreen diario de textura fluida com niacinamida para proteger, uniformizar e finalizar a rotina.',
        'Skincare',
        27900,
        'Fluido',
        'Protecao elegante',
        array['sensitive','dry','combination','oily']::text[],
        array['sunscreen','daily_protection','bp_curated','urban_shield']::text[],
        array['FPS 50','Acabamento leve','Uso diario']::text[],
        array['editorial','daily']::text[],
        array['fluido','sedoso']::text[],
        array['protecao alta','acabamento elegante']::text[],
        array['natural']::text[],
        array['Aplique duas linhas de produto no rosto e pescoco.','Reaplique ao longo do dia.']::text[]
      )
  ) as t(
    slug,
    name,
    title,
    brand,
    description,
    category,
    price_cents,
    texture,
    ritual,
    skin_type,
    tags,
    highlights,
    badges,
    sensation,
    result,
    finish,
    how_to_use
  )
),
upsert_products as (
  insert into public.products (
    seller_id,
    partner_id,
    name,
    title,
    slug,
    brand,
    description,
    category,
    price_cents,
    currency,
    weight_kg,
    width_cm,
    height_cm,
    length_cm,
    stock_quantity,
    images,
    gallery,
    highlights,
    badges,
    image_tone,
    status,
    is_featured,
    curated,
    hero_image_url,
    ritual,
    texture,
    sensation,
    result,
    finish,
    how_to_use,
    tags
  )
  select
    seller.id,
    seller.id,
    sp.name,
    sp.title,
    sp.slug,
    sp.brand,
    sp.description,
    sp.category,
    sp.price_cents,
    'BRL',
    0.3,
    10,
    10,
    10,
    12,
    '[]'::jsonb,
    '[]'::jsonb,
    to_jsonb(sp.highlights),
    sp.badges,
    'rose-light',
    'published',
    true,
    true,
    '/editorial/product-hero-skincare.svg',
    sp.ritual,
    sp.texture,
    sp.sensation,
    sp.result,
    sp.finish,
    to_jsonb(sp.how_to_use),
    sp.tags
  from seller
  join seed_products sp on true
  on conflict (slug) do update
  set
    seller_id = excluded.seller_id,
    partner_id = excluded.partner_id,
    name = excluded.name,
    title = excluded.title,
    brand = excluded.brand,
    description = excluded.description,
    category = excluded.category,
    price_cents = excluded.price_cents,
    stock_quantity = excluded.stock_quantity,
    highlights = excluded.highlights,
    badges = excluded.badges,
    image_tone = excluded.image_tone,
    status = 'published',
    is_featured = true,
    curated = true,
    hero_image_url = excluded.hero_image_url,
    ritual = excluded.ritual,
    texture = excluded.texture,
    sensation = excluded.sensation,
    result = excluded.result,
    finish = excluded.finish,
    how_to_use = excluded.how_to_use,
    tags = excluded.tags
  returning id, slug
)
update public.products p
set skin_type = case
  when p.slug = 'gel-limpeza-veludo' then array['sensitive','combination','acne_prone']::text[]
  when p.slug = 'tonico-nuvem-de-rosa' then array['sensitive','dry','combination']::text[]
  when p.slug = 'protetor-solar-luz-de-vela-fps50' then array['sensitive','dry','combination','oily']::text[]
  else p.skin_type
end
where p.slug in (
  'gel-limpeza-veludo',
  'tonico-nuvem-de-rosa',
  'protetor-solar-luz-de-vela-fps50'
);

insert into public.product_routine_steps (product_id, routine_step_id, is_primary)
select p.id, rs.id, true
from public.products p
join public.routine_steps rs on rs.slug = 'cleanser'
where p.slug = 'gel-limpeza-veludo'
on conflict (product_id, routine_step_id) do update
set is_primary = excluded.is_primary;

insert into public.product_routine_steps (product_id, routine_step_id, is_primary)
select p.id, rs.id, true
from public.products p
join public.routine_steps rs on rs.slug = 'toner'
where p.slug = 'tonico-nuvem-de-rosa'
on conflict (product_id, routine_step_id) do update
set is_primary = excluded.is_primary;

insert into public.product_routine_steps (product_id, routine_step_id, is_primary)
select p.id, rs.id, true
from public.products p
join public.routine_steps rs on rs.slug = 'sunscreen'
where p.slug = 'protetor-solar-luz-de-vela-fps50'
on conflict (product_id, routine_step_id) do update
set is_primary = excluded.is_primary;

insert into public.product_skin_concerns (product_id, concern_id)
select p.id, sc.id
from public.products p
join public.skin_concerns sc on sc.slug in ('acne', 'barrier_damage', 'rosacea')
where p.slug = 'gel-limpeza-veludo'
on conflict (product_id, concern_id) do nothing;

insert into public.product_skin_concerns (product_id, concern_id)
select p.id, sc.id
from public.products p
join public.skin_concerns sc on sc.slug in ('dehydration', 'dark_spots', 'aging')
where p.slug = 'tonico-nuvem-de-rosa'
on conflict (product_id, concern_id) do nothing;

insert into public.product_skin_concerns (product_id, concern_id)
select p.id, sc.id
from public.products p
join public.skin_concerns sc on sc.slug in ('dark_spots', 'rosacea', 'aging')
where p.slug = 'protetor-solar-luz-de-vela-fps50'
on conflict (product_id, concern_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id)
select p.id, i.id
from public.products p
join public.ingredients i on i.slug in ('centella-asiatica', 'ceramides')
where p.slug = 'gel-limpeza-veludo'
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id)
select p.id, i.id
from public.products p
join public.ingredients i on i.slug in ('hyaluronic-acid', 'niacinamide')
where p.slug = 'tonico-nuvem-de-rosa'
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id)
select p.id, i.id
from public.products p
join public.ingredients i on i.slug in ('niacinamide')
where p.slug = 'protetor-solar-luz-de-vela-fps50'
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_rankings (
  product_id,
  conversion_rate,
  sales_velocity,
  rating,
  margin,
  freshness,
  product_score,
  updated_at
)
select
  p.id,
  0.032,
  case
    when p.slug = 'gel-limpeza-veludo' then 7
    when p.slug = 'tonico-nuvem-de-rosa' then 6
    else 8
  end,
  case
    when p.slug = 'gel-limpeza-veludo' then 4.60
    when p.slug = 'tonico-nuvem-de-rosa' then 4.55
    else 4.80
  end,
  0.25,
  0.92,
  case
    when p.slug = 'gel-limpeza-veludo' then 78
    when p.slug = 'tonico-nuvem-de-rosa' then 77
    else 84
  end,
  now()
from public.products p
where p.slug in (
  'gel-limpeza-veludo',
  'tonico-nuvem-de-rosa',
  'protetor-solar-luz-de-vela-fps50'
)
on conflict (product_id) do update
set
  conversion_rate = excluded.conversion_rate,
  sales_velocity = excluded.sales_velocity,
  rating = excluded.rating,
  margin = excluded.margin,
  freshness = excluded.freshness,
  product_score = excluded.product_score,
  updated_at = excluded.updated_at;
