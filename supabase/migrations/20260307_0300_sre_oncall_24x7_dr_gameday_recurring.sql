-- Phase 3.2: High-maturity on-call 24x7 + recurring DR game day.
-- Safe to re-run.

create extension if not exists "pgcrypto";

-- =========================================================
-- On-call policy + incident ACK/escalation hardening
-- =========================================================

create table if not exists public.sre_oncall_policies (
  id uuid primary key default gen_random_uuid(),
  service_key text not null unique,
  ack_sla_minutes integer not null default 10
    check (ack_sla_minutes >= 1 and ack_sla_minutes <= 240),
  escalation_sla_minutes integer not null default 20
    check (escalation_sla_minutes >= 1 and escalation_sla_minutes <= 480),
  max_escalations integer not null default 2
    check (max_escalations >= 0 and max_escalations <= 10),
  page_secondary_on_sev1 boolean not null default true,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_sre_oncall_policies_updated on public.sre_oncall_policies;
create trigger trg_sre_oncall_policies_updated
before update on public.sre_oncall_policies
for each row execute function public.set_updated_at();

insert into public.sre_oncall_policies (
  service_key,
  ack_sla_minutes,
  escalation_sla_minutes,
  max_escalations,
  page_secondary_on_sev1,
  active,
  notes
)
values (
  'platform',
  10,
  20,
  2,
  true,
  true,
  'Default policy for 24x7 incident response.'
)
on conflict (service_key) do update
set
  ack_sla_minutes = excluded.ack_sla_minutes,
  escalation_sla_minutes = excluded.escalation_sla_minutes,
  max_escalations = excluded.max_escalations,
  page_secondary_on_sev1 = excluded.page_secondary_on_sev1,
  active = excluded.active,
  notes = excluded.notes,
  updated_at = now();

alter table public.sre_incidents
  add column if not exists acknowledged_at timestamptz,
  add column if not exists first_response_due_at timestamptz,
  add column if not exists escalation_count integer not null default 0
    check (escalation_count >= 0),
  add column if not exists escalated_at timestamptz,
  add column if not exists last_page_at timestamptz;

update public.sre_incidents i
set first_response_due_at = coalesce(
  i.first_response_due_at,
  i.started_at + make_interval(
    mins => coalesce(
      (
        select p.ack_sla_minutes
        from public.sre_oncall_policies p
        where p.active = true
          and p.service_key = 'platform'
        limit 1
      ),
      10
    )
  )
)
where i.status in ('open', 'investigating', 'mitigating')
  and i.first_response_due_at is null;

create or replace function public.refresh_sre_oncall_shift_states()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
begin
  with completed as (
    update public.sre_oncall_shifts s
    set
      status = 'completed',
      updated_at = now()
    where s.shift_date < current_date
      and s.status in ('scheduled', 'active', 'handover')
    returning 1
  ),
  activated as (
    update public.sre_oncall_shifts s
    set
      status = 'active',
      updated_at = now()
    where s.shift_date = current_date
      and s.primary_user_id is not null
      and s.status in ('scheduled', 'handover')
    returning 1
  ),
  uncovered as (
    update public.sre_oncall_shifts s
    set
      status = 'uncovered',
      updated_at = now()
    where s.shift_date = current_date
      and s.primary_user_id is null
      and s.status <> 'uncovered'
    returning 1
  )
  select
    coalesce((select count(*) from completed), 0)
    + coalesce((select count(*) from activated), 0)
    + coalesce((select count(*) from uncovered), 0)
  into v_rows;

  return v_rows;
end;
$$;

create or replace function public.acknowledge_sre_oncall_shift(
  p_shift_date date default current_date,
  p_user_id uuid default null,
  p_handoff_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := coalesce(p_user_id, auth.uid());
begin
  if v_actor is null then
    return false;
  end if;

  update public.sre_oncall_shifts s
  set
    acknowledged_at = coalesce(s.acknowledged_at, now()),
    handoff_notes = coalesce(p_handoff_notes, s.handoff_notes),
    updated_at = now()
  where s.shift_date = coalesce(p_shift_date, current_date)
    and (s.primary_user_id = v_actor or s.secondary_user_id = v_actor);

  return found;
end;
$$;

create or replace function public.acknowledge_sre_incident(
  p_incident_id uuid,
  p_user_id uuid default null,
  p_message text default 'Incident acknowledged by on-call.'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := coalesce(p_user_id, auth.uid());
begin
  if p_incident_id is null or v_actor is null then
    return false;
  end if;

  update public.sre_incidents i
  set
    acknowledged_at = coalesce(i.acknowledged_at, now()),
    owner_user_id = coalesce(i.owner_user_id, v_actor),
    status = case when i.status = 'open' then 'investigating' else i.status end,
    updated_at = now()
  where i.id = p_incident_id
    and i.status in ('open', 'investigating', 'mitigating');

  if not found then
    return false;
  end if;

  insert into public.sre_incident_events (
    incident_id,
    event_type,
    message,
    payload,
    created_at
  )
  values (
    p_incident_id,
    'acknowledged',
    coalesce(nullif(btrim(p_message), ''), 'Incident acknowledged by on-call.'),
    jsonb_build_object('actor_user_id', v_actor),
    now()
  );

  return true;
end;
$$;

create or replace function public.assign_sre_incidents_to_current_oncall(
  p_limit integer default 200
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_limit integer := greatest(1, least(coalesce(p_limit, 200), 2000));
  v_primary uuid;
  v_ack integer := 10;
begin
  perform public.refresh_sre_oncall_shift_states();

  select coalesce(p.ack_sla_minutes, 10)
    into v_ack
  from public.sre_oncall_policies p
  where p.active = true
    and p.service_key = 'platform'
  limit 1;

  v_ack := greatest(1, least(coalesce(v_ack, 10), 240));

  select s.primary_user_id
    into v_primary
  from public.sre_oncall_shifts s
  where s.shift_date = current_date
  limit 1;

  if v_primary is null then
    return 0;
  end if;

  with candidate as (
    select i.id
    from public.sre_incidents i
    where i.owner_user_id is null
      and i.status in ('open', 'investigating', 'mitigating')
    order by i.started_at asc
    limit v_limit
    for update skip locked
  ),
  assigned as (
    update public.sre_incidents i
    set
      owner_user_id = v_primary,
      status = case when i.status = 'open' then 'investigating' else i.status end,
      first_response_due_at = coalesce(i.first_response_due_at, now() + make_interval(mins => v_ack)),
      updated_at = now()
    from candidate c
    where i.id = c.id
    returning i.id, i.service_key, i.sli_key
  ),
  incident_events as (
    insert into public.sre_incident_events (
      incident_id,
      event_type,
      message,
      payload,
      created_at
    )
    select
      a.id,
      'owner_assigned',
      'Incident assigned to primary on-call.',
      jsonb_build_object(
        'owner_user_id', v_primary,
        'service_key', a.service_key,
        'sli_key', a.sli_key
      ),
      now()
    from assigned a
    returning 1
  )
  select count(*) into v_rows from assigned;

  return v_rows;
end;
$$;

create or replace function public.escalate_unacknowledged_sre_incidents(
  p_limit integer default 200,
  p_ack_sla_minutes integer default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_limit integer := greatest(1, least(coalesce(p_limit, 200), 2000));
  v_ack integer := 10;
  v_max_escalations integer := 2;
  v_primary uuid;
  v_secondary uuid;
begin
  perform public.refresh_sre_oncall_shift_states();

  select
    coalesce(p.ack_sla_minutes, 10),
    coalesce(p.max_escalations, 2)
    into v_ack, v_max_escalations
  from public.sre_oncall_policies p
  where p.active = true
    and p.service_key = 'platform'
  limit 1;

  v_ack := greatest(1, least(coalesce(p_ack_sla_minutes, v_ack, 10), 240));
  v_max_escalations := greatest(1, least(coalesce(v_max_escalations, 2), 10));

  select
    s.primary_user_id,
    s.secondary_user_id
    into v_primary, v_secondary
  from public.sre_oncall_shifts s
  where s.shift_date = current_date
  limit 1;

  with candidate as (
    select
      i.id,
      i.service_key,
      i.sli_key,
      i.severity,
      i.owner_user_id,
      coalesce(i.escalation_count, 0) as escalation_count,
      coalesce(
        i.first_response_due_at,
        i.started_at + make_interval(mins => coalesce(
          (
            select p.ack_sla_minutes
            from public.sre_oncall_policies p
            where p.active = true
              and p.service_key in (i.service_key, 'platform')
            order by
              case when p.service_key = i.service_key then 0 else 1 end,
              p.created_at desc
            limit 1
          ),
          v_ack
        ))
      ) as due_at
    from public.sre_incidents i
    where i.status in ('open', 'investigating', 'mitigating')
      and i.acknowledged_at is null
      and coalesce(i.escalation_count, 0) < v_max_escalations
      and coalesce(
        i.first_response_due_at,
        i.started_at + make_interval(mins => v_ack)
      ) <= now()
    order by i.started_at asc
    limit v_limit
    for update skip locked
  ),
  escalated as (
    update public.sre_incidents i
    set
      owner_user_id = coalesce(
        case
          when c.owner_user_id is null then v_primary
          when v_secondary is not null and c.owner_user_id <> v_secondary then v_secondary
          when v_primary is not null and c.owner_user_id <> v_primary then v_primary
          else c.owner_user_id
        end,
        c.owner_user_id,
        v_primary,
        v_secondary
      ),
      severity = case
        when i.severity = 'sev4' then 'sev3'
        when i.severity = 'sev3' then 'sev2'
        when i.severity = 'sev2' then 'sev1'
        else 'sev1'
      end,
      status = case
        when i.status = 'open' then 'investigating'
        when i.status = 'investigating' then 'mitigating'
        else i.status
      end,
      escalation_count = coalesce(i.escalation_count, 0) + 1,
      escalated_at = now(),
      last_page_at = now(),
      first_response_due_at = now() + make_interval(mins => v_ack),
      updated_at = now(),
      metadata = coalesce(i.metadata, '{}'::jsonb)
        || jsonb_build_object(
          'last_escalation_at', now(),
          'last_escalation_to', coalesce(
            case
              when c.owner_user_id is null then v_primary
              when v_secondary is not null and c.owner_user_id <> v_secondary then v_secondary
              when v_primary is not null and c.owner_user_id <> v_primary then v_primary
              else c.owner_user_id
            end,
            c.owner_user_id,
            v_primary,
            v_secondary
          ),
          'ack_sla_minutes', v_ack
        )
    from candidate c
    where i.id = c.id
    returning
      i.id,
      i.service_key,
      i.sli_key,
      i.severity,
      i.owner_user_id,
      i.escalation_count,
      i.first_response_due_at
  ),
  incident_events as (
    insert into public.sre_incident_events (
      incident_id,
      event_type,
      message,
      payload,
      created_at
    )
    select
      e.id,
      'oncall_escalated',
      format('Escalation triggered for unacknowledged incident (step=%s).', e.escalation_count::text),
      jsonb_build_object(
        'service_key', e.service_key,
        'sli_key', e.sli_key,
        'severity', e.severity,
        'owner_user_id', e.owner_user_id,
        'first_response_due_at', e.first_response_due_at,
        'escalation_count', e.escalation_count
      ),
      now()
    from escalated e
    returning 1
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
    'sre_incident_escalation',
    case when e.severity = 'sev1' then 'critical' else 'warn' end,
    'Incident escalated to on-call chain',
    format(
      'Incident %s/%s escalated (step=%s, severity=%s).',
      e.service_key,
      e.sli_key,
      e.escalation_count::text,
      e.severity
    ),
    jsonb_build_object(
      'incident_id', e.id,
      'service_key', e.service_key,
      'sli_key', e.sli_key,
      'severity', e.severity,
      'owner_user_id', e.owner_user_id,
      'escalation_count', e.escalation_count
    ),
    md5('sre_incident_escalation:' || e.id::text || ':' || e.escalation_count::text),
    now()
  from escalated e
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

create or replace function public.create_finance_ops_alerts_from_oncall_coverage(
  p_days_ahead integer default 2,
  p_limit integer default 200
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_days integer := greatest(0, least(coalesce(p_days_ahead, 2), 14));
  v_limit integer := greatest(1, least(coalesce(p_limit, 200), 2000));
begin
  with shifts as (
    select
      s.shift_date,
      s.primary_user_id,
      s.secondary_user_id,
      s.status,
      s.acknowledged_at,
      case
        when s.primary_user_id is null or s.status = 'uncovered' then 'sre_oncall_uncovered'
        when s.shift_date = current_date
          and s.primary_user_id is not null
          and s.acknowledged_at is null
          and now()::time >= time '00:30' then 'sre_oncall_unacknowledged'
        else null
      end as alert_type
    from public.sre_oncall_shifts s
    where s.shift_date between current_date and (current_date + v_days)
  ),
  candidate as (
    select *
    from shifts
    where alert_type is not null
    order by shift_date asc
    limit v_limit
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
    c.alert_type,
    case
      when c.alert_type = 'sre_oncall_uncovered'
        and c.shift_date <= current_date + 1 then 'critical'
      when c.alert_type = 'sre_oncall_uncovered' then 'warn'
      when now()::time >= time '02:00' then 'critical'
      else 'warn'
    end as severity,
    case
      when c.alert_type = 'sre_oncall_uncovered' then 'On-call shift uncovered'
      else 'Current on-call shift not acknowledged'
    end as title,
    case
      when c.alert_type = 'sre_oncall_uncovered' then
        format('No primary on-call assigned for shift date %s.', c.shift_date::text)
      else
        format('Primary on-call has not acknowledged shift %s.', c.shift_date::text)
    end as body,
    jsonb_build_object(
      'shift_date', c.shift_date,
      'primary_user_id', c.primary_user_id,
      'secondary_user_id', c.secondary_user_id,
      'status', c.status,
      'acknowledged_at', c.acknowledged_at
    ),
    md5(c.alert_type || ':' || c.shift_date::text),
    now()
  from candidate c
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

-- =========================================================
-- Recurring DR game day templates + alerting
-- =========================================================

create table if not exists public.dr_game_day_templates (
  id uuid primary key default gen_random_uuid(),
  scenario_key text not null unique,
  title text not null,
  cadence text not null default 'monthly'
    check (cadence in ('monthly', 'quarterly')),
  day_of_month integer not null default 10
    check (day_of_month >= 1 and day_of_month <= 28),
  owner_user_id uuid references public.profiles(id) on delete set null,
  rto_target_minutes integer not null default 60
    check (rto_target_minutes >= 1 and rto_target_minutes <= 1440),
  rpo_target_minutes integer not null default 15
    check (rpo_target_minutes >= 0 and rpo_target_minutes <= 1440),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_dr_game_day_templates_updated on public.dr_game_day_templates;
create trigger trg_dr_game_day_templates_updated
before update on public.dr_game_day_templates
for each row execute function public.set_updated_at();

insert into public.dr_game_day_templates (
  scenario_key,
  title,
  cadence,
  day_of_month,
  rto_target_minutes,
  rpo_target_minutes,
  active,
  metadata
)
values
  (
    'regional_failover',
    'Regional failover game day',
    'monthly',
    10,
    60,
    15,
    true,
    jsonb_build_object('tier', 'core')
  ),
  (
    'db_pitr_restore',
    'Primary DB PITR restore game day',
    'monthly',
    17,
    90,
    30,
    true,
    jsonb_build_object('tier', 'core')
  ),
  (
    'queue_replay',
    'Queue replay and backlog recovery game day',
    'quarterly',
    24,
    120,
    60,
    true,
    jsonb_build_object('tier', 'extended')
  )
on conflict (scenario_key) do update
set
  title = excluded.title,
  cadence = excluded.cadence,
  day_of_month = excluded.day_of_month,
  rto_target_minutes = excluded.rto_target_minutes,
  rpo_target_minutes = excluded.rpo_target_minutes,
  active = excluded.active,
  metadata = excluded.metadata,
  updated_at = now();

create or replace function public.ensure_dr_game_day_calendar(
  p_months_ahead integer default 6
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_months integer := greatest(1, least(coalesce(p_months_ahead, 6), 24));
begin
  with templates as (
    select *
    from public.dr_game_day_templates t
    where t.active = true
  ),
  month_series as (
    select
      (date_trunc('month', current_date)::date + make_interval(months => gs.month_idx))::date as month_start
    from generate_series(0, v_months - 1) as gs(month_idx)
  ),
  scheduled as (
    select
      t.id as template_id,
      lower(t.scenario_key) as scenario_key,
      t.title,
      t.cadence,
      t.day_of_month,
      t.owner_user_id,
      t.rto_target_minutes,
      t.rpo_target_minutes,
      t.metadata as template_metadata,
      ms.month_start,
      (ms.month_start + (t.day_of_month - 1))::date as scheduled_date
    from templates t
    cross join month_series ms
    where
      t.cadence = 'monthly'
      or (
        t.cadence = 'quarterly'
        and extract(month from ms.month_start)::integer in (1, 4, 7, 10)
      )
  )
  insert into public.dr_drill_calendar (
    scenario_key,
    scheduled_date,
    status,
    owner_user_id,
    rto_target_minutes,
    rpo_target_minutes,
    metadata,
    created_at,
    updated_at
  )
  select
    s.scenario_key,
    s.scheduled_date,
    'scheduled',
    s.owner_user_id,
    s.rto_target_minutes,
    s.rpo_target_minutes,
    jsonb_build_object(
      'source', 'dr_game_day_templates',
      'template_id', s.template_id,
      'title', s.title,
      'cadence', s.cadence,
      'day_of_month', s.day_of_month
    ) || coalesce(s.template_metadata, '{}'::jsonb),
    now(),
    now()
  from scheduled s
  on conflict (scenario_key, scheduled_date) do update
  set
    owner_user_id = excluded.owner_user_id,
    rto_target_minutes = excluded.rto_target_minutes,
    rpo_target_minutes = excluded.rpo_target_minutes,
    metadata = coalesce(public.dr_drill_calendar.metadata, '{}'::jsonb)
      || coalesce(excluded.metadata, '{}'::jsonb),
    updated_at = now()
  where public.dr_drill_calendar.status in ('scheduled', 'running');

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.create_finance_ops_alerts_from_dr_upcoming(
  p_days_ahead integer default 7,
  p_limit integer default 200
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_days integer := greatest(1, least(coalesce(p_days_ahead, 7), 45));
  v_limit integer := greatest(1, least(coalesce(p_limit, 200), 2000));
begin
  with candidate as (
    select
      c.id,
      c.scenario_key,
      c.scheduled_date,
      c.owner_user_id,
      c.rto_target_minutes,
      c.rpo_target_minutes,
      c.status
    from public.dr_drill_calendar c
    where c.status in ('scheduled', 'running')
      and c.scheduled_date between current_date and (current_date + v_days)
    order by c.scheduled_date asc
    limit v_limit
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
    'dr_drill_upcoming',
    case when c.scheduled_date <= current_date + 1 then 'warn' else 'info' end,
    'Upcoming DR game day',
    format(
      'Scenario %s scheduled for %s. Ensure owner confirmation and runbook readiness.',
      c.scenario_key,
      c.scheduled_date::text
    ),
    jsonb_build_object(
      'dr_calendar_id', c.id,
      'scenario_key', c.scenario_key,
      'scheduled_date', c.scheduled_date,
      'owner_user_id', c.owner_user_id,
      'rto_target_minutes', c.rto_target_minutes,
      'rpo_target_minutes', c.rpo_target_minutes,
      'status', c.status
    ),
    md5('dr_drill_upcoming:' || c.scenario_key || ':' || c.scheduled_date::text),
    now()
  from candidate c
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

create or replace function public.create_finance_ops_alerts_from_dr_failures(
  p_lookback_days integer default 14,
  p_limit integer default 200
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_lookback integer := greatest(1, least(coalesce(p_lookback_days, 14), 180));
  v_limit integer := greatest(1, least(coalesce(p_limit, 200), 2000));
begin
  with candidate as (
    select
      c.id,
      c.scenario_key,
      c.scheduled_date,
      c.owner_user_id,
      c.run_id,
      c.status
    from public.dr_drill_calendar c
    where c.status = 'failed'
      and c.scheduled_date >= current_date - v_lookback
    order by c.scheduled_date desc
    limit v_limit
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
    'dr_drill_failed',
    'critical',
    'DR game day failed',
    format(
      'Scenario %s failed on %s. Open incident review and corrective actions.',
      c.scenario_key,
      c.scheduled_date::text
    ),
    jsonb_build_object(
      'dr_calendar_id', c.id,
      'scenario_key', c.scenario_key,
      'scheduled_date', c.scheduled_date,
      'owner_user_id', c.owner_user_id,
      'run_id', c.run_id,
      'status', c.status
    ),
    md5('dr_drill_failed:' || c.scenario_key || ':' || c.scheduled_date::text),
    now()
  from candidate c
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

-- =========================================================
-- Cron + security
-- =========================================================

do $$
declare
  v_job_id bigint;
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    for v_job_id in
      select jobid
      from cron.job
      where jobname in (
        'sre_oncall_shift_state_refresh_10m',
        'sre_incident_assign_10m',
        'sre_incident_escalation_10m',
        'sre_oncall_coverage_alerts_hourly',
        'sre_dr_gameday_calendar_daily',
        'sre_dr_gameday_upcoming_daily',
        'sre_dr_gameday_failures_daily'
      )
    loop
      perform cron.unschedule(v_job_id);
    end loop;

    perform cron.schedule(
      'sre_oncall_shift_state_refresh_10m',
      '*/10 * * * *',
      'select public.refresh_sre_oncall_shift_states();'
    );

    perform cron.schedule(
      'sre_incident_assign_10m',
      '*/10 * * * *',
      'select public.assign_sre_incidents_to_current_oncall(200);'
    );

    perform cron.schedule(
      'sre_incident_escalation_10m',
      '*/10 * * * *',
      'select public.escalate_unacknowledged_sre_incidents(200, null);'
    );

    perform cron.schedule(
      'sre_oncall_coverage_alerts_hourly',
      '20 * * * *',
      'select public.create_finance_ops_alerts_from_oncall_coverage(2, 200);'
    );

    perform cron.schedule(
      'sre_dr_gameday_calendar_daily',
      '2 6 * * *',
      'select public.ensure_dr_game_day_calendar(6);'
    );

    perform cron.schedule(
      'sre_dr_gameday_upcoming_daily',
      '8 6 * * *',
      'select public.create_finance_ops_alerts_from_dr_upcoming(7, 200);'
    );

    perform cron.schedule(
      'sre_dr_gameday_failures_daily',
      '12 6 * * *',
      'select public.create_finance_ops_alerts_from_dr_failures(14, 200);'
    );
  end if;
end
$$;

alter table public.sre_oncall_policies enable row level security;
alter table public.dr_game_day_templates enable row level security;

drop policy if exists sre_oncall_policies_admin_select on public.sre_oncall_policies;
create policy sre_oncall_policies_admin_select
on public.sre_oncall_policies
for select
to authenticated
using (
  exists (
    select 1
    from public.user_role_memberships m
    where m.user_id = auth.uid()
      and m.role = 'admin'
  )
);

drop policy if exists sre_oncall_policies_service_all on public.sre_oncall_policies;
create policy sre_oncall_policies_service_all
on public.sre_oncall_policies
for all
to service_role
using (true)
with check (true);

drop policy if exists dr_game_day_templates_admin_select on public.dr_game_day_templates;
create policy dr_game_day_templates_admin_select
on public.dr_game_day_templates
for select
to authenticated
using (
  exists (
    select 1
    from public.user_role_memberships m
    where m.user_id = auth.uid()
      and m.role = 'admin'
  )
);

drop policy if exists dr_game_day_templates_service_all on public.dr_game_day_templates;
create policy dr_game_day_templates_service_all
on public.dr_game_day_templates
for all
to service_role
using (true)
with check (true);

revoke all on table public.sre_oncall_policies from anon;
revoke all on table public.dr_game_day_templates from anon;

grant select on table public.sre_oncall_policies to authenticated;
grant select on table public.dr_game_day_templates to authenticated;

grant all on table public.sre_oncall_policies to service_role;
grant all on table public.dr_game_day_templates to service_role;

grant execute on function public.refresh_sre_oncall_shift_states() to service_role;
grant execute on function public.acknowledge_sre_oncall_shift(date, uuid, text) to authenticated, service_role;
grant execute on function public.acknowledge_sre_incident(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.assign_sre_incidents_to_current_oncall(integer) to service_role;
grant execute on function public.escalate_unacknowledged_sre_incidents(integer, integer) to service_role;
grant execute on function public.create_finance_ops_alerts_from_oncall_coverage(integer, integer) to service_role;
grant execute on function public.ensure_dr_game_day_calendar(integer) to service_role;
grant execute on function public.create_finance_ops_alerts_from_dr_upcoming(integer, integer) to service_role;
grant execute on function public.create_finance_ops_alerts_from_dr_failures(integer, integer) to service_role;

-- Initial bootstrap.
select public.refresh_sre_oncall_shift_states();
select public.assign_sre_incidents_to_current_oncall(200);
select public.escalate_unacknowledged_sre_incidents(200, null);
select public.create_finance_ops_alerts_from_oncall_coverage(2, 200);
select public.ensure_dr_game_day_calendar(6);
select public.create_finance_ops_alerts_from_dr_upcoming(7, 200);
select public.create_finance_ops_alerts_from_dr_failures(14, 200);
