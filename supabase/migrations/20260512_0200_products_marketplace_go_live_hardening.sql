-- Products/Marketplace go-live hardening.
-- Public reads must match the checkout contract: published product, valid price,
-- available stock and a seller allowed to sell.

alter table public.products enable row level security;

drop policy if exists p0_products_public_read on public.products;
drop policy if exists "p0_products_public_read" on public.products;
drop policy if exists products_public_read_published on public.products;
drop policy if exists "products_public_read_published" on public.products;
drop policy if exists products_public_read_sellable on public.products;

create policy products_public_read_sellable
on public.products
for select
to public
using (
  (
    status = 'published'
    and price_cents > 0
    and stock_quantity > 0
    and exists (
      select 1
      from public.sellers s
      where s.id = products.seller_id
        and s.status in ('active', 'approved')
    )
  )
  or public.current_role() = 'admin'::public.user_role
  or exists (
    select 1
    from public.sellers s
    where s.id = products.seller_id
      and s.user_id = auth.uid()
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_stock_quantity_nonnegative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_stock_quantity_nonnegative
      check (stock_quantity >= 0) not valid;
  end if;
end
$$;

alter table public.products validate constraint products_stock_quantity_nonnegative;

create index if not exists idx_products_public_sellable
  on public.products (status, stock_quantity, price_cents, seller_id);

do $$
begin
  if to_regclass('public.catalog_standard_products') is not null then
    execute $sql$
      create unique index if not exists catalog_standard_products_internal_sku_unique
        on public.catalog_standard_products (lower(btrim(internal_sku)))
        where btrim(internal_sku) <> ''
    $sql$;
  end if;
end
$$;
