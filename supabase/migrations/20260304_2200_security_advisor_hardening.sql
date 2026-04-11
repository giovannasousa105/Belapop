-- Security Advisor hardening:
-- 1) Fix mutable function search_path findings
-- 2) Move unaccent extension out of public schema
-- 3) Tighten default privileges for future objects
-- 4) Enable RLS on internal metrics/event tables with restrictive policies

create schema if not exists extensions;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'unaccent') then
    begin
      execute 'alter extension unaccent set schema extensions';
    exception
      when others then
        -- Keep migration idempotent across environments where extension
        -- is already moved or managed differently.
        null;
    end;
  end if;
end;
$$;

do $$
declare
  fn record;
begin
  -- Set explicit search_path on all user-defined functions in public
  -- that still rely on mutable/default search_path.
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    left join pg_depend d
      on d.classid = 'pg_proc'::regclass
     and d.objid = p.oid
     and d.deptype = 'e'
    where n.nspname = 'public'
      and p.prokind = 'f'
      and d.objid is null
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, '{}'::text[])) cfg
        where cfg like 'search_path=%'
      )
  loop
    execute format(
      'alter function %s set search_path = public, extensions, pg_temp',
      fn.signature
    );
  end loop;
end;
$$;

-- Tighten default grants for objects created from now on.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;

do $$
begin
  -- Internal realtime/event tables should not be public-open.
  if to_regclass('public.marketplace_events') is not null then
    alter table public.marketplace_events enable row level security;
    revoke all on table public.marketplace_events from anon;
    grant select on table public.marketplace_events to authenticated;

    drop policy if exists marketplace_events_admin_select on public.marketplace_events;
    create policy marketplace_events_admin_select
      on public.marketplace_events
      for select
      to authenticated
      using (public.is_admin(auth.uid()));

    drop policy if exists marketplace_events_service_all on public.marketplace_events;
    create policy marketplace_events_service_all
      on public.marketplace_events
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.metrics_marketplace_minute') is not null then
    alter table public.metrics_marketplace_minute enable row level security;
    revoke all on table public.metrics_marketplace_minute from anon;
    grant select on table public.metrics_marketplace_minute to authenticated;

    drop policy if exists metrics_minute_admin_select on public.metrics_marketplace_minute;
    create policy metrics_minute_admin_select
      on public.metrics_marketplace_minute
      for select
      to authenticated
      using (public.is_admin(auth.uid()));

    drop policy if exists metrics_minute_service_all on public.metrics_marketplace_minute;
    create policy metrics_minute_service_all
      on public.metrics_marketplace_minute
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.metrics_marketplace_hour') is not null then
    alter table public.metrics_marketplace_hour enable row level security;
    revoke all on table public.metrics_marketplace_hour from anon;
    grant select on table public.metrics_marketplace_hour to authenticated;

    drop policy if exists metrics_hour_admin_select on public.metrics_marketplace_hour;
    create policy metrics_hour_admin_select
      on public.metrics_marketplace_hour
      for select
      to authenticated
      using (public.is_admin(auth.uid()));

    drop policy if exists metrics_hour_service_all on public.metrics_marketplace_hour;
    create policy metrics_hour_service_all
      on public.metrics_marketplace_hour
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.metrics_marketplace_day') is not null then
    alter table public.metrics_marketplace_day enable row level security;
    revoke all on table public.metrics_marketplace_day from anon;
    grant select on table public.metrics_marketplace_day to authenticated;

    drop policy if exists metrics_day_admin_select on public.metrics_marketplace_day;
    create policy metrics_day_admin_select
      on public.metrics_marketplace_day
      for select
      to authenticated
      using (public.is_admin(auth.uid()));

    drop policy if exists metrics_day_service_all on public.metrics_marketplace_day;
    create policy metrics_day_service_all
      on public.metrics_marketplace_day
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.order_financial_snapshot') is not null then
    alter table public.order_financial_snapshot enable row level security;
    revoke all on table public.order_financial_snapshot from anon;
    grant select on table public.order_financial_snapshot to authenticated;

    drop policy if exists order_financial_snapshot_admin_select on public.order_financial_snapshot;
    create policy order_financial_snapshot_admin_select
      on public.order_financial_snapshot
      for select
      to authenticated
      using (public.is_admin(auth.uid()));

    drop policy if exists order_financial_snapshot_service_all on public.order_financial_snapshot;
    create policy order_financial_snapshot_service_all
      on public.order_financial_snapshot
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.order_financial_snapshot_queue') is not null then
    alter table public.order_financial_snapshot_queue enable row level security;
    revoke all on table public.order_financial_snapshot_queue from anon, authenticated;

    drop policy if exists order_fin_snapshot_queue_service_all on public.order_financial_snapshot_queue;
    create policy order_fin_snapshot_queue_service_all
      on public.order_financial_snapshot_queue
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.order_financial_snapshot_runs') is not null then
    alter table public.order_financial_snapshot_runs enable row level security;
    revoke all on table public.order_financial_snapshot_runs from anon, authenticated;

    drop policy if exists order_fin_snapshot_runs_service_all on public.order_financial_snapshot_runs;
    create policy order_fin_snapshot_runs_service_all
      on public.order_financial_snapshot_runs
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.ledger_accounts') is not null then
    alter table public.ledger_accounts enable row level security;
    revoke all on table public.ledger_accounts from anon;
    grant select on table public.ledger_accounts to authenticated;

    drop policy if exists ledger_accounts_admin_select on public.ledger_accounts;
    create policy ledger_accounts_admin_select
      on public.ledger_accounts
      for select
      to authenticated
      using (public.is_admin(auth.uid()));

    drop policy if exists ledger_accounts_service_all on public.ledger_accounts;
    create policy ledger_accounts_service_all
      on public.ledger_accounts
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end;
$$;

