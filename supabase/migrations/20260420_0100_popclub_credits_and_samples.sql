-- PopClub credits ledger + sample eligibility.
-- Extends the tier engine foundation with immutable credits and per-order sample decisions.

create extension if not exists "pgcrypto";

alter table if exists public.popclub_memberships
  add column if not exists credit_balance_cents integer not null default 0
    check (credit_balance_cents >= 0),
  add column if not exists lifetime_credits_granted_cents integer not null default 0
    check (lifetime_credits_granted_cents >= 0),
  add column if not exists lifetime_credits_reversed_cents integer not null default 0
    check (lifetime_credits_reversed_cents >= 0),
  add column if not exists latest_sample_slots integer not null default 0
    check (latest_sample_slots >= 0),
  add column if not exists latest_sample_status text null
    check (
      latest_sample_status is null
      or latest_sample_status in ('eligible', 'not_eligible', 'reserved', 'fulfilled', 'reversed', 'waived')
    );

alter table if exists public.popclub_order_benefit_snapshots
  add column if not exists credit_threshold_points integer null
    check (credit_threshold_points is null or credit_threshold_points > 0),
  add column if not exists credit_amount_cents integer null
    check (credit_amount_cents is null or credit_amount_cents >= 0),
  add column if not exists credits_granted_cents integer not null default 0
    check (credits_granted_cents >= 0),
  add column if not exists credits_reversed_cents integer not null default 0
    check (credits_reversed_cents >= 0),
  add column if not exists sample_decision_status text null
    check (
      sample_decision_status is null
      or sample_decision_status in ('eligible', 'not_eligible', 'reserved', 'fulfilled', 'reversed', 'waived')
    );

create table if not exists public.popclub_credits_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid null references public.orders(id) on delete set null,
  tier_id text not null references public.popclub_tier_rules(id) on delete restrict,
  event_name text not null
    check (event_name in (
      'order_paid',
      'refund_settled',
      'chargeback_opened',
      'credit_redeemed',
      'credit_expired',
      'manual_adjustment',
      'backfill_adjustment'
    )),
  entry_kind text not null
    check (entry_kind in ('grant', 'reversal', 'redeem', 'expiry', 'adjustment')),
  amount_cents integer not null
    check (amount_cents <> 0),
  credit_threshold_points integer null
    check (credit_threshold_points is null or credit_threshold_points > 0),
  source text not null default 'system',
  source_idempotency_key text not null,
  source_event_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_popclub_credits_ledger_source_idempotency
  on public.popclub_credits_ledger (source_idempotency_key);

create unique index if not exists uq_popclub_credits_ledger_order_paid_grant
  on public.popclub_credits_ledger (order_id, event_name)
  where order_id is not null
    and event_name = 'order_paid'
    and entry_kind = 'grant';

create index if not exists idx_popclub_credits_ledger_user_event
  on public.popclub_credits_ledger (user_id, source_event_at desc, created_at desc);

create index if not exists idx_popclub_credits_ledger_order_event
  on public.popclub_credits_ledger (order_id, source_event_at desc, created_at desc);

create table if not exists public.popclub_sample_eligibility_decisions (
  order_id uuid primary key references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier_id text not null references public.popclub_tier_rules(id) on delete restrict,
  status text not null
    check (status in ('eligible', 'not_eligible', 'reserved', 'fulfilled', 'reversed', 'waived')),
  sample_slots integer not null default 0
    check (sample_slots >= 0),
  decision_reason text not null default 'not_eligible',
  source_event_name text not null default 'order_paid',
  source_event_at timestamptz not null default now(),
  reversal_event_name text null,
  reversal_event_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_popclub_sample_eligibility_decisions_updated on public.popclub_sample_eligibility_decisions;
create trigger trg_popclub_sample_eligibility_decisions_updated
before update on public.popclub_sample_eligibility_decisions
for each row execute function public.set_updated_at();

create index if not exists idx_popclub_sample_eligibility_decisions_user_event
  on public.popclub_sample_eligibility_decisions (user_id, source_event_at desc, updated_at desc);

create index if not exists idx_popclub_sample_eligibility_decisions_status
  on public.popclub_sample_eligibility_decisions (status, source_event_at desc);

create or replace function public.popclub_credits_balance(
  p_user_id uuid
)
returns integer
language sql
stable
set search_path = public
as $$
  select greatest(coalesce(sum(amount_cents), 0), 0)::integer
  from public.popclub_credits_ledger
  where user_id = p_user_id;
$$;

create or replace function public.popclub_refresh_membership_benefits(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credit_balance integer := 0;
  v_lifetime_credits_granted integer := 0;
  v_lifetime_credits_reversed integer := 0;
  v_latest_sample_slots integer := 0;
  v_latest_sample_status text;
begin
  if p_user_id is null then
    return;
  end if;

  perform public.popclub_refresh_membership(p_user_id);

  select
    greatest(coalesce(sum(cl.amount_cents), 0), 0)::integer,
    coalesce(sum(case when cl.amount_cents > 0 then cl.amount_cents else 0 end), 0)::integer,
    abs(coalesce(sum(case when cl.amount_cents < 0 then cl.amount_cents else 0 end), 0))::integer
  into
    v_credit_balance,
    v_lifetime_credits_granted,
    v_lifetime_credits_reversed
  from public.popclub_credits_ledger cl
  where cl.user_id = p_user_id;

  select
    sed.sample_slots,
    sed.status
  into
    v_latest_sample_slots,
    v_latest_sample_status
  from public.popclub_sample_eligibility_decisions sed
  where sed.user_id = p_user_id
  order by coalesce(sed.reversal_event_at, sed.source_event_at) desc, sed.updated_at desc
  limit 1;

  update public.popclub_memberships
  set
    credit_balance_cents = v_credit_balance,
    lifetime_credits_granted_cents = v_lifetime_credits_granted,
    lifetime_credits_reversed_cents = v_lifetime_credits_reversed,
    latest_sample_slots = coalesce(v_latest_sample_slots, 0),
    latest_sample_status = v_latest_sample_status,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'benefits_refreshed_at', now(),
      'benefits_refresh_source', 'popclub_refresh_membership_benefits'
    ),
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

create or replace function public.popclub_project_order_credits(
  p_order_id uuid,
  p_source_idempotency_key text default null,
  p_source_event_at timestamptz default now(),
  p_source text default 'popclub_snapshot'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot public.popclub_order_benefit_snapshots%rowtype;
  v_credit_threshold_points integer;
  v_credit_amount_cents integer;
  v_credit_units_before integer := 0;
  v_credit_units_after integer := 0;
  v_credit_units_delta integer := 0;
  v_credit_amount_to_grant integer := 0;
  v_idempotency_key text;
begin
  if p_order_id is null then
    return;
  end if;

  select *
  into v_snapshot
  from public.popclub_order_benefit_snapshots snap
  where snap.order_id = p_order_id;

  if not found then
    return;
  end if;

  v_credit_threshold_points := coalesce(
    v_snapshot.credit_threshold_points,
    (
      select ptr.credit_threshold_points
      from public.popclub_tier_rules ptr
      where ptr.id = v_snapshot.tier_id
    )
  );
  v_credit_amount_cents := coalesce(
    v_snapshot.credit_amount_cents,
    (
      select ptr.credit_amount_cents
      from public.popclub_tier_rules ptr
      where ptr.id = v_snapshot.tier_id
    )
  );

  if coalesce(v_credit_threshold_points, 0) <= 0 or coalesce(v_credit_amount_cents, 0) <= 0 then
    update public.popclub_order_benefit_snapshots
    set
      credit_threshold_points = v_credit_threshold_points,
      credit_amount_cents = v_credit_amount_cents,
      updated_at = now()
    where order_id = p_order_id
      and (
        credit_threshold_points is distinct from v_credit_threshold_points
        or credit_amount_cents is distinct from v_credit_amount_cents
      );
    return;
  end if;

  v_idempotency_key := coalesce(
    nullif(btrim(p_source_idempotency_key), ''),
    format('popclub:credit_granted:%s', p_order_id)
  );

  if exists (
    select 1
    from public.popclub_credits_ledger cl
    where cl.source_idempotency_key = v_idempotency_key
  ) then
    perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
    return;
  end if;

  v_credit_units_before := floor(
    greatest(coalesce(v_snapshot.points_balance_before, 0), 0)::numeric
    / nullif(v_credit_threshold_points::numeric, 0)
  )::integer;
  v_credit_units_after := floor(
    greatest(coalesce(v_snapshot.points_balance_after, 0), 0)::numeric
    / nullif(v_credit_threshold_points::numeric, 0)
  )::integer;
  v_credit_units_delta := greatest(v_credit_units_after - v_credit_units_before, 0);
  v_credit_amount_to_grant := greatest(v_credit_units_delta * v_credit_amount_cents, 0);

  update public.popclub_order_benefit_snapshots
  set
    credit_threshold_points = v_credit_threshold_points,
    credit_amount_cents = v_credit_amount_cents,
    updated_at = now()
  where order_id = p_order_id
    and (
      credit_threshold_points is distinct from v_credit_threshold_points
      or credit_amount_cents is distinct from v_credit_amount_cents
    );

  if v_credit_amount_to_grant <= 0 then
    perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
    return;
  end if;

  insert into public.popclub_credits_ledger (
    user_id,
    order_id,
    tier_id,
    event_name,
    entry_kind,
    amount_cents,
    credit_threshold_points,
    source,
    source_idempotency_key,
    source_event_at,
    metadata
  )
  values (
    v_snapshot.user_id,
    v_snapshot.order_id,
    v_snapshot.tier_id,
    coalesce(nullif(v_snapshot.source_event_name, ''), 'order_paid'),
    'grant',
    v_credit_amount_to_grant,
    v_credit_threshold_points,
    coalesce(nullif(p_source, ''), 'popclub_snapshot'),
    v_idempotency_key,
    coalesce(p_source_event_at, v_snapshot.source_event_at, now()),
    jsonb_build_object(
      'credit_units_before', v_credit_units_before,
      'credit_units_after', v_credit_units_after,
      'credit_units_delta', v_credit_units_delta,
      'credit_amount_cents', v_credit_amount_cents,
      'source', coalesce(nullif(p_source, ''), 'popclub_snapshot')
    )
  )
  on conflict (source_idempotency_key) do nothing;

  update public.popclub_order_benefit_snapshots
  set
    credits_granted_cents = greatest(coalesce(credits_granted_cents, 0), v_credit_amount_to_grant),
    credit_threshold_points = v_credit_threshold_points,
    credit_amount_cents = v_credit_amount_cents,
    metadata = metadata || jsonb_build_object(
      'credit_grant_source', coalesce(nullif(p_source, ''), 'popclub_snapshot'),
      'credit_grant_idempotency_key', v_idempotency_key
    ),
    updated_at = now()
  where order_id = p_order_id;

  perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
end;
$$;

create or replace function public.popclub_reverse_order_credits(
  p_order_id uuid,
  p_event_name text,
  p_source_idempotency_key text default null,
  p_source_event_at timestamptz default now(),
  p_source text default 'popclub_snapshot'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot public.popclub_order_benefit_snapshots%rowtype;
  v_credit_threshold_points integer;
  v_credit_amount_cents integer;
  v_credit_units_before integer := 0;
  v_credit_units_after_effective integer := 0;
  v_effective_credits_cents integer := 0;
  v_amount_to_reverse integer := 0;
  v_idempotency_key text;
begin
  if p_order_id is null then
    return;
  end if;

  select *
  into v_snapshot
  from public.popclub_order_benefit_snapshots snap
  where snap.order_id = p_order_id;

  if not found then
    return;
  end if;

  v_credit_threshold_points := coalesce(
    v_snapshot.credit_threshold_points,
    (
      select ptr.credit_threshold_points
      from public.popclub_tier_rules ptr
      where ptr.id = v_snapshot.tier_id
    )
  );
  v_credit_amount_cents := coalesce(
    v_snapshot.credit_amount_cents,
    (
      select ptr.credit_amount_cents
      from public.popclub_tier_rules ptr
      where ptr.id = v_snapshot.tier_id
    )
  );

  if coalesce(v_credit_threshold_points, 0) <= 0 or coalesce(v_credit_amount_cents, 0) <= 0 then
    perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
    return;
  end if;

  if coalesce(v_snapshot.credits_granted_cents, 0) <= 0 then
    perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
    return;
  end if;

  v_idempotency_key := coalesce(
    nullif(btrim(p_source_idempotency_key), ''),
    format(
      'popclub:credit:%s:%s:%s:%s',
      coalesce(nullif(p_event_name, ''), 'refund_settled'),
      p_order_id,
      greatest(coalesce(v_snapshot.reversal_amount_cents, 0), 0),
      abs(coalesce(v_snapshot.reversal_points_delta, 0))
    )
  );

  if exists (
    select 1
    from public.popclub_credits_ledger cl
    where cl.source_idempotency_key = v_idempotency_key
  ) then
    perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
    return;
  end if;

  v_credit_units_before := floor(
    greatest(coalesce(v_snapshot.points_balance_before, 0), 0)::numeric
    / nullif(v_credit_threshold_points::numeric, 0)
  )::integer;
  v_credit_units_after_effective := floor(
    greatest(
      coalesce(v_snapshot.points_balance_after, 0) + coalesce(v_snapshot.reversal_points_delta, 0),
      0
    )::numeric
    / nullif(v_credit_threshold_points::numeric, 0)
  )::integer;
  v_effective_credits_cents := greatest(
    (v_credit_units_after_effective - v_credit_units_before) * v_credit_amount_cents,
    0
  );
  v_amount_to_reverse := greatest(
    coalesce(v_snapshot.credits_granted_cents, 0)
    - v_effective_credits_cents
    - coalesce(v_snapshot.credits_reversed_cents, 0),
    0
  );

  if v_amount_to_reverse <= 0 then
    perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
    return;
  end if;

  insert into public.popclub_credits_ledger (
    user_id,
    order_id,
    tier_id,
    event_name,
    entry_kind,
    amount_cents,
    credit_threshold_points,
    source,
    source_idempotency_key,
    source_event_at,
    metadata
  )
  values (
    v_snapshot.user_id,
    v_snapshot.order_id,
    v_snapshot.tier_id,
    coalesce(nullif(p_event_name, ''), 'refund_settled'),
    'reversal',
    -v_amount_to_reverse,
    v_credit_threshold_points,
    coalesce(nullif(p_source, ''), 'popclub_snapshot'),
    v_idempotency_key,
    coalesce(p_source_event_at, v_snapshot.reversal_event_at, now()),
    jsonb_build_object(
      'effective_credits_cents', v_effective_credits_cents,
      'credits_granted_cents', coalesce(v_snapshot.credits_granted_cents, 0),
      'credits_reversed_before', coalesce(v_snapshot.credits_reversed_cents, 0),
      'source', coalesce(nullif(p_source, ''), 'popclub_snapshot')
    )
  )
  on conflict (source_idempotency_key) do nothing;

  update public.popclub_order_benefit_snapshots
  set
    credits_reversed_cents = coalesce(credits_reversed_cents, 0) + v_amount_to_reverse,
    metadata = metadata || jsonb_build_object(
      'credit_reversal_source', coalesce(nullif(p_source, ''), 'popclub_snapshot'),
      'credit_reversal_idempotency_key', v_idempotency_key
    ),
    updated_at = now()
  where order_id = p_order_id;

  perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
end;
$$;

create or replace function public.popclub_apply_sample_eligibility(
  p_order_id uuid,
  p_source_event_at timestamptz default now(),
  p_source text default 'popclub_snapshot'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot public.popclub_order_benefit_snapshots%rowtype;
  v_status text := 'not_eligible';
  v_reason text := 'tier_without_samples';
begin
  if p_order_id is null then
    return;
  end if;

  select *
  into v_snapshot
  from public.popclub_order_benefit_snapshots snap
  where snap.order_id = p_order_id;

  if not found then
    return;
  end if;

  if coalesce(v_snapshot.sample_slots, 0) > 0 then
    v_status := 'eligible';
    v_reason := 'tier_with_samples';
  end if;

  insert into public.popclub_sample_eligibility_decisions (
    order_id,
    user_id,
    tier_id,
    status,
    sample_slots,
    decision_reason,
    source_event_name,
    source_event_at,
    metadata
  )
  values (
    v_snapshot.order_id,
    v_snapshot.user_id,
    v_snapshot.tier_id,
    v_status,
    v_snapshot.sample_slots,
    v_reason,
    coalesce(nullif(v_snapshot.source_event_name, ''), 'order_paid'),
    coalesce(p_source_event_at, v_snapshot.source_event_at, now()),
    jsonb_build_object(
      'source', coalesce(nullif(p_source, ''), 'popclub_snapshot')
    )
  )
  on conflict (order_id) do update
  set
    user_id = excluded.user_id,
    tier_id = excluded.tier_id,
    status = excluded.status,
    sample_slots = excluded.sample_slots,
    decision_reason = excluded.decision_reason,
    source_event_name = excluded.source_event_name,
    source_event_at = excluded.source_event_at,
    metadata = public.popclub_sample_eligibility_decisions.metadata || excluded.metadata,
    updated_at = now();

  update public.popclub_order_benefit_snapshots
  set
    sample_decision_status = v_status,
    metadata = metadata || jsonb_build_object(
      'sample_decision_source', coalesce(nullif(p_source, ''), 'popclub_snapshot')
    ),
    updated_at = now()
  where order_id = p_order_id;

  perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
end;
$$;

create or replace function public.popclub_reverse_sample_eligibility(
  p_order_id uuid,
  p_event_name text,
  p_source_event_at timestamptz default now(),
  p_source text default 'popclub_snapshot'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot public.popclub_order_benefit_snapshots%rowtype;
  v_decision public.popclub_sample_eligibility_decisions%rowtype;
  v_remaining_eligible_amount integer := 0;
begin
  if p_order_id is null then
    return;
  end if;

  select *
  into v_snapshot
  from public.popclub_order_benefit_snapshots snap
  where snap.order_id = p_order_id;

  if not found then
    return;
  end if;

  select *
  into v_decision
  from public.popclub_sample_eligibility_decisions sed
  where sed.order_id = p_order_id;

  if not found then
    perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
    return;
  end if;

  v_remaining_eligible_amount := greatest(
    coalesce(v_snapshot.eligible_amount_cents, 0) - coalesce(v_snapshot.reversal_amount_cents, 0),
    0
  );

  if v_remaining_eligible_amount > 0 then
    perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
    return;
  end if;

  if coalesce(v_decision.sample_slots, 0) <= 0 and v_decision.status = 'not_eligible' then
    perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
    return;
  end if;

  update public.popclub_sample_eligibility_decisions
  set
    status = 'reversed',
    reversal_event_name = coalesce(nullif(p_event_name, ''), 'refund_settled'),
    reversal_event_at = coalesce(p_source_event_at, v_snapshot.reversal_event_at, now()),
    decision_reason = 'reversed_after_financial_adjustment',
    metadata = metadata || jsonb_build_object(
      'reversal_source', coalesce(nullif(p_source, ''), 'popclub_snapshot')
    ),
    updated_at = now()
  where order_id = p_order_id
    and status <> 'reversed';

  update public.popclub_order_benefit_snapshots
  set
    sample_decision_status = case
      when coalesce(sample_slots, 0) > 0 then 'reversed'
      else sample_decision_status
    end,
    metadata = metadata || jsonb_build_object(
      'sample_reversal_source', coalesce(nullif(p_source, ''), 'popclub_snapshot')
    ),
    updated_at = now()
  where order_id = p_order_id;

  perform public.popclub_refresh_membership_benefits(v_snapshot.user_id);
end;
$$;

create or replace function public.popclub_project_order_snapshot_to_benefits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    perform public.popclub_project_order_credits(
      new.order_id,
      format('popclub:credit_granted:%s', new.order_id),
      coalesce(new.source_event_at, now()),
      'popclub_snapshot_trigger'
    );
    perform public.popclub_apply_sample_eligibility(
      new.order_id,
      coalesce(new.source_event_at, now()),
      'popclub_snapshot_trigger'
    );
  elsif tg_op = 'UPDATE' then
    if
      old.tier_id is distinct from new.tier_id
      or old.points_balance_before is distinct from new.points_balance_before
      or old.points_balance_after is distinct from new.points_balance_after
      or old.points_earned is distinct from new.points_earned
      or old.sample_slots is distinct from new.sample_slots
    then
      perform public.popclub_project_order_credits(
        new.order_id,
        format('popclub:credit_granted:%s', new.order_id),
        coalesce(new.source_event_at, now()),
        'popclub_snapshot_trigger'
      );
      perform public.popclub_apply_sample_eligibility(
        new.order_id,
        coalesce(new.source_event_at, now()),
        'popclub_snapshot_trigger'
      );
    end if;

    if
      coalesce(old.reversal_amount_cents, 0) is distinct from coalesce(new.reversal_amount_cents, 0)
      or coalesce(old.reversal_points_delta, 0) is distinct from coalesce(new.reversal_points_delta, 0)
      or coalesce(old.reversal_event_name, '') is distinct from coalesce(new.reversal_event_name, '')
    then
      perform public.popclub_reverse_order_credits(
        new.order_id,
        coalesce(nullif(new.reversal_event_name, ''), 'refund_settled'),
        format(
          'popclub:credit:%s:%s:%s:%s',
          coalesce(nullif(new.reversal_event_name, ''), 'refund_settled'),
          new.order_id,
          greatest(coalesce(new.reversal_amount_cents, 0), 0),
          abs(coalesce(new.reversal_points_delta, 0))
        ),
        coalesce(new.reversal_event_at, now()),
        'popclub_snapshot_trigger'
      );
      perform public.popclub_reverse_sample_eligibility(
        new.order_id,
        coalesce(nullif(new.reversal_event_name, ''), 'refund_settled'),
        coalesce(new.reversal_event_at, now()),
        'popclub_snapshot_trigger'
      );
    end if;
  end if;

  return new;
exception
  when others then
    raise warning
      'PopClub benefits projection failed for order snapshot % (%): %',
      new.order_id,
      tg_op,
      sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_popclub_order_benefit_projection on public.popclub_order_benefit_snapshots;
create trigger trg_popclub_order_benefit_projection
after insert or update on public.popclub_order_benefit_snapshots
for each row execute function public.popclub_project_order_snapshot_to_benefits();

create or replace function public.popclub_backfill_credits_and_samples(
  p_user_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot record;
  v_processed integer := 0;
begin
  for v_snapshot in
    select
      snap.order_id,
      snap.user_id,
      snap.source_event_at,
      snap.reversal_event_name,
      snap.reversal_event_at,
      snap.reversal_amount_cents,
      snap.reversal_points_delta
    from public.popclub_order_benefit_snapshots snap
    where p_user_id is null or snap.user_id = p_user_id
    order by snap.user_id, snap.source_event_at asc, snap.order_id asc
  loop
    perform public.popclub_project_order_credits(
      v_snapshot.order_id,
      format('popclub:credit_granted:%s', v_snapshot.order_id),
      v_snapshot.source_event_at,
      'backfill'
    );
    perform public.popclub_apply_sample_eligibility(
      v_snapshot.order_id,
      v_snapshot.source_event_at,
      'backfill'
    );

    if
      coalesce(v_snapshot.reversal_amount_cents, 0) > 0
      or coalesce(v_snapshot.reversal_points_delta, 0) < 0
      or v_snapshot.reversal_event_name is not null
    then
      perform public.popclub_reverse_order_credits(
        v_snapshot.order_id,
        coalesce(v_snapshot.reversal_event_name, 'refund_settled'),
        format(
          'popclub:credit:%s:%s:%s:%s',
          coalesce(v_snapshot.reversal_event_name, 'refund_settled'),
          v_snapshot.order_id,
          greatest(coalesce(v_snapshot.reversal_amount_cents, 0), 0),
          abs(coalesce(v_snapshot.reversal_points_delta, 0))
        ),
        coalesce(v_snapshot.reversal_event_at, v_snapshot.source_event_at, now()),
        'backfill'
      );
      perform public.popclub_reverse_sample_eligibility(
        v_snapshot.order_id,
        coalesce(v_snapshot.reversal_event_name, 'refund_settled'),
        coalesce(v_snapshot.reversal_event_at, v_snapshot.source_event_at, now()),
        'backfill'
      );
    end if;

    v_processed := v_processed + 1;
  end loop;

  if p_user_id is not null then
    perform public.popclub_refresh_membership_benefits(p_user_id);
  else
    perform public.popclub_refresh_membership_benefits(m.user_id)
    from public.popclub_memberships m;
  end if;

  return v_processed;
end;
$$;

revoke all on function public.popclub_credits_balance(uuid) from public;
grant execute on function public.popclub_credits_balance(uuid) to authenticated, service_role;

revoke all on function public.popclub_refresh_membership_benefits(uuid) from public;
grant execute on function public.popclub_refresh_membership_benefits(uuid) to service_role;

revoke all on function public.popclub_project_order_credits(uuid, text, timestamptz, text) from public;
grant execute on function public.popclub_project_order_credits(uuid, text, timestamptz, text) to service_role;

revoke all on function public.popclub_reverse_order_credits(uuid, text, text, timestamptz, text) from public;
grant execute on function public.popclub_reverse_order_credits(uuid, text, text, timestamptz, text) to service_role;

revoke all on function public.popclub_apply_sample_eligibility(uuid, timestamptz, text) from public;
grant execute on function public.popclub_apply_sample_eligibility(uuid, timestamptz, text) to service_role;

revoke all on function public.popclub_reverse_sample_eligibility(uuid, text, timestamptz, text) from public;
grant execute on function public.popclub_reverse_sample_eligibility(uuid, text, timestamptz, text) to service_role;

revoke all on function public.popclub_project_order_snapshot_to_benefits() from public;
grant execute on function public.popclub_project_order_snapshot_to_benefits() to service_role;

revoke all on function public.popclub_backfill_credits_and_samples(uuid) from public;
grant execute on function public.popclub_backfill_credits_and_samples(uuid) to service_role;

do $$
begin
  if to_regclass('public.popclub_credits_ledger') is not null then
    alter table public.popclub_credits_ledger enable row level security;
    revoke all on table public.popclub_credits_ledger from anon, authenticated;
    grant select on table public.popclub_credits_ledger to authenticated;

    drop policy if exists popclub_credits_ledger_select_own on public.popclub_credits_ledger;
    create policy popclub_credits_ledger_select_own
      on public.popclub_credits_ledger
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin(auth.uid()));

    drop policy if exists popclub_credits_ledger_service_all on public.popclub_credits_ledger;
    create policy popclub_credits_ledger_service_all
      on public.popclub_credits_ledger
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.popclub_sample_eligibility_decisions') is not null then
    alter table public.popclub_sample_eligibility_decisions enable row level security;
    revoke all on table public.popclub_sample_eligibility_decisions from anon, authenticated;
    grant select on table public.popclub_sample_eligibility_decisions to authenticated;

    drop policy if exists popclub_sample_eligibility_decisions_select_own on public.popclub_sample_eligibility_decisions;
    create policy popclub_sample_eligibility_decisions_select_own
      on public.popclub_sample_eligibility_decisions
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin(auth.uid()));

    drop policy if exists popclub_sample_eligibility_decisions_service_all on public.popclub_sample_eligibility_decisions;
    create policy popclub_sample_eligibility_decisions_service_all
      on public.popclub_sample_eligibility_decisions
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end;
$$;

do $$
begin
  if
    not exists (select 1 from public.popclub_credits_ledger limit 1)
    or not exists (select 1 from public.popclub_sample_eligibility_decisions limit 1)
  then
    perform public.popclub_backfill_credits_and_samples();
  end if;
end;
$$;
