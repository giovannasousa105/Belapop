-- Multi-role support without breaking existing user_roles behavior.
-- user_roles remains the "active role" pointer used by legacy code.
-- user_role_memberships stores every role granted to a user.

create table if not exists public.user_role_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'seller', 'admin')),
  granted_at timestamptz not null default now(),
  granted_by uuid null references auth.users(id) on delete set null,
  source text not null default 'system',
  primary key (user_id, role)
);

create index if not exists idx_user_role_memberships_role
  on public.user_role_memberships (role);

create index if not exists idx_user_role_memberships_user
  on public.user_role_memberships (user_id);

alter table public.user_role_memberships enable row level security;

drop policy if exists user_role_memberships_select_own on public.user_role_memberships;
create policy user_role_memberships_select_own
on public.user_role_memberships
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_role_memberships_admin_select_all on public.user_role_memberships;
create policy user_role_memberships_admin_select_all
on public.user_role_memberships
for select
to authenticated
using (public.is_admin(auth.uid()));

revoke insert, update, delete on public.user_role_memberships from anon, authenticated;

-- Backfill from active role table.
insert into public.user_role_memberships (user_id, role, source)
select ur.user_id, ur.role, 'backfill-user_roles'
from public.user_roles ur
on conflict (user_id, role) do nothing;

-- Backfill from profiles (legacy role field).
insert into public.user_role_memberships (user_id, role, source)
select p.id as user_id, p.role::text as role, 'backfill-profiles'
from public.profiles p
where p.role::text in ('customer', 'seller', 'admin')
on conflict (user_id, role) do nothing;

-- Backfill seller grants from seller records.
insert into public.user_role_memberships (user_id, role, source)
select s.user_id, 'seller', 'backfill-sellers'
from public.sellers s
where s.user_id is not null
on conflict (user_id, role) do nothing;

insert into public.user_role_memberships (user_id, role, source)
select sp.user_id, 'seller', 'backfill-seller-profiles'
from public.seller_profiles sp
where sp.user_id is not null
on conflict (user_id, role) do nothing;

-- Ensure every profile has an active role pointer for legacy compatibility.
insert into public.user_roles (user_id, role)
select
  p.id as user_id,
  case
    when p.role::text = 'admin' then 'admin'
    when p.role::text = 'seller' then 'seller'
    else 'customer'
  end as role
from public.profiles p
where not exists (
  select 1
  from public.user_roles ur
  where ur.user_id = p.id
);

create or replace function public.has_portal_role(uid uuid, required_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    uid is not null
    and lower(coalesce(required_role, '')) in ('customer', 'seller', 'admin')
    and (
      exists (
        select 1
        from public.user_role_memberships rm
        where rm.user_id = uid
          and rm.role = lower(required_role)
      )
      or exists (
        select 1
        from public.user_roles ur
        where ur.user_id = uid
          and ur.role = lower(required_role)
      )
      or (
        lower(required_role) = 'seller'
        and (
          exists (select 1 from public.sellers s where s.user_id = uid)
          or exists (select 1 from public.seller_profiles sp where sp.user_id = uid)
        )
      )
    );
$$;

revoke all on function public.has_portal_role(uuid, text) from public;
grant execute on function public.has_portal_role(uuid, text) to anon, authenticated, service_role;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_portal_role(uid, 'admin');
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- Active role is resolved from user_roles first, then profiles fallback.
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case
        when ur.role = 'admin' then 'admin'::public.user_role
        when ur.role = 'seller' then 'seller'::public.user_role
        else 'customer'::public.user_role
      end
      from public.user_roles ur
      where ur.user_id = auth.uid()
      limit 1
    ),
    'customer'::public.user_role
  );
$$;

revoke all on function public.current_role() from public;
grant execute on function public.current_role() to anon, authenticated, service_role;
