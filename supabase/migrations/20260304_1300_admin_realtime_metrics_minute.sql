-- Realtime executive metrics (minute buckets) for admin dashboard
-- - Supports windows 3h/6h with bucket aggregation on read
-- - Supports global scope and per-seller scope

create table if not exists public.metrics_marketplace_minute (
  bucket_ts timestamptz not null,
  channel text not null default 'all',
  store_id uuid not null default '00000000-0000-0000-0000-000000000000',
  gmv_cents bigint not null default 0,
  orders integer not null default 0,
  cancels integer not null default 0,
  cancel_rate_bps integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint metrics_marketplace_minute_pkey primary key (bucket_ts, channel, store_id),
  constraint metrics_marketplace_minute_nonnegative check (
    gmv_cents >= 0 and orders >= 0 and cancels >= 0 and cancel_rate_bps >= 0
  )
);

create index if not exists idx_metrics_minute_bucket_desc
  on public.metrics_marketplace_minute (bucket_ts desc);

create index if not exists idx_metrics_minute_store_bucket_desc
  on public.metrics_marketplace_minute (store_id, bucket_ts desc);

create index if not exists idx_metrics_minute_channel_bucket_desc
  on public.metrics_marketplace_minute (channel, bucket_ts desc);

-- Minute refresh job entrypoint:
-- select public.refresh_marketplace_metrics_minute();
-- select public.refresh_marketplace_metrics_minute(date_trunc('minute', now()) - interval '1 minute');
create or replace function public.refresh_marketplace_metrics_minute(
  p_target_minute timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz := date_trunc('minute', coalesce(p_target_minute, now() - interval '1 minute'));
begin
  -- Global scope (all channels + all stores)
  with paid as (
    select
      coalesce(sum(coalesce(o.total_cents, o.total_order_cents, 0)), 0)::bigint as gmv_cents,
      count(*)::int as orders
    from public.orders o
    where o.created_at >= v_bucket
      and o.created_at < v_bucket + interval '1 minute'
      and lower(coalesce(o.status, '')) in ('paid', 'processing', 'shipped', 'delivered', 'fulfilled')
  ),
  canceled as (
    select
      count(*)::int as cancels
    from public.orders o
    where o.created_at >= v_bucket
      and o.created_at < v_bucket + interval '1 minute'
      and lower(coalesce(o.status, '')) in ('canceled', 'cancelled', 'refunded')
  ),
  merged as (
    select
      v_bucket as bucket_ts,
      'all'::text as channel,
      '00000000-0000-0000-0000-000000000000'::uuid as store_id,
      p.gmv_cents,
      p.orders,
      c.cancels
    from paid p
    cross join canceled c
  )
  insert into public.metrics_marketplace_minute (
    bucket_ts, channel, store_id, gmv_cents, orders, cancels, cancel_rate_bps, updated_at
  )
  select
    m.bucket_ts,
    m.channel,
    m.store_id,
    m.gmv_cents,
    m.orders,
    m.cancels,
    case
      when m.orders <= 0 then 0
      else least(10000, greatest(0, (m.cancels * 10000) / m.orders))
    end as cancel_rate_bps,
    now()
  from merged m
  on conflict (bucket_ts, channel, store_id)
  do update set
    gmv_cents = excluded.gmv_cents,
    orders = excluded.orders,
    cancels = excluded.cancels,
    cancel_rate_bps = excluded.cancel_rate_bps,
    updated_at = now();

  -- Per store scope (seller-level)
  with paid as (
    select
      so.seller_id as store_id,
      coalesce(sum(coalesce(so.product_total_cents, 0) + coalesce(so.shipping_total_cents, 0)), 0)::bigint as gmv_cents,
      count(*)::int as orders
    from public.sub_orders so
    where so.created_at >= v_bucket
      and so.created_at < v_bucket + interval '1 minute'
      and lower(coalesce(so.status, '')) in ('paid', 'awaiting_shipment', 'shipped', 'delivered', 'fulfilled')
    group by so.seller_id
  ),
  canceled as (
    select
      so.seller_id as store_id,
      count(*)::int as cancels
    from public.sub_orders so
    where so.created_at >= v_bucket
      and so.created_at < v_bucket + interval '1 minute'
      and lower(coalesce(so.status, '')) in ('canceled', 'cancelled', 'refunded')
    group by so.seller_id
  ),
  merged as (
    select
      v_bucket as bucket_ts,
      'all'::text as channel,
      coalesce(p.store_id, c.store_id) as store_id,
      coalesce(p.gmv_cents, 0)::bigint as gmv_cents,
      coalesce(p.orders, 0)::int as orders,
      coalesce(c.cancels, 0)::int as cancels
    from paid p
    full join canceled c
      on c.store_id = p.store_id
  )
  insert into public.metrics_marketplace_minute (
    bucket_ts, channel, store_id, gmv_cents, orders, cancels, cancel_rate_bps, updated_at
  )
  select
    m.bucket_ts,
    m.channel,
    m.store_id,
    m.gmv_cents,
    m.orders,
    m.cancels,
    case
      when m.orders <= 0 then 0
      else least(10000, greatest(0, (m.cancels * 10000) / m.orders))
    end as cancel_rate_bps,
    now()
  from merged m
  where m.store_id is not null
  on conflict (bucket_ts, channel, store_id)
  do update set
    gmv_cents = excluded.gmv_cents,
    orders = excluded.orders,
    cancels = excluded.cancels,
    cancel_rate_bps = excluded.cancel_rate_bps,
    updated_at = now();
end;
$$;

grant execute on function public.refresh_marketplace_metrics_minute(timestamptz)
to authenticated, service_role;
