# Data Model

## `profiles` (source of truth de role)
- `id uuid primary key references auth.users(id) on delete cascade`
- `role text not null check (role in ('client','partner','admin'))`
- `full_name text`
- `phone text`
- `created_at timestamptz not null default now()`

## `seller_profiles`
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid unique references auth.users(id) on delete cascade`
- `store_name text`
- `status text check (status in ('draft','pending','approved','paused','rejected')) default 'draft'`
- `postal_code text`
- `created_at timestamptz not null default now()`

## `products`
- `id uuid pk`
- `slug text unique`
- `title text`
- `price_cents int`
- `status text`
- `hero_image_url text`
- `badges text[]`
- `ritual text`
- `texture text`
- `sensation text[]`
- `result text[]`

## `articles`
- `id uuid pk`
- `slug text unique`
- `title text`
- `category text`
- `excerpt text`
- `cover_image_url text`
- `content_md text`
- `status text check (status in ('published','draft'))`
- `published_at timestamptz`
