-- Hardens notification outbox processing for GitHub Actions/Internal Jobs Cron.
-- Safe to run on fresh databases and on older BelaPop schemas.

create extension if not exists "pgcrypto";

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid null,
  automation_run_id uuid null,
  recipient_user_id uuid null,
  recipient_seller_id uuid null,
  type text null,
  channel text not null default 'in_app',
  template_key text null,
  communication_type text not null default 'transactional',
  dedupe_key text null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  scheduled_at timestamptz not null default now(),
  locked_at timestamptz null,
  processing_started_at timestamptz null,
  sent_at timestamptz null,
  processed_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_outbox
  add column if not exists event_id uuid null,
  add column if not exists automation_run_id uuid null,
  add column if not exists recipient_user_id uuid null,
  add column if not exists recipient_seller_id uuid null,
  add column if not exists type text null,
  add column if not exists channel text not null default 'in_app',
  add column if not exists template_key text null,
  add column if not exists communication_type text not null default 'transactional',
  add column if not exists dedupe_key text null,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'pending',
  add column if not exists attempts integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists scheduled_at timestamptz not null default now(),
  add column if not exists locked_at timestamptz null,
  add column if not exists processing_started_at timestamptz null,
  add column if not exists sent_at timestamptz null,
  add column if not exists processed_at timestamptz null,
  add column if not exists last_error text null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notification_outbox_status_check'
      and conrelid = 'public.notification_outbox'::regclass
  ) then
    alter table public.notification_outbox
      add constraint notification_outbox_status_check
      check (status in ('pending', 'processing', 'sent', 'failed', 'skipped'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'notification_outbox_channel_check'
      and conrelid = 'public.notification_outbox'::regclass
  ) then
    alter table public.notification_outbox
      add constraint notification_outbox_channel_check
      check (channel in ('in_app', 'email', 'whatsapp'));
  end if;

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

create unique index if not exists uq_notification_outbox_dedupe
  on public.notification_outbox (dedupe_key)
  where dedupe_key is not null;

create index if not exists idx_notification_outbox_status_created
  on public.notification_outbox (status, created_at asc);

create index if not exists idx_notification_outbox_pending
  on public.notification_outbox (status, scheduled_at asc);

create index if not exists idx_notification_outbox_processing_lock
  on public.notification_outbox (status, locked_at asc)
  where status = 'processing';

create index if not exists idx_notification_outbox_automation_run
  on public.notification_outbox (automation_run_id, status, scheduled_at asc);

do $$
begin
  alter table public.notification_outbox enable row level security;
  revoke all on table public.notification_outbox from anon, authenticated;

  drop policy if exists notification_outbox_service_all on public.notification_outbox;
  create policy notification_outbox_service_all
    on public.notification_outbox
    for all
    to service_role
    using (true)
    with check (true);
exception
  when undefined_table then
    null;
end;
$$;
