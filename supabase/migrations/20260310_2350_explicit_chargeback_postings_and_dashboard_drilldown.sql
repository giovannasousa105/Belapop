-- Explicit semantic postings for finance drill-down.
-- Safe to re-run.

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
    when coalesce(p_reference_type, '') in (
      'chargeback_fee_v1',
      'chargeback_fee'
    ) or coalesce(p_reference_type, '') like 'chargeback_fee%' then 'chargeback_fee'
    when coalesce(p_reference_type, '') in (
      'commission_reversal_v1',
      'commission_reversal'
    ) then 'commission_reversal'
    when coalesce(p_reference_type, '') like 'chargeback%' then 'chargeback'
    when coalesce(p_reference_type, '') in ('gateway_fee_v1') then 'fee'
    when coalesce(p_reference_type, '') like '%adjust%' then 'adjustment'
    else coalesce(nullif(btrim(p_reference_type), ''), 'ledger_transaction')
  end;
$$;

create or replace function public.marketplace_ledger_entry_type_v2(
  p_account_code text,
  p_direction text,
  p_reference_type text,
  p_entry_type text,
  p_memo text default null
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
      and p_direction = 'debit'
      and (
        coalesce(p_reference_type, '') in (
          'order_refund_reversal_v2',
          'commission_reversal_v1',
          'commission_reversal'
        )
        or coalesce(p_reference_type, '') like 'chargeback%'
        or coalesce(p_entry_type, '') = 'commission_reversal'
        or lower(coalesce(p_memo, '')) like '%reverse marketplace fee%'
      ) then 'commission_reversal'
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
    when (
      coalesce(p_reference_type, '') in (
        'seller_payout_payment',
        'seller_payout_payment_v2',
        'payout_payment_final_v1'
      )
      or coalesce(p_reference_type, '') like 'chargeback%'
      or coalesce(p_reference_type, '') in (
        'customer_refund_accrual',
        'customer_refund_payment',
        'order_refund_reversal_v2'
      )
    ) and p_account_code = 'seller_payable'
      and p_direction = 'debit' then 'seller_debit'
    when (
      coalesce(p_reference_type, '') in (
        'chargeback_fee_v1',
        'chargeback_fee'
      )
      or coalesce(p_reference_type, '') like 'chargeback_fee%'
      or (
        coalesce(p_reference_type, '') like 'chargeback%'
        and p_account_code in ('gateway_fee_expense', 'gateway_fee')
        and p_direction = 'debit'
      )
      or coalesce(p_entry_type, '') = 'chargeback_fee'
      or lower(coalesce(p_memo, '')) like '%chargeback fee%'
      or lower(coalesce(p_memo, '')) like '%chargeback%fee%'
    ) and p_account_code in ('gateway_fee_expense', 'gateway_fee') then 'chargeback_fee'
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
    when p_account_code in ('chargebacks_expense', 'chargeback_expense') then 'chargeback'
    when coalesce(p_reference_type, '') like 'chargeback%' then 'chargeback'
    when p_account_code in ('gateway_fee_expense', 'gateway_fee') then 'fee'
    else coalesce(nullif(btrim(p_entry_type), ''), p_account_code, 'ledger_entry')
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
  select public.marketplace_ledger_entry_type_v2(
    p_account_code,
    p_direction,
    p_reference_type,
    p_entry_type,
    null
  );
$$;

create or replace view public.marketplace_ledger_entries as
select
  le.id,
  le.order_id,
  le.store_id as seller_id,
  le.user_id,
  public.marketplace_ledger_entry_type_v2(
    le.account_code,
    le.direction,
    lj.reference_type,
    le.entry_type,
    le.memo
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
  public.marketplace_ledger_entry_type_v2(
    le.account_code,
    le.direction,
    lj.reference_type,
    le.entry_type,
    le.memo
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
