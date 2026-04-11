-- =========================================================
-- Skincare Simulation Batches + Incremental Effectiveness Refresh
-- =========================================================

create or replace function public.refresh_product_effectiveness_for_user(
  p_user_id uuid
)
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
      least(1.0, count(*)::numeric / 12.0)::numeric(6,4) as confidence_score
    from public.skincare_usage su
    join public.treatment_outcomes outcome
      on outcome.user_id = su.user_id
    join public.skin_scans before_scan
      on before_scan.id = outcome.before_scan_id
    join public.skin_scans after_scan
      on after_scan.id = outcome.after_scan_id
    where su.user_id = p_user_id
      and after_scan.created_at::date >= su.start_date
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
    confidence_score = greatest(public.product_effectiveness.confidence_score, excluded.confidence_score),
    updated_at = excluded.updated_at;
$$;

grant execute on function public.refresh_product_effectiveness_for_user(uuid) to service_role;
