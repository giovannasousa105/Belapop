-- Phase 2: reverse logistics automation + SRE operations + near-real-time ranking/A-B attribution.
-- Safe to re-run.

create extension if not exists "pgcrypto";

-- =========================================================
-- Reverse logistics + logistics exceptions
-- =========================================================

create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sub_order_id uuid not null references public.sub_orders(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  customer_id uuid null references public.profiles(id) on delete set null,
  support_ticket_id uuid null references public.support_tickets(id) on delete set null,
  request_type text not null default 'refund'
    check (request_type in ('refund', 'exchange', 'reship', 'return_only')),
  reason text not null default 'OTHER',
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'in_transit', 'received', 'resolved', 'rejected', 'cancelled')),
  exception_sla_due_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_return_requests_seller_status_created
  on public.return_requests (seller_id, status, created_at desc);

create index if not exists idx_return_requests_customer_created
  on public.return_requests (customer_id, created_at desc);

create unique index if not exists uq_return_requests_ticket
  on public.return_requests (support_ticket_id)
  where support_ticket_id is not null;

drop trigger if exists trg_return_requests_updated on public.return_requests;
create trigger trg_return_requests_updated
before update on public.return_requests
for each row execute function public.set_updated_at();

create table if not exists public.logistics_exception_policies (
  exception_code text primary key,
  default_severity text not null default 'warn'
    check (default_severity in ('info', 'warn', 'critical')),
  sla_hours integer not null default 12 check (sla_hours > 0),
  auto_escalate boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.logistics_exception_policies (exception_code, default_severity, sla_hours, auto_escalate, active)
values
  ('delivery_delay', 'warn', 12, true, true),
  ('tracking_stalled', 'warn', 24, true, true),
  ('delivery_exception', 'critical', 4, true, true),
  ('return_stalled', 'warn', 24, true, true)
on conflict (exception_code) do update
set
  default_severity = excluded.default_severity,
  sla_hours = excluded.sla_hours,
  auto_escalate = excluded.auto_escalate,
  active = excluded.active,
  updated_at = now();

drop trigger if exists trg_logistics_exception_policies_updated on public.logistics_exception_policies;
create trigger trg_logistics_exception_policies_updated
before update on public.logistics_exception_policies
for each row execute function public.set_updated_at();

create table if not exists public.logistics_exceptions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sub_order_id uuid not null references public.sub_orders(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  exception_code text not null,
  severity text not null default 'warn'
    check (severity in ('info', 'warn', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'escalated', 'resolved', 'dismissed')),
  source text not null default 'system',
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  detected_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  sla_due_at timestamptz not null,
  escalated_at timestamptz,
  resolved_at timestamptz,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_logistics_exceptions_seller_status
  on public.logistics_exceptions (seller_id, status, severity, sla_due_at);

create index if not exists idx_logistics_exceptions_sub_order
  on public.logistics_exceptions (sub_order_id, created_at desc);

drop trigger if exists trg_logistics_exceptions_updated on public.logistics_exceptions;
create trigger trg_logistics_exceptions_updated
before update on public.logistics_exceptions
for each row execute function public.set_updated_at();

create or replace function public.sync_return_request_from_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_type text;
  v_reason text := upper(coalesce(new.reason, 'OTHER'));
  v_customer_id uuid;
  v_seller_id uuid;
begin
  if new.sub_order_id is null then
    return new;
  end if;

  if coalesce(new.desired_resolution, '') = '' then
    return new;
  end if;

  v_request_type := case
    when lower(new.desired_resolution) in ('refund', 'estorno', 'reembolso') then 'refund'
    when lower(new.desired_resolution) in ('exchange', 'troca') then 'exchange'
    when lower(new.desired_resolution) in ('reship', 'resend', 'reenvio') then 'reship'
    else 'return_only'
  end;

  select o.customer_id into v_customer_id
  from public.orders o
  where o.id = new.order_id;

  v_seller_id := coalesce(new.store_id, (select so.seller_id from public.sub_orders so where so.id = new.sub_order_id));
  if v_seller_id is null then
    return new;
  end if;

  insert into public.return_requests (
    order_id,
    sub_order_id,
    seller_id,
    customer_id,
    support_ticket_id,
    request_type,
    reason,
    status,
    exception_sla_due_at,
    metadata
  )
  values (
    new.order_id,
    new.sub_order_id,
    v_seller_id,
    v_customer_id,
    new.id,
    v_request_type,
    v_reason,
    case
      when upper(coalesce(new.status, 'OPEN')) in ('CANCELLED', 'CANCELED', 'CLOSED') then 'cancelled'
      else 'requested'
    end,
    coalesce(new.resolution_due_at, now() + interval '48 hours'),
    jsonb_build_object(
      'ticket_status', upper(coalesce(new.status, 'OPEN')),
      'desired_resolution', new.desired_resolution,
      'priority', coalesce(new.priority, 'normal')
    )
  )
  on conflict (support_ticket_id) do update
  set
    request_type = excluded.request_type,
    reason = excluded.reason,
    status = excluded.status,
    exception_sla_due_at = excluded.exception_sla_due_at,
    metadata = excluded.metadata,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_support_ticket_to_return_request on public.support_tickets;
create trigger trg_support_ticket_to_return_request
after insert or update on public.support_tickets
for each row
when (new.sub_order_id is not null and coalesce(new.desired_resolution, '') <> '')
execute function public.sync_return_request_from_ticket();

create or replace function public.sync_sub_order_status_from_return_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_status text;
begin
  v_next_status := case
    when new.status = 'requested' then 'return_requested'
    when new.status = 'approved' then 'return_requested'
    when new.status = 'in_transit' then 'return_in_transit'
    when new.status = 'received' then 'return_received'
    when new.status = 'resolved' and new.request_type = 'refund' then 'refunded'
    when new.status = 'resolved' and new.request_type = 'exchange' then 'exchanged'
    when new.status = 'resolved' and new.request_type = 'reship' then 'shipped'
    when new.status = 'cancelled' then null
    else null
  end;

  if v_next_status is not null then
    update public.sub_orders so
    set status = v_next_status
    where so.id = new.sub_order_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_return_request_to_sub_order on public.return_requests;
create trigger trg_return_request_to_sub_order
after insert or update on public.return_requests
for each row
execute function public.sync_sub_order_status_from_return_request();

create or replace function public.refresh_logistics_exceptions(
  p_limit integer default 500
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_upserted integer := 0;
  v_resolved integer := 0;
begin
  with policy as (
    select
      coalesce((select lep.sla_hours from public.logistics_exception_policies lep where lep.exception_code = 'delivery_delay' and lep.active), 12) as sla_hours,
      coalesce((select lep.default_severity from public.logistics_exception_policies lep where lep.exception_code = 'delivery_delay' and lep.active), 'warn') as severity
  ),
  delayed as (
    select
      so.id as sub_order_id,
      so.order_id,
      so.seller_id,
      so.status,
      so.shipping_days,
      so.created_at,
      greatest(
        0,
        floor(extract(epoch from (now() - (so.created_at + make_interval(days => greatest(coalesce(so.shipping_days, 0), 0))))) / 86400)
      )::int as overdue_days
    from public.sub_orders so
    where coalesce(so.shipping_days, 0) > 0
      and lower(coalesce(so.status, '')) not in ('delivered', 'cancelled', 'canceled', 'refunded', 'exchanged')
      and now() > so.created_at + make_interval(days => greatest(coalesce(so.shipping_days, 0), 0))
    order by so.created_at asc
    limit greatest(1, least(coalesce(p_limit, 500), 5000))
  )
  insert into public.logistics_exceptions (
    order_id,
    sub_order_id,
    seller_id,
    exception_code,
    severity,
    status,
    source,
    payload,
    dedupe_key,
    detected_at,
    last_seen_at,
    sla_due_at,
    created_at
  )
  select
    d.order_id,
    d.sub_order_id,
    d.seller_id,
    'delivery_delay',
    case when d.overdue_days >= 3 then 'critical' else (select severity from policy) end,
    'open',
    'sub_orders',
    jsonb_build_object(
      'sub_order_status', d.status,
      'shipping_days', d.shipping_days,
      'overdue_days', d.overdue_days
    ),
    md5('delivery_delay:' || d.sub_order_id::text),
    now(),
    now(),
    now() + make_interval(hours => (select sla_hours from policy)),
    now()
  from delayed d
  on conflict (dedupe_key) do update
  set
    severity = excluded.severity,
    status = case
      when public.logistics_exceptions.status in ('resolved', 'dismissed') then 'open'
      else public.logistics_exceptions.status
    end,
    payload = excluded.payload,
    last_seen_at = now(),
    sla_due_at = excluded.sla_due_at,
    resolved_at = null,
    updated_at = now();

  get diagnostics v_upserted = row_count;

  update public.logistics_exceptions le
  set
    status = 'resolved',
    resolved_at = now(),
    updated_at = now()
  from public.sub_orders so
  where le.sub_order_id = so.id
    and le.exception_code = 'delivery_delay'
    and le.status in ('open', 'in_progress', 'escalated')
    and lower(coalesce(so.status, '')) in ('delivered', 'cancelled', 'canceled', 'refunded', 'exchanged');

  get diagnostics v_resolved = row_count;
  return v_upserted + v_resolved;
end;
$$;

create or replace function public.escalate_logistics_exceptions(
  p_limit integer default 200
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  with candidate as (
    select
      le.id,
      le.order_id,
      le.sub_order_id,
      le.seller_id,
      le.exception_code,
      le.severity
    from public.logistics_exceptions le
    where le.status = 'open'
      and le.sla_due_at <= now()
      and coalesce(
        (
          select p.auto_escalate
          from public.logistics_exception_policies p
          where p.exception_code = le.exception_code
            and p.active = true
          limit 1
        ),
        true
      ) = true
    order by le.sla_due_at asc
    limit greatest(1, least(coalesce(p_limit, 200), 2000))
    for update skip locked
  ),
  escalated as (
    update public.logistics_exceptions le
    set
      status = 'escalated',
      escalated_at = now(),
      updated_at = now()
    from candidate c
    where le.id = c.id
    returning c.*
  )
  insert into public.support_tickets (
    customer_id,
    order_id,
    status,
    priority,
    sla_deadline,
    created_at,
    sub_order_id,
    store_id,
    reason,
    desired_resolution
  )
  select
    o.customer_id,
    e.order_id,
    'IN_REVIEW',
    case when e.severity = 'critical' then 'high' else 'normal' end,
    now() + interval '24 hours',
    now(),
    e.sub_order_id,
    e.seller_id,
    'LOGISTICS_EXCEPTION',
    'info'
  from escalated e
  join public.orders o on o.id = e.order_id
  where not exists (
    select 1
    from public.support_tickets st
    where st.sub_order_id = e.sub_order_id
      and upper(coalesce(st.reason, '')) = 'LOGISTICS_EXCEPTION'
      and upper(coalesce(st.status, 'OPEN')) in ('OPEN', 'WAITING_STORE', 'WAITING_CUSTOMER', 'IN_REVIEW', 'ESCALATED')
  );

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.create_finance_ops_alerts_from_logistics_exceptions(
  p_limit integer default 200
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  insert into public.finance_ops_alerts (
    alert_type,
    severity,
    seller_id,
    title,
    body,
    payload,
    dedupe_key,
    created_at
  )
  select
    'logistics_exception_sla',
    case when le.severity = 'critical' then 'critical' else 'warn' end,
    le.seller_id,
    'Excecao logistica com SLA estourado',
    format(
      'Subpedido %s com excecao %s em estado %s (SLA %s).',
      le.sub_order_id::text,
      le.exception_code,
      le.status,
      coalesce(le.sla_due_at::text, '-')
    ),
    jsonb_build_object(
      'logistics_exception_id', le.id,
      'order_id', le.order_id,
      'sub_order_id', le.sub_order_id,
      'seller_id', le.seller_id,
      'exception_code', le.exception_code,
      'severity', le.severity,
      'status', le.status,
      'sla_due_at', le.sla_due_at
    ),
    md5('logistics_exception_sla:' || le.id::text),
    now()
  from public.logistics_exceptions le
  where le.status in ('open', 'escalated')
    and le.sla_due_at <= now()
    and le.notified_at is null
  order by le.sla_due_at asc
  limit greatest(1, least(coalesce(p_limit, 200), 2000))
  on conflict (dedupe_key) do update
  set
    severity = excluded.severity,
    title = excluded.title,
    body = excluded.body,
    payload = excluded.payload,
    status = 'open';

  get diagnostics v_rows = row_count;

  update public.logistics_exceptions le
  set notified_at = now(), updated_at = now()
  where le.notified_at is null
    and exists (
      select 1
      from public.finance_ops_alerts fa
      where fa.alert_type = 'logistics_exception_sla'
        and fa.dedupe_key = md5('logistics_exception_sla:' || le.id::text)
    );

  return v_rows;
end;
$$;

-- =========================================================
-- SRE operational core (SLO/SLI + incidents + DR evidence)
-- =========================================================

create table if not exists public.service_slo_targets (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  sli_key text not null,
  target_pct numeric(6,3) not null check (target_pct > 0 and target_pct <= 100),
  window_minutes integer not null check (window_minutes > 0),
  warn_delta_pct numeric(6,3) not null default 0.30,
  critical_delta_pct numeric(6,3) not null default 1.00,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_key, sli_key, window_minutes)
);

insert into public.service_slo_targets (service_key, sli_key, target_pct, window_minutes, warn_delta_pct, critical_delta_pct, active)
values
  ('api.v1', 'availability', 99.950, 60, 0.30, 1.00, true),
  ('internal.jobs', 'success_rate', 99.000, 60, 0.50, 1.50, true),
  ('checkout.payment', 'success_rate', 99.500, 60, 0.50, 1.20, true),
  ('webhooks.ingestion', 'success_rate', 99.900, 60, 0.30, 1.00, true)
on conflict (service_key, sli_key, window_minutes) do update
set
  target_pct = excluded.target_pct,
  warn_delta_pct = excluded.warn_delta_pct,
  critical_delta_pct = excluded.critical_delta_pct,
  active = excluded.active,
  updated_at = now();

drop trigger if exists trg_service_slo_targets_updated on public.service_slo_targets;
create trigger trg_service_slo_targets_updated
before update on public.service_slo_targets
for each row execute function public.set_updated_at();

create table if not exists public.service_sli_events (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  sli_key text not null,
  is_good boolean not null,
  latency_ms integer,
  attributes jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_service_sli_events_key_time
  on public.service_sli_events (service_key, sli_key, occurred_at desc);

create table if not exists public.service_sli_rollups (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  sli_key text not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  total_events bigint not null default 0,
  bad_events bigint not null default 0,
  good_rate_pct numeric(6,3) not null default 0,
  status text not null default 'ok'
    check (status in ('ok', 'warn', 'critical')),
  details jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  unique (service_key, sli_key, window_start, window_end)
);

create index if not exists idx_service_sli_rollups_status_time
  on public.service_sli_rollups (status, computed_at desc);

create table if not exists public.sre_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_key text not null unique,
  service_key text not null,
  sli_key text not null,
  severity text not null check (severity in ('sev1', 'sev2', 'sev3', 'sev4')),
  status text not null default 'open'
    check (status in ('open', 'investigating', 'mitigating', 'resolved', 'postmortem')),
  title text not null,
  summary text not null,
  runbook_url text,
  owner_user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sre_incidents_status_started
  on public.sre_incidents (status, started_at desc);

drop trigger if exists trg_sre_incidents_updated on public.sre_incidents;
create trigger trg_sre_incidents_updated
before update on public.sre_incidents
for each row execute function public.set_updated_at();

create table if not exists public.sre_incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.sre_incidents(id) on delete cascade,
  event_type text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sre_incident_events_incident_time
  on public.sre_incident_events (incident_id, created_at desc);

create table if not exists public.sre_runbooks (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  slug text not null unique,
  title text not null,
  markdown text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_sre_runbooks_updated on public.sre_runbooks;
create trigger trg_sre_runbooks_updated
before update on public.sre_runbooks
for each row execute function public.set_updated_at();

insert into public.sre_runbooks (service_key, slug, title, markdown, active)
values
  (
    'api.v1',
    'api-v1-availability',
    'Runbook API V1 Availability',
    E'# API V1 Availability\n\n1. Validar erro por endpoint e tenant.\n2. Confirmar deploy/feature flags recentes.\n3. Acionar rollback se erro > 5 minutos.\n4. Comunicar status em 15 minutos.',
    true
  ),
  (
    'internal.jobs',
    'internal-jobs-failures',
    'Runbook Internal Jobs',
    E'# Internal Jobs\n\n1. Verificar filas pendentes e locks.\n2. Rodar job manual com limite pequeno.\n3. Validar segredos e conectividade.\n4. Abrir incidente se backlog > 30 minutos.',
    true
  )
on conflict (slug) do update
set
  service_key = excluded.service_key,
  title = excluded.title,
  markdown = excluded.markdown,
  active = excluded.active,
  updated_at = now();

create table if not exists public.dr_test_runs (
  id uuid primary key default gen_random_uuid(),
  scenario_key text not null,
  status text not null
    check (status in ('scheduled', 'running', 'passed', 'failed', 'cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  rto_minutes integer,
  rpo_minutes integer,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_dr_test_runs_scenario_created
  on public.dr_test_runs (scenario_key, created_at desc);

create or replace function public.record_sli_event(
  p_service_key text,
  p_sli_key text,
  p_is_good boolean,
  p_latency_ms integer default null,
  p_attributes jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into public.service_sli_events (
    id,
    service_key,
    sli_key,
    is_good,
    latency_ms,
    attributes,
    occurred_at,
    created_at
  )
  values (
    v_id,
    lower(coalesce(p_service_key, 'unknown')),
    lower(coalesce(p_sli_key, 'availability')),
    coalesce(p_is_good, false),
    p_latency_ms,
    coalesce(p_attributes, '{}'::jsonb),
    now(),
    now()
  );

  return v_id;
end;
$$;

create or replace function public.evaluate_slo_breaches(
  p_window_minutes integer default 60
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_window integer := greatest(5, least(coalesce(p_window_minutes, 60), 1440));
begin
  with defs as (
    select *
    from public.service_slo_targets t
    where t.active = true
      and t.window_minutes = v_window
  ),
  windowed as (
    select
      d.service_key,
      d.sli_key,
      count(e.id)::bigint as total_events,
      count(e.id) filter (where e.is_good = false)::bigint as bad_events
    from defs d
    left join public.service_sli_events e
      on e.service_key = d.service_key
      and e.sli_key = d.sli_key
      and e.occurred_at >= now() - make_interval(mins => v_window)
    group by d.service_key, d.sli_key
  ),
  scored as (
    select
      d.service_key,
      d.sli_key,
      d.target_pct,
      d.warn_delta_pct,
      d.critical_delta_pct,
      w.total_events,
      w.bad_events,
      case
        when coalesce(w.total_events, 0) > 0
          then round(((w.total_events - w.bad_events)::numeric / w.total_events::numeric) * 100, 3)
        else 100.000::numeric
      end as good_rate_pct
    from defs d
    join windowed w
      on w.service_key = d.service_key
      and w.sli_key = d.sli_key
  ),
  upsert_rollup as (
    insert into public.service_sli_rollups (
      service_key,
      sli_key,
      window_start,
      window_end,
      total_events,
      bad_events,
      good_rate_pct,
      status,
      details,
      computed_at
    )
    select
      s.service_key,
      s.sli_key,
      date_trunc('minute', now() - make_interval(mins => v_window)),
      date_trunc('minute', now()),
      s.total_events,
      s.bad_events,
      s.good_rate_pct,
      case
        when s.good_rate_pct < (s.target_pct - s.critical_delta_pct) then 'critical'
        when s.good_rate_pct < (s.target_pct - s.warn_delta_pct) then 'warn'
        else 'ok'
      end as status,
      jsonb_build_object(
        'target_pct', s.target_pct,
        'warn_delta_pct', s.warn_delta_pct,
        'critical_delta_pct', s.critical_delta_pct,
        'window_minutes', v_window
      ),
      now()
    from scored s
    on conflict (service_key, sli_key, window_start, window_end) do update
    set
      total_events = excluded.total_events,
      bad_events = excluded.bad_events,
      good_rate_pct = excluded.good_rate_pct,
      status = excluded.status,
      details = excluded.details,
      computed_at = excluded.computed_at
    returning service_key, sli_key, good_rate_pct, status, details
  )
  insert into public.finance_ops_alerts (
    alert_type,
    severity,
    title,
    body,
    payload,
    dedupe_key,
    created_at
  )
  select
    'sre_slo_breach',
    case when ur.status = 'critical' then 'critical' else 'warn' end,
    'SLO abaixo da meta',
    format(
      'Servico %s / %s em %s%% (%s).',
      ur.service_key,
      ur.sli_key,
      ur.good_rate_pct::text,
      ur.status
    ),
    jsonb_build_object(
      'service_key', ur.service_key,
      'sli_key', ur.sli_key,
      'good_rate_pct', ur.good_rate_pct,
      'status', ur.status,
      'window_minutes', v_window
    ),
    md5('sre_slo_breach:' || ur.service_key || ':' || ur.sli_key || ':' || to_char(now(), 'YYYYMMDDHH24')),
    now()
  from upsert_rollup ur
  where ur.status in ('warn', 'critical')
  on conflict (dedupe_key) do update
  set
    severity = excluded.severity,
    title = excluded.title,
    body = excluded.body,
    payload = excluded.payload,
    status = 'open';

  get diagnostics v_rows = row_count;

  insert into public.sre_incidents (
    incident_key,
    service_key,
    sli_key,
    severity,
    status,
    title,
    summary,
    runbook_url,
    metadata,
    started_at,
    created_at
  )
  select
    md5('sre_incident:' || r.service_key || ':' || r.sli_key || ':' || to_char(now(), 'YYYYMMDD')),
    r.service_key,
    r.sli_key,
    case when r.status = 'critical' then 'sev1' else 'sev2' end,
    'open',
    format('Incidente SLO %s/%s', r.service_key, r.sli_key),
    format('Good rate atual: %s%%', r.good_rate_pct::text),
    '/docs/runbooks/' || replace(r.service_key, '.', '-') || '-' || replace(r.sli_key, '.', '-'),
    jsonb_build_object('window_minutes', v_window, 'status', r.status),
    now(),
    now()
  from public.service_sli_rollups r
  where r.window_end = date_trunc('minute', now())
    and r.status = 'critical'
    and not exists (
      select 1
      from public.sre_incidents i
      where i.service_key = r.service_key
        and i.sli_key = r.sli_key
        and i.status in ('open', 'investigating', 'mitigating')
    )
  on conflict (incident_key) do nothing;

  return v_rows;
end;
$$;

create or replace function public.check_dr_test_freshness(
  p_max_age_days integer default 30
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_has_recent boolean := false;
begin
  select exists (
    select 1
    from public.dr_test_runs d
    where d.status = 'passed'
      and coalesce(d.finished_at, d.created_at) >= now() - make_interval(days => greatest(1, least(coalesce(p_max_age_days, 30), 365)))
  ) into v_has_recent;

  if v_has_recent then
    return 0;
  end if;

  insert into public.finance_ops_alerts (
    alert_type,
    severity,
    title,
    body,
    payload,
    dedupe_key,
    created_at
  )
  values (
    'dr_test_overdue',
    'warn',
    'DR test em atraso',
    'Nao existe DR test aprovado dentro da janela configurada.',
    jsonb_build_object('max_age_days', p_max_age_days),
    md5('dr_test_overdue:' || to_char(current_date, 'YYYYMMDD')),
    now()
  )
  on conflict (dedupe_key) do update
  set
    severity = excluded.severity,
    title = excluded.title,
    body = excluded.body,
    payload = excluded.payload,
    status = 'open';

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.record_dr_test_run(
  p_scenario_key text,
  p_status text,
  p_rto_minutes integer default null,
  p_rpo_minutes integer default null,
  p_notes text default null,
  p_created_by uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into public.dr_test_runs (
    id,
    scenario_key,
    status,
    started_at,
    finished_at,
    rto_minutes,
    rpo_minutes,
    notes,
    metadata,
    created_by,
    created_at
  )
  values (
    v_id,
    lower(coalesce(p_scenario_key, 'unknown')),
    lower(coalesce(p_status, 'scheduled')),
    now(),
    case when lower(coalesce(p_status, 'scheduled')) in ('passed', 'failed', 'cancelled') then now() else null end,
    p_rto_minutes,
    p_rpo_minutes,
    p_notes,
    coalesce(p_metadata, '{}'::jsonb),
    p_created_by,
    now()
  );

  return v_id;
end;
$$;

-- =========================================================
-- Ranking near-real-time + A/B attribution
-- =========================================================

create table if not exists public.ranking_realtime_queue (
  product_id uuid primary key references public.products(id) on delete cascade,
  reason text not null default 'manual',
  source_event text,
  enqueued_at timestamptz not null default now(),
  last_event_at timestamptz not null default now(),
  attempts integer not null default 0,
  last_error text
);

create index if not exists idx_ranking_realtime_queue_enqueued
  on public.ranking_realtime_queue (enqueued_at asc);

create or replace function public.enqueue_ranking_realtime(
  p_product_id uuid,
  p_reason text default 'manual',
  p_source_event text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_product_id is null then
    return;
  end if;

  insert into public.ranking_realtime_queue (
    product_id,
    reason,
    source_event,
    enqueued_at,
    last_event_at
  )
  values (
    p_product_id,
    coalesce(nullif(btrim(p_reason), ''), 'manual'),
    nullif(btrim(coalesce(p_source_event, '')), ''),
    now(),
    now()
  )
  on conflict (product_id) do update
  set
    reason = excluded.reason,
    source_event = excluded.source_event,
    last_event_at = now(),
    enqueued_at = least(public.ranking_realtime_queue.enqueued_at, excluded.enqueued_at),
    attempts = 0,
    last_error = null;
end;
$$;

create or replace function public.trg_enqueue_ranking_from_analytics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is null then
    return new;
  end if;

  if lower(coalesce(new.type, '')) in ('view_product', 'product_view', 'view_item', 'click_product', 'product_click', 'select_item', 'purchase', 'order_paid') then
    perform public.enqueue_ranking_realtime(new.product_id, 'analytics_signal', lower(coalesce(new.type, '')));
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.analytics_events') is not null then
    drop trigger if exists trg_analytics_enqueue_ranking on public.analytics_events;
    create trigger trg_analytics_enqueue_ranking
    after insert on public.analytics_events
    for each row execute function public.trg_enqueue_ranking_from_analytics();
  end if;
end;
$$;

create or replace function public.trg_enqueue_ranking_from_order_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    perform public.enqueue_ranking_realtime(new.product_id, 'order_conversion', 'order_items.insert');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_items_enqueue_ranking on public.order_items;
create trigger trg_order_items_enqueue_ranking
after insert on public.order_items
for each row execute function public.trg_enqueue_ranking_from_order_items();

create or replace function public.process_ranking_realtime_queue(
  p_limit integer default 200
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_rows integer := 0;
begin
  create temporary table if not exists _ranking_batch (
    product_id uuid primary key,
    category_key text
  ) on commit drop;
  truncate table _ranking_batch;

  with picked as (
    select q.product_id
    from public.ranking_realtime_queue q
    order by q.enqueued_at asc
    limit greatest(1, least(coalesce(p_limit, 200), 2000))
    for update skip locked
  )
  insert into _ranking_batch (product_id, category_key)
  select
    p.id,
    lower(coalesce(p.category, ''))
  from picked pk
  join public.products p on p.id = pk.product_id;

  delete from public.ranking_realtime_queue q
  where exists (select 1 from _ranking_batch b where b.product_id = q.product_id);

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return 0;
  end if;

  perform public.refresh_product_metrics_30d();
  perform public.refresh_product_scores();

  for r in
    select distinct nullif(btrim(coalesce(category_key, '')), '') as category_key
    from _ranking_batch
  loop
    perform public.refresh_product_ranking_snapshot('search', r.category_key);
  end loop;

  perform public.refresh_product_ranking_snapshot('featured', 'global');
  return v_rows;
exception
  when others then
    update public.ranking_realtime_queue q
    set
      attempts = q.attempts + 1,
      last_error = sqlerrm,
      enqueued_at = now()
    where exists (select 1 from _ranking_batch b where b.product_id = q.product_id);
    raise;
end;
$$;

create table if not exists public.ab_experiments (
  id uuid primary key default gen_random_uuid(),
  experiment_key text not null unique,
  name text not null,
  surface text not null
    check (surface in ('search', 'category', 'home', 'featured')),
  status text not null default 'draft'
    check (status in ('draft', 'running', 'paused', 'completed')),
  allocation_pct integer not null default 100
    check (allocation_pct >= 0 and allocation_pct <= 100),
  started_at timestamptz,
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_ab_experiments_updated on public.ab_experiments;
create trigger trg_ab_experiments_updated
before update on public.ab_experiments
for each row execute function public.set_updated_at();

create table if not exists public.ab_experiment_variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.ab_experiments(id) on delete cascade,
  variant_key text not null,
  weight_pct integer not null default 50
    check (weight_pct >= 0 and weight_pct <= 100),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (experiment_id, variant_key)
);

create table if not exists public.ab_experiment_assignments (
  experiment_id uuid not null references public.ab_experiments(id) on delete cascade,
  subject_id uuid not null references public.profiles(id) on delete cascade,
  variant_key text not null,
  attributes jsonb not null default '{}'::jsonb,
  assigned_at timestamptz not null default now(),
  primary key (experiment_id, subject_id)
);

create table if not exists public.ab_experiment_events (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.ab_experiments(id) on delete cascade,
  variant_key text not null,
  subject_id uuid not null references public.profiles(id) on delete cascade,
  event_name text not null,
  event_value numeric(14,2) not null default 0,
  order_id uuid references public.orders(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_ab_experiment_events_exp_time
  on public.ab_experiment_events (experiment_id, occurred_at desc);

create table if not exists public.ab_experiment_attribution_daily (
  experiment_id uuid not null references public.ab_experiments(id) on delete cascade,
  variant_key text not null,
  day date not null,
  exposures integer not null default 0,
  conversions integer not null default 0,
  revenue_cents bigint not null default 0,
  conversion_rate numeric(8,6) not null default 0,
  uplift_vs_control_pct numeric(8,4) not null default 0,
  computed_at timestamptz not null default now(),
  primary key (experiment_id, variant_key, day)
);

create or replace function public.assign_ab_experiment_variant(
  p_experiment_key text,
  p_subject_id uuid,
  p_seed text default null,
  p_attributes jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_experiment public.ab_experiments%rowtype;
  v_existing text;
  v_bucket bigint;
  v_cursor bigint := 0;
  v_chosen text := null;
  r record;
begin
  if p_subject_id is null or coalesce(nullif(btrim(p_experiment_key), ''), '') = '' then
    return 'control';
  end if;

  select *
    into v_experiment
  from public.ab_experiments e
  where e.experiment_key = lower(p_experiment_key)
    and e.status = 'running'
    and (e.started_at is null or e.started_at <= now())
    and (e.ended_at is null or e.ended_at > now())
  order by e.created_at desc
  limit 1;

  if v_experiment.id is null then
    return 'control';
  end if;

  select a.variant_key into v_existing
  from public.ab_experiment_assignments a
  where a.experiment_id = v_experiment.id
    and a.subject_id = p_subject_id;

  if v_existing is not null then
    return v_existing;
  end if;

  v_bucket := mod(abs(hashtextextended(v_experiment.id::text || ':' || p_subject_id::text || ':' || coalesce(p_seed, ''), 0)), 10000);

  for r in
    select variant_key, weight_pct
    from public.ab_experiment_variants
    where experiment_id = v_experiment.id
    order by variant_key asc
  loop
    v_cursor := v_cursor + (greatest(r.weight_pct, 0) * 100);
    if v_bucket < v_cursor then
      v_chosen := r.variant_key;
      exit;
    end if;
  end loop;

  if v_chosen is null then
    select av.variant_key into v_chosen
    from public.ab_experiment_variants av
    where av.experiment_id = v_experiment.id
    order by av.variant_key asc
    limit 1;
  end if;

  if v_chosen is null then
    v_chosen := 'control';
  end if;

  insert into public.ab_experiment_assignments (
    experiment_id,
    subject_id,
    variant_key,
    attributes,
    assigned_at
  )
  values (
    v_experiment.id,
    p_subject_id,
    v_chosen,
    coalesce(p_attributes, '{}'::jsonb),
    now()
  )
  on conflict (experiment_id, subject_id) do nothing;

  return v_chosen;
end;
$$;

create or replace function public.track_ab_experiment_event(
  p_experiment_key text,
  p_subject_id uuid,
  p_event_name text,
  p_event_value numeric default 0,
  p_order_id uuid default null,
  p_variant_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_experiment_id uuid;
  v_variant text;
  v_id uuid := gen_random_uuid();
begin
  if p_subject_id is null then
    return null;
  end if;

  select e.id
    into v_experiment_id
  from public.ab_experiments e
  where e.experiment_key = lower(coalesce(p_experiment_key, ''))
    and e.status in ('running', 'completed')
  order by e.created_at desc
  limit 1;

  if v_experiment_id is null then
    return null;
  end if;

  v_variant := coalesce(nullif(btrim(coalesce(p_variant_key, '')), ''), public.assign_ab_experiment_variant(p_experiment_key, p_subject_id));

  insert into public.ab_experiment_events (
    id,
    experiment_id,
    variant_key,
    subject_id,
    event_name,
    event_value,
    order_id,
    metadata,
    occurred_at,
    created_at
  )
  values (
    v_id,
    v_experiment_id,
    v_variant,
    p_subject_id,
    lower(coalesce(p_event_name, 'unknown')),
    coalesce(p_event_value, 0),
    p_order_id,
    coalesce(p_metadata, '{}'::jsonb),
    now(),
    now()
  );

  return v_id;
end;
$$;

create or replace function public.refresh_ab_experiment_attribution_daily(
  p_days integer default 7
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_days integer := greatest(1, least(coalesce(p_days, 7), 90));
begin
  with src as (
    select
      e.experiment_id,
      e.variant_key,
      e.occurred_at::date as day,
      count(distinct e.subject_id) filter (where e.event_name in ('exposure', 'view'))::integer as exposures,
      count(*) filter (where e.event_name in ('conversion', 'purchase', 'order'))::integer as conversions,
      coalesce(sum(e.event_value) filter (where e.event_name in ('conversion', 'purchase', 'order')), 0)::bigint as revenue_cents
    from public.ab_experiment_events e
    where e.occurred_at::date >= current_date - v_days
    group by e.experiment_id, e.variant_key, e.occurred_at::date
  )
  insert into public.ab_experiment_attribution_daily (
    experiment_id,
    variant_key,
    day,
    exposures,
    conversions,
    revenue_cents,
    conversion_rate,
    uplift_vs_control_pct,
    computed_at
  )
  select
    s.experiment_id,
    s.variant_key,
    s.day,
    s.exposures,
    s.conversions,
    s.revenue_cents,
    case
      when s.exposures > 0 then round((s.conversions::numeric / s.exposures::numeric), 6)
      else 0::numeric
    end as conversion_rate,
    0::numeric as uplift_vs_control_pct,
    now()
  from src s
  on conflict (experiment_id, variant_key, day) do update
  set
    exposures = excluded.exposures,
    conversions = excluded.conversions,
    revenue_cents = excluded.revenue_cents,
    conversion_rate = excluded.conversion_rate,
    computed_at = excluded.computed_at;

  get diagnostics v_rows = row_count;

  with control as (
    select
      experiment_id,
      day,
      conversion_rate as control_rate
    from public.ab_experiment_attribution_daily
    where variant_key = 'control'
      and day >= current_date - v_days
  )
  update public.ab_experiment_attribution_daily d
  set uplift_vs_control_pct = round(
    case
      when c.control_rate > 0 then ((d.conversion_rate - c.control_rate) / c.control_rate) * 100
      else 0
    end
  , 4)
  from control c
  where d.experiment_id = c.experiment_id
    and d.day = c.day
    and d.day >= current_date - v_days;

  return v_rows;
end;
$$;

-- =========================================================
-- Cron schedules
-- =========================================================

do $$
declare
  v_job_id bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;
  end if;

  for v_job_id in
    select jobid
    from cron.job
    where jobname in (
      'refresh_logistics_exceptions_10m',
      'escalate_logistics_exceptions_15m',
      'create_alerts_logistics_exceptions_15m',
      'evaluate_slo_breaches_5m',
      'check_dr_test_freshness_daily',
      'process_ranking_realtime_queue_2m',
      'refresh_ab_experiment_attribution_hourly'
    )
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'refresh_logistics_exceptions_10m',
    '*/10 * * * *',
    'select public.refresh_logistics_exceptions(500);'
  );

  perform cron.schedule(
    'escalate_logistics_exceptions_15m',
    '*/15 * * * *',
    'select public.escalate_logistics_exceptions(200);'
  );

  perform cron.schedule(
    'create_alerts_logistics_exceptions_15m',
    '*/15 * * * *',
    'select public.create_finance_ops_alerts_from_logistics_exceptions(200);'
  );

  perform cron.schedule(
    'evaluate_slo_breaches_5m',
    '*/5 * * * *',
    'select public.evaluate_slo_breaches(60);'
  );

  perform cron.schedule(
    'check_dr_test_freshness_daily',
    '15 3 * * *',
    'select public.check_dr_test_freshness(30);'
  );

  perform cron.schedule(
    'process_ranking_realtime_queue_2m',
    '*/2 * * * *',
    'select public.process_ranking_realtime_queue(200);'
  );

  perform cron.schedule(
    'refresh_ab_experiment_attribution_hourly',
    '35 * * * *',
    'select public.refresh_ab_experiment_attribution_daily(14);'
  );
end;
$$;

-- =========================================================
-- Access control
-- =========================================================

alter table public.return_requests enable row level security;
alter table public.logistics_exception_policies enable row level security;
alter table public.logistics_exceptions enable row level security;
alter table public.service_slo_targets enable row level security;
alter table public.service_sli_events enable row level security;
alter table public.service_sli_rollups enable row level security;
alter table public.sre_incidents enable row level security;
alter table public.sre_incident_events enable row level security;
alter table public.sre_runbooks enable row level security;
alter table public.dr_test_runs enable row level security;
alter table public.ranking_realtime_queue enable row level security;
alter table public.ab_experiments enable row level security;
alter table public.ab_experiment_variants enable row level security;
alter table public.ab_experiment_assignments enable row level security;
alter table public.ab_experiment_events enable row level security;
alter table public.ab_experiment_attribution_daily enable row level security;

revoke all on table public.return_requests from anon;
revoke all on table public.logistics_exception_policies from anon;
revoke all on table public.logistics_exceptions from anon;
revoke all on table public.service_slo_targets from anon, authenticated;
revoke all on table public.service_sli_events from anon, authenticated;
revoke all on table public.service_sli_rollups from anon, authenticated;
revoke all on table public.sre_incidents from anon, authenticated;
revoke all on table public.sre_incident_events from anon, authenticated;
revoke all on table public.sre_runbooks from anon, authenticated;
revoke all on table public.dr_test_runs from anon, authenticated;
revoke all on table public.ranking_realtime_queue from anon, authenticated;
revoke all on table public.ab_experiment_events from anon, authenticated;
revoke all on table public.ab_experiment_attribution_daily from anon;
revoke all on table public.ab_experiment_assignments from anon;
revoke all on table public.ab_experiment_variants from anon;
revoke all on table public.ab_experiments from anon;

grant select on table public.return_requests to authenticated;
grant select on table public.logistics_exceptions to authenticated;
grant select on table public.ab_experiments to authenticated;
grant select on table public.ab_experiment_variants to authenticated;
grant select on table public.ab_experiment_assignments to authenticated;

grant all on table public.return_requests to service_role;
grant all on table public.logistics_exception_policies to service_role;
grant all on table public.logistics_exceptions to service_role;
grant all on table public.service_slo_targets to service_role;
grant all on table public.service_sli_events to service_role;
grant all on table public.service_sli_rollups to service_role;
grant all on table public.sre_incidents to service_role;
grant all on table public.sre_incident_events to service_role;
grant all on table public.sre_runbooks to service_role;
grant all on table public.dr_test_runs to service_role;
grant all on table public.ranking_realtime_queue to service_role;
grant all on table public.ab_experiments to service_role;
grant all on table public.ab_experiment_variants to service_role;
grant all on table public.ab_experiment_assignments to service_role;
grant all on table public.ab_experiment_events to service_role;
grant all on table public.ab_experiment_attribution_daily to service_role;

drop policy if exists return_requests_customer_or_seller on public.return_requests;
create policy return_requests_customer_or_seller
on public.return_requests
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or customer_id = auth.uid()
  or exists (
    select 1
    from public.sellers s
    where s.id = return_requests.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists return_requests_service_all on public.return_requests;
create policy return_requests_service_all
on public.return_requests
for all
to service_role
using (true)
with check (true);

drop policy if exists logistics_exception_policies_admin_select on public.logistics_exception_policies;
create policy logistics_exception_policies_admin_select
on public.logistics_exception_policies
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists logistics_exception_policies_service_all on public.logistics_exception_policies;
create policy logistics_exception_policies_service_all
on public.logistics_exception_policies
for all
to service_role
using (true)
with check (true);

drop policy if exists logistics_exceptions_seller_or_admin_select on public.logistics_exceptions;
create policy logistics_exceptions_seller_or_admin_select
on public.logistics_exceptions
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.sellers s
    where s.id = logistics_exceptions.seller_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists logistics_exceptions_service_all on public.logistics_exceptions;
create policy logistics_exceptions_service_all
on public.logistics_exceptions
for all
to service_role
using (true)
with check (true);

drop policy if exists ab_experiments_running_select on public.ab_experiments;
create policy ab_experiments_running_select
on public.ab_experiments
for select
to authenticated
using (status in ('running', 'completed') or public.is_admin(auth.uid()));

drop policy if exists ab_experiments_service_all on public.ab_experiments;
create policy ab_experiments_service_all
on public.ab_experiments
for all
to service_role
using (true)
with check (true);

drop policy if exists ab_experiment_variants_select on public.ab_experiment_variants;
create policy ab_experiment_variants_select
on public.ab_experiment_variants
for select
to authenticated
using (true);

drop policy if exists ab_experiment_variants_service_all on public.ab_experiment_variants;
create policy ab_experiment_variants_service_all
on public.ab_experiment_variants
for all
to service_role
using (true)
with check (true);

drop policy if exists ab_experiment_assignments_own_select on public.ab_experiment_assignments;
create policy ab_experiment_assignments_own_select
on public.ab_experiment_assignments
for select
to authenticated
using (subject_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists ab_experiment_assignments_service_all on public.ab_experiment_assignments;
create policy ab_experiment_assignments_service_all
on public.ab_experiment_assignments
for all
to service_role
using (true)
with check (true);

drop policy if exists service_slo_targets_admin_select on public.service_slo_targets;
create policy service_slo_targets_admin_select
on public.service_slo_targets
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists service_sli_events_service_all on public.service_sli_events;
create policy service_sli_events_service_all
on public.service_sli_events
for all
to service_role
using (true)
with check (true);

drop policy if exists service_sli_rollups_service_all on public.service_sli_rollups;
create policy service_sli_rollups_service_all
on public.service_sli_rollups
for all
to service_role
using (true)
with check (true);

drop policy if exists sre_incidents_service_all on public.sre_incidents;
create policy sre_incidents_service_all
on public.sre_incidents
for all
to service_role
using (true)
with check (true);

drop policy if exists sre_incident_events_service_all on public.sre_incident_events;
create policy sre_incident_events_service_all
on public.sre_incident_events
for all
to service_role
using (true)
with check (true);

drop policy if exists sre_runbooks_admin_select on public.sre_runbooks;
create policy sre_runbooks_admin_select
on public.sre_runbooks
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists sre_runbooks_service_all on public.sre_runbooks;
create policy sre_runbooks_service_all
on public.sre_runbooks
for all
to service_role
using (true)
with check (true);

drop policy if exists dr_test_runs_service_all on public.dr_test_runs;
create policy dr_test_runs_service_all
on public.dr_test_runs
for all
to service_role
using (true)
with check (true);

drop policy if exists ranking_realtime_queue_service_all on public.ranking_realtime_queue;
create policy ranking_realtime_queue_service_all
on public.ranking_realtime_queue
for all
to service_role
using (true)
with check (true);

drop policy if exists ab_experiment_events_service_all on public.ab_experiment_events;
create policy ab_experiment_events_service_all
on public.ab_experiment_events
for all
to service_role
using (true)
with check (true);

drop policy if exists ab_experiment_attribution_daily_service_all on public.ab_experiment_attribution_daily;
create policy ab_experiment_attribution_daily_service_all
on public.ab_experiment_attribution_daily
for all
to service_role
using (true)
with check (true);

grant execute on function public.refresh_logistics_exceptions(integer) to service_role;
grant execute on function public.escalate_logistics_exceptions(integer) to service_role;
grant execute on function public.create_finance_ops_alerts_from_logistics_exceptions(integer) to service_role;
grant execute on function public.record_sli_event(text, text, boolean, integer, jsonb) to service_role;
grant execute on function public.evaluate_slo_breaches(integer) to service_role;
grant execute on function public.check_dr_test_freshness(integer) to service_role;
grant execute on function public.record_dr_test_run(text, text, integer, integer, text, uuid, jsonb) to service_role;
grant execute on function public.enqueue_ranking_realtime(uuid, text, text) to service_role;
grant execute on function public.process_ranking_realtime_queue(integer) to service_role;
grant execute on function public.assign_ab_experiment_variant(text, uuid, text, jsonb) to service_role;
grant execute on function public.track_ab_experiment_event(text, uuid, text, numeric, uuid, text, jsonb) to service_role;
grant execute on function public.refresh_ab_experiment_attribution_daily(integer) to service_role;

-- Bootstraps (safe no-op style).
select public.refresh_logistics_exceptions(500);
select public.escalate_logistics_exceptions(200);
select public.create_finance_ops_alerts_from_logistics_exceptions(200);
select public.evaluate_slo_breaches(60);
select public.check_dr_test_freshness(30);
select public.process_ranking_realtime_queue(200);
select public.refresh_ab_experiment_attribution_daily(14);
