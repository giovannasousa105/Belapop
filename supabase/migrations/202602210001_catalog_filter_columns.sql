-- Catalog filter columns + indexes for editorial search

alter table public.products
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists skin_type text[] not null default '{}'::text[],
  add column if not exists finish text[] not null default '{}'::text[];
create index if not exists idx_products_brand_catalog on public.products (brand);
create index if not exists idx_products_ritual_catalog on public.products (ritual);
create index if not exists idx_products_texture_catalog on public.products (texture);
create index if not exists idx_products_price_catalog on public.products (price_cents);
create index if not exists idx_products_stock_catalog on public.products (stock_quantity);
create index if not exists idx_products_sensation_gin on public.products using gin (sensation);
create index if not exists idx_products_result_gin on public.products using gin (result);
create index if not exists idx_products_tags_gin on public.products using gin (tags);
create index if not exists idx_products_skin_type_gin on public.products using gin (skin_type);
create index if not exists idx_products_finish_gin on public.products using gin (finish);
