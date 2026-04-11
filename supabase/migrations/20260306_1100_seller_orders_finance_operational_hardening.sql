-- seller_orders finance + payout operational hardening
-- Adds robust allocation/payout flow on top of 20260305_0400_multiseller_core_foundation.sql

create extension if not exists "pgcrypto";

-- =========================================================
-- seller_orders: operational columns and lightweight guardrails
-- =========================================================
alter table public.seller_orders
  add column if not exists payment_status text not null default 'paid',
  add column if not exists currency text not null default 'BRL',
  add column if not exists shipping_service text,
  add column if not exists tracking_url text,
  add column if not exists label_url text,
  add column if not exists canceled_at timestamptz,
  add column if not exists ship_by_at timestamptz,
  add column if not exists delivered_by_at timestamptz,
  add column if not exists seller_payout_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_seller_orders_delivered_after_shipped'
      and conrelid = 'public.seller_orders'::regclass
  ) then
    alter table public.seller_orders
      add constraint chk_seller_orders_delivered_after_shipped
      check (delivered_at is null or shipped_at is null or delivered_at >= shipped_at)
      not valid;
  end if;
end;
$$;

-- =========================================================
-- seller fee rules
-- =========================================================
create table if not exists public.seller_fee_rules (
  seller_id uuid primary key references public.sellers(id) on delete cascade,
  fee_bps integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_seller_fee_rules_bps check (fee_bps >= 0 and fee_bps <= 10000)
);

create index if not exists idx_seller_fee_rules_updated
  on public.seller_fee_rules (updated_at desc);

drop trigger if exists trg_seller_fee_rules_updated on public.seller_fee_rules;
create trigger trg_seller_fee_rules_updated
before update on public.seller_fee_rules
for each row execute function public.set_updated_at();

insert into public.seller_fee_rules (seller_id, fee_bps)
select
  s.id,
  greatest(
    0,
    least(
      10000,
      case
        when s.commission_rate is null then 1000
        when s.commission_rate <= 1 then round(s.commission_rate * 10000)::integer
        else round(s.commission_rate * 100)::integer
      end
    )
  ) as fee_bps
from public.sellers s
on conflict (seller_id) do nothing;

-- =========================================================
-- shipping quotes per seller_order (optional source of truth)
-- =========================================================
create table if not exists public.seller_order_shipping_quotes (
  id uuid primary key default gen_random_uuid(),
  seller_order_id uuid not null references public.seller_orders(id) on delete cascade,
  carrier text,
  service text,
  quoted_shipping_cents integer not null default 0,
  final_shipping_cents integer not null default 0,
  eta_min_days integer,
  eta_max_days integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_seller_order_shipping_quotes_nonneg check (
    quoted_shipping_cents >= 0 and final_shipping_cents >= 0
  )
);

create index if not exists idx_seller_order_shipping_quotes_order
  on public.seller_order_shipping_quotes (seller_order_id, created_at desc);

drop trigger if exists trg_seller_order_shipping_quotes_updated on public.seller_order_shipping_quotes;
create trigger trg_seller_order_shipping_quotes_updated
before update on public.seller_order_shipping_quotes
for each row execute function public.set_updated_at();

-- =========================================================
-- seller payout batch model
-- =========================================================
create table if not exists public.seller_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  gross_payout_cents integer not null default 0,
  adjustments_cents integer not null default 0,
  net_payout_cents integer not null default 0,
  status text not null default 'scheduled', -- scheduled | processing | paid | blocked | canceled
  currency text not null default 'BRL',
  scheduled_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_seller_payout_period check (period_end >= period_start),
  constraint chk_seller_payout_nonneg check (
    gross_payout_cents >= 0 and net_payout_cents >= 0
  )
);

create index if not exists idx_seller_payouts_seller_period
  on public.seller_payouts (seller_id, period_start desc, period_end desc);

create index if not exists idx_seller_payouts_status
  on public.seller_payouts (status, created_at desc);

create unique index if not exists uq_seller_payout_open_period
  on public.seller_payouts (seller_id, period_start, period_end)
  where status in ('scheduled', 'processing', 'blocked');

drop trigger if exists trg_seller_payouts_updated on public.seller_payouts;
create trigger trg_seller_payouts_updated
before update on public.seller_payouts
for each row execute function public.set_updated_at();

create table if not exists public.seller_payout_items (
  id uuid primary key default gen_random_uuid(),
  seller_payout_id uuid not null references public.seller_payouts(id) on delete cascade,
  seller_order_id uuid not null references public.seller_orders(id) on delete restrict,
  payout_amount_cents integer not null default 0,
  created_at timestamptz not null default now(),
  constraint chk_seller_payout_items_nonneg check (payout_amount_cents >= 0),
  unique (seller_payout_id, seller_order_id),
  unique (seller_order_id)
);

create index if not exists idx_seller_payout_items_payout
  on public.seller_payout_items (seller_payout_id, created_at desc);

create index if not exists idx_seller_payout_items_seller_order
  on public.seller_payout_items (seller_order_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'seller_orders_seller_payout_id_fkey'
      and conrelid = 'public.seller_orders'::regclass
  ) then
    alter table public.seller_orders
      add constraint seller_orders_seller_payout_id_fkey
      foreign key (seller_payout_id) references public.seller_payouts(id) on delete set null;
  end if;
end;
$$;

create index if not exists idx_seller_orders_seller_payout_id
  on public.seller_orders (seller_payout_id);

-- =========================================================
-- snapshot extension
-- =========================================================
alter table public.seller_order_financial_snapshot
  add column if not exists marketplace_margin_cents integer not null default 0,
  add column if not exists computed_at timestamptz not null default now();

update public.seller_order_financial_snapshot
set
  marketplace_margin_cents = coalesce(fee_cents, 0) - coalesce(discount_allocated_cents, 0),
  computed_at = coalesce(computed_at, now())
where marketplace_margin_cents is distinct from (coalesce(fee_cents, 0) - coalesce(discount_allocated_cents, 0))
   or computed_at is null;

create or replace function public.refresh_seller_order_financial_snapshot(
  p_seller_order_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  with src as (
    select
      so.id as seller_order_id,
      so.seller_id,
      so.order_id,
      coalesce(so.items_total_cents, 0)::integer as items_total_cents,
      coalesce(so.shipping_cents, 0)::integer as shipping_cents,
      coalesce(so.discount_allocated_cents, 0)::integer as discount_allocated_cents,
      coalesce(so.fee_cents, 0)::integer as fee_cents,
      coalesce(so.seller_payout_cents, 0)::integer as seller_payout_cents,
      (coalesce(so.fee_cents, 0) - coalesce(so.discount_allocated_cents, 0))::integer as marketplace_margin_cents,
      coalesce(so.created_at, now()) as created_at
    from public.seller_orders so
    where p_seller_order_id is null
       or so.id = p_seller_order_id
  )
  insert into public.seller_order_financial_snapshot (
    seller_order_id,
    seller_id,
    order_id,
    items_total_cents,
    shipping_cents,
    discount_allocated_cents,
    fee_cents,
    seller_payout_cents,
    marketplace_margin_cents,
    created_at,
    updated_at,
    computed_at
  )
  select
    seller_order_id,
    seller_id,
    order_id,
    items_total_cents,
    shipping_cents,
    discount_allocated_cents,
    fee_cents,
    seller_payout_cents,
    marketplace_margin_cents,
    created_at,
    now(),
    now()
  from src
  on conflict (seller_order_id) do update
  set
    seller_id = excluded.seller_id,
    order_id = excluded.order_id,
    items_total_cents = excluded.items_total_cents,
    shipping_cents = excluded.shipping_cents,
    discount_allocated_cents = excluded.discount_allocated_cents,
    fee_cents = excluded.fee_cents,
    seller_payout_cents = excluded.seller_payout_cents,
    marketplace_margin_cents = excluded.marketplace_margin_cents,
    updated_at = now(),
    computed_at = now();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.refresh_seller_order_financial_snapshot_by_order(
  p_order_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  if p_order_id is null then
    return 0;
  end if;

  with src as (
    select
      so.id as seller_order_id,
      so.seller_id,
      so.order_id,
      coalesce(so.items_total_cents, 0)::integer as items_total_cents,
      coalesce(so.shipping_cents, 0)::integer as shipping_cents,
      coalesce(so.discount_allocated_cents, 0)::integer as discount_allocated_cents,
      coalesce(so.fee_cents, 0)::integer as fee_cents,
      coalesce(so.seller_payout_cents, 0)::integer as seller_payout_cents,
      (coalesce(so.fee_cents, 0) - coalesce(so.discount_allocated_cents, 0))::integer as marketplace_margin_cents,
      coalesce(so.created_at, now()) as created_at
    from public.seller_orders so
    where so.order_id = p_order_id
  )
  insert into public.seller_order_financial_snapshot (
    seller_order_id,
    seller_id,
    order_id,
    items_total_cents,
    shipping_cents,
    discount_allocated_cents,
    fee_cents,
    seller_payout_cents,
    marketplace_margin_cents,
    created_at,
    updated_at,
    computed_at
  )
  select
    seller_order_id,
    seller_id,
    order_id,
    items_total_cents,
    shipping_cents,
    discount_allocated_cents,
    fee_cents,
    seller_payout_cents,
    marketplace_margin_cents,
    created_at,
    now(),
    now()
  from src
  on conflict (seller_order_id) do update
  set
    seller_id = excluded.seller_id,
    order_id = excluded.order_id,
    items_total_cents = excluded.items_total_cents,
    shipping_cents = excluded.shipping_cents,
    discount_allocated_cents = excluded.discount_allocated_cents,
    fee_cents = excluded.fee_cents,
    seller_payout_cents = excluded.seller_payout_cents,
    marketplace_margin_cents = excluded.marketplace_margin_cents,
    updated_at = now(),
    computed_at = now();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

-- =========================================================
-- status guardrails to avoid regressions / inconsistent timestamps
-- =========================================================
create or replace function public.seller_order_status_rank(p_status text)
returns integer
language sql
immutable
as $$
  select case lower(coalesce(p_status, ''))
    when 'created' then 10
    when 'pending' then 10
    when 'processing' then 20
    when 'ready_to_ship' then 30
    when 'label_created' then 35
    when 'shipped' then 40
    when 'in_transit' then 50
    when 'out_for_delivery' then 60
    when 'delivered' then 70
    when 'completed' then 80
    else null
  end;
$$;

create or replace function public.trg_seller_orders_guardrails()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status text;
  v_new_status text;
  v_old_rank integer;
  v_new_rank integer;
  v_payout_status text;
begin
  if tg_op = 'INSERT' then
    new.status := lower(coalesce(new.status, 'pending'));
    new.payment_status := lower(coalesce(new.payment_status, 'paid'));
    new.currency := upper(coalesce(new.currency, 'BRL'));

    if new.status in ('shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed')
       and new.shipped_at is null then
      new.shipped_at := now();
    end if;

    if new.status in ('delivered', 'completed') and new.delivered_at is null then
      new.delivered_at := coalesce(new.shipped_at, now());
    end if;

    if new.status = 'cancelled' and new.canceled_at is null then
      new.canceled_at := now();
    end if;

    return new;
  end if;

  new.status := lower(coalesce(new.status, old.status, 'pending'));
  new.payment_status := lower(coalesce(new.payment_status, old.payment_status, 'paid'));
  new.currency := upper(coalesce(new.currency, old.currency, 'BRL'));

  v_old_status := lower(coalesce(old.status, 'pending'));
  v_new_status := new.status;

  if old.seller_payout_id is not null then
    select lower(sp.status)
      into v_payout_status
    from public.seller_payouts sp
    where sp.id = old.seller_payout_id;

    if v_payout_status in ('processing', 'paid')
       and (
         new.order_id is distinct from old.order_id
         or new.seller_id is distinct from old.seller_id
         or new.items_total_cents is distinct from old.items_total_cents
         or new.shipping_cents is distinct from old.shipping_cents
         or new.discount_allocated_cents is distinct from old.discount_allocated_cents
         or new.fee_cents is distinct from old.fee_cents
         or new.seller_payout_cents is distinct from old.seller_payout_cents
       ) then
      raise exception 'seller_order_financial_locked_by_payout';
    end if;
  end if;

  if v_old_status <> v_new_status then
    if v_new_status = 'cancelled'
       and v_old_status in ('shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed', 'return_requested', 'return_in_transit', 'return_received', 'refunded', 'exchanged') then
      raise exception 'seller_order_invalid_transition_cancel_after_ship';
    end if;

    if v_new_status = 'return_requested' and v_old_status not in ('delivered', 'completed') then
      raise exception 'seller_order_invalid_transition_return_requested';
    end if;

    if v_new_status = 'return_in_transit' and v_old_status not in ('return_requested') then
      raise exception 'seller_order_invalid_transition_return_in_transit';
    end if;

    if v_new_status = 'return_received' and v_old_status not in ('return_in_transit') then
      raise exception 'seller_order_invalid_transition_return_received';
    end if;

    if v_new_status in ('refunded', 'exchanged')
       and v_old_status not in ('return_received', 'delivered', 'completed') then
      raise exception 'seller_order_invalid_transition_resolution';
    end if;

    v_old_rank := public.seller_order_status_rank(v_old_status);
    v_new_rank := public.seller_order_status_rank(v_new_status);

    if v_old_rank is not null and v_new_rank is not null and v_new_rank < v_old_rank then
      raise exception 'seller_order_status_regression_not_allowed: % -> %', v_old_status, v_new_status;
    end if;
  end if;

  if new.status in ('shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed', 'return_requested', 'return_in_transit', 'return_received', 'refunded', 'exchanged')
     and new.shipped_at is null then
    new.shipped_at := coalesce(old.shipped_at, now());
  end if;

  if new.status in ('delivered', 'completed', 'return_requested', 'return_in_transit', 'return_received', 'refunded', 'exchanged')
     and new.delivered_at is null then
    new.delivered_at := coalesce(old.delivered_at, now());
  end if;

  if new.status = 'cancelled' and new.canceled_at is null then
    new.canceled_at := now();
  end if;

  if new.delivered_at is not null and new.shipped_at is not null and new.delivered_at < new.shipped_at then
    raise exception 'seller_order_invalid_timestamps';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_seller_orders_guardrails on public.seller_orders;
create trigger trg_seller_orders_guardrails
before insert or update on public.seller_orders
for each row execute function public.trg_seller_orders_guardrails();

-- =========================================================
-- Financial allocation engine per order_id
-- Coupon allocation + freight allocation + fee + payout
-- =========================================================
create or replace function public.refresh_seller_orders_financials(
  p_order_id uuid,
  p_default_fee_bps integer default 1000,
  p_shipping_mode text default 'auto' -- auto | preserve | proportional | quoted
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_mode text := lower(coalesce(p_shipping_mode, 'auto'));
begin
  if p_order_id is null then
    return 0;
  end if;

  -- Ensure one seller_order per seller participating in this order.
  insert into public.seller_orders (
    order_id,
    seller_id,
    status,
    payment_status,
    currency,
    created_at,
    updated_at
  )
  select
    p_order_id,
    oi.seller_id,
    'pending',
    'paid',
    'BRL',
    now(),
    now()
  from public.order_items oi
  where oi.order_id = p_order_id
    and oi.seller_id is not null
  group by oi.seller_id
  on conflict (order_id, seller_id) do nothing;

  with order_totals as (
    select
      o.id as order_id,
      greatest(coalesce(o.total_products_cents, 0), 0)::integer as total_products_cents,
      greatest(coalesce(o.total_shipping_cents, 0), 0)::integer as total_shipping_cents,
      greatest(
        coalesce(o.total_products_cents, 0) + coalesce(o.total_shipping_cents, 0) - coalesce(o.total_order_cents, 0),
        0
      )::integer as total_discount_cents
    from public.orders o
    where o.id = p_order_id
  ),
  item_totals as (
    select
      oi.order_id,
      oi.seller_id,
      sum(
        greatest(
          coalesce(oi.total_price_cents, oi.total_cents, coalesce(oi.unit_price_cents, 0) * coalesce(oi.quantity, 1), 0),
          0
        )
      )::integer as items_total_cents
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.seller_id is not null
    group by oi.order_id, oi.seller_id
  ),
  seller_rows as (
    select
      so.id as seller_order_id,
      so.seller_id,
      greatest(coalesce(it.items_total_cents, 0), 0)::integer as items_total_cents,
      greatest(coalesce(so.shipping_cents, 0), 0)::integer as existing_shipping_cents
    from public.seller_orders so
    left join item_totals it
      on it.order_id = so.order_id
     and it.seller_id = so.seller_id
    where so.order_id = p_order_id
  ),
  base_context as (
    select
      ot.total_discount_cents,
      ot.total_shipping_cents,
      coalesce(sum(sr.items_total_cents), 0)::integer as all_items_total_cents,
      coalesce(sum(sr.existing_shipping_cents), 0)::integer as existing_shipping_total_cents
    from order_totals ot
    left join seller_rows sr on true
    group by ot.total_discount_cents, ot.total_shipping_cents
  ),
  discount_base as (
    select
      sr.seller_order_id,
      sr.seller_id,
      sr.items_total_cents,
      case
        when bc.all_items_total_cents > 0
          then floor((bc.total_discount_cents::numeric * sr.items_total_cents::numeric) / bc.all_items_total_cents::numeric)::integer
        else 0
      end as alloc_base
    from seller_rows sr
    cross join base_context bc
  ),
  discount_meta as (
    select
      bc.total_discount_cents,
      greatest(
        bc.total_discount_cents - coalesce(sum(db.alloc_base), 0),
        0
      )::integer as remainder
    from base_context bc
    left join discount_base db on true
    group by bc.total_discount_cents
  ),
  discount_alloc as (
    select
      db.seller_order_id,
      db.seller_id,
      (db.alloc_base + case
        when row_number() over (order by db.items_total_cents desc, db.seller_id::text) <= dm.remainder then 1
        else 0
      end)::integer as discount_cents
    from discount_base db
    cross join discount_meta dm
  ),
  shipping_quote as (
    select
      so.id as seller_order_id,
      greatest(
        coalesce(max(q.final_shipping_cents), 0),
        coalesce(max(q.quoted_shipping_cents), 0)
      )::integer as shipping_cents
    from public.seller_orders so
    left join public.seller_order_shipping_quotes q
      on q.seller_order_id = so.id
    where so.order_id = p_order_id
    group by so.id
  ),
  shipping_flags as (
    select
      coalesce(sum(qs.shipping_cents), 0) > 0 as has_quote_shipping,
      coalesce(sum(sr.existing_shipping_cents), 0) > 0 as has_existing_shipping
    from seller_rows sr
    left join shipping_quote qs on qs.seller_order_id = sr.seller_order_id
  ),
  shipping_prop_base as (
    select
      sr.seller_order_id,
      sr.seller_id,
      sr.items_total_cents,
      case
        when bc.all_items_total_cents > 0
          then floor((bc.total_shipping_cents::numeric * sr.items_total_cents::numeric) / bc.all_items_total_cents::numeric)::integer
        else 0
      end as alloc_base
    from seller_rows sr
    cross join base_context bc
  ),
  shipping_prop_meta as (
    select
      bc.total_shipping_cents,
      greatest(
        bc.total_shipping_cents - coalesce(sum(sb.alloc_base), 0),
        0
      )::integer as remainder
    from base_context bc
    left join shipping_prop_base sb on true
    group by bc.total_shipping_cents
  ),
  shipping_alloc as (
    select
      sb.seller_order_id,
      sb.seller_id,
      (sb.alloc_base + case
        when row_number() over (order by sb.items_total_cents desc, sb.seller_id::text) <= sm.remainder then 1
        else 0
      end)::integer as shipping_cents
    from shipping_prop_base sb
    cross join shipping_prop_meta sm
  ),
  fee_rules as (
    select
      sr.seller_id,
      greatest(
        0,
        least(
          10000,
          coalesce(
            fr.fee_bps,
            case
              when s.commission_rate is null then p_default_fee_bps
              when s.commission_rate <= 1 then round(s.commission_rate * 10000)::integer
              else round(s.commission_rate * 100)::integer
            end,
            p_default_fee_bps
          )
        )
      )::integer as fee_bps
    from seller_rows sr
    left join public.sellers s on s.id = sr.seller_id
    left join public.seller_fee_rules fr on fr.seller_id = sr.seller_id
  ),
  computed as (
    select
      sr.seller_order_id,
      sr.seller_id,
      sr.items_total_cents,
      coalesce(da.discount_cents, 0)::integer as discount_cents,
      greatest(
        0,
        case
          when v_mode = 'quoted' then coalesce(qs.shipping_cents, 0)
          when v_mode = 'preserve' then sr.existing_shipping_cents
          when v_mode = 'proportional' then coalesce(sa.shipping_cents, 0)
          else
            case
              when sf.has_quote_shipping then coalesce(qs.shipping_cents, 0)
              when sf.has_existing_shipping then sr.existing_shipping_cents
              else coalesce(sa.shipping_cents, 0)
            end
        end
      )::integer as shipping_cents,
      coalesce(fr.fee_bps, p_default_fee_bps)::integer as fee_bps
    from seller_rows sr
    left join discount_alloc da
      on da.seller_order_id = sr.seller_order_id
    left join shipping_alloc sa
      on sa.seller_order_id = sr.seller_order_id
    left join shipping_quote qs
      on qs.seller_order_id = sr.seller_order_id
    left join fee_rules fr
      on fr.seller_id = sr.seller_id
    cross join shipping_flags sf
  )
  update public.seller_orders so
  set
    items_total_cents = greatest(0, c.items_total_cents),
    discount_allocated_cents = greatest(0, c.discount_cents),
    shipping_cents = greatest(0, c.shipping_cents),
    fee_cents = greatest(
      0,
      round(greatest(0, c.items_total_cents - c.discount_cents)::numeric * c.fee_bps::numeric / 10000.0)::integer
    ),
    seller_payout_cents = greatest(
      0,
      c.items_total_cents
      + c.shipping_cents
      - c.discount_cents
      - round(greatest(0, c.items_total_cents - c.discount_cents)::numeric * c.fee_bps::numeric / 10000.0)::integer
    ),
    payment_status = lower(coalesce(nullif(so.payment_status, ''), 'paid')),
    currency = upper(coalesce(nullif(so.currency, ''), 'BRL')),
    updated_at = now()
  from computed c
  where so.id = c.seller_order_id;

  get diagnostics v_rows = row_count;

  perform public.refresh_seller_order_financial_snapshot_by_order(p_order_id);

  return v_rows;
end;
$$;

create or replace function public.trg_refresh_seller_orders_financials_from_order_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  v_order_id := coalesce(new.order_id, old.order_id);
  if v_order_id is not null then
    perform public.refresh_seller_orders_financials(v_order_id, 1000, 'auto');
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_order_items_refresh_seller_orders_financials on public.order_items;
create trigger trg_order_items_refresh_seller_orders_financials
after insert or update or delete on public.order_items
for each row execute function public.trg_refresh_seller_orders_financials_from_order_items();

create or replace function public.trg_refresh_seller_orders_financials_from_shipping_quotes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so_id uuid;
  v_order_id uuid;
begin
  v_so_id := coalesce(new.seller_order_id, old.seller_order_id);
  if v_so_id is null then
    return coalesce(new, old);
  end if;

  select so.order_id
    into v_order_id
  from public.seller_orders so
  where so.id = v_so_id;

  if v_order_id is not null then
    perform public.refresh_seller_orders_financials(v_order_id, 1000, 'auto');
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_shipping_quotes_refresh_seller_orders_financials on public.seller_order_shipping_quotes;
create trigger trg_shipping_quotes_refresh_seller_orders_financials
after insert or update or delete on public.seller_order_shipping_quotes
for each row execute function public.trg_refresh_seller_orders_financials_from_shipping_quotes();

-- =========================================================
-- Seller payout generation / closing
-- =========================================================
create or replace function public.create_seller_payouts_for_period(
  p_period_start date,
  p_period_end date,
  p_hold_days integer default 0
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  if p_period_start is null or p_period_end is null or p_period_end < p_period_start then
    raise exception 'invalid_payout_period';
  end if;

  with eligible as (
    select
      so.id as seller_order_id,
      so.seller_id,
      greatest(coalesce(so.seller_payout_cents, 0), 0)::integer as seller_payout_cents
    from public.seller_orders so
    where so.seller_payout_id is null
      and so.created_at::date between p_period_start and p_period_end
      and lower(coalesce(so.status, '')) in ('delivered', 'completed')
      and lower(coalesce(so.payment_status, 'paid')) in ('paid', 'captured', 'approved')
      and so.canceled_at is null
      and coalesce(so.seller_payout_cents, 0) > 0
      and (
        p_hold_days <= 0
        or coalesce(so.delivered_at, so.shipped_at, so.created_at) <= (now() - make_interval(days => p_hold_days))
      )
  ),
  grouped as (
    select
      e.seller_id,
      sum(e.seller_payout_cents)::integer as gross_payout_cents
    from eligible e
    group by e.seller_id
  )
  insert into public.seller_payouts (
    seller_id,
    period_start,
    period_end,
    gross_payout_cents,
    adjustments_cents,
    net_payout_cents,
    status,
    currency,
    scheduled_at,
    created_at,
    updated_at
  )
  select
    g.seller_id,
    p_period_start,
    p_period_end,
    g.gross_payout_cents,
    0,
    g.gross_payout_cents,
    'scheduled',
    'BRL',
    now(),
    now(),
    now()
  from grouped g
  on conflict (seller_id, period_start, period_end)
  where (status in ('scheduled', 'processing', 'blocked'))
  do update set
    gross_payout_cents = excluded.gross_payout_cents,
    net_payout_cents = greatest(0, excluded.gross_payout_cents + public.seller_payouts.adjustments_cents),
    scheduled_at = coalesce(public.seller_payouts.scheduled_at, excluded.scheduled_at),
    updated_at = now();

  with eligible as (
    select
      so.id as seller_order_id,
      so.seller_id,
      greatest(coalesce(so.seller_payout_cents, 0), 0)::integer as seller_payout_cents
    from public.seller_orders so
    where so.seller_payout_id is null
      and so.created_at::date between p_period_start and p_period_end
      and lower(coalesce(so.status, '')) in ('delivered', 'completed')
      and lower(coalesce(so.payment_status, 'paid')) in ('paid', 'captured', 'approved')
      and so.canceled_at is null
      and coalesce(so.seller_payout_cents, 0) > 0
      and (
        p_hold_days <= 0
        or coalesce(so.delivered_at, so.shipped_at, so.created_at) <= (now() - make_interval(days => p_hold_days))
      )
  )
  insert into public.seller_payout_items (
    seller_payout_id,
    seller_order_id,
    payout_amount_cents,
    created_at
  )
  select
    sp.id,
    e.seller_order_id,
    e.seller_payout_cents,
    now()
  from eligible e
  join public.seller_payouts sp
    on sp.seller_id = e.seller_id
   and sp.period_start = p_period_start
   and sp.period_end = p_period_end
   and sp.status in ('scheduled', 'processing', 'blocked')
  on conflict (seller_order_id) do nothing;

  get diagnostics v_rows = row_count;

  update public.seller_orders so
  set
    seller_payout_id = spi.seller_payout_id,
    updated_at = now()
  from public.seller_payout_items spi
  where spi.seller_order_id = so.id
    and so.seller_payout_id is null;

  update public.seller_payouts sp
  set
    gross_payout_cents = coalesce(t.gross, 0),
    net_payout_cents = greatest(0, coalesce(t.gross, 0) + sp.adjustments_cents),
    updated_at = now()
  from (
    select
      spi.seller_payout_id,
      sum(spi.payout_amount_cents)::integer as gross
    from public.seller_payout_items spi
    group by spi.seller_payout_id
  ) t
  where sp.id = t.seller_payout_id;

  return v_rows;
end;
$$;

create or replace function public.mark_seller_payout_paid(
  p_seller_payout_id uuid,
  p_paid_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.seller_payouts
  set
    status = 'paid',
    paid_at = coalesce(p_paid_at, now()),
    updated_at = now()
  where id = p_seller_payout_id
    and status in ('scheduled', 'processing', 'blocked');

  if not found then
    raise exception 'seller_payout_not_found_or_not_payable';
  end if;
end;
$$;

-- =========================================================
-- RLS for new tables
-- =========================================================
alter table public.seller_fee_rules enable row level security;
alter table public.seller_order_shipping_quotes enable row level security;
alter table public.seller_payouts enable row level security;
alter table public.seller_payout_items enable row level security;

drop policy if exists seller_fee_rules_select_scope on public.seller_fee_rules;
create policy seller_fee_rules_select_scope
on public.seller_fee_rules
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_fee_rules.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_fee_rules_service_all on public.seller_fee_rules;
create policy seller_fee_rules_service_all
on public.seller_fee_rules
for all
to service_role
using (true)
with check (true);

drop policy if exists seller_order_shipping_quotes_select_scope on public.seller_order_shipping_quotes;
create policy seller_order_shipping_quotes_select_scope
on public.seller_order_shipping_quotes
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.seller_orders so
    join public.sellers s on s.id = so.seller_id
    where so.id = seller_order_shipping_quotes.seller_order_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_order_shipping_quotes_service_all on public.seller_order_shipping_quotes;
create policy seller_order_shipping_quotes_service_all
on public.seller_order_shipping_quotes
for all
to service_role
using (true)
with check (true);

drop policy if exists seller_payouts_select_scope on public.seller_payouts;
create policy seller_payouts_select_scope
on public.seller_payouts
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_payouts.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_payouts_service_all on public.seller_payouts;
create policy seller_payouts_service_all
on public.seller_payouts
for all
to service_role
using (true)
with check (true);

drop policy if exists seller_payout_items_select_scope on public.seller_payout_items;
create policy seller_payout_items_select_scope
on public.seller_payout_items
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.seller_payouts sp
    join public.sellers s on s.id = sp.seller_id
    where sp.id = seller_payout_items.seller_payout_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_payout_items_service_all on public.seller_payout_items;
create policy seller_payout_items_service_all
on public.seller_payout_items
for all
to service_role
using (true)
with check (true);

-- =========================================================
-- Grants
-- =========================================================
grant select on public.seller_fee_rules to authenticated;
grant select on public.seller_order_shipping_quotes to authenticated;
grant select on public.seller_payouts to authenticated;
grant select on public.seller_payout_items to authenticated;

grant all on public.seller_fee_rules to service_role;
grant all on public.seller_order_shipping_quotes to service_role;
grant all on public.seller_payouts to service_role;
grant all on public.seller_payout_items to service_role;

grant execute on function public.refresh_seller_orders_financials(uuid, integer, text) to service_role;
grant execute on function public.create_seller_payouts_for_period(date, date, integer) to service_role;
grant execute on function public.mark_seller_payout_paid(uuid, timestamptz) to service_role;
grant execute on function public.refresh_seller_order_financial_snapshot_by_order(uuid) to service_role;
