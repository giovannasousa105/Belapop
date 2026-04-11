-- Phase 3: SRE maturity hardening (formal on-call, error budget policy, fixed DR calendar).
-- Safe to re-run.

create extension if not exists "pgcrypto";

-- =========================================================
-- On-call formal model
-- =========================================================

create table if not exists public.sre_oncall_rotations (
  id uuid primary key default gen_random_uuid(),
  role text not null
    check (role in ('primary', 'secondary')),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rotation_order integer not null default 1
    check (rotation_order > 0),
  effective_from date not null default current_date,
  effective_to date,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, user_id, effective_from)
);

create index if not exists idx_sre_oncall_rotations_role_active_order
  on public.sre_oncall_rotations (role, active, rotation_order, effective_from desc);

drop trigger if exists trg_sre_oncall_rotations_updated on public.sre_oncall_rotations;
create trigger trg_sre_oncall_rotations_updated
before update on public.sre_oncall_rotations
for each row execute function public.set_updated_at();

create table if not exists public.sre_oncall_shifts (
  shift_date date primary key,
  primary_user_id uuid references public.profiles(id) on delete set null,
  secondary_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'active', 'handover', 'completed', 'uncovered')),
  generated_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  handoff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sre_oncall_shifts_primary_date
  on public.sre_oncall_shifts (primary_user_id, shift_date desc);

drop trigger if exists trg_sre_oncall_shifts_updated on public.sre_oncall_shifts;
create trigger trg_sre_oncall_shifts_updated
before update on public.sre_oncall_shifts
for each row execute function public.set_updated_at();

create or replace function public.refresh_sre_oncall_shifts(
  p_days_ahead integer default 14
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer := greatest(0, least(coalesce(p_days_ahead, 14), 90));
  v_rows integer := 0;
begin
  with primary_pool as (
    select array_agg(r.user_id order by r.rotation_order, r.created_at, r.id) as users
    from public.sre_oncall_rotations r
    where r.role = 'primary'
      and r.active = true
      and r.effective_from <= current_date
      and (r.effective_to is null or r.effective_to >= current_date)
  ),
  secondary_pool as (
    select array_agg(r.user_id order by r.rotation_order, r.created_at, r.id) as users
    from public.sre_oncall_rotations r
    where r.role = 'secondary'
      and r.active = true
      and r.effective_from <= current_date
      and (r.effective_to is null or r.effective_to >= current_date)
  ),
  days as (
    select generate_series(current_date, current_date + v_days, interval '1 day')::date as shift_date
  ),
  assigned as (
    select
      d.shift_date,
      case
        when cardinality(pp.users) > 0
          then pp.users[1 + mod((d.shift_date - current_date)::integer, cardinality(pp.users))]
        else null
      end as primary_user_id,
      case
        when cardinality(sp.users) > 0
          then sp.users[1 + mod((d.shift_date - current_date)::integer, cardinality(sp.users))]
        else null
      end as secondary_user_id
    from days d
    cross join primary_pool pp
    cross join secondary_pool sp
  )
  insert into public.sre_oncall_shifts (
    shift_date,
    primary_user_id,
    secondary_user_id,
    status,
    generated_at,
    created_at,
    updated_at
  )
  select
    a.shift_date,
    a.primary_user_id,
    a.secondary_user_id,
    case when a.primary_user_id is null then 'uncovered' else 'scheduled' end as status,
    now(),
    now(),
    now()
  from assigned a
  on conflict (shift_date) do update
  set
    primary_user_id = excluded.primary_user_id,
    secondary_user_id = excluded.secondary_user_id,
    status = case
      when excluded.primary_user_id is null then 'uncovered'
      when public.sre_oncall_shifts.status = 'uncovered' then 'scheduled'
      else public.sre_oncall_shifts.status
    end,
    generated_at = now(),
    updated_at = now();

  get diagnostics v_rows = row_count;
  return v_rows;
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
begin
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
  )
  update public.sre_incidents i
  set
    owner_user_id = v_primary,
    status = case when i.status = 'open' then 'investigating' else i.status end,
    updated_at = now()
  from candidate c
  where i.id = c.id;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

-- =========================================================
-- Error budget policy
-- =========================================================

create table if not exists public.sre_error_budget_policies (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  sli_key text not null,
  window_days integer not null default 30
    check (window_days > 0 and window_days <= 90),
  target_pct numeric(6,3) not null
    check (target_pct > 0 and target_pct <= 100),
  burn_warn_pct numeric(6,2) not null default 50
    check (burn_warn_pct >= 0 and burn_warn_pct <= 1000),
  burn_critical_pct numeric(6,2) not null default 85
    check (burn_critical_pct >= 0 and burn_critical_pct <= 1000),
  freeze_deploy_on_critical boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_key, sli_key, window_days)
);

drop trigger if exists trg_sre_error_budget_policies_updated on public.sre_error_budget_policies;
create trigger trg_sre_error_budget_policies_updated
before update on public.sre_error_budget_policies
for each row execute function public.set_updated_at();

insert into public.sre_error_budget_policies (
  service_key,
  sli_key,
  window_days,
  target_pct,
  burn_warn_pct,
  burn_critical_pct,
  freeze_deploy_on_critical,
  active
)
select
  t.service_key,
  t.sli_key,
  30,
  t.target_pct,
  50,
  85,
  true,
  true
from public.service_slo_targets t
where t.active = true
  and t.window_minutes = 60
on conflict (service_key, sli_key, window_days) do update
set
  target_pct = excluded.target_pct,
  burn_warn_pct = excluded.burn_warn_pct,
  burn_critical_pct = excluded.burn_critical_pct,
  freeze_deploy_on_critical = excluded.freeze_deploy_on_critical,
  active = excluded.active,
  updated_at = now();

create table if not exists public.sre_error_budget_rollups (
  id uuid primary key default gen_random_uuid(),
  service_key text not null,
  sli_key text not null,
  window_days integer not null,
  computed_date date not null default current_date,
  total_events bigint not null default 0,
  bad_events bigint not null default 0,
  observed_error_pct numeric(8,4) not null default 0,
  allowed_error_pct numeric(8,4) not null default 0,
  budget_burn_pct numeric(8,2) not null default 0,
  remaining_budget_pct numeric(8,2) not null default 100,
  status text not null default 'ok'
    check (status in ('ok', 'warn', 'critical')),
  recommended_action text not null default 'none',
  details jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  unique (service_key, sli_key, window_days, computed_date)
);

create index if not exists idx_sre_error_budget_rollups_status_date
  on public.sre_error_budget_rollups (status, computed_date desc, budget_burn_pct desc);

create or replace function public.refresh_sre_error_budget_rollups(
  p_window_days integer default 30
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_window integer := greatest(7, least(coalesce(p_window_days, 30), 90));
begin
  with policies as (
    select *
    from public.sre_error_budget_policies p
    where p.active = true
      and p.window_days = v_window
  ),
  aggregate_events as (
    select
      p.service_key,
      p.sli_key,
      p.window_days,
      p.target_pct,
      p.burn_warn_pct,
      p.burn_critical_pct,
      p.freeze_deploy_on_critical,
      count(e.id)::bigint as total_events,
      count(e.id) filter (where e.is_good = false)::bigint as bad_events
    from policies p
    left join public.service_sli_events e
      on e.service_key = p.service_key
      and e.sli_key = p.sli_key
      and e.occurred_at >= now() - make_interval(days => v_window)
    group by
      p.service_key,
      p.sli_key,
      p.window_days,
      p.target_pct,
      p.burn_warn_pct,
      p.burn_critical_pct,
      p.freeze_deploy_on_critical
  ),
  scored as (
    select
      a.service_key,
      a.sli_key,
      a.window_days,
      a.target_pct,
      a.burn_warn_pct,
      a.burn_critical_pct,
      a.freeze_deploy_on_critical,
      a.total_events,
      a.bad_events,
      case
        when a.total_events > 0
          then round((a.bad_events::numeric / a.total_events::numeric) * 100, 4)
        else 0::numeric
      end as observed_error_pct,
      greatest(0::numeric, round((100 - a.target_pct)::numeric, 4)) as allowed_error_pct
    from aggregate_events a
  )
  insert into public.sre_error_budget_rollups (
    service_key,
    sli_key,
    window_days,
    computed_date,
    total_events,
    bad_events,
    observed_error_pct,
    allowed_error_pct,
    budget_burn_pct,
    remaining_budget_pct,
    status,
    recommended_action,
    details,
    computed_at
  )
  select
    s.service_key,
    s.sli_key,
    s.window_days,
    current_date,
    s.total_events,
    s.bad_events,
    s.observed_error_pct,
    s.allowed_error_pct,
    case
      when s.allowed_error_pct > 0
        then round((s.observed_error_pct / s.allowed_error_pct) * 100, 2)
      else 0
    end as budget_burn_pct,
    case
      when s.allowed_error_pct > 0
        then greatest(0, round(100 - ((s.observed_error_pct / s.allowed_error_pct) * 100), 2))
      else 100
    end as remaining_budget_pct,
    case
      when s.allowed_error_pct > 0
        and ((s.observed_error_pct / s.allowed_error_pct) * 100) >= s.burn_critical_pct then 'critical'
      when s.allowed_error_pct > 0
        and ((s.observed_error_pct / s.allowed_error_pct) * 100) >= s.burn_warn_pct then 'warn'
      else 'ok'
    end as status,
    case
      when s.allowed_error_pct > 0
        and ((s.observed_error_pct / s.allowed_error_pct) * 100) >= s.burn_critical_pct
        and s.freeze_deploy_on_critical then 'freeze_deploy'
      when s.allowed_error_pct > 0
        and ((s.observed_error_pct / s.allowed_error_pct) * 100) >= s.burn_critical_pct then 'incident_review'
      when s.allowed_error_pct > 0
        and ((s.observed_error_pct / s.allowed_error_pct) * 100) >= s.burn_warn_pct then 'capacity_review'
      else 'none'
    end as recommended_action,
    jsonb_build_object(
      'target_pct', s.target_pct,
      'burn_warn_pct', s.burn_warn_pct,
      'burn_critical_pct', s.burn_critical_pct,
      'freeze_deploy_on_critical', s.freeze_deploy_on_critical
    ),
    now()
  from scored s
  on conflict (service_key, sli_key, window_days, computed_date) do update
  set
    total_events = excluded.total_events,
    bad_events = excluded.bad_events,
    observed_error_pct = excluded.observed_error_pct,
    allowed_error_pct = excluded.allowed_error_pct,
    budget_burn_pct = excluded.budget_burn_pct,
    remaining_budget_pct = excluded.remaining_budget_pct,
    status = excluded.status,
    recommended_action = excluded.recommended_action,
    details = excluded.details,
    computed_at = excluded.computed_at;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.create_finance_ops_alerts_from_error_budget(
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
begin
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
    'sre_error_budget_burn',
    case when r.status = 'critical' then 'critical' else 'warn' end as severity,
    'Error budget acima do limite',
    format(
      'Servico %s / %s com burn %.2f%% (status=%s).',
      r.service_key,
      r.sli_key,
      r.budget_burn_pct,
      r.status
    ),
    jsonb_build_object(
      'service_key', r.service_key,
      'sli_key', r.sli_key,
      'window_days', r.window_days,
      'computed_date', r.computed_date,
      'budget_burn_pct', r.budget_burn_pct,
      'remaining_budget_pct', r.remaining_budget_pct,
      'recommended_action', r.recommended_action
    ),
    md5('sre_error_budget_burn:' || r.service_key || ':' || r.sli_key || ':' || r.computed_date::text),
    now()
  from public.sre_error_budget_rollups r
  where r.computed_date = current_date
    and r.status in ('warn', 'critical')
  order by r.budget_burn_pct desc
  limit v_limit
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
-- DR tested calendar (fixed cadence)
-- =========================================================

create table if not exists public.dr_drill_calendar (
  id uuid primary key default gen_random_uuid(),
  scenario_key text not null,
  scheduled_date date not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'running', 'passed', 'failed', 'cancelled', 'missed')),
  owner_user_id uuid references public.profiles(id) on delete set null,
  run_id uuid references public.dr_test_runs(id) on delete set null,
  rto_target_minutes integer,
  rpo_target_minutes integer,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scenario_key, scheduled_date)
);

create index if not exists idx_dr_drill_calendar_status_date
  on public.dr_drill_calendar (status, scheduled_date asc);

drop trigger if exists trg_dr_drill_calendar_updated on public.dr_drill_calendar;
create trigger trg_dr_drill_calendar_updated
before update on public.dr_drill_calendar
for each row execute function public.set_updated_at();

create or replace function public.ensure_dr_drill_calendar(
  p_months_ahead integer default 6,
  p_day_of_month integer default 10,
  p_scenario_key text default 'regional_failover'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_months integer := greatest(1, least(coalesce(p_months_ahead, 6), 24));
  v_day integer := greatest(1, least(coalesce(p_day_of_month, 10), 28));
  v_scenario text := lower(coalesce(nullif(btrim(p_scenario_key), ''), 'regional_failover'));
begin
  with month_series as (
    select
      (date_trunc('month', current_date)::date + make_interval(months => gs.month_idx))::date as month_start
    from generate_series(0, v_months - 1) as gs(month_idx)
  )
  insert into public.dr_drill_calendar (
    scenario_key,
    scheduled_date,
    status,
    rto_target_minutes,
    rpo_target_minutes,
    metadata,
    created_at,
    updated_at
  )
  select
    v_scenario,
    (ms.month_start + (v_day - 1))::date,
    'scheduled',
    60,
    15,
    jsonb_build_object(
      'cadence', 'monthly_fixed_day',
      'day_of_month', v_day
    ),
    now(),
    now()
  from month_series ms
  on conflict (scenario_key, scheduled_date) do nothing;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.sync_dr_calendar_from_runs(
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
begin
  with latest_runs as (
    select distinct on (lower(d.scenario_key), date_trunc('month', coalesce(d.finished_at, d.created_at))::date)
      lower(d.scenario_key) as scenario_key,
      date_trunc('month', coalesce(d.finished_at, d.created_at))::date as month_start,
      d.id as run_id,
      lower(d.status) as run_status,
      coalesce(d.finished_at, d.created_at) as run_time
    from public.dr_test_runs d
    order by
      lower(d.scenario_key),
      date_trunc('month', coalesce(d.finished_at, d.created_at))::date,
      coalesce(d.finished_at, d.created_at) desc
    limit v_limit
  )
  update public.dr_drill_calendar c
  set
    run_id = lr.run_id,
    status = case
      when lr.run_status in ('passed', 'failed', 'cancelled') then lr.run_status
      else 'running'
    end,
    updated_at = now()
  from latest_runs lr
  where c.scenario_key = lr.scenario_key
    and date_trunc('month', c.scheduled_date)::date = lr.month_start
    and (c.run_id is distinct from lr.run_id or c.status is distinct from lr.run_status);

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.create_finance_ops_alerts_from_dr_calendar(
  p_grace_days integer default 3,
  p_limit integer default 200
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer := 0;
  v_grace integer := greatest(1, least(coalesce(p_grace_days, 3), 31));
  v_limit integer := greatest(1, least(coalesce(p_limit, 200), 2000));
begin
  with overdue as (
    select c.*
    from public.dr_drill_calendar c
    where c.status in ('scheduled', 'running')
      and c.scheduled_date <= current_date - v_grace
    order by c.scheduled_date asc
    limit v_limit
  ),
  mark_missed as (
    update public.dr_drill_calendar c
    set
      status = 'missed',
      updated_at = now()
    from overdue o
    where c.id = o.id
    returning c.*
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
    'dr_drill_missed',
    'critical',
    'DR drill fora do calendario',
    format(
      'Scenario %s sem execucao concluida para a data %s.',
      m.scenario_key,
      m.scheduled_date::text
    ),
    jsonb_build_object(
      'scenario_key', m.scenario_key,
      'scheduled_date', m.scheduled_date,
      'grace_days', v_grace,
      'status', m.status
    ),
    md5('dr_drill_missed:' || m.scenario_key || ':' || m.scheduled_date::text),
    now()
  from mark_missed m
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

-- Keep calendar synced when a DR run is recorded.
create or replace function public.sync_dr_calendar_after_run()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month_start date;
  v_scenario text;
begin
  v_month_start := date_trunc('month', coalesce(new.finished_at, new.created_at))::date;
  v_scenario := lower(coalesce(new.scenario_key, 'unknown'));

  update public.dr_drill_calendar c
  set
    run_id = new.id,
    status = case
      when lower(new.status) in ('passed', 'failed', 'cancelled') then lower(new.status)
      else 'running'
    end,
    updated_at = now()
  where c.scenario_key = v_scenario
    and date_trunc('month', c.scheduled_date)::date = v_month_start;

  return new;
end;
$$;

drop trigger if exists trg_dr_test_runs_sync_calendar on public.dr_test_runs;
create trigger trg_dr_test_runs_sync_calendar
after insert on public.dr_test_runs
for each row
execute function public.sync_dr_calendar_after_run();

-- =========================================================
-- Cron cadence and security
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
        'sre_oncall_shift_refresh_hourly',
        'sre_error_budget_refresh_hourly',
        'sre_error_budget_alerts_hourly',
        'sre_incident_oncall_assign_hourly',
        'sre_dr_calendar_ensure_daily',
        'sre_dr_calendar_sync_hourly',
        'sre_dr_calendar_alerts_daily'
      )
    loop
      perform cron.unschedule(v_job_id);
    end loop;

    perform cron.schedule(
      'sre_oncall_shift_refresh_hourly',
      '5 * * * *',
      'select public.refresh_sre_oncall_shifts(21);'
    );

    perform cron.schedule(
      'sre_error_budget_refresh_hourly',
      '10 * * * *',
      'select public.refresh_sre_error_budget_rollups(30);'
    );

    perform cron.schedule(
      'sre_error_budget_alerts_hourly',
      '12 * * * *',
      'select public.create_finance_ops_alerts_from_error_budget(200);'
    );

    perform cron.schedule(
      'sre_incident_oncall_assign_hourly',
      '15 * * * *',
      'select public.assign_sre_incidents_to_current_oncall(200);'
    );

    perform cron.schedule(
      'sre_dr_calendar_ensure_daily',
      '0 6 * * *',
      'select public.ensure_dr_drill_calendar(6, 10, ''regional_failover'');'
    );

    perform cron.schedule(
      'sre_dr_calendar_sync_hourly',
      '18 * * * *',
      'select public.sync_dr_calendar_from_runs(200);'
    );

    perform cron.schedule(
      'sre_dr_calendar_alerts_daily',
      '25 6 * * *',
      'select public.create_finance_ops_alerts_from_dr_calendar(3, 200);'
    );
  end if;
end
$$;

alter table public.sre_oncall_rotations enable row level security;
alter table public.sre_oncall_shifts enable row level security;
alter table public.sre_error_budget_policies enable row level security;
alter table public.sre_error_budget_rollups enable row level security;
alter table public.dr_drill_calendar enable row level security;

drop policy if exists sre_oncall_rotations_admin_select on public.sre_oncall_rotations;
create policy sre_oncall_rotations_admin_select
on public.sre_oncall_rotations
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

drop policy if exists sre_oncall_rotations_service_all on public.sre_oncall_rotations;
create policy sre_oncall_rotations_service_all
on public.sre_oncall_rotations
for all
to service_role
using (true)
with check (true);

drop policy if exists sre_oncall_shifts_admin_or_assignee_select on public.sre_oncall_shifts;
create policy sre_oncall_shifts_admin_or_assignee_select
on public.sre_oncall_shifts
for select
to authenticated
using (
  auth.uid() = primary_user_id
  or auth.uid() = secondary_user_id
  or exists (
    select 1
    from public.user_role_memberships m
    where m.user_id = auth.uid()
      and m.role = 'admin'
  )
);

drop policy if exists sre_oncall_shifts_service_all on public.sre_oncall_shifts;
create policy sre_oncall_shifts_service_all
on public.sre_oncall_shifts
for all
to service_role
using (true)
with check (true);

drop policy if exists sre_error_budget_policies_admin_select on public.sre_error_budget_policies;
create policy sre_error_budget_policies_admin_select
on public.sre_error_budget_policies
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

drop policy if exists sre_error_budget_policies_service_all on public.sre_error_budget_policies;
create policy sre_error_budget_policies_service_all
on public.sre_error_budget_policies
for all
to service_role
using (true)
with check (true);

drop policy if exists sre_error_budget_rollups_admin_select on public.sre_error_budget_rollups;
create policy sre_error_budget_rollups_admin_select
on public.sre_error_budget_rollups
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

drop policy if exists sre_error_budget_rollups_service_all on public.sre_error_budget_rollups;
create policy sre_error_budget_rollups_service_all
on public.sre_error_budget_rollups
for all
to service_role
using (true)
with check (true);

drop policy if exists dr_drill_calendar_admin_select on public.dr_drill_calendar;
create policy dr_drill_calendar_admin_select
on public.dr_drill_calendar
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

drop policy if exists dr_drill_calendar_service_all on public.dr_drill_calendar;
create policy dr_drill_calendar_service_all
on public.dr_drill_calendar
for all
to service_role
using (true)
with check (true);

revoke all on table public.sre_oncall_rotations from anon;
revoke all on table public.sre_oncall_shifts from anon;
revoke all on table public.sre_error_budget_policies from anon;
revoke all on table public.sre_error_budget_rollups from anon;
revoke all on table public.dr_drill_calendar from anon;

grant select on table public.sre_oncall_rotations to authenticated;
grant select on table public.sre_oncall_shifts to authenticated;
grant select on table public.sre_error_budget_policies to authenticated;
grant select on table public.sre_error_budget_rollups to authenticated;
grant select on table public.dr_drill_calendar to authenticated;

grant all on table public.sre_oncall_rotations to service_role;
grant all on table public.sre_oncall_shifts to service_role;
grant all on table public.sre_error_budget_policies to service_role;
grant all on table public.sre_error_budget_rollups to service_role;
grant all on table public.dr_drill_calendar to service_role;

grant execute on function public.refresh_sre_oncall_shifts(integer) to service_role;
grant execute on function public.assign_sre_incidents_to_current_oncall(integer) to service_role;
grant execute on function public.refresh_sre_error_budget_rollups(integer) to service_role;
grant execute on function public.create_finance_ops_alerts_from_error_budget(integer) to service_role;
grant execute on function public.ensure_dr_drill_calendar(integer, integer, text) to service_role;
grant execute on function public.sync_dr_calendar_from_runs(integer) to service_role;
grant execute on function public.create_finance_ops_alerts_from_dr_calendar(integer, integer) to service_role;

-- Initial bootstrap.
select public.refresh_sre_oncall_shifts(21);
select public.refresh_sre_error_budget_rollups(30);
select public.create_finance_ops_alerts_from_error_budget(200);
select public.ensure_dr_drill_calendar(6, 10, 'regional_failover');
select public.sync_dr_calendar_from_runs(200);
select public.create_finance_ops_alerts_from_dr_calendar(3, 200);
