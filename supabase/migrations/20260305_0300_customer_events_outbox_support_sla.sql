-- Customer enterprise operations: domain events, notification outbox, ticket SLA automation,
-- and secure support attachments.

create extension if not exists "pgcrypto";

create table if not exists public.platform_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  aggregate_type text not null,
  aggregate_id uuid null,
  order_id uuid null references public.orders(id) on delete set null,
  sub_order_id uuid null references public.sub_orders(id) on delete set null,
  ticket_id uuid null references public.support_tickets(id) on delete set null,
  customer_user_id uuid null references public.profiles(id) on delete set null,
  seller_id uuid null references public.sellers(id) on delete set null,
  actor_user_id uuid null references public.profiles(id) on delete set null,
  idempotency_key text null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists uq_platform_events_idempotency
  on public.platform_events (idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_platform_events_occurred_desc
  on public.platform_events (occurred_at desc);

create index if not exists idx_platform_events_order_desc
  on public.platform_events (order_id, occurred_at desc);

create index if not exists idx_platform_events_sub_order_desc
  on public.platform_events (sub_order_id, occurred_at desc);

create index if not exists idx_platform_events_ticket_desc
  on public.platform_events (ticket_id, occurred_at desc);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid null references public.platform_events(id) on delete set null,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_seller_id uuid null references public.sellers(id) on delete set null,
  channel text not null,
  template_key text not null,
  dedupe_key text null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  scheduled_at timestamptz not null default now(),
  processing_started_at timestamptz null,
  sent_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  constraint notification_outbox_channel_check check (channel in ('in_app', 'email', 'whatsapp')),
  constraint notification_outbox_status_check check (status in ('pending', 'processing', 'sent', 'failed', 'skipped'))
);

create unique index if not exists uq_notification_outbox_dedupe
  on public.notification_outbox (dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_notification_outbox_pending
  on public.notification_outbox (status, scheduled_at asc);

create index if not exists idx_notification_outbox_recipient
  on public.notification_outbox (recipient_user_id, created_at desc);

create table if not exists public.support_sla_policies (
  reason text primary key,
  first_response_hours integer not null check (first_response_hours > 0),
  resolution_hours integer not null check (resolution_hours > 0),
  escalate_after_hours integer not null check (escalate_after_hours > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.support_sla_policies (reason, first_response_hours, resolution_hours, escalate_after_hours)
values
  ('NOT_RECEIVED', 12, 72, 24),
  ('DAMAGED_ITEM', 8, 48, 16),
  ('WRONG_ITEM', 8, 48, 16),
  ('QUALITY_ISSUE', 12, 72, 24),
  ('SERVICE_ISSUE', 12, 72, 24),
  ('OTHER', 12, 72, 24)
on conflict (reason) do update
set
  first_response_hours = excluded.first_response_hours,
  resolution_hours = excluded.resolution_hours,
  escalate_after_hours = excluded.escalate_after_hours,
  updated_at = now();

alter table if exists public.support_tickets
  add column if not exists sub_order_id uuid null references public.sub_orders(id) on delete set null,
  add column if not exists store_id uuid null references public.sellers(id) on delete set null,
  add column if not exists reason text null,
  add column if not exists desired_resolution text null,
  add column if not exists first_response_due_at timestamptz null,
  add column if not exists resolution_due_at timestamptz null,
  add column if not exists last_customer_message_at timestamptz null,
  add column if not exists last_store_message_at timestamptz null,
  add column if not exists escalated_at timestamptz null,
  add column if not exists closed_at timestamptz null;

create index if not exists idx_support_tickets_store_status
  on public.support_tickets (store_id, status);

create index if not exists idx_support_tickets_due
  on public.support_tickets (first_response_due_at, resolution_due_at);

create table if not exists public.support_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticket_id uuid null references public.support_tickets(id) on delete set null,
  bucket text not null default 'support-attachments',
  storage_path text not null,
  filename text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  status text not null default 'pending',
  uploaded_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint support_attachments_status_check check (status in ('pending', 'uploaded', 'failed', 'deleted'))
);

create unique index if not exists uq_support_attachments_storage
  on public.support_attachments (bucket, storage_path);

create index if not exists idx_support_attachments_user_created
  on public.support_attachments (user_id, created_at desc);

do $$
begin
  if to_regclass('public.platform_events') is not null then
    alter table public.platform_events enable row level security;
    revoke all on table public.platform_events from anon;
    grant select on table public.platform_events to authenticated;

    drop policy if exists platform_events_admin_select on public.platform_events;
    create policy platform_events_admin_select
      on public.platform_events
      for select
      to authenticated
      using (public.is_admin(auth.uid()));

    drop policy if exists platform_events_service_all on public.platform_events;
    create policy platform_events_service_all
      on public.platform_events
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.notification_outbox') is not null then
    alter table public.notification_outbox enable row level security;
    revoke all on table public.notification_outbox from anon, authenticated;

    drop policy if exists notification_outbox_service_all on public.notification_outbox;
    create policy notification_outbox_service_all
      on public.notification_outbox
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.support_sla_policies') is not null then
    alter table public.support_sla_policies enable row level security;
    revoke all on table public.support_sla_policies from anon;
    grant select on table public.support_sla_policies to authenticated;

    drop policy if exists support_sla_policies_admin_select on public.support_sla_policies;
    create policy support_sla_policies_admin_select
      on public.support_sla_policies
      for select
      to authenticated
      using (public.is_admin(auth.uid()));

    drop policy if exists support_sla_policies_service_all on public.support_sla_policies;
    create policy support_sla_policies_service_all
      on public.support_sla_policies
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.support_attachments') is not null then
    alter table public.support_attachments enable row level security;
    revoke all on table public.support_attachments from anon;
    grant select, insert, update on table public.support_attachments to authenticated;

    drop policy if exists support_attachments_select_own on public.support_attachments;
    create policy support_attachments_select_own
      on public.support_attachments
      for select
      to authenticated
      using (auth.uid() = user_id or public.is_admin(auth.uid()));

    drop policy if exists support_attachments_insert_own on public.support_attachments;
    create policy support_attachments_insert_own
      on public.support_attachments
      for insert
      to authenticated
      with check (auth.uid() = user_id or public.is_admin(auth.uid()));

    drop policy if exists support_attachments_update_own on public.support_attachments;
    create policy support_attachments_update_own
      on public.support_attachments
      for update
      to authenticated
      using (auth.uid() = user_id or public.is_admin(auth.uid()))
      with check (auth.uid() = user_id or public.is_admin(auth.uid()));

    drop policy if exists support_attachments_service_all on public.support_attachments;
    create policy support_attachments_service_all
      on public.support_attachments
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end;
$$;

