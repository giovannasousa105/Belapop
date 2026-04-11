-- Phase 1: antifraud risk + T+1 reconciliation core
-- Safe to re-run.

-- =========================================================
-- Risk profile by seller (operational antifraud posture)
-- =========================================================

create table if not exists public.seller_risk_profiles (
  seller_id uuid primary key references public.sellers(id) on delete cascade,
  risk_score numeric(5,2) not null default 0,
  risk_tier text not null default 'low'
    check (risk_tier in ('low', 'medium', 'high', 'restricted')),
  holdback_bps integer not null default 0
    check (holdback_bps >= 0 and holdback_bps <= 10000),
  payouts_blocked boolean not null default false,
  cancel_rate_30d numeric(6,4) not null default 0,
  refund_rate_30d numeric(6,4) not null default 0,
  chargeback_rate_30d numeric(6,4) not null default 0,
  delayed_ship_rate_30d numeric(6,4) not null default 0,
  open_disputes_30d integer not null default 0,
  orders_30d integer not null default 0,
  computed_at timestamptz not null default now()
);

create index if not exists idx_seller_risk_profiles_tier_score
  on public.seller_risk_profiles (risk_tier, risk_score desc, computed_at desc);

create table if not exists public.seller_risk_signals (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  signal_type text not null,
  signal_date date not null default current_date,
  signal_value numeric(12,4) not null default 0,
  weight_bps integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (seller_id, signal_type, signal_date)
);

create index if not exists idx_seller_risk_signals_seller_date
  on public.seller_risk_signals (seller_id, signal_date desc);

-- =========================================================
-- Holdback primitives on payout batches
-- =========================================================

alter table if exists public.seller_payouts
  add column if not exists holdback_bps integer not null default 0,
  add column if not exists holdback_cents integer not null default 0,
  add column if not exists net_after_holdback_cents integer not null default 0,
  add column if not exists risk_tier text;

update public.seller_payouts
set
  holdback_bps = coalesce(holdback_bps, 0),
  holdback_cents = coalesce(holdback_cents, 0),
  net_after_holdback_cents = case
    when coalesce(net_after_holdback_cents, 0) = 0 then greatest(0, coalesce(net_payout_cents, 0) - coalesce(holdback_cents, 0))
    else net_after_holdback_cents
  end
where true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_seller_payout_holdback_nonneg'
      and conrelid = 'public.seller_payouts'::regclass
  ) then
    alter table public.seller_payouts
      add constraint chk_seller_payout_holdback_nonneg
      check (holdback_bps >= 0 and holdback_cents >= 0 and net_after_holdback_cents >= 0);
  end if;
end $$;

create table if not exists public.seller_holdbacks (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  seller_payout_id uuid references public.seller_payouts(id) on delete cascade,
  holdback_bps integer not null default 0
    check (holdback_bps >= 0 and holdback_bps <= 10000),
  gross_payout_cents integer not null default 0,
  holdback_cents integer not null default 0,
  net_after_holdback_cents integer not null default 0,
  reason text,
  status text not null default 'active'
    check (status in ('active', 'released', 'applied', 'cancelled')),
  release_after date,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seller_holdbacks_seller_status
  on public.seller_holdbacks (seller_id, status, created_at desc);

create unique index if not exists uq_seller_holdbacks_active_per_payout
  on public.seller_holdbacks (seller_payout_id)
  where seller_payout_id is not null and status in ('active', 'applied');

drop trigger if exists trg_seller_holdbacks_updated on public.seller_holdbacks;
create trigger trg_seller_holdbacks_updated
before update on public.seller_holdbacks
for each row execute function public.set_updated_at();

-- =========================================================
-- Reconciliation runs + automated alerts
-- =========================================================

create table if not exists public.gateway_reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  recon_date date not null,
  ledger_cash_in_cents bigint not null default 0,
  ledger_cash_out_cents bigint not null default 0,
  gateway_gross_cents bigint not null default 0,
  gateway_fees_cents bigint not null default 0,
  gateway_refunds_cents bigint not null default 0,
  gateway_chargebacks_cents bigint not null default 0,
  gateway_net_cents bigint not null default 0,
  payouts_paid_cents bigint not null default 0,
  delta_cash_in_vs_gateway_gross_cents bigint not null default 0,
  delta_ledger_net_vs_gateway_net_cents bigint not null default 0,
  delta_payout_vs_ledger_cash_out_cents bigint not null default 0,
  status text not null default 'ok'
    check (status in ('ok', 'warn', 'critical')),
  details jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  unique (provider, recon_date)
);

create index if not exists idx_gateway_recon_runs_date_status
  on public.gateway_reconciliation_runs (recon_date desc, status, provider);

create table if not exists public.finance_ops_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null,
  severity text not null default 'warn'
    check (severity in ('info', 'warn', 'critical')),
  seller_id uuid references public.sellers(id) on delete cascade,
  provider text,
  recon_date date,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  dedupe_key text unique,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_finance_ops_alerts_status_created
  on public.finance_ops_alerts (status, created_at desc);

-- =========================================================
-- Functions
-- =========================================================

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
      coalesce(d.open_disputes_30d, 0) as open_disputes_30d
    from base b
    left join so on so.seller_id = b.seller_id
    left join cb on cb.seller_id = b.seller_id
    left join disputes d on d.seller_id = b.seller_id
  ),
  scored as (
    select
      m.*,
      least(
        100::numeric,
        greatest(
          0::numeric,
          round(
            (m.cancel_rate_30d * 30)
            + (m.refund_rate_30d * 25)
            + (m.chargeback_rate_30d * 30)
            + (m.delayed_ship_rate_30d * 15)
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
      (s.risk_score >= 75 or s.chargeback_rate_30d >= 0.05) as payouts_blocked
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
      'orders_30d', srp.orders_30d
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
      and (
        sr.holdback_bps > 0
        or sr.payouts_blocked = true
      )
    order by sp.created_at asc
    limit greatest(1, least(coalesce(p_limit, 500), 5000))
  ),
  upsert_holdback as (
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
      c.seller_id,
      c.seller_payout_id,
      c.holdback_bps,
      c.gross_payout_cents,
      c.holdback_cents,
      greatest(0, c.gross_payout_cents + c.adjustments_cents - c.holdback_cents),
      case
        when c.payouts_blocked then 'risk_blocked'
        else 'risk_holdback'
      end,
      case
        when c.payouts_blocked then 'active'
        else 'active'
      end,
      current_date + 30,
      now()
    from candidate c
    on conflict (seller_payout_id) where seller_payout_id is not null and status in ('active', 'applied')
    do update
      set
        holdback_bps = excluded.holdback_bps,
        gross_payout_cents = excluded.gross_payout_cents,
        holdback_cents = excluded.holdback_cents,
        net_after_holdback_cents = excluded.net_after_holdback_cents,
        reason = excluded.reason,
        updated_at = now()
    returning seller_payout_id
  )
  update public.seller_payouts sp
  set
    holdback_bps = c.holdback_bps,
    holdback_cents = c.holdback_cents,
    risk_tier = c.risk_tier,
    net_after_holdback_cents = greatest(0, c.gross_payout_cents + c.adjustments_cents - c.holdback_cents),
    net_payout_cents = greatest(0, c.gross_payout_cents + c.adjustments_cents - c.holdback_cents),
    status = case when c.payouts_blocked then 'blocked' else sp.status end,
    updated_at = now()
  from candidate c
  where sp.id = c.seller_payout_id
    and exists (select 1 from upsert_holdback uh where uh.seller_payout_id = sp.id);

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.run_gateway_reconciliation_t1(
  p_recon_date date default (now()::date - 1),
  p_provider text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  with providers as (
    select distinct gs.provider
    from public.gateway_settlements gs
    where gs.settlement_date = p_recon_date
      and (p_provider is null or lower(gs.provider) = lower(p_provider))
    union
    select coalesce(nullif(btrim(p_provider), ''), 'unknown')
    where not exists (
      select 1
      from public.gateway_settlements gs2
      where gs2.settlement_date = p_recon_date
        and (p_provider is null or lower(gs2.provider) = lower(p_provider))
    )
  ),
  gateway_daily as (
    select
      p.provider,
      coalesce(sum(gs.gross_cents), 0)::bigint as gross_cents,
      coalesce(sum(gs.fees_cents), 0)::bigint as fees_cents,
      coalesce(sum(gs.refunds_cents), 0)::bigint as refunds_cents,
      coalesce(sum(gs.chargebacks_cents), 0)::bigint as chargebacks_cents,
      coalesce(sum(gs.net_cents), 0)::bigint as net_cents
    from providers p
    left join public.gateway_settlements gs
      on gs.provider = p.provider
      and gs.settlement_date = p_recon_date
    group by p.provider
  ),
  ledger_daily as (
    select
      coalesce(sum(le.debit_cents) filter (where le.account_code = 'cash_clearing'), 0)::bigint as ledger_cash_in_cents,
      coalesce(sum(le.credit_cents) filter (where le.account_code = 'cash_clearing'), 0)::bigint as ledger_cash_out_cents
    from public.ledger_entries le
    where le.occurred_at::date = p_recon_date
  ),
  payouts_daily as (
    select
      coalesce(sum(sp.net_payout_cents), 0)::bigint as payouts_paid_cents
    from public.seller_payouts sp
    where sp.status = 'paid'
      and sp.paid_at is not null
      and sp.paid_at::date = p_recon_date
  ),
  payload as (
    select
      gd.provider,
      p_recon_date as recon_date,
      ld.ledger_cash_in_cents,
      ld.ledger_cash_out_cents,
      gd.gross_cents as gateway_gross_cents,
      gd.fees_cents as gateway_fees_cents,
      gd.refunds_cents as gateway_refunds_cents,
      gd.chargebacks_cents as gateway_chargebacks_cents,
      gd.net_cents as gateway_net_cents,
      pd.payouts_paid_cents,
      (ld.ledger_cash_in_cents - gd.gross_cents)::bigint as delta_cash_in_vs_gateway_gross_cents,
      ((ld.ledger_cash_in_cents - ld.ledger_cash_out_cents) - gd.net_cents)::bigint as delta_ledger_net_vs_gateway_net_cents,
      (pd.payouts_paid_cents - ld.ledger_cash_out_cents)::bigint as delta_payout_vs_ledger_cash_out_cents
    from gateway_daily gd
    cross join ledger_daily ld
    cross join payouts_daily pd
  )
  insert into public.gateway_reconciliation_runs (
    provider,
    recon_date,
    ledger_cash_in_cents,
    ledger_cash_out_cents,
    gateway_gross_cents,
    gateway_fees_cents,
    gateway_refunds_cents,
    gateway_chargebacks_cents,
    gateway_net_cents,
    payouts_paid_cents,
    delta_cash_in_vs_gateway_gross_cents,
    delta_ledger_net_vs_gateway_net_cents,
    delta_payout_vs_ledger_cash_out_cents,
    status,
    details,
    computed_at
  )
  select
    p.provider,
    p.recon_date,
    p.ledger_cash_in_cents,
    p.ledger_cash_out_cents,
    p.gateway_gross_cents,
    p.gateway_fees_cents,
    p.gateway_refunds_cents,
    p.gateway_chargebacks_cents,
    p.gateway_net_cents,
    p.payouts_paid_cents,
    p.delta_cash_in_vs_gateway_gross_cents,
    p.delta_ledger_net_vs_gateway_net_cents,
    p.delta_payout_vs_ledger_cash_out_cents,
    case
      when greatest(
        abs(p.delta_cash_in_vs_gateway_gross_cents),
        abs(p.delta_ledger_net_vs_gateway_net_cents),
        abs(p.delta_payout_vs_ledger_cash_out_cents)
      ) >= 10000 then 'critical'
      when greatest(
        abs(p.delta_cash_in_vs_gateway_gross_cents),
        abs(p.delta_ledger_net_vs_gateway_net_cents),
        abs(p.delta_payout_vs_ledger_cash_out_cents)
      ) >= 3000 then 'warn'
      else 'ok'
    end as status,
    jsonb_build_object(
      'threshold_warn_cents', 3000,
      'threshold_critical_cents', 10000
    ),
    now()
  from payload p
  on conflict (provider, recon_date) do update
  set
    ledger_cash_in_cents = excluded.ledger_cash_in_cents,
    ledger_cash_out_cents = excluded.ledger_cash_out_cents,
    gateway_gross_cents = excluded.gateway_gross_cents,
    gateway_fees_cents = excluded.gateway_fees_cents,
    gateway_refunds_cents = excluded.gateway_refunds_cents,
    gateway_chargebacks_cents = excluded.gateway_chargebacks_cents,
    gateway_net_cents = excluded.gateway_net_cents,
    payouts_paid_cents = excluded.payouts_paid_cents,
    delta_cash_in_vs_gateway_gross_cents = excluded.delta_cash_in_vs_gateway_gross_cents,
    delta_ledger_net_vs_gateway_net_cents = excluded.delta_ledger_net_vs_gateway_net_cents,
    delta_payout_vs_ledger_cash_out_cents = excluded.delta_payout_vs_ledger_cash_out_cents,
    status = excluded.status,
    details = excluded.details,
    computed_at = excluded.computed_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.create_finance_ops_alerts_from_reconciliation(
  p_recon_date date default (now()::date - 1)
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
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
    'gateway_reconciliation',
    case when gr.status = 'critical' then 'critical' else 'warn' end,
    gr.provider,
    gr.recon_date,
    case
      when gr.status = 'critical' then 'Reconciliacao critica do gateway'
      else 'Reconciliacao com divergencia'
    end,
    format(
      'Provider %s em %s apresentou divergencia. Delta cash/gross=%s, ledgerNet/gatewayNet=%s, payout/cashOut=%s.',
      gr.provider,
      gr.recon_date::text,
      gr.delta_cash_in_vs_gateway_gross_cents::text,
      gr.delta_ledger_net_vs_gateway_net_cents::text,
      gr.delta_payout_vs_ledger_cash_out_cents::text
    ),
    jsonb_build_object(
      'provider', gr.provider,
      'recon_date', gr.recon_date,
      'status', gr.status,
      'delta_cash_in_vs_gateway_gross_cents', gr.delta_cash_in_vs_gateway_gross_cents,
      'delta_ledger_net_vs_gateway_net_cents', gr.delta_ledger_net_vs_gateway_net_cents,
      'delta_payout_vs_ledger_cash_out_cents', gr.delta_payout_vs_ledger_cash_out_cents
    ),
    md5('gateway_reconciliation:' || gr.provider || ':' || gr.recon_date::text),
    now()
  from public.gateway_reconciliation_runs gr
  where gr.recon_date = p_recon_date
    and gr.status in ('warn', 'critical')
  on conflict (dedupe_key) do update
  set
    severity = excluded.severity,
    title = excluded.title,
    body = excluded.body,
    payload = excluded.payload,
    status = 'open',
    resolved_at = null;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.create_finance_ops_alerts_from_risk(
  p_min_score numeric default 55
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  insert into public.finance_ops_alerts (
    alert_type,
    severity,
    seller_id,
    title,
    body,
    payload,
    dedupe_key,
    created_at
  )
  select
    'seller_risk_profile',
    case when sr.risk_tier = 'restricted' then 'critical' else 'warn' end,
    sr.seller_id,
    case
      when sr.risk_tier = 'restricted' then 'Seller em risco critico'
      else 'Seller com risco elevado'
    end,
    format(
      'Seller %s com score %.2f (%s), holdback=%s bps, payouts_blocked=%s.',
      sr.seller_id::text,
      sr.risk_score,
      sr.risk_tier,
      sr.holdback_bps::text,
      sr.payouts_blocked::text
    ),
    jsonb_build_object(
      'seller_id', sr.seller_id,
      'risk_score', sr.risk_score,
      'risk_tier', sr.risk_tier,
      'holdback_bps', sr.holdback_bps,
      'payouts_blocked', sr.payouts_blocked,
      'cancel_rate_30d', sr.cancel_rate_30d,
      'refund_rate_30d', sr.refund_rate_30d,
      'chargeback_rate_30d', sr.chargeback_rate_30d,
      'delayed_ship_rate_30d', sr.delayed_ship_rate_30d
    ),
    md5('seller_risk_profile:' || sr.seller_id::text || ':' || current_date::text),
    now()
  from public.seller_risk_profiles sr
  where sr.risk_score >= coalesce(p_min_score, 55)
  on conflict (dedupe_key) do update
  set
    severity = excluded.severity,
    title = excluded.title,
    body = excluded.body,
    payload = excluded.payload,
    status = 'open',
    resolved_at = null;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

-- =========================================================
-- Cron jobs
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
      'risk_refresh_hourly',
      'risk_holdback_apply_hourly',
      'gateway_reconciliation_t1_daily',
      'finance_ops_alerts_daily'
    )
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'risk_refresh_hourly',
    '5 * * * *',
    'select public.refresh_seller_risk_profiles(null::uuid, 30);'
  );

  perform cron.schedule(
    'risk_holdback_apply_hourly',
    '15 * * * *',
    'select public.apply_seller_holdback_to_scheduled_payouts(500, null::uuid);'
  );

  perform cron.schedule(
    'gateway_reconciliation_t1_daily',
    '10 2 * * *',
    'select public.run_gateway_reconciliation_t1((now()::date - 1), null);'
  );

  perform cron.schedule(
    'finance_ops_alerts_daily',
    '20 2 * * *',
    'select public.create_finance_ops_alerts_from_reconciliation((now()::date - 1));'
  );
end;
$$;

-- =========================================================
-- RLS / Grants
-- =========================================================

alter table public.seller_risk_profiles enable row level security;
alter table public.seller_risk_signals enable row level security;
alter table public.seller_holdbacks enable row level security;
alter table public.gateway_reconciliation_runs enable row level security;
alter table public.finance_ops_alerts enable row level security;

drop policy if exists seller_risk_profiles_select_scope on public.seller_risk_profiles;
create policy seller_risk_profiles_select_scope
on public.seller_risk_profiles
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_risk_profiles.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_risk_profiles_service_all on public.seller_risk_profiles;
create policy seller_risk_profiles_service_all
on public.seller_risk_profiles
for all
to service_role
using (true)
with check (true);

drop policy if exists seller_risk_signals_select_scope on public.seller_risk_signals;
create policy seller_risk_signals_select_scope
on public.seller_risk_signals
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_risk_signals.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_risk_signals_service_all on public.seller_risk_signals;
create policy seller_risk_signals_service_all
on public.seller_risk_signals
for all
to service_role
using (true)
with check (true);

drop policy if exists seller_holdbacks_select_scope on public.seller_holdbacks;
create policy seller_holdbacks_select_scope
on public.seller_holdbacks
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_holdbacks.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_holdbacks_service_all on public.seller_holdbacks;
create policy seller_holdbacks_service_all
on public.seller_holdbacks
for all
to service_role
using (true)
with check (true);

drop policy if exists gateway_reconciliation_runs_admin_select on public.gateway_reconciliation_runs;
create policy gateway_reconciliation_runs_admin_select
on public.gateway_reconciliation_runs
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists gateway_reconciliation_runs_service_all on public.gateway_reconciliation_runs;
create policy gateway_reconciliation_runs_service_all
on public.gateway_reconciliation_runs
for all
to service_role
using (true)
with check (true);

drop policy if exists finance_ops_alerts_admin_select on public.finance_ops_alerts;
create policy finance_ops_alerts_admin_select
on public.finance_ops_alerts
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists finance_ops_alerts_service_all on public.finance_ops_alerts;
create policy finance_ops_alerts_service_all
on public.finance_ops_alerts
for all
to service_role
using (true)
with check (true);

revoke all on public.seller_risk_profiles from anon;
revoke all on public.seller_risk_signals from anon;
revoke all on public.seller_holdbacks from anon;
revoke all on public.gateway_reconciliation_runs from anon;
revoke all on public.finance_ops_alerts from anon;

grant select on public.seller_risk_profiles to authenticated;
grant select on public.seller_risk_signals to authenticated;
grant select on public.seller_holdbacks to authenticated;
grant select on public.gateway_reconciliation_runs to authenticated;
grant select on public.finance_ops_alerts to authenticated;

grant all on public.seller_risk_profiles to service_role;
grant all on public.seller_risk_signals to service_role;
grant all on public.seller_holdbacks to service_role;
grant all on public.gateway_reconciliation_runs to service_role;
grant all on public.finance_ops_alerts to service_role;

grant execute on function public.refresh_seller_risk_profiles(uuid, integer) to service_role;
grant execute on function public.apply_seller_holdback_to_scheduled_payouts(integer, uuid) to service_role;
grant execute on function public.run_gateway_reconciliation_t1(date, text) to service_role;
grant execute on function public.create_finance_ops_alerts_from_reconciliation(date) to service_role;
grant execute on function public.create_finance_ops_alerts_from_risk(numeric) to service_role;

-- Initial compute
select public.refresh_seller_risk_profiles(null::uuid, 30);
select public.apply_seller_holdback_to_scheduled_payouts(500, null::uuid);
select public.run_gateway_reconciliation_t1((now()::date - 1), null);
select public.create_finance_ops_alerts_from_reconciliation((now()::date - 1));
select public.create_finance_ops_alerts_from_risk(55);
