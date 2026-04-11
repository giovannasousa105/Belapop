-- Fix RLS recursion on user_roles policies that call is_admin(auth.uid()).
-- Root cause: is_admin() read public.user_roles with invoker permissions, re-entering RLS.

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = uid
      and ur.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

