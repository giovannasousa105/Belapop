-- Marketplace Financial Ledger compatibility layer
-- Keeps the current journal + entries core as source of truth while exposing
-- the simpler marketplace ledger vocabulary requested by product/finance.
-- Safe to re-run.

create extension if not exists "pgcrypto";

-- =========================================================
-- ledger_accounts: add surrogate id for line-based compatibility
-- =========================================================

alter table if exists public.ledger_accounts
  add column if not exists id uuid;

update public.ledger_accounts
set id = gen_random_uuid()
where id is null;

alter table if exists public.ledger_accounts
  alter column id set default gen_random_uuid();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ledger_accounts_id_unique'
      and conrelid = 'public.ledger_accounts'::regclass
  ) then
    alter table public.ledger_accounts
      add constraint ledger_accounts_id_unique unique (id);
  end if;
end $$;

alter table if exists public.ledger_accounts
  alter column id set not null;

create index if not exists idx_ledger_accounts_id
  on public.ledger_accounts (id);

-- =========================================================
-- ledger_entries: enrich with compatibility fields
-- =========================================================

alter table if exists public.ledger_entries
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists reference_id text;

create index if not exists idx_ledger_entries_user_time
  on public.ledger_entries (user_id, occurred_at desc);

create index if not exists idx_ledger_entries_reference_id
  on public.ledger_entries (reference_id, occurred_at desc);

create or replace function public.sync_ledger_entry_compatibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference_id text;
  v_order_id uuid;
begin
  if new.journal_id is not null then
    select j.reference_id, j.order_id
      into v_reference_id, v_order_id
    from public.ledger_journals j
    where j.id = new.journal_id;
  end if;

  if (new.reference_id is null or btrim(new.reference_id) = '') and v_reference_id is not null then
    new.reference_id := v_reference_id;
  end if;

  if new.order_id is null and v_order_id is not null then
    new.order_id := v_order_id;
  end if;

  if new.user_id is null and coalesce(new.order_id, v_order_id) is not null then
    select o.customer_id
      into new.user_id
    from public.orders o
    where o.id = coalesce(new.order_id, v_order_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_ledger_entry_compatibility on public.ledger_entries;
create trigger trg_sync_ledger_entry_compatibility
before insert or update on public.ledger_entries
for each row execute function public.sync_ledger_entry_compatibility();

with enriched as (
  select
    le.id,
    lj.reference_id as journal_reference_id,
    coalesce(le.order_id, lj.order_id) as resolved_order_id,
    o.customer_id
  from public.ledger_entries le
  join public.ledger_journals lj on lj.id = le.journal_id
  left join public.orders o on o.id = coalesce(le.order_id, lj.order_id)
)
update public.ledger_entries le
set
  reference_id = coalesce(le.reference_id, e.journal_reference_id),
  user_id = coalesce(le.user_id, e.customer_id),
  order_id = coalesce(le.order_id, e.resolved_order_id)
from enriched e
where e.id = le.id
  and (
    le.reference_id is null
    or btrim(le.reference_id) = ''
    or le.user_id is null
    or le.order_id is null
  );

-- =========================================================
-- Semantic mapping helpers
-- =========================================================

create or replace function public.marketplace_ledger_transaction_type(
  p_reference_type text
)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_reference_type, '') in (
      'order_settlement',
      'order_settlement_v2',
      'order_settlement_final_v1'
    ) then 'payment'
    when coalesce(p_reference_type, '') in (
      'seller_payout_payment',
      'seller_payout_payment_v2',
      'payout_payment_final_v1'
    ) then 'seller_payout'
    when coalesce(p_reference_type, '') in (
      'customer_refund_accrual',
      'customer_refund_payment',
      'order_refund_reversal_v2'
    ) then 'refund'
    when coalesce(p_reference_type, '') like 'chargeback%' then 'chargeback'
    when coalesce(p_reference_type, '') in ('gateway_fee_v1') then 'fee'
    when coalesce(p_reference_type, '') like '%adjust%' then 'adjustment'
    else coalesce(nullif(btrim(p_reference_type), ''), 'ledger_transaction')
  end;
$$;

create or replace function public.marketplace_ledger_entry_type(
  p_account_code text,
  p_direction text,
  p_reference_type text,
  p_entry_type text
)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_reference_type, '') in (
      'order_settlement',
      'order_settlement_v2',
      'order_settlement_final_v1'
    ) and p_account_code = 'cash_clearing' and p_direction = 'debit' then 'payment'
    when p_account_code in ('marketplace_fee_revenue', 'marketplace_revenue')
      and p_direction = 'credit' then 'commission'
    when p_account_code = 'seller_payable'
      and p_direction = 'credit' then 'seller_credit'
    when coalesce(p_reference_type, '') in (
      'seller_payout_payment',
      'seller_payout_payment_v2',
      'payout_payment_final_v1'
    ) and p_account_code in ('cash_bank', 'cash_clearing')
      and p_direction = 'credit' then 'seller_payout'
    when coalesce(p_reference_type, '') in (
      'seller_payout_payment',
      'seller_payout_payment_v2',
      'payout_payment_final_v1'
    ) and p_account_code = 'seller_payable'
      and p_direction = 'debit' then 'seller_debit'
    when coalesce(p_reference_type, '') in (
      'customer_refund_accrual',
      'customer_refund_payment',
      'order_refund_reversal_v2'
    ) and p_account_code in (
      'refunds_expense',
      'customer_refund_payable',
      'refunds_payable',
      'cash_bank',
      'cash_clearing'
    ) then 'refund'
    when coalesce(p_reference_type, '') in (
      'customer_refund_accrual',
      'customer_refund_payment',
      'order_refund_reversal_v2'
    ) and p_account_code = 'seller_payable'
      and p_direction = 'debit' then 'seller_debit'
    when p_account_code in ('chargebacks_expense', 'chargeback_expense')
      or coalesce(p_reference_type, '') like 'chargeback%' then 'chargeback'
    when p_account_code in ('gateway_fee_expense', 'gateway_fee') then 'fee'
    else coalesce(nullif(btrim(p_entry_type), ''), p_account_code, 'ledger_entry')
  end;
$$;

create or replace function public.marketplace_ledger_signed_amount(
  p_direction text,
  p_amount numeric
)
returns numeric
language sql
immutable
as $$
  select case
    when coalesce(p_direction, '') = 'debit' then coalesce(p_amount, 0)
    when coalesce(p_direction, '') = 'credit' then -coalesce(p_amount, 0)
    else 0
  end;
$$;

-- =========================================================
-- Views: simple marketplace ledger + advanced line-based compatibility
-- =========================================================

create or replace view public.marketplace_ledger_entries as
select
  le.id,
  le.order_id,
  le.store_id as seller_id,
  le.user_id,
  public.marketplace_ledger_entry_type(
    le.account_code,
    le.direction,
    lj.reference_type,
    le.entry_type
  ) as entry_type,
  public.marketplace_ledger_signed_amount(le.direction, le.amount) as amount,
  le.currency,
  coalesce(le.reference_id, lj.reference_id) as reference_id,
  lj.reference_type,
  le.account_code,
  le.direction,
  le.memo as description,
  le.occurred_at as created_at
from public.ledger_entries le
left join public.ledger_journals lj on lj.id = le.journal_id;

create or replace view public.ledger_transactions as
select
  lj.id,
  public.marketplace_ledger_transaction_type(lj.reference_type) as transaction_type,
  lj.store_id as seller_id,
  lj.order_id,
  o.customer_id as user_id,
  lj.payout_id,
  lj.reference_type,
  lj.reference_id,
  lj.created_by,
  lj.status,
  lj.created_at,
  count(le.id)::integer as lines_count,
  coalesce(sum(le.debit_cents), 0)::bigint as total_debit_cents,
  coalesce(sum(le.credit_cents), 0)::bigint as total_credit_cents
from public.ledger_journals lj
left join public.orders o on o.id = lj.order_id
left join public.ledger_entries le on le.journal_id = lj.id
group by
  lj.id,
  lj.store_id,
  lj.order_id,
  o.customer_id,
  lj.payout_id,
  lj.reference_type,
  lj.reference_id,
  lj.created_by,
  lj.status,
  lj.created_at;

create or replace view public.ledger_lines as
select
  le.id,
  le.journal_id as transaction_id,
  la.id as account_id,
  le.account_code,
  le.store_id as seller_id,
  le.user_id,
  le.order_id,
  le.payout_id,
  le.seller_order_id,
  public.marketplace_ledger_entry_type(
    le.account_code,
    le.direction,
    lj.reference_type,
    le.entry_type
  ) as entry_type,
  le.direction,
  le.amount,
  public.marketplace_ledger_signed_amount(le.direction, le.amount) as signed_amount,
  le.debit_cents,
  le.credit_cents,
  le.currency,
  coalesce(le.reference_id, lj.reference_id) as reference_id,
  lj.reference_type,
  le.memo as description,
  le.occurred_at as created_at
from public.ledger_entries le
join public.ledger_accounts la on la.code = le.account_code
left join public.ledger_journals lj on lj.id = le.journal_id;

create or replace view public.ledger_account_balances as
select
  account_code,
  round((balance_cents::numeric / 100.0), 2) as balance
from public.ledger_account_balances_cents;

create or replace view public.ledger_seller_balances as
select
  seller_id,
  round(((-balance_cents)::numeric / 100.0), 2) as amount_to_pay
from public.ledger_seller_payable_balances_cents;

revoke all on public.marketplace_ledger_entries from anon, authenticated;
grant select on public.marketplace_ledger_entries to service_role;

revoke all on public.ledger_transactions from anon, authenticated;
grant select on public.ledger_transactions to service_role;

revoke all on public.ledger_lines from anon, authenticated;
grant select on public.ledger_lines to service_role;

revoke all on public.ledger_account_balances from anon, authenticated;
grant select on public.ledger_account_balances to service_role;

revoke all on public.ledger_seller_balances from anon, authenticated;
grant select on public.ledger_seller_balances to service_role;
