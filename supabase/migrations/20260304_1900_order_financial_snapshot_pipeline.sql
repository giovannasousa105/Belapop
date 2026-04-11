-- Order financial snapshot pipeline (ledger-driven cache)
-- Compatible with current BelaPop schema (sellers + orders total_cents/total_order_cents)

insert into public.ledger_accounts (code, name, normal_balance)
values
  ('gateway_fee_expense', 'Despesa taxa gateway', 'debit')
on conflict (code) do update
set
  name = excluded.name,
  normal_balance = excluded.normal_balance;

create table if not exists public.order_financial_snapshot (
  order_id uuid primary key references public.orders(id) on delete cascade,
  store_id uuid not null references public.sellers(id) on delete cascade,

  currency text not null default 'BRL',

  gmv numeric(12,2) not null default 0,
  fee numeric(12,2) not null default 0,
  coupon_marketplace numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  gateway_fee numeric(12,2) not null default 0,

  marketplace_margin numeric(12,2) not null default 0,
  seller_payout_amount numeric(12,2) not null default 0,

  is_refunded boolean not null default false,
  is_chargeback boolean not null default false,

  components jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),

  constraint chk_order_fin_snapshot_nonneg_core check (
    gmv >= 0
    and fee >= 0
    and coupon_marketplace >= 0
    and shipping >= 0
    and gateway_fee >= 0
  )
);

create index if not exists idx_ofs_store_time
  on public.order_financial_snapshot (store_id, computed_at desc);

create index if not exists idx_ofs_store_gmv
  on public.order_financial_snapshot (store_id, gmv desc);

create table if not exists public.order_financial_snapshot_queue (
  order_id uuid primary key references public.orders(id) on delete cascade,
  store_id uuid references public.sellers(id) on delete set null,
  reason text,
  enqueued_at timestamptz not null default now(),
  tries integer not null default 0,
  last_error text
);

create index if not exists idx_ofs_queue_enqueued
  on public.order_financial_snapshot_queue (enqueued_at asc);

create table if not exists public.order_financial_snapshot_runs (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  ran_at timestamptz not null default now(),
  ok boolean not null,
  error text
);

create index if not exists idx_ofs_runs_order_time
  on public.order_financial_snapshot_runs (order_id, ran_at desc);

create or replace function public.enqueue_order_financial_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.order_id is not null then
      insert into public.order_financial_snapshot_queue(order_id, store_id, reason)
      values (new.order_id, new.store_id, 'insert ledger_entries')
      on conflict (order_id) do update
      set
        store_id = excluded.store_id,
        reason = excluded.reason,
        enqueued_at = now();
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.order_id is not null then
      insert into public.order_financial_snapshot_queue(order_id, store_id, reason)
      values (old.order_id, old.store_id, 'update-old ledger_entries')
      on conflict (order_id) do update
      set
        store_id = coalesce(excluded.store_id, public.order_financial_snapshot_queue.store_id),
        reason = excluded.reason,
        enqueued_at = now();
    end if;

    if new.order_id is not null then
      insert into public.order_financial_snapshot_queue(order_id, store_id, reason)
      values (new.order_id, new.store_id, 'update-new ledger_entries')
      on conflict (order_id) do update
      set
        store_id = excluded.store_id,
        reason = excluded.reason,
        enqueued_at = now();
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.order_id is not null then
      insert into public.order_financial_snapshot_queue(order_id, store_id, reason)
      values (old.order_id, old.store_id, 'delete ledger_entries')
      on conflict (order_id) do update
      set
        store_id = coalesce(excluded.store_id, public.order_financial_snapshot_queue.store_id),
        reason = excluded.reason,
        enqueued_at = now();
    end if;

    return old;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_enqueue_snapshot_on_ledger on public.ledger_entries;
create trigger trg_enqueue_snapshot_on_ledger
after insert or update or delete on public.ledger_entries
for each row execute function public.enqueue_order_financial_snapshot();

create or replace function public.recompute_order_financial_snapshot(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_currency text;
  v_order_json jsonb;

  v_gmv numeric(12,2) := 0;
  v_fee numeric(12,2) := 0;
  v_coupon numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_gateway_fee numeric(12,2) := 0;
  v_margin numeric(12,2) := 0;
  v_seller_payout numeric(12,2) := 0;
  v_is_refunded boolean := false;
  v_is_chargeback boolean := false;
  v_entry_count integer := 0;

  v_components jsonb := '{}'::jsonb;
begin
  select to_jsonb(o)
    into v_order_json
  from public.orders o
  where o.id = p_order_id;

  if v_order_json is null then
    delete from public.order_financial_snapshot
    where order_id = p_order_id;
    return;
  end if;

  -- Best-effort GMV extraction supporting both decimal and cents schemas.
  v_gmv := coalesce(
    case
      when coalesce(v_order_json->>'total_amount', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
        then round((v_order_json->>'total_amount')::numeric, 2)
      else null
    end,
    case
      when coalesce(v_order_json->>'total_cents', '') ~ '^-?[0-9]+$'
        then round(((v_order_json->>'total_cents')::numeric / 100.0), 2)
      else null
    end,
    case
      when coalesce(v_order_json->>'total_order_cents', '') ~ '^-?[0-9]+$'
        then round(((v_order_json->>'total_order_cents')::numeric / 100.0), 2)
      else null
    end,
    0
  );

  if v_gmv < 0 then
    v_gmv := 0;
  end if;

  -- Prefer store from ledger (source of truth); fallback to sub_orders/snapshot cache.
  select e.store_id
    into v_store_id
  from public.ledger_entries e
  where e.order_id = p_order_id
    and e.store_id is not null
  group by e.store_id
  order by count(*) desc, max(e.occurred_at) desc
  limit 1;

  if v_store_id is null then
    select so.seller_id
      into v_store_id
    from public.sub_orders so
    where so.order_id = p_order_id
      and so.seller_id is not null
    group by so.seller_id
    order by count(*) desc
    limit 1;
  end if;

  if v_store_id is null then
    select s.store_id
      into v_store_id
    from public.order_financial_snapshot s
    where s.order_id = p_order_id
    limit 1;
  end if;

  if v_store_id is null then
    raise exception 'snapshot_store_not_found';
  end if;

  select coalesce(
    sum(case when e.account_code = 'marketplace_fee_revenue' and e.direction = 'credit' then e.amount else 0 end),
    0
  )::numeric(12,2),
  coalesce(
    sum(case when e.account_code = 'promo_discount_expense' and e.direction = 'debit' then e.amount else 0 end),
    0
  )::numeric(12,2),
  coalesce(
    sum(case when e.account_code = 'shipping_pass_through' and e.direction = 'credit' then e.amount else 0 end),
    0
  )::numeric(12,2),
  coalesce(
    sum(case when e.account_code = 'gateway_fee_expense' and e.direction = 'debit' then e.amount else 0 end),
    0
  )::numeric(12,2),
  coalesce(
    sum(case when e.account_code = 'seller_payable' and e.direction = 'credit' then e.amount else 0 end),
    0
  )::numeric(12,2),
  coalesce(bool_or(e.account_code = 'refunds_expense' and e.direction = 'debit' and e.amount > 0), false),
  coalesce(bool_or(e.account_code = 'chargebacks_expense' and e.direction = 'debit' and e.amount > 0), false),
  count(*)::integer
    into v_fee,
         v_coupon,
         v_shipping,
         v_gateway_fee,
         v_seller_payout,
         v_is_refunded,
         v_is_chargeback,
         v_entry_count
  from public.ledger_entries e
  where e.order_id = p_order_id;

  select e.currency
    into v_currency
  from public.ledger_entries e
  where e.order_id = p_order_id
    and nullif(trim(e.currency), '') is not null
  order by e.occurred_at desc
  limit 1;

  if v_currency is null then
    v_currency := coalesce(nullif(upper(v_order_json->>'currency'), ''), 'BRL');
  end if;

  v_margin := round((coalesce(v_fee, 0) - coalesce(v_coupon, 0) - coalesce(v_gateway_fee, 0))::numeric, 2);

  v_components := jsonb_build_object(
    'gmv_source',
    case
      when coalesce(v_order_json->>'total_amount', '') ~ '^-?[0-9]+(\.[0-9]+)?$' then 'orders.total_amount'
      when coalesce(v_order_json->>'total_cents', '') ~ '^-?[0-9]+$' then 'orders.total_cents / 100'
      when coalesce(v_order_json->>'total_order_cents', '') ~ '^-?[0-9]+$' then 'orders.total_order_cents / 100'
      else 'fallback_zero'
    end,
    'fee_source', 'ledger.marketplace_fee_revenue(credit)',
    'coupon_source', 'ledger.promo_discount_expense(debit)',
    'shipping_source', 'ledger.shipping_pass_through(credit)',
    'gateway_fee_source', 'ledger.gateway_fee_expense(debit)',
    'seller_payout_source', 'ledger.seller_payable(credit)',
    'ledger_entries_count', v_entry_count
  );

  insert into public.order_financial_snapshot (
    order_id,
    store_id,
    currency,
    gmv,
    fee,
    coupon_marketplace,
    shipping,
    gateway_fee,
    marketplace_margin,
    seller_payout_amount,
    is_refunded,
    is_chargeback,
    components,
    computed_at
  )
  values (
    p_order_id,
    v_store_id,
    v_currency,
    coalesce(v_gmv, 0),
    coalesce(v_fee, 0),
    coalesce(v_coupon, 0),
    coalesce(v_shipping, 0),
    coalesce(v_gateway_fee, 0),
    coalesce(v_margin, 0),
    coalesce(v_seller_payout, 0),
    coalesce(v_is_refunded, false),
    coalesce(v_is_chargeback, false),
    coalesce(v_components, '{}'::jsonb),
    now()
  )
  on conflict (order_id) do update
  set
    store_id = excluded.store_id,
    currency = excluded.currency,
    gmv = excluded.gmv,
    fee = excluded.fee,
    coupon_marketplace = excluded.coupon_marketplace,
    shipping = excluded.shipping,
    gateway_fee = excluded.gateway_fee,
    marketplace_margin = excluded.marketplace_margin,
    seller_payout_amount = excluded.seller_payout_amount,
    is_refunded = excluded.is_refunded,
    is_chargeback = excluded.is_chargeback,
    components = excluded.components,
    computed_at = excluded.computed_at;
end;
$$;

create or replace function public.process_order_financial_snapshot_queue(p_limit int default 200)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_processed int := 0;
  v_limit int := greatest(coalesce(p_limit, 200), 1);
begin
  for r in
    select q.order_id
    from public.order_financial_snapshot_queue q
    order by q.enqueued_at asc
    limit v_limit
    for update skip locked
  loop
    begin
      perform public.recompute_order_financial_snapshot(r.order_id);

      delete from public.order_financial_snapshot_queue
      where order_id = r.order_id;

      insert into public.order_financial_snapshot_runs(order_id, ok)
      values (r.order_id, true);

      v_processed := v_processed + 1;
    exception when others then
      update public.order_financial_snapshot_queue
      set
        tries = tries + 1,
        last_error = left(sqlerrm, 2000),
        enqueued_at = now()
      where order_id = r.order_id;

      insert into public.order_financial_snapshot_runs(order_id, ok, error)
      values (r.order_id, false, left(sqlerrm, 2000));
    end;
  end loop;

  return v_processed;
end;
$$;

grant execute on function public.recompute_order_financial_snapshot(uuid) to service_role;
grant execute on function public.process_order_financial_snapshot_queue(int) to service_role;
