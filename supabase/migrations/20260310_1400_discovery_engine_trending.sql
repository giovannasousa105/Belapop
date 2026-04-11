-- Discovery engine: trending materialization for personalized recommendations.
-- Safe to re-run.

create table if not exists public.product_trending (
  product_id uuid primary key references public.products(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  views_24h integer not null default 0,
  favorites_24h integer not null default 0,
  carts_24h integer not null default 0,
  purchases_24h integer not null default 0,
  trend_score numeric(7,2) not null default 0,
  updated_at timestamptz not null default now(),

  constraint product_trending_trend_score_range
    check (trend_score >= 0 and trend_score <= 100)
);

create index if not exists idx_product_trending_score
  on public.product_trending (trend_score desc, updated_at desc);

create index if not exists idx_product_trending_seller
  on public.product_trending (seller_id, trend_score desc);

create or replace function public.refresh_product_trending(
  p_window_hours integer default 24
)
returns integer
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_rows integer := 0;
  v_window_hours integer := greatest(1, least(coalesce(p_window_hours, 24), 168));
begin
  with event_counts as (
    select
      ae.product_id,
      count(*) filter (
        where lower(coalesce(ae.type, '')) in ('view_product', 'product_view', 'view_item')
      )::integer as views_24h,
      count(*) filter (
        where lower(coalesce(ae.type, '')) = 'favorite'
      )::integer as favorites_24h,
      count(*) filter (
        where lower(coalesce(ae.type, '')) = 'add_to_cart'
      )::integer as carts_24h
    from public.analytics_events ae
    where ae.product_id is not null
      and ae.created_at >= now() - make_interval(hours => v_window_hours)
    group by ae.product_id
  ),
  sales_counts as (
    select
      oi.product_id,
      count(distinct oi.order_id)::integer as purchases_24h
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where coalesce(oi.created_at, o.created_at, now()) >= now() - make_interval(hours => v_window_hours)
      and (
        lower(coalesce(o.payment_status, '')) in ('paid', 'approved', 'succeeded', 'completed')
        or lower(coalesce(o.status, '')) in ('paid', 'fulfilled', 'completed', 'delivered')
      )
    group by oi.product_id
  ),
  base as (
    select
      p.id as product_id,
      p.seller_id,
      coalesce(ec.views_24h, 0) as views_24h,
      coalesce(ec.favorites_24h, 0) as favorites_24h,
      coalesce(ec.carts_24h, 0) as carts_24h,
      coalesce(sc.purchases_24h, 0) as purchases_24h
    from public.products p
    left join event_counts ec on ec.product_id = p.id
    left join sales_counts sc on sc.product_id = p.id
    where lower(coalesce(p.status, '')) in ('active', 'published')
  ),
  maxima as (
    select
      greatest(max(b.views_24h), 1) as max_views,
      greatest(max(b.favorites_24h), 1) as max_favorites,
      greatest(max(b.carts_24h), 1) as max_carts,
      greatest(max(b.purchases_24h), 1) as max_purchases
    from base b
  )
  insert into public.product_trending (
    product_id,
    seller_id,
    views_24h,
    favorites_24h,
    carts_24h,
    purchases_24h,
    trend_score,
    updated_at
  )
  select
    b.product_id,
    b.seller_id,
    b.views_24h,
    b.favorites_24h,
    b.carts_24h,
    b.purchases_24h,
    round(
      greatest(
        0::numeric,
        least(
          100::numeric,
          ((b.views_24h::numeric / m.max_views::numeric) * 30::numeric)
          + ((b.favorites_24h::numeric / m.max_favorites::numeric) * 20::numeric)
          + ((b.carts_24h::numeric / m.max_carts::numeric) * 20::numeric)
          + ((b.purchases_24h::numeric / m.max_purchases::numeric) * 30::numeric)
        )
      ),
      2
    ) as trend_score,
    now()
  from base b
  cross join maxima m
  on conflict (product_id) do update
  set
    seller_id = excluded.seller_id,
    views_24h = excluded.views_24h,
    favorites_24h = excluded.favorites_24h,
    carts_24h = excluded.carts_24h,
    purchases_24h = excluded.purchases_24h,
    trend_score = excluded.trend_score,
    updated_at = excluded.updated_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

alter table public.product_trending enable row level security;

revoke all on table public.product_trending from anon;
grant select on table public.product_trending to authenticated;
grant all on table public.product_trending to service_role;

drop policy if exists product_trending_select_authenticated on public.product_trending;
create policy product_trending_select_authenticated
on public.product_trending
for select
to authenticated
using (true);

drop policy if exists product_trending_service_all on public.product_trending;
create policy product_trending_service_all
on public.product_trending
for all
to service_role
using (true)
with check (true);

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
    where jobname in ('refresh_product_trending_15m')
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'refresh_product_trending_15m',
    '*/15 * * * *',
    'select public.refresh_product_trending(24);'
  );
end;
$$;

select public.refresh_product_trending(24);
