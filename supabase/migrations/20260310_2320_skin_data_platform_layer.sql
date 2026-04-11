-- =========================================================
-- Skin Data Platform Layer
-- =========================================================

create table if not exists public.skin_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skin_scan_id uuid references public.skin_scans(id) on delete cascade,
  face_scan_id uuid references public.face_scans(id) on delete cascade,
  image_url text not null,
  heatmap_url text,
  image_kind text not null default 'scan'
    check (image_kind in ('scan', 'heatmap', 'overlay')),
  source text not null default 'faceshield'
    check (source in ('manual', 'faceshield', 'imported', 'generated')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skin_images_target_required check (skin_scan_id is not null or face_scan_id is not null),
  constraint skin_images_face_kind_unique unique (face_scan_id, image_kind),
  constraint skin_images_scan_kind_unique unique (skin_scan_id, image_kind)
);

create index if not exists idx_skin_images_user_created
  on public.skin_images (user_id, created_at desc);

drop trigger if exists trg_skin_images_updated on public.skin_images;
create trigger trg_skin_images_updated
before update on public.skin_images
for each row execute function public.set_updated_at();

create table if not exists public.skincare_routines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  routine_name text not null,
  description text,
  skin_type_id uuid references public.skin_types(id) on delete set null,
  main_concern_id uuid references public.skin_concerns(id) on delete set null,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_skincare_routines_featured
  on public.skincare_routines (is_featured, created_at desc);

drop trigger if exists trg_skincare_routines_updated on public.skincare_routines;
create trigger trg_skincare_routines_updated
before update on public.skincare_routines
for each row execute function public.set_updated_at();

create table if not exists public.routine_products (
  routine_id uuid not null references public.skincare_routines(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  routine_step_id uuid references public.routine_steps(id) on delete set null,
  step_order integer not null default 1 check (step_order > 0),
  is_primary boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  primary key (routine_id, product_id)
);

create index if not exists idx_routine_products_routine_step
  on public.routine_products (routine_id, step_order, product_id);

create or replace view public.skincare_products as
select
  p.id,
  p.seller_id,
  p.name,
  lower(coalesce(p.category, '')) as category,
  coalesce(
    array_remove(array_agg(distinct i.name) filter (where i.name is not null), null),
    '{}'::text[]
  ) as main_ingredients,
  coalesce(
    array_remove(array_agg(distinct sc.name) filter (where sc.name is not null), null),
    '{}'::text[]
  ) as skin_concerns,
  p.price_cents,
  p.hero_image_url,
  p.created_at
from public.products p
left join public.product_ingredients pi on pi.product_id = p.id
left join public.ingredients i on i.id = pi.ingredient_id
left join public.product_skin_concerns psc on psc.product_id = p.id
left join public.skin_concerns sc on sc.id = psc.concern_id
where lower(coalesce(p.category, '')) = 'skincare'
group by
  p.id,
  p.seller_id,
  p.name,
  p.category,
  p.price_cents,
  p.hero_image_url,
  p.created_at;

insert into public.skincare_routines (slug, routine_name, description, skin_type_id, main_concern_id, is_active, is_featured, metadata)
select
  src.slug,
  src.routine_name,
  src.description,
  st.id,
  sc.id,
  true,
  src.is_featured,
  src.metadata
from (
  values
    (
      'barrier-repair-essentials',
      'Barrier Repair Essentials',
      'Rotina curta para pele reativa, desconforto e reparacao progressiva da barreira.',
      'sensitive',
      'barrier_damage',
      true,
      jsonb_build_object('surface', 'editorial', 'tone', 'repair-first')
    ),
    (
      'acne-balance-core',
      'Acne Balance Core',
      'Controle de poros, oleosidade e inflamacao com rotina consistente e de baixa friccao.',
      'acne_prone',
      'acne',
      true,
      jsonb_build_object('surface', 'editorial', 'tone', 'clarity')
    ),
    (
      'progressive-brightening',
      'Progressive Brightening',
      'Foco em uniformizacao de tom, brilho e fotoprotecao sem agressao desnecessaria.',
      'combination',
      'dark_spots',
      false,
      jsonb_build_object('surface', 'editorial', 'tone', 'radiance')
    ),
    (
      'hydration-recovery',
      'Hydration Recovery',
      'Rotina para desidratacao aparente, conforto e retencao de agua.',
      'dry',
      'dehydration',
      true,
      jsonb_build_object('surface', 'editorial', 'tone', 'comfort')
    ),
    (
      'gradual-age-support',
      'Gradual Age Support',
      'Introducao progressiva para elasticidade, linhas finas e rotina de longo prazo.',
      'dry',
      'aging',
      false,
      jsonb_build_object('surface', 'editorial', 'tone', 'progressive-results')
    )
) as src(slug, routine_name, description, skin_type_slug, concern_slug, is_featured, metadata)
left join public.skin_types st on st.slug = src.skin_type_slug
left join public.skin_concerns sc on sc.slug = src.concern_slug
on conflict (slug) do update
set
  routine_name = excluded.routine_name,
  description = excluded.description,
  skin_type_id = excluded.skin_type_id,
  main_concern_id = excluded.main_concern_id,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.skin_images (user_id, skin_scan_id, image_url, image_kind, source, metadata, created_at)
select
  ss.user_id,
  ss.id,
  ss.image_url,
  'scan',
  coalesce(ss.scan_source, 'manual'),
  jsonb_build_object('backfill', true, 'origin', 'skin_scans'),
  ss.created_at
from public.skin_scans ss
where coalesce(ss.image_url, '') <> ''
on conflict (skin_scan_id, image_kind) do update
set
  user_id = excluded.user_id,
  image_url = excluded.image_url,
  source = excluded.source,
  metadata = excluded.metadata;

insert into public.skin_images (user_id, skin_scan_id, face_scan_id, image_url, image_kind, source, metadata, created_at)
select
  fs.user_id,
  fs.skin_scan_id,
  fs.id,
  fs.image_url,
  'scan',
  'faceshield',
  jsonb_build_object('backfill', true, 'origin', 'face_scans', 'scan_status', fs.scan_status),
  fs.created_at
from public.face_scans fs
where coalesce(fs.image_url, '') <> ''
on conflict (face_scan_id, image_kind) do update
set
  user_id = excluded.user_id,
  skin_scan_id = excluded.skin_scan_id,
  image_url = excluded.image_url,
  source = excluded.source,
  metadata = excluded.metadata;

create or replace function public.find_similar_skin_profiles(
  p_user_id uuid,
  p_limit integer default 6
)
returns table (
  similar_user_id uuid,
  face_scan_id uuid,
  skin_scan_id uuid,
  similarity numeric,
  overall_score numeric,
  latest_improvement_score numeric,
  skin_type text,
  main_concern text,
  hydration_level numeric,
  pigmentation_level numeric,
  acne_level numeric,
  redness_level numeric
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  with source_embedding as (
    select se.embedding
    from public.skin_embeddings se
    where se.user_id = p_user_id
    order by se.created_at desc
    limit 1
  ),
  latest_embeddings as (
    select distinct on (se.user_id)
      se.user_id,
      se.face_scan_id,
      se.skin_scan_id,
      se.embedding,
      se.created_at
    from public.skin_embeddings se
    where se.user_id <> p_user_id
    order by se.user_id, se.created_at desc
  ),
  ranked as (
    select
      le.user_id as similar_user_id,
      le.face_scan_id,
      le.skin_scan_id,
      round(greatest(0::numeric, (1 - (le.embedding <=> src.embedding))::numeric), 4) as similarity
    from latest_embeddings le
    cross join source_embedding src
  )
  select
    r.similar_user_id,
    r.face_scan_id,
    r.skin_scan_id,
    r.similarity,
    sscore.overall_score,
    outcome.improvement_score as latest_improvement_score,
    st.name as skin_type,
    sc.name as main_concern,
    twin.hydration_level,
    twin.pigmentation_level,
    twin.acne_level,
    twin.redness_level
  from ranked r
  left join public.skin_scores sscore on sscore.scan_id = r.face_scan_id
  left join public.skin_twins twin on twin.user_id = r.similar_user_id
  left join public.user_skin_profiles usp on usp.user_id = r.similar_user_id
  left join public.skin_types st on st.id = usp.skin_type_id
  left join public.skin_concerns sc on sc.id = usp.main_concern_id
  left join lateral (
    select so.improvement_score
    from public.skin_outcomes so
    where so.user_id = r.similar_user_id
    order by so.created_at desc
    limit 1
  ) outcome on true
  where r.similarity > 0
  order by r.similarity desc, outcome.improvement_score desc nulls last
  limit greatest(1, least(coalesce(p_limit, 6), 12));
$$;

alter table public.skin_images enable row level security;
alter table public.skincare_routines enable row level security;
alter table public.routine_products enable row level security;

drop policy if exists skin_images_owner_read on public.skin_images;
create policy skin_images_owner_read
on public.skin_images
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists skincare_routines_public_read on public.skincare_routines;
create policy skincare_routines_public_read
on public.skincare_routines
for select
to anon, authenticated
using (is_active = true);

drop policy if exists routine_products_public_read on public.routine_products;
create policy routine_products_public_read
on public.routine_products
for select
to anon, authenticated
using (true);

drop policy if exists skin_images_service_all on public.skin_images;
create policy skin_images_service_all
on public.skin_images
for all
to service_role
using (true)
with check (true);

drop policy if exists skincare_routines_service_all on public.skincare_routines;
create policy skincare_routines_service_all
on public.skincare_routines
for all
to service_role
using (true)
with check (true);

drop policy if exists routine_products_service_all on public.routine_products;
create policy routine_products_service_all
on public.routine_products
for all
to service_role
using (true)
with check (true);

grant select on public.skin_images to authenticated;
grant select on public.skincare_routines to anon, authenticated;
grant select on public.routine_products to anon, authenticated;
grant select on public.skincare_products to anon, authenticated;
grant execute on function public.find_similar_skin_profiles(uuid, integer) to authenticated, service_role;

grant all on table public.skin_images to service_role;
grant all on table public.skincare_routines to service_role;
grant all on table public.routine_products to service_role;
grant select on public.skincare_products to service_role;
