-- Scope seller RBAC by (seller_id, user_id) instead of global user_id.
-- Keeps legacy tables for rollback/manual inspection under *_legacy_20260322.

create extension if not exists "pgcrypto";

drop table if exists public.seller_user_roles_next cascade;
drop table if exists public.seller_user_permissions_next cascade;

create table public.seller_user_roles_next (
  seller_id uuid not null references public.sellers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.seller_rbac_role not null default 'OPERACAO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (seller_id, user_id)
);

create table public.seller_user_permissions_next (
  seller_id uuid not null references public.sellers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_key text not null references public.seller_permissions(key) on delete cascade,
  bool_value boolean,
  number_value numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (seller_id, user_id, permission_key),
  constraint seller_user_permissions_next_chk_value check (
    (bool_value is not null and number_value is null) or
    (bool_value is null and number_value is not null)
  )
);

insert into public.seller_user_roles_next (seller_id, user_id, role, created_at, updated_at)
select
  s.id as seller_id,
  s.user_id,
  'ADMIN'::public.seller_rbac_role as role,
  coalesce(r.created_at, now()) as created_at,
  coalesce(r.updated_at, now()) as updated_at
from public.sellers s
left join public.seller_user_roles r
  on r.user_id = s.user_id
on conflict (seller_id, user_id) do update
set
  role = excluded.role,
  updated_at = greatest(public.seller_user_roles_next.updated_at, excluded.updated_at);

insert into public.seller_user_roles_next (seller_id, user_id, role, created_at, updated_at)
select
  stm.seller_id,
  stm.user_id,
  coalesce(r.role, 'OPERACAO'::public.seller_rbac_role) as role,
  coalesce(r.created_at, stm.created_at, now()) as created_at,
  coalesce(r.updated_at, stm.updated_at, now()) as updated_at
from public.seller_team_members stm
left join public.seller_user_roles r
  on r.user_id = stm.user_id
on conflict (seller_id, user_id) do nothing;

with seller_access as (
  select s.id as seller_id, s.user_id
  from public.sellers s
  union
  select stm.seller_id, stm.user_id
  from public.seller_team_members stm
)
insert into public.seller_user_permissions_next (
  seller_id,
  user_id,
  permission_key,
  bool_value,
  number_value,
  created_at,
  updated_at
)
select
  sa.seller_id,
  p.user_id,
  p.permission_key,
  p.bool_value,
  p.number_value,
  coalesce(p.created_at, now()) as created_at,
  coalesce(p.updated_at, now()) as updated_at
from public.seller_user_permissions p
join seller_access sa
  on sa.user_id = p.user_id
on conflict (seller_id, user_id, permission_key) do update
set
  bool_value = excluded.bool_value,
  number_value = excluded.number_value,
  updated_at = greatest(public.seller_user_permissions_next.updated_at, excluded.updated_at);

alter table public.seller_user_roles rename to seller_user_roles_legacy_20260322;
alter table public.seller_user_permissions rename to seller_user_permissions_legacy_20260322;

drop trigger if exists audit_seller_user_permissions_change on public.seller_user_permissions_legacy_20260322;

alter table public.seller_user_roles_next rename to seller_user_roles;
alter table public.seller_user_permissions_next rename to seller_user_permissions;

create index if not exists idx_seller_user_roles_user_seller
  on public.seller_user_roles (user_id, seller_id);

create index if not exists idx_seller_user_roles_seller_role
  on public.seller_user_roles (seller_id, role);

create index if not exists idx_seller_user_permissions_user_seller
  on public.seller_user_permissions (user_id, seller_id);

create index if not exists idx_seller_user_permissions_seller_key
  on public.seller_user_permissions (seller_id, permission_key);

drop trigger if exists trg_seller_user_roles_updated on public.seller_user_roles;
create trigger trg_seller_user_roles_updated
before update on public.seller_user_roles
for each row execute function public.set_updated_at();

drop trigger if exists trg_seller_user_permissions_updated on public.seller_user_permissions;
create trigger trg_seller_user_permissions_updated
before update on public.seller_user_permissions
for each row execute function public.set_updated_at();

create or replace function public.bootstrap_seller_owner_rbac()
returns trigger
language plpgsql
as $$
begin
  insert into public.seller_user_roles (seller_id, user_id, role)
  values (new.id, new.user_id, 'ADMIN')
  on conflict (seller_id, user_id) do update
  set role = 'ADMIN', updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bootstrap_seller_owner_rbac on public.sellers;
create trigger trg_bootstrap_seller_owner_rbac
after insert on public.sellers
for each row execute function public.bootstrap_seller_owner_rbac();

create or replace function public.bootstrap_seller_member_rbac()
returns trigger
language plpgsql
as $$
declare
  v_role public.seller_rbac_role := 'OPERACAO';
begin
  if exists (
    select 1
    from public.sellers s
    where s.id = new.seller_id
      and s.user_id = new.user_id
  ) then
    v_role := 'ADMIN';
  end if;

  insert into public.seller_user_roles (seller_id, user_id, role)
  values (new.seller_id, new.user_id, v_role)
  on conflict (seller_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_bootstrap_seller_member_rbac on public.seller_team_members;
create trigger trg_bootstrap_seller_member_rbac
after insert on public.seller_team_members
for each row execute function public.bootstrap_seller_member_rbac();

alter table public.seller_user_roles enable row level security;
alter table public.seller_user_permissions enable row level security;

drop policy if exists seller_user_roles_select_own on public.seller_user_roles;
drop policy if exists seller_user_roles_select_scope on public.seller_user_roles;
create policy seller_user_roles_select_scope
on public.seller_user_roles
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.has_seller_tenant_access(seller_id)
);

drop policy if exists seller_user_permissions_select_own on public.seller_user_permissions;
drop policy if exists seller_user_permissions_select_scope on public.seller_user_permissions;
create policy seller_user_permissions_select_scope
on public.seller_user_permissions
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.has_seller_tenant_access(seller_id)
);

grant select on public.seller_permissions to authenticated, service_role;
grant select on public.seller_user_roles to authenticated;
grant select on public.seller_user_permissions to authenticated;
grant all on public.seller_user_roles to service_role;
grant all on public.seller_user_permissions to service_role;

revoke insert, update, delete on public.seller_user_roles from anon, authenticated;
revoke insert, update, delete on public.seller_permissions from anon, authenticated;
revoke insert, update, delete on public.seller_user_permissions from anon, authenticated;

create or replace function public.trg_audit_seller_user_permissions()
returns trigger
language plpgsql
as $$
declare
  b jsonb := '{}'::jsonb;
  a jsonb := '{}'::jsonb;
  target_user text;
  perm_key text;
  v_seller_id uuid;
begin
  if tg_op = 'INSERT' then
    target_user := new.user_id::text;
    perm_key := new.permission_key;
    v_seller_id := new.seller_id;
    a := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    target_user := new.user_id::text;
    perm_key := new.permission_key;
    v_seller_id := coalesce(new.seller_id, old.seller_id);
    b := to_jsonb(old);
    a := to_jsonb(new);
  else
    target_user := old.user_id::text;
    perm_key := old.permission_key;
    v_seller_id := old.seller_id;
    b := to_jsonb(old);
  end if;

  perform public.audit_log_write(
    coalesce(v_seller_id, public.try_parse_uuid(current_setting('app.store_id', true))),
    'user_access',
    coalesce(v_seller_id::text, '') || ':' || target_user || ':' || perm_key,
    lower(tg_op),
    'users.manage_roles',
    b,
    a,
    'user permission changed'
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_seller_user_permissions_change on public.seller_user_permissions;
create trigger audit_seller_user_permissions_change
after insert or update or delete on public.seller_user_permissions
for each row execute function public.trg_audit_seller_user_permissions();
