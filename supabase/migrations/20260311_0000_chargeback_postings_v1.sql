-- Explicit chargeback economic journals.
-- Safe to re-run.

create or replace function public.ledger_post_chargeback_reversal_final_v1(
  p_store_id uuid,
  p_cash_reversal numeric,
  p_marketplace_fee numeric,
  p_coupon_marketplace numeric,
  p_seller_payable numeric,
  p_shipping_component numeric,
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

  v_cash numeric(12,2) := round(coalesce(p_cash_reversal, 0)::numeric, 2);
  v_fee numeric(12,2) := round(coalesce(p_marketplace_fee, 0)::numeric, 2);
  v_coupon numeric(12,2) := round(coalesce(p_coupon_marketplace, 0)::numeric, 2);
  v_seller numeric(12,2) := round(coalesce(p_seller_payable, 0)::numeric, 2);
  v_shipping numeric(12,2) := round(coalesce(p_shipping_component, 0)::numeric, 2);

  v_debits numeric(12,2);
  v_credits numeric(12,2);
begin
  if p_store_id is null then
    raise exception 'ledger_store_required';
  end if;

  if v_cash < 0 or v_fee < 0 or v_coupon < 0 or v_seller < 0 or v_shipping < 0 then
    raise exception 'ledger_negative_amount_not_allowed';
  end if;

  if v_shipping > v_seller then
    raise exception 'ledger_shipping_component_gt_seller_payable';
  end if;

  v_debits := round((v_fee + v_seller)::numeric, 2);
  v_credits := round((v_cash + v_coupon)::numeric, 2);

  if v_debits <> v_credits then
    raise exception 'ledger_unbalanced_chargeback_reversal_final_v1 debits=% credits=%', v_debits, v_credits;
  end if;

  if v_cash = 0 and v_fee = 0 and v_coupon = 0 and v_seller = 0 and v_shipping = 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'chargeback_reversal_final_v1'
    and j.reference_id = v_reference_id
  limit 1;

  if v_existing_journal is not null then
    return v_existing_journal;
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
    'chargeback_reversal_final_v1',
    v_reference_id,
    p_actor_user_id,
    'posted'
  )
  returning id into v_journal_id;

  if v_fee > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      p_store_id,
      p_payout_id,
      p_order_id,
      'marketplace_fee_revenue',
      'debit',
      v_fee,
      v_currency,
      coalesce(p_memo, 'chargeback reversal final v1 - reverse marketplace fee')
    );
  end if;

  if v_seller > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      p_store_id,
      p_payout_id,
      p_order_id,
      'seller_payable',
      'debit',
      v_seller,
      v_currency,
      coalesce(p_memo, 'chargeback reversal final v1 - reverse seller payable')
    );
  end if;

  if v_shipping > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      p_store_id,
      p_payout_id,
      p_order_id,
      'shipping_pass_through',
      'debit',
      v_shipping,
      v_currency,
      coalesce(p_memo, 'chargeback reversal final v1 - shipping component mirror debit')
    );
  end if;

  if v_cash > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      p_store_id,
      p_payout_id,
      p_order_id,
      'cash_clearing',
      'credit',
      v_cash,
      v_currency,
      coalesce(p_memo, 'chargeback reversal final v1 - reverse cash clearing')
    );
  end if;

  if v_coupon > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      p_store_id,
      p_payout_id,
      p_order_id,
      'promo_discount_expense',
      'credit',
      v_coupon,
      v_currency,
      coalesce(p_memo, 'chargeback reversal final v1 - reverse coupon expense')
    );
  end if;

  if v_shipping > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      p_store_id,
      p_payout_id,
      p_order_id,
      'shipping_pass_through',
      'credit',
      v_shipping,
      v_currency,
      coalesce(p_memo, 'chargeback reversal final v1 - shipping component mirror credit')
    );
  end if;

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_chargeback_fee_v1(
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
    and j.reference_type = 'chargeback_fee_v1'
    and j.reference_id = v_reference_id
  limit 1;

  if v_existing_journal is not null then
    return v_existing_journal;
  end if;

  insert into public.ledger_journals (
    store_id, payout_id, order_id, reference_type, reference_id, created_by, status
  )
  values (
    p_store_id, p_payout_id, p_order_id, 'chargeback_fee_v1', v_reference_id, p_actor_user_id, 'posted'
  )
  returning id into v_journal_id;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      'gateway_fee_expense', 'debit', v_amount, v_currency,
      coalesce(p_memo, 'chargeback fee v1 - gateway dispute fee expense')
    ),
    (
      v_journal_id, p_store_id, p_payout_id, p_order_id,
      v_source_account, 'credit', v_amount, v_currency,
      coalesce(p_memo, 'chargeback fee v1 - cash out')
    );

  return v_journal_id;
end;
$$;

grant execute on function public.ledger_post_chargeback_reversal_final_v1(
  uuid, numeric, numeric, numeric, numeric, numeric, uuid, uuid, uuid, text, text, text
) to authenticated, service_role;

grant execute on function public.ledger_post_chargeback_fee_v1(
  uuid, numeric, uuid, uuid, uuid, text, text, text, text
) to authenticated, service_role;
