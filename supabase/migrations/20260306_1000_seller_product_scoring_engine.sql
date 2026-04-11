-- Seller/Product scoring engine (0-100) + ranking snapshots + cron jobs.
-- Principal window: 30d. Stability window: 90d.
-- Safe to re-run.

create table if not exists public.seller_scores (
  seller_id uuid primary key references public.sellers(id) on delete cascade,

  -- component scores (0-100)
  sla_score numeric(5,2) not null default 0,
  cancel_score numeric(5,2) not null default 0,
  return_score numeric(5,2) not null default 0,
  rating_score numeric(5,2) not null default 0,
  stock_health_score numeric(5,2) not null default 0,
  compliance_score numeric(5,2) not null default 0,

  -- explained score pipeline
  base_score numeric(5,2) not null default 0,
  penalty_score numeric(5,2) not null default 0,
  final_score numeric(5,2) not null default 0,

  -- raw/debug metrics
  shipped_on_time_rate numeric(6,4) not null default 0,
  cancel_rate numeric(6,4) not null default 0,
  return_rate numeric(6,4) not null default 0,
  avg_rating numeric(3,2) not null default 0,
  low_stock_rate numeric(6,4) not null default 0,
  compliance_ok boolean not null default false,

  -- operational flags
  score_window_days integer not null default 30,
  stability_window_days integer not null default 90,
  exposure_tier text not null default 'standard'
    check (exposure_tier in ('premium', 'standard', 'warning', 'restricted')),
  eligible_featured boolean not null default false,

  computed_at timestamptz not null default now(),

  constraint seller_scores_final_score_range check (final_score >= 0 and final_score <= 100)
);

create index if not exists idx_seller_scores_tier
  on public.seller_scores (exposure_tier, final_score desc);

create table if not exists public.product_metrics_30d (
  product_id uuid primary key references public.products(id) on delete cascade,
  conversion_rate numeric(6,4) not null default 0,
  conversion_index numeric(6,4) not null default 0,
  ctr numeric(6,4) not null default 0,
  ctr_index numeric(6,4) not null default 0,
  avg_rating numeric(3,2) not null default 0,
  return_rate numeric(6,4) not null default 0,
  content_completion_rate numeric(6,4) not null default 0,
  computed_at timestamptz not null default now()
);

create table if not exists public.product_scores (
  product_id uuid primary key references public.products(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,

  -- component scores (0-100)
  conversion_score numeric(5,2) not null default 0,
  ctr_score numeric(5,2) not null default 0,
  content_quality_score numeric(5,2) not null default 0,
  rating_score numeric(5,2) not null default 0,
  return_score numeric(5,2) not null default 0,
  stock_score numeric(5,2) not null default 0,

  -- explained score pipeline
  base_score numeric(5,2) not null default 0,
  penalty_score numeric(5,2) not null default 0,
  final_score numeric(5,2) not null default 0,

  -- raw/debug metrics
  conversion_rate numeric(6,4) not null default 0,
  ctr numeric(6,4) not null default 0,
  avg_rating numeric(3,2) not null default 0,
  return_rate numeric(6,4) not null default 0,
  in_stock boolean not null default true,
  content_completion_rate numeric(6,4) not null default 0,

  -- operational flags
  eligible_search boolean not null default true,
  eligible_featured boolean not null default false,

  computed_at timestamptz not null default now(),

  constraint product_scores_final_score_range check (final_score >= 0 and final_score <= 100)
);

create index if not exists idx_product_scores_seller
  on public.product_scores (seller_id, final_score desc);

create index if not exists idx_product_scores_featured
  on public.product_scores (eligible_featured, final_score desc);

create table if not exists public.product_ranking_snapshot (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  surface text not null check (surface in ('search', 'category', 'home', 'featured')),
  context_key text null,

  seller_score numeric(5,2) not null,
  product_score numeric(5,2) not null,
  commercial_score numeric(5,2) not null default 0,
  context_score numeric(5,2) not null default 0,
  penalty_score numeric(5,2) not null default 0,

  final_rank_score numeric(7,2) not null,
  computed_at timestamptz not null default now()
);

create index if not exists idx_product_ranking_surface_context
  on public.product_ranking_snapshot (surface, context_key, final_rank_score desc, computed_at desc);

create index if not exists idx_product_ranking_product
  on public.product_ranking_snapshot (product_id, computed_at desc);

create or replace function public.refresh_seller_scores()
returns integer
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_rows integer := 0;
begin
  with sellers_base as (
    select s.id as seller_id, s.user_id, lower(coalesce(s.status, '')) as seller_status
    from public.sellers s
  ),
  so_30 as (
    select
      so.seller_id,
      count(*)::numeric as total_orders,
      avg(
        case
          when lower(coalesce(so.status, '')) in ('shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed')
            then case when coalesce(so.shipped_at, so.updated_at, so.created_at + interval '100 years') <= so.created_at + interval '24 hours'
                      then 1.0 else 0.0 end
          else null
        end
      )::numeric as sla_rate,
      avg(case when lower(coalesce(so.status, '')) in ('canceled', 'cancelled') then 1.0 else 0.0 end)::numeric as cancel_rate,
      avg(case when lower(coalesce(so.status, '')) in ('returned', 'refunded', 'return_received', 'exchanged') then 1.0 else 0.0 end)::numeric as return_rate
    from public.seller_orders so
    where so.created_at >= now() - interval '30 days'
    group by so.seller_id
  ),
  so_90 as (
    select
      so.seller_id,
      count(*)::numeric as total_orders,
      avg(
        case
          when lower(coalesce(so.status, '')) in ('shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed')
            then case when coalesce(so.shipped_at, so.updated_at, so.created_at + interval '100 years') <= so.created_at + interval '24 hours'
                      then 1.0 else 0.0 end
          else null
        end
      )::numeric as sla_rate,
      avg(case when lower(coalesce(so.status, '')) in ('canceled', 'cancelled') then 1.0 else 0.0 end)::numeric as cancel_rate,
      avg(case when lower(coalesce(so.status, '')) in ('returned', 'refunded', 'return_received', 'exchanged') then 1.0 else 0.0 end)::numeric as return_rate
    from public.seller_orders so
    where so.created_at >= now() - interval '90 days'
    group by so.seller_id
  ),
  rating_by_seller as (
    select r.seller_id, avg(r.rating)::numeric as avg_rating
    from (
      select p.seller_id, pr.rating::numeric as rating
      from public.product_reviews pr
      join public.products p on p.id = pr.product_id
      where pr.created_at >= now() - interval '90 days'
      union all
      select p.seller_id, rv.rating::numeric as rating
      from public.reviews rv
      join public.products p on p.id = rv.product_id
      where rv.created_at >= now() - interval '90 days'
    ) r
    group by r.seller_id
  ),
  stock_by_seller as (
    select
      p.seller_id,
      avg(case when coalesce(p.stock_quantity, 0) <= 5 then 1.0 else 0.0 end)::numeric as low_stock_rate
    from public.products p
    where lower(coalesce(p.status, '')) in ('published', 'review', 'needs_adjustment', 'paused', 'draft')
    group by p.seller_id
  ),
  compliance_by_seller as (
    select
      sb.seller_id,
      (
        sb.seller_status = 'approved'
        or exists (
          select 1
          from public.seller_profiles sp
          where sp.user_id = sb.user_id
            and lower(coalesce(sp.status, '')) = 'approved'
        )
      ) as compliance_ok
    from sellers_base sb
  ),
  metrics as (
    select
      sb.seller_id,
      case
        when coalesce(so_90.total_orders, 0) >= 10
          then (coalesce(so_30.sla_rate, so_90.sla_rate, 0) * 0.70) + (coalesce(so_90.sla_rate, so_30.sla_rate, 0) * 0.30)
        else coalesce(so_30.sla_rate, so_90.sla_rate, 0)
      end as sla_rate,
      case
        when coalesce(so_90.total_orders, 0) >= 10
          then (coalesce(so_30.cancel_rate, so_90.cancel_rate, 0) * 0.70) + (coalesce(so_90.cancel_rate, so_30.cancel_rate, 0) * 0.30)
        else coalesce(so_30.cancel_rate, so_90.cancel_rate, 0)
      end as cancel_rate,
      case
        when coalesce(so_90.total_orders, 0) >= 10
          then (coalesce(so_30.return_rate, so_90.return_rate, 0) * 0.70) + (coalesce(so_90.return_rate, so_30.return_rate, 0) * 0.30)
        else coalesce(so_30.return_rate, so_90.return_rate, 0)
      end as return_rate,
      coalesce(r.avg_rating, 0) as avg_rating,
      coalesce(st.low_stock_rate, 0) as low_stock_rate,
      coalesce(c.compliance_ok, false) as compliance_ok
    from sellers_base sb
    left join so_30 on so_30.seller_id = sb.seller_id
    left join so_90 on so_90.seller_id = sb.seller_id
    left join rating_by_seller r on r.seller_id = sb.seller_id
    left join stock_by_seller st on st.seller_id = sb.seller_id
    left join compliance_by_seller c on c.seller_id = sb.seller_id
  ),
  components as (
    select
      m.seller_id,
      round(greatest(0::numeric, least(100::numeric, ((m.sla_rate - 0.85) / (0.98 - 0.85)) * 100)), 2) as sla_score,
      round(greatest(0::numeric, least(100::numeric, 100 - ((m.cancel_rate / 0.07) * 100))), 2) as cancel_score,
      round(greatest(0::numeric, least(100::numeric, 100 - ((m.return_rate / 0.10) * 100))), 2) as return_score,
      round(greatest(0::numeric, least(100::numeric, ((m.avg_rating - 1) / 4) * 100)), 2) as rating_score,
      round(greatest(0::numeric, least(100::numeric, 100 - (m.low_stock_rate * 100))), 2) as stock_health_score,
      case when m.compliance_ok then 100::numeric else 0::numeric end as compliance_score,
      round(m.sla_rate::numeric, 4) as shipped_on_time_rate,
      round(m.cancel_rate::numeric, 4) as cancel_rate,
      round(m.return_rate::numeric, 4) as return_rate,
      round(m.avg_rating::numeric, 2) as avg_rating,
      round(m.low_stock_rate::numeric, 4) as low_stock_rate,
      m.compliance_ok
    from metrics m
  ),
  scored as (
    select
      c.*,
      round(
        (c.sla_score * 0.35)
        + (c.cancel_score * 0.20)
        + (c.return_score * 0.15)
        + (c.rating_score * 0.15)
        + (c.stock_health_score * 0.10)
        + (c.compliance_score * 0.05)
      , 2) as base_score,
      (
        case when c.shipped_on_time_rate < 0.90 then 15 else 0 end
        + case when c.cancel_rate > 0.05 then 20 else 0 end
        + case when c.return_rate > 0.08 then 12 else 0 end
        + case when c.compliance_ok = false then 100 else 0 end
      )::numeric as penalty_score
    from components c
  ),
  finalized as (
    select
      s.*,
      round(greatest(0::numeric, least(100::numeric, s.base_score - s.penalty_score)), 2) as final_score
    from scored s
  )
  insert into public.seller_scores (
    seller_id,
    sla_score,
    cancel_score,
    return_score,
    rating_score,
    stock_health_score,
    compliance_score,
    base_score,
    penalty_score,
    final_score,
    shipped_on_time_rate,
    cancel_rate,
    return_rate,
    avg_rating,
    low_stock_rate,
    compliance_ok,
    score_window_days,
    stability_window_days,
    exposure_tier,
    eligible_featured,
    computed_at
  )
  select
    f.seller_id,
    f.sla_score,
    f.cancel_score,
    f.return_score,
    f.rating_score,
    f.stock_health_score,
    f.compliance_score,
    f.base_score,
    round(f.penalty_score, 2) as penalty_score,
    f.final_score,
    f.shipped_on_time_rate,
    f.cancel_rate,
    f.return_rate,
    f.avg_rating,
    f.low_stock_rate,
    f.compliance_ok,
    30 as score_window_days,
    90 as stability_window_days,
    case
      when f.compliance_ok = false then 'restricted'
      when f.final_score >= 90 then 'premium'
      when f.final_score >= 75 then 'standard'
      when f.final_score >= 60 then 'warning'
      else 'restricted'
    end as exposure_tier,
    (
      f.compliance_ok = true
      and f.final_score >= 85
      and f.shipped_on_time_rate >= 0.95
      and f.cancel_rate <= 0.03
    ) as eligible_featured,
    now()
  from finalized f
  on conflict (seller_id) do update
  set
    sla_score = excluded.sla_score,
    cancel_score = excluded.cancel_score,
    return_score = excluded.return_score,
    rating_score = excluded.rating_score,
    stock_health_score = excluded.stock_health_score,
    compliance_score = excluded.compliance_score,
    base_score = excluded.base_score,
    penalty_score = excluded.penalty_score,
    final_score = excluded.final_score,
    shipped_on_time_rate = excluded.shipped_on_time_rate,
    cancel_rate = excluded.cancel_rate,
    return_rate = excluded.return_rate,
    avg_rating = excluded.avg_rating,
    low_stock_rate = excluded.low_stock_rate,
    compliance_ok = excluded.compliance_ok,
    score_window_days = excluded.score_window_days,
    stability_window_days = excluded.stability_window_days,
    exposure_tier = excluded.exposure_tier,
    eligible_featured = excluded.eligible_featured,
    computed_at = excluded.computed_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

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
      count(*) filter (where lower(coalesce(ae.type, '')) in ('view_product', 'product_view', 'view_item'))::numeric as pdp_views,
      count(*) filter (where lower(coalesce(ae.type, '')) in ('click_product', 'product_click', 'select_product', 'select_item', 'view_product'))::numeric as clicks,
      count(*) filter (where lower(coalesce(ae.type, '')) in ('impression', 'product_impression', 'search_impression', 'view_catalog', 'view_home'))::numeric as impressions
    from public.analytics_events ae
    where ae.product_id is not null
      and ae.created_at >= now() - interval '30 days'
    group by ae.product_id
  ),
  sales as (
    select
      oi.product_id,
      sum(greatest(coalesce(oi.quantity, 1), 1))::numeric as sold_qty,
      sum(
        case
          when lower(coalesce(so.status, '')) in ('returned', 'refunded', 'return_received', 'exchanged')
            then greatest(coalesce(oi.quantity, 1), 1)
          else 0
        end
      )::numeric as returned_qty
    from public.order_items oi
    left join public.seller_orders so on so.id = oi.seller_order_id
    left join public.orders o on o.id = oi.order_id
    where coalesce(oi.created_at, o.created_at, now()) >= now() - interval '30 days'
    group by oi.product_id
  ),
  rating_by_product as (
    select r.product_id, avg(r.rating)::numeric as avg_rating
    from (
      select pr.product_id, pr.rating::numeric as rating
      from public.product_reviews pr
      where pr.created_at >= now() - interval '90 days'
      union all
      select rv.product_id, rv.rating::numeric as rating
      from public.reviews rv
      where rv.created_at >= now() - interval '90 days'
    ) r
    group by r.product_id
  ),
  rates as (
    select
      pb.product_id,
      pb.seller_id,
      pb.category_key,
      pb.content_completion_rate,
      coalesce(em.pdp_views, 0)::numeric as pdp_views,
      coalesce(em.clicks, 0)::numeric as clicks,
      coalesce(em.impressions, 0)::numeric as impressions,
      coalesce(s.sold_qty, 0)::numeric as sold_qty,
      coalesce(s.returned_qty, 0)::numeric as returned_qty,
      coalesce(r.avg_rating, 0)::numeric as avg_rating,
      case
        when coalesce(em.pdp_views, 0) > 0 then coalesce(s.sold_qty, 0)::numeric / em.pdp_views
        else 0::numeric
      end as conversion_rate,
      case
        when coalesce(em.impressions, 0) > 0 then coalesce(em.clicks, 0)::numeric / em.impressions
        when coalesce(em.pdp_views, 0) > 0 then least(1::numeric, coalesce(em.clicks, 0)::numeric / nullif(em.pdp_views, 0))
        else 0::numeric
      end as ctr,
      case
        when coalesce(s.sold_qty, 0) > 0 then coalesce(s.returned_qty, 0)::numeric / s.sold_qty
        else 0::numeric
      end as return_rate
    from products_base pb
    left join event_metrics em on em.product_id = pb.product_id
    left join sales s on s.product_id = pb.product_id
    left join rating_by_product r on r.product_id = pb.product_id
  ),
  category_benchmark as (
    select
      category_key,
      avg(conversion_rate) filter (where pdp_views >= 20 and conversion_rate > 0) as conversion_benchmark,
      avg(ctr) filter (where (impressions >= 20 or pdp_views >= 20) and ctr > 0) as ctr_benchmark
    from rates
    group by category_key
  ),
  global_benchmark as (
    select
      coalesce(avg(conversion_rate) filter (where pdp_views >= 20 and conversion_rate > 0), 0.02::numeric) as conversion_benchmark,
      coalesce(avg(ctr) filter (where (impressions >= 20 or pdp_views >= 20) and ctr > 0), 0.05::numeric) as ctr_benchmark
    from rates
  )
  insert into public.product_metrics_30d (
    product_id,
    conversion_rate,
    conversion_index,
    ctr,
    ctr_index,
    avg_rating,
    return_rate,
    content_completion_rate,
    computed_at
  )
  select
    rt.product_id,
    round(rt.conversion_rate, 4) as conversion_rate,
    round(
      rt.conversion_rate
      /
      greatest(coalesce(cb.conversion_benchmark, gb.conversion_benchmark, 0.02::numeric), 0.0001::numeric),
      4
    ) as conversion_index,
    round(rt.ctr, 4) as ctr,
    round(
      rt.ctr
      /
      greatest(coalesce(cb.ctr_benchmark, gb.ctr_benchmark, 0.05::numeric), 0.0001::numeric),
      4
    ) as ctr_index,
    round(rt.avg_rating, 2) as avg_rating,
    round(rt.return_rate, 4) as return_rate,
    round(rt.content_completion_rate, 4) as content_completion_rate,
    now()
  from rates rt
  left join category_benchmark cb on cb.category_key = rt.category_key
  cross join global_benchmark gb
  on conflict (product_id) do update
  set
    conversion_rate = excluded.conversion_rate,
    conversion_index = excluded.conversion_index,
    ctr = excluded.ctr,
    ctr_index = excluded.ctr_index,
    avg_rating = excluded.avg_rating,
    return_rate = excluded.return_rate,
    content_completion_rate = excluded.content_completion_rate,
    computed_at = excluded.computed_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.refresh_product_scores()
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
      p.seller_id,
      lower(coalesce(p.status, '')) as product_status,
      coalesce(p.stock_quantity, 0) as stock_quantity,
      coalesce(m.conversion_rate, 0)::numeric as conversion_rate,
      coalesce(m.conversion_index, 1)::numeric as conversion_index,
      coalesce(m.ctr, 0)::numeric as ctr,
      coalesce(m.ctr_index, 1)::numeric as ctr_index,
      coalesce(m.avg_rating, 0)::numeric as avg_rating,
      coalesce(m.return_rate, 0)::numeric as return_rate,
      coalesce(m.content_completion_rate, 0)::numeric as content_completion_rate
    from public.products p
    left join public.product_metrics_30d m on m.product_id = p.id
  ),
  components as (
    select
      s.*,
      round(greatest(0::numeric, least(100::numeric, (s.conversion_index / 1.4) * 100)), 2) as conversion_score,
      round(greatest(0::numeric, least(100::numeric, (s.ctr_index / 1.4) * 100)), 2) as ctr_score,
      round(greatest(0::numeric, least(100::numeric, s.content_completion_rate * 100)), 2) as content_quality_score,
      round(greatest(0::numeric, least(100::numeric, ((s.avg_rating - 1) / 4) * 100)), 2) as rating_score,
      round(greatest(0::numeric, least(100::numeric, 100 - ((s.return_rate / 0.12) * 100))), 2) as return_score,
      case
        when s.stock_quantity > 5 then 100::numeric
        when s.stock_quantity > 0 then 40::numeric
        else 0::numeric
      end as stock_score
    from src s
  ),
  scored as (
    select
      c.*,
      round(
        (c.conversion_score * 0.30)
        + (c.ctr_score * 0.20)
        + (c.content_quality_score * 0.20)
        + (c.rating_score * 0.15)
        + (c.return_score * 0.10)
        + (c.stock_score * 0.05)
      , 2) as base_score,
      (
        case when c.stock_quantity <= 0 then 35 else 0 end
        + case when c.return_rate > 0.12 then 20 else 0 end
        + case when c.avg_rating > 0 and c.avg_rating < 3.8 then 12 else 0 end
        + case when c.content_completion_rate < 0.70 then 15 else 0 end
      )::numeric as penalty_score
    from components c
  ),
  finalized as (
    select
      s.*,
      round(greatest(0::numeric, least(100::numeric, s.base_score - s.penalty_score)), 2) as final_score
    from scored s
  )
  insert into public.product_scores (
    product_id,
    seller_id,
    conversion_score,
    ctr_score,
    content_quality_score,
    rating_score,
    return_score,
    stock_score,
    base_score,
    penalty_score,
    final_score,
    conversion_rate,
    ctr,
    avg_rating,
    return_rate,
    in_stock,
    content_completion_rate,
    eligible_search,
    eligible_featured,
    computed_at
  )
  select
    f.product_id,
    f.seller_id,
    f.conversion_score,
    f.ctr_score,
    f.content_quality_score,
    f.rating_score,
    f.return_score,
    f.stock_score,
    f.base_score,
    round(f.penalty_score, 2),
    f.final_score,
    round(f.conversion_rate, 4),
    round(f.ctr, 4),
    round(f.avg_rating, 2),
    round(f.return_rate, 4),
    (f.stock_quantity > 0) as in_stock,
    round(f.content_completion_rate, 4),
    (f.product_status = 'published' and f.stock_quantity > 0) as eligible_search,
    (
      f.product_status = 'published'
      and f.stock_quantity > 0
      and f.content_completion_rate >= 0.85
      and f.return_rate <= 0.06
      and f.final_score >= 80
    ) as eligible_featured,
    now()
  from finalized f
  on conflict (product_id) do update
  set
    seller_id = excluded.seller_id,
    conversion_score = excluded.conversion_score,
    ctr_score = excluded.ctr_score,
    content_quality_score = excluded.content_quality_score,
    rating_score = excluded.rating_score,
    return_score = excluded.return_score,
    stock_score = excluded.stock_score,
    base_score = excluded.base_score,
    penalty_score = excluded.penalty_score,
    final_score = excluded.final_score,
    conversion_rate = excluded.conversion_rate,
    ctr = excluded.ctr,
    avg_rating = excluded.avg_rating,
    return_rate = excluded.return_rate,
    in_stock = excluded.in_stock,
    content_completion_rate = excluded.content_completion_rate,
    eligible_search = excluded.eligible_search,
    eligible_featured = excluded.eligible_featured,
    computed_at = excluded.computed_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

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
begin
  if v_surface not in ('search', 'category', 'home', 'featured') then
    raise exception 'invalid_surface: %', v_surface;
  end if;

  with seller_commercial as (
    select
      sfs.seller_id,
      case
        when sum(greatest(coalesce(sfs.items_total_cents, 0) + coalesce(sfs.shipping_cents, 0), 0)) > 0
          then sum(coalesce(sfs.fee_cents, 0))::numeric
               /
               sum(greatest(coalesce(sfs.items_total_cents, 0) + coalesce(sfs.shipping_cents, 0), 0))::numeric
        else 0::numeric
      end as fee_ratio
    from public.seller_order_financial_snapshot sfs
    where sfs.created_at >= now() - interval '30 days'
    group by sfs.seller_id
  ),
  src as (
    select
      ps.product_id,
      ps.seller_id,
      ss.final_score as seller_score,
      ps.final_score as product_score,
      round(greatest(0::numeric, least(100::numeric, (coalesce(sc.fee_ratio, 0) / 0.15) * 100)), 2) as commercial_score,
      round(
        case
          when coalesce(nullif(btrim(p_context_key), ''), '') = '' then 50::numeric
          when lower(coalesce(p.category, '')) = lower(coalesce(p_context_key, '')) then 100::numeric
          when exists (
            select 1
            from unnest(coalesce(p.tags, '{}'::text[])) t
            where lower(t) = lower(coalesce(p_context_key, ''))
          ) then 90::numeric
          else 35::numeric
        end
      , 2) as context_score,
      round(
        coalesce(ps.penalty_score, 0)
        + case
            when ss.exposure_tier = 'restricted' then 25
            when ss.exposure_tier = 'warning' then 8
            else 0
          end
      , 2) as penalty_score
    from public.product_scores ps
    join public.seller_scores ss on ss.seller_id = ps.seller_id
    join public.products p on p.id = ps.product_id
    left join seller_commercial sc on sc.seller_id = ps.seller_id
    where
      case
        when v_surface = 'featured' then (ps.eligible_featured = true and ss.eligible_featured = true)
        else ps.eligible_search = true
      end
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
    computed_at
  )
  select
    s.product_id,
    s.seller_id,
    v_surface,
    nullif(btrim(p_context_key), ''),
    round(s.seller_score, 2),
    round(s.product_score, 2),
    s.commercial_score,
    s.context_score,
    s.penalty_score,
    round(
      greatest(
        0::numeric,
        ((s.product_score * 0.55) + (s.seller_score * 0.35) + (s.commercial_score * 0.05) + (s.context_score * 0.05))
        - s.penalty_score
      )
    , 2) as final_rank_score,
    now()
  from src s;

  get diagnostics v_rows = row_count;

  delete from public.product_ranking_snapshot
  where computed_at < now() - interval '30 days';

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
    where jobname in (
      'refresh_seller_scores_hourly',
      'refresh_product_metrics_30d_30m',
      'refresh_product_scores_hourly',
      'refresh_product_ranking_snapshot_hourly'
    )
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'refresh_seller_scores_hourly',
    '0 * * * *',
    'select public.refresh_seller_scores();'
  );

  perform cron.schedule(
    'refresh_product_metrics_30d_30m',
    '*/30 * * * *',
    'select public.refresh_product_metrics_30d();'
  );

  perform cron.schedule(
    'refresh_product_scores_hourly',
    '10 * * * *',
    'select public.refresh_product_scores();'
  );

  perform cron.schedule(
    'refresh_product_ranking_snapshot_hourly',
    '20 * * * *',
    'select public.refresh_product_ranking_snapshot(''search'', null);'
  );
end;
$$;

-- hardening + access control
alter table public.seller_scores enable row level security;
alter table public.product_metrics_30d enable row level security;
alter table public.product_scores enable row level security;
alter table public.product_ranking_snapshot enable row level security;

revoke all on table public.seller_scores from anon;
revoke all on table public.product_metrics_30d from anon;
revoke all on table public.product_scores from anon;
revoke all on table public.product_ranking_snapshot from anon;

grant select on table public.seller_scores to authenticated;
grant select on table public.product_metrics_30d to authenticated;
grant select on table public.product_scores to authenticated;
grant select on table public.product_ranking_snapshot to authenticated;

drop policy if exists seller_scores_select_scope on public.seller_scores;
create policy seller_scores_select_scope
on public.seller_scores
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_scores.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_scores_service_all on public.seller_scores;
create policy seller_scores_service_all
on public.seller_scores
for all
to service_role
using (true)
with check (true);

drop policy if exists product_metrics_30d_admin_select on public.product_metrics_30d;
create policy product_metrics_30d_admin_select
on public.product_metrics_30d
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists product_metrics_30d_service_all on public.product_metrics_30d;
create policy product_metrics_30d_service_all
on public.product_metrics_30d
for all
to service_role
using (true)
with check (true);

drop policy if exists product_scores_select_scope on public.product_scores;
create policy product_scores_select_scope
on public.product_scores
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = product_scores.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists product_scores_service_all on public.product_scores;
create policy product_scores_service_all
on public.product_scores
for all
to service_role
using (true)
with check (true);

drop policy if exists product_ranking_snapshot_select_scope on public.product_ranking_snapshot;
create policy product_ranking_snapshot_select_scope
on public.product_ranking_snapshot
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = product_ranking_snapshot.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists product_ranking_snapshot_service_all on public.product_ranking_snapshot;
create policy product_ranking_snapshot_service_all
on public.product_ranking_snapshot
for all
to service_role
using (true)
with check (true);

-- default grants for postgres-created future objects in this schema.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;
