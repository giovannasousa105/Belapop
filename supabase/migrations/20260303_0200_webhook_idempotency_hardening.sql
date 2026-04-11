-- Webhook idempotency hardening + tracking event history

create extension if not exists "pgcrypto";

alter table if exists public.webhook_events
  alter column id set default gen_random_uuid();

alter table if exists public.webhook_events
  add column if not exists received_at timestamptz not null default now(),
  add column if not exists processed_at timestamptz,
  add column if not exists status text not null default 'received',
  add column if not exists error text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'webhook_events_event_id_key'
      and conrelid = 'public.webhook_events'::regclass
  ) then
    alter table public.webhook_events
      drop constraint webhook_events_event_id_key;
  end if;
exception
  when undefined_table then
    null;
end $$;

do $$
begin
  alter table public.webhook_events
    add constraint webhook_events_provider_event_unique unique (provider, event_id);
exception
  when duplicate_object then
    null;
  when undefined_table then
    null;
end $$;

create index if not exists idx_webhook_events_received_at
  on public.webhook_events (received_at desc);

create index if not exists idx_webhook_events_status_received
  on public.webhook_events (status, received_at desc);

create table if not exists public.shipment_events (
  id bigserial primary key,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  raw_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_shipment_events_shipment_occurred
  on public.shipment_events (shipment_id, occurred_at desc);
