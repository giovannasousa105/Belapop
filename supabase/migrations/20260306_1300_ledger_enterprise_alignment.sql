-- Ledger enterprise alignment (non-breaking)
-- Adds compatibility columns/views and reconciliation primitives on top of existing ledger model.
-- Safe to re-run.

-- =========================================================
-- ledger_accounts: add account_type while preserving normal_balance model
-- =========================================================

alter table if exists public.ledger_accounts
  add column if not exists account_type text;

update public.ledger_accounts
set account_type = case
  when code in ('cash_clearing', 'cash_bank', 'seller_receivable') then 'asset'
  when code in ('seller_payable', 'customer_refund_payable', 'shipping_pass_through', 'refunds_payable', 'customer_payment') then 'liability'
  when code in ('marketplace_fee_revenue', 'marketplace_revenue', 'shipping_revenue') then 'revenue'
  when code in ('promo_discount_expense', 'promo_expense', 'refunds_expense', 'chargebacks_expense', 'chargeback_expense', 'gateway_fee_expense', 'gateway_fee', 'adjustments_expense', 'shipping_subsidy_expense') then 'expense'
  else account_type
end
where account_type is null;

update public.ledger_accounts
set account_type = case
  when normal_balance = 'credit' then 'liability'
  else 'expense'
end
where account_type is null;

alter table if exists public.ledger_accounts
  alter column account_type set default 'expense';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ledger_accounts_account_type_check'
      and conrelid = 'public.ledger_accounts'::regclass
  ) then
    alter table public.ledger_accounts
      add constraint ledger_accounts_account_type_check
      check (account_type in ('asset', 'liability', 'revenue', 'expense'));
  end if;
end $$;

alter table if exists public.ledger_accounts
  alter column account_type set not null;

create index if not exists idx_ledger_accounts_type
  on public.ledger_accounts (account_type, code);

-- Canonical + compatibility account codes used across finance flows.
insert into public.ledger_accounts (code, name, normal_balance, account_type)
values
  ('cash_clearing', 'Cash Clearing (gateway)', 'debit', 'asset'),
  ('cash_bank', 'Cash Bank', 'debit', 'asset'),
  ('seller_receivable', 'Seller Receivable (quando lojista deve)', 'debit', 'asset'),
  ('seller_payable', 'Seller Payable (repasse ao lojista)', 'credit', 'liability'),
  ('customer_refund_payable', 'Customer Refund Payable', 'credit', 'liability'),
  ('refunds_payable', 'Refunds Payable (compat)', 'credit', 'liability'),
  ('customer_payment', 'Customer Payment (compat)', 'credit', 'liability'),
  ('marketplace_fee_revenue', 'Receita de comissao marketplace', 'credit', 'revenue'),
  ('marketplace_revenue', 'Receita marketplace (compat)', 'credit', 'revenue'),
  ('shipping_revenue', 'Receita de frete (quando aplicavel)', 'credit', 'revenue'),
  ('promo_discount_expense', 'Despesa cupom marketplace', 'debit', 'expense'),
  ('promo_expense', 'Despesa cupom marketplace (compat)', 'debit', 'expense'),
  ('refunds_expense', 'Despesa reembolso cliente', 'debit', 'expense'),
  ('chargebacks_expense', 'Despesa chargeback', 'debit', 'expense'),
  ('chargeback_expense', 'Despesa chargeback (compat)', 'debit', 'expense'),
  ('gateway_fee_expense', 'Despesa taxa gateway', 'debit', 'expense'),
  ('gateway_fee', 'Despesa taxa gateway (compat)', 'debit', 'expense'),
  ('shipping_pass_through', 'Frete a repassar ao lojista', 'credit', 'liability'),
  ('shipping_subsidy_expense', 'Despesa de subsidio de frete', 'debit', 'expense'),
  ('adjustments_expense', 'Ajustes manuais', 'debit', 'expense')
on conflict (code) do update
set
  name = excluded.name,
  normal_balance = excluded.normal_balance,
  account_type = excluded.account_type;

-- =========================================================
-- ledger_entries: compatibility cents columns + entry_type normalization
-- =========================================================

alter table if exists public.ledger_entries
  add column if not exists entry_type text;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ledger_entries'
      and column_name = 'debit_cents'
  ) then
    alter table public.ledger_entries
      add column debit_cents bigint
      generated always as (
        case when direction = 'debit' then round(amount * 100)::bigint else 0::bigint end
      ) stored;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ledger_entries'
      and column_name = 'credit_cents'
  ) then
    alter table public.ledger_entries
      add column credit_cents bigint
      generated always as (
        case when direction = 'credit' then round(amount * 100)::bigint else 0::bigint end
      ) stored;
  end if;
end $$;

update public.ledger_entries le
set entry_type = coalesce(
  nullif(le.entry_type, ''),
  lj.reference_type,
  'ledger_entry'
)
from public.ledger_journals lj
where lj.id = le.journal_id
  and (le.entry_type is null or btrim(le.entry_type) = '');

create index if not exists idx_ledger_entries_entry_type
  on public.ledger_entries (entry_type, occurred_at desc);

create index if not exists idx_ledger_entries_store_entry_type
  on public.ledger_entries (store_id, entry_type, occurred_at desc);

-- =========================================================
-- Statement/Balance views (read-only analytics)
-- =========================================================

create or replace view public.ledger_entries_statement as
select
  le.id,
  le.journal_id,
  le.store_id as seller_id,
  le.payout_id,
  le.order_id,
  le.seller_order_id,
  le.account_code,
  coalesce(le.entry_type, lj.reference_type, 'ledger_entry') as entry_type,
  le.debit_cents,
  le.credit_cents,
  le.currency,
  lj.reference_type,
  lj.reference_id,
  le.memo as description,
  le.occurred_at as created_at
from public.ledger_entries le
left join public.ledger_journals lj on lj.id = le.journal_id;

create or replace view public.ledger_account_balances_cents as
select
  le.account_code,
  sum(le.debit_cents - le.credit_cents)::bigint as balance_cents
from public.ledger_entries le
group by le.account_code;

create or replace view public.ledger_seller_payable_balances_cents as
select
  le.store_id as seller_id,
  sum(le.debit_cents - le.credit_cents)::bigint as balance_cents
from public.ledger_entries le
where le.account_code = 'seller_payable'
group by le.store_id;

-- =========================================================
-- Gateway reconciliation primitives
-- =========================================================

create table if not exists public.gateway_settlements (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  settlement_ref text not null,
  settlement_date date not null,
  gross_cents bigint not null default 0,
  fees_cents bigint not null default 0,
  refunds_cents bigint not null default 0,
  chargebacks_cents bigint not null default 0,
  net_cents bigint not null default 0,
  currency text not null default 'BRL',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, settlement_ref)
);

create index if not exists idx_gateway_settlements_date
  on public.gateway_settlements (settlement_date desc, provider);

alter table public.gateway_settlements enable row level security;

drop policy if exists gateway_settlements_admin_select on public.gateway_settlements;
create policy gateway_settlements_admin_select
on public.gateway_settlements
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists gateway_settlements_service_all on public.gateway_settlements;
create policy gateway_settlements_service_all
on public.gateway_settlements
for all
to service_role
using (true)
with check (true);

revoke all on public.gateway_settlements from anon;
grant select on public.gateway_settlements to authenticated;
grant all on public.gateway_settlements to service_role;

create or replace view public.gateway_reconciliation_daily as
with ledger_daily as (
  select
    le.occurred_at::date as day,
    sum(le.debit_cents) filter (where le.account_code = 'cash_clearing')::bigint as cash_clearing_debit_cents,
    sum(le.credit_cents) filter (where le.account_code = 'cash_clearing')::bigint as cash_clearing_credit_cents
  from public.ledger_entries le
  group by le.occurred_at::date
),
settlement_daily as (
  select
    gs.settlement_date as day,
    sum(gs.gross_cents)::bigint as gross_cents,
    sum(gs.fees_cents)::bigint as fees_cents,
    sum(gs.refunds_cents)::bigint as refunds_cents,
    sum(gs.chargebacks_cents)::bigint as chargebacks_cents,
    sum(gs.net_cents)::bigint as net_cents
  from public.gateway_settlements gs
  group by gs.settlement_date
)
select
  coalesce(ld.day, sd.day) as day,
  coalesce(ld.cash_clearing_debit_cents, 0) as ledger_cash_in_cents,
  coalesce(ld.cash_clearing_credit_cents, 0) as ledger_cash_out_cents,
  coalesce(sd.gross_cents, 0) as gateway_gross_cents,
  coalesce(sd.fees_cents, 0) as gateway_fees_cents,
  coalesce(sd.refunds_cents, 0) as gateway_refunds_cents,
  coalesce(sd.chargebacks_cents, 0) as gateway_chargebacks_cents,
  coalesce(sd.net_cents, 0) as gateway_net_cents,
  (coalesce(ld.cash_clearing_debit_cents, 0) - coalesce(sd.gross_cents, 0))::bigint as diff_cash_in_vs_gateway_gross_cents
from ledger_daily ld
full join settlement_daily sd on sd.day = ld.day
order by coalesce(ld.day, sd.day) desc;

