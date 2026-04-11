-- Seed product routine mappings for the current skincare catalog.
-- Safe to re-run.

update public.products
set
  skin_type = array['sensitive', 'dry', 'combination', 'acne_prone']::text[],
  hero_image_url = coalesce(hero_image_url, '/editorial/product-hero-skincare.svg')
where lower(coalesce(name, '')) = 'creme barrier celeste';

update public.products
set
  skin_type = array['acne_prone', 'combination', 'oily', 'sensitive']::text[],
  hero_image_url = coalesce(hero_image_url, '/editorial/product-hero-skincare.svg')
where lower(coalesce(name, '')) = 'serum radiance 01';

update public.products
set
  skin_type = array['sensitive', 'dry', 'combination']::text[],
  hero_image_url = coalesce(hero_image_url, '/editorial/product-hero-skincare.svg')
where lower(coalesce(name, '')) = 'patch olhos aurora';

insert into public.product_routine_steps (product_id, routine_step_id, is_primary)
select p.id, rs.id, true
from public.products p
join public.routine_steps rs on rs.slug = 'moisturizer'
where lower(coalesce(p.name, '')) = 'creme barrier celeste'
on conflict (product_id, routine_step_id) do update
set is_primary = excluded.is_primary;

insert into public.product_routine_steps (product_id, routine_step_id, is_primary)
select p.id, rs.id, true
from public.products p
join public.routine_steps rs on rs.slug = 'serum'
where lower(coalesce(p.name, '')) = 'serum radiance 01'
on conflict (product_id, routine_step_id) do update
set is_primary = excluded.is_primary;

insert into public.product_routine_steps (product_id, routine_step_id, is_primary)
select p.id, rs.id, true
from public.products p
join public.routine_steps rs on rs.slug = 'essence'
where lower(coalesce(p.name, '')) = 'patch olhos aurora'
on conflict (product_id, routine_step_id) do update
set is_primary = excluded.is_primary;

insert into public.product_skin_concerns (product_id, concern_id)
select p.id, sc.id
from public.products p
join public.skin_concerns sc on sc.slug in ('barrier_damage', 'dehydration', 'rosacea')
where lower(coalesce(p.name, '')) = 'creme barrier celeste'
on conflict (product_id, concern_id) do nothing;

insert into public.product_skin_concerns (product_id, concern_id)
select p.id, sc.id
from public.products p
join public.skin_concerns sc on sc.slug in ('acne', 'dark_spots')
where lower(coalesce(p.name, '')) = 'serum radiance 01'
on conflict (product_id, concern_id) do nothing;

insert into public.product_skin_concerns (product_id, concern_id)
select p.id, sc.id
from public.products p
join public.skin_concerns sc on sc.slug in ('dehydration', 'aging')
where lower(coalesce(p.name, '')) = 'patch olhos aurora'
on conflict (product_id, concern_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id)
select p.id, i.id
from public.products p
join public.ingredients i on i.slug in ('ceramides', 'centella-asiatica')
where lower(coalesce(p.name, '')) = 'creme barrier celeste'
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id)
select p.id, i.id
from public.products p
join public.ingredients i on i.slug in ('niacinamide')
where lower(coalesce(p.name, '')) = 'serum radiance 01'
on conflict (product_id, ingredient_id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id)
select p.id, i.id
from public.products p
join public.ingredients i on i.slug in ('hyaluronic-acid')
where lower(coalesce(p.name, '')) = 'patch olhos aurora'
on conflict (product_id, ingredient_id) do nothing;
