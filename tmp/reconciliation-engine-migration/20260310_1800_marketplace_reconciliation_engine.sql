-- Marketplace Reconciliation Engine
-- Detailed intraday reconciliation on top of the existing T+1 gateway reconciliation core.
-- Safe to re-run.

create extension if not exists "pgcrypto";

-- =========================================================
-- Raw Stripe transactions (payment_intent granularity)
-- =========================================================

create table if not exists public.stripe_transactions (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  event_id text unique,
  payment_intent_id text not null,
  charge_id text,
  amount numeric(14,2) not null default 0,
  fee numeric(14,2) not null default 0,
  currency text not null default 'BRL',
  status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_stripe_transactions_payment_intent
  on public.stripe_transactions (payment_intent_id, created_at desc);

create index if not exists idx_stripe_transactions_provider_date
  on public.stripe_transactions (provider, created_at desc);

create index if not exists idx_stripe_transactions_status
  on public.stripe_transactions (status, created_at desc);

-- =========================================================
-- Reconciliation report model
-- =========================================================

create table if not exists public.reconciliation_reports (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  report_date date not null,
  total_orders numeric(14,2) not null default 0,
  total_payments numeric(14,2) not null default 0,
  total_payouts numeric(14,2) not null default 0,
  discrepancies integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'mismatch', 'resolved')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, report_date)
);

create index if not exists idx_reconciliation_reports_date
  on public.reconciliation_reports (report_date desc, provider, status);

drop trigger if exists trg_reconciliation_reports_updated on public.reconciliation_reports;
create trigger trg_reconciliation_reports_updated
before update on public.reconciliation_reports
for each row execute function public.set_updated_at();

create table if not exists public.reconciliation_issues (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reconciliation_reports(id) on delete cascade,
  provider text not null default 'stripe',
  order_id uuid references public.orders(id) on delete set null,
  seller_id uuid references public.sellers(id) on delete set null,
  seller_order_id uuid references public.seller_orders(id) on delete set null,
  payment_intent_id text,
  issue_type text not null
    check (issue_type in (
      'missing_payment',
      'amount_mismatch',
      'missing_payout',
      'duplicate_transaction',
      'stripe_fee_mismatch'
    )),
  expected_amount numeric(14,2),
  actual_amount numeric(14,2),
  status text not null default 'open'
    check (status in ('open', 'resolved', 'ignored')),
  details jsonb not null default '{}'::jsonb,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_reconciliation_issues_report
  on public.reconciliation_issues (report_id, created_at desc);

create index if not exists idx_reconciliation_issues_status
  on public.reconciliation_issues (status, issue_type, created_at desc);

create index if not exists idx_reconciliation_issues_order
  on public.reconciliation_issues (order_id, payment_intent_id);

create table if not exists public.reconciliation_alerts (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.reconciliation_issues(id) on delete cascade,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'critical')),
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (issue_id)
);

create index if not exists idx_reconciliation_alerts_status
  on public.reconciliation_alerts (status, severity, created_at desc);

-- =========================================================
-- Helpers
-- =========================================================

create or replace function public.reconciliation_issue_severity(
  p_issue_type text
)
returns text
language sql
immutable
as $$
  select case
    when p_issue_type in ('missing_payment', 'duplicate_transaction') then 'critical'
    when p_issue_type in ('amount_mismatch', 'stripe_fee_mismatch', 'missing_payout') then 'medium'
    else 'low'
  end;
$$;

create or replace function public.reconciliation_issue_message(
  p_issue_type text,
  p_payment_intent_id text,
  p_expected numeric,
  p_actual numeric
)
returns text
language sql
immutable
as $$
  select case
    when p_issue_type = 'missing_payment'
      then format('Pagamento ausente para payment_intent %s. Esperado=%s, atual=%s.',
        coalesce(p_payment_intent_id, 'n/a'),
        coalesce(to_char(p_expected, 'FM9999999990D00'), '0.00'),
        coalesce(to_char(p_actual, 'FM9999999990D00'), '0.00'))
    when p_issue_type = 'amount_mismatch'
      then format('Divergencia de valor para payment_intent %s. Esperado=%s, atual=%s.',
        coalesce(p_payment_intent_id, 'n/a'),
        coalesce(to_char(p_expected, 'FM9999999990D00'), '0.00'),
        coalesce(to_char(p_actual, 'FM9999999990D00'), '0.00'))
    when p_issue_type = 'duplicate_transaction'
      then format('Transacao duplicada para payment_intent %s. Esperado=%s, atual=%s.',
        coalesce(p_payment_intent_id, 'n/a'),
        coalesce(to_char(p_expected, 'FM9999999990D00'), '0.00'),
        coalesce(to_char(p_actual, 'FM9999999990D00'), '0.00'))
    when p_issue_type = 'stripe_fee_mismatch'
      then format('Divergencia de taxa Stripe para payment_intent %s. Esperado=%s, atual=%s.',
        coalesce(p_payment_intent_id, 'n/a'),
        coalesce(to_char(p_expected, 'FM9999999990D00'), '0.00'),
        coalesce(to_char(p_actual, 'FM9999999990D00'), '0.00'))
    when p_issue_type = 'missing_payout'
      then format('Repasse ausente. Esperado=%s, atual=%s.',
        coalesce(to_char(p_expected, 'FM9999999990D00'), '0.00'),
        coalesce(to_char(p_actual, 'FM9999999990D00'), '0.00'))
    else 'Issue de reconciliacao detectada.'
  end;
$$;

-- =========================================================
-- Core function
-- =========================================================

create or replace function public.run_reconciliation(
  p_report_date date default current_date,
  p_provider text default 'stripe'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_id uuid;
  v_provider text := lower(coalesce(nullif(btrim(p_provider), ''), 'stripe'));
  v_total_orders numeric(14,2) := 0;
  v_total_payments numeric(14,2) := 0;
  v_total_payouts numeric(14,2) := 0;
  v_discrepancies integer := 0;
begin
  insert into public.reconciliation_reports (
    provider,
    report_date,
    status,
    updated_at
  )
  values (
    v_provider,
    p_report_date,
    'pending',
    now()
  )
  on conflict (provider, report_date) do update
  set
    status = 'pending',
    updated_at = now()
  returning id into v_report_id;

  delete from public.reconciliation_alerts ra
  using public.reconciliation_issues ri
  where ri.report_id = v_report_id
    and ra.issue_id = ri.id;

  delete from public.reconciliation_issues
  where report_id = v_report_id;

  with order_scope as (
    select
      o.id as order_id,
      o.customer_id as user_id,
      o.payment_intent_id,
      round((coalesce(o.total_order_cents, 0)::numeric / 100.0), 2) as order_total_brl,
      o.payment_status,
      o.status,
      o.created_at
    from public.orders o
    where o.created_at::date = p_report_date
      and lower(coalesce(o.payment_provider, v_provider)) = v_provider
      and o.payment_intent_id is not null
  ),
  stripe_scope as (
    select
      st.payment_intent_id,
      round(coalesce(sum(st.amount), 0), 2) as amount_brl,
      round(coalesce(sum(st.fee), 0), 2) as fee_brl,
      count(*)::integer as tx_count
    from public.stripe_transactions st
    where st.created_at::date = p_report_date
      and lower(coalesce(st.provider, v_provider)) = v_provider
      and lower(coalesce(st.status, 'succeeded')) not in ('failed', 'canceled', 'cancelled')
    group by st.payment_intent_id
  ),
  ledger_scope as (
    select
      le.order_id,
      round(
        coalesce(
          sum(le.amount) filter (
            where le.account_code = 'cash_clearing'
              and le.direction = 'debit'
              and coalesce(lj.reference_type, '') in ('order_settlement', 'order_settlement_v2', 'order_settlement_final_v1')
          ),
          0
        ),
        2
      ) as ledger_payment_brl,
      round(
        coalesce(
          sum(
            case
              when le.account_code in ('gateway_fee_expense', 'gateway_fee') and le.direction = 'debit' then le.amount
              when le.account_code in ('gateway_fee_expense', 'gateway_fee') and le.direction = 'credit' then -le.amount
              else 0
            end
          ),
          0
        ),
        2
      ) as ledger_fee_brl
    from public.ledger_entries le
    left join public.ledger_journals lj on lj.id = le.journal_id
    where le.order_id is not null
    group by le.order_id
  ),
  payout_scope as (
    select
      so.order_id,
      so.seller_id,
      so.id as seller_order_id,
      round((coalesce(so.seller_payout_cents, 0)::numeric / 100.0), 2) as expected_payout_brl,
      coalesce(spi.id, null) as payout_item_id
    from public.seller_orders so
    left join public.seller_payout_items spi on spi.seller_order_id = so.id
    where lower(coalesce(so.status, '')) in ('delivered', 'completed')
      and coalesce(so.delivered_at, so.created_at)::date <= (p_report_date - 7)
  ),
  issues as (
    select
      'missing_payment'::text as issue_type,
      os.order_id,
      null::uuid as seller_id,
      null::uuid as seller_order_id,
      os.payment_intent_id,
      os.order_total_brl as expected_amount,
      0::numeric(14,2) as actual_amount,
      jsonb_build_object(
        'source', 'order_vs_stripe',
        'payment_status', os.payment_status,
        'order_status', os.status
      ) as details,
      md5(v_report_id::text || ':missing_payment:' || coalesce(os.payment_intent_id, os.order_id::text)) as dedupe_key
    from order_scope os
    left join stripe_scope ss on ss.payment_intent_id = os.payment_intent_id
    where lower(coalesce(os.payment_status, '')) = 'paid'
      and ss.payment_intent_id is null

    union all

    select
      'amount_mismatch'::text as issue_type,
      os.order_id,
      null::uuid as seller_id,
      null::uuid as seller_order_id,
      os.payment_intent_id,
      os.order_total_brl as expected_amount,
      ss.amount_brl as actual_amount,
      jsonb_build_object(
        'source', 'order_vs_stripe'
      ) as details,
      md5(v_report_id::text || ':amount_mismatch:order_vs_stripe:' || coalesce(os.payment_intent_id, os.order_id::text)) as dedupe_key
    from order_scope os
    join stripe_scope ss on ss.payment_intent_id = os.payment_intent_id
    where lower(coalesce(os.payment_status, '')) = 'paid'
      and abs(os.order_total_brl - ss.amount_brl) > 0.01

    union all

    select
      'amount_mismatch'::text as issue_type,
      os.order_id,
      null::uuid as seller_id,
      null::uuid as seller_order_id,
      os.payment_intent_id,
      os.order_total_brl as expected_amount,
      coalesce(ls.ledger_payment_brl, 0)::numeric(14,2) as actual_amount,
      jsonb_build_object(
        'source', 'order_vs_ledger'
      ) as details,
      md5(v_report_id::text || ':amount_mismatch:order_vs_ledger:' || coalesce(os.payment_intent_id, os.order_id::text)) as dedupe_key
    from order_scope os
    left join ledger_scope ls on ls.order_id = os.order_id
    where lower(coalesce(os.payment_status, '')) = 'paid'
      and abs(os.order_total_brl - coalesce(ls.ledger_payment_brl, 0)) > 0.01

    union all

    select
      'duplicate_transaction'::text as issue_type,
      os.order_id,
      null::uuid as seller_id,
      null::uuid as seller_order_id,
      os.payment_intent_id,
      os.order_total_brl as expected_amount,
      ss.amount_brl as actual_amount,
      jsonb_build_object(
        'source', 'stripe_transactions',
        'transaction_count', ss.tx_count
      ) as details,
      md5(v_report_id::text || ':duplicate_transaction:' || coalesce(os.payment_intent_id, os.order_id::text)) as dedupe_key
    from order_scope os
    join stripe_scope ss on ss.payment_intent_id = os.payment_intent_id
    where ss.tx_count > 1

    union all

    select
      'stripe_fee_mismatch'::text as issue_type,
      os.order_id,
      null::uuid as seller_id,
      null::uuid as seller_order_id,
      os.payment_intent_id,
      ss.fee_brl as expected_amount,
      coalesce(ls.ledger_fee_brl, 0)::numeric(14,2) as actual_amount,
      jsonb_build_object(
        'source', 'stripe_fee_vs_ledger_gateway_fee'
      ) as details,
      md5(v_report_id::text || ':stripe_fee_mismatch:' || coalesce(os.payment_intent_id, os.order_id::text)) as dedupe_key
    from order_scope os
    join stripe_scope ss on ss.payment_intent_id = os.payment_intent_id
    left join ledger_scope ls on ls.order_id = os.order_id
    where lower(coalesce(os.payment_status, '')) = 'paid'
      and abs(coalesce(ss.fee_brl, 0) - coalesce(ls.ledger_fee_brl, 0)) > 0.01

    union all

    select
      'missing_payout'::text as issue_type,
      ps.order_id,
      ps.seller_id,
      ps.seller_order_id,
      o.payment_intent_id,
      ps.expected_payout_brl as expected_amount,
      0::numeric(14,2) as actual_amount,
      jsonb_build_object(
        'source', 'seller_orders_vs_seller_payout_items'
      ) as details,
      md5(v_report_id::text || ':missing_payout:' || ps.seller_order_id::text) as dedupe_key
    from payout_scope ps
    join public.orders o on o.id = ps.order_id
    where ps.payout_item_id is null
  )
  insert into public.reconciliation_issues (
    report_id,
    provider,
    order_id,
    seller_id,
    seller_order_id,
    payment_intent_id,
    issue_type,
    expected_amount,
    actual_amount,
    status,
    details,
    dedupe_key,
    created_at
  )
  select
    v_report_id,
    v_provider,
    i.order_id,
    i.seller_id,
    i.seller_order_id,
    i.payment_intent_id,
    i.issue_type,
    i.expected_amount,
    i.actual_amount,
    'open',
    i.details,
    i.dedupe_key,
    now()
  from issues i
  on conflict (dedupe_key) do update
  set
    expected_amount = excluded.expected_amount,
    actual_amount = excluded.actual_amount,
    details = excluded.details,
    status = 'open',
    resolved_at = null;

  insert into public.reconciliation_alerts (
    issue_id,
    severity,
    message,
    status,
    created_at
  )
  select
    ri.id,
    public.reconciliation_issue_severity(ri.issue_type),
    public.reconciliation_issue_message(
      ri.issue_type,
      ri.payment_intent_id,
      ri.expected_amount,
      ri.actual_amount
    ),
    'open',
    now()
  from public.reconciliation_issues ri
  where ri.report_id = v_report_id
  on conflict (issue_id) do update
  set
    severity = excluded.severity,
    message = excluded.message,
    status = 'open',
    resolved_at = null;

  insert into public.finance_ops_alerts (
    alert_type,
    severity,
    seller_id,
    provider,
    recon_date,
    title,
    body,
    payload,
    dedupe_key,
    created_at
  )
  select
    'reconciliation_issue',
    case
      when ra.severity = 'critical' then 'critical'
      when ra.severity = 'medium' then 'warn'
      else 'info'
    end,
    ri.seller_id,
    ri.provider,
    p_report_date,
    'Issue detalhada de reconciliacao',
    ra.message,
    jsonb_build_object(
      'report_id', v_report_id,
      'issue_id', ri.id,
      'issue_type', ri.issue_type,
      'payment_intent_id', ri.payment_intent_id,
      'order_id', ri.order_id,
      'seller_order_id', ri.seller_order_id,
      'expected_amount', ri.expected_amount,
      'actual_amount', ri.actual_amount
    ),
    'reconciliation_issue:' || ri.id::text,
    now()
  from public.reconciliation_issues ri
  join public.reconciliation_alerts ra on ra.issue_id = ri.id
  where ri.report_id = v_report_id
  on conflict (dedupe_key) do update
  set
    severity = excluded.severity,
    title = excluded.title,
    body = excluded.body,
    payload = excluded.payload,
    status = 'open',
    resolved_at = null;

  select round(coalesce(sum(o.total_order_cents), 0)::numeric / 100.0, 2)
    into v_total_orders
  from public.orders o
  where o.created_at::date = p_report_date
    and lower(coalesce(o.payment_provider, v_provider)) = v_provider;

  select round(coalesce(sum(st.amount), 0), 2)
    into v_total_payments
  from public.stripe_transactions st
  where st.created_at::date = p_report_date
    and lower(coalesce(st.provider, v_provider)) = v_provider
    and lower(coalesce(st.status, 'succeeded')) not in ('failed', 'canceled', 'cancelled');

  select round(coalesce(sum(sp.net_payout_cents), 0)::numeric / 100.0, 2)
    into v_total_payouts
  from public.seller_payouts sp
  where sp.status = 'paid'
    and sp.paid_at is not null
    and sp.paid_at::date = p_report_date;

  select count(*)
    into v_discrepancies
  from public.reconciliation_issues
  where report_id = v_report_id
    and status = 'open';

  update public.reconciliation_reports rr
  set
    total_orders = coalesce(v_total_orders, 0),
    total_payments = coalesce(v_total_payments, 0),
    total_payouts = coalesce(v_total_payouts, 0),
    discrepancies = coalesce(v_discrepancies, 0),
    status = case when coalesce(v_discrepancies, 0) > 0 then 'mismatch' else 'matched' end,
    details = jsonb_build_object(
      'provider', v_provider,
      'gateway_reconciliation_run', (
        select to_jsonb(gr)
        from public.gateway_reconciliation_runs gr
        where gr.provider = v_provider
          and gr.recon_date = p_report_date
        limit 1
      ),
      'issue_type_counts', (
        select coalesce(jsonb_object_agg(issue_type, cnt), '{}'::jsonb)
        from (
          select issue_type, count(*)::int as cnt
          from public.reconciliation_issues
          where report_id = v_report_id
          group by issue_type
        ) q
      )
    ),
    updated_at = now()
  where rr.id = v_report_id;

  return v_report_id;
end;
$$;

grant execute on function public.run_reconciliation(date, text) to service_role;

-- =========================================================
-- Security
-- =========================================================

alter table public.stripe_transactions enable row level security;
alter table public.reconciliation_reports enable row level security;
alter table public.reconciliation_issues enable row level security;
alter table public.reconciliation_alerts enable row level security;

drop policy if exists stripe_transactions_admin_select on public.stripe_transactions;
create policy stripe_transactions_admin_select
on public.stripe_transactions
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists stripe_transactions_service_all on public.stripe_transactions;
create policy stripe_transactions_service_all
on public.stripe_transactions
for all
to service_role
using (true)
with check (true);

drop policy if exists reconciliation_reports_admin_select on public.reconciliation_reports;
create policy reconciliation_reports_admin_select
on public.reconciliation_reports
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists reconciliation_reports_service_all on public.reconciliation_reports;
create policy reconciliation_reports_service_all
on public.reconciliation_reports
for all
to service_role
using (true)
with check (true);

drop policy if exists reconciliation_issues_admin_select on public.reconciliation_issues;
create policy reconciliation_issues_admin_select
on public.reconciliation_issues
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists reconciliation_issues_service_all on public.reconciliation_issues;
create policy reconciliation_issues_service_all
on public.reconciliation_issues
for all
to service_role
using (true)
with check (true);

drop policy if exists reconciliation_alerts_admin_select on public.reconciliation_alerts;
create policy reconciliation_alerts_admin_select
on public.reconciliation_alerts
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists reconciliation_alerts_service_all on public.reconciliation_alerts;
create policy reconciliation_alerts_service_all
on public.reconciliation_alerts
for all
to service_role
using (true)
with check (true);

revoke all on public.stripe_transactions from anon;
revoke all on public.reconciliation_reports from anon;
revoke all on public.reconciliation_issues from anon;
revoke all on public.reconciliation_alerts from anon;

grant select on public.stripe_transactions to authenticated;
grant select on public.reconciliation_reports to authenticated;
grant select on public.reconciliation_issues to authenticated;
grant select on public.reconciliation_alerts to authenticated;

grant all on public.stripe_transactions to service_role;
grant all on public.reconciliation_reports to service_role;
grant all on public.reconciliation_issues to service_role;
grant all on public.reconciliation_alerts to service_role;

-- =========================================================
-- Cron
-- =========================================================

do $$
declare
  v_job_id bigint;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    for v_job_id in
      select jobid
      from cron.job
      where jobname = 'marketplace_reconciliation_intraday'
    loop
      perform cron.unschedule(v_job_id);
    end loop;

    perform cron.schedule(
      'marketplace_reconciliation_intraday',
      '*/10 * * * *',
      'select public.run_reconciliation(current_date, ''stripe'');'
    );
  end if;
exception
  when others then
    null;
end;
$$;
