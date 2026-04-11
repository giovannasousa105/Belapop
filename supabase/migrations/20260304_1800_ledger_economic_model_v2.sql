-- Ledger economic model v2 (marketplace pass-through shipping + coupon subsidy)
-- Safe/idempotent migration: adds accounts and posting helpers without removing legacy functions.

insert into public.ledger_accounts (code, name, normal_balance)
values
  ('cash_clearing', 'Cash Clearing (gateway)', 'debit'),
  ('cash_bank', 'Cash Bank', 'debit'),
  ('seller_receivable', 'Seller Receivable (quando lojista deve)', 'debit'),
  ('seller_payable', 'Seller Payable (repasse ao lojista)', 'credit'),
  ('customer_refund_payable', 'Customer Refund Payable', 'credit'),
  ('marketplace_fee_revenue', 'Receita de comissao marketplace', 'credit'),
  ('promo_discount_expense', 'Despesa cupom marketplace', 'debit'),
  ('refunds_expense', 'Despesa reembolso cliente', 'debit'),
  ('chargebacks_expense', 'Despesa chargeback', 'debit'),
  ('shipping_pass_through', 'Frete a repassar ao lojista', 'credit'),
  ('gateway_fee_expense', 'Despesa taxa gateway', 'debit')
on conflict (code) do update
set
  name = excluded.name,
  normal_balance = excluded.normal_balance;

create or replace function public.ledger_post_order_settlement_v2(
  p_store_id uuid,
  p_cash_in numeric,
  p_order_id uuid default null,
  p_payout_id uuid default null,
  p_actor_user_id uuid default null,
  p_reference_id text default null,
  p_currency text default 'BRL',
  p_seller_payable numeric default 0,
  p_marketplace_fee numeric default 0,
  p_shipping_pass_through numeric default 0,
  p_memo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference_id text := coalesce(nullif(trim(p_reference_id), ''), p_order_id::text, gen_random_uuid()::text);
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_journal_id uuid;
  v_existing_journal uuid;
  v_cash_in numeric(12,2) := round(coalesce(p_cash_in, 0)::numeric, 2);
  v_seller_payable numeric(12,2) := round(coalesce(p_seller_payable, 0)::numeric, 2);
  v_marketplace_fee numeric(12,2) := round(coalesce(p_marketplace_fee, 0)::numeric, 2);
  v_shipping_pass_through numeric(12,2) := round(coalesce(p_shipping_pass_through, 0)::numeric, 2);
  v_credits numeric(12,2);
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if v_cash_in < 0 or v_seller_payable < 0 or v_marketplace_fee < 0 or v_shipping_pass_through < 0 then
    raise exception 'ledger_negative_amount_not_allowed';
  end if;

  v_credits := round((v_seller_payable + v_marketplace_fee + v_shipping_pass_through)::numeric, 2);
  if v_cash_in <> v_credits then
    raise exception 'ledger_unbalanced_order_settlement_v2 debits=% credits=%', v_cash_in, v_credits;
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'order_settlement_v2'
    and j.reference_id = v_reference_id
  limit 1;

  if v_existing_journal is not null then
    return v_existing_journal;
  end if;

  insert into public.ledger_journals (
    store_id, payout_id, order_id, reference_type, reference_id, created_by, status
  )
  values (
    p_store_id, p_payout_id, p_order_id, 'order_settlement_v2', v_reference_id, p_actor_user_id, 'posted'
  )
  returning id into v_journal_id;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values (
    v_journal_id, p_store_id, p_payout_id, p_order_id,
    'cash_clearing', 'debit', v_cash_in, v_currency,
    coalesce(p_memo, 'order settlement v2 - cash in')
  );

  if v_seller_payable > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'seller_payable', 'credit', v_seller_payable, v_currency,
      coalesce(p_memo, 'order settlement v2 - seller payable')
    );
  end if;

  if v_marketplace_fee > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'marketplace_fee_revenue', 'credit', v_marketplace_fee, v_currency,
      coalesce(p_memo, 'order settlement v2 - marketplace fee revenue')
    );
  end if;

  if v_shipping_pass_through > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'shipping_pass_through', 'credit', v_shipping_pass_through, v_currency,
      coalesce(p_memo, 'order settlement v2 - shipping pass-through')
    );
  end if;

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_coupon_subsidy_v2(
  p_store_id uuid,
  p_coupon_amount numeric,
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
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_journal_id uuid;
  v_existing_journal uuid;
  v_coupon numeric(12,2) := round(coalesce(p_coupon_amount, 0)::numeric, 2);
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if v_coupon <= 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'coupon_subsidy_v2'
    and j.reference_id = v_reference_id
  limit 1;

  if v_existing_journal is not null then
    return v_existing_journal;
  end if;

  insert into public.ledger_journals (
    store_id, payout_id, order_id, reference_type, reference_id, created_by, status
  )
  values (
    p_store_id, p_payout_id, p_order_id, 'coupon_subsidy_v2', v_reference_id, p_actor_user_id, 'posted'
  )
  returning id into v_journal_id;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'promo_discount_expense', 'debit', v_coupon, v_currency,
      coalesce(p_memo, 'coupon subsidy v2 - marketplace expense')
    ),
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'seller_payable', 'credit', v_coupon, v_currency,
      coalesce(p_memo, 'coupon subsidy v2 - reimburse seller payable')
    );

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_order_refund_reversal_v2(
  p_store_id uuid,
  p_cash_reversal numeric,
  p_order_id uuid default null,
  p_payout_id uuid default null,
  p_actor_user_id uuid default null,
  p_reference_id text default null,
  p_currency text default 'BRL',
  p_marketplace_fee numeric default 0,
  p_seller_payable numeric default 0,
  p_shipping_pass_through numeric default 0,
  p_memo text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reference_id text := coalesce(nullif(trim(p_reference_id), ''), p_order_id::text, gen_random_uuid()::text);
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_journal_id uuid;
  v_existing_journal uuid;
  v_cash_reversal numeric(12,2) := round(coalesce(p_cash_reversal, 0)::numeric, 2);
  v_marketplace_fee numeric(12,2) := round(coalesce(p_marketplace_fee, 0)::numeric, 2);
  v_seller_payable numeric(12,2) := round(coalesce(p_seller_payable, 0)::numeric, 2);
  v_shipping_pass_through numeric(12,2) := round(coalesce(p_shipping_pass_through, 0)::numeric, 2);
  v_debits numeric(12,2);
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if v_cash_reversal < 0 or v_marketplace_fee < 0 or v_seller_payable < 0 or v_shipping_pass_through < 0 then
    raise exception 'ledger_negative_amount_not_allowed';
  end if;

  v_debits := round((v_marketplace_fee + v_seller_payable + v_shipping_pass_through)::numeric, 2);
  if v_debits <> v_cash_reversal then
    raise exception 'ledger_unbalanced_order_refund_reversal_v2 debits=% credits=%', v_debits, v_cash_reversal;
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'order_refund_reversal_v2'
    and j.reference_id = v_reference_id
  limit 1;

  if v_existing_journal is not null then
    return v_existing_journal;
  end if;

  insert into public.ledger_journals (
    store_id, payout_id, order_id, reference_type, reference_id, created_by, status
  )
  values (
    p_store_id, p_payout_id, p_order_id, 'order_refund_reversal_v2', v_reference_id, p_actor_user_id, 'posted'
  )
  returning id into v_journal_id;

  if v_marketplace_fee > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'marketplace_fee_revenue', 'debit', v_marketplace_fee, v_currency,
      coalesce(p_memo, 'order refund reversal v2 - reverse marketplace fee')
    );
  end if;

  if v_seller_payable > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'seller_payable', 'debit', v_seller_payable, v_currency,
      coalesce(p_memo, 'order refund reversal v2 - reverse seller payable')
    );
  end if;

  if v_shipping_pass_through > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'shipping_pass_through', 'debit', v_shipping_pass_through, v_currency,
      coalesce(p_memo, 'order refund reversal v2 - reverse shipping pass-through')
    );
  end if;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values (
    v_journal_id, p_store_id, p_payout_id, p_order_id,
    'cash_clearing', 'credit', v_cash_reversal, v_currency,
    coalesce(p_memo, 'order refund reversal v2 - reverse cash clearing')
  );

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_seller_payout_payment_v2(
  p_store_id uuid,
  p_payout_id uuid,
  p_seller_payable_amount numeric,
  p_shipping_pass_through_amount numeric default 0,
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
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_source_account text := coalesce(nullif(trim(p_source_account), ''), 'cash_bank');
  v_journal_id uuid;
  v_existing_journal uuid;
  v_seller_amount numeric(12,2) := round(coalesce(p_seller_payable_amount, 0)::numeric, 2);
  v_shipping_amount numeric(12,2) := round(coalesce(p_shipping_pass_through_amount, 0)::numeric, 2);
  v_total numeric(12,2);
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if p_payout_id is null then
    raise exception 'ledger_payout_required';
  end if;

  if v_seller_amount < 0 or v_shipping_amount < 0 then
    raise exception 'ledger_negative_amount_not_allowed';
  end if;

  v_total := round((v_seller_amount + v_shipping_amount)::numeric, 2);
  if v_total <= 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  if v_source_account not in ('cash_bank', 'cash_clearing') then
    raise exception 'ledger_invalid_source_account %', v_source_account;
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'seller_payout_payment_v2'
    and j.reference_id = v_reference_id
  limit 1;

  if v_existing_journal is not null then
    return v_existing_journal;
  end if;

  insert into public.ledger_journals (
    store_id, payout_id, order_id, reference_type, reference_id, created_by, status
  )
  values (
    p_store_id, p_payout_id, null, 'seller_payout_payment_v2', v_reference_id, p_actor_user_id, 'posted'
  )
  returning id into v_journal_id;

  if v_seller_amount > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, null,
      'seller_payable', 'debit', v_seller_amount, v_currency,
      coalesce(p_memo, 'seller payout payment v2 - settle seller payable')
    );
  end if;

  if v_shipping_amount > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id, p_store_id, p_payout_id, null,
      'shipping_pass_through', 'debit', v_shipping_amount, v_currency,
      coalesce(p_memo, 'seller payout payment v2 - settle shipping pass-through')
    );
  end if;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values (
    v_journal_id, p_store_id, p_payout_id, null,
    v_source_account, 'credit', v_total, v_currency,
    coalesce(p_memo, 'seller payout payment v2 - cash out')
  );

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_seller_recovery_receivable_v1(
  p_store_id uuid,
  p_amount numeric,
  p_order_id uuid default null,
  p_payout_id uuid default null,
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
  v_reference_id text := coalesce(nullif(trim(p_reference_id), ''), p_order_id::text, gen_random_uuid()::text);
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_source_account text := coalesce(nullif(trim(p_source_account), ''), 'cash_bank');
  v_amount numeric(12,2) := round(coalesce(p_amount, 0)::numeric, 2);
  v_journal_id uuid;
  v_existing_journal uuid;
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if v_amount <= 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  if v_source_account not in ('cash_bank', 'cash_clearing') then
    raise exception 'ledger_invalid_source_account %', v_source_account;
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'seller_recovery_receivable_v1'
    and j.reference_id = v_reference_id
  limit 1;

  if v_existing_journal is not null then
    return v_existing_journal;
  end if;

  insert into public.ledger_journals (
    store_id, payout_id, order_id, reference_type, reference_id, created_by, status
  )
  values (
    p_store_id, p_payout_id, p_order_id, 'seller_recovery_receivable_v1', v_reference_id, p_actor_user_id, 'posted'
  )
  returning id into v_journal_id;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'seller_receivable', 'debit', v_amount, v_currency,
      coalesce(p_memo, 'seller recovery receivable - amount due from seller')
    ),
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      v_source_account, 'credit', v_amount, v_currency,
      coalesce(p_memo, 'seller recovery receivable - cash out')
    );

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_gateway_fee_v1(
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
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_source_account text := coalesce(nullif(trim(p_source_account), ''), 'cash_clearing');
  v_amount numeric(12,2) := round(coalesce(p_amount, 0)::numeric, 2);
  v_journal_id uuid;
  v_existing_journal uuid;
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if v_amount <= 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  if v_source_account not in ('cash_bank', 'cash_clearing') then
    raise exception 'ledger_invalid_source_account %', v_source_account;
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'gateway_fee_v1'
    and j.reference_id = v_reference_id
  limit 1;

  if v_existing_journal is not null then
    return v_existing_journal;
  end if;

  insert into public.ledger_journals (
    store_id, payout_id, order_id, reference_type, reference_id, created_by, status
  )
  values (
    p_store_id, p_payout_id, p_order_id, 'gateway_fee_v1', v_reference_id, p_actor_user_id, 'posted'
  )
  returning id into v_journal_id;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'gateway_fee_expense', 'debit', v_amount, v_currency,
      coalesce(p_memo, 'gateway fee - expense recognition')
    ),
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      v_source_account, 'credit', v_amount, v_currency,
      coalesce(p_memo, 'gateway fee - cash out')
    );

  return v_journal_id;
end;
$$;

grant execute on function public.ledger_post_order_settlement_v2(
  uuid, numeric, uuid, uuid, uuid, text, text, numeric, numeric, numeric, text
) to authenticated, service_role;

grant execute on function public.ledger_post_coupon_subsidy_v2(
  uuid, numeric, uuid, uuid, uuid, text, text, text
) to authenticated, service_role;

grant execute on function public.ledger_post_order_refund_reversal_v2(
  uuid, numeric, uuid, uuid, uuid, text, text, numeric, numeric, numeric, text
) to authenticated, service_role;

grant execute on function public.ledger_post_seller_payout_payment_v2(
  uuid, uuid, numeric, numeric, uuid, text, text, text, text
) to authenticated, service_role;

grant execute on function public.ledger_post_seller_recovery_receivable_v1(
  uuid, numeric, uuid, uuid, uuid, text, text, text, text
) to authenticated, service_role;

grant execute on function public.ledger_post_gateway_fee_v1(
  uuid, numeric, uuid, uuid, uuid, text, text, text, text
) to authenticated, service_role;
