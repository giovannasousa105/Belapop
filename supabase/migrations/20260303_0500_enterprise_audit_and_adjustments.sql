-- Enterprise audit log + dual approval workflow for finance adjustments

create extension if not exists "pgcrypto";

create table if not exists public.audit_log (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  actor_ip inet,
  actor_user_agent text,
  store_id uuid references public.sellers(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  permission_used text,
  before_data jsonb,
  after_data jsonb,
  diff_data jsonb,
  request_id text,
  notes text
);

create index if not exists idx_audit_log_store_time
  on public.audit_log (store_id, occurred_at desc);

create index if not exists idx_audit_log_entity
  on public.audit_log (entity_type, entity_id, occurred_at desc);

create index if not exists idx_audit_log_actor
  on public.audit_log (actor_user_id, occurred_at desc);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_select_scope on public.audit_log;
create policy audit_log_select_scope
on public.audit_log
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = audit_log.store_id
      and s.user_id = auth.uid()
  )
);

revoke insert, update, delete on public.audit_log from anon, authenticated;

create or replace function public.try_parse_uuid(input text)
returns uuid
language plpgsql
as $$
declare
  parsed uuid;
begin
  if input is null or btrim(input) = '' then
    return null;
  end if;
  parsed := input::uuid;
  return parsed;
exception
  when others then
    return null;
end;
$$;

create or replace function public.try_parse_inet(input text)
returns inet
language plpgsql
as $$
declare
  parsed inet;
begin
  if input is null or btrim(input) = '' then
    return null;
  end if;
  parsed := split_part(input, ',', 1)::inet;
  return parsed;
exception
  when others then
    return null;
end;
$$;

create or replace function public.jsonb_shallow_diff(before_json jsonb, after_json jsonb)
returns jsonb
language sql
as $$
  with keys as (
    select k from jsonb_object_keys(coalesce(before_json, '{}'::jsonb)) as t(k)
    union
    select k from jsonb_object_keys(coalesce(after_json, '{}'::jsonb)) as t(k)
  )
  select coalesce(
    jsonb_object_agg(
      k,
      jsonb_build_object(
        'before', coalesce(before_json, '{}'::jsonb)->k,
        'after', coalesce(after_json, '{}'::jsonb)->k
      )
    ),
    '{}'::jsonb
  )
  from keys
  where (coalesce(before_json, '{}'::jsonb)->k) is distinct from (coalesce(after_json, '{}'::jsonb)->k);
$$;

create or replace function public.set_audit_context(
  p_actor_user_id uuid default null,
  p_actor_role text default null,
  p_permission_used text default null,
  p_store_id uuid default null,
  p_request_id text default null,
  p_actor_ip text default null,
  p_actor_ua text default null
)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.actor_user_id', coalesce(p_actor_user_id::text, ''), true);
  perform set_config('app.actor_role', coalesce(p_actor_role, ''), true);
  perform set_config('app.permission_used', coalesce(p_permission_used, ''), true);
  perform set_config('app.store_id', coalesce(p_store_id::text, ''), true);
  perform set_config('app.request_id', coalesce(p_request_id, ''), true);
  perform set_config('app.actor_ip', coalesce(p_actor_ip, ''), true);
  perform set_config('app.actor_ua', coalesce(p_actor_ua, ''), true);
end;
$$;

create or replace function public.audit_log_write(
  p_store_id uuid,
  p_entity_type text,
  p_entity_id text,
  p_action text,
  p_permission_used text,
  p_before jsonb,
  p_after jsonb,
  p_notes text default null
)
returns void
language plpgsql
as $$
begin
  insert into public.audit_log (
    actor_user_id,
    actor_role,
    actor_ip,
    actor_user_agent,
    store_id,
    entity_type,
    entity_id,
    action,
    permission_used,
    before_data,
    after_data,
    diff_data,
    request_id,
    notes
  )
  values (
    public.try_parse_uuid(current_setting('app.actor_user_id', true)),
    nullif(current_setting('app.actor_role', true), ''),
    public.try_parse_inet(current_setting('app.actor_ip', true)),
    nullif(current_setting('app.actor_ua', true), ''),
    p_store_id,
    p_entity_type,
    p_entity_id,
    p_action,
    coalesce(p_permission_used, nullif(current_setting('app.permission_used', true), '')),
    p_before,
    p_after,
    public.jsonb_shallow_diff(p_before, p_after),
    nullif(current_setting('app.request_id', true), ''),
    p_notes
  );
exception
  when others then
    null;
end;
$$;

create or replace function public.trg_audit_orders()
returns trigger
language plpgsql
as $$
declare
  b jsonb := to_jsonb(old);
  a jsonb := to_jsonb(new);
  v_store_id uuid;
begin
  if (b->'status') is distinct from (a->'status')
    or (b->'operational_status') is distinct from (a->'operational_status')
    or (b->'sla_status') is distinct from (a->'sla_status')
    or (b->'sla_due_at') is distinct from (a->'sla_due_at')
    or (b->'sla_deadline') is distinct from (a->'sla_deadline') then

    v_store_id := coalesce(
      public.try_parse_uuid(a->>'seller_id'),
      public.try_parse_uuid(a->>'partner_id'),
      public.try_parse_uuid(current_setting('app.store_id', true))
    );

    perform public.audit_log_write(
      v_store_id,
      'order',
      coalesce(a->>'id', b->>'id', ''),
      'update',
      null,
      b,
      a,
      'orders status/sla update'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists audit_orders_update on public.orders;
create trigger audit_orders_update
after update on public.orders
for each row
execute function public.trg_audit_orders();

create or replace function public.trg_audit_products_price()
returns trigger
language plpgsql
as $$
declare
  b jsonb := to_jsonb(old);
  a jsonb := to_jsonb(new);
  v_before jsonb;
  v_after jsonb;
  v_store_id uuid;
begin
  v_before := jsonb_build_object(
    'price', coalesce(b->'price', b->'price_cents'),
    'cost', coalesce(b->'cost', b->'cost_cents'),
    'is_active', b->'is_active'
  );
  v_after := jsonb_build_object(
    'price', coalesce(a->'price', a->'price_cents'),
    'cost', coalesce(a->'cost', a->'cost_cents'),
    'is_active', a->'is_active'
  );

  if v_before is distinct from v_after then
    v_store_id := coalesce(
      public.try_parse_uuid(a->>'seller_id'),
      public.try_parse_uuid(current_setting('app.store_id', true))
    );

    perform public.audit_log_write(
      v_store_id,
      'product',
      coalesce(a->>'id', b->>'id', ''),
      'update',
      null,
      v_before,
      v_after,
      'product price/cost/active update'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists audit_products_price on public.products;
create trigger audit_products_price
after update on public.products
for each row
execute function public.trg_audit_products_price();

create or replace function public.trg_audit_user_role()
returns trigger
language plpgsql
as $$
begin
  if old.role is distinct from new.role then
    perform public.audit_log_write(
      public.try_parse_uuid(current_setting('app.store_id', true)),
      'user_access',
      new.user_id::text,
      'update',
      'users.manage_roles',
      jsonb_build_object('role', old.role),
      jsonb_build_object('role', new.role),
      'user role changed'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists audit_user_role on public.user_roles;
create trigger audit_user_role
after update on public.user_roles
for each row
execute function public.trg_audit_user_role();

create or replace function public.trg_audit_seller_user_permissions()
returns trigger
language plpgsql
as $$
declare
  b jsonb := '{}'::jsonb;
  a jsonb := '{}'::jsonb;
  target_user text;
  perm_key text;
begin
  if tg_op = 'INSERT' then
    target_user := new.user_id::text;
    perm_key := new.permission_key;
    a := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    target_user := new.user_id::text;
    perm_key := new.permission_key;
    b := to_jsonb(old);
    a := to_jsonb(new);
  else
    target_user := old.user_id::text;
    perm_key := old.permission_key;
    b := to_jsonb(old);
  end if;

  perform public.audit_log_write(
    public.try_parse_uuid(current_setting('app.store_id', true)),
    'user_access',
    target_user || ':' || perm_key,
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
for each row
execute function public.trg_audit_seller_user_permissions();

do $$
begin
  create type public.adjustment_status as enum (
    'draft',
    'pending_approval',
    'approved',
    'rejected',
    'applied',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.finance_adjustments (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  payout_id uuid references public.payouts(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'BRL',
  reason text not null,
  evidence jsonb not null default '{}'::jsonb,
  status public.adjustment_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  applied_at timestamptz,
  applied_by uuid references public.profiles(id) on delete set null,
  requires_dual_approval boolean not null default true,
  risk_level text not null default 'high',
  request_id text,
  constraint finance_adjustments_risk_level_check
    check (risk_level in ('low','medium','high'))
);

create index if not exists idx_finance_adjustments_store_status
  on public.finance_adjustments (seller_id, status, created_at desc);

create table if not exists public.finance_adjustment_approvals (
  id bigserial primary key,
  adjustment_id uuid not null references public.finance_adjustments(id) on delete cascade,
  approver_user_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null,
  comment text,
  decided_at timestamptz not null default now(),
  unique (adjustment_id, approver_user_id),
  constraint finance_adjustment_approvals_decision_check
    check (decision in ('approved','rejected'))
);

create index if not exists idx_finance_adjustment_approvals_adjustment
  on public.finance_adjustment_approvals (adjustment_id, decided_at desc);

drop trigger if exists trg_finance_adjustments_updated_at on public.finance_adjustments;
create trigger trg_finance_adjustments_updated_at
before update on public.finance_adjustments
for each row execute function public.set_updated_at();

alter table public.finance_adjustments enable row level security;
alter table public.finance_adjustment_approvals enable row level security;

drop policy if exists finance_adjustments_select_scope on public.finance_adjustments;
create policy finance_adjustments_select_scope
on public.finance_adjustments
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = finance_adjustments.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists finance_adjustment_approvals_select_scope on public.finance_adjustment_approvals;
create policy finance_adjustment_approvals_select_scope
on public.finance_adjustment_approvals
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.finance_adjustments fa
    join public.sellers s on s.id = fa.seller_id
    where fa.id = finance_adjustment_approvals.adjustment_id
      and s.user_id = auth.uid()
  )
);

revoke insert, update, delete on public.finance_adjustments from anon, authenticated;
revoke insert, update, delete on public.finance_adjustment_approvals from anon, authenticated;

create or replace function public.finance_adjustment_refresh_status(p_adjustment_id uuid)
returns public.adjustment_status
language plpgsql
as $$
declare
  v_requires_dual boolean;
  v_status public.adjustment_status;
  v_approved_count integer := 0;
  v_rejected_count integer := 0;
  v_required_count integer := 2;
  v_next_status public.adjustment_status;
begin
  select requires_dual_approval, status
  into v_requires_dual, v_status
  from public.finance_adjustments
  where id = p_adjustment_id;

  if v_status is null then
    return null;
  end if;

  if v_status in ('cancelled', 'applied') then
    return v_status;
  end if;

  select
    count(*) filter (where decision = 'approved'),
    count(*) filter (where decision = 'rejected')
  into v_approved_count, v_rejected_count
  from public.finance_adjustment_approvals
  where adjustment_id = p_adjustment_id;

  if not coalesce(v_requires_dual, true) then
    v_required_count := 1;
  end if;

  if v_rejected_count > 0 then
    v_next_status := 'rejected';
  elsif v_approved_count >= v_required_count then
    v_next_status := 'approved';
  else
    v_next_status := 'pending_approval';
  end if;

  update public.finance_adjustments
  set
    status = v_next_status,
    approved_at = case when v_next_status = 'approved' then now() else approved_at end
  where id = p_adjustment_id;

  return v_next_status;
end;
$$;

create or replace function public.trg_finance_adjustment_approval_refresh()
returns trigger
language plpgsql
as $$
declare
  v_adjustment_id uuid;
begin
  v_adjustment_id := coalesce(new.adjustment_id, old.adjustment_id);
  perform public.finance_adjustment_refresh_status(v_adjustment_id);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_finance_adjustment_approval_refresh on public.finance_adjustment_approvals;
create trigger trg_finance_adjustment_approval_refresh
after insert or update or delete on public.finance_adjustment_approvals
for each row
execute function public.trg_finance_adjustment_approval_refresh();
