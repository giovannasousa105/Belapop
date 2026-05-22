-- Go-live security hardening for legacy critical tables.
-- Keep direct browser access fail-closed while route handlers keep using
-- server-side checks/service role where anonymous flows are required.

alter table public.customers enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_events enable row level security;

drop policy if exists customers_admin_select on public.customers;
create policy customers_admin_select
on public.customers
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists carts_select_own_or_admin on public.carts;
create policy carts_select_own_or_admin
on public.carts
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists carts_insert_own_or_admin on public.carts;
create policy carts_insert_own_or_admin
on public.carts
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists carts_update_own_or_admin on public.carts;
create policy carts_update_own_or_admin
on public.carts
for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists carts_delete_own_or_admin on public.carts;
create policy carts_delete_own_or_admin
on public.carts
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists cart_items_select_own_or_admin on public.cart_items;
create policy cart_items_select_own_or_admin
on public.cart_items
for select
to authenticated
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and (c.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists cart_items_insert_own_or_admin on public.cart_items;
create policy cart_items_insert_own_or_admin
on public.cart_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and (c.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists cart_items_update_own_or_admin on public.cart_items;
create policy cart_items_update_own_or_admin
on public.cart_items
for update
to authenticated
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and (c.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
)
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and (c.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists cart_items_delete_own_or_admin on public.cart_items;
create policy cart_items_delete_own_or_admin
on public.cart_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and (c.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

drop policy if exists order_items_select_scope on public.order_items;
create policy order_items_select_scope
on public.order_items
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.has_seller_tenant_access(coalesce(partner_id, seller_id))
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or o.buyer_id = auth.uid())
  )
);

drop policy if exists payments_select_customer_or_admin on public.payments;
create policy payments_select_customer_or_admin
on public.payments
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.orders o
    where o.id = payments.order_id
      and (o.customer_id = auth.uid() or o.buyer_id = auth.uid())
  )
);

drop policy if exists shipments_select_customer_seller_or_admin on public.shipments;
create policy shipments_select_customer_seller_or_admin
on public.shipments
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.has_seller_tenant_access(coalesce(seller_id, store_id))
  or exists (
    select 1
    from public.orders o
    where o.id = shipments.order_id
      and (o.customer_id = auth.uid() or o.buyer_id = auth.uid())
  )
);

drop policy if exists shipment_events_select_customer_seller_or_admin on public.shipment_events;
create policy shipment_events_select_customer_seller_or_admin
on public.shipment_events
for select
to authenticated
using (
  exists (
    select 1
    from public.shipments sh
    join public.orders o on o.id = sh.order_id
    where sh.id = shipment_events.shipment_id
      and (
        public.is_admin(auth.uid())
        or public.has_seller_tenant_access(coalesce(sh.seller_id, sh.store_id))
        or o.customer_id = auth.uid()
        or o.buyer_id = auth.uid()
      )
  )
);

revoke all on public.customers from anon;
revoke all on public.carts from anon;
revoke all on public.cart_items from anon;
revoke all on public.order_items from anon;
revoke all on public.payments from anon;
revoke all on public.shipments from anon;
revoke all on public.shipment_events from anon;

revoke all on public.customers from authenticated;
revoke all on public.carts from authenticated;
revoke all on public.cart_items from authenticated;
revoke all on public.order_items from authenticated;
revoke all on public.payments from authenticated;
revoke all on public.shipments from authenticated;
revoke all on public.shipment_events from authenticated;

grant select on public.customers to authenticated;
grant select, insert, update, delete on public.carts to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select on public.order_items to authenticated;
grant select on public.payments to authenticated;
grant select on public.shipments to authenticated;
grant select on public.shipment_events to authenticated;

grant all on public.customers to service_role;
grant all on public.carts to service_role;
grant all on public.cart_items to service_role;
grant all on public.order_items to service_role;
grant all on public.payments to service_role;
grant all on public.shipments to service_role;
grant all on public.shipment_events to service_role;
