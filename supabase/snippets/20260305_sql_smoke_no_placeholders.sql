-- Smoke SQL (no placeholders) for belapop production.
-- Safe to run multiple times.

-- 1) Confirm critical ledger function exists
select p.oid::regprocedure as signature
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'ledger_post_customer_refund_payment';

-- 2) Confirm required ledger accounts exist
select code, normal_balance
from public.ledger_accounts
where code in ('customer_refund_payable', 'refunds_expense', 'cash_clearing', 'cash_bank')
order by code;

-- 3) Confirm base data health
select
  (select count(*) from public.sellers) as sellers_count,
  (select count(*) from public.orders) as orders_count,
  (select count(*) from public.sub_orders where seller_id is not null) as sub_orders_valid;

-- 4) Insert test webhook-like events and return inserted rows
insert into public.marketplace_events (
  event_type,
  event_name,
  occurred_at,
  channel,
  store_id,
  order_id,
  amount_cents,
  currency,
  external_ref,
  source,
  provider,
  ingestion_status,
  metadata
)
values
(
  'finance',
  'refund_settled',
  now(),
  'marketplace',
  null,
  null,
  19500,
  'BRL',
  'manual-refund-' || gen_random_uuid()::text,
  'manual_test',
  'manual_test',
  'processed',
  '{}'::jsonb
),
(
  'risk',
  'chargeback_opened',
  now(),
  'marketplace',
  null,
  null,
  19500,
  'BRL',
  'manual-chargeback-' || gen_random_uuid()::text,
  'manual_test',
  'manual_test',
  'processed',
  '{}'::jsonb
)
returning id, occurred_at, event_name, provider, source, amount_cents;

-- 5) Post refund payment (auto picks a valid order + seller from sub_orders)
with picked as (
  select
    so.order_id,
    so.seller_id,
    greatest((coalesce(o.total_order_cents, 100)::numeric / 100.0), 1.00)::numeric(12,2) as amount_brl
  from public.sub_orders so
  join public.orders o on o.id = so.order_id
  where so.seller_id is not null
  order by o.created_at desc
  limit 1
)
select public.ledger_post_customer_refund_payment(
  picked.seller_id,
  picked.amount_brl,
  picked.order_id,
  null::uuid,
  null::uuid,
  'order:' || picked.order_id::text || ':refund:v1:auto-smoke',
  'BRL'::text,
  'cash_clearing'::text,
  'refund payment v1 smoke'
) as journal_id
from picked;

-- 6) Validate latest refund payment journals
select id, reference_type, reference_id, order_id, store_id, created_at
from public.ledger_journals
where reference_type = 'customer_refund_payment'
order by created_at desc
limit 10;
