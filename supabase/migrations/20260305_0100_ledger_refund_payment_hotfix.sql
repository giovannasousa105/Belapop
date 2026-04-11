-- Hotfix: normalize refund payment ledger function and required accounts.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

-- Ensure required ledger accounts exist for refund flows.
insert into public.ledger_accounts (code, name, normal_balance)
values
  ('customer_refund_payable', 'Customer Refund Payable', 'credit'),
  ('refunds_expense', 'Refunds Expense', 'debit'),
  ('cash_clearing', 'Cash Clearing', 'debit'),
  ('cash_bank', 'Cash Bank', 'debit')
on conflict (code) do update
set
  name = excluded.name,
  normal_balance = excluded.normal_balance;

-- Canonical function signature used by refund payment postings.
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

grant execute on function public.ledger_post_customer_refund_payment(
  uuid,
  numeric,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text
) to anon, authenticated, service_role;
