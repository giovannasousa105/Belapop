create extension if not exists pgcrypto;

create table if not exists public.marketplace_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_name text,
  occurred_at timestamptz not null,
  channel text null,
  store_id uuid null,
  order_id uuid null,
  amount_cents bigint null,
  currency text not null default 'BRL',
  external_ref text null,
  idempotency_key text null,
  source text null,
  provider text null,
  ingestion_status text null,
  error_code text null,
  error_message text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.marketplace_events add column if not exists event_name text;
alter table public.marketplace_events add column if not exists currency text;
alter table public.marketplace_events add column if not exists external_ref text;
alter table public.marketplace_events add column if not exists idempotency_key text;
alter table public.marketplace_events add column if not exists source text;
alter table public.marketplace_events add column if not exists provider text;
alter table public.marketplace_events add column if not exists ingestion_status text;
alter table public.marketplace_events add column if not exists error_code text;
alter table public.marketplace_events add column if not exists error_message text;
alter table public.marketplace_events add column if not exists metadata jsonb;

update public.marketplace_events
set event_name = event_type
where event_name is null;

update public.marketplace_events
set currency = 'BRL'
where currency is null;

update public.marketplace_events
set metadata = '{}'::jsonb
where metadata is null;

update public.marketplace_events
set source = coalesce(source, 'system'),
    ingestion_status = coalesce(ingestion_status, 'processed')
where source is null or ingestion_status is null;

update public.marketplace_events
set event_type = case
  when event_name like 'order_%' then 'order'
  when event_name like 'payment_%' then 'payment'
  when event_name like 'refund_%' then 'finance'
  when event_name like 'payout_%' then 'finance'
  when event_name like 'chargeback_%' then 'risk'
  else coalesce(nullif(event_type, ''), 'order')
end
where event_type is null
   or event_type not in ('order', 'payment', 'risk', 'finance');

alter table public.marketplace_events alter column event_name set not null;
alter table public.marketplace_events alter column currency set default 'BRL';
alter table public.marketplace_events alter column currency set not null;
alter table public.marketplace_events alter column metadata set default '{}'::jsonb;
alter table public.marketplace_events alter column metadata set not null;
alter table public.marketplace_events alter column ingestion_status set default 'processed';

update public.marketplace_events
set ingestion_status = 'processed'
where ingestion_status is null;

alter table public.marketplace_events alter column ingestion_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_events_ingestion_status_check'
      and conrelid = 'public.marketplace_events'::regclass
  ) then
    alter table public.marketplace_events
      add constraint marketplace_events_ingestion_status_check
      check (ingestion_status in ('received', 'processed', 'failed'));
  end if;
end;
$$;

create index if not exists idx_events_occurred_at_desc
  on public.marketplace_events (occurred_at desc);

create index if not exists idx_events_name_occurred_at_desc
  on public.marketplace_events (event_name, occurred_at desc);

create index if not exists idx_events_type_occurred_at_desc
  on public.marketplace_events (event_type, occurred_at desc);

create index if not exists idx_events_store_occurred_at_desc
  on public.marketplace_events (store_id, occurred_at desc);

create index if not exists idx_events_channel_occurred_at_desc
  on public.marketplace_events (channel, occurred_at desc);

drop index if exists public.uq_marketplace_events_order_terminal;
drop index if exists public.uq_events_external_ref_name;

create unique index if not exists uq_events_order_event_name
  on public.marketplace_events (order_id, event_name)
  where order_id is not null;

create unique index if not exists uq_events_external_ref_event_name
  on public.marketplace_events (external_ref, event_name)
  where external_ref is not null;

create unique index if not exists uq_events_idempotency_key
  on public.marketplace_events (idempotency_key)
  where idempotency_key is not null;

create table if not exists public.metrics_marketplace_minute (
  bucket_ts timestamptz not null,
  channel text not null default 'all',
  store_id uuid not null default '00000000-0000-0000-0000-000000000000',
  gmv_cents bigint not null default 0,
  orders integer not null default 0,
  orders_paid integer not null default 0,
  cancels integer not null default 0,
  refunds_cents bigint not null default 0,
  refunds_count integer not null default 0,
  chargeback_cents bigint not null default 0,
  chargeback_count integer not null default 0,
  cancel_rate_bps integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint metrics_marketplace_minute_pkey primary key (bucket_ts, channel, store_id)
);

create table if not exists public.metrics_marketplace_hour (
  bucket_ts timestamptz not null,
  channel text not null default 'all',
  store_id uuid not null default '00000000-0000-0000-0000-000000000000',
  gmv_cents bigint not null default 0,
  orders integer not null default 0,
  orders_paid integer not null default 0,
  cancels integer not null default 0,
  refunds_cents bigint not null default 0,
  refunds_count integer not null default 0,
  chargeback_cents bigint not null default 0,
  chargeback_count integer not null default 0,
  cancel_rate_bps integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint metrics_marketplace_hour_pkey primary key (bucket_ts, channel, store_id)
);

create table if not exists public.metrics_marketplace_day (
  bucket_ts timestamptz not null,
  channel text not null default 'all',
  store_id uuid not null default '00000000-0000-0000-0000-000000000000',
  gmv_cents bigint not null default 0,
  orders integer not null default 0,
  orders_paid integer not null default 0,
  cancels integer not null default 0,
  refunds_cents bigint not null default 0,
  refunds_count integer not null default 0,
  chargeback_cents bigint not null default 0,
  chargeback_count integer not null default 0,
  cancel_rate_bps integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint metrics_marketplace_day_pkey primary key (bucket_ts, channel, store_id)
);

alter table public.metrics_marketplace_minute add column if not exists orders integer not null default 0;
alter table public.metrics_marketplace_minute add column if not exists orders_paid integer not null default 0;
alter table public.metrics_marketplace_minute add column if not exists refunds_cents bigint not null default 0;
alter table public.metrics_marketplace_minute add column if not exists refunds_count integer not null default 0;
alter table public.metrics_marketplace_minute add column if not exists chargeback_cents bigint not null default 0;
alter table public.metrics_marketplace_minute add column if not exists chargeback_count integer not null default 0;

update public.metrics_marketplace_minute
set orders_paid = orders
where orders_paid = 0
  and orders > 0;

create index if not exists idx_metrics_minute_bucket_desc
  on public.metrics_marketplace_minute (bucket_ts desc);

create index if not exists idx_metrics_minute_store_bucket_desc
  on public.metrics_marketplace_minute (store_id, bucket_ts desc);

create index if not exists idx_metrics_minute_channel_bucket_desc
  on public.metrics_marketplace_minute (channel, bucket_ts desc);

create index if not exists idx_metrics_hour_bucket_desc
  on public.metrics_marketplace_hour (bucket_ts desc);

create index if not exists idx_metrics_hour_store_bucket_desc
  on public.metrics_marketplace_hour (store_id, bucket_ts desc);

create index if not exists idx_metrics_hour_channel_bucket_desc
  on public.metrics_marketplace_hour (channel, bucket_ts desc);

create index if not exists idx_metrics_day_bucket_desc
  on public.metrics_marketplace_day (bucket_ts desc);

create index if not exists idx_metrics_day_store_bucket_desc
  on public.metrics_marketplace_day (store_id, bucket_ts desc);

create index if not exists idx_metrics_day_channel_bucket_desc
  on public.metrics_marketplace_day (channel, bucket_ts desc);

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
  v_default_store uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  v_lock_key bigint := 987654321;
  v_has_lock boolean := false;
begin
  select pg_try_advisory_lock(v_lock_key) into v_has_lock;
  if not coalesce(v_has_lock, false) then
    return;
  end if;

  delete from public.metrics_marketplace_minute where bucket_ts = v_bucket;

  insert into public.metrics_marketplace_minute (
    bucket_ts, channel, store_id,
    gmv_cents, orders, orders_paid, cancels,
    refunds_cents, refunds_count,
    chargeback_cents, chargeback_count,
    cancel_rate_bps, updated_at
  )
  select
    v_bucket as bucket_ts,
    coalesce(e.channel, 'all') as channel,
    coalesce(e.store_id, v_default_store) as store_id,
    coalesce(sum(case when e.event_name = 'order_paid' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as gmv_cents,
    count(*) filter (where e.event_name = 'order_paid')::int as orders,
    count(*) filter (where e.event_name = 'order_paid')::int as orders_paid,
    count(*) filter (where e.event_name = 'order_canceled')::int as cancels,
    coalesce(sum(case when e.event_name = 'refund_settled' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as refunds_cents,
    count(*) filter (where e.event_name = 'refund_settled')::int as refunds_count,
    coalesce(sum(case when e.event_name = 'chargeback_opened' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as chargeback_cents,
    count(*) filter (where e.event_name = 'chargeback_opened')::int as chargeback_count,
    case
      when count(*) filter (where e.event_name = 'order_paid') = 0 then 0
      else least(10000, greatest(0, (count(*) filter (where e.event_name = 'order_canceled') * 10000 / (count(*) filter (where e.event_name = 'order_paid')))))
    end as cancel_rate_bps,
    now() as updated_at
  from public.marketplace_events e
  where e.occurred_at >= v_bucket
    and e.occurred_at < v_bucket + interval '1 minute'
    and coalesce(e.ingestion_status, 'processed') = 'processed'
  group by 2, 3
  on conflict (bucket_ts, channel, store_id)
  do update set
    gmv_cents = excluded.gmv_cents,
    orders = excluded.orders,
    orders_paid = excluded.orders_paid,
    cancels = excluded.cancels,
    refunds_cents = excluded.refunds_cents,
    refunds_count = excluded.refunds_count,
    chargeback_cents = excluded.chargeback_cents,
    chargeback_count = excluded.chargeback_count,
    cancel_rate_bps = excluded.cancel_rate_bps,
    updated_at = now();

  perform pg_advisory_unlock(v_lock_key);
exception
  when others then
    if coalesce(v_has_lock, false) then
      perform pg_advisory_unlock(v_lock_key);
    end if;
    raise;
end;
$$;

create or replace function public.refresh_marketplace_metrics_hour(
  p_target_hour timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz := date_trunc('hour', coalesce(p_target_hour, now() - interval '1 hour'));
  v_default_store uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  v_lock_key bigint := 987654322;
  v_has_lock boolean := false;
begin
  select pg_try_advisory_lock(v_lock_key) into v_has_lock;
  if not coalesce(v_has_lock, false) then
    return;
  end if;

  delete from public.metrics_marketplace_hour where bucket_ts = v_bucket;

  insert into public.metrics_marketplace_hour (
    bucket_ts, channel, store_id,
    gmv_cents, orders, orders_paid, cancels,
    refunds_cents, refunds_count,
    chargeback_cents, chargeback_count,
    cancel_rate_bps, updated_at
  )
  select
    v_bucket as bucket_ts,
    coalesce(e.channel, 'all') as channel,
    coalesce(e.store_id, v_default_store) as store_id,
    coalesce(sum(case when e.event_name = 'order_paid' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as gmv_cents,
    count(*) filter (where e.event_name = 'order_paid')::int as orders,
    count(*) filter (where e.event_name = 'order_paid')::int as orders_paid,
    count(*) filter (where e.event_name = 'order_canceled')::int as cancels,
    coalesce(sum(case when e.event_name = 'refund_settled' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as refunds_cents,
    count(*) filter (where e.event_name = 'refund_settled')::int as refunds_count,
    coalesce(sum(case when e.event_name = 'chargeback_opened' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as chargeback_cents,
    count(*) filter (where e.event_name = 'chargeback_opened')::int as chargeback_count,
    case
      when count(*) filter (where e.event_name = 'order_paid') = 0 then 0
      else least(10000, greatest(0, (count(*) filter (where e.event_name = 'order_canceled') * 10000 / (count(*) filter (where e.event_name = 'order_paid')))))
    end as cancel_rate_bps,
    now() as updated_at
  from public.marketplace_events e
  where e.occurred_at >= v_bucket
    and e.occurred_at < v_bucket + interval '1 hour'
    and coalesce(e.ingestion_status, 'processed') = 'processed'
  group by 2, 3
  on conflict (bucket_ts, channel, store_id)
  do update set
    gmv_cents = excluded.gmv_cents,
    orders = excluded.orders,
    orders_paid = excluded.orders_paid,
    cancels = excluded.cancels,
    refunds_cents = excluded.refunds_cents,
    refunds_count = excluded.refunds_count,
    chargeback_cents = excluded.chargeback_cents,
    chargeback_count = excluded.chargeback_count,
    cancel_rate_bps = excluded.cancel_rate_bps,
    updated_at = now();

  perform pg_advisory_unlock(v_lock_key);
exception
  when others then
    if coalesce(v_has_lock, false) then
      perform pg_advisory_unlock(v_lock_key);
    end if;
    raise;
end;
$$;

create or replace function public.refresh_marketplace_metrics_day(
  p_target_day timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz := date_trunc('day', coalesce(p_target_day, now() - interval '1 day'));
  v_default_store uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  v_lock_key bigint := 987654323;
  v_has_lock boolean := false;
begin
  select pg_try_advisory_lock(v_lock_key) into v_has_lock;
  if not coalesce(v_has_lock, false) then
    return;
  end if;

  delete from public.metrics_marketplace_day where bucket_ts = v_bucket;

  insert into public.metrics_marketplace_day (
    bucket_ts, channel, store_id,
    gmv_cents, orders, orders_paid, cancels,
    refunds_cents, refunds_count,
    chargeback_cents, chargeback_count,
    cancel_rate_bps, updated_at
  )
  select
    v_bucket as bucket_ts,
    coalesce(e.channel, 'all') as channel,
    coalesce(e.store_id, v_default_store) as store_id,
    coalesce(sum(case when e.event_name = 'order_paid' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as gmv_cents,
    count(*) filter (where e.event_name = 'order_paid')::int as orders,
    count(*) filter (where e.event_name = 'order_paid')::int as orders_paid,
    count(*) filter (where e.event_name = 'order_canceled')::int as cancels,
    coalesce(sum(case when e.event_name = 'refund_settled' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as refunds_cents,
    count(*) filter (where e.event_name = 'refund_settled')::int as refunds_count,
    coalesce(sum(case when e.event_name = 'chargeback_opened' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as chargeback_cents,
    count(*) filter (where e.event_name = 'chargeback_opened')::int as chargeback_count,
    case
      when count(*) filter (where e.event_name = 'order_paid') = 0 then 0
      else least(10000, greatest(0, (count(*) filter (where e.event_name = 'order_canceled') * 10000 / (count(*) filter (where e.event_name = 'order_paid')))))
    end as cancel_rate_bps,
    now() as updated_at
  from public.marketplace_events e
  where e.occurred_at >= v_bucket
    and e.occurred_at < v_bucket + interval '1 day'
    and coalesce(e.ingestion_status, 'processed') = 'processed'
  group by 2, 3
  on conflict (bucket_ts, channel, store_id)
  do update set
    gmv_cents = excluded.gmv_cents,
    orders = excluded.orders,
    orders_paid = excluded.orders_paid,
    cancels = excluded.cancels,
    refunds_cents = excluded.refunds_cents,
    refunds_count = excluded.refunds_count,
    chargeback_cents = excluded.chargeback_cents,
    chargeback_count = excluded.chargeback_count,
    cancel_rate_bps = excluded.cancel_rate_bps,
    updated_at = now();

  perform pg_advisory_unlock(v_lock_key);
exception
  when others then
    if coalesce(v_has_lock, false) then
      perform pg_advisory_unlock(v_lock_key);
    end if;
    raise;
end;
$$;

create or replace function public.backfill_marketplace_metrics(
  p_from timestamptz,
  p_to timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_minute timestamptz := date_trunc('minute', p_from);
  v_to_minute timestamptz := date_trunc('minute', p_to);
  v_from_hour timestamptz := date_trunc('hour', p_from);
  v_to_hour timestamptz := date_trunc('hour', p_to);
  v_from_day timestamptz := date_trunc('day', p_from);
  v_to_day timestamptz := date_trunc('day', p_to);
  v_default_store uuid := '00000000-0000-0000-0000-000000000000'::uuid;
  v_lock_key bigint := 987654324;
  v_has_lock boolean := false;
begin
  if p_to < p_from then
    raise exception 'p_to must be >= p_from';
  end if;

  select pg_try_advisory_lock(v_lock_key) into v_has_lock;
  if not coalesce(v_has_lock, false) then
    return;
  end if;

  delete from public.metrics_marketplace_minute
  where bucket_ts >= v_from_minute
    and bucket_ts <= v_to_minute;

  delete from public.metrics_marketplace_hour
  where bucket_ts >= v_from_hour
    and bucket_ts <= v_to_hour;

  delete from public.metrics_marketplace_day
  where bucket_ts >= v_from_day
    and bucket_ts <= v_to_day;

  insert into public.metrics_marketplace_minute (
    bucket_ts, channel, store_id,
    gmv_cents, orders, orders_paid, cancels,
    refunds_cents, refunds_count,
    chargeback_cents, chargeback_count,
    cancel_rate_bps, updated_at
  )
  select
    date_trunc('minute', e.occurred_at) as bucket_ts,
    coalesce(e.channel, 'all') as channel,
    coalesce(e.store_id, v_default_store) as store_id,
    coalesce(sum(case when e.event_name = 'order_paid' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as gmv_cents,
    count(*) filter (where e.event_name = 'order_paid')::int as orders,
    count(*) filter (where e.event_name = 'order_paid')::int as orders_paid,
    count(*) filter (where e.event_name = 'order_canceled')::int as cancels,
    coalesce(sum(case when e.event_name = 'refund_settled' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as refunds_cents,
    count(*) filter (where e.event_name = 'refund_settled')::int as refunds_count,
    coalesce(sum(case when e.event_name = 'chargeback_opened' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as chargeback_cents,
    count(*) filter (where e.event_name = 'chargeback_opened')::int as chargeback_count,
    case
      when count(*) filter (where e.event_name = 'order_paid') = 0 then 0
      else least(10000, greatest(0, (count(*) filter (where e.event_name = 'order_canceled') * 10000 / (count(*) filter (where e.event_name = 'order_paid')))))
    end as cancel_rate_bps,
    now() as updated_at
  from public.marketplace_events e
  where e.occurred_at >= v_from_minute
    and e.occurred_at < v_to_minute + interval '1 minute'
    and coalesce(e.ingestion_status, 'processed') = 'processed'
  group by 1, 2, 3
  on conflict (bucket_ts, channel, store_id)
  do update set
    gmv_cents = excluded.gmv_cents,
    orders = excluded.orders,
    orders_paid = excluded.orders_paid,
    cancels = excluded.cancels,
    refunds_cents = excluded.refunds_cents,
    refunds_count = excluded.refunds_count,
    chargeback_cents = excluded.chargeback_cents,
    chargeback_count = excluded.chargeback_count,
    cancel_rate_bps = excluded.cancel_rate_bps,
    updated_at = now();

  insert into public.metrics_marketplace_hour (
    bucket_ts, channel, store_id,
    gmv_cents, orders, orders_paid, cancels,
    refunds_cents, refunds_count,
    chargeback_cents, chargeback_count,
    cancel_rate_bps, updated_at
  )
  select
    date_trunc('hour', e.occurred_at) as bucket_ts,
    coalesce(e.channel, 'all') as channel,
    coalesce(e.store_id, v_default_store) as store_id,
    coalesce(sum(case when e.event_name = 'order_paid' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as gmv_cents,
    count(*) filter (where e.event_name = 'order_paid')::int as orders,
    count(*) filter (where e.event_name = 'order_paid')::int as orders_paid,
    count(*) filter (where e.event_name = 'order_canceled')::int as cancels,
    coalesce(sum(case when e.event_name = 'refund_settled' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as refunds_cents,
    count(*) filter (where e.event_name = 'refund_settled')::int as refunds_count,
    coalesce(sum(case when e.event_name = 'chargeback_opened' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as chargeback_cents,
    count(*) filter (where e.event_name = 'chargeback_opened')::int as chargeback_count,
    case
      when count(*) filter (where e.event_name = 'order_paid') = 0 then 0
      else least(10000, greatest(0, (count(*) filter (where e.event_name = 'order_canceled') * 10000 / (count(*) filter (where e.event_name = 'order_paid')))))
    end as cancel_rate_bps,
    now() as updated_at
  from public.marketplace_events e
  where e.occurred_at >= v_from_hour
    and e.occurred_at < v_to_hour + interval '1 hour'
    and coalesce(e.ingestion_status, 'processed') = 'processed'
  group by 1, 2, 3
  on conflict (bucket_ts, channel, store_id)
  do update set
    gmv_cents = excluded.gmv_cents,
    orders = excluded.orders,
    orders_paid = excluded.orders_paid,
    cancels = excluded.cancels,
    refunds_cents = excluded.refunds_cents,
    refunds_count = excluded.refunds_count,
    chargeback_cents = excluded.chargeback_cents,
    chargeback_count = excluded.chargeback_count,
    cancel_rate_bps = excluded.cancel_rate_bps,
    updated_at = now();

  insert into public.metrics_marketplace_day (
    bucket_ts, channel, store_id,
    gmv_cents, orders, orders_paid, cancels,
    refunds_cents, refunds_count,
    chargeback_cents, chargeback_count,
    cancel_rate_bps, updated_at
  )
  select
    date_trunc('day', e.occurred_at) as bucket_ts,
    coalesce(e.channel, 'all') as channel,
    coalesce(e.store_id, v_default_store) as store_id,
    coalesce(sum(case when e.event_name = 'order_paid' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as gmv_cents,
    count(*) filter (where e.event_name = 'order_paid')::int as orders,
    count(*) filter (where e.event_name = 'order_paid')::int as orders_paid,
    count(*) filter (where e.event_name = 'order_canceled')::int as cancels,
    coalesce(sum(case when e.event_name = 'refund_settled' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as refunds_cents,
    count(*) filter (where e.event_name = 'refund_settled')::int as refunds_count,
    coalesce(sum(case when e.event_name = 'chargeback_opened' then coalesce(e.amount_cents, 0) else 0 end), 0)::bigint as chargeback_cents,
    count(*) filter (where e.event_name = 'chargeback_opened')::int as chargeback_count,
    case
      when count(*) filter (where e.event_name = 'order_paid') = 0 then 0
      else least(10000, greatest(0, (count(*) filter (where e.event_name = 'order_canceled') * 10000 / (count(*) filter (where e.event_name = 'order_paid')))))
    end as cancel_rate_bps,
    now() as updated_at
  from public.marketplace_events e
  where e.occurred_at >= v_from_day
    and e.occurred_at < v_to_day + interval '1 day'
    and coalesce(e.ingestion_status, 'processed') = 'processed'
  group by 1, 2, 3
  on conflict (bucket_ts, channel, store_id)
  do update set
    gmv_cents = excluded.gmv_cents,
    orders = excluded.orders,
    orders_paid = excluded.orders_paid,
    cancels = excluded.cancels,
    refunds_cents = excluded.refunds_cents,
    refunds_count = excluded.refunds_count,
    chargeback_cents = excluded.chargeback_cents,
    chargeback_count = excluded.chargeback_count,
    cancel_rate_bps = excluded.cancel_rate_bps,
    updated_at = now();

  perform pg_advisory_unlock(v_lock_key);
exception
  when others then
    if coalesce(v_has_lock, false) then
      perform pg_advisory_unlock(v_lock_key);
    end if;
    raise;
end;
$$;

create or replace function public.prune_marketplace_metrics_retention(
  p_now timestamptz default now(),
  p_minute_days integer default 90,
  p_hour_days integer default 365,
  p_day_days integer default 3650
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_minute bigint := 0;
  v_deleted_hour bigint := 0;
  v_deleted_day bigint := 0;
begin
  delete from public.metrics_marketplace_minute
  where bucket_ts < p_now - make_interval(days => p_minute_days);
  get diagnostics v_deleted_minute = row_count;

  delete from public.metrics_marketplace_hour
  where bucket_ts < p_now - make_interval(days => p_hour_days);
  get diagnostics v_deleted_hour = row_count;

  delete from public.metrics_marketplace_day
  where bucket_ts < p_now - make_interval(days => p_day_days);
  get diagnostics v_deleted_day = row_count;

  return jsonb_build_object(
    'deleted_minute', v_deleted_minute,
    'deleted_hour', v_deleted_hour,
    'deleted_day', v_deleted_day,
    'executed_at', now()
  );
end;
$$;

grant execute on function public.refresh_marketplace_metrics_minute(timestamptz)
  to authenticated, service_role;
grant execute on function public.refresh_marketplace_metrics_hour(timestamptz)
  to authenticated, service_role;
grant execute on function public.refresh_marketplace_metrics_day(timestamptz)
  to authenticated, service_role;
grant execute on function public.backfill_marketplace_metrics(timestamptz, timestamptz)
  to authenticated, service_role;
grant execute on function public.prune_marketplace_metrics_retention(timestamptz, integer, integer, integer)
  to authenticated, service_role;