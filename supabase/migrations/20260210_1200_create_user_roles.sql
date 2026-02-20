-- user roles bootstrap and admin helper

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','seller','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = uid
      and ur.role = 'admin'
  );
$$;

alter table public.user_roles enable row level security;

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_roles_admin_select_all on public.user_roles;
create policy user_roles_admin_select_all
on public.user_roles
for select
to authenticated
using (public.is_admin(auth.uid()));

-- block client-side writes; only service role can mutate
revoke insert, update, delete on public.user_roles from anon, authenticated;

-- How to promote an admin (run in SQL Editor):
-- insert into public.user_roles (user_id, role)
-- values ('<UUID>', 'admin')
-- on conflict (user_id) do update set role = 'admin';
