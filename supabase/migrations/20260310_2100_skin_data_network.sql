-- =========================================================
-- Skin Data Network
-- =========================================================

create table if not exists public.skin_twins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  latest_scan_id uuid,
  hydration_level numeric(6,2) not null default 50 check (hydration_level between 0 and 100),
  elasticity_level numeric(6,2) not null default 50 check (elasticity_level between 0 and 100),
  pigmentation_level numeric(6,2) not null default 50 check (pigmentation_level between 0 and 100),
  acne_level numeric(6,2) not null default 50 check (acne_level between 0 and 100),
  redness_level numeric(6,2) not null default 50 check (redness_level between 0 and 100),
  pore_visibility numeric(6,2) not null default 50 check (pore_visibility between 0 and 100),
  wrinkle_depth numeric(6,2) not null default 50 check (wrinkle_depth between 0 and 100),
  confidence_score numeric(6,4) not null default 0.2500 check (confidence_score between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skin_twins_user_unique unique (user_id)
);

drop trigger if exists trg_skin_twins_updated on public.skin_twins;
create trigger trg_skin_twins_updated
before update on public.skin_twins
for each row execute function public.set_updated_at();

create table if not exists public.skin_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skin_twin_id uuid references public.skin_twins(id) on delete set null,
  hydration_score numeric(6,2) not null check (hydration_score between 0 and 100),
  elasticity_score numeric(6,2) not null default 50 check (elasticity_score between 0 and 100),
  pigmentation_score numeric(6,2) not null check (pigmentation_score between 0 and 100),
  acne_score numeric(6,2) not null check (acne_score between 0 and 100),
  redness_score numeric(6,2) not null check (redness_score between 0 and 100),
  pore_visibility numeric(6,2) not null default 50 check (pore_visibility between 0 and 100),
  wrinkle_depth numeric(6,2) not null default 50 check (wrinkle_depth between 0 and 100),
  scan_source text not null default 'manual'
    check (scan_source in ('manual', 'ai_scan', 'imported')),
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_skin_scans_user_created
  on public.skin_scans (user_id, created_at desc);

create index if not exists idx_skin_scans_twin_created
  on public.skin_scans (skin_twin_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'skin_twins_latest_scan_fk'
  ) then
    alter table public.skin_twins
      add constraint skin_twins_latest_scan_fk
      foreign key (latest_scan_id) references public.skin_scans(id) on delete set null;
  end if;
end;
$$;

create table if not exists public.skin_twin_snapshots (
  id uuid primary key default gen_random_uuid(),
  skin_twin_id uuid not null references public.skin_twins(id) on delete cascade,
  skin_scan_id uuid references public.skin_scans(id) on delete set null,
  hydration_level numeric(6,2) not null check (hydration_level between 0 and 100),
  elasticity_level numeric(6,2) not null check (elasticity_level between 0 and 100),
  pigmentation_level numeric(6,2) not null check (pigmentation_level between 0 and 100),
  acne_level numeric(6,2) not null check (acne_level between 0 and 100),
  redness_level numeric(6,2) not null check (redness_level between 0 and 100),
  pore_visibility numeric(6,2) not null check (pore_visibility between 0 and 100),
  wrinkle_depth numeric(6,2) not null check (wrinkle_depth between 0 and 100),
  confidence_score numeric(6,4) not null default 0.25 check (confidence_score between 0 and 1),
  created_at timestamptz not null default now()
);

create index if not exists idx_skin_twin_snapshots_twin_created
  on public.skin_twin_snapshots (skin_twin_id, created_at desc);

create table if not exists public.skincare_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  routine_cart_id uuid references public.routine_carts(id) on delete set null,
  start_date date not null default current_date,
  end_date date,
  adherence_score numeric(6,2) check (adherence_score is null or adherence_score between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint skincare_usage_dates_valid check (end_date is null or end_date >= start_date),
  constraint skincare_usage_user_product_start_unique unique (user_id, product_id, start_date)
);

create index if not exists idx_skincare_usage_user_active
  on public.skincare_usage (user_id, start_date desc, end_date);

create index if not exists idx_skincare_usage_product_dates
  on public.skincare_usage (product_id, start_date desc, end_date);

create table if not exists public.treatment_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  before_scan_id uuid not null references public.skin_scans(id) on delete cascade,
  after_scan_id uuid not null references public.skin_scans(id) on delete cascade,
  improvement_score numeric(6,2) not null,
  metrics_delta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint treatment_outcomes_pair_unique unique (before_scan_id, after_scan_id)
);

create index if not exists idx_treatment_outcomes_user_created
  on public.treatment_outcomes (user_id, created_at desc);

create table if not exists public.ingredient_effects (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  target_metric text not null
    check (target_metric in (
      'hydration_level',
      'elasticity_level',
      'pigmentation_level',
      'acne_level',
      'redness_level',
      'pore_visibility',
      'wrinkle_depth'
    )),
  improvement_rate numeric(6,2) not null check (improvement_rate >= 0),
  confidence_score numeric(6,4) not null default 0.5 check (confidence_score between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredient_effects_unique unique (ingredient_id, target_metric)
);

drop trigger if exists trg_ingredient_effects_updated on public.ingredient_effects;
create trigger trg_ingredient_effects_updated
before update on public.ingredient_effects
for each row execute function public.set_updated_at();

create table if not exists public.routine_simulations (
  id uuid primary key default gen_random_uuid(),
  skin_twin_id uuid not null references public.skin_twins(id) on delete cascade,
  routine_cart_id uuid references public.routine_carts(id) on delete set null,
  simulation_period_days integer not null check (simulation_period_days > 0),
  predicted_improvement numeric(6,2) not null,
  confidence_score numeric(6,4) not null default 0 check (confidence_score between 0 and 1),
  current_metrics jsonb not null,
  predicted_metrics jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_routine_simulations_twin_created
  on public.routine_simulations (skin_twin_id, simulation_period_days, created_at desc);

create table if not exists public.product_effectiveness (
  product_id uuid primary key references public.products(id) on delete cascade,
  acne_effectiveness numeric(6,2) not null default 0,
  hydration_effectiveness numeric(6,2) not null default 0,
  pigmentation_effectiveness numeric(6,2) not null default 0,
  redness_effectiveness numeric(6,2) not null default 0,
  confidence_score numeric(6,4) not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_product_effectiveness_updated on public.product_effectiveness;
create trigger trg_product_effectiveness_updated
before update on public.product_effectiveness
for each row execute function public.set_updated_at();

insert into public.ingredient_effects (ingredient_id, target_metric, improvement_rate, confidence_score)
select i.id, src.target_metric, src.improvement_rate, src.confidence_score
from (
  values
    ('centella-asiatica', 'redness_level', 14.0::numeric, 0.82::numeric),
    ('centella-asiatica', 'acne_level', 8.0::numeric, 0.71::numeric),
    ('centella-asiatica', 'hydration_level', 5.0::numeric, 0.68::numeric),
    ('niacinamide', 'pigmentation_level', 12.0::numeric, 0.83::numeric),
    ('niacinamide', 'acne_level', 10.0::numeric, 0.79::numeric),
    ('niacinamide', 'pore_visibility', 9.0::numeric, 0.74::numeric),
    ('ceramides', 'hydration_level', 16.0::numeric, 0.86::numeric),
    ('ceramides', 'redness_level', 7.0::numeric, 0.73::numeric),
    ('ceramides', 'elasticity_level', 5.0::numeric, 0.61::numeric),
    ('retinol', 'wrinkle_depth', 13.0::numeric, 0.84::numeric),
    ('retinol', 'pigmentation_level', 9.0::numeric, 0.72::numeric),
    ('retinol', 'elasticity_level', 7.0::numeric, 0.69::numeric),
    ('hyaluronic-acid', 'hydration_level', 18.0::numeric, 0.88::numeric),
    ('hyaluronic-acid', 'elasticity_level', 6.0::numeric, 0.66::numeric)
) as src(ingredient_slug, target_metric, improvement_rate, confidence_score)
join public.ingredients i on i.slug = src.ingredient_slug
on conflict (ingredient_id, target_metric) do update
set
  improvement_rate = excluded.improvement_rate,
  confidence_score = excluded.confidence_score,
  updated_at = now();

create or replace function public.ensure_skin_twin(
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_twin_id uuid;
begin
  insert into public.skin_twins (user_id)
  values (p_user_id)
  on conflict (user_id) do update
  set updated_at = now()
  returning id into v_twin_id;

  return v_twin_id;
end;
$$;

create or replace function public.record_skin_scan(
  p_user_id uuid,
  p_hydration_score numeric,
  p_acne_score numeric,
  p_pigmentation_score numeric,
  p_redness_score numeric,
  p_elasticity_score numeric default 50,
  p_pore_visibility numeric default 50,
  p_wrinkle_depth numeric default 50,
  p_scan_source text default 'manual',
  p_image_url text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_twin_id uuid;
  v_scan_id uuid := gen_random_uuid();
  v_previous_scan public.skin_scans%rowtype;
  v_improvement numeric(6,2);
  v_metrics_delta jsonb := '{}'::jsonb;
  v_confidence numeric(6,4);
begin
  v_twin_id := public.ensure_skin_twin(p_user_id);

  select *
  into v_previous_scan
  from public.skin_scans
  where user_id = p_user_id
  order by created_at desc
  limit 1;

  insert into public.skin_scans (
    id,
    user_id,
    skin_twin_id,
    hydration_score,
    elasticity_score,
    pigmentation_score,
    acne_score,
    redness_score,
    pore_visibility,
    wrinkle_depth,
    scan_source,
    image_url,
    metadata
  )
  values (
    v_scan_id,
    p_user_id,
    v_twin_id,
    p_hydration_score,
    coalesce(p_elasticity_score, 50),
    p_pigmentation_score,
    p_acne_score,
    p_redness_score,
    coalesce(p_pore_visibility, 50),
    coalesce(p_wrinkle_depth, 50),
    coalesce(p_scan_source, 'manual'),
    p_image_url,
    coalesce(p_metadata, '{}'::jsonb)
  );

  select least(
    1.0,
    case
      when v_previous_scan.id is null then 0.45
      else st.confidence_score + 0.08
    end
  )
  into v_confidence
  from public.skin_twins st
  where st.id = v_twin_id;

  update public.skin_twins
  set
    latest_scan_id = v_scan_id,
    hydration_level = p_hydration_score,
    elasticity_level = coalesce(p_elasticity_score, 50),
    pigmentation_level = p_pigmentation_score,
    acne_level = p_acne_score,
    redness_level = p_redness_score,
    pore_visibility = coalesce(p_pore_visibility, 50),
    wrinkle_depth = coalesce(p_wrinkle_depth, 50),
    confidence_score = coalesce(v_confidence, 0.45),
    updated_at = now()
  where id = v_twin_id;

  insert into public.skin_twin_snapshots (
    skin_twin_id,
    skin_scan_id,
    hydration_level,
    elasticity_level,
    pigmentation_level,
    acne_level,
    redness_level,
    pore_visibility,
    wrinkle_depth,
    confidence_score
  )
  values (
    v_twin_id,
    v_scan_id,
    p_hydration_score,
    coalesce(p_elasticity_score, 50),
    p_pigmentation_score,
    p_acne_score,
    p_redness_score,
    coalesce(p_pore_visibility, 50),
    coalesce(p_wrinkle_depth, 50),
    coalesce(v_confidence, 0.45)
  );

  if v_previous_scan.id is not null then
    v_metrics_delta := jsonb_build_object(
      'hydration_level', round((p_hydration_score - v_previous_scan.hydration_score)::numeric, 2),
      'elasticity_level', round((coalesce(p_elasticity_score, 50) - v_previous_scan.elasticity_score)::numeric, 2),
      'pigmentation_level', round((v_previous_scan.pigmentation_score - p_pigmentation_score)::numeric, 2),
      'acne_level', round((v_previous_scan.acne_score - p_acne_score)::numeric, 2),
      'redness_level', round((v_previous_scan.redness_score - p_redness_score)::numeric, 2),
      'pore_visibility', round((v_previous_scan.pore_visibility - coalesce(p_pore_visibility, 50))::numeric, 2),
      'wrinkle_depth', round((v_previous_scan.wrinkle_depth - coalesce(p_wrinkle_depth, 50))::numeric, 2)
    );

    v_improvement := round((
      greatest(p_hydration_score - v_previous_scan.hydration_score, 0) +
      greatest(coalesce(p_elasticity_score, 50) - v_previous_scan.elasticity_score, 0) +
      greatest(v_previous_scan.pigmentation_score - p_pigmentation_score, 0) +
      greatest(v_previous_scan.acne_score - p_acne_score, 0) +
      greatest(v_previous_scan.redness_score - p_redness_score, 0) +
      greatest(v_previous_scan.pore_visibility - coalesce(p_pore_visibility, 50), 0) +
      greatest(v_previous_scan.wrinkle_depth - coalesce(p_wrinkle_depth, 50), 0)
    ) / 7.0, 2);

    insert into public.treatment_outcomes (
      user_id,
      before_scan_id,
      after_scan_id,
      improvement_score,
      metrics_delta
    )
    values (
      p_user_id,
      v_previous_scan.id,
      v_scan_id,
      coalesce(v_improvement, 0),
      v_metrics_delta
    )
    on conflict (before_scan_id, after_scan_id) do update
    set
      improvement_score = excluded.improvement_score,
      metrics_delta = excluded.metrics_delta;
  end if;

  return v_scan_id;
end;
$$;

create or replace function public.begin_skincare_usage(
  p_user_id uuid,
  p_cart_id uuid default null,
  p_start_date date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_cart_id uuid;
begin
  if p_cart_id is null then
    select rc.id
    into v_cart_id
    from public.routine_carts rc
    where rc.user_id = p_user_id
    order by rc.created_at desc
    limit 1;
  else
    select rc.id
    into v_cart_id
    from public.routine_carts rc
    where rc.id = p_cart_id
      and rc.user_id = p_user_id
    limit 1;
  end if;

  if v_cart_id is null then
    raise exception 'routine_cart_not_found' using errcode = 'P0001';
  end if;

  insert into public.skincare_usage (
    user_id,
    product_id,
    routine_cart_id,
    start_date
  )
  select
    p_user_id,
    rci.product_id,
    v_cart_id,
    coalesce(p_start_date, current_date)
  from public.routine_cart_items rci
  where rci.cart_id = v_cart_id
  on conflict (user_id, product_id, start_date) do nothing;

  return v_cart_id;
end;
$$;

create or replace function public.refresh_product_effectiveness()
returns void
language sql
security definer
set search_path = public, extensions, pg_temp
as $$
  with usage_outcomes as (
    select
      su.product_id,
      avg(greatest(before_scan.acne_score - after_scan.acne_score, 0))::numeric(6,2) as acne_effectiveness,
      avg(greatest(after_scan.hydration_score - before_scan.hydration_score, 0))::numeric(6,2) as hydration_effectiveness,
      avg(greatest(before_scan.pigmentation_score - after_scan.pigmentation_score, 0))::numeric(6,2) as pigmentation_effectiveness,
      avg(greatest(before_scan.redness_score - after_scan.redness_score, 0))::numeric(6,2) as redness_effectiveness,
      least(1.0, count(*)::numeric / 25.0)::numeric(6,4) as confidence_score
    from public.skincare_usage su
    join public.treatment_outcomes outcome
      on outcome.user_id = su.user_id
    join public.skin_scans before_scan
      on before_scan.id = outcome.before_scan_id
    join public.skin_scans after_scan
      on after_scan.id = outcome.after_scan_id
    where after_scan.created_at::date >= su.start_date
      and (su.end_date is null or before_scan.created_at::date <= su.end_date)
    group by su.product_id
  )
  insert into public.product_effectiveness (
    product_id,
    acne_effectiveness,
    hydration_effectiveness,
    pigmentation_effectiveness,
    redness_effectiveness,
    confidence_score,
    updated_at
  )
  select
    uo.product_id,
    coalesce(uo.acne_effectiveness, 0),
    coalesce(uo.hydration_effectiveness, 0),
    coalesce(uo.pigmentation_effectiveness, 0),
    coalesce(uo.redness_effectiveness, 0),
    coalesce(uo.confidence_score, 0),
    now()
  from usage_outcomes uo
  on conflict (product_id) do update
  set
    acne_effectiveness = excluded.acne_effectiveness,
    hydration_effectiveness = excluded.hydration_effectiveness,
    pigmentation_effectiveness = excluded.pigmentation_effectiveness,
    redness_effectiveness = excluded.redness_effectiveness,
    confidence_score = excluded.confidence_score,
    updated_at = excluded.updated_at;
$$;

grant execute on function public.ensure_skin_twin(uuid) to authenticated, service_role;
grant execute on function public.record_skin_scan(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, text, jsonb)
  to authenticated, service_role;
grant execute on function public.begin_skincare_usage(uuid, uuid, date) to authenticated, service_role;
grant execute on function public.refresh_product_effectiveness() to service_role;

alter table public.skin_twins enable row level security;
alter table public.skin_scans enable row level security;
alter table public.skin_twin_snapshots enable row level security;
alter table public.skincare_usage enable row level security;
alter table public.treatment_outcomes enable row level security;
alter table public.ingredient_effects enable row level security;
alter table public.routine_simulations enable row level security;
alter table public.product_effectiveness enable row level security;

drop policy if exists skin_twins_owner_read on public.skin_twins;
create policy skin_twins_owner_read
on public.skin_twins
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists skin_twins_owner_write on public.skin_twins;
create policy skin_twins_owner_write
on public.skin_twins
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists skin_scans_owner_read on public.skin_scans;
create policy skin_scans_owner_read
on public.skin_scans
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists skin_scans_owner_write on public.skin_scans;
create policy skin_scans_owner_write
on public.skin_scans
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists skin_twin_snapshots_owner_read on public.skin_twin_snapshots;
create policy skin_twin_snapshots_owner_read
on public.skin_twin_snapshots
for select
to authenticated
using (
  exists (
    select 1
    from public.skin_twins st
    where st.id = skin_twin_snapshots.skin_twin_id
      and st.user_id = auth.uid()
  )
);

drop policy if exists skincare_usage_owner_read on public.skincare_usage;
create policy skincare_usage_owner_read
on public.skincare_usage
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists skincare_usage_owner_write on public.skincare_usage;
create policy skincare_usage_owner_write
on public.skincare_usage
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists treatment_outcomes_owner_read on public.treatment_outcomes;
create policy treatment_outcomes_owner_read
on public.treatment_outcomes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists routine_simulations_owner_read on public.routine_simulations;
create policy routine_simulations_owner_read
on public.routine_simulations
for select
to authenticated
using (
  exists (
    select 1
    from public.skin_twins st
    where st.id = routine_simulations.skin_twin_id
      and st.user_id = auth.uid()
  )
);

drop policy if exists product_effectiveness_public_read on public.product_effectiveness;
create policy product_effectiveness_public_read
on public.product_effectiveness
for select
to authenticated, anon
using (true);

drop policy if exists ingredient_effects_service_all on public.ingredient_effects;
create policy ingredient_effects_service_all
on public.ingredient_effects
for all
to service_role
using (true)
with check (true);

drop policy if exists product_effectiveness_service_all on public.product_effectiveness;
create policy product_effectiveness_service_all
on public.product_effectiveness
for all
to service_role
using (true)
with check (true);

drop policy if exists routine_simulations_service_all on public.routine_simulations;
create policy routine_simulations_service_all
on public.routine_simulations
for all
to service_role
using (true)
with check (true);

grant select, insert, update on public.skin_twins to authenticated;
grant select, insert, update on public.skin_scans to authenticated;
grant select on public.skin_twin_snapshots to authenticated;
grant select, insert, update on public.skincare_usage to authenticated;
grant select on public.treatment_outcomes to authenticated;
grant select on public.product_effectiveness to authenticated, anon;

grant all on table public.skin_twins to service_role;
grant all on table public.skin_scans to service_role;
grant all on table public.skin_twin_snapshots to service_role;
grant all on table public.skincare_usage to service_role;
grant all on table public.treatment_outcomes to service_role;
grant all on table public.ingredient_effects to service_role;
grant all on table public.routine_simulations to service_role;
grant all on table public.product_effectiveness to service_role;

do $$
declare
  v_job_id bigint;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;
  end if;

  select jobid
  into v_job_id
  from cron.job
  where jobname = 'refresh_product_effectiveness_6h';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'refresh_product_effectiveness_6h',
    '0 */6 * * *',
    $job$select public.refresh_product_effectiveness();$job$
  );
exception
  when undefined_table or undefined_function then
    null;
end;
$$;
