-- User roles & seller profiles (login flows)

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'seller', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  store_name text,
  status text not null default 'draft' check (status in ('draft','pending','approved','paused','rejected')),
  postal_code text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.user_roles
    where user_id = uid
      and role = 'admin'
  );
$$;

alter table public.user_roles enable row level security;
create policy "user_roles_select_own" on public.user_roles
  for select using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "user_roles_insert_self" on public.user_roles
  for insert with check (user_id = auth.uid() and role in ('customer','seller'));
create policy "user_roles_admin_all" on public.user_roles
  for all using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

alter table public.seller_profiles enable row level security;
create policy "seller_profiles_select_own" on public.seller_profiles
  for select using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "seller_profiles_insert_own" on public.seller_profiles
  for insert with check (user_id = auth.uid());
create policy "seller_profiles_update_own" on public.seller_profiles
  for update using (user_id = auth.uid() or public.is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

-- Promote a user to admin (run in Supabase SQL editor)
-- insert into public.user_roles (user_id, role)
-- values ('<UUID>', 'admin')
-- on conflict (user_id) do update set role = 'admin';
