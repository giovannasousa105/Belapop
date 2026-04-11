-- BelaPop marketplace premium MVP data model
-- Backward-compatible evolution on top of existing tables.

create extension if not exists pgcrypto;
-- =========================================================
-- products
-- =========================================================
alter table public.products
  add column if not exists partner_id uuid references public.sellers(id) on delete cascade,
  add column if not exists slug text,
  add column if not exists title text,
  add column if not exists brand text,
  add column if not exists hero_image_url text,
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists badges text[] not null default '{}'::text[],
  add column if not exists ritual text,
  add column if not exists texture text,
  add column if not exists sensation text[] not null default '{}'::text[],
  add column if not exists result text[] not null default '{}'::text[],
  add column if not exists editorial_reason text,
  add column if not exists how_to_use jsonb not null default '[]'::jsonb;
update public.products
set partner_id = seller_id
where partner_id is null
  and seller_id is not null;
update public.products
set title = coalesce(title, name)
where title is null;
update public.products
set slug = trim(both '-' from lower(regexp_replace(coalesce(title, name, id::text), '[^a-zA-Z0-9]+', '-', 'g')))
where slug is null
   or slug = '';
update public.products
set gallery = case
  when jsonb_typeof(images) = 'array' then images
  else '[]'::jsonb
end
where (gallery = '[]'::jsonb or gallery is null);
create unique index if not exists idx_products_slug_unique on public.products (slug);
create index if not exists idx_products_partner_id on public.products (partner_id);
create index if not exists idx_products_status_marketplace on public.products (status);
-- keep existing status usage and allow marketplace status vocabulary.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_status_marketplace_check'
  ) then
    alter table public.products
      add constraint products_status_marketplace_check
      check (
        status in ('draft', 'active', 'archived', 'review', 'published', 'paused')
      );
  end if;
end
$$;
-- =========================================================
-- partner_applications
-- =========================================================
create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  brand_name text not null,
  cnpj text,
  contact_name text not null,
  phone text,
  instagram text,
  catalog_link text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes_admin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_partner_applications_user_id on public.partner_applications(user_id);
create index if not exists idx_partner_applications_status on public.partner_applications(status);
drop trigger if exists trg_partner_applications_updated on public.partner_applications;
create trigger trg_partner_applications_updated
before update on public.partner_applications
for each row execute function public.set_updated_at();
alter table public.partner_applications enable row level security;
drop policy if exists partner_applications_insert_own on public.partner_applications;
create policy partner_applications_insert_own
on public.partner_applications
for insert
to authenticated
with check (user_id = auth.uid());
drop policy if exists partner_applications_select_own_or_admin on public.partner_applications;
create policy partner_applications_select_own_or_admin
on public.partner_applications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists partner_applications_update_own_or_admin on public.partner_applications;
create policy partner_applications_update_own_or_admin
on public.partner_applications
for update
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));
-- =========================================================
-- orders
-- =========================================================
alter table public.orders
  add column if not exists buyer_id uuid references public.profiles(id) on delete set null,
  add column if not exists shipping jsonb not null default '{}'::jsonb;
update public.orders
set buyer_id = customer_id
where buyer_id is null
  and customer_id is not null;
update public.orders
set total_cents = coalesce(total_cents, total_order_cents, 0)
where total_cents is null;
update public.orders
set shipping = jsonb_build_object(
  'address', coalesce(address, '{}'::jsonb),
  'destination_cep', destination_cep
)
where shipping = '{}'::jsonb;
update public.orders
set status = 'canceled'
where status = 'cancelled';
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_status_marketplace_check'
  ) then
    alter table public.orders
      add constraint orders_status_marketplace_check
      check (
        status in (
          'created',
          'paid',
          'shipped',
          'delivered',
          'canceled',
          'refunded',
          'pending',
          'processing'
        )
      );
  end if;
end
$$;
create index if not exists idx_orders_buyer_id on public.orders(buyer_id);
-- =========================================================
-- order_items
-- =========================================================
alter table public.order_items
  add column if not exists partner_id uuid references public.sellers(id) on delete set null,
  add column if not exists qty int,
  add column if not exists unit_price_cents int,
  add column if not exists subtotal_cents int;
update public.order_items
set partner_id = seller_id
where partner_id is null
  and seller_id is not null;
update public.order_items
set qty = coalesce(qty, quantity, 1)
where qty is null;
update public.order_items
set unit_price_cents = coalesce(unit_price_cents, price_cents, 0)
where unit_price_cents is null;
update public.order_items
set subtotal_cents = coalesce(subtotal_cents, total_cents, coalesce(unit_price_cents, price_cents, 0) * coalesce(qty, quantity, 1))
where subtotal_cents is null;
create index if not exists idx_order_items_partner_id on public.order_items(partner_id);
-- =========================================================
-- payouts
-- =========================================================
alter table public.payouts
  add column if not exists partner_id uuid references public.sellers(id) on delete cascade,
  add column if not exists period_start date,
  add column if not exists period_end date;
update public.payouts
set partner_id = seller_id
where partner_id is null
  and seller_id is not null;
update public.payouts
set status = 'pending'
where status = 'scheduled';
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payouts_status_marketplace_check'
  ) then
    alter table public.payouts
      add constraint payouts_status_marketplace_check
      check (
        status in ('pending', 'paid', 'failed')
      );
  end if;
end
$$;
create index if not exists idx_payouts_partner_period on public.payouts(partner_id, period_start, period_end);
