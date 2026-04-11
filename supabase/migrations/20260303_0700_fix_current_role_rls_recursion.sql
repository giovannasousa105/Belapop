-- Fix RLS recursion causing "54001: stack depth limit exceeded" on products/profile reads.
-- Root cause: current_role() queried public.profiles while profiles policies also called current_role().

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

revoke all on function public.current_role() from public;
grant execute on function public.current_role() to anon, authenticated, service_role;

