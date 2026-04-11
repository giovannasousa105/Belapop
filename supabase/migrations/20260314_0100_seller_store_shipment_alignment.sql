create extension if not exists "pgcrypto";

alter table public.stores
  add column if not exists seller_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stores_seller_id_fkey'
      and conrelid = 'public.stores'::regclass
  ) then
    alter table public.stores
      add constraint stores_seller_id_fkey
      foreign key (seller_id)
      references public.sellers(id)
      on delete set null;
  end if;
end
$$;

create unique index if not exists idx_stores_seller_id_unique
  on public.stores (seller_id)
  where seller_id is not null;

insert into public.users (
  id,
  role,
  name,
  email,
  is_active,
  created_at,
  updated_at
)
select
  p.id,
  'seller'::public.userrole,
  coalesce(nullif(trim(p.full_name), ''), s.store_name, 'Seller'),
  coalesce(nullif(trim(p.email), ''), 'seller+' || left(s.id::text, 8) || '@belapop.local'),
  true,
  now(),
  now()
from public.sellers s
join public.profiles p
  on p.id = s.user_id
left join public.users u
  on u.id = s.user_id
where u.id is null
on conflict (id) do update
set
  role = 'seller'::public.userrole,
  name = excluded.name,
  email = coalesce(nullif(public.users.email, ''), excluded.email),
  is_active = true,
  updated_at = now();

with ranked_store_candidates as (
  select
    s.id as seller_id,
    st.id as store_id,
    row_number() over (
      partition by s.id
      order by
        case when st.id = s.id then 0 else 1 end,
        case when coalesce(st.is_active, true) then 0 else 1 end,
        st.created_at asc nulls last,
        st.id asc
    ) as rn
  from public.sellers s
  join public.stores st
    on st.owner_user_id = s.user_id
  where st.seller_id is null
)
update public.stores st
set
  seller_id = ranked_store_candidates.seller_id,
  updated_at = now()
from ranked_store_candidates
where ranked_store_candidates.rn = 1
  and st.id = ranked_store_candidates.store_id
  and st.seller_id is null;

insert into public.stores (
  id,
  owner_user_id,
  seller_id,
  name,
  slug,
  description,
  is_active,
  created_at,
  updated_at
)
select
  s.id,
  s.user_id,
  s.id,
  s.store_name,
  trim(both '-' from regexp_replace(lower(coalesce(s.store_name, 'seller')), '[^a-z0-9]+', '-', 'g')) || '-' || left(s.id::text, 8),
  null,
  case when lower(coalesce(s.status, 'pending')) = 'active' then true else false end,
  now(),
  now()
from public.sellers s
left join public.stores st
  on st.seller_id = s.id
where st.id is null
on conflict (id) do update
set
  owner_user_id = excluded.owner_user_id,
  seller_id = excluded.seller_id,
  name = excluded.name,
  is_active = excluded.is_active,
  updated_at = now();

alter table public.shipments
  add column if not exists seller_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shipments_seller_id_fkey'
      and conrelid = 'public.shipments'::regclass
  ) then
    alter table public.shipments
      add constraint shipments_seller_id_fkey
      foreign key (seller_id)
      references public.sellers(id)
      on delete set null;
  end if;
end
$$;

create index if not exists idx_shipments_order_seller_created
  on public.shipments (order_id, seller_id, created_at desc);

update public.shipments sh
set seller_id = st.seller_id
from public.stores st
where sh.store_id = st.id
  and sh.seller_id is null
  and st.seller_id is not null;

update public.shipments sh
set seller_id = sh.store_id
where sh.seller_id is null
  and exists (
    select 1
    from public.sellers s
    where s.id = sh.store_id
  );

with single_seller_orders as (
  select order_id, min(seller_id::text)::uuid as seller_id
  from public.sub_orders
  group by order_id
  having count(distinct seller_id) = 1
)
update public.shipments sh
set seller_id = single_seller_orders.seller_id
from single_seller_orders
where sh.order_id = single_seller_orders.order_id
  and sh.seller_id is null;

create or replace function public.sync_seller_to_legacy_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_email text;
  v_is_active boolean;
  v_slug_base text;
begin
  select
    coalesce(nullif(trim(full_name), ''), new.store_name, 'Seller'),
    coalesce(nullif(trim(email), ''), 'seller+' || left(new.id::text, 8) || '@belapop.local')
  into v_name, v_email
  from public.profiles
  where id = new.user_id;

  insert into public.users (
    id,
    role,
    name,
    email,
    is_active,
    created_at,
    updated_at
  )
  values (
    new.user_id,
    'seller'::public.userrole,
    coalesce(v_name, new.store_name, 'Seller'),
    coalesce(v_email, 'seller+' || left(new.id::text, 8) || '@belapop.local'),
    true,
    now(),
    now()
  )
  on conflict (id) do update
  set
    role = 'seller'::public.userrole,
    name = excluded.name,
    email = coalesce(nullif(public.users.email, ''), excluded.email),
    is_active = true,
    updated_at = now();

  v_is_active := lower(coalesce(new.status, 'pending')) = 'active';
  v_slug_base := trim(both '-' from regexp_replace(lower(coalesce(new.store_name, 'seller')), '[^a-z0-9]+', '-', 'g'));

  insert into public.stores (
    id,
    owner_user_id,
    seller_id,
    name,
    slug,
    description,
    is_active,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.user_id,
    new.id,
    new.store_name,
    v_slug_base || '-' || left(new.id::text, 8),
    null,
    v_is_active,
    now(),
    now()
  )
  on conflict (id) do update
  set
    owner_user_id = excluded.owner_user_id,
    seller_id = excluded.seller_id,
    name = excluded.name,
    is_active = excluded.is_active,
    updated_at = now();

  update public.stores
  set
    seller_id = new.id,
    owner_user_id = new.user_id,
    name = coalesce(nullif(public.stores.name, ''), new.store_name),
    is_active = v_is_active,
    updated_at = now()
  where seller_id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_sellers_sync_legacy_store on public.sellers;
create trigger trg_sellers_sync_legacy_store
after insert or update of user_id, store_name, status on public.sellers
for each row execute function public.sync_seller_to_legacy_store();

create or replace function public.sync_shipment_seller_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_seller_id uuid;
begin
  if new.seller_id is null and new.store_id is not null then
    select st.seller_id
      into v_seller_id
    from public.stores st
    where st.id = new.store_id
    limit 1;

    if v_seller_id is null and exists (select 1 from public.sellers s where s.id = new.store_id) then
      v_seller_id := new.store_id;
    end if;

    new.seller_id := coalesce(new.seller_id, v_seller_id);
  end if;

  if new.store_id is null and new.seller_id is not null then
    select st.id
      into v_store_id
    from public.stores st
    where st.seller_id = new.seller_id
    order by
      case when st.id = new.seller_id then 0 else 1 end,
      case when coalesce(st.is_active, true) then 0 else 1 end,
      st.created_at asc nulls last
    limit 1;

    new.store_id := coalesce(new.store_id, v_store_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_shipments_sync_seller_store on public.shipments;
create trigger trg_shipments_sync_seller_store
before insert or update of seller_id, store_id on public.shipments
for each row execute function public.sync_shipment_seller_store();

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
    and (
      s.seller_id = new.seller_id
      or s.store_id = new.seller_id
    )
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

with shipment_rollup as (
  select
    so.id as seller_order_id,
    shp.tracking_code,
    shp.carrier,
    shp.updated_at
  from public.seller_orders so
  left join lateral (
    select s.tracking_code, s.carrier, s.updated_at
    from public.shipments s
    where s.order_id = so.order_id
      and (
        s.seller_id = so.seller_id
        or s.store_id = so.seller_id
      )
    order by s.created_at desc nulls last
    limit 1
  ) shp on true
)
update public.seller_orders so
set
  tracking_code = shipment_rollup.tracking_code,
  shipping_method = coalesce(so.shipping_method, shipment_rollup.carrier),
  shipped_at = coalesce(
    so.shipped_at,
    case
      when lower(coalesce(so.status, '')) in ('shipped', 'in_transit', 'out_for_delivery', 'delivered')
        then shipment_rollup.updated_at
      else null
    end
  ),
  delivered_at = coalesce(
    so.delivered_at,
    case
      when lower(coalesce(so.status, '')) = 'delivered'
        then shipment_rollup.updated_at
      else null
    end
  ),
  updated_at = now()
from shipment_rollup
where shipment_rollup.seller_order_id = so.id;
