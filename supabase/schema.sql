-- BelaPop Supabase schema + RLS (PostgreSQL)
-- Execute no SQL Editor do Supabase.

-- 1) Enum de roles
do $$ begin
  create type public.user_role as enum ('customer','seller','admin');
exception
  when duplicate_object then null;
end $$;

-- 2) Tabela de perfis (espelha auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role public.user_role not null default 'customer',
  full_name text,
  created_at timestamptz not null default now()
);

-- 3) Sellers (lojas)
create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_name text not null,
  category text,
  postal_code text not null, -- CEP de origem
  whatsapp text,
  instagram text,
  status text not null default 'pending', -- pending|active|paused|rejected
  stripe_account_id text,
  commission_rate numeric(5,2), -- opcional (ex: 10.00)
  created_at timestamptz not null default now()
);

create index if not exists idx_sellers_user_id on public.sellers(user_id);

-- 4) Produtos
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'BRL',
  weight_kg numeric(10,3) not null default 0.300,
  width_cm numeric(10,2) not null default 10,
  height_cm numeric(10,2) not null default 10,
  length_cm numeric(10,2) not null default 10,
  stock_quantity integer not null default 0,
  images jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  image_tone text,
  status text not null default 'draft', -- draft|pending_review|needs_adjustment|published|paused|rejected
  is_featured boolean not null default false,
  curated boolean not null default false,
  curation_feedback text,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_seller_id on public.products(seller_id);
create index if not exists idx_products_status on public.products(status);

-- trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
before update on public.products
for each row execute function public.set_updated_at();

-- 5) Orders (pedido principal)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  total_products_cents integer not null default 0,
  total_shipping_cents integer not null default 0,
  total_order_cents integer not null default 0,
  status text not null default 'created', -- created|paid|cancelled|fulfilled
  payment_status text,
  payment_provider text, -- stripe
  payment_intent_id text,
  address jsonb,
  destination_cep text,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_customer on public.orders(customer_id);

-- 6) SubOrders (um por seller)
create table if not exists public.sub_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete restrict,
  items jsonb not null default '[]'::jsonb,
  product_total_cents integer not null default 0,
  shipping_total_cents integer not null default 0,
  platform_fee_cents integer not null default 0,
  seller_net_cents integer not null default 0,
  shipping_service text,
  shipping_days integer,
  status text not null default 'created', -- created|paid|awaiting_shipment|shipped|delivered|cancelled
  payment_status text,
  created_at timestamptz not null default now()
);

create index if not exists idx_suborders_order on public.sub_orders(order_id);
create index if not exists idx_suborders_seller on public.sub_orders(seller_id);

-- 7) Analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  user_id uuid references public.profiles(id) on delete set null,
  seller_id uuid references public.sellers(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_type on public.analytics_events(type);
create index if not exists idx_analytics_created on public.analytics_events(created_at);

-- 8) Notificações para lojistas
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid references public.sellers(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  cta_label text,
  cta_href text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient on public.notifications(recipient_user_id, created_at desc);
create index if not exists idx_notifications_is_read on public.notifications(is_read);

-- 9) Trigger: criar profile automaticamente quando um auth.user é criado
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer')
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.sellers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.sub_orders enable row level security;
alter table public.analytics_events enable row level security;
alter table public.notifications enable row level security;

-- Helper: checar role do usuário logado
create or replace function public.current_role()
returns public.user_role
language sql stable as $$
  select role from public.profiles where id = auth.uid()
$$;

-- PROFILES
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid() or public.current_role() = 'admin');

-- SELLERS
drop policy if exists "sellers_select" on public.sellers;
create policy "sellers_select"
on public.sellers for select
using (
  public.current_role() = 'admin'
  or user_id = auth.uid()
  or status = 'active'
);

drop policy if exists "sellers_insert_self" on public.sellers;
create policy "sellers_insert_self"
on public.sellers for insert
with check (user_id = auth.uid());

drop policy if exists "sellers_update_self_or_admin" on public.sellers;
create policy "sellers_update_self_or_admin"
on public.sellers for update
using (user_id = auth.uid() or public.current_role() = 'admin');

-- PRODUCTS
drop policy if exists "products_public_read_published" on public.products;
create policy "products_public_read_published"
on public.products for select
using (status = 'published'
  or public.current_role() = 'admin'
  or exists (
    select 1 from public.sellers s
    where s.id = products.seller_id and s.user_id = auth.uid()
  )
);

drop policy if exists "products_seller_insert" on public.products;
create policy "products_seller_insert"
on public.products for insert
with check (exists (
  select 1 from public.sellers s
  where s.id = products.seller_id and s.user_id = auth.uid()
));

drop policy if exists "products_seller_update_or_admin" on public.products;
create policy "products_seller_update_or_admin"
on public.products for update
using (
  public.current_role() = 'admin'
  or exists (
    select 1 from public.sellers s
    where s.id = products.seller_id and s.user_id = auth.uid()
  )
);

-- ORDERS (cliente vê os dele; admin vê tudo)
drop policy if exists "orders_select_customer_or_admin" on public.orders;
create policy "orders_select_customer_or_admin"
on public.orders for select
using (customer_id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "orders_insert_customer" on public.orders;
create policy "orders_insert_customer"
on public.orders for insert
with check (customer_id = auth.uid() or public.current_role() = 'admin');

-- SUB_ORDERS (seller vê os dele; admin vê tudo)
drop policy if exists "suborders_select_seller_or_admin" on public.sub_orders;
create policy "suborders_select_seller_or_admin"
on public.sub_orders for select
using (
  public.current_role() = 'admin'
  or exists (
    select 1 from public.sellers s
    where s.id = sub_orders.seller_id and s.user_id = auth.uid()
  )
  or exists (
    select 1 from public.orders o
    where o.id = sub_orders.order_id and o.customer_id = auth.uid()
  )
);

drop policy if exists "suborders_insert_customer" on public.sub_orders;
create policy "suborders_insert_customer"
on public.sub_orders for insert
with check (
  public.current_role() = 'admin'
  or exists (
    select 1 from public.orders o
    where o.id = sub_orders.order_id and o.customer_id = auth.uid()
  )
);

-- ANALYTICS
drop policy if exists "analytics_select_admin_or_seller" on public.analytics_events;
create policy "analytics_select_admin_or_seller"
on public.analytics_events for select
using (
  public.current_role() = 'admin'
  or (seller_id is not null and exists (
    select 1 from public.sellers s
    where s.id = analytics_events.seller_id and s.user_id = auth.uid()
  ))
  or (user_id = auth.uid())
);

drop policy if exists "analytics_insert_authed" on public.analytics_events;
create policy "analytics_insert_authed"
on public.analytics_events for insert
with check (auth.uid() is not null);

-- NOTIFICATIONS
drop policy if exists "notifications_select_recipient" on public.notifications;
create policy "notifications_select_recipient"
on public.notifications for select
using (
  recipient_user_id = auth.uid()
  or public.current_role() = 'admin'
);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications for update
using (recipient_user_id = auth.uid() or public.current_role() = 'admin');

drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin"
on public.notifications for insert
with check (public.current_role() = 'admin');

-- 10) Addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  full_name text,
  street text,
  number text,
  city text,
  state text,
  zip text,
  complement text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_addresses_user on public.addresses(user_id);

-- 11) Favorites
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_favorites_user on public.favorites(user_id);

-- 12) Reviews (cliente)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null,
  title text,
  body text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_user on public.reviews(user_id);
create index if not exists idx_reviews_product on public.reviews(product_id);

-- 13) Payment methods + preferences
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  type text,
  brand text,
  last4 text,
  exp_month integer,
  exp_year integer,
  is_default boolean not null default false,
  provider_ref text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_methods_user on public.payment_methods(user_id);

create table if not exists public.payment_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_method_id uuid references public.payment_methods(id) on delete set null,
  allow_save_method boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14) Wallet transactions
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  amount_cents integer not null default 0,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_user on public.wallet_transactions(user_id);

-- 15) Support tickets + messages
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open',
  subject text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_user on public.support_tickets(user_id);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_role text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_messages_ticket on public.support_messages(ticket_id);

-- 16) Notification preferences
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_opt_in boolean not null default true,
  whatsapp_opt_in boolean not null default false,
  push_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS new tables
alter table public.addresses enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payment_preferences enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.notification_preferences enable row level security;

-- Addresses policies
drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own"
on public.addresses for select
using (user_id = auth.uid());

drop policy if exists "addresses_modify_own" on public.addresses;
create policy "addresses_modify_own"
on public.addresses for insert
with check (user_id = auth.uid());

drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own"
on public.addresses for update
using (user_id = auth.uid());

drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own"
on public.addresses for delete
using (user_id = auth.uid());

-- Favorites policies
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites for select
using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites for insert
with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites for delete
using (user_id = auth.uid());

-- Reviews policies
drop policy if exists "reviews_select_own" on public.reviews;
create policy "reviews_select_own"
on public.reviews for select
using (user_id = auth.uid());

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
on public.reviews for insert
with check (user_id = auth.uid());

-- Payment methods policies
drop policy if exists "payment_methods_select_own" on public.payment_methods;
create policy "payment_methods_select_own"
on public.payment_methods for select
using (user_id = auth.uid());

drop policy if exists "payment_methods_insert_own" on public.payment_methods;
create policy "payment_methods_insert_own"
on public.payment_methods for insert
with check (user_id = auth.uid());

drop policy if exists "payment_methods_update_own" on public.payment_methods;
create policy "payment_methods_update_own"
on public.payment_methods for update
using (user_id = auth.uid());

drop policy if exists "payment_methods_delete_own" on public.payment_methods;
create policy "payment_methods_delete_own"
on public.payment_methods for delete
using (user_id = auth.uid());

-- Payment preferences policies
drop policy if exists "payment_preferences_select_own" on public.payment_preferences;
create policy "payment_preferences_select_own"
on public.payment_preferences for select
using (user_id = auth.uid());

drop policy if exists "payment_preferences_upsert_own" on public.payment_preferences;
create policy "payment_preferences_upsert_own"
on public.payment_preferences for insert
with check (user_id = auth.uid());

drop policy if exists "payment_preferences_update_own" on public.payment_preferences;
create policy "payment_preferences_update_own"
on public.payment_preferences for update
using (user_id = auth.uid());

-- Wallet policies
drop policy if exists "wallet_select_own" on public.wallet_transactions;
create policy "wallet_select_own"
on public.wallet_transactions for select
using (user_id = auth.uid());

drop policy if exists "wallet_insert_admin" on public.wallet_transactions;
create policy "wallet_insert_admin"
on public.wallet_transactions for insert
with check (public.current_role() = 'admin' or user_id = auth.uid());

-- Support policies
drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own"
on public.support_tickets for select
using (user_id = auth.uid());

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own"
on public.support_tickets for insert
with check (user_id = auth.uid());

drop policy if exists "support_messages_select_own" on public.support_messages;
create policy "support_messages_select_own"
on public.support_messages for select
using (exists (
  select 1 from public.support_tickets t
  where t.id = support_messages.ticket_id and t.user_id = auth.uid()
));

drop policy if exists "support_messages_insert_own" on public.support_messages;
create policy "support_messages_insert_own"
on public.support_messages for insert
with check (exists (
  select 1 from public.support_tickets t
  where t.id = support_messages.ticket_id and t.user_id = auth.uid()
));

-- Notification preferences policies
drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
on public.notification_preferences for select
using (user_id = auth.uid());

drop policy if exists "notification_preferences_upsert_own" on public.notification_preferences;
create policy "notification_preferences_upsert_own"
on public.notification_preferences for insert
with check (user_id = auth.uid());

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
on public.notification_preferences for update
using (user_id = auth.uid());
