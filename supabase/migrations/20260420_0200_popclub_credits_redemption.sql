-- PopClub credits redemption foundation.
-- Adds immutable debit entries, order/checkout linkage, idempotent application, and automatic reversals.

create extension if not exists "pgcrypto";

alter table if exists public.orders
  add column if not exists credits_applied_cents integer not null default 0
    check (credits_applied_cents >= 0),
  add column if not exists credits_reversed_cents integer not null default 0
    check (credits_reversed_cents >= 0),
  add column if not exists credit_redemption_status text not null default 'not_applied'
    check (
      credit_redemption_status in ('not_applied', 'applied', 'partially_reversed', 'reversed')
    );

alter table if exists public.checkout_payment_sessions
  add column if not exists requested_credit_cents integer not null default 0
    check (requested_credit_cents >= 0),
  add column if not exists credit_applied_cents integer not null default 0
    check (credit_applied_cents >= 0),
  add column if not exists credit_redemption_id uuid null;

alter table if exists public.popclub_credits_ledger
  drop constraint if exists popclub_credits_ledger_event_name_check;

alter table if exists public.popclub_credits_ledger
  add constraint popclub_credits_ledger_event_name_check
    check (
      event_name in (
        'order_paid',
        'refund_settled',
        'chargeback_opened',
        'order_canceled',
        'credit_redeemed',
        'credit_expired',
        'manual_adjustment',
        'backfill_adjustment'
      )
    );

create unique index if not exists uq_popclub_credits_ledger_order_credit_redeemed
  on public.popclub_credits_ledger (order_id, event_name)
  where order_id is not null
    and event_name = 'credit_redeemed'
    and entry_kind = 'redeem';

create table if not exists public.popclub_credit_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkout_session_id uuid null references public.checkout_payment_sessions(id) on delete set null,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  ledger_entry_id uuid not null unique references public.popclub_credits_ledger(id) on delete restrict,
  requested_amount_cents integer not null default 0
    check (requested_amount_cents >= 0),
  applied_amount_cents integer not null
    check (applied_amount_cents > 0),
  reversed_amount_cents integer not null default 0
    check (reversed_amount_cents >= 0 and reversed_amount_cents <= applied_amount_cents),
  financial_reversed_cents integer not null default 0
    check (financial_reversed_cents >= 0),
  status text not null default 'applied'
    check (status in ('applied', 'partially_reversed', 'reversed')),
  source text not null default 'checkout',
  source_idempotency_key text not null,
  source_event_at timestamptz not null default now(),
  latest_reversal_event_name text null
    check (
      latest_reversal_event_name is null
      or latest_reversal_event_name in ('order_canceled', 'refund_settled', 'chargeback_opened', 'manual_adjustment')
    ),
  latest_reversal_source_idempotency_key text null,
  latest_reversal_event_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_popclub_credit_redemptions_source_idempotency
  on public.popclub_credit_redemptions (source_idempotency_key);

create index if not exists idx_popclub_credit_redemptions_user_status
  on public.popclub_credit_redemptions (user_id, status, source_event_at desc, updated_at desc);

create index if not exists idx_popclub_credit_redemptions_checkout
  on public.popclub_credit_redemptions (checkout_session_id)
  where checkout_session_id is not null;

create index if not exists idx_popclub_credit_redemptions_order
  on public.popclub_credit_redemptions (order_id, updated_at desc);

drop trigger if exists trg_popclub_credit_redemptions_updated on public.popclub_credit_redemptions;
create trigger trg_popclub_credit_redemptions_updated
before update on public.popclub_credit_redemptions
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'checkout_payment_sessions_credit_redemption_id_fkey'
  ) then
    alter table public.checkout_payment_sessions
      add constraint checkout_payment_sessions_credit_redemption_id_fkey
      foreign key (credit_redemption_id)
      references public.popclub_credit_redemptions(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists idx_checkout_payment_sessions_credit_redemption
  on public.checkout_payment_sessions (credit_redemption_id)
  where credit_redemption_id is not null;

create or replace function public.popclub_refresh_membership_benefits(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credit_balance integer := 0;
  v_lifetime_credits_granted integer := 0;
  v_lifetime_credits_reversed integer := 0;
  v_latest_sample_slots integer := 0;
  v_latest_sample_status text;
begin
  if p_user_id is null then
    return;
  end if;

  perform public.popclub_refresh_membership(p_user_id);

  select
    greatest(coalesce(sum(cl.amount_cents), 0), 0)::integer,
    coalesce(
      sum(
        case
          when cl.entry_kind in ('grant', 'adjustment') and cl.amount_cents > 0 then cl.amount_cents
          else 0
        end
      ),
      0
    )::integer,
    abs(
      coalesce(
        sum(
          case
            when cl.entry_kind = 'reversal' and cl.amount_cents < 0 then cl.amount_cents
            else 0
          end
        ),
        0
      )
    )::integer
  into
    v_credit_balance,
    v_lifetime_credits_granted,
    v_lifetime_credits_reversed
  from public.popclub_credits_ledger cl
  where cl.user_id = p_user_id;

  select
    sed.sample_slots,
    sed.status
  into
    v_latest_sample_slots,
    v_latest_sample_status
  from public.popclub_sample_eligibility_decisions sed
  where sed.user_id = p_user_id
  order by coalesce(sed.reversal_event_at, sed.source_event_at) desc, sed.updated_at desc
  limit 1;

  update public.popclub_memberships
  set
    credit_balance_cents = v_credit_balance,
    lifetime_credits_granted_cents = v_lifetime_credits_granted,
    lifetime_credits_reversed_cents = v_lifetime_credits_reversed,
    latest_sample_slots = coalesce(v_latest_sample_slots, 0),
    latest_sample_status = v_latest_sample_status,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'benefits_refreshed_at', now(),
      'benefits_refresh_source', 'popclub_refresh_membership_benefits'
    ),
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

create or replace function public.popclub_apply_credit_redemption(
  p_user_id uuid,
  p_order_id uuid,
  p_checkout_session_id uuid default null,
  p_requested_amount_cents integer default 0,
  p_source_idempotency_key text default null,
  p_source_event_at timestamptz default now(),
  p_source text default 'checkout'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_redemption public.popclub_credit_redemptions%rowtype;
  v_requested_amount_cents integer := greatest(coalesce(p_requested_amount_cents, 0), 0);
  v_available_balance_cents integer := 0;
  v_gross_total_cents integer := 0;
  v_payable_total_cents integer := 0;
  v_applied_amount_cents integer := 0;
  v_source_idempotency_key text;
  v_tier_id text := 'essencial';
  v_ledger_entry_id uuid;
begin
  if p_user_id is null or p_order_id is null then
    return jsonb_build_object(
      'redemption_id', null,
      'applied_amount_cents', 0,
      'requested_amount_cents', v_requested_amount_cents,
      'available_balance_cents', 0,
      'order_total_cents', 0,
      'source_idempotency_key', null,
      'status', 'not_applied'
    );
  end if;

  perform pg_advisory_xact_lock(hashtext(format('popclub:credit-redemption:%s', p_user_id))::bigint);

  select *
  into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  if not found then
    raise exception 'PopClub credit redemption order not found: %', p_order_id;
  end if;

  if coalesce(v_order.buyer_id, v_order.customer_id) is distinct from p_user_id then
    raise exception 'PopClub credit redemption order % does not belong to %', p_order_id, p_user_id;
  end if;

  v_source_idempotency_key := coalesce(
    nullif(btrim(p_source_idempotency_key), ''),
    format('popclub:credit_redeemed:%s', p_order_id)
  );

  if p_checkout_session_id is not null then
    update public.checkout_payment_sessions
    set
      requested_credit_cents = v_requested_amount_cents,
      updated_at = now()
    where id = p_checkout_session_id;
  end if;

  select *
  into v_redemption
  from public.popclub_credit_redemptions r
  where r.source_idempotency_key = v_source_idempotency_key
  limit 1;

  if not found then
    select *
    into v_redemption
    from public.popclub_credit_redemptions r
    where r.order_id = p_order_id
    limit 1;
  end if;

  if found then
    if p_checkout_session_id is not null then
      update public.popclub_credit_redemptions
      set
        checkout_session_id = p_checkout_session_id,
        updated_at = now()
      where id = v_redemption.id
        and checkout_session_id is distinct from p_checkout_session_id;
    end if;

    update public.orders
    set
      credits_applied_cents = greatest(coalesce(credits_applied_cents, 0), v_redemption.applied_amount_cents),
      credits_reversed_cents = greatest(coalesce(credits_reversed_cents, 0), v_redemption.reversed_amount_cents),
      credit_redemption_status = coalesce(v_redemption.status, 'applied')
    where id = p_order_id;

    if p_checkout_session_id is not null then
      update public.checkout_payment_sessions
      set
        requested_credit_cents = greatest(v_requested_amount_cents, v_redemption.requested_amount_cents),
        credit_applied_cents = v_redemption.applied_amount_cents,
        credit_redemption_id = v_redemption.id,
        updated_at = now()
      where id = p_checkout_session_id;
    end if;

    return jsonb_build_object(
      'redemption_id', v_redemption.id,
      'applied_amount_cents', v_redemption.applied_amount_cents,
      'requested_amount_cents', greatest(v_requested_amount_cents, v_redemption.requested_amount_cents),
      'available_balance_cents', public.popclub_credits_balance(p_user_id),
      'order_total_cents', greatest(coalesce(v_order.total_order_cents, 0), 0),
      'source_idempotency_key', v_source_idempotency_key,
      'status', coalesce(v_redemption.status, 'applied')
    );
  end if;

  v_gross_total_cents := greatest(
    coalesce(v_order.total_products_cents, 0) + coalesce(v_order.total_shipping_cents, 0),
    coalesce(v_order.total_order_cents, 0),
    0
  );
  v_payable_total_cents := greatest(coalesce(v_order.total_order_cents, v_gross_total_cents), 0);
  v_available_balance_cents := public.popclub_credits_balance(p_user_id);

  select pm.current_tier
  into v_tier_id
  from public.popclub_memberships pm
  where pm.user_id = p_user_id;

  if v_tier_id is null then
    v_tier_id := public.popclub_resolve_tier(public.popclub_points_balance(p_user_id));
  end if;

  v_applied_amount_cents := least(
    v_requested_amount_cents,
    v_available_balance_cents,
    v_payable_total_cents
  );

  if v_applied_amount_cents <= 0 then
    if p_checkout_session_id is not null then
      update public.checkout_payment_sessions
      set
        credit_applied_cents = 0,
        updated_at = now()
      where id = p_checkout_session_id;
    end if;

    return jsonb_build_object(
      'redemption_id', null,
      'applied_amount_cents', 0,
      'requested_amount_cents', v_requested_amount_cents,
      'available_balance_cents', v_available_balance_cents,
      'order_total_cents', v_payable_total_cents,
      'source_idempotency_key', v_source_idempotency_key,
      'status', 'not_applied'
    );
  end if;

  insert into public.popclub_credits_ledger (
    user_id,
    order_id,
    tier_id,
    event_name,
    entry_kind,
    amount_cents,
    source,
    source_idempotency_key,
    source_event_at,
    metadata
  )
  values (
    p_user_id,
    p_order_id,
    v_tier_id,
    'credit_redeemed',
    'redeem',
    -v_applied_amount_cents,
    coalesce(nullif(p_source, ''), 'checkout'),
    v_source_idempotency_key,
    coalesce(p_source_event_at, now()),
    jsonb_build_object(
      'requested_amount_cents', v_requested_amount_cents,
      'applied_amount_cents', v_applied_amount_cents,
      'available_balance_cents_before', v_available_balance_cents,
      'gross_total_cents', v_gross_total_cents,
      'payable_total_cents_before', v_payable_total_cents,
      'checkout_session_id', p_checkout_session_id,
      'order_id', p_order_id,
      'source', coalesce(nullif(p_source, ''), 'checkout')
    )
  )
  returning id into v_ledger_entry_id;

  insert into public.popclub_credit_redemptions (
    user_id,
    checkout_session_id,
    order_id,
    ledger_entry_id,
    requested_amount_cents,
    applied_amount_cents,
    status,
    source,
    source_idempotency_key,
    source_event_at,
    metadata
  )
  values (
    p_user_id,
    p_checkout_session_id,
    p_order_id,
    v_ledger_entry_id,
    v_requested_amount_cents,
    v_applied_amount_cents,
    'applied',
    coalesce(nullif(p_source, ''), 'checkout'),
    v_source_idempotency_key,
    coalesce(p_source_event_at, now()),
    jsonb_build_object(
      'gross_total_cents', v_gross_total_cents,
      'payable_total_cents_before', v_payable_total_cents,
      'checkout_session_id', p_checkout_session_id,
      'source', coalesce(nullif(p_source, ''), 'checkout')
    )
  )
  returning * into v_redemption;

  update public.orders
  set
    credits_applied_cents = v_applied_amount_cents,
    credits_reversed_cents = 0,
    credit_redemption_status = 'applied',
    total_order_cents = greatest(v_payable_total_cents - v_applied_amount_cents, 0)
  where id = p_order_id;

  if p_checkout_session_id is not null then
    update public.checkout_payment_sessions
    set
      requested_credit_cents = v_requested_amount_cents,
      credit_applied_cents = v_applied_amount_cents,
      credit_redemption_id = v_redemption.id,
      updated_at = now()
    where id = p_checkout_session_id;
  end if;

  perform public.popclub_refresh_membership_benefits(p_user_id);

  return jsonb_build_object(
    'redemption_id', v_redemption.id,
    'applied_amount_cents', v_applied_amount_cents,
    'requested_amount_cents', v_requested_amount_cents,
    'available_balance_cents', public.popclub_credits_balance(p_user_id),
    'order_total_cents', greatest(v_payable_total_cents - v_applied_amount_cents, 0),
    'source_idempotency_key', v_source_idempotency_key,
    'status', 'applied'
  );
end;
$$;

create or replace function public.popclub_reverse_credit_redemption(
  p_order_id uuid,
  p_event_name text,
  p_reversal_amount_cents integer default null,
  p_source_idempotency_key text default null,
  p_source_event_at timestamptz default now(),
  p_source text default 'marketplace_events'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_redemption public.popclub_credit_redemptions%rowtype;
  v_event_name text := coalesce(nullif(btrim(p_event_name), ''), 'refund_settled');
  v_requested_reversal_cents integer := 0;
  v_payable_total_cents integer := 0;
  v_financial_reversed_after integer := 0;
  v_target_reversal_cents integer := 0;
  v_restore_cents integer := 0;
  v_reversed_total_cents integer := 0;
  v_status text := 'applied';
  v_source_idempotency_key text;
begin
  if p_order_id is null then
    return jsonb_build_object(
      'redemption_id', null,
      'applied_amount_cents', 0,
      'requested_amount_cents', 0,
      'available_balance_cents', 0,
      'order_total_cents', 0,
      'source_idempotency_key', null,
      'status', 'not_applied'
    );
  end if;

  if v_event_name not in ('order_canceled', 'refund_settled', 'chargeback_opened', 'manual_adjustment') then
    raise exception 'PopClub credit redemption reversal event is invalid: %', v_event_name;
  end if;

  select *
  into v_redemption
  from public.popclub_credit_redemptions r
  where r.order_id = p_order_id
  for update;

  if not found then
    return jsonb_build_object(
      'redemption_id', null,
      'applied_amount_cents', 0,
      'requested_amount_cents', 0,
      'available_balance_cents', 0,
      'order_total_cents', 0,
      'source_idempotency_key', null,
      'status', 'not_applied'
    );
  end if;

  perform pg_advisory_xact_lock(hashtext(format('popclub:credit-redemption:%s', v_redemption.user_id))::bigint);

  select *
  into v_order
  from public.orders o
  where o.id = p_order_id
  for update;

  v_source_idempotency_key := coalesce(
    nullif(btrim(p_source_idempotency_key), ''),
    format(
      'popclub:credit_redemption:%s:%s:%s',
      v_event_name,
      p_order_id,
      greatest(coalesce(p_reversal_amount_cents, 0), 0)
    )
  );

  if exists (
    select 1
    from public.popclub_credits_ledger cl
    where cl.source_idempotency_key = v_source_idempotency_key
  ) then
    return jsonb_build_object(
      'redemption_id', v_redemption.id,
      'applied_amount_cents', v_redemption.applied_amount_cents,
      'requested_amount_cents', v_redemption.requested_amount_cents,
      'available_balance_cents', public.popclub_credits_balance(v_redemption.user_id),
      'order_total_cents', greatest(coalesce(v_order.total_order_cents, 0), 0),
      'source_idempotency_key', v_source_idempotency_key,
      'status', v_redemption.status
    );
  end if;

  v_payable_total_cents := greatest(coalesce(v_order.total_order_cents, 0), 0);
  if v_payable_total_cents <= 0 then
    v_payable_total_cents := greatest(v_redemption.applied_amount_cents, 0);
  end if;

  if v_event_name = 'order_canceled' then
    v_financial_reversed_after := v_payable_total_cents;
  else
    v_requested_reversal_cents := least(
      greatest(coalesce(p_reversal_amount_cents, v_payable_total_cents), 0),
      v_payable_total_cents
    );
    v_financial_reversed_after := least(
      v_payable_total_cents,
      greatest(coalesce(v_redemption.financial_reversed_cents, 0), 0) + v_requested_reversal_cents
    );
  end if;

  if v_payable_total_cents <= 0 or v_financial_reversed_after >= v_payable_total_cents then
    v_target_reversal_cents := v_redemption.applied_amount_cents;
  else
    v_target_reversal_cents := floor(
      (
        v_redemption.applied_amount_cents::numeric
        * v_financial_reversed_after::numeric
      ) / nullif(v_payable_total_cents::numeric, 0)
    )::integer;
  end if;

  v_target_reversal_cents := least(
    greatest(v_target_reversal_cents, 0),
    v_redemption.applied_amount_cents
  );
  v_restore_cents := greatest(
    v_target_reversal_cents - coalesce(v_redemption.reversed_amount_cents, 0),
    0
  );
  v_reversed_total_cents := coalesce(v_redemption.reversed_amount_cents, 0) + v_restore_cents;

  if v_restore_cents > 0 then
    insert into public.popclub_credits_ledger (
      user_id,
      order_id,
      tier_id,
      event_name,
      entry_kind,
      amount_cents,
      source,
      source_idempotency_key,
      source_event_at,
      metadata
    )
    values (
      v_redemption.user_id,
      v_redemption.order_id,
      (
        select coalesce(pm.current_tier, public.popclub_resolve_tier(public.popclub_points_balance(v_redemption.user_id)))
        from public.popclub_memberships pm
        where pm.user_id = v_redemption.user_id
        union all
        select public.popclub_resolve_tier(public.popclub_points_balance(v_redemption.user_id))
        limit 1
      ),
      v_event_name,
      'reversal',
      v_restore_cents,
      coalesce(nullif(p_source, ''), 'marketplace_events'),
      v_source_idempotency_key,
      coalesce(p_source_event_at, now()),
      jsonb_build_object(
        'credit_redemption_id', v_redemption.id,
        'financial_reversed_cents_before', coalesce(v_redemption.financial_reversed_cents, 0),
        'financial_reversed_cents_after', v_financial_reversed_after,
        'requested_reversal_cents', greatest(coalesce(p_reversal_amount_cents, 0), 0),
        'restored_amount_cents', v_restore_cents,
        'source', coalesce(nullif(p_source, ''), 'marketplace_events')
      )
    )
    on conflict (source_idempotency_key) do nothing;
  end if;

  v_status := case
    when v_reversed_total_cents >= v_redemption.applied_amount_cents then 'reversed'
    when v_reversed_total_cents > 0 then 'partially_reversed'
    else 'applied'
  end;

  update public.popclub_credit_redemptions
  set
    reversed_amount_cents = v_reversed_total_cents,
    financial_reversed_cents = greatest(
      coalesce(financial_reversed_cents, 0),
      v_financial_reversed_after
    ),
    status = v_status,
    latest_reversal_event_name = v_event_name,
    latest_reversal_source_idempotency_key = v_source_idempotency_key,
    latest_reversal_event_at = coalesce(p_source_event_at, now()),
    metadata = metadata || jsonb_build_object(
      'latest_reversal_source', coalesce(nullif(p_source, ''), 'marketplace_events'),
      'latest_reversal_amount_cents', v_restore_cents,
      'financial_reversed_cents', v_financial_reversed_after
    ),
    updated_at = now()
  where id = v_redemption.id;

  update public.orders
  set
    credits_reversed_cents = greatest(coalesce(credits_reversed_cents, 0), v_reversed_total_cents),
    credit_redemption_status = v_status
  where id = p_order_id;

  perform public.popclub_refresh_membership_benefits(v_redemption.user_id);

  return jsonb_build_object(
    'redemption_id', v_redemption.id,
    'applied_amount_cents', v_redemption.applied_amount_cents,
    'requested_amount_cents', v_redemption.requested_amount_cents,
    'available_balance_cents', public.popclub_credits_balance(v_redemption.user_id),
    'order_total_cents', v_payable_total_cents,
    'source_idempotency_key', v_source_idempotency_key,
    'status', v_status
  );
end;
$$;

create or replace function public.popclub_project_marketplace_event_to_credit_redemptions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_id is null then
    return new;
  end if;

  if new.event_name in ('order_canceled', 'refund_settled', 'chargeback_opened') then
    perform public.popclub_reverse_credit_redemption(
      new.order_id,
      new.event_name,
      case
        when new.event_name = 'order_canceled' then null
        else new.amount_cents
      end,
      coalesce(
        nullif(new.idempotency_key, ''),
        format('marketplace_event:%s:credit_redemption:%s', new.id, new.event_name)
      ),
      coalesce(new.occurred_at, now()),
      coalesce(nullif(new.source, ''), 'marketplace_events')
    );
  end if;

  return new;
exception
  when others then
    raise warning
      'PopClub credit redemption projection failed for marketplace_event % (%): %',
      new.id,
      new.event_name,
      sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_marketplace_events_popclub_credit_redemptions on public.marketplace_events;
create trigger trg_marketplace_events_popclub_credit_redemptions
after insert on public.marketplace_events
for each row execute function public.popclub_project_marketplace_event_to_credit_redemptions();

revoke all on function public.popclub_refresh_membership_benefits(uuid) from public;
grant execute on function public.popclub_refresh_membership_benefits(uuid) to service_role;

revoke all on function public.popclub_apply_credit_redemption(uuid, uuid, uuid, integer, text, timestamptz, text) from public;
grant execute on function public.popclub_apply_credit_redemption(uuid, uuid, uuid, integer, text, timestamptz, text) to service_role;

revoke all on function public.popclub_reverse_credit_redemption(uuid, text, integer, text, timestamptz, text) from public;
grant execute on function public.popclub_reverse_credit_redemption(uuid, text, integer, text, timestamptz, text) to service_role;

revoke all on function public.popclub_project_marketplace_event_to_credit_redemptions() from public;
grant execute on function public.popclub_project_marketplace_event_to_credit_redemptions() to service_role;

do $$
begin
  if to_regclass('public.popclub_credit_redemptions') is not null then
    alter table public.popclub_credit_redemptions enable row level security;
    revoke all on table public.popclub_credit_redemptions from anon, authenticated;
    grant select on table public.popclub_credit_redemptions to authenticated;

    drop policy if exists popclub_credit_redemptions_select_own on public.popclub_credit_redemptions;
    create policy popclub_credit_redemptions_select_own
      on public.popclub_credit_redemptions
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin(auth.uid()));

    drop policy if exists popclub_credit_redemptions_service_all on public.popclub_credit_redemptions;
    create policy popclub_credit_redemptions_service_all
      on public.popclub_credit_redemptions
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end;
$$;
