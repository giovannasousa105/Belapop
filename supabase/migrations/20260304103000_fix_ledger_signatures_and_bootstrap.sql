-- Bootstrap ledger base + corrected function signatures for Postgres default args.
-- This migration is idempotent and safe to run in prod/staging.

create extension if not exists "pgcrypto";

create table if not exists public.ledger_accounts (
  code text primary key,
  name text not null,
  normal_balance text not null check (normal_balance in ('debit','credit'))
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

  select coalesce(sum(amount), 0)
    into d
  from public.ledger_entries
  where journal_id = v_journal_id
    and direction = 'debit';

  select coalesce(sum(amount), 0)
    into c
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

insert into public.ledger_accounts (code, name, normal_balance)
values
  ('seller_payable','Seller Payable (a pagar ao lojista)','credit'),
  ('marketplace_fee_revenue','Receita de taxas do marketplace','credit'),
  ('refunds_expense','Despesa com reembolsos','debit'),
  ('chargebacks_expense','Despesa com chargebacks','debit'),
  ('adjustments_expense','Ajustes manuais (contra conta)','debit'),
  ('cash_clearing','Cash Clearing (a receber do gateway)','debit'),
  ('cash_bank','Cash/Bank (saldo bancario)','debit'),
  ('customer_refund_payable','Customer Refund Payable (a pagar ao cliente)','credit'),
  ('shipping_revenue','Receita de frete (quando aplicavel)','credit'),
  ('promo_discount_expense','Despesa com desconto subsidiado pelo marketplace','debit'),
  ('shipping_subsidy_expense','Despesa de subsidio de frete','debit')
on conflict (code) do update
set
  name = excluded.name,
  normal_balance = excluded.normal_balance;

create or replace function public.ledger_post_order_settlement(
  p_store_id uuid,
  p_cash_in numeric,
  p_order_id uuid default null,
  p_payout_id uuid default null,
  p_actor_user_id uuid default null,
  p_reference_id text default null,
  p_currency text default 'BRL',
  p_marketplace_fee numeric default 0,
  p_shipping_revenue numeric default 0,
  p_seller_payable numeric default 0,
  p_marketplace_discount_expense numeric default 0,
  p_memo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference_id text := coalesce(nullif(trim(p_reference_id), ''), p_order_id::text, gen_random_uuid()::text);
  v_journal_id uuid;
  v_existing_journal_id uuid;
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_debits numeric(12,2);
  v_credits numeric(12,2);
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if coalesce(p_cash_in, 0) < 0
    or coalesce(p_marketplace_fee, 0) < 0
    or coalesce(p_shipping_revenue, 0) < 0
    or coalesce(p_seller_payable, 0) < 0
    or coalesce(p_marketplace_discount_expense, 0) < 0 then
    raise exception 'ledger_negative_amount_not_allowed';
  end if;

  v_debits := round((coalesce(p_cash_in, 0) + coalesce(p_marketplace_discount_expense, 0))::numeric, 2);
  v_credits := round(
    (
      coalesce(p_marketplace_fee, 0)
      + coalesce(p_shipping_revenue, 0)
      + coalesce(p_seller_payable, 0)
    )::numeric,
    2
  );

  if v_debits <> v_credits then
    raise exception 'ledger_unbalanced_settlement debits=% credits=%', v_debits, v_credits;
  end if;

  select id
    into v_existing_journal_id
  from public.ledger_journals
  where store_id = p_store_id
    and reference_type = 'order_settlement'
    and reference_id = v_reference_id
  limit 1;

  if v_existing_journal_id is not null then
    return v_existing_journal_id;
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
    p_store_id,
    p_payout_id,
    p_order_id,
    'order_settlement',
    v_reference_id,
    p_actor_user_id,
    'posted'
  )
  returning id into v_journal_id;

  if coalesce(p_cash_in, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'cash_clearing', 'debit', round(p_cash_in::numeric, 2), v_currency,
      coalesce(p_memo, 'order settlement - cash in')
    );
  end if;

  if coalesce(p_marketplace_discount_expense, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'promo_discount_expense', 'debit', round(p_marketplace_discount_expense::numeric, 2), v_currency,
      coalesce(p_memo, 'order settlement - marketplace discount expense')
    );
  end if;

  if coalesce(p_marketplace_fee, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'marketplace_fee_revenue', 'credit', round(p_marketplace_fee::numeric, 2), v_currency,
      coalesce(p_memo, 'order settlement - marketplace fee')
    );
  end if;

  if coalesce(p_shipping_revenue, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'shipping_revenue', 'credit', round(p_shipping_revenue::numeric, 2), v_currency,
      coalesce(p_memo, 'order settlement - shipping revenue')
    );
  end if;

  if coalesce(p_seller_payable, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'seller_payable', 'credit', round(p_seller_payable::numeric, 2), v_currency,
      coalesce(p_memo, 'order settlement - seller payable')
    );
  end if;

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_order_settlement_reversal(
  p_store_id uuid,
  p_cash_out numeric,
  p_order_id uuid default null,
  p_payout_id uuid default null,
  p_actor_user_id uuid default null,
  p_reference_id text default null,
  p_currency text default 'BRL',
  p_marketplace_fee numeric default 0,
  p_shipping_revenue numeric default 0,
  p_seller_payable numeric default 0,
  p_marketplace_discount_expense numeric default 0,
  p_memo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference_id text := coalesce(nullif(trim(p_reference_id), ''), p_order_id::text, gen_random_uuid()::text);
  v_journal_id uuid;
  v_existing_journal_id uuid;
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_debits numeric(12,2);
  v_credits numeric(12,2);
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if coalesce(p_cash_out, 0) < 0
    or coalesce(p_marketplace_fee, 0) < 0
    or coalesce(p_shipping_revenue, 0) < 0
    or coalesce(p_seller_payable, 0) < 0
    or coalesce(p_marketplace_discount_expense, 0) < 0 then
    raise exception 'ledger_negative_amount_not_allowed';
  end if;

  v_debits := round(
    (
      coalesce(p_marketplace_fee, 0)
      + coalesce(p_shipping_revenue, 0)
      + coalesce(p_seller_payable, 0)
    )::numeric,
    2
  );
  v_credits := round((coalesce(p_cash_out, 0) + coalesce(p_marketplace_discount_expense, 0))::numeric, 2);

  if v_debits <> v_credits then
    raise exception 'ledger_unbalanced_reversal debits=% credits=%', v_debits, v_credits;
  end if;

  select id
    into v_existing_journal_id
  from public.ledger_journals
  where store_id = p_store_id
    and reference_type = 'order_settlement_reversal'
    and reference_id = v_reference_id
  limit 1;

  if v_existing_journal_id is not null then
    return v_existing_journal_id;
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
    p_store_id,
    p_payout_id,
    p_order_id,
    'order_settlement_reversal',
    v_reference_id,
    p_actor_user_id,
    'posted'
  )
  returning id into v_journal_id;

  if coalesce(p_marketplace_fee, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'marketplace_fee_revenue', 'debit', round(p_marketplace_fee::numeric, 2), v_currency,
      coalesce(p_memo, 'settlement reversal - reverse marketplace fee')
    );
  end if;

  if coalesce(p_shipping_revenue, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'shipping_revenue', 'debit', round(p_shipping_revenue::numeric, 2), v_currency,
      coalesce(p_memo, 'settlement reversal - reverse shipping revenue')
    );
  end if;

  if coalesce(p_seller_payable, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'seller_payable', 'debit', round(p_seller_payable::numeric, 2), v_currency,
      coalesce(p_memo, 'settlement reversal - reverse seller payable')
    );
  end if;

  if coalesce(p_cash_out, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'cash_clearing', 'credit', round(p_cash_out::numeric, 2), v_currency,
      coalesce(p_memo, 'settlement reversal - reverse cash clearing')
    );
  end if;

  if coalesce(p_marketplace_discount_expense, 0) > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'promo_discount_expense', 'credit', round(p_marketplace_discount_expense::numeric, 2), v_currency,
      coalesce(p_memo, 'settlement reversal - reverse marketplace discount expense')
    );
  end if;

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_customer_refund_accrual(
  p_store_id uuid,
  p_amount numeric,
  p_order_id uuid default null,
  p_payout_id uuid default null,
  p_actor_user_id uuid default null,
  p_reference_id text default null,
  p_currency text default 'BRL',
  p_memo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference_id text := coalesce(nullif(trim(p_reference_id), ''), p_order_id::text, gen_random_uuid()::text);
  v_journal_id uuid;
  v_existing_journal_id uuid;
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_amount numeric(12,2) := round(coalesce(p_amount, 0)::numeric, 2);
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if v_amount <= 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  select id
    into v_existing_journal_id
  from public.ledger_journals
  where store_id = p_store_id
    and reference_type = 'customer_refund_accrual'
    and reference_id = v_reference_id
  limit 1;

  if v_existing_journal_id is not null then
    return v_existing_journal_id;
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
    p_store_id,
    p_payout_id,
    p_order_id,
    'customer_refund_accrual',
    v_reference_id,
    p_actor_user_id,
    'posted'
  )
  returning id into v_journal_id;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'refunds_expense', 'debit', v_amount, v_currency,
      coalesce(p_memo, 'customer refund accrual - expense recognition')
    ),
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'customer_refund_payable', 'credit', v_amount, v_currency,
      coalesce(p_memo, 'customer refund accrual - payable creation')
    );

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_customer_refund_payment(
  p_store_id uuid,
  p_amount numeric,
  p_order_id uuid default null,
  p_payout_id uuid default null,
  p_actor_user_id uuid default null,
  p_reference_id text default null,
  p_currency text default 'BRL',
  p_source_account text default 'cash_clearing',
  p_memo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference_id text := coalesce(nullif(trim(p_reference_id), ''), p_order_id::text, gen_random_uuid()::text);
  v_journal_id uuid;
  v_existing_journal_id uuid;
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_amount numeric(12,2) := round(coalesce(p_amount, 0)::numeric, 2);
  v_source_account text := coalesce(nullif(trim(p_source_account), ''), 'cash_clearing');
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if v_amount <= 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  if v_source_account not in ('cash_clearing', 'cash_bank') then
    raise exception 'ledger_invalid_source_account %', v_source_account;
  end if;

  select id
    into v_existing_journal_id
  from public.ledger_journals
  where store_id = p_store_id
    and reference_type = 'customer_refund_payment'
    and reference_id = v_reference_id
  limit 1;

  if v_existing_journal_id is not null then
    return v_existing_journal_id;
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
    p_store_id,
    p_payout_id,
    p_order_id,
    'customer_refund_payment',
    v_reference_id,
    p_actor_user_id,
    'posted'
  )
  returning id into v_journal_id;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'customer_refund_payable', 'debit', v_amount, v_currency,
      coalesce(p_memo, 'customer refund payment - settle payable')
    ),
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      v_source_account, 'credit', v_amount, v_currency,
      coalesce(p_memo, 'customer refund payment - cash out')
    );

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_seller_payout_payment(
  p_store_id uuid,
  p_payout_id uuid,
  p_amount numeric,
  p_actor_user_id uuid default null,
  p_reference_id text default null,
  p_currency text default 'BRL',
  p_source_account text default 'cash_bank',
  p_memo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference_id text := coalesce(nullif(trim(p_reference_id), ''), p_payout_id::text, gen_random_uuid()::text);
  v_journal_id uuid;
  v_existing_journal_id uuid;
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_amount numeric(12,2) := round(coalesce(p_amount, 0)::numeric, 2);
  v_source_account text := coalesce(nullif(trim(p_source_account), ''), 'cash_bank');
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if p_payout_id is null then
    raise exception 'ledger_payout_required';
  end if;

  if v_amount <= 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  if v_source_account not in ('cash_clearing', 'cash_bank') then
    raise exception 'ledger_invalid_source_account %', v_source_account;
  end if;

  select id
    into v_existing_journal_id
  from public.ledger_journals
  where store_id = p_store_id
    and reference_type = 'seller_payout_payment'
    and reference_id = v_reference_id
  limit 1;

  if v_existing_journal_id is not null then
    return v_existing_journal_id;
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
    p_store_id,
    p_payout_id,
    null,
    'seller_payout_payment',
    v_reference_id,
    p_actor_user_id,
    'posted'
  )
  returning id into v_journal_id;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values
    (
      v_journal_id, p_store_id, p_payout_id, null,
      'seller_payable', 'debit', v_amount, v_currency,
      coalesce(p_memo, 'seller payout payment - settle seller payable')
    ),
    (
      v_journal_id, p_store_id, p_payout_id, null,
      v_source_account, 'credit', v_amount, v_currency,
      coalesce(p_memo, 'seller payout payment - cash out')
    );

  return v_journal_id;
end;
$$;

grant execute on function public.ledger_post_order_settlement(
  uuid, numeric, uuid, uuid, uuid, text, text, numeric, numeric, numeric, numeric, text
) to authenticated, service_role;

grant execute on function public.ledger_post_order_settlement_reversal(
  uuid, numeric, uuid, uuid, uuid, text, text, numeric, numeric, numeric, numeric, text
) to authenticated, service_role;

grant execute on function public.ledger_post_customer_refund_accrual(
  uuid, numeric, uuid, uuid, uuid, text, text, text
) to authenticated, service_role;

grant execute on function public.ledger_post_customer_refund_payment(
  uuid, numeric, uuid, uuid, uuid, text, text, text, text
) to authenticated, service_role;

grant execute on function public.ledger_post_seller_payout_payment(
  uuid, uuid, numeric, uuid, text, text, text, text
) to authenticated, service_role;
