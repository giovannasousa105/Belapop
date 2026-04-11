-- Final postings model v1
-- Cupom bancado pelo marketplace
-- Frete do lojista como pass-through componente (Dr/Cr no mesmo journal)
-- seller_payable representa total devido ao lojista

create or replace function public.ledger_post_order_settlement_final_v1(
  p_store_id uuid,
  p_cash_in numeric,
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

  v_cash_in numeric(12,2) := round(coalesce(p_cash_in, 0)::numeric, 2);
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

  if v_cash_in < 0 or v_fee < 0 or v_coupon < 0 or v_seller < 0 or v_shipping < 0 then
    raise exception 'ledger_negative_amount_not_allowed';
  end if;

  if v_shipping > v_seller then
    raise exception 'ledger_shipping_component_gt_seller_payable';
  end if;

  -- Core economic identity:
  -- cash_in + coupon_marketplace = marketplace_fee + seller_payable
  v_debits := round((v_cash_in + v_coupon)::numeric, 2);
  v_credits := round((v_fee + v_seller)::numeric, 2);

  if v_debits <> v_credits then
    raise exception 'ledger_unbalanced_order_settlement_final_v1 core_debits=% core_credits=%', v_debits, v_credits;
  end if;

  if v_cash_in = 0 and v_fee = 0 and v_coupon = 0 and v_seller = 0 and v_shipping = 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'order_settlement_final_v1'
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
    'order_settlement_final_v1',
    v_reference_id,
    p_actor_user_id,
    'posted'
  )
  returning id into v_journal_id;

  -- Dr cash_clearing = GMV
  if v_cash_in > 0 then
    insert into public.ledger_entries (
      journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
    )
    values (
      v_journal_id,
      p_store_id,
      p_payout_id,
      p_order_id,
      'cash_clearing',
      'debit',
      v_cash_in,
      v_currency,
      coalesce(p_memo, 'order settlement final v1 - cash in')
    );
  end if;

  -- Dr promo_discount_expense = coupon marketplace
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
      'debit',
      v_coupon,
      v_currency,
      coalesce(p_memo, 'order settlement final v1 - marketplace coupon expense')
    );
  end if;

  -- shipping component (net zero in same journal)
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
      coalesce(p_memo, 'order settlement final v1 - shipping component mirror debit')
    );
  end if;

  -- Cr fee revenue
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
      'credit',
      v_fee,
      v_currency,
      coalesce(p_memo, 'order settlement final v1 - marketplace fee revenue')
    );
  end if;

  -- Cr seller_payable (total due to seller)
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
      'credit',
      v_seller,
      v_currency,
      coalesce(p_memo, 'order settlement final v1 - seller payable total')
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
      coalesce(p_memo, 'order settlement final v1 - shipping component mirror credit')
    );
  end if;

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_order_settlement_reversal_final_v1(
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

  -- Mirror of settlement core economic identity
  v_debits := round((v_fee + v_seller)::numeric, 2);
  v_credits := round((v_cash + v_coupon)::numeric, 2);

  if v_debits <> v_credits then
    raise exception 'ledger_unbalanced_order_settlement_reversal_final_v1 core_debits=% core_credits=%', v_debits, v_credits;
  end if;

  if v_cash = 0 and v_fee = 0 and v_coupon = 0 and v_seller = 0 and v_shipping = 0 then
    raise exception 'ledger_amount_must_be_positive';
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'order_settlement_reversal_final_v1'
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
    'order_settlement_reversal_final_v1',
    v_reference_id,
    p_actor_user_id,
    'posted'
  )
  returning id into v_journal_id;

  -- Dr marketplace_fee_revenue
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
      coalesce(p_memo, 'order settlement reversal final v1 - reverse marketplace fee')
    );
  end if;

  -- Dr seller_payable
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
      coalesce(p_memo, 'order settlement reversal final v1 - reverse seller payable')
    );
  end if;

  -- shipping component mirror debit
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
      coalesce(p_memo, 'order settlement reversal final v1 - shipping component mirror debit')
    );
  end if;

  -- Cr cash_clearing
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
      coalesce(p_memo, 'order settlement reversal final v1 - reverse cash clearing')
    );
  end if;

  -- Cr promo_discount_expense
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
      coalesce(p_memo, 'order settlement reversal final v1 - reverse coupon expense')
    );
  end if;

  -- shipping component mirror credit
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
      coalesce(p_memo, 'order settlement reversal final v1 - shipping component mirror credit')
    );
  end if;

  return v_journal_id;
end;
$$;

create or replace function public.ledger_post_payout_payment_final_v1(
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
  v_currency text := coalesce(nullif(upper(trim(p_currency)), ''), 'BRL');
  v_source_account text := coalesce(nullif(trim(p_source_account), ''), 'cash_bank');
  v_amount numeric(12,2) := round(coalesce(p_amount, 0)::numeric, 2);
  v_journal_id uuid;
  v_existing_journal uuid;
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

  if v_source_account not in ('cash_bank', 'cash_clearing') then
    raise exception 'ledger_invalid_source_account %', v_source_account;
  end if;

  select j.id
    into v_existing_journal
  from public.ledger_journals j
  where j.store_id = p_store_id
    and j.reference_type = 'payout_payment_final_v1'
    and j.reference_id = v_reference_id
  limit 1;

  if v_existing_journal is not null then
    return v_existing_journal;
  end if;

  insert into public.ledger_journals (
    store_id, payout_id, order_id, reference_type, reference_id, created_by, status
  )
  values (
    p_store_id, p_payout_id, null, 'payout_payment_final_v1', v_reference_id, p_actor_user_id, 'posted'
  )
  returning id into v_journal_id;

  insert into public.ledger_entries (
    journal_id, store_id, payout_id, order_id, account_code, direction, amount, currency, memo
  )
  values
    (
      v_journal_id, p_store_id, p_payout_id, null,
      'seller_payable', 'debit', v_amount, v_currency,
      coalesce(p_memo, 'payout payment final v1 - settle seller payable')
    ),
    (
      v_journal_id, p_store_id, p_payout_id, null,
      v_source_account, 'credit', v_amount, v_currency,
      coalesce(p_memo, 'payout payment final v1 - cash out')
    );

  return v_journal_id;
end;
$$;

grant execute on function public.ledger_post_order_settlement_final_v1(
  uuid, numeric, numeric, numeric, numeric, numeric, uuid, uuid, uuid, text, text, text
) to authenticated, service_role;

grant execute on function public.ledger_post_order_settlement_reversal_final_v1(
  uuid, numeric, numeric, numeric, numeric, numeric, uuid, uuid, uuid, text, text, text
) to authenticated, service_role;

grant execute on function public.ledger_post_payout_payment_final_v1(
  uuid, uuid, numeric, uuid, text, text, text, text
) to authenticated, service_role;
