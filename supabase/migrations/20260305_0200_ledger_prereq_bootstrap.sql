-- Minimal ledger prerequisites bootstrap (idempotent)
-- Safe for staging/prod where ledger core objects may be missing.

create extension if not exists "pgcrypto";

create table if not exists public.ledger_accounts (
  code text primary key,
  name text not null,
  normal_balance text not null check (normal_balance in ('debit', 'credit'))
);

create table if not exists public.ledger_journals (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.sellers(id) on delete cascade,
  payout_id uuid references public.payouts(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  reference_type text not null,
  reference_id text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  status text not null default 'posted'
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.ledger_journals(id) on delete cascade,
  store_id uuid not null references public.sellers(id) on delete cascade,
  payout_id uuid references public.payouts(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  account_code text not null references public.ledger_accounts(code),
  direction text not null check (direction in ('debit', 'credit')),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'BRL',
  occurred_at timestamptz not null default now(),
  memo text
);

create index if not exists idx_ledger_entries_store_time
  on public.ledger_entries (store_id, occurred_at desc);
create index if not exists idx_ledger_entries_payout
  on public.ledger_entries (payout_id);
create index if not exists idx_ledger_entries_order
  on public.ledger_entries (order_id);
create index if not exists idx_ledger_entries_account
  on public.ledger_entries (account_code);
create index if not exists idx_ledger_journals_store_time
  on public.ledger_journals (store_id, created_at desc);

create or replace function public.enforce_journal_balanced()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_journal_id uuid;
  v_debits numeric(12, 2);
  v_credits numeric(12, 2);
begin
  v_journal_id := coalesce(new.journal_id, old.journal_id);

  select coalesce(sum(amount), 0)
    into v_debits
  from public.ledger_entries
  where journal_id = v_journal_id
    and direction = 'debit';

  select coalesce(sum(amount), 0)
    into v_credits
  from public.ledger_entries
  where journal_id = v_journal_id
    and direction = 'credit';

  if v_debits <> v_credits then
    raise exception 'Ledger journal % not balanced: debits=% credits=%', v_journal_id, v_debits, v_credits;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_balance_journal on public.ledger_entries;
create constraint trigger trg_balance_journal
after insert or update or delete on public.ledger_entries
deferrable initially deferred
for each row execute function public.enforce_journal_balanced();

insert into public.ledger_accounts (code, name, normal_balance)
values
  ('seller_payable', 'Seller Payable (a pagar ao lojista)', 'credit'),
  ('marketplace_fee_revenue', 'Receita de comissao marketplace', 'credit'),
  ('refunds_expense', 'Despesa com reembolsos', 'debit'),
  ('chargebacks_expense', 'Despesa com chargebacks', 'debit'),
  ('adjustments_expense', 'Ajustes manuais', 'debit'),
  ('cash_clearing', 'Cash Clearing (gateway)', 'debit'),
  ('cash_bank', 'Cash Bank', 'debit'),
  ('customer_refund_payable', 'Customer Refund Payable', 'credit'),
  ('shipping_pass_through', 'Frete a repassar ao lojista', 'credit'),
  ('promo_discount_expense', 'Despesa cupom marketplace', 'debit'),
  ('gateway_fee_expense', 'Despesa taxa gateway', 'debit')
on conflict (code) do update
set
  name = excluded.name,
  normal_balance = excluded.normal_balance;
