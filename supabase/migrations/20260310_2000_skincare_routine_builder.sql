-- =========================================================
-- Skincare Routine Builder
-- =========================================================

create table if not exists public.skin_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.skin_concerns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_skin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skin_type_id uuid references public.skin_types(id) on delete set null,
  main_concern_id uuid references public.skin_concerns(id) on delete set null,
  sensitivity_level integer not null default 1,
  price_affinity_cents integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_skin_profiles_user_unique unique (user_id),
  constraint user_skin_profiles_sensitivity_range check (sensitivity_level between 1 and 5),
  constraint user_skin_profiles_price_affinity_nonneg check (price_affinity_cents is null or price_affinity_cents >= 0)
);

drop trigger if exists trg_user_skin_profiles_updated on public.user_skin_profiles;
create trigger trg_user_skin_profiles_updated
before update on public.user_skin_profiles
for each row execute function public.set_updated_at();

create table if not exists public.routine_steps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  step_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint routine_steps_order_positive check (step_order > 0)
);

create unique index if not exists uq_routine_steps_order
  on public.routine_steps (step_order);

create table if not exists public.product_routine_steps (
  product_id uuid not null references public.products(id) on delete cascade,
  routine_step_id uuid not null references public.routine_steps(id) on delete cascade,
  is_primary boolean not null default true,
  primary key (product_id, routine_step_id)
);

create index if not exists idx_product_routine_steps_step_product
  on public.product_routine_steps (routine_step_id, product_id);

create table if not exists public.product_skin_concerns (
  product_id uuid not null references public.products(id) on delete cascade,
  concern_id uuid not null references public.skin_concerns(id) on delete cascade,
  primary key (product_id, concern_id)
);

create index if not exists idx_product_skin_concerns_concern_product
  on public.product_skin_concerns (concern_id, product_id);

create table if not exists public.skin_concern_ingredients (
  concern_id uuid not null references public.skin_concerns(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  weight numeric(5,2) not null default 1,
  primary key (concern_id, ingredient_id),
  constraint skin_concern_ingredients_weight_positive check (weight > 0)
);

create index if not exists idx_skin_concern_ingredients_concern
  on public.skin_concern_ingredients (concern_id, ingredient_id);

create table if not exists public.routine_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid references public.user_skin_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_routine_carts_user_created
  on public.routine_carts (user_id, created_at desc);

create table if not exists public.routine_cart_items (
  cart_id uuid not null references public.routine_carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  routine_step_id uuid references public.routine_steps(id) on delete set null,
  position integer not null default 1,
  primary key (cart_id, product_id),
  constraint routine_cart_items_position_positive check (position > 0)
);

create index if not exists idx_routine_cart_items_cart_position
  on public.routine_cart_items (cart_id, position);

insert into public.skin_types (slug, name)
values
  ('oily', 'oily'),
  ('dry', 'dry'),
  ('combination', 'combination'),
  ('sensitive', 'sensitive'),
  ('acne_prone', 'acne_prone')
on conflict (slug) do update
set name = excluded.name;

insert into public.skin_concerns (slug, name, description)
values
  ('acne', 'acne', 'Controle de oleosidade, inflamacao e surgimento de lesoes.'),
  ('rosacea', 'rosacea', 'Calmante e reducao de vermelhidao reativa.'),
  ('dark_spots', 'dark_spots', 'Uniformizacao de tom e manchas residuais.'),
  ('aging', 'aging', 'Firmeza, linhas finas e renovacao.'),
  ('dehydration', 'dehydration', 'Reposicao de agua e retencao hidrica.'),
  ('barrier_damage', 'barrier_damage', 'Recuperacao da barreira e conforto cutaneo.')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description;

insert into public.routine_steps (slug, name, step_order, is_active)
values
  ('cleanser', 'cleanser', 1, true),
  ('toner', 'toner', 2, true),
  ('essence', 'essence', 3, true),
  ('serum', 'serum', 4, true),
  ('moisturizer', 'moisturizer', 5, true),
  ('sunscreen', 'sunscreen', 6, true)
on conflict (slug) do update
set
  name = excluded.name,
  step_order = excluded.step_order,
  is_active = excluded.is_active;

insert into public.ingredients (slug, name, description, benefits, origin, status)
values
  ('centella-asiatica', 'centella asiatica', 'Ingrediente calmante e reparador.', 'acalmar, barreira, vermelhidao', 'Asia', 'active'),
  ('niacinamide', 'niacinamide', 'Vitamina B3 multifuncional.', 'oleosidade, poros, manchas', 'global', 'active'),
  ('ceramides', 'ceramides', 'Lipidos essenciais para barreira cutanea.', 'barreira, hidratacao, conforto', 'global', 'active'),
  ('retinol', 'retinol', 'Vitamina A para renovacao.', 'linhas finas, textura, firmeza', 'global', 'active'),
  ('hyaluronic-acid', 'hyaluronic acid', 'Ativo umectante de alta afinidade com agua.', 'hidratacao, vico, preenchimento', 'global', 'active')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  benefits = excluded.benefits,
  origin = excluded.origin,
  status = excluded.status;

insert into public.skin_concern_ingredients (concern_id, ingredient_id, weight)
select sc.id, i.id, m.weight
from (
  values
    ('acne', 'niacinamide', 1.00::numeric),
    ('rosacea', 'centella-asiatica', 1.00::numeric),
    ('dark_spots', 'niacinamide', 0.90::numeric),
    ('aging', 'retinol', 1.00::numeric),
    ('dehydration', 'hyaluronic-acid', 1.00::numeric),
    ('barrier_damage', 'ceramides', 1.00::numeric),
    ('barrier_damage', 'centella-asiatica', 0.85::numeric)
) as m(concern_slug, ingredient_slug, weight)
join public.skin_concerns sc on sc.slug = m.concern_slug
join public.ingredients i on i.slug = m.ingredient_slug
on conflict (concern_id, ingredient_id) do update
set weight = excluded.weight;

create or replace function public.build_skincare_routine(
  p_user_id uuid,
  p_limit_per_step integer default 1
)
returns table (
  routine_step_id uuid,
  routine_step_slug text,
  routine_step_name text,
  step_order integer,
  product_id uuid,
  product_name text,
  seller_id uuid,
  price_cents integer,
  hero_image_url text,
  score numeric(8,4),
  ingredient_match_score numeric(8,4),
  rating_score numeric(8,4),
  skin_type_match_score numeric(8,4),
  price_affinity_score numeric(8,4)
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  with profile as (
    select
      usp.id as profile_id,
      usp.user_id,
      st.slug as skin_type_slug,
      sc.id as concern_id,
      sc.slug as concern_slug,
      usp.sensitivity_level,
      usp.price_affinity_cents
    from public.user_skin_profiles usp
    left join public.skin_types st on st.id = usp.skin_type_id
    left join public.skin_concerns sc on sc.id = usp.main_concern_id
    where usp.user_id = p_user_id
    limit 1
  ),
  published_products as (
    select
      p.id,
      p.name,
      p.seller_id,
      p.price_cents,
      coalesce(p.hero_image_url, nullif(p.images ->> 0, '')) as hero_image_url,
      coalesce(p.skin_type, '{}'::text[]) as skin_type,
      coalesce(pr.rating, 0) as rating
    from public.products p
    left join public.product_rankings pr on pr.product_id = p.id
    where lower(coalesce(p.status, '')) in ('published', 'active')
      and lower(coalesce(p.category, '')) = 'skincare'
  ),
  concern_targets as (
    select
      sci.concern_id,
      sci.ingredient_id,
      sci.weight
    from public.skin_concern_ingredients sci
  ),
  candidate_base as (
    select
      rs.id as routine_step_id,
      rs.slug as routine_step_slug,
      rs.name as routine_step_name,
      rs.step_order,
      pp.id as product_id,
      pp.name as product_name,
      pp.seller_id,
      pp.price_cents,
      pp.hero_image_url,
      coalesce(sum(
        case
          when ct.ingredient_id is not null then ct.weight
          else 0
        end
      ), 0) as ingredient_match_score_raw,
      coalesce(max(
        case
          when psc.concern_id is not null then 1
          else 0
        end
      ), 0) as concern_direct_match,
      coalesce(
        max(
          case
            when pf.skin_type_slug is null then 0.6
            when pf.skin_type_slug = any(pp.skin_type) then 1
            when array_length(pp.skin_type, 1) is null then 0.5
            else 0
          end
        ),
        0.5
      ) as skin_type_match_raw,
      coalesce(max(pp.rating), 0) as rating_raw,
      coalesce(max(
        case
          when pf.price_affinity_cents is null or pf.price_affinity_cents <= 0 then 0.75
          else greatest(
            0,
            1 - abs(pp.price_cents - pf.price_affinity_cents)::numeric
              / greatest(pf.price_affinity_cents::numeric, 1)
          )
        end
      ), 0.75) as price_affinity_raw
    from public.routine_steps rs
    join public.product_routine_steps prs on prs.routine_step_id = rs.id
    join published_products pp on pp.id = prs.product_id
    left join profile pf on true
    left join public.product_ingredients pi on pi.product_id = pp.id
    left join concern_targets ct
      on ct.ingredient_id = pi.ingredient_id
     and ct.concern_id = pf.concern_id
    left join public.product_skin_concerns psc
      on psc.product_id = pp.id
     and psc.concern_id = pf.concern_id
    where rs.is_active = true
    group by
      rs.id,
      rs.slug,
      rs.name,
      rs.step_order,
      pp.id,
      pp.name,
      pp.seller_id,
      pp.price_cents,
      pp.hero_image_url
  ),
  scored as (
    select
      cb.*,
      greatest(
        cb.ingredient_match_score_raw,
        case when cb.concern_direct_match > 0 then 1 else 0 end
      ) * 100 as ingredient_match_score,
      least(100, greatest(0, (cb.rating_raw / 5.0) * 100)) as rating_score,
      least(100, greatest(0, cb.skin_type_match_raw * 100)) as skin_type_match_score,
      least(100, greatest(0, cb.price_affinity_raw * 100)) as price_affinity_score
    from candidate_base cb
  ),
  ranked as (
    select
      s.*,
      (
        s.ingredient_match_score * 0.4
        + s.rating_score * 0.3
        + s.skin_type_match_score * 0.2
        + s.price_affinity_score * 0.1
      )::numeric(8,4) as score,
      row_number() over (
        partition by s.routine_step_id
        order by
          (
            s.ingredient_match_score * 0.4
            + s.rating_score * 0.3
            + s.skin_type_match_score * 0.2
            + s.price_affinity_score * 0.1
          ) desc,
          s.rating_raw desc,
          s.price_cents asc,
          s.product_name asc
      ) as rn
    from scored s
  )
  select
    r.routine_step_id,
    r.routine_step_slug,
    r.routine_step_name,
    r.step_order,
    r.product_id,
    r.product_name,
    r.seller_id,
    r.price_cents,
    r.hero_image_url,
    r.score,
    r.ingredient_match_score,
    r.rating_score,
    r.skin_type_match_score,
    r.price_affinity_score
  from ranked r
  where r.rn <= greatest(coalesce(p_limit_per_step, 1), 1)
  order by r.step_order, r.rn;
$$;

create or replace function public.create_routine_cart_from_profile(
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_cart_id uuid := gen_random_uuid();
  v_profile_id uuid;
begin
  select usp.id
  into v_profile_id
  from public.user_skin_profiles usp
  where usp.user_id = p_user_id
  limit 1;

  if v_profile_id is null then
    raise exception 'user_skin_profile_required' using errcode = 'P0001';
  end if;

  insert into public.routine_carts (id, user_id, profile_id)
  values (v_cart_id, p_user_id, v_profile_id);

  insert into public.routine_cart_items (
    cart_id,
    product_id,
    routine_step_id,
    position
  )
  select
    v_cart_id,
    routine.product_id,
    routine.routine_step_id,
    row_number() over (order by routine.step_order)
  from public.build_skincare_routine(p_user_id, 1) routine
  on conflict (cart_id, product_id) do update
  set
    routine_step_id = excluded.routine_step_id,
    position = excluded.position;

  return v_cart_id;
end;
$$;

grant execute on function public.build_skincare_routine(uuid, integer) to authenticated, service_role;
grant execute on function public.create_routine_cart_from_profile(uuid) to authenticated, service_role;

alter table public.skin_types enable row level security;
alter table public.skin_concerns enable row level security;
alter table public.user_skin_profiles enable row level security;
alter table public.routine_steps enable row level security;
alter table public.product_routine_steps enable row level security;
alter table public.product_skin_concerns enable row level security;
alter table public.skin_concern_ingredients enable row level security;
alter table public.routine_carts enable row level security;
alter table public.routine_cart_items enable row level security;

drop policy if exists skin_types_public_read on public.skin_types;
create policy skin_types_public_read
on public.skin_types
for select
to public
using (true);

drop policy if exists skin_concerns_public_read on public.skin_concerns;
create policy skin_concerns_public_read
on public.skin_concerns
for select
to public
using (true);

drop policy if exists routine_steps_public_read on public.routine_steps;
create policy routine_steps_public_read
on public.routine_steps
for select
to public
using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists user_skin_profiles_owner_read on public.user_skin_profiles;
create policy user_skin_profiles_owner_read
on public.user_skin_profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists user_skin_profiles_owner_write on public.user_skin_profiles;
create policy user_skin_profiles_owner_write
on public.user_skin_profiles
for all
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists product_routine_steps_public_read on public.product_routine_steps;
create policy product_routine_steps_public_read
on public.product_routine_steps
for select
to public
using (
  exists (
    select 1
    from public.products p
    where p.id = product_routine_steps.product_id
      and lower(coalesce(p.status, '')) in ('published', 'active')
  )
  or public.is_admin(auth.uid())
);

drop policy if exists product_skin_concerns_public_read on public.product_skin_concerns;
create policy product_skin_concerns_public_read
on public.product_skin_concerns
for select
to public
using (
  exists (
    select 1
    from public.products p
    where p.id = product_skin_concerns.product_id
      and lower(coalesce(p.status, '')) in ('published', 'active')
  )
  or public.is_admin(auth.uid())
);

drop policy if exists skin_concern_ingredients_public_read on public.skin_concern_ingredients;
create policy skin_concern_ingredients_public_read
on public.skin_concern_ingredients
for select
to public
using (true);

drop policy if exists routine_carts_owner_read on public.routine_carts;
create policy routine_carts_owner_read
on public.routine_carts
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists routine_carts_owner_write on public.routine_carts;
create policy routine_carts_owner_write
on public.routine_carts
for all
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists routine_cart_items_owner_read on public.routine_cart_items;
create policy routine_cart_items_owner_read
on public.routine_cart_items
for select
to authenticated
using (
  exists (
    select 1
    from public.routine_carts rc
    where rc.id = routine_cart_items.cart_id
      and (rc.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists routine_cart_items_owner_write on public.routine_cart_items;
create policy routine_cart_items_owner_write
on public.routine_cart_items
for all
to authenticated
using (
  exists (
    select 1
    from public.routine_carts rc
    where rc.id = routine_cart_items.cart_id
      and (rc.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
)
with check (
  exists (
    select 1
    from public.routine_carts rc
    where rc.id = routine_cart_items.cart_id
      and (rc.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists skin_types_service_all on public.skin_types;
create policy skin_types_service_all
on public.skin_types
for all
to service_role
using (true)
with check (true);

drop policy if exists skin_concerns_service_all on public.skin_concerns;
create policy skin_concerns_service_all
on public.skin_concerns
for all
to service_role
using (true)
with check (true);

drop policy if exists user_skin_profiles_service_all on public.user_skin_profiles;
create policy user_skin_profiles_service_all
on public.user_skin_profiles
for all
to service_role
using (true)
with check (true);

drop policy if exists routine_steps_service_all on public.routine_steps;
create policy routine_steps_service_all
on public.routine_steps
for all
to service_role
using (true)
with check (true);

drop policy if exists product_routine_steps_service_all on public.product_routine_steps;
create policy product_routine_steps_service_all
on public.product_routine_steps
for all
to service_role
using (true)
with check (true);

drop policy if exists product_skin_concerns_service_all on public.product_skin_concerns;
create policy product_skin_concerns_service_all
on public.product_skin_concerns
for all
to service_role
using (true)
with check (true);

drop policy if exists skin_concern_ingredients_service_all on public.skin_concern_ingredients;
create policy skin_concern_ingredients_service_all
on public.skin_concern_ingredients
for all
to service_role
using (true)
with check (true);

drop policy if exists routine_carts_service_all on public.routine_carts;
create policy routine_carts_service_all
on public.routine_carts
for all
to service_role
using (true)
with check (true);

drop policy if exists routine_cart_items_service_all on public.routine_cart_items;
create policy routine_cart_items_service_all
on public.routine_cart_items
for all
to service_role
using (true)
with check (true);

grant select on table public.skin_types to anon, authenticated;
grant select on table public.skin_concerns to anon, authenticated;
grant select on table public.routine_steps to anon, authenticated;
grant select on table public.product_routine_steps to anon, authenticated;
grant select on table public.product_skin_concerns to anon, authenticated;
grant select on table public.skin_concern_ingredients to anon, authenticated;

grant all on table public.skin_types to service_role;
grant all on table public.skin_concerns to service_role;
grant all on table public.user_skin_profiles to service_role;
grant all on table public.routine_steps to service_role;
grant all on table public.product_routine_steps to service_role;
grant all on table public.product_skin_concerns to service_role;
grant all on table public.skin_concern_ingredients to service_role;
grant all on table public.routine_carts to service_role;
grant all on table public.routine_cart_items to service_role;

