-- Seller team access management (members + invites)

create extension if not exists "pgcrypto";

create table if not exists public.seller_team_members (
  seller_id uuid not null references public.sellers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active',
  invited_by uuid references public.profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (seller_id, user_id),
  constraint seller_team_members_status_check check (status in ('active', 'inactive', 'pending'))
);

create index if not exists idx_seller_team_members_user_status
  on public.seller_team_members (user_id, status);

create table if not exists public.seller_team_invites (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  email text not null,
  full_name text,
  role public.seller_rbac_role not null default 'OPERACAO',
  preset_key text,
  permission_overrides jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  token uuid not null default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_team_invites_status_check check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create unique index if not exists idx_seller_team_invites_pending_unique
  on public.seller_team_invites (seller_id, lower(email))
  where status = 'pending';

create index if not exists idx_seller_team_invites_seller_status
  on public.seller_team_invites (seller_id, status, created_at desc);

drop trigger if exists trg_seller_team_members_updated on public.seller_team_members;
create trigger trg_seller_team_members_updated
before update on public.seller_team_members
for each row execute function public.set_updated_at();

drop trigger if exists trg_seller_team_invites_updated on public.seller_team_invites;
create trigger trg_seller_team_invites_updated
before update on public.seller_team_invites
for each row execute function public.set_updated_at();

insert into public.seller_team_members (seller_id, user_id, status, invited_at, accepted_at)
select s.id, s.user_id, 'active', now(), now()
from public.sellers s
on conflict (seller_id, user_id) do nothing;

insert into public.seller_user_roles (user_id, role)
select s.user_id, 'ADMIN'::public.seller_rbac_role
from public.sellers s
on conflict (user_id) do update set role = excluded.role;

alter table public.seller_team_members enable row level security;
alter table public.seller_team_invites enable row level security;

drop policy if exists seller_team_members_select on public.seller_team_members;
create policy seller_team_members_select
on public.seller_team_members
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_id and s.user_id = auth.uid()
  )
  or (
    user_id = auth.uid()
    and status = 'active'
  )
);

drop policy if exists seller_team_invites_select on public.seller_team_invites;
create policy seller_team_invites_select
on public.seller_team_invites
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = seller_id and s.user_id = auth.uid()
  )
);

revoke insert, update, delete on public.seller_team_members from anon, authenticated;
revoke insert, update, delete on public.seller_team_invites from anon, authenticated;
