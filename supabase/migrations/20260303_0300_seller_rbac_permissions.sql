-- Seller dashboard RBAC (roles + 12 granular permissions)

create extension if not exists "pgcrypto";

do $$
begin
  create type public.seller_rbac_role as enum ('ADMIN', 'OPERACAO', 'FINANCEIRO');
exception
  when duplicate_object then
    null;
end $$;

create table if not exists public.seller_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.seller_rbac_role not null default 'OPERACAO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_permissions (
  key text primary key,
  description text not null,
  value_type text not null default 'boolean',
  constraint seller_permissions_value_type_check check (value_type in ('boolean', 'number'))
);

create table if not exists public.seller_user_permissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_key text not null references public.seller_permissions(key) on delete cascade,
  bool_value boolean,
  number_value numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, permission_key),
  constraint seller_user_permissions_chk_value check (
    (bool_value is not null and number_value is null) or
    (bool_value is null and number_value is not null)
  )
);

create index if not exists idx_seller_user_permissions_user
  on public.seller_user_permissions (user_id);

insert into public.seller_permissions (key, description, value_type) values
('finance.view_details','Ver breakdown financeiro por pedido','boolean'),
('finance.export','Exportar relatorios financeiros','boolean'),
('finance.open_dispute','Abrir disputa de repasse','boolean'),
('finance.approve_adjustment','Aprovar ajuste manual financeiro','boolean'),
('promo.create','Criar promo/cupom/queima','boolean'),
('promo.pause','Pausar promo ativa','boolean'),
('promo.max_discount_percent','Limite maximo de desconto (%)','number'),
('ads.budget_change','Alterar orcamento/lances de anuncios','boolean'),
('users.manage_roles','Gerenciar roles/permissoes de usuarios','boolean'),
('audit.view','Visualizar logs de auditoria','boolean'),
('settings.edit_store','Editar configuracoes criticas da loja','boolean'),
('pii.view_full','Ver dados pessoais completos','boolean')
on conflict (key) do nothing;

alter table public.seller_user_roles enable row level security;
alter table public.seller_permissions enable row level security;
alter table public.seller_user_permissions enable row level security;

drop policy if exists seller_permissions_read_all on public.seller_permissions;
create policy seller_permissions_read_all
on public.seller_permissions
for select
to authenticated
using (true);

drop policy if exists seller_user_roles_select_own on public.seller_user_roles;
create policy seller_user_roles_select_own
on public.seller_user_roles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists seller_user_permissions_select_own on public.seller_user_permissions;
create policy seller_user_permissions_select_own
on public.seller_user_permissions
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

revoke insert, update, delete on public.seller_user_roles from anon, authenticated;
revoke insert, update, delete on public.seller_permissions from anon, authenticated;
revoke insert, update, delete on public.seller_user_permissions from anon, authenticated;
