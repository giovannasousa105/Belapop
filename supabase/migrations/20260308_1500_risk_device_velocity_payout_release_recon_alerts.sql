-- Phase 2: antifraud device/velocity + payout release automation + provider critical reconciliation alerts
-- Safe to re-run.

alter table if exists public.seller_risk_profiles
  add column if not exists device_risk_30d numeric(6,4) not null default 0,
  add column if not exists velocity_risk_30d numeric(6,4) not null default 0;

create index if not exists idx_seller_risk_profiles_device_velocity
  on public.seller_risk_profiles (payouts_blocked, risk_tier, device_risk_30d desc, velocity_risk_30d desc);

create or replace function public.refresh_seller_risk_profiles(
  p_seller_id uuid default null,
  p_window_days integer default 30
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_days integer := greatest(7, least(coalesce(p_window_days, 30), 180));
begin
  with base as (
    select s.id as seller_id
    from public.sellers s
    where p_seller_id is null or s.id = p_seller_id
  ),
  so as (
    select
      b.seller_id,
      count(so.id)::int as orders_30d,
      avg(case when lower(coalesce(so.status, '')) in ('cancelled', 'canceled') then 1.0 else 0.0 end)::numeric as cancel_rate_30d,
      avg(case when lower(coalesce(so.status, '')) in ('returned', 'refunded', 'return_requested', 'return_in_transit', 'return_received') then 1.0 else 0.0 end)::numeric as refund_rate_30d,
      avg(
        case
          when lower(coalesce(so.status, '')) in ('shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed')
            then case
              when so.ship_by_at is not null and coalesce(so.shipped_at, now()) > so.ship_by_at then 1.0
              else 0.0
            end
          else 0.0
        end
      )::numeric as delayed_ship_rate_30d
    from base b
    left join public.seller_orders so
      on so.seller_id = b.seller_id
      and so.created_at >= now() - make_interval(days => v_days)
    group by b.seller_id
  ),
  cb as (
    select
      b.seller_id,
      count(me.id)::int as chargeback_count
    from base b
    left join public.marketplace_events me
      on me.store_id = b.seller_id
      and me.event_name = 'chargeback_opened'
      and me.occurred_at >= now() - make_interval(days => v_days)
      and coalesce(me.ingestion_status, 'processed') = 'processed'
    group by b.seller_id
  ),
  disputes as (
    select
      b.seller_id,
      count(st.id)::int as open_disputes_30d
    from base b
    left join public.support_tickets st
      on st.store_id = b.seller_id
      and st.created_at >= now() - make_interval(days => v_days)
      and upper(coalesce(st.status, '')) in ('OPEN', 'WAITING_STORE', 'WAITING_CUSTOMER', 'IN_REVIEW', 'ESCALATED')
    group by b.seller_id
  ),
  device_events as (
    select
      b.seller_id,
      me.order_id,
      me.event_name,
      coalesce(
        nullif(btrim(me.metadata->>'device_id'), ''),
        nullif(btrim(me.metadata->>'device_fingerprint'), ''),
        nullif(btrim(me.metadata->>'fingerprint'), ''),
        nullif(btrim(me.metadata->>'session_id'), ''),
        nullif(btrim(me.metadata->>'ip_address'), ''),
        nullif(btrim(me.metadata->>'ip'), ''),
        nullif(btrim(me.metadata->>'customer_device_id'), '')
      ) as device_key
    from base b
    left join public.marketplace_events me
      on me.store_id = b.seller_id
      and me.occurred_at >= now() - make_interval(days => v_days)
      and coalesce(me.ingestion_status, 'processed') = 'processed'
      and me.event_name in ('order_paid', 'payment.approved', 'payment_approved', 'chargeback_opened')
  ),
  device_by_key as (
    select
      de.seller_id,
      de.device_key,
      count(*)::int as events_count,
      count(distinct de.order_id)::int as orders_count,
      count(*) filter (where de.event_name = 'chargeback_opened')::int as chargeback_events
    from device_events de
    where de.device_key is not null
    group by de.seller_id, de.device_key
  ),
  device_cross_seller as (
    select
      de.device_key,
      count(distinct de.seller_id)::int as sellers_count
    from device_events de
    where de.device_key is not null
    group by de.device_key
  ),
  device_agg as (
    select
      b.seller_id,
      coalesce(sum(dbk.events_count), 0)::int as device_events,
      coalesce(sum(case when dbk.orders_count >= 3 then dbk.events_count else 0 end), 0)::int as suspicious_device_events,
      coalesce(sum(case when dbk.chargeback_events > 0 and dbk.orders_count >= 2 then dbk.events_count else 0 end), 0)::int as chargeback_device_events,
      coalesce(sum(case when dcs.sellers_count >= 2 then dbk.events_count else 0 end), 0)::int as cross_seller_device_events
    from base b
    left join device_by_key dbk on dbk.seller_id = b.seller_id
    left join device_cross_seller dcs on dcs.device_key = dbk.device_key
    group by b.seller_id
  ),
  velocity_hour as (
    select
      b.seller_id,
      date_trunc('hour', me.occurred_at) as hour_bucket,
      count(*)::int as orders_per_hour
    from base b
    left join public.marketplace_events me
      on me.store_id = b.seller_id
      and me.event_name = 'order_paid'
      and me.occurred_at >= now() - make_interval(days => v_days)
      and coalesce(me.ingestion_status, 'processed') = 'processed'
    group by b.seller_id, date_trunc('hour', me.occurred_at)
  ),
  velocity_minute as (
    select
      b.seller_id,
      date_trunc('minute', me.occurred_at) as minute_bucket,
      count(*)::int as orders_per_minute
    from base b
    left join public.marketplace_events me
      on me.store_id = b.seller_id
      and me.event_name = 'order_paid'
      and me.occurred_at >= now() - make_interval(days => v_days)
      and coalesce(me.ingestion_status, 'processed') = 'processed'
    group by b.seller_id, date_trunc('minute', me.occurred_at)
  ),
  velocity_agg as (
    select
      b.seller_id,
      coalesce(max(vh.orders_per_hour), 0)::int as max_orders_per_hour,
      coalesce(max(vm.orders_per_minute), 0)::int as max_orders_per_minute
    from base b
    left join velocity_hour vh on vh.seller_id = b.seller_id
    left join velocity_minute vm on vm.seller_id = b.seller_id
    group by b.seller_id
  ),
  merged as (
    select
      b.seller_id,
      coalesce(so.orders_30d, 0) as orders_30d,
      round(coalesce(so.cancel_rate_30d, 0), 4) as cancel_rate_30d,
      round(coalesce(so.refund_rate_30d, 0), 4) as refund_rate_30d,
      round(coalesce(so.delayed_ship_rate_30d, 0), 4) as delayed_ship_rate_30d,
      coalesce(cb.chargeback_count, 0) as chargeback_count,
      round(
        case
          when coalesce(so.orders_30d, 0) > 0
            then coalesce(cb.chargeback_count, 0)::numeric / so.orders_30d::numeric
          else 0::numeric
        end
      , 4) as chargeback_rate_30d,
      coalesce(d.open_disputes_30d, 0) as open_disputes_30d,
      coalesce(da.device_events, 0) as device_events,
      coalesce(da.suspicious_device_events, 0) as suspicious_device_events,
      coalesce(da.chargeback_device_events, 0) as chargeback_device_events,
      coalesce(da.cross_seller_device_events, 0) as cross_seller_device_events,
      round(
        case
          when coalesce(da.device_events, 0) > 0
            then least(
              1::numeric,
              greatest(
                0::numeric,
                (
                  (coalesce(da.suspicious_device_events, 0)::numeric * 0.45)
                  + (coalesce(da.cross_seller_device_events, 0)::numeric * 0.35)
                  + (coalesce(da.chargeback_device_events, 0)::numeric * 0.60)
                ) / da.device_events::numeric
              )
            )
          else 0::numeric
        end
      , 4) as device_risk_30d,
      coalesce(va.max_orders_per_hour, 0) as max_orders_per_hour,
      coalesce(va.max_orders_per_minute, 0) as max_orders_per_minute,
      round(
        case
          when coalesce(so.orders_30d, 0) <= 0 then 0::numeric
          else least(
            1::numeric,
            greatest(
              0::numeric,
              (
                (greatest(0, coalesce(va.max_orders_per_hour, 0) - 3)::numeric / 24::numeric) * 0.75
              ) +
              (
                (greatest(0, coalesce(va.max_orders_per_minute, 0) - 1)::numeric / 8::numeric) * 0.25
              ) +
              (
                least(1::numeric, coalesce(va.max_orders_per_hour, 0)::numeric / greatest(so.orders_30d::numeric, 1::numeric)) * 0.35
              )
            )
          )
        end
      , 4) as velocity_risk_30d
    from base b
    left join so on so.seller_id = b.seller_id
    left join cb on cb.seller_id = b.seller_id
    left join disputes d on d.seller_id = b.seller_id
    left join device_agg da on da.seller_id = b.seller_id
    left join velocity_agg va on va.seller_id = b.seller_id
  ),
  scored as (
    select
      m.*,
      least(
        100::numeric,
        greatest(
          0::numeric,
          round(
            (m.cancel_rate_30d * 28)
            + (m.refund_rate_30d * 22)
            + (m.chargeback_rate_30d * 30)
            + (m.delayed_ship_rate_30d * 12)
            + (m.device_risk_30d * 12)
            + (m.velocity_risk_30d * 8)
            + least(m.open_disputes_30d::numeric, 10)
          , 2)
        )
      ) as risk_score
    from merged m
  ),
  final as (
    select
      s.*,
      case
        when s.risk_score >= 75 then 'restricted'
        when s.risk_score >= 55 then 'high'
        when s.risk_score >= 30 then 'medium'
        else 'low'
      end as risk_tier,
      case
        when s.risk_score >= 75 then 3000
        when s.risk_score >= 55 then 1500
        when s.risk_score >= 30 then 500
        else 0
      end as holdback_bps,
      (
        s.risk_score >= 75
        or s.chargeback_rate_30d >= 0.05
        or s.device_risk_30d >= 0.70
        or s.velocity_risk_30d >= 0.80
      ) as payouts_blocked
    from scored s
  )
  insert into public.seller_risk_profiles (
    seller_id,
    risk_score,
    risk_tier,
    holdback_bps,
    payouts_blocked,
    cancel_rate_30d,
    refund_rate_30d,
    chargeback_rate_30d,
    delayed_ship_rate_30d,
    open_disputes_30d,
    orders_30d,
    device_risk_30d,
    velocity_risk_30d,
    computed_at
  )
  select
    f.seller_id,
    f.risk_score,
    f.risk_tier,
    f.holdback_bps,
    f.payouts_blocked,
    f.cancel_rate_30d,
    f.refund_rate_30d,
    f.chargeback_rate_30d,
    f.delayed_ship_rate_30d,
    f.open_disputes_30d,
    f.orders_30d,
    f.device_risk_30d,
    f.velocity_risk_30d,
    now()
  from final f
  on conflict (seller_id) do update
  set
    risk_score = excluded.risk_score,
    risk_tier = excluded.risk_tier,
    holdback_bps = excluded.holdback_bps,
    payouts_blocked = excluded.payouts_blocked,
    cancel_rate_30d = excluded.cancel_rate_30d,
    refund_rate_30d = excluded.refund_rate_30d,
    chargeback_rate_30d = excluded.chargeback_rate_30d,
    delayed_ship_rate_30d = excluded.delayed_ship_rate_30d,
    open_disputes_30d = excluded.open_disputes_30d,
    orders_30d = excluded.orders_30d,
    device_risk_30d = excluded.device_risk_30d,
    velocity_risk_30d = excluded.velocity_risk_30d,
    computed_at = excluded.computed_at;

  get diagnostics v_rows = row_count;

  insert into public.seller_risk_signals (
    seller_id,
    signal_type,
    signal_date,
    signal_value,
    weight_bps,
    payload
  )
  select
    srp.seller_id,
    'seller_risk_score_daily',
    current_date,
    srp.risk_score,
    srp.holdback_bps,
    jsonb_build_object(
      'risk_tier', srp.risk_tier,
      'payouts_blocked', srp.payouts_blocked,
      'cancel_rate_30d', srp.cancel_rate_30d,
      'refund_rate_30d', srp.refund_rate_30d,
      'chargeback_rate_30d', srp.chargeback_rate_30d,
      'delayed_ship_rate_30d', srp.delayed_ship_rate_30d,
      'open_disputes_30d', srp.open_disputes_30d,
      'orders_30d', srp.orders_30d,
      'device_risk_30d', srp.device_risk_30d,
      'velocity_risk_30d', srp.velocity_risk_30d
    )
  from public.seller_risk_profiles srp
  where p_seller_id is null or srp.seller_id = p_seller_id
  on conflict (seller_id, signal_type, signal_date) do update
  set
    signal_value = excluded.signal_value,
    weight_bps = excluded.weight_bps,
    payload = excluded.payload;

  insert into public.seller_risk_signals (
    seller_id,
    signal_type,
    signal_date,
    signal_value,
    weight_bps,
    payload
  )
  select
    srp.seller_id,
    'seller_device_risk_daily',
    current_date,
    srp.device_risk_30d * 100,
    round(srp.device_risk_30d * 10000)::integer,
    jsonb_build_object(
      'device_risk_30d', srp.device_risk_30d,
      'risk_tier', srp.risk_tier,
      'payouts_blocked', srp.payouts_blocked
    )
  from public.seller_risk_profiles srp
  where p_seller_id is null or srp.seller_id = p_seller_id
  on conflict (seller_id, signal_type, signal_date) do update
  set
    signal_value = excluded.signal_value,
    weight_bps = excluded.weight_bps,
    payload = excluded.payload;

  insert into public.seller_risk_signals (
    seller_id,
    signal_type,
    signal_date,
    signal_value,
    weight_bps,
    payload
  )
  select
    srp.seller_id,
    'seller_velocity_risk_daily',
    current_date,
    srp.velocity_risk_30d * 100,
    round(srp.velocity_risk_30d * 10000)::integer,
    jsonb_build_object(
      'velocity_risk_30d', srp.velocity_risk_30d,
      'risk_tier', srp.risk_tier,
      'payouts_blocked', srp.payouts_blocked
    )
  from public.seller_risk_profiles srp
  where p_seller_id is null or srp.seller_id = p_seller_id
  on conflict (seller_id, signal_type, signal_date) do update
  set
    signal_value = excluded.signal_value,
    weight_bps = excluded.weight_bps,
    payload = excluded.payload;

  return v_rows;
end;
$$;

create or replace function public.apply_seller_holdback_to_scheduled_payouts(
  p_limit integer default 500,
  p_seller_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_release_rows integer := 0;
begin
  with candidate as (
    select
      sp.id as seller_payout_id,
      sp.seller_id,
      sp.gross_payout_cents,
      sp.adjustments_cents,
      sp.net_payout_cents,
      sr.risk_tier,
      sr.holdback_bps,
      sr.payouts_blocked,
      round(greatest(0, sp.gross_payout_cents) * (sr.holdback_bps::numeric / 10000::numeric))::integer as holdback_cents
    from public.seller_payouts sp
    join public.seller_risk_profiles sr on sr.seller_id = sp.seller_id
    where sp.status in ('scheduled', 'processing', 'blocked')
      and sp.paid_at is null
      and (p_seller_id is null or sp.seller_id = p_seller_id)
    order by sp.created_at asc
    limit greatest(1, least(coalesce(p_limit, 500), 5000))
  ),
  updated_payouts as (
    update public.seller_payouts sp
    set
      holdback_bps = c.holdback_bps,
      holdback_cents = c.holdback_cents,
      risk_tier = c.risk_tier,
      net_after_holdback_cents = greatest(0, c.gross_payout_cents + c.adjustments_cents - c.holdback_cents),
      net_payout_cents = greatest(0, c.gross_payout_cents + c.adjustments_cents - c.holdback_cents),
      status = case
        when c.payouts_blocked then 'blocked'
        when sp.status = 'blocked' and c.payouts_blocked = false then 'scheduled'
        else sp.status
      end,
      updated_at = now()
    from candidate c
    where sp.id = c.seller_payout_id
    returning
      sp.id as seller_payout_id,
      c.seller_id,
      c.risk_tier,
      c.holdback_bps,
      c.holdback_cents,
      c.payouts_blocked,
      c.gross_payout_cents,
      c.adjustments_cents
  ),
  upsert_holdbacks as (
    insert into public.seller_holdbacks (
      seller_id,
      seller_payout_id,
      holdback_bps,
      gross_payout_cents,
      holdback_cents,
      net_after_holdback_cents,
      reason,
      status,
      release_after,
      created_at
    )
    select
      u.seller_id,
      u.seller_payout_id,
      u.holdback_bps,
      u.gross_payout_cents,
      u.holdback_cents,
      greatest(0, u.gross_payout_cents + u.adjustments_cents - u.holdback_cents),
      case
        when u.payouts_blocked then 'risk_blocked'
        else 'risk_holdback'
      end,
      'active',
      current_date + 30,
      now()
    from updated_payouts u
    where u.holdback_bps > 0 or u.payouts_blocked = true
    on conflict (seller_payout_id) where seller_payout_id is not null and status in ('active', 'applied')
    do update
      set
        holdback_bps = excluded.holdback_bps,
        gross_payout_cents = excluded.gross_payout_cents,
        holdback_cents = excluded.holdback_cents,
        net_after_holdback_cents = excluded.net_after_holdback_cents,
        reason = excluded.reason,
        updated_at = now()
    returning id
  ),
  release_holdbacks as (
    update public.seller_holdbacks sh
    set
      status = 'released',
      reason = 'risk_released',
      released_at = now(),
      updated_at = now()
    from updated_payouts u
    where sh.seller_payout_id = u.seller_payout_id
      and sh.status = 'active'
      and coalesce(u.holdback_bps, 0) = 0
      and coalesce(u.payouts_blocked, false) = false
    returning sh.id
  )
  select
    coalesce((select count(*) from updated_payouts), 0),
    coalesce((select count(*) from release_holdbacks), 0)
  into
    v_rows,
    v_release_rows;

  return coalesce(v_rows, 0) + coalesce(v_release_rows, 0);
end;
$$;

create or replace function public.create_finance_ops_alerts_critical_provider_delta(
  p_recon_date date default (now()::date - 1),
  p_threshold_cents bigint default 10000
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_threshold bigint := greatest(coalesce(p_threshold_cents, 10000), 1);
begin
  insert into public.finance_ops_alerts (
    alert_type,
    severity,
    provider,
    recon_date,
    title,
    body,
    payload,
    dedupe_key,
    created_at
  )
  select
    'gateway_provider_delta_critical',
    'critical',
    gr.provider,
    gr.recon_date,
    'Delta critico por provider na reconciliacao T+1',
    format(
      'Provider %s em %s ultrapassou delta critico (%s cents). cash/gross=%s, ledgerNet/gatewayNet=%s, payout/cashOut=%s.',
      gr.provider,
      gr.recon_date::text,
      v_threshold::text,
      gr.delta_cash_in_vs_gateway_gross_cents::text,
      gr.delta_ledger_net_vs_gateway_net_cents::text,
      gr.delta_payout_vs_ledger_cash_out_cents::text
    ),
    jsonb_build_object(
      'provider', gr.provider,
      'recon_date', gr.recon_date,
      'status', gr.status,
      'critical_threshold_cents', v_threshold,
      'delta_cash_in_vs_gateway_gross_cents', gr.delta_cash_in_vs_gateway_gross_cents,
      'delta_ledger_net_vs_gateway_net_cents', gr.delta_ledger_net_vs_gateway_net_cents,
      'delta_payout_vs_ledger_cash_out_cents', gr.delta_payout_vs_ledger_cash_out_cents
    ),
    md5('gateway_provider_delta_critical:' || gr.provider || ':' || gr.recon_date::text || ':' || v_threshold::text),
    now()
  from public.gateway_reconciliation_runs gr
  where gr.recon_date = p_recon_date
    and greatest(
      abs(gr.delta_cash_in_vs_gateway_gross_cents),
      abs(gr.delta_ledger_net_vs_gateway_net_cents),
      abs(gr.delta_payout_vs_ledger_cash_out_cents)
    ) >= v_threshold
  on conflict (dedupe_key) do update
  set
    title = excluded.title,
    body = excluded.body,
    payload = excluded.payload,
    status = 'open',
    resolved_at = null,
    severity = 'critical';

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

grant execute on function public.create_finance_ops_alerts_critical_provider_delta(date, bigint) to service_role;

do $$
declare
  v_job_id bigint;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    for v_job_id in
      select jobid
      from cron.job
      where jobname = 'finance_ops_alerts_provider_critical_daily'
    loop
      perform cron.unschedule(v_job_id);
    end loop;

    perform cron.schedule(
      'finance_ops_alerts_provider_critical_daily',
      '22 2 * * *',
      'select public.create_finance_ops_alerts_critical_provider_delta((now()::date - 1), 10000);'
    );
  end if;
exception
  when others then
    null;
end;
$$;

-- Initial compute for new signals/alerts
select public.refresh_seller_risk_profiles(null::uuid, 30);
select public.apply_seller_holdback_to_scheduled_payouts(500, null::uuid);
select public.create_finance_ops_alerts_critical_provider_delta((now()::date - 1), 10000);
