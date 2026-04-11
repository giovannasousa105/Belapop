create table if not exists public.security_rate_limit_counters (
  scope text not null,
  actor_key text not null,
  bucket_start timestamptz not null,
  attempts integer not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  blocked_until timestamptz,
  primary key (scope, actor_key, bucket_start)
);

create index if not exists idx_security_rate_limit_counters_last_seen
  on public.security_rate_limit_counters (last_seen_at desc);

alter table public.security_rate_limit_counters enable row level security;

revoke all on public.security_rate_limit_counters from anon, authenticated;
grant all on public.security_rate_limit_counters to service_role;

create or replace function public.security_consume_rate_limit(
  p_scope text,
  p_actor_key text,
  p_window_seconds integer,
  p_limit integer,
  p_block_seconds integer default 0
)
returns table (
  allowed boolean,
  attempts integer,
  remaining integer,
  reset_at timestamptz,
  blocked_until timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_scope text := btrim(coalesce(p_scope, ''));
  v_actor_key text := lower(btrim(coalesce(p_actor_key, '')));
  v_window_seconds integer := greatest(coalesce(p_window_seconds, 0), 1);
  v_limit integer := greatest(coalesce(p_limit, 0), 1);
  v_block_seconds integer := greatest(coalesce(p_block_seconds, 0), 0);
  v_bucket_epoch bigint;
  v_bucket_start timestamptz;
  v_bucket_end timestamptz;
  v_attempts integer := 0;
  v_blocked_until timestamptz;
begin
  if v_scope = '' or v_actor_key = '' then
    return query
    select
      true,
      0,
      v_limit,
      v_now + make_interval(secs => v_window_seconds),
      null::timestamptz;
    return;
  end if;

  v_bucket_epoch := floor(extract(epoch from v_now) / v_window_seconds)::bigint * v_window_seconds;
  v_bucket_start := to_timestamp(v_bucket_epoch);
  v_bucket_end := v_bucket_start + make_interval(secs => v_window_seconds);

  insert into public.security_rate_limit_counters (
    scope,
    actor_key,
    bucket_start,
    attempts,
    first_seen_at,
    last_seen_at,
    blocked_until
  )
  values (
    v_scope,
    v_actor_key,
    v_bucket_start,
    1,
    v_now,
    v_now,
    null
  )
  on conflict (scope, actor_key, bucket_start) do update
    set attempts = public.security_rate_limit_counters.attempts + 1,
        last_seen_at = excluded.last_seen_at
  returning
    public.security_rate_limit_counters.attempts,
    public.security_rate_limit_counters.blocked_until
  into v_attempts, v_blocked_until;

  if v_blocked_until is not null and v_blocked_until > v_now then
    return query
    select false, v_attempts, 0, v_bucket_end, v_blocked_until;
    return;
  end if;

  if v_attempts > v_limit then
    if v_block_seconds > 0 then
      update public.security_rate_limit_counters
      set blocked_until = greatest(
        coalesce(blocked_until, v_now + make_interval(secs => v_block_seconds)),
        v_now + make_interval(secs => v_block_seconds)
      )
      where scope = v_scope
        and actor_key = v_actor_key
        and bucket_start = v_bucket_start
      returning public.security_rate_limit_counters.blocked_until
      into v_blocked_until;
    end if;

    return query
    select false, v_attempts, 0, v_bucket_end, v_blocked_until;
    return;
  end if;

  return query
  select
    true,
    v_attempts,
    greatest(v_limit - v_attempts, 0),
    v_bucket_end,
    v_blocked_until;
end;
$$;

revoke all on function public.security_consume_rate_limit(text, text, integer, integer, integer) from public;
grant execute on function public.security_consume_rate_limit(text, text, integer, integer, integer) to service_role;
