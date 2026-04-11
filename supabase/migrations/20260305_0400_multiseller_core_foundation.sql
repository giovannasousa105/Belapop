-- Multi-seller core foundation (compat mode)
-- Goal: introduce seller_orders as first-class operational unit without breaking
-- existing sub_orders flow already used by application code.

create extension if not exists "pgcrypto";

-- =========================================================
-- seller_orders
-- =========================================================
create table if not exists public.seller_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  status text not null default 'pending',
  items_total_cents integer not null default 0,
  shipping_cents integer not null default 0,
  discount_allocated_cents integer not null default 0,
  fee_cents integer not null default 0,
  seller_payout_cents integer not null default 0,
  tracking_code text,
  shipping_method text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_orders_unique_order_seller unique (order_id, seller_id)
);

create index if not exists idx_seller_orders_seller_created
  on public.seller_orders (seller_id, created_at desc);

create index if not exists idx_seller_orders_order
  on public.seller_orders (order_id);

create index if not exists idx_seller_orders_status
  on public.seller_orders (status);

drop trigger if exists trg_seller_orders_updated on public.seller_orders;
create trigger trg_seller_orders_updated
before update on public.seller_orders
for each row execute function public.set_updated_at();

-- backfill from sub_orders + latest shipment
insert into public.seller_orders (
  id,
  order_id,
  seller_id,
  status,
  items_total_cents,
  shipping_cents,
  discount_allocated_cents,
  fee_cents,
  seller_payout_cents,
  tracking_code,
  shipping_method,
  shipped_at,
  delivered_at,
  created_at
)
select
  so.id,
  so.order_id,
  so.seller_id,
  coalesce(so.status, 'pending'),
  coalesce(so.product_total_cents, 0),
  coalesce(so.shipping_total_cents, 0),
  greatest(
    coalesce(so.product_total_cents, 0) + coalesce(so.shipping_total_cents, 0)
    - coalesce(so.platform_fee_cents, 0)
    - coalesce(so.seller_net_cents, 0),
    0
  )::integer,
  coalesce(so.platform_fee_cents, 0),
  coalesce(so.seller_net_cents, 0),
  shp.tracking_code,
  coalesce(so.shipping_service, shp.carrier),
  case
    when lower(coalesce(so.status, '')) in ('shipped', 'in_transit', 'out_for_delivery', 'delivered')
      then coalesce(shp.updated_at, so.created_at, now())
    else null
  end as shipped_at,
  case
    when lower(coalesce(so.status, '')) in ('delivered')
      then coalesce(shp.updated_at, so.created_at, now())
    else null
  end as delivered_at,
  coalesce(so.created_at, now())
from public.sub_orders so
left join lateral (
  select s.tracking_code, s.carrier, s.status, s.updated_at
  from public.shipments s
  where s.order_id = so.order_id
    and s.store_id = so.seller_id
  order by s.created_at desc nulls last
  limit 1
) shp on true
on conflict (order_id, seller_id) do update
set
  status = excluded.status,
  items_total_cents = excluded.items_total_cents,
  shipping_cents = excluded.shipping_cents,
  discount_allocated_cents = excluded.discount_allocated_cents,
  fee_cents = excluded.fee_cents,
  seller_payout_cents = excluded.seller_payout_cents,
  tracking_code = coalesce(excluded.tracking_code, public.seller_orders.tracking_code),
  shipping_method = coalesce(excluded.shipping_method, public.seller_orders.shipping_method),
  shipped_at = coalesce(excluded.shipped_at, public.seller_orders.shipped_at),
  delivered_at = coalesce(excluded.delivered_at, public.seller_orders.delivered_at),
  created_at = least(public.seller_orders.created_at, excluded.created_at),
  updated_at = now();

create or replace function public.sync_sub_orders_to_seller_orders()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tracking_code text;
  v_shipping_method text;
  v_shipped_at timestamptz;
  v_delivered_at timestamptz;
begin
  if tg_op = 'DELETE' then
    delete from public.seller_orders
    where order_id = old.order_id
      and seller_id = old.seller_id;
    return old;
  end if;

  select s.tracking_code, coalesce(new.shipping_service, s.carrier), s.updated_at
    into v_tracking_code, v_shipping_method, v_shipped_at
  from public.shipments s
  where s.order_id = new.order_id
    and s.store_id = new.seller_id
  order by s.created_at desc nulls last
  limit 1;

  if lower(coalesce(new.status, '')) = 'delivered' then
    v_delivered_at := coalesce(v_shipped_at, now());
  else
    v_delivered_at := null;
  end if;

  insert into public.seller_orders (
    id,
    order_id,
    seller_id,
    status,
    items_total_cents,
    shipping_cents,
    discount_allocated_cents,
    fee_cents,
    seller_payout_cents,
    tracking_code,
    shipping_method,
    shipped_at,
    delivered_at,
    created_at
  )
  values (
    new.id,
    new.order_id,
    new.seller_id,
    coalesce(new.status, 'pending'),
    coalesce(new.product_total_cents, 0),
    coalesce(new.shipping_total_cents, 0),
    greatest(
      coalesce(new.product_total_cents, 0) + coalesce(new.shipping_total_cents, 0)
      - coalesce(new.platform_fee_cents, 0)
      - coalesce(new.seller_net_cents, 0),
      0
    )::integer,
    coalesce(new.platform_fee_cents, 0),
    coalesce(new.seller_net_cents, 0),
    v_tracking_code,
    v_shipping_method,
    case
      when lower(coalesce(new.status, '')) in ('shipped', 'in_transit', 'out_for_delivery', 'delivered')
        then coalesce(v_shipped_at, new.created_at, now())
      else null
    end,
    v_delivered_at,
    coalesce(new.created_at, now())
  )
  on conflict (order_id, seller_id) do update
  set
    status = excluded.status,
    items_total_cents = excluded.items_total_cents,
    shipping_cents = excluded.shipping_cents,
    discount_allocated_cents = excluded.discount_allocated_cents,
    fee_cents = excluded.fee_cents,
    seller_payout_cents = excluded.seller_payout_cents,
    tracking_code = coalesce(excluded.tracking_code, public.seller_orders.tracking_code),
    shipping_method = coalesce(excluded.shipping_method, public.seller_orders.shipping_method),
    shipped_at = coalesce(excluded.shipped_at, public.seller_orders.shipped_at),
    delivered_at = coalesce(excluded.delivered_at, public.seller_orders.delivered_at),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_sub_orders_sync_seller_orders on public.sub_orders;
create trigger trg_sub_orders_sync_seller_orders
after insert or update or delete on public.sub_orders
for each row execute function public.sync_sub_orders_to_seller_orders();

-- =========================================================
-- order_items compatibility for seller_orders linkage
-- =========================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_order_id uuid references public.seller_orders(id) on delete set null,
  product_id uuid not null,
  seller_id uuid references public.sellers(id) on delete set null,
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  total_price_cents integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.order_items
  add column if not exists seller_order_id uuid,
  add column if not exists product_id uuid,
  add column if not exists seller_id uuid,
  add column if not exists quantity integer,
  add column if not exists unit_price_cents integer,
  add column if not exists total_price_cents integer,
  add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_seller_order_id_fkey'
  ) then
    alter table public.order_items
      add constraint order_items_seller_order_id_fkey
      foreign key (seller_order_id) references public.seller_orders(id) on delete set null;
  end if;
end;
$$;

create index if not exists idx_order_items_order_id
  on public.order_items (order_id);

create index if not exists idx_order_items_seller_order_id
  on public.order_items (seller_order_id);

create index if not exists idx_order_items_seller_id
  on public.order_items (seller_id);

-- keep compatibility with older column names if present.
do $$
declare
  v_qty_expr text := 'oi.quantity';
  v_unit_expr text := 'oi.unit_price_cents';
  v_total_expr text := 'oi.total_price_cents';
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items' and column_name = 'qty'
  ) then
    v_qty_expr := 'coalesce(oi.quantity, oi.qty)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items' and column_name = 'price_cents'
  ) then
    v_unit_expr := 'coalesce(oi.unit_price_cents, oi.price_cents)';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items' and column_name = 'subtotal_cents'
  ) then
    v_total_expr := 'coalesce(oi.total_price_cents, oi.subtotal_cents)';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items' and column_name = 'total_cents'
  ) then
    v_total_expr := 'coalesce(oi.total_price_cents, oi.total_cents)';
  end if;

  execute format($sql$
    update public.order_items oi
    set
      quantity = coalesce(%1$s, 1),
      unit_price_cents = coalesce(%2$s, 0),
      total_price_cents = coalesce(%3$s, coalesce(%2$s, 0) * coalesce(%1$s, 1)),
      created_at = coalesce(oi.created_at, now())
    where oi.quantity is null
       or oi.unit_price_cents is null
       or oi.total_price_cents is null
       or oi.created_at is null
  $sql$, v_qty_expr, v_unit_expr, v_total_expr);
end;
$$;

do $$
declare
  v_seller_expr text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items' and column_name = 'seller_id'
  ) then
    v_seller_expr := 'oi.seller_id';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'order_items' and column_name = 'partner_id'
  ) then
    v_seller_expr := 'oi.partner_id';
  else
    v_seller_expr := 'null::uuid';
  end if;

  execute format($sql$
    update public.order_items oi
    set seller_order_id = so.id
    from public.seller_orders so
    where oi.seller_order_id is null
      and oi.order_id = so.order_id
      and %s = so.seller_id
  $sql$, v_seller_expr);
end;
$$;

-- =========================================================
-- ledger_entries compatibility
-- =========================================================
alter table public.ledger_entries
  add column if not exists seller_order_id uuid,
  add column if not exists entry_type text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ledger_entries_seller_order_id_fkey'
  ) then
    alter table public.ledger_entries
      add constraint ledger_entries_seller_order_id_fkey
      foreign key (seller_order_id) references public.seller_orders(id) on delete set null;
  end if;
end;
$$;

create index if not exists idx_ledger_entries_seller_order
  on public.ledger_entries (seller_order_id, occurred_at desc);

update public.ledger_entries le
set seller_order_id = so.id
from public.seller_orders so
where le.seller_order_id is null
  and le.order_id = so.order_id
  and le.store_id = so.seller_id;

update public.ledger_entries
set entry_type = case
  when account_code = 'seller_payable' then 'seller_payable'
  when account_code = 'marketplace_fee_revenue' then 'marketplace_fee'
  when account_code = 'promo_discount_expense' then 'promo_discount'
  when account_code = 'shipping_pass_through' then 'shipping_pass_through'
  when account_code = 'refunds_expense' then 'refund'
  when account_code = 'chargebacks_expense' then 'chargeback'
  when account_code = 'cash_clearing' then 'customer_payment'
  else coalesce(entry_type, 'finance_adjustment')
end
where entry_type is null;

-- =========================================================
-- seller_order_financial_snapshot
-- =========================================================
create table if not exists public.seller_order_financial_snapshot (
  seller_order_id uuid primary key references public.seller_orders(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  items_total_cents integer not null default 0,
  shipping_cents integer not null default 0,
  discount_allocated_cents integer not null default 0,
  fee_cents integer not null default 0,
  seller_payout_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_seller_order_snapshot_seller_created
  on public.seller_order_financial_snapshot (seller_id, created_at desc);

create index if not exists idx_seller_order_snapshot_order
  on public.seller_order_financial_snapshot (order_id);

drop trigger if exists trg_seller_order_snapshot_updated on public.seller_order_financial_snapshot;
create trigger trg_seller_order_snapshot_updated
before update on public.seller_order_financial_snapshot
for each row execute function public.set_updated_at();

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
    created_at,
    updated_at
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
    created_at,
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
    updated_at = now();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

select public.refresh_seller_order_financial_snapshot(null::uuid);

create or replace function public.trg_refresh_seller_order_financial_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  v_id := coalesce(new.id, old.id);

  if tg_op = 'DELETE' then
    delete from public.seller_order_financial_snapshot
    where seller_order_id = old.id;
    return old;
  end if;

  perform public.refresh_seller_order_financial_snapshot(v_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_seller_orders_refresh_snapshot on public.seller_orders;
create trigger trg_seller_orders_refresh_snapshot
after insert or update or delete on public.seller_orders
for each row execute function public.trg_refresh_seller_order_financial_snapshot();

create or replace function public.trg_refresh_snapshot_from_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so_id uuid;
begin
  v_so_id := coalesce(new.seller_order_id, old.seller_order_id);
  if v_so_id is not null then
    perform public.refresh_seller_order_financial_snapshot(v_so_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_ledger_entries_refresh_snapshot on public.ledger_entries;
create trigger trg_ledger_entries_refresh_snapshot
after insert or update or delete on public.ledger_entries
for each row execute function public.trg_refresh_snapshot_from_ledger_entry();

-- =========================================================
-- RLS
-- =========================================================
alter table public.seller_orders enable row level security;
alter table public.seller_order_financial_snapshot enable row level security;

drop policy if exists seller_orders_select_scope on public.seller_orders;
create policy seller_orders_select_scope
on public.seller_orders
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_orders.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_orders_service_all on public.seller_orders;
create policy seller_orders_service_all
on public.seller_orders
for all
to service_role
using (true)
with check (true);

drop policy if exists seller_order_snapshot_select_scope on public.seller_order_financial_snapshot;
create policy seller_order_snapshot_select_scope
on public.seller_order_financial_snapshot
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_order_financial_snapshot.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists seller_order_snapshot_service_all on public.seller_order_financial_snapshot;
create policy seller_order_snapshot_service_all
on public.seller_order_financial_snapshot
for all
to service_role
using (true)
with check (true);
