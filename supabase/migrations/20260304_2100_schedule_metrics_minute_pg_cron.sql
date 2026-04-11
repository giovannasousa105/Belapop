-- Schedules minute-level marketplace metrics refresh in Supabase pg_cron.
-- Safe to re-run: it removes existing jobs with same name before creating one.

do $$
declare
  v_job_id bigint;
  v_command text;
begin
  if not exists (
    select 1
    from pg_extension
    where extname = 'pg_cron'
  ) then
    create extension if not exists pg_cron with schema extensions;
  end if;

  for v_job_id in
    select jobid
    from cron.job
    where jobname = 'refresh_marketplace_metrics_minute'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  if to_regprocedure('public.refresh_marketplace_metrics_minute(timestamp with time zone)') is not null then
    v_command := 'select public.refresh_marketplace_metrics_minute(null::timestamptz);';
  elsif to_regprocedure('public.refresh_marketplace_metrics_minute()') is not null then
    v_command := 'select public.refresh_marketplace_metrics_minute();';
  else
    raise exception 'public.refresh_marketplace_metrics_minute not found. Apply migration 20260304_1500_marketplace_events_realtime_pipeline.sql first.';
  end if;

  perform cron.schedule(
    'refresh_marketplace_metrics_minute',
    '* * * * *',
    v_command
  );
end;
$$;
