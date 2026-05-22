-- PopClub tier engine + immutable points ledger foundation.
-- Builds on top of the existing orders/payment/marketplace_events pipeline.

create extension if not exists "pgcrypto";

alter table if exists public.orders
  add column if not exists buyer_id uuid references public.profiles(id) on delete set null;

update public.orders
set buyer_id = customer_id
where buyer_id is null
  and customer_id is not null;

alter table if exists public.orders
  add column if not exists payment_state text not null default 'created';

update public.orders
set payment_state = case
  when lower(coalesce(payment_state, '')) in (
    'created',
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
    'succeeded',
    'failed',
    'canceled',
    'refunded',
    'chargeback'
  ) then lower(payment_state)
  when lower(coalesce(payment_status, '')) in ('paid', 'approved', 'captured', 'completed', 'succeeded') then 'succeeded'
  when lower(coalesce(payment_status, '')) = 'refunded' then 'refunded'
  when lower(coalesce(payment_status, '')) = 'chargeback' then 'chargeback'
  when lower(coalesce(payment_status, '')) = 'failed' then 'failed'
  when lower(coalesce(payment_status, '')) = 'pending' then 'requires_payment_method'
  when lower(coalesce(status, '')) in ('paid', 'processing', 'shipped', 'delivered', 'fulfilled', 'completed') then 'succeeded'
  when lower(coalesce(status, '')) = 'refunded' then 'refunded'
  else 'created'
end
where coalesce(nullif(trim(payment_state), ''), 'created') = 'created';

create table if not exists public.popclub_tier_rules (
  id text primary key
    check (id in ('essencial', 'premium', 'luxo')),
  rank integer not null unique
    check (rank >= 1),
  min_points integer not null
    check (min_points >= 0),
  points_multiplier_bps integer not null
    check (points_multiplier_bps > 0),
  early_access_hours integer not null default 0
    check (early_access_hours >= 0),
  sample_slots integer not null default 0
    check (sample_slots >= 0),
  concierge_priority_score integer not null default 0
    check (concierge_priority_score >= 0),
  reorder_priority_score integer not null default 0
    check (reorder_priority_score >= 0),
  credit_threshold_points integer null
    check (credit_threshold_points is null or credit_threshold_points > 0),
  credit_amount_cents integer null
    check (credit_amount_cents is null or credit_amount_cents >= 0),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_popclub_tier_rules_updated on public.popclub_tier_rules;
create trigger trg_popclub_tier_rules_updated
before update on public.popclub_tier_rules
for each row execute function public.set_updated_at();

insert into public.popclub_tier_rules (
  id,
  rank,
  min_points,
  points_multiplier_bps,
  early_access_hours,
  sample_slots,
  concierge_priority_score,
  reorder_priority_score,
  credit_threshold_points,
  credit_amount_cents,
  active,
  metadata
)
values
  (
    'essencial',
    1,
    0,
    10000,
    24,
    0,
    10,
    10,
    null,
    null,
    true,
    jsonb_build_object(
      'label', 'Essencial',
      'unlock_rule', 'Entrada no clube'
    )
  ),
  (
    'premium',
    2,
    1500,
    12500,
    48,
    2,
    50,
    50,
    2000,
    5000,
    true,
    jsonb_build_object(
      'label', 'Premium',
      'unlock_rule', 'A partir de 1.500 pontos'
    )
  ),
  (
    'luxo',
    3,
    4000,
    15000,
    72,
    4,
    90,
    90,
    4000,
    12000,
    true,
    jsonb_build_object(
      'label', 'Luxo',
      'unlock_rule', 'A partir de 4.000 pontos'
    )
  )
on conflict (id) do update
set
  rank = excluded.rank,
  min_points = excluded.min_points,
  points_multiplier_bps = excluded.points_multiplier_bps,
  early_access_hours = excluded.early_access_hours,
  sample_slots = excluded.sample_slots,
  concierge_priority_score = excluded.concierge_priority_score,
  reorder_priority_score = excluded.reorder_priority_score,
  credit_threshold_points = excluded.credit_threshold_points,
  credit_amount_cents = excluded.credit_amount_cents,
  active = excluded.active,
  metadata = excluded.metadata,
  updated_at = now();

create table if not exists public.popclub_memberships (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_tier text not null references public.popclub_tier_rules(id) on delete restrict,
  points_balance integer not null default 0,
  lifetime_points_earned integer not null default 0,
  lifetime_points_reversed integer not null default 0,
  last_qualified_order_id uuid null references public.orders(id) on delete set null,
  last_qualified_order_at timestamptz null,
  next_tier_id text null references public.popclub_tier_rules(id) on delete set null,
  points_to_next_tier integer null
    check (points_to_next_tier is null or points_to_next_tier >= 0),
  progress_bps integer not null default 10000
    check (progress_bps >= 0 and progress_bps <= 10000),
  benefits_window_started_at timestamptz null,
  benefits_window_expires_at timestamptz null,
  last_recomputed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_popclub_memberships_updated on public.popclub_memberships;
create trigger trg_popclub_memberships_updated
before update on public.popclub_memberships
for each row execute function public.set_updated_at();

create table if not exists public.popclub_points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid null references public.orders(id) on delete set null,
  tier_id text not null references public.popclub_tier_rules(id) on delete restrict,
  event_name text not null
    check (event_name in (
      'order_paid',
      'refund_settled',
      'chargeback_opened',
      'manual_adjustment',
      'backfill_adjustment'
    )),
  entry_kind text not null
    check (entry_kind in ('earn', 'reversal', 'adjustment')),
  points_delta integer not null
    check (points_delta <> 0),
  eligible_amount_cents integer not null default 0
    check (eligible_amount_cents >= 0),
  points_multiplier_bps integer not null default 10000
    check (points_multiplier_bps > 0),
  source text not null default 'system',
  source_idempotency_key text not null,
  source_event_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_popclub_points_ledger_source_idempotency
  on public.popclub_points_ledger (source_idempotency_key);

create unique index if not exists uq_popclub_points_ledger_order_paid
  on public.popclub_points_ledger (order_id, event_name)
  where order_id is not null
    and event_name = 'order_paid'
    and entry_kind = 'earn';

create index if not exists idx_popclub_points_ledger_user_event
  on public.popclub_points_ledger (user_id, source_event_at desc, created_at desc);

create index if not exists idx_popclub_points_ledger_order_event
  on public.popclub_points_ledger (order_id, source_event_at desc, created_at desc);

create index if not exists idx_popclub_points_ledger_entry_kind
  on public.popclub_points_ledger (entry_kind, source_event_at desc);

create table if not exists public.popclub_order_benefit_snapshots (
  order_id uuid primary key references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier_id text not null references public.popclub_tier_rules(id) on delete restrict,
  points_balance_before integer not null default 0,
  points_earned integer not null default 0,
  points_balance_after integer not null default 0,
  eligible_amount_cents integer not null default 0
    check (eligible_amount_cents >= 0),
  points_multiplier_bps integer not null default 10000
    check (points_multiplier_bps > 0),
  early_access_hours integer not null default 0
    check (early_access_hours >= 0),
  sample_slots integer not null default 0
    check (sample_slots >= 0),
  concierge_priority_score integer not null default 0
    check (concierge_priority_score >= 0),
  reorder_priority_score integer not null default 0
    check (reorder_priority_score >= 0),
  source_event_name text not null default 'order_paid',
  source_event_at timestamptz not null default now(),
  reversal_event_name text null,
  reversal_event_at timestamptz null,
  reversal_amount_cents integer not null default 0
    check (reversal_amount_cents >= 0),
  reversal_points_delta integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_popclub_order_benefit_snapshots_updated on public.popclub_order_benefit_snapshots;
create trigger trg_popclub_order_benefit_snapshots_updated
before update on public.popclub_order_benefit_snapshots
for each row execute function public.set_updated_at();

create index if not exists idx_popclub_order_benefit_snapshots_user_event
  on public.popclub_order_benefit_snapshots (user_id, source_event_at desc);

create index if not exists idx_popclub_order_benefit_snapshots_tier
  on public.popclub_order_benefit_snapshots (tier_id, source_event_at desc);

create or replace function public.popclub_points_balance(
  p_user_id uuid
)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(sum(points_delta), 0)::integer
  from public.popclub_points_ledger
  where user_id = p_user_id;
$$;

create or replace function public.popclub_resolve_tier(
  p_points_balance integer
)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select ptr.id
      from public.popclub_tier_rules ptr
      where ptr.active
        and ptr.min_points <= greatest(coalesce(p_points_balance, 0), 0)
      order by ptr.rank desc
      limit 1
    ),
    'essencial'
  );
$$;

create or replace function public.popclub_calculate_points(
  p_eligible_amount_cents integer,
  p_multiplier_bps integer
)
returns integer
language sql
immutable
set search_path = public
as $$
  select greatest(
    floor(
      (
        greatest(coalesce(p_eligible_amount_cents, 0), 0)::numeric
        * greatest(coalesce(p_multiplier_bps, 10000), 0)::numeric
      ) / 1000000
    )::integer,
    0
  );
$$;

create or replace function public.popclub_refresh_membership(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points_balance integer := 0;
  v_lifetime_earned integer := 0;
  v_lifetime_reversed integer := 0;
  v_current_tier text := 'essencial';
  v_current_rank integer := 1;
  v_current_min_points integer := 0;
  v_next_tier_id text;
  v_next_min_points integer;
  v_points_to_next integer;
  v_progress_bps integer := 10000;
  v_started_at timestamptz;
  v_last_order_id uuid;
  v_last_order_at timestamptz;
begin
  if p_user_id is null then
    return;
  end if;

  select
    coalesce(sum(points_delta), 0)::integer,
    coalesce(sum(case when points_delta > 0 then points_delta else 0 end), 0)::integer,
    abs(coalesce(sum(case when points_delta < 0 then points_delta else 0 end), 0))::integer
  into
    v_points_balance,
    v_lifetime_earned,
    v_lifetime_reversed
  from public.popclub_points_ledger
  where user_id = p_user_id;

  v_current_tier := public.popclub_resolve_tier(v_points_balance);

  select ptr.rank, ptr.min_points
  into v_current_rank, v_current_min_points
  from public.popclub_tier_rules ptr
  where ptr.id = v_current_tier;

  select ptr.id, ptr.min_points
  into v_next_tier_id, v_next_min_points
  from public.popclub_tier_rules ptr
  where ptr.active
    and ptr.rank > coalesce(v_current_rank, 1)
  order by ptr.rank asc
  limit 1;

  if v_next_tier_id is null then
    v_points_to_next := null;
    v_progress_bps := 10000;
  else
    v_points_to_next := greatest(v_next_min_points - v_points_balance, 0);
    if coalesce(v_next_min_points, 0) <= coalesce(v_current_min_points, 0) then
      v_progress_bps := 10000;
    else
      v_progress_bps := least(
        10000,
        greatest(
          0,
          floor(
            (
              greatest(v_points_balance - v_current_min_points, 0)::numeric
              / nullif((v_next_min_points - v_current_min_points), 0)::numeric
            ) * 10000
          )::integer
        )
      );
    end if;
  end if;

  select pl.source_event_at
  into v_started_at
  from public.popclub_points_ledger pl
  where pl.user_id = p_user_id
  order by pl.source_event_at asc, pl.created_at asc
  limit 1;

  select pl.order_id, pl.source_event_at
  into v_last_order_id, v_last_order_at
  from public.popclub_points_ledger pl
  where pl.user_id = p_user_id
    and pl.entry_kind = 'earn'
  order by pl.source_event_at desc, pl.created_at desc
  limit 1;

  insert into public.popclub_memberships (
    user_id,
    current_tier,
    points_balance,
    lifetime_points_earned,
    lifetime_points_reversed,
    last_qualified_order_id,
    last_qualified_order_at,
    next_tier_id,
    points_to_next_tier,
    progress_bps,
    benefits_window_started_at,
    benefits_window_expires_at,
    last_recomputed_at,
    metadata
  )
  values (
    p_user_id,
    v_current_tier,
    v_points_balance,
    v_lifetime_earned,
    v_lifetime_reversed,
    v_last_order_id,
    v_last_order_at,
    v_next_tier_id,
    v_points_to_next,
    v_progress_bps,
    v_started_at,
    null,
    now(),
    jsonb_build_object(
      'source', 'popclub_refresh_membership',
      'tier_points_basis', 'net_points_balance'
    )
  )
  on conflict (user_id) do update
  set
    current_tier = excluded.current_tier,
    points_balance = excluded.points_balance,
    lifetime_points_earned = excluded.lifetime_points_earned,
    lifetime_points_reversed = excluded.lifetime_points_reversed,
    last_qualified_order_id = excluded.last_qualified_order_id,
    last_qualified_order_at = excluded.last_qualified_order_at,
    next_tier_id = excluded.next_tier_id,
    points_to_next_tier = excluded.points_to_next_tier,
    progress_bps = excluded.progress_bps,
    benefits_window_started_at = excluded.benefits_window_started_at,
    benefits_window_expires_at = excluded.benefits_window_expires_at,
    last_recomputed_at = excluded.last_recomputed_at,
    metadata = excluded.metadata,
    updated_at = now();
end;
$$;

create or replace function public.popclub_apply_order_paid(
  p_order_id uuid,
  p_source_idempotency_key text default null,
  p_source_event_at timestamptz default now(),
  p_event_name text default 'order_paid',
  p_source text default 'marketplace_events'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_points_before integer := 0;
  v_points_after integer := 0;
  v_tier public.popclub_tier_rules%rowtype;
  v_points_earned integer := 0;
  v_idempotency_key text;
begin
  if p_order_id is null then
    return;
  end if;

  select
    o.id as order_id,
    coalesce(o.buyer_id, o.customer_id) as user_id,
    greatest(
      coalesce(
        nullif(o.total_products_cents, 0),
        greatest(coalesce(o.total_order_cents, 0) - coalesce(o.total_shipping_cents, 0), 0),
        0
      ),
      0
    )::integer as eligible_amount_cents,
    coalesce(o.created_at, now()) as created_at
  into v_order
  from public.orders o
  where o.id = p_order_id;

  if not found or v_order.user_id is null or v_order.eligible_amount_cents <= 0 then
    return;
  end if;

  v_idempotency_key := coalesce(
    nullif(btrim(p_source_idempotency_key), ''),
    format('popclub:%s:%s', p_event_name, p_order_id)
  );

  if exists (
    select 1
    from public.popclub_points_ledger pl
    where pl.source_idempotency_key = v_idempotency_key
  ) then
    perform public.popclub_refresh_membership(v_order.user_id);
    return;
  end if;

  if exists (
    select 1
    from public.popclub_points_ledger pl
    where pl.order_id = v_order.order_id
      and pl.entry_kind = 'earn'
      and pl.event_name = 'order_paid'
  ) then
    perform public.popclub_refresh_membership(v_order.user_id);
    return;
  end if;

  v_points_before := public.popclub_points_balance(v_order.user_id);

  select *
  into v_tier
  from public.popclub_tier_rules ptr
  where ptr.id = public.popclub_resolve_tier(v_points_before);

  v_points_earned := public.popclub_calculate_points(
    v_order.eligible_amount_cents,
    v_tier.points_multiplier_bps
  );

  if v_points_earned <= 0 then
    return;
  end if;

  v_points_after := v_points_before + v_points_earned;

  insert into public.popclub_points_ledger (
    user_id,
    order_id,
    tier_id,
    event_name,
    entry_kind,
    points_delta,
    eligible_amount_cents,
    points_multiplier_bps,
    source,
    source_idempotency_key,
    source_event_at,
    metadata
  )
  values (
    v_order.user_id,
    v_order.order_id,
    v_tier.id,
    coalesce(nullif(p_event_name, ''), 'order_paid'),
    'earn',
    v_points_earned,
    v_order.eligible_amount_cents,
    v_tier.points_multiplier_bps,
    coalesce(nullif(p_source, ''), 'marketplace_events'),
    v_idempotency_key,
    coalesce(p_source_event_at, v_order.created_at, now()),
    jsonb_build_object(
      'points_balance_before', v_points_before,
      'points_balance_after', v_points_after,
      'source', coalesce(nullif(p_source, ''), 'marketplace_events')
    )
  )
  on conflict do nothing;

  insert into public.popclub_order_benefit_snapshots (
    order_id,
    user_id,
    tier_id,
    points_balance_before,
    points_earned,
    points_balance_after,
    eligible_amount_cents,
    points_multiplier_bps,
    early_access_hours,
    sample_slots,
    concierge_priority_score,
    reorder_priority_score,
    source_event_name,
    source_event_at,
    metadata
  )
  values (
    v_order.order_id,
    v_order.user_id,
    v_tier.id,
    v_points_before,
    v_points_earned,
    v_points_after,
    v_order.eligible_amount_cents,
    v_tier.points_multiplier_bps,
    v_tier.early_access_hours,
    v_tier.sample_slots,
    v_tier.concierge_priority_score,
    v_tier.reorder_priority_score,
    coalesce(nullif(p_event_name, ''), 'order_paid'),
    coalesce(p_source_event_at, v_order.created_at, now()),
    jsonb_build_object(
      'source', coalesce(nullif(p_source, ''), 'marketplace_events'),
      'idempotency_key', v_idempotency_key
    )
  )
  on conflict (order_id) do update
  set
    user_id = excluded.user_id,
    tier_id = excluded.tier_id,
    points_balance_before = excluded.points_balance_before,
    points_earned = excluded.points_earned,
    points_balance_after = excluded.points_balance_after,
    eligible_amount_cents = excluded.eligible_amount_cents,
    points_multiplier_bps = excluded.points_multiplier_bps,
    early_access_hours = excluded.early_access_hours,
    sample_slots = excluded.sample_slots,
    concierge_priority_score = excluded.concierge_priority_score,
    reorder_priority_score = excluded.reorder_priority_score,
    source_event_name = excluded.source_event_name,
    source_event_at = excluded.source_event_at,
    metadata = public.popclub_order_benefit_snapshots.metadata || excluded.metadata,
    updated_at = now();

  perform public.popclub_refresh_membership(v_order.user_id);
end;
$$;

create or replace function public.popclub_reverse_order_points(
  p_order_id uuid,
  p_event_name text,
  p_reversal_amount_cents integer default null,
  p_source_idempotency_key text default null,
  p_source_event_at timestamptz default now(),
  p_source text default 'marketplace_events'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot public.popclub_order_benefit_snapshots%rowtype;
  v_idempotency_key text;
  v_remaining_amount_cents integer := 0;
  v_requested_amount_cents integer := 0;
  v_points_remaining integer := 0;
  v_points_to_reverse integer := 0;
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

  v_idempotency_key := coalesce(
    nullif(btrim(p_source_idempotency_key), ''),
    format('popclub:%s:%s', coalesce(nullif(p_event_name, ''), 'refund_settled'), p_order_id)
  );

  if exists (
    select 1
    from public.popclub_points_ledger pl
    where pl.source_idempotency_key = v_idempotency_key
  ) then
    perform public.popclub_refresh_membership(v_snapshot.user_id);
    return;
  end if;

  v_remaining_amount_cents := greatest(
    v_snapshot.eligible_amount_cents - coalesce(v_snapshot.reversal_amount_cents, 0),
    0
  );
  v_points_remaining := greatest(
    v_snapshot.points_earned + coalesce(v_snapshot.reversal_points_delta, 0),
    0
  );

  if v_remaining_amount_cents <= 0 or v_points_remaining <= 0 then
    return;
  end if;

  v_requested_amount_cents := least(
    greatest(coalesce(p_reversal_amount_cents, v_remaining_amount_cents), 0),
    v_remaining_amount_cents
  );

  if v_requested_amount_cents >= v_remaining_amount_cents then
    v_points_to_reverse := v_points_remaining;
  else
    v_points_to_reverse := greatest(
      1,
      least(
        v_points_remaining,
        floor(
          (
            v_points_remaining::numeric
            * v_requested_amount_cents::numeric
          ) / nullif(v_remaining_amount_cents::numeric, 0)
        )::integer
      )
    );
  end if;

  if v_points_to_reverse <= 0 then
    return;
  end if;

  insert into public.popclub_points_ledger (
    user_id,
    order_id,
    tier_id,
    event_name,
    entry_kind,
    points_delta,
    eligible_amount_cents,
    points_multiplier_bps,
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
    -v_points_to_reverse,
    v_requested_amount_cents,
    v_snapshot.points_multiplier_bps,
    coalesce(nullif(p_source, ''), 'marketplace_events'),
    v_idempotency_key,
    coalesce(p_source_event_at, now()),
    jsonb_build_object(
      'reversal_points_delta', -v_points_to_reverse,
      'remaining_points_before_reversal', v_points_remaining,
      'source', coalesce(nullif(p_source, ''), 'marketplace_events')
    )
  )
  on conflict (source_idempotency_key) do nothing;

  update public.popclub_order_benefit_snapshots
  set
    reversal_event_name = coalesce(nullif(p_event_name, ''), 'refund_settled'),
    reversal_event_at = coalesce(p_source_event_at, now()),
    reversal_amount_cents = coalesce(reversal_amount_cents, 0) + v_requested_amount_cents,
    reversal_points_delta = coalesce(reversal_points_delta, 0) - v_points_to_reverse,
    metadata = metadata || jsonb_build_object(
      'last_reversal_source', coalesce(nullif(p_source, ''), 'marketplace_events'),
      'last_reversal_idempotency_key', v_idempotency_key
    ),
    updated_at = now()
  where order_id = p_order_id;

  perform public.popclub_refresh_membership(v_snapshot.user_id);
end;
$$;

create or replace function public.popclub_project_marketplace_event_to_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_id is null then
    return new;
  end if;

  if new.event_name = 'order_paid' then
    perform public.popclub_apply_order_paid(
      new.order_id,
      coalesce(nullif(new.idempotency_key, ''), format('marketplace_event:%s:%s', new.id, new.event_name)),
      coalesce(new.occurred_at, now()),
      new.event_name,
      coalesce(nullif(new.source, ''), 'marketplace_events')
    );
  elsif new.event_name in ('refund_settled', 'chargeback_opened') then
    perform public.popclub_reverse_order_points(
      new.order_id,
      new.event_name,
      new.amount_cents,
      coalesce(nullif(new.idempotency_key, ''), format('marketplace_event:%s:%s', new.id, new.event_name)),
      coalesce(new.occurred_at, now()),
      coalesce(nullif(new.source, ''), 'marketplace_events')
    );
  end if;

  return new;
exception
  when others then
    raise warning
      'PopClub projection failed for marketplace_event % (%): %',
      new.id,
      new.event_name,
      sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_marketplace_events_popclub_projection on public.marketplace_events;
create trigger trg_marketplace_events_popclub_projection
after insert on public.marketplace_events
for each row execute function public.popclub_project_marketplace_event_to_points();

create or replace function public.popclub_backfill_points_ledger(
  p_user_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_negative_event record;
  v_effective_payment_state text;
  v_processed integer := 0;
begin
  for v_order in
    select
      o.id as order_id,
      coalesce(o.buyer_id, o.customer_id) as user_id,
      coalesce(o.created_at, now()) as created_at,
      lower(
        coalesce(
          nullif(o.payment_state, ''),
          case
            when lower(coalesce(o.payment_status, '')) in ('paid', 'approved', 'captured', 'completed', 'succeeded') then 'succeeded'
            when lower(coalesce(o.payment_status, '')) = 'refunded' then 'refunded'
            when lower(coalesce(o.payment_status, '')) = 'chargeback' then 'chargeback'
            when lower(coalesce(o.payment_status, '')) = 'failed' then 'failed'
            else null
          end,
          case
            when lower(coalesce(o.status, '')) in ('paid', 'processing', 'shipped', 'delivered', 'fulfilled', 'completed') then 'succeeded'
            when lower(coalesce(o.status, '')) = 'refunded' then 'refunded'
            else lower(coalesce(o.status, ''))
          end,
          'created'
        )
      ) as effective_payment_state,
      greatest(
        coalesce(
          nullif(o.total_products_cents, 0),
          greatest(coalesce(o.total_order_cents, 0) - coalesce(o.total_shipping_cents, 0), 0),
          0
        ),
        0
      )::integer as eligible_amount_cents
    from public.orders o
    where coalesce(o.buyer_id, o.customer_id) is not null
      and (
        p_user_id is null
        or coalesce(o.buyer_id, o.customer_id) = p_user_id
      )
      and greatest(
        coalesce(
          nullif(o.total_products_cents, 0),
          greatest(coalesce(o.total_order_cents, 0) - coalesce(o.total_shipping_cents, 0), 0),
          0
        ),
        0
      ) > 0
      and lower(
        coalesce(
          nullif(o.payment_state, ''),
          case
            when lower(coalesce(o.payment_status, '')) in ('paid', 'approved', 'captured', 'completed', 'succeeded') then 'succeeded'
            when lower(coalesce(o.payment_status, '')) = 'refunded' then 'refunded'
            when lower(coalesce(o.payment_status, '')) = 'chargeback' then 'chargeback'
            when lower(coalesce(o.payment_status, '')) = 'failed' then 'failed'
            else null
          end,
          case
            when lower(coalesce(o.status, '')) in ('paid', 'processing', 'shipped', 'delivered', 'fulfilled', 'completed') then 'succeeded'
            when lower(coalesce(o.status, '')) = 'refunded' then 'refunded'
            else lower(coalesce(o.status, ''))
          end,
          'created'
        )
      ) in ('succeeded', 'refunded', 'chargeback')
    order by coalesce(o.buyer_id, o.customer_id), o.created_at asc, o.id asc
  loop
    v_effective_payment_state := v_order.effective_payment_state;

    perform public.popclub_apply_order_paid(
      v_order.order_id,
      format('popclub:order_paid:%s', v_order.order_id),
      v_order.created_at,
      'order_paid',
      'backfill'
    );

    if v_effective_payment_state in ('refunded', 'chargeback') then
      select
        me.event_name,
        me.occurred_at,
        me.amount_cents
      into v_negative_event
      from public.marketplace_events me
      where me.order_id = v_order.order_id
        and me.event_name in ('refund_settled', 'chargeback_opened')
      order by me.occurred_at desc, me.created_at desc
      limit 1;

      perform public.popclub_reverse_order_points(
        v_order.order_id,
        coalesce(
          v_negative_event.event_name,
          case
            when v_effective_payment_state = 'chargeback' then 'chargeback_opened'
            else 'refund_settled'
          end
        ),
        coalesce(v_negative_event.amount_cents, v_order.eligible_amount_cents),
        format(
          'popclub:%s:%s',
          coalesce(
            v_negative_event.event_name,
            case
              when v_effective_payment_state = 'chargeback' then 'chargeback_opened'
              else 'refund_settled'
            end
          ),
          v_order.order_id
        ),
        coalesce(v_negative_event.occurred_at, now()),
        'backfill'
      );
    end if;

    v_processed := v_processed + 1;
  end loop;

  return v_processed;
end;
$$;

revoke all on function public.popclub_points_balance(uuid) from public;
grant execute on function public.popclub_points_balance(uuid) to authenticated, service_role;

revoke all on function public.popclub_resolve_tier(integer) from public;
grant execute on function public.popclub_resolve_tier(integer) to authenticated, service_role;

revoke all on function public.popclub_calculate_points(integer, integer) from public;
grant execute on function public.popclub_calculate_points(integer, integer) to service_role;

revoke all on function public.popclub_refresh_membership(uuid) from public;
grant execute on function public.popclub_refresh_membership(uuid) to service_role;

revoke all on function public.popclub_apply_order_paid(uuid, text, timestamptz, text, text) from public;
grant execute on function public.popclub_apply_order_paid(uuid, text, timestamptz, text, text) to service_role;

revoke all on function public.popclub_reverse_order_points(uuid, text, integer, text, timestamptz, text) from public;
grant execute on function public.popclub_reverse_order_points(uuid, text, integer, text, timestamptz, text) to service_role;

revoke all on function public.popclub_project_marketplace_event_to_points() from public;
grant execute on function public.popclub_project_marketplace_event_to_points() to service_role;

revoke all on function public.popclub_backfill_points_ledger(uuid) from public;
grant execute on function public.popclub_backfill_points_ledger(uuid) to service_role;

do $$
begin
  if to_regclass('public.popclub_tier_rules') is not null then
    alter table public.popclub_tier_rules enable row level security;
    revoke all on table public.popclub_tier_rules from anon;
    grant select on table public.popclub_tier_rules to authenticated;

    drop policy if exists popclub_tier_rules_select_all on public.popclub_tier_rules;
    create policy popclub_tier_rules_select_all
      on public.popclub_tier_rules
      for select
      to authenticated
      using (true);

    drop policy if exists popclub_tier_rules_service_all on public.popclub_tier_rules;
    create policy popclub_tier_rules_service_all
      on public.popclub_tier_rules
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.popclub_memberships') is not null then
    alter table public.popclub_memberships enable row level security;
    revoke all on table public.popclub_memberships from anon, authenticated;
    grant select on table public.popclub_memberships to authenticated;

    drop policy if exists popclub_memberships_select_own on public.popclub_memberships;
    create policy popclub_memberships_select_own
      on public.popclub_memberships
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin(auth.uid()));

    drop policy if exists popclub_memberships_service_all on public.popclub_memberships;
    create policy popclub_memberships_service_all
      on public.popclub_memberships
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.popclub_points_ledger') is not null then
    alter table public.popclub_points_ledger enable row level security;
    revoke all on table public.popclub_points_ledger from anon, authenticated;
    grant select on table public.popclub_points_ledger to authenticated;

    drop policy if exists popclub_points_ledger_select_own on public.popclub_points_ledger;
    create policy popclub_points_ledger_select_own
      on public.popclub_points_ledger
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin(auth.uid()));

    drop policy if exists popclub_points_ledger_service_all on public.popclub_points_ledger;
    create policy popclub_points_ledger_service_all
      on public.popclub_points_ledger
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.popclub_order_benefit_snapshots') is not null then
    alter table public.popclub_order_benefit_snapshots enable row level security;
    revoke all on table public.popclub_order_benefit_snapshots from anon, authenticated;
    grant select on table public.popclub_order_benefit_snapshots to authenticated;

    drop policy if exists popclub_order_benefit_snapshots_select_own on public.popclub_order_benefit_snapshots;
    create policy popclub_order_benefit_snapshots_select_own
      on public.popclub_order_benefit_snapshots
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin(auth.uid()));

    drop policy if exists popclub_order_benefit_snapshots_service_all on public.popclub_order_benefit_snapshots;
    create policy popclub_order_benefit_snapshots_service_all
      on public.popclub_order_benefit_snapshots
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from public.popclub_points_ledger
    limit 1
  ) then
    perform public.popclub_backfill_points_ledger();
  end if;
end;
$$;
