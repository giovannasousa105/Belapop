-- Customer UX: wishlist, reviews, order status history, search synonyms

-- A) Wishlist
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists idx_wishlist_user_id on public.wishlist_items(user_id);
create index if not exists idx_wishlist_product_id on public.wishlist_items(product_id);

alter table public.wishlist_items enable row level security;

drop policy if exists "wishlist_select_own" on public.wishlist_items;
create policy "wishlist_select_own"
on public.wishlist_items for select
using (auth.uid() = user_id);

drop policy if exists "wishlist_insert_own" on public.wishlist_items;
create policy "wishlist_insert_own"
on public.wishlist_items for insert
with check (auth.uid() = user_id);

drop policy if exists "wishlist_delete_own" on public.wishlist_items;
create policy "wishlist_delete_own"
on public.wishlist_items for delete
using (auth.uid() = user_id);

-- B) Product reviews
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_item_id uuid null,
  rating integer not null check (rating between 1 and 5),
  comment text null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Optional FK to order_items, only if the table exists
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'order_items'
  ) then
    alter table public.product_reviews
      add constraint product_reviews_order_item_fk
      foreign key (order_item_id) references public.order_items(id) on delete set null;
  end if;
exception when duplicate_object then null;
end $$;

create index if not exists idx_product_reviews_product_id on public.product_reviews(product_id);
create index if not exists idx_product_reviews_user_id on public.product_reviews(user_id);

alter table public.product_reviews enable row level security;

drop policy if exists "product_reviews_select_public" on public.product_reviews;
create policy "product_reviews_select_public"
on public.product_reviews for select
using (true);

drop policy if exists "product_reviews_insert_own" on public.product_reviews;
create policy "product_reviews_insert_own"
on public.product_reviews for insert
with check (auth.uid() = user_id);

drop policy if exists "product_reviews_update_own" on public.product_reviews;
create policy "product_reviews_update_own"
on public.product_reviews for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "product_reviews_delete_own" on public.product_reviews;
create policy "product_reviews_delete_own"
on public.product_reviews for delete
using (auth.uid() = user_id);

-- C) Order status history
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order_id on public.order_status_history(order_id);

alter table public.order_status_history enable row level security;

drop policy if exists "order_status_select_owner" on public.order_status_history;
create policy "order_status_select_owner"
on public.order_status_history for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_status_history.order_id
      and o.customer_id = auth.uid()
  )
);

drop policy if exists "order_status_insert_admin" on public.order_status_history;
create policy "order_status_insert_admin"
on public.order_status_history for insert
with check (public.current_role() = 'admin');

-- D) Search synonyms (optional)
create table if not exists public.search_synonyms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  synonym text not null,
  created_at timestamptz not null default now(),
  unique (term, synonym)
);

create index if not exists idx_search_synonyms_term on public.search_synonyms(term);

alter table public.search_synonyms enable row level security;

drop policy if exists "search_synonyms_select_public" on public.search_synonyms;
create policy "search_synonyms_select_public"
on public.search_synonyms for select
using (true);
