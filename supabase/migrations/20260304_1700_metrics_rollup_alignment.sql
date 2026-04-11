alter table public.marketplace_events
  add column if not exists idempotency_key text;

create unique index if not exists uq_events_idempotency_key
  on public.marketplace_events (idempotency_key)
  where idempotency_key is not null;

alter table public.metrics_marketplace_day
  add column if not exists bucket_date date;

update public.metrics_marketplace_day
set bucket_date = (bucket_ts at time zone 'America/Sao_Paulo')::date
where bucket_date is null;

create index if not exists idx_metrics_day_bucket_date_desc
  on public.metrics_marketplace_day (bucket_date desc);

create unique index if not exists uq_metrics_day_bucket_date_channel_store
  on public.metrics_marketplace_day (bucket_date, channel, store_id);

create or replace function public.refresh_marketplace_metrics_hour(
  p_target_hour timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anchor timestamptz := date_trunc('hour', coalesce(p_target_hour, now()));
  v_start timestamptz := v_anchor - interval '1 hour';
  v_end timestamptz := v_anchor;
  v_lock_key bigint := 987654322;
  v_has_lock boolean := false;
begin
  select pg_try_advisory_lock(v_lock_key) into v_has_lock;
  if not coalesce(v_has_lock, false) then
    return;
  end if;

  delete from public.metrics_marketplace_hour
  where bucket_ts >= v_start
    and bucket_ts <= v_end;

  insert into public.metrics_marketplace_hour (
    bucket_ts, channel, store_id,
    gmv_cents, orders, orders_paid, cancels,
    refunds_cents, refunds_count,
    chargeback_cents, chargeback_count,
    cancel_rate_bps, updated_at
  )
  select
    date_trunc('hour', m.bucket_ts) as bucket_ts,
    m.channel,
    m.store_id,
    sum(coalesce(m.gmv_cents, 0))::bigint as gmv_cents,
    sum(coalesce(m.orders, 0))::int as orders,
    sum(coalesce(m.orders_paid, m.orders, 0))::int as orders_paid,
    sum(coalesce(m.cancels, 0))::int as cancels,
    sum(coalesce(m.refunds_cents, 0))::bigint as refunds_cents,
    sum(coalesce(m.refunds_count, 0))::int as refunds_count,
    sum(coalesce(m.chargeback_cents, 0))::bigint as chargeback_cents,
    sum(coalesce(m.chargeback_count, 0))::int as chargeback_count,
    case
      when sum(coalesce(m.orders_paid, m.orders, 0)) = 0 then 0
      else least(
        10000,
        greatest(
          0,
          (sum(coalesce(m.cancels, 0)) * 10000 / sum(coalesce(m.orders_paid, m.orders, 0)))
        )
      )
    end as cancel_rate_bps,
    now() as updated_at
  from public.metrics_marketplace_minute m
  where m.bucket_ts >= v_start
    and m.bucket_ts < v_end + interval '1 hour'
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

create or replace function public.refresh_marketplace_metrics_day(
  p_target_day timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anchor_date date := (coalesce(p_target_day, now()) at time zone 'America/Sao_Paulo')::date;
  v_start_date date := v_anchor_date - 1;
  v_end_date date := v_anchor_date;
  v_lock_key bigint := 987654323;
  v_has_lock boolean := false;
begin
  select pg_try_advisory_lock(v_lock_key) into v_has_lock;
  if not coalesce(v_has_lock, false) then
    return;
  end if;

  delete from public.metrics_marketplace_day
  where bucket_date >= v_start_date
    and bucket_date <= v_end_date;

  insert into public.metrics_marketplace_day (
    bucket_date, bucket_ts, channel, store_id,
    gmv_cents, orders, orders_paid, cancels,
    refunds_cents, refunds_count,
    chargeback_cents, chargeback_count,
    cancel_rate_bps, updated_at
  )
  select
    (h.bucket_ts at time zone 'America/Sao_Paulo')::date as bucket_date,
    (((h.bucket_ts at time zone 'America/Sao_Paulo')::date)::timestamp at time zone 'America/Sao_Paulo') as bucket_ts,
    h.channel,
    h.store_id,
    sum(coalesce(h.gmv_cents, 0))::bigint as gmv_cents,
    sum(coalesce(h.orders, 0))::int as orders,
    sum(coalesce(h.orders_paid, h.orders, 0))::int as orders_paid,
    sum(coalesce(h.cancels, 0))::int as cancels,
    sum(coalesce(h.refunds_cents, 0))::bigint as refunds_cents,
    sum(coalesce(h.refunds_count, 0))::int as refunds_count,
    sum(coalesce(h.chargeback_cents, 0))::bigint as chargeback_cents,
    sum(coalesce(h.chargeback_count, 0))::int as chargeback_count,
    case
      when sum(coalesce(h.orders_paid, h.orders, 0)) = 0 then 0
      else least(
        10000,
        greatest(
          0,
          (sum(coalesce(h.cancels, 0)) * 10000 / sum(coalesce(h.orders_paid, h.orders, 0)))
        )
      )
    end as cancel_rate_bps,
    now() as updated_at
  from public.metrics_marketplace_hour h
  where (h.bucket_ts at time zone 'America/Sao_Paulo')::date >= v_start_date
    and (h.bucket_ts at time zone 'America/Sao_Paulo')::date <= v_end_date
  group by 1, 2, 3, 4
  on conflict (bucket_ts, channel, store_id)
  do update set
    bucket_date = excluded.bucket_date,
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
