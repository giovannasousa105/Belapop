-- P0 portal hardening
-- - ensure profile bootstrap on new auth users (default customer/client role)
-- - enforce baseline RLS policies for products, orders, profiles and articles

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer'::public.user_role)
  on conflict (id) do update
    set email = excluded.email
  where public.profiles.email is null;

  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;
drop policy if exists p0_products_public_read on public.products;
create policy p0_products_public_read
on public.products
for select
to public
using (
  status in ('active', 'published')
  or public.current_role() = 'admin'::public.user_role
);
drop policy if exists p0_orders_select_own_or_admin on public.orders;
create policy p0_orders_select_own_or_admin
on public.orders
for select
to authenticated
using (
  customer_id = auth.uid()
  or buyer_id = auth.uid()
  or public.current_role() = 'admin'::public.user_role
);
drop policy if exists p0_profiles_select_own_or_admin on public.profiles;
create policy p0_profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.current_role() = 'admin'::public.user_role
);
drop policy if exists p0_profiles_update_own_or_admin on public.profiles;
create policy p0_profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.current_role() = 'admin'::public.user_role
)
with check (
  id = auth.uid()
  or public.current_role() = 'admin'::public.user_role
);
do $$
begin
  if to_regclass('public.articles') is not null then
    execute 'alter table public.articles enable row level security';
    execute 'drop policy if exists p0_articles_public_read on public.articles';
    execute $sql$
      create policy p0_articles_public_read
      on public.articles
      for select
      to public
      using (
        status = 'published'
        or public.current_role() = 'admin'::public.user_role
      )
    $sql$;
  end if;
end
$$;
