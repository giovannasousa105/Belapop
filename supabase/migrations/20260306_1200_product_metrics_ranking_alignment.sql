-- Product metrics/ranking alignment (A/B package) adapted to current BelaPop schema.
-- Safe to re-run.

-- =========================================================
-- product_metrics_30d enrichment
-- =========================================================

alter table if exists public.product_metrics_30d
  add column if not exists seller_id uuid references public.sellers(id) on delete cascade,
  add column if not exists category_key text,
  add column if not exists impressions integer not null default 0,
  add column if not exists clicks integer not null default 0,
  add column if not exists pdp_views integer not null default 0,
  add column if not exists orders_count integer not null default 0,
  add column if not exists units_sold integer not null default 0,
  add column if not exists category_ctr_benchmark numeric(8,6) not null default 0,
  add column if not exists category_conversion_benchmark numeric(8,6) not null default 0,
  add column if not exists reviews_count integer not null default 0,
  add column if not exists returned_orders_count integer not null default 0;

alter table if exists public.product_metrics_30d
  alter column ctr type numeric(8,6) using coalesce(ctr, 0)::numeric(8,6),
  alter column conversion_rate type numeric(8,6) using coalesce(conversion_rate, 0)::numeric(8,6),
  alter column ctr_index type numeric(8,6) using coalesce(ctr_index, 0)::numeric(8,6),
  alter column conversion_index type numeric(8,6) using coalesce(conversion_index, 0)::numeric(8,6),
  alter column return_rate type numeric(8,6) using coalesce(return_rate, 0)::numeric(8,6),
  alter column content_completion_rate type numeric(8,6) using coalesce(content_completion_rate, 0)::numeric(8,6);

create index if not exists idx_product_metrics_30d_seller
  on public.product_metrics_30d (seller_id, computed_at desc);

create index if not exists idx_product_metrics_30d_category
  on public.product_metrics_30d (category_key, computed_at desc);

-- =========================================================
-- product_ranking_snapshot enrichment
-- =========================================================

alter table if exists public.product_ranking_snapshot
  add column if not exists eligible boolean not null default true;

create index if not exists idx_product_ranking_surface_context_eligible
  on public.product_ranking_snapshot (surface, context_key, eligible, final_rank_score desc, computed_at desc);

-- =========================================================
-- refresh_product_metrics_30d (30d window materialization)
-- =========================================================

create or replace function public.refresh_product_metrics_30d()
returns integer
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_rows integer := 0;
begin
  with products_base as (
    select
      p.id as product_id,
      p.seller_id,
      lower(coalesce(p.category, '')) as category_key,
      (
        (
          case when btrim(coalesce(p.name, '')) <> '' then 1 else 0 end
          + case when btrim(coalesce(p.description, '')) <> '' then 1 else 0 end
          + case when btrim(coalesce(p.category, '')) <> '' then 1 else 0 end
          + case when coalesce(p.price_cents, 0) > 0 then 1 else 0 end
          + case when jsonb_typeof(coalesce(p.images, '[]'::jsonb)) = 'array' and jsonb_array_length(coalesce(p.images, '[]'::jsonb)) > 0 then 1 else 0 end
          + case when jsonb_typeof(coalesce(p.highlights, '[]'::jsonb)) = 'array' and jsonb_array_length(coalesce(p.highlights, '[]'::jsonb)) > 0 then 1 else 0 end
          + case when coalesce(p.weight_kg, 0) > 0 then 1 else 0 end
          + case when coalesce(p.width_cm, 0) > 0 and coalesce(p.height_cm, 0) > 0 and coalesce(p.length_cm, 0) > 0 then 1 else 0 end
        )::numeric / 8::numeric
      ) as content_completion_rate
    from public.products p
  ),
  event_metrics as (
    select
      ae.product_id,
      count(*) filter (where lower(coalesce(ae.type, '')) in ('impression', 'product_impression', 'search_impression', 'view_catalog', 'view_home'))::integer as impressions,
      count(*) filter (where lower(coalesce(ae.type, '')) in ('click_product', 'product_click', 'select_product', 'select_item'))::integer as clicks,
      count(*) filter (where lower(coalesce(ae.type, '')) in ('view_product', 'product_view', 'view_item'))::integer as pdp_views
    from public.analytics_events ae
    where ae.product_id is not null
      and ae.created_at >= now() - interval '30 days'
    group by ae.product_id
  ),
  sales_metrics as (
    select
      oi.product_id,
      count(distinct oi.order_id) filter (
        where lower(coalesce(o.payment_status, '')) in ('paid', 'approved', 'succeeded', 'completed')
           or lower(coalesce(o.status, '')) in ('paid', 'fulfilled', 'completed', 'delivered')
      )::integer as orders_count,
      coalesce(sum(greatest(coalesce(oi.quantity, 1), 1)) filter (
        where lower(coalesce(o.payment_status, '')) in ('paid', 'approved', 'succeeded', 'completed')
           or lower(coalesce(o.status, '')) in ('paid', 'fulfilled', 'completed', 'delivered')
      ), 0)::integer as units_sold,
      count(distinct oi.order_id) filter (
        where lower(coalesce(so.status, '')) in ('returned', 'refunded', 'return_received', 'exchanged')
      )::integer as returned_orders_count
    from public.order_items oi
    left join public.orders o on o.id = oi.order_id
    left join public.seller_orders so on so.id = oi.seller_order_id
    where coalesce(oi.created_at, o.created_at, now()) >= now() - interval '30 days'
    group by oi.product_id
  ),
  reviews_union as (
    select
      pr.product_id,
      pr.rating::numeric as rating
    from public.product_reviews pr
    where pr.created_at >= now() - interval '90 days'
    union all
    select
      rv.product_id,
      rv.rating::numeric as rating
    from public.reviews rv
    where rv.created_at >= now() - interval '90 days'
  ),
  review_metrics as (
    select
      ru.product_id,
      avg(ru.rating)::numeric(4,2) as avg_rating,
      count(*)::integer as reviews_count
    from reviews_union ru
    group by ru.product_id
  ),
  raw_metrics as (
    select
      pb.product_id,
      pb.seller_id,
      pb.category_key,
      coalesce(em.impressions, 0)::integer as impressions,
      coalesce(em.clicks, 0)::integer as clicks,
      coalesce(em.pdp_views, 0)::integer as pdp_views,
      coalesce(sm.orders_count, 0)::integer as orders_count,
      coalesce(sm.units_sold, 0)::integer as units_sold,
      case
        when coalesce(em.impressions, 0) > 0
          then coalesce(em.clicks, 0)::numeric / em.impressions::numeric
        else 0::numeric
      end as ctr,
      case
        when coalesce(em.pdp_views, 0) > 0
          then coalesce(sm.orders_count, 0)::numeric / em.pdp_views::numeric
        else 0::numeric
      end as conversion_rate,
      coalesce(rm.avg_rating, 0)::numeric(4,2) as avg_rating,
      coalesce(rm.reviews_count, 0)::integer as reviews_count,
      case
        when coalesce(sm.orders_count, 0) > 0
          then coalesce(sm.returned_orders_count, 0)::numeric / sm.orders_count::numeric
        else 0::numeric
      end as return_rate,
      coalesce(sm.returned_orders_count, 0)::integer as returned_orders_count,
      coalesce(pb.content_completion_rate, 0)::numeric as content_completion_rate
    from products_base pb
    left join event_metrics em on em.product_id = pb.product_id
    left join sales_metrics sm on sm.product_id = pb.product_id
    left join review_metrics rm on rm.product_id = pb.product_id
  ),
  category_benchmarks as (
    select
      rm.category_key,
      avg(rm.ctr) filter (where rm.impressions > 0)::numeric as category_ctr_benchmark,
      avg(rm.conversion_rate) filter (where rm.pdp_views > 0)::numeric as category_conversion_benchmark
    from raw_metrics rm
    group by rm.category_key
  ),
  global_benchmarks as (
    select
      coalesce(avg(rm.ctr) filter (where rm.impressions > 0), 0.05::numeric) as ctr_benchmark,
      coalesce(avg(rm.conversion_rate) filter (where rm.pdp_views > 0), 0.02::numeric) as conversion_benchmark
    from raw_metrics rm
  )
  insert into public.product_metrics_30d (
    product_id,
    seller_id,
    category_key,
    impressions,
    clicks,
    pdp_views,
    orders_count,
    units_sold,
    ctr,
    conversion_rate,
    category_ctr_benchmark,
    category_conversion_benchmark,
    ctr_index,
    conversion_index,
    avg_rating,
    reviews_count,
    return_rate,
    returned_orders_count,
    content_completion_rate,
    computed_at
  )
  select
    rm.product_id,
    rm.seller_id,
    rm.category_key,
    rm.impressions,
    rm.clicks,
    rm.pdp_views,
    rm.orders_count,
    rm.units_sold,
    round(rm.ctr, 6) as ctr,
    round(rm.conversion_rate, 6) as conversion_rate,
    round(coalesce(cb.category_ctr_benchmark, gb.ctr_benchmark), 6) as category_ctr_benchmark,
    round(coalesce(cb.category_conversion_benchmark, gb.conversion_benchmark), 6) as category_conversion_benchmark,
    round(
      case
        when coalesce(cb.category_ctr_benchmark, gb.ctr_benchmark, 0) > 0
          then rm.ctr / coalesce(cb.category_ctr_benchmark, gb.ctr_benchmark)
        else 0::numeric
      end
    , 6) as ctr_index,
    round(
      case
        when coalesce(cb.category_conversion_benchmark, gb.conversion_benchmark, 0) > 0
          then rm.conversion_rate / coalesce(cb.category_conversion_benchmark, gb.conversion_benchmark)
        else 0::numeric
      end
    , 6) as conversion_index,
    round(rm.avg_rating, 2) as avg_rating,
    rm.reviews_count,
    round(rm.return_rate, 6) as return_rate,
    rm.returned_orders_count,
    round(rm.content_completion_rate, 6) as content_completion_rate,
    now()
  from raw_metrics rm
  left join category_benchmarks cb on cb.category_key = rm.category_key
  cross join global_benchmarks gb
  on conflict (product_id) do update
  set
    seller_id = excluded.seller_id,
    category_key = excluded.category_key,
    impressions = excluded.impressions,
    clicks = excluded.clicks,
    pdp_views = excluded.pdp_views,
    orders_count = excluded.orders_count,
    units_sold = excluded.units_sold,
    ctr = excluded.ctr,
    conversion_rate = excluded.conversion_rate,
    category_ctr_benchmark = excluded.category_ctr_benchmark,
    category_conversion_benchmark = excluded.category_conversion_benchmark,
    ctr_index = excluded.ctr_index,
    conversion_index = excluded.conversion_index,
    avg_rating = excluded.avg_rating,
    reviews_count = excluded.reviews_count,
    return_rate = excluded.return_rate,
    returned_orders_count = excluded.returned_orders_count,
    content_completion_rate = excluded.content_completion_rate,
    computed_at = excluded.computed_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

-- =========================================================
-- refresh_product_ranking_snapshot (formula + eligible)
-- =========================================================

create or replace function public.refresh_product_ranking_snapshot(
  p_surface text default 'search',
  p_context_key text default null
)
returns integer
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_rows integer := 0;
  v_surface text := lower(coalesce(p_surface, 'search'));
  v_context text := nullif(lower(btrim(coalesce(p_context_key, ''))), '');
begin
  if v_surface not in ('search', 'category', 'home', 'featured') then
    raise exception 'invalid_surface: %', v_surface;
  end if;

  -- Keep only the latest snapshot for each surface/context pair.
  delete from public.product_ranking_snapshot prs
  where prs.surface = v_surface
    and coalesce(prs.context_key, '') = coalesce(v_context, '');

  with src as (
    select
      ps.product_id,
      ps.seller_id,
      coalesce(ss.final_score, 0)::numeric as seller_score,
      coalesce(ps.final_score, 0)::numeric as product_score,

      case
        when coalesce(p.stock_quantity, 0) <= 0 then 0::numeric
        when coalesce(p.stock_quantity, 0) <= 5 then 40::numeric
        when coalesce(p.is_featured, false) = true then 90::numeric
        when coalesce(p.curated, false) = true then 80::numeric
        else 70::numeric
      end as commercial_score,

      case
        when v_surface = 'category' then
          case
            when v_context is null then 100::numeric
            when lower(coalesce(p.category, '')) = v_context then 100::numeric
            else 0::numeric
          end
        when v_surface = 'featured' then
          case
            when coalesce(ps.eligible_featured, false) and coalesce(ss.eligible_featured, false) then 95::numeric
            else 40::numeric
          end
        when v_surface = 'home' then 70::numeric
        else
          case
            when v_context is null then 50::numeric
            when lower(coalesce(p.category, '')) = v_context then 100::numeric
            when lower(coalesce(p.name, '')) like '%' || v_context || '%' then 80::numeric
            else 35::numeric
          end
      end as context_score,

      (
        case when coalesce(ss.exposure_tier, 'restricted') = 'restricted' then 100 else 0 end
        + case when coalesce(ss.final_score, 0) < 60 then 15 else 0 end
        + case when coalesce(p.stock_quantity, 0) <= 0 then 100 else 0 end
        + case when coalesce(ps.return_rate, 0) > 0.12 then 20 else 0 end
        + case when coalesce(ps.content_completion_rate, 0) < 0.70 then 15 else 0 end
        + case when coalesce(ps.avg_rating, 0) > 0 and coalesce(ps.avg_rating, 0) < 3.8 then 12 else 0 end
      )::numeric as penalty_score,

      (
        case
          when v_surface = 'featured' then
            coalesce(ps.eligible_featured, false)
            and coalesce(ss.eligible_featured, false)
            and coalesce(p.stock_quantity, 0) > 0
            and coalesce(ss.exposure_tier, 'restricted') <> 'restricted'
          else
            coalesce(ps.eligible_search, false)
            and coalesce(p.stock_quantity, 0) > 0
            and coalesce(ss.exposure_tier, 'restricted') <> 'restricted'
        end
      ) as eligible
    from public.product_scores ps
    join public.seller_scores ss on ss.seller_id = ps.seller_id
    join public.products p on p.id = ps.product_id
    where lower(coalesce(p.status, '')) in ('published', 'review', 'needs_adjustment', 'paused', 'draft')
      and (
        v_surface <> 'category'
        or v_context is null
        or lower(coalesce(p.category, '')) = v_context
      )
  )
  insert into public.product_ranking_snapshot (
    product_id,
    seller_id,
    surface,
    context_key,
    seller_score,
    product_score,
    commercial_score,
    context_score,
    penalty_score,
    final_rank_score,
    eligible,
    computed_at
  )
  select
    s.product_id,
    s.seller_id,
    v_surface,
    v_context,
    round(s.seller_score, 2),
    round(s.product_score, 2),
    round(s.commercial_score, 2),
    round(s.context_score, 2),
    round(s.penalty_score, 2),
    round(
      greatest(
        0::numeric,
        (s.seller_score * 0.40)
        + (s.product_score * 0.35)
        + (s.commercial_score * 0.15)
        + (s.context_score * 0.10)
        - s.penalty_score
      )
    , 2) as final_rank_score,
    s.eligible,
    now()
  from src s;

  get diagnostics v_rows = row_count;

  delete from public.product_ranking_snapshot
  where computed_at < now() - interval '30 days';

  return v_rows;
end;
$$;

-- =========================================================
-- Cron schedule alignment
-- =========================================================

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
    where jobname in (
      'refresh_product_metrics_30d_30m',
      'refresh_product_scores_hourly',
      'refresh_product_ranking_snapshot_hourly',
      'refresh_product_ranking_snapshot_featured_20_50'
    )
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'refresh_product_metrics_30d_30m',
    '*/30 * * * *',
    'select public.refresh_product_metrics_30d();'
  );

  perform cron.schedule(
    'refresh_product_scores_hourly',
    '10,40 * * * *',
    'select public.refresh_product_scores();'
  );

  perform cron.schedule(
    'refresh_product_ranking_snapshot_hourly',
    '20,50 * * * *',
    'select public.refresh_product_ranking_snapshot(''search'', null);'
  );

  perform cron.schedule(
    'refresh_product_ranking_snapshot_featured_20_50',
    '22,52 * * * *',
    'select public.refresh_product_ranking_snapshot(''featured'', ''global'');'
  );
end;
$$;

-- One-shot recompute after function updates.
select public.refresh_product_metrics_30d();
select public.refresh_product_scores();
select public.refresh_product_ranking_snapshot('search', null);
select public.refresh_product_ranking_snapshot('featured', 'global');
