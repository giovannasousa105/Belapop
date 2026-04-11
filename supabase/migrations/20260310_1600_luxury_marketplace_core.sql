create extension if not exists pgcrypto;

-- =========================================================
-- sellers: luxury brand profile fields
-- =========================================================
alter table public.sellers
  add column if not exists brand_name text,
  add column if not exists description text,
  add column if not exists country text,
  add column if not exists website text,
  add column if not exists curation_status text not null default 'pending',
  add column if not exists seller_score numeric(5,2) not null default 0;

update public.sellers
set brand_name = coalesce(nullif(trim(brand_name), ''), store_name)
where brand_name is null
   or trim(brand_name) = '';

update public.sellers s
set
  seller_score = coalesce(ss.final_score, s.seller_score, 0),
  curation_status = case
    when lower(coalesce(s.curation_status, '')) in ('premium', 'exclusive') then s.curation_status
    when lower(coalesce(ss.exposure_tier, '')) = 'premium' then 'premium'
    when lower(coalesce(s.status, '')) in ('active', 'approved') then 'approved'
    else 'pending'
  end
from public.seller_scores ss
where ss.seller_id = s.id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sellers_curation_status_check'
  ) then
    alter table public.sellers
      add constraint sellers_curation_status_check
      check (curation_status in ('pending', 'approved', 'premium', 'exclusive'));
  end if;
end
$$;

create index if not exists idx_sellers_curation_status_score
  on public.sellers (curation_status, seller_score desc, created_at desc);

create or replace function public.sync_seller_score_to_sellers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sellers
  set seller_score = coalesce(new.final_score, 0)
  where id = new.seller_id;
  return new;
end;
$$;

drop trigger if exists trg_seller_scores_sync_sellers on public.seller_scores;
create trigger trg_seller_scores_sync_sellers
after insert or update of final_score on public.seller_scores
for each row execute function public.sync_seller_score_to_sellers();

-- =========================================================
-- luxury brand partnerships
-- =========================================================
create table if not exists public.brand_partnerships (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  partnership_type text not null default 'standard'
    check (partnership_type in ('standard', 'featured', 'exclusive', 'founding_brand')),
  exclusivity_region text,
  commission_rate numeric(6,4) not null default 0.25,
  start_date date,
  end_date date,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'expired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_partnerships_commission_rate_range
    check (commission_rate >= 0 and commission_rate <= 1),
  constraint brand_partnerships_date_range
    check (end_date is null or start_date is null or end_date >= start_date)
);

create index if not exists idx_brand_partnerships_seller_status
  on public.brand_partnerships (seller_id, status, created_at desc);

create index if not exists idx_brand_partnerships_type
  on public.brand_partnerships (partnership_type, status, start_date desc);

drop trigger if exists trg_brand_partnerships_updated on public.brand_partnerships;
create trigger trg_brand_partnerships_updated
before update on public.brand_partnerships
for each row execute function public.set_updated_at();

insert into public.brand_partnerships (
  seller_id,
  partnership_type,
  commission_rate,
  status
)
select
  s.id,
  case
    when lower(coalesce(s.curation_status, '')) = 'exclusive' then 'exclusive'
    when lower(coalesce(s.curation_status, '')) = 'premium' then 'featured'
    else 'standard'
  end,
  case
    when s.commission_rate is null then 0.25
    when s.commission_rate <= 1 then s.commission_rate
    else round((s.commission_rate / 100.0)::numeric, 4)
  end,
  'active'
from public.sellers s
where not exists (
  select 1
  from public.brand_partnerships bp
  where bp.seller_id = s.id
);

-- =========================================================
-- editorial posts + commerce links
-- =========================================================
create table if not exists public.editorial_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text,
  excerpt text,
  cover_image text,
  content text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_editorial_posts_status_published
  on public.editorial_posts (status, published_at desc, created_at desc);

drop trigger if exists trg_editorial_posts_updated on public.editorial_posts;
create trigger trg_editorial_posts_updated
before update on public.editorial_posts
for each row execute function public.set_updated_at();

do $$
declare
  posts_has_category boolean;
  posts_has_excerpt boolean;
  posts_has_cover_image_url boolean;
  posts_has_content boolean;
  posts_has_body_md boolean;
  posts_has_media_url boolean;
  posts_category_expr text;
  posts_content_expr text;
  posts_excerpt_expr text;
  posts_cover_expr text;
begin
  if to_regclass('public.articles') is not null then
    execute $sql$
      insert into public.editorial_posts (
        id,
        title,
        slug,
        category,
        excerpt,
        cover_image,
        content,
        status,
        published_at,
        created_at,
        updated_at
      )
      select
        a.id,
        a.title,
        a.slug,
        coalesce(a.category, 'Editorial'),
        coalesce(a.excerpt, left(coalesce(a.content_md, a.content, ''), 240)),
        coalesce(a.cover_image_url, a.cover_image),
        coalesce(a.content_md, a.content, ''),
        case when lower(coalesce(a.status, 'draft')) = 'published' then 'published' else 'draft' end,
        a.published_at,
        coalesce(a.created_at, now()),
        coalesce(a.updated_at, now())
      from public.articles a
      on conflict (id) do nothing
    $sql$;
  elsif to_regclass('public.posts') is not null then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'posts'
        and column_name = 'category'
    ) into posts_has_category;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'posts'
        and column_name = 'excerpt'
    ) into posts_has_excerpt;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'posts'
        and column_name = 'cover_image_url'
    ) into posts_has_cover_image_url;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'posts'
        and column_name = 'content'
    ) into posts_has_content;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'posts'
        and column_name = 'body_md'
    ) into posts_has_body_md;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'posts'
        and column_name = 'media_url'
    ) into posts_has_media_url;

    posts_category_expr := case
      when posts_has_category then 'coalesce(p.category, ''Editorial'')'
      else '''Editorial'''
    end;

    posts_content_expr := case
      when posts_has_content then 'coalesce(p.content, '''')'
      when posts_has_body_md then 'coalesce(p.body_md, '''')'
      else ''''''
    end;

    posts_excerpt_expr := case
      when posts_has_excerpt then format('coalesce(p.excerpt, left(%s, 240))', posts_content_expr)
      else format('left(%s, 240)', posts_content_expr)
    end;

    posts_cover_expr := case
      when posts_has_cover_image_url then 'p.cover_image_url'
      when posts_has_media_url then 'p.media_url'
      else 'null'
    end;

    execute format($sql$
      insert into public.editorial_posts (
        id,
        title,
        slug,
        category,
        excerpt,
        cover_image,
        content,
        status,
        published_at,
        created_at,
        updated_at
      )
      select
        p.id,
        p.title,
        p.slug,
        %s,
        %s,
        %s,
        %s,
        case when lower(coalesce(p.status, 'draft')) = 'published' then 'published' else 'draft' end,
        p.published_at,
        coalesce(p.created_at, now()),
        coalesce(p.updated_at, now())
      from public.posts p
      on conflict (id) do nothing
    $sql$, posts_category_expr, posts_excerpt_expr, posts_cover_expr, posts_content_expr);
  end if;
end
$$;

create table if not exists public.editorial_products (
  post_id uuid not null references public.editorial_posts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 1,
  primary key (post_id, product_id),
  constraint editorial_products_position_positive check (position > 0)
);

create index if not exists idx_editorial_products_post_position
  on public.editorial_products (post_id, position);

create index if not exists idx_editorial_products_product
  on public.editorial_products (product_id);

-- =========================================================
-- discovery collections
-- =========================================================
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  kind text not null default 'curation'
    check (kind in ('trend', 'origin', 'ingredient', 'experience', 'curation', 'editorial', 'brand', 'featured')),
  cover_image text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  editorial_boost numeric(5,2) not null default 0,
  trend_boost numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint collections_editorial_boost_range check (editorial_boost between 0 and 100),
  constraint collections_trend_boost_range check (trend_boost between 0 and 100)
);

create index if not exists idx_collections_kind_status
  on public.collections (kind, status, published_at desc, created_at desc);

drop trigger if exists trg_collections_updated on public.collections;
create trigger trg_collections_updated
before update on public.collections
for each row execute function public.set_updated_at();

create table if not exists public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null default 1,
  editorial_boost numeric(5,2) not null default 0,
  primary key (collection_id, product_id),
  constraint collection_products_position_positive check (position > 0),
  constraint collection_products_editorial_boost_range check (editorial_boost between 0 and 100)
);

create index if not exists idx_collection_products_collection_position
  on public.collection_products (collection_id, position);

create index if not exists idx_collection_products_product
  on public.collection_products (product_id);

-- =========================================================
-- ingredients + origins discovery
-- =========================================================
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  benefits text,
  origin text,
  cover_image text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ingredients_status_name
  on public.ingredients (status, name);

drop trigger if exists trg_ingredients_updated on public.ingredients;
create trigger trg_ingredients_updated
before update on public.ingredients
for each row execute function public.set_updated_at();

create table if not exists public.product_ingredients (
  product_id uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  primary key (product_id, ingredient_id)
);

create index if not exists idx_product_ingredients_ingredient
  on public.product_ingredients (ingredient_id, product_id);

create table if not exists public.origins (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text,
  description text,
  cover_image text,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_origins_status_name
  on public.origins (status, name);

drop trigger if exists trg_origins_updated on public.origins;
create trigger trg_origins_updated
before update on public.origins
for each row execute function public.set_updated_at();

create table if not exists public.product_origins (
  product_id uuid not null references public.products(id) on delete cascade,
  origin_id uuid not null references public.origins(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (product_id, origin_id)
);

create index if not exists idx_product_origins_origin
  on public.product_origins (origin_id, product_id);

create unique index if not exists uq_product_origins_primary
  on public.product_origins (product_id)
  where is_primary = true;

-- =========================================================
-- product rankings materialized table
-- =========================================================
create table if not exists public.product_rankings (
  product_id uuid primary key references public.products(id) on delete cascade,
  conversion_rate numeric(8,6) not null default 0,
  sales_velocity numeric(8,4) not null default 0,
  rating numeric(4,2) not null default 0,
  margin numeric(8,6) not null default 0,
  freshness numeric(8,6) not null default 0,
  product_score numeric(6,2) not null default 0,
  updated_at timestamptz not null default now(),
  constraint product_rankings_score_range check (product_score between 0 and 100)
);

create index if not exists idx_product_rankings_score
  on public.product_rankings (product_score desc, updated_at desc);

create or replace function public.refresh_product_rankings()
returns integer
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_rows integer := 0;
begin
  with src as (
    select
      p.id as product_id,
      coalesce(ps.conversion_rate, 0)::numeric as conversion_rate,
      coalesce(pt.purchases_24h, 0)::numeric as sales_velocity_raw,
      coalesce(ps.avg_rating, 0)::numeric as rating,
      case
        when s.commission_rate is null then 0.10::numeric
        when s.commission_rate <= 1 then s.commission_rate::numeric
        else round((s.commission_rate / 100.0)::numeric, 6)
      end as margin_rate,
      greatest(
        0::numeric,
        1::numeric - least(
          1::numeric,
          extract(epoch from greatest(interval '0', now() - coalesce(p.created_at, now()))) / extract(epoch from interval '90 days')
        )
      ) as freshness_factor
    from public.products p
    join public.sellers s on s.id = p.seller_id
    left join public.product_scores ps on ps.product_id = p.id
    left join public.product_trending pt on pt.product_id = p.id
    where lower(coalesce(p.status, '')) in ('published', 'active', 'review', 'paused')
  ),
  bounds as (
    select greatest(max(sales_velocity_raw), 0)::numeric as max_sales_velocity
    from src
  ),
  scored as (
    select
      src.product_id,
      src.conversion_rate,
      src.sales_velocity_raw as sales_velocity,
      src.rating,
      src.margin_rate as margin,
      src.freshness_factor as freshness,
      least(100::numeric, greatest(0::numeric, src.conversion_rate * 1000::numeric)) as conversion_component,
      least(100::numeric, greatest(0::numeric, ((src.rating - 1::numeric) / 4::numeric) * 100::numeric)) as rating_component,
      case
        when b.max_sales_velocity > 0
          then least(100::numeric, greatest(0::numeric, (src.sales_velocity_raw / b.max_sales_velocity) * 100::numeric))
        else 0::numeric
      end as sales_component,
      least(100::numeric, greatest(0::numeric, src.freshness_factor * 100::numeric)) as freshness_component,
      least(100::numeric, greatest(0::numeric, (src.margin_rate / 0.25::numeric) * 100::numeric)) as margin_component
    from src
    cross join bounds b
  )
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
    s.product_id,
    round(s.conversion_rate, 6),
    round(s.sales_velocity, 4),
    round(s.rating, 2),
    round(s.margin, 6),
    round(s.freshness, 6),
    round(
      (s.conversion_component * 0.35)
      + (s.rating_component * 0.25)
      + (s.sales_component * 0.20)
      + (s.freshness_component * 0.10)
      + (s.margin_component * 0.10),
      2
    ),
    now()
  from scored s
  on conflict (product_id) do update
  set
    conversion_rate = excluded.conversion_rate,
    sales_velocity = excluded.sales_velocity,
    rating = excluded.rating,
    margin = excluded.margin,
    freshness = excluded.freshness,
    product_score = excluded.product_score,
    updated_at = excluded.updated_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

do $$
declare
  v_job_id bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;
  end if;

  for v_job_id in
    select jobid
    from cron.job
    where jobname in ('refresh_product_rankings_15m')
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'refresh_product_rankings_15m',
    '*/15 * * * *',
    'select public.refresh_product_rankings();'
  );
end
$$;

select public.refresh_product_rankings();

-- =========================================================
-- RLS
-- =========================================================
alter table public.brand_partnerships enable row level security;
alter table public.editorial_posts enable row level security;
alter table public.editorial_products enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.ingredients enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.origins enable row level security;
alter table public.product_origins enable row level security;
alter table public.product_rankings enable row level security;

drop policy if exists brand_partnerships_select_owner_or_admin on public.brand_partnerships;
create policy brand_partnerships_select_owner_or_admin
on public.brand_partnerships
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = brand_partnerships.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists brand_partnerships_admin_write on public.brand_partnerships;
create policy brand_partnerships_admin_write
on public.brand_partnerships
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists editorial_posts_public_read on public.editorial_posts;
create policy editorial_posts_public_read
on public.editorial_posts
for select
to public
using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists editorial_posts_admin_write on public.editorial_posts;
create policy editorial_posts_admin_write
on public.editorial_posts
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists editorial_products_public_read on public.editorial_products;
create policy editorial_products_public_read
on public.editorial_products
for select
to public
using (
  exists (
    select 1
    from public.editorial_posts ep
    join public.products p on p.id = editorial_products.product_id
    where ep.id = editorial_products.post_id
      and ep.status = 'published'
      and lower(coalesce(p.status, '')) in ('published', 'active')
  )
  or public.is_admin(auth.uid())
);

drop policy if exists editorial_products_admin_write on public.editorial_products;
create policy editorial_products_admin_write
on public.editorial_products
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists collections_public_read on public.collections;
create policy collections_public_read
on public.collections
for select
to public
using (status = 'published' or public.is_admin(auth.uid()));

drop policy if exists collections_admin_write on public.collections;
create policy collections_admin_write
on public.collections
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists collection_products_public_read on public.collection_products;
create policy collection_products_public_read
on public.collection_products
for select
to public
using (
  exists (
    select 1
    from public.collections c
    join public.products p on p.id = collection_products.product_id
    where c.id = collection_products.collection_id
      and c.status = 'published'
      and lower(coalesce(p.status, '')) in ('published', 'active')
  )
  or public.is_admin(auth.uid())
);

drop policy if exists collection_products_admin_write on public.collection_products;
create policy collection_products_admin_write
on public.collection_products
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists ingredients_public_read on public.ingredients;
create policy ingredients_public_read
on public.ingredients
for select
to public
using (status = 'active' or public.is_admin(auth.uid()));

drop policy if exists ingredients_admin_write on public.ingredients;
create policy ingredients_admin_write
on public.ingredients
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists product_ingredients_public_read on public.product_ingredients;
create policy product_ingredients_public_read
on public.product_ingredients
for select
to public
using (
  exists (
    select 1
    from public.ingredients i
    join public.products p on p.id = product_ingredients.product_id
    where i.id = product_ingredients.ingredient_id
      and i.status = 'active'
      and lower(coalesce(p.status, '')) in ('published', 'active')
  )
  or public.is_admin(auth.uid())
);

drop policy if exists product_ingredients_admin_write on public.product_ingredients;
create policy product_ingredients_admin_write
on public.product_ingredients
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists origins_public_read on public.origins;
create policy origins_public_read
on public.origins
for select
to public
using (status = 'active' or public.is_admin(auth.uid()));

drop policy if exists origins_admin_write on public.origins;
create policy origins_admin_write
on public.origins
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists product_origins_public_read on public.product_origins;
create policy product_origins_public_read
on public.product_origins
for select
to public
using (
  exists (
    select 1
    from public.origins o
    join public.products p on p.id = product_origins.product_id
    where o.id = product_origins.origin_id
      and o.status = 'active'
      and lower(coalesce(p.status, '')) in ('published', 'active')
  )
  or public.is_admin(auth.uid())
);

drop policy if exists product_origins_admin_write on public.product_origins;
create policy product_origins_admin_write
on public.product_origins
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists product_rankings_public_read on public.product_rankings;
create policy product_rankings_public_read
on public.product_rankings
for select
to public
using (
  exists (
    select 1
    from public.products p
    where p.id = product_rankings.product_id
      and (
        lower(coalesce(p.status, '')) in ('published', 'active')
        or public.is_admin(auth.uid())
      )
  )
);

drop policy if exists product_rankings_service_all on public.product_rankings;
create policy product_rankings_service_all
on public.product_rankings
for all
to service_role
using (true)
with check (true);

drop policy if exists brand_partnerships_service_all on public.brand_partnerships;
create policy brand_partnerships_service_all
on public.brand_partnerships
for all
to service_role
using (true)
with check (true);

drop policy if exists editorial_posts_service_all on public.editorial_posts;
create policy editorial_posts_service_all
on public.editorial_posts
for all
to service_role
using (true)
with check (true);

drop policy if exists editorial_products_service_all on public.editorial_products;
create policy editorial_products_service_all
on public.editorial_products
for all
to service_role
using (true)
with check (true);

drop policy if exists collections_service_all on public.collections;
create policy collections_service_all
on public.collections
for all
to service_role
using (true)
with check (true);

drop policy if exists collection_products_service_all on public.collection_products;
create policy collection_products_service_all
on public.collection_products
for all
to service_role
using (true)
with check (true);

drop policy if exists ingredients_service_all on public.ingredients;
create policy ingredients_service_all
on public.ingredients
for all
to service_role
using (true)
with check (true);

drop policy if exists product_ingredients_service_all on public.product_ingredients;
create policy product_ingredients_service_all
on public.product_ingredients
for all
to service_role
using (true)
with check (true);

drop policy if exists origins_service_all on public.origins;
create policy origins_service_all
on public.origins
for all
to service_role
using (true)
with check (true);

drop policy if exists product_origins_service_all on public.product_origins;
create policy product_origins_service_all
on public.product_origins
for all
to service_role
using (true)
with check (true);

grant select on table public.editorial_posts to anon, authenticated;
grant select on table public.editorial_products to anon, authenticated;
grant select on table public.collections to anon, authenticated;
grant select on table public.collection_products to anon, authenticated;
grant select on table public.ingredients to anon, authenticated;
grant select on table public.product_ingredients to anon, authenticated;
grant select on table public.origins to anon, authenticated;
grant select on table public.product_origins to anon, authenticated;
grant select on table public.product_rankings to anon, authenticated;
grant select on table public.brand_partnerships to authenticated;

grant all on table public.brand_partnerships to service_role;
grant all on table public.editorial_posts to service_role;
grant all on table public.editorial_products to service_role;
grant all on table public.collections to service_role;
grant all on table public.collection_products to service_role;
grant all on table public.ingredients to service_role;
grant all on table public.product_ingredients to service_role;
grant all on table public.origins to service_role;
grant all on table public.product_origins to service_role;
grant all on table public.product_rankings to service_role;
