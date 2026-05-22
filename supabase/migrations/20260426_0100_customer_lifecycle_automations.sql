-- Customer lifecycle automations: post-purchase, replenishment, complementary
-- recommendations and abandoned-interest follow-up.

create extension if not exists pgcrypto;

create table if not exists public.customer_lifecycle_automation_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  automation_key text not null,
  communication_type text not null default 'transactional',
  customer_user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid null references public.orders(id) on delete cascade,
  order_item_id uuid null references public.order_items(id) on delete cascade,
  cart_id uuid null references public.carts(id) on delete set null,
  product_id uuid null references public.products(id) on delete set null,
  status text not null default 'scheduled',
  channels text[] not null default '{}'::text[],
  scheduled_at timestamptz not null,
  queued_at timestamptz null,
  finalized_at timestamptz null,
  canceled_reason text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_lifecycle_runs_communication_type_check check (
    communication_type in ('transactional', 'marketing')
  ),
  constraint customer_lifecycle_runs_status_check check (
    status in ('scheduled', 'queued', 'sent', 'skipped', 'canceled', 'failed')
  )
);

create index if not exists idx_customer_lifecycle_runs_due
  on public.customer_lifecycle_automation_runs (status, scheduled_at asc);

create index if not exists idx_customer_lifecycle_runs_customer
  on public.customer_lifecycle_automation_runs (customer_user_id, created_at desc);

create index if not exists idx_customer_lifecycle_runs_order
  on public.customer_lifecycle_automation_runs (order_id, automation_key);

create index if not exists idx_customer_lifecycle_runs_product
  on public.customer_lifecycle_automation_runs (product_id, automation_key);

create table if not exists public.product_complements (
  id uuid primary key default gen_random_uuid(),
  source_product_id uuid not null references public.products(id) on delete cascade,
  target_product_id uuid not null references public.products(id) on delete cascade,
  reason text null,
  position integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_complements_unique_pair unique (source_product_id, target_product_id),
  constraint product_complements_distinct_products check (source_product_id <> target_product_id)
);

create index if not exists idx_product_complements_source_position
  on public.product_complements (source_product_id, active, position asc);

alter table public.notification_outbox
  add column if not exists automation_run_id uuid null references public.customer_lifecycle_automation_runs(id) on delete set null,
  add column if not exists communication_type text not null default 'transactional';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notification_outbox_communication_type_check'
      and conrelid = 'public.notification_outbox'::regclass
  ) then
    alter table public.notification_outbox
      add constraint notification_outbox_communication_type_check
      check (communication_type in ('transactional', 'marketing'));
  end if;
end;
$$;

create index if not exists idx_notification_outbox_automation_run
  on public.notification_outbox (automation_run_id, status, scheduled_at asc);

drop trigger if exists trg_customer_lifecycle_automation_runs_updated on public.customer_lifecycle_automation_runs;
create trigger trg_customer_lifecycle_automation_runs_updated
before update on public.customer_lifecycle_automation_runs
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_complements_updated on public.product_complements;
create trigger trg_product_complements_updated
before update on public.product_complements
for each row execute function public.set_updated_at();

do $$
begin
  alter table public.customer_lifecycle_automation_runs enable row level security;
  revoke all on table public.customer_lifecycle_automation_runs from anon, authenticated;

  drop policy if exists customer_lifecycle_runs_service_all on public.customer_lifecycle_automation_runs;
  create policy customer_lifecycle_runs_service_all
    on public.customer_lifecycle_automation_runs
    for all
    to service_role
    using (true)
    with check (true);

  alter table public.product_complements enable row level security;
  revoke all on table public.product_complements from anon;
  grant select on table public.product_complements to authenticated;

  drop policy if exists product_complements_public_read on public.product_complements;
  create policy product_complements_public_read
    on public.product_complements
    for select
    to authenticated
    using (true);

  drop policy if exists product_complements_service_all on public.product_complements;
  create policy product_complements_service_all
    on public.product_complements
    for all
    to service_role
    using (true)
    with check (true);
exception
  when undefined_table then
    null;
end;
$$;
