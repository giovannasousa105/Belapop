-- Finance ledger foundation + apply workflow via immutable journal entries

create extension if not exists "pgcrypto";

create table if not exists public.ledger_accounts (
  code text primary key,
  name text not null,
  normal_balance text not null check (normal_balance in ('debit','credit'))
);

insert into public.ledger_accounts (code, name, normal_balance)
values
  ('seller_payable','Seller Payable (a pagar ao lojista)','credit'),
  ('marketplace_fee_revenue','Receita de taxas do marketplace','credit'),
  ('refunds_expense','Despesa com reembolsos','debit'),
  ('chargebacks_expense','Despesa com chargebacks','debit'),
  ('adjustments_expense','Ajustes manuais (contra conta)','debit')
on conflict (code) do nothing;

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
  direction text not null check (direction in ('debit','credit')),
  amount numeric(12,2) not null check (amount >= 0),
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
as $$
declare
  v_journal_id uuid;
  d numeric(12,2);
  c numeric(12,2);
begin
  v_journal_id := coalesce(new.journal_id, old.journal_id);

  select coalesce(sum(amount), 0) into d
  from public.ledger_entries
  where journal_id = v_journal_id
    and direction = 'debit';

  select coalesce(sum(amount), 0) into c
  from public.ledger_entries
  where journal_id = v_journal_id
    and direction = 'credit';

  if d <> c then
    raise exception 'Ledger journal % not balanced: debits=% credits=%', v_journal_id, d, c;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_balance_journal on public.ledger_entries;
create constraint trigger trg_balance_journal
after insert or update or delete on public.ledger_entries
deferrable initially deferred
for each row execute function public.enforce_journal_balanced();

alter table if exists public.finance_adjustments
  add column if not exists ledger_journal_id uuid references public.ledger_journals(id) on delete set null;

create unique index if not exists idx_finance_adjustments_ledger_journal
  on public.finance_adjustments (ledger_journal_id)
  where ledger_journal_id is not null;

create or replace view public.payout_seller_payable_net as
select
  payout_id,
  store_id as seller_id,
  sum(case when direction='credit' then amount else 0 end) -
  sum(case when direction='debit' then amount else 0 end) as net_payable
from public.ledger_entries
where account_code = 'seller_payable'
  and payout_id is not null
group by payout_id, store_id;

alter table public.ledger_journals enable row level security;
alter table public.ledger_entries enable row level security;

drop policy if exists ledger_journals_select_scope on public.ledger_journals;
create policy ledger_journals_select_scope
on public.ledger_journals
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = ledger_journals.store_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists ledger_entries_select_scope on public.ledger_entries;
create policy ledger_entries_select_scope
on public.ledger_entries
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = ledger_entries.store_id
      and s.user_id = auth.uid()
  )
);

revoke insert, update, delete on public.ledger_journals from anon, authenticated;
revoke insert, update, delete on public.ledger_entries from anon, authenticated;

create or replace function public.post_finance_adjustment_ledger(
  p_adjustment_id uuid,
  p_actor_user_id uuid,
  p_request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adjustment public.finance_adjustments%rowtype;
  v_after public.finance_adjustments%rowtype;
  v_amount_abs numeric(12,2);
  v_journal_id uuid;
begin
  select *
  into v_adjustment
  from public.finance_adjustments
  where id = p_adjustment_id
  for update;

  if not found then
    raise exception 'finance_adjustment_not_found';
  end if;

  if v_adjustment.status = 'applied' and v_adjustment.ledger_journal_id is not null then
    return v_adjustment.ledger_journal_id;
  end if;

  if v_adjustment.status <> 'approved' then
    raise exception 'finance_adjustment_must_be_approved';
  end if;

  v_amount_abs := abs(coalesce(v_adjustment.amount, 0));
  if v_amount_abs = 0 then
    raise exception 'finance_adjustment_amount_invalid';
  end if;

  insert into public.ledger_journals (
    store_id,
    payout_id,
    order_id,
    reference_type,
    reference_id,
    created_by,
    status
  )
  values (
    v_adjustment.seller_id,
    v_adjustment.payout_id,
    v_adjustment.order_id,
    'finance_adjustment',
    v_adjustment.id::text,
    p_actor_user_id,
    'posted'
  )
  returning id into v_journal_id;

  if v_adjustment.amount < 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      v_adjustment.seller_id,
      v_adjustment.payout_id,
      v_adjustment.order_id,
      'seller_payable',
      'debit',
      v_amount_abs,
      coalesce(v_adjustment.currency, 'BRL'),
      'debit to seller from finance adjustment'
    );

    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      v_adjustment.seller_id,
      v_adjustment.payout_id,
      v_adjustment.order_id,
      'adjustments_expense',
      'credit',
      v_amount_abs,
      coalesce(v_adjustment.currency, 'BRL'),
      'contra entry for seller debit adjustment'
    );
  else
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      v_adjustment.seller_id,
      v_adjustment.payout_id,
      v_adjustment.order_id,
      'seller_payable',
      'credit',
      v_amount_abs,
      coalesce(v_adjustment.currency, 'BRL'),
      'credit to seller from finance adjustment'
    );

    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      v_adjustment.seller_id,
      v_adjustment.payout_id,
      v_adjustment.order_id,
      'adjustments_expense',
      'debit',
      v_amount_abs,
      coalesce(v_adjustment.currency, 'BRL'),
      'contra entry for seller credit adjustment'
    );
  end if;

  update public.finance_adjustments
  set
    status = 'applied',
    applied_at = now(),
    applied_by = p_actor_user_id,
    ledger_journal_id = v_journal_id,
    request_id = coalesce(p_request_id, request_id)
  where id = v_adjustment.id
  returning * into v_after;

  perform public.audit_log_write(
    v_adjustment.seller_id,
    'finance_adjustment',
    v_adjustment.id::text,
    'apply',
    'finance.approve_adjustment',
    to_jsonb(v_adjustment),
    to_jsonb(v_after),
    'finance adjustment applied to immutable ledger'
  );

  return v_journal_id;
end;
$$;
