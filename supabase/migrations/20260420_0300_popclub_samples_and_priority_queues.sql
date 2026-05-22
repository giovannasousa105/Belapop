-- PopClub sample reservation / fulfillment + operational priority queues.
-- Freezes sample reservation state on the order and projects tier-based priority into support, concierge and reorder flows.

create extension if not exists "pgcrypto";

alter table if exists public.popclub_order_benefit_snapshots
  add column if not exists sample_campaign_id uuid null,
  add column if not exists sample_inventory_id uuid null,
  add column if not exists sample_reserved_slots integer not null default 0
    check (sample_reserved_slots >= 0),
  add column if not exists sample_fulfilled_slots integer not null default 0
    check (sample_fulfilled_slots >= 0),
  add column if not exists sample_reversed_slots integer not null default 0
    check (sample_reversed_slots >= 0),
  add column if not exists sample_reservation_status text null
    check (
      sample_reservation_status is null
      or sample_reservation_status in (
        'not_reserved',
        'reserved',
        'partially_fulfilled',
        'fulfilled',
        'reversed',
        'waived',
        'unavailable'
      )
    );

alter table if exists public.support_tickets
  add column if not exists popclub_current_tier text null references public.popclub_tier_rules(id) on delete set null,
  add column if not exists popclub_priority_score integer not null default 0
    check (popclub_priority_score >= 0),
  add column if not exists queue_priority_score integer not null default 0
    check (queue_priority_score >= 0),
  add column if not exists priority_band text null
    check (priority_band is null or priority_band in ('standard', 'priority', 'vip')),
  add column if not exists first_response_target_hours integer null
    check (first_response_target_hours is null or first_response_target_hours > 0),
  add column if not exists resolution_target_hours integer null
    check (resolution_target_hours is null or resolution_target_hours > 0);

create index if not exists idx_support_tickets_queue_priority
  on public.support_tickets (queue_priority_score desc, created_at desc);

create index if not exists idx_support_tickets_popclub_tier
  on public.support_tickets (popclub_current_tier, created_at desc);

create table if not exists public.popclub_sample_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  active boolean not null default true,
  eligible_tiers text[] null,
  priority_rank integer not null default 100
    check (priority_rank > 0),
  max_slots_per_order integer not null default 4
    check (max_slots_per_order > 0),
  starts_at timestamptz null,
  ends_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint popclub_sample_campaigns_eligible_tiers_check
    check (
      eligible_tiers is null
      or eligible_tiers <@ array['essencial', 'premium', 'luxo']::text[]
    )
);

drop trigger if exists trg_popclub_sample_campaigns_updated on public.popclub_sample_campaigns;
create trigger trg_popclub_sample_campaigns_updated
before update on public.popclub_sample_campaigns
for each row execute function public.set_updated_at();

create index if not exists idx_popclub_sample_campaigns_active_window
  on public.popclub_sample_campaigns (active, priority_rank desc, starts_at, ends_at);

create table if not exists public.popclub_sample_inventory (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.popclub_sample_campaigns(id) on delete cascade,
  sku text not null,
  title text not null,
  active boolean not null default true,
  total_units integer not null
    check (total_units >= 0),
  reserved_units integer not null default 0
    check (reserved_units >= 0),
  fulfilled_units integer not null default 0
    check (fulfilled_units >= 0),
  released_units integer not null default 0
    check (released_units >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_popclub_sample_inventory_updated on public.popclub_sample_inventory;
create trigger trg_popclub_sample_inventory_updated
before update on public.popclub_sample_inventory
for each row execute function public.set_updated_at();

create index if not exists idx_popclub_sample_inventory_campaign_active
  on public.popclub_sample_inventory (campaign_id, active, updated_at desc);

create table if not exists public.popclub_sample_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier_id text not null references public.popclub_tier_rules(id) on delete restrict,
  campaign_id uuid null references public.popclub_sample_campaigns(id) on delete set null,
  inventory_id uuid null references public.popclub_sample_inventory(id) on delete set null,
  eligible_slots integer not null default 0
    check (eligible_slots >= 0),
  reserved_slots integer not null default 0
    check (reserved_slots >= 0),
  fulfilled_slots integer not null default 0
    check (fulfilled_slots >= 0),
  reversed_slots integer not null default 0
    check (reversed_slots >= 0),
  status text not null default 'unavailable'
    check (
      status in (
        'reserved',
        'partially_fulfilled',
        'fulfilled',
        'reversed',
        'waived',
        'unavailable'
      )
    ),
  decision_reason text not null default 'inventory_unavailable',
  source_event_name text not null default 'order_paid',
  source_event_at timestamptz not null default now(),
  fulfillment_event_name text null,
  fulfillment_event_at timestamptz null,
  reversal_event_name text null,
  reversal_event_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_popclub_sample_reservations_updated on public.popclub_sample_reservations;
create trigger trg_popclub_sample_reservations_updated
before update on public.popclub_sample_reservations
for each row execute function public.set_updated_at();

create index if not exists idx_popclub_sample_reservations_user_status
  on public.popclub_sample_reservations (user_id, status, source_event_at desc, updated_at desc);

create index if not exists idx_popclub_sample_reservations_campaign_status
  on public.popclub_sample_reservations (campaign_id, inventory_id, status, updated_at desc);

create table if not exists public.popclub_concierge_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid null references public.orders(id) on delete set null,
  source text not null default 'manual'
    check (source in ('manual', 'skin_scan', 'account', 'checkout')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'cancelled')),
  current_tier text not null references public.popclub_tier_rules(id) on delete restrict,
  priority_score integer not null default 0
    check (priority_score >= 0),
  priority_band text not null default 'standard'
    check (priority_band in ('standard', 'priority', 'vip')),
  summary text null,
  payload jsonb not null default '{}'::jsonb,
  source_idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_popclub_concierge_requests_source_idempotency
  on public.popclub_concierge_requests (source_idempotency_key);

create index if not exists idx_popclub_concierge_requests_status
  on public.popclub_concierge_requests (status, priority_score desc, created_at desc);

drop trigger if exists trg_popclub_concierge_requests_updated on public.popclub_concierge_requests;
create trigger trg_popclub_concierge_requests_updated
before update on public.popclub_concierge_requests
for each row execute function public.set_updated_at();

create table if not exists public.popclub_reorder_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  sub_order_id uuid null references public.sub_orders(id) on delete set null,
  seller_id uuid null references public.sellers(id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'composed', 'resolved', 'cancelled')),
  current_tier text not null references public.popclub_tier_rules(id) on delete restrict,
  priority_score integer not null default 0
    check (priority_score >= 0),
  priority_band text not null default 'standard'
    check (priority_band in ('standard', 'priority', 'vip')),
  available_items jsonb not null default '[]'::jsonb,
  unavailable_items jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  source_idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_popclub_reorder_requests_source_idempotency
  on public.popclub_reorder_requests (source_idempotency_key);

create index if not exists idx_popclub_reorder_requests_status
  on public.popclub_reorder_requests (status, priority_score desc, created_at desc);

create index if not exists idx_popclub_reorder_requests_order
  on public.popclub_reorder_requests (order_id, sub_order_id, created_at desc);

drop trigger if exists trg_popclub_reorder_requests_updated on public.popclub_reorder_requests;
create trigger trg_popclub_reorder_requests_updated
before update on public.popclub_reorder_requests
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'popclub_order_benefit_snapshots_sample_campaign_id_fkey'
  ) then
    alter table public.popclub_order_benefit_snapshots
      add constraint popclub_order_benefit_snapshots_sample_campaign_id_fkey
      foreign key (sample_campaign_id)
      references public.popclub_sample_campaigns(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'popclub_order_benefit_snapshots_sample_inventory_id_fkey'
  ) then
    alter table public.popclub_order_benefit_snapshots
      add constraint popclub_order_benefit_snapshots_sample_inventory_id_fkey
      foreign key (sample_inventory_id)
      references public.popclub_sample_inventory(id)
      on delete set null;
  end if;
end;
$$;

create or replace function public.popclub_priority_band_from_score(
  p_score integer
)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when greatest(coalesce(p_score, 0), 0) >= 90 then 'vip'
    when greatest(coalesce(p_score, 0), 0) >= 50 then 'priority'
    else 'standard'
  end;
$$;

create or replace function public.popclub_support_priority_factor_bps(
  p_score integer
)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
    when greatest(coalesce(p_score, 0), 0) >= 90 then 5000
    when greatest(coalesce(p_score, 0), 0) >= 50 then 7500
    else 10000
  end;
$$;

create or replace function public.popclub_support_resolution_factor_bps(
  p_score integer
)
returns integer
language sql
immutable
set search_path = public
as $$
  select case
    when greatest(coalesce(p_score, 0), 0) >= 90 then 6500
    when greatest(coalesce(p_score, 0), 0) >= 50 then 8500
    else 10000
  end;
$$;

create or replace function public.popclub_resolve_priority_snapshot(
  p_user_id uuid
)
returns table (
  current_tier text,
  support_priority_score integer,
  concierge_priority_score integer,
  reorder_priority_score integer,
  priority_band text
)
language sql
stable
set search_path = public
as $$
  with tier_choice as (
    select coalesce(
      (
        select pm.current_tier
        from public.popclub_memberships pm
        where pm.user_id = p_user_id
      ),
      'essencial'
    ) as tier_id
  )
  select
    ptr.id as current_tier,
    ptr.concierge_priority_score as support_priority_score,
    ptr.concierge_priority_score,
    ptr.reorder_priority_score,
    public.popclub_priority_band_from_score(ptr.concierge_priority_score) as priority_band
  from tier_choice tc
  join public.popclub_tier_rules ptr on ptr.id = tc.tier_id
  union all
  select
    'essencial',
    10,
    10,
    10,
    'standard'
  where not exists (
    select 1
    from public.popclub_tier_rules ptr
    where ptr.id = (select tier_id from tier_choice)
  )
  limit 1;
$$;

create or replace function public.popclub_apply_support_ticket_priority_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_reason text;
  v_first_response_hours integer := 12;
  v_resolution_hours integer := 72;
  v_escalate_after_hours integer := 24;
  v_support_score integer := 0;
  v_current_tier text := 'essencial';
  v_priority_band text := 'standard';
  v_factor_bps integer := 10000;
  v_resolution_factor_bps integer := 10000;
  v_created_at timestamptz;
begin
  v_user_id := coalesce(new.user_id, new.customer_id);
  v_created_at := coalesce(new.created_at, now());
  v_reason := upper(coalesce(nullif(btrim(new.reason), ''), 'OTHER'));

  if exists (
    select 1
    from public.support_sla_policies p
    where p.reason = v_reason
      and p.active
  ) then
    select
      p.first_response_hours,
      p.resolution_hours,
      p.escalate_after_hours
    into
      v_first_response_hours,
      v_resolution_hours,
      v_escalate_after_hours
    from public.support_sla_policies p
    where p.reason = v_reason
      and p.active
    limit 1;
  end if;

  if v_user_id is not null then
    select
      snap.current_tier,
      snap.support_priority_score,
      snap.priority_band
    into
      v_current_tier,
      v_support_score,
      v_priority_band
    from public.popclub_resolve_priority_snapshot(v_user_id) snap
    limit 1;
  end if;

  v_factor_bps := public.popclub_support_priority_factor_bps(v_support_score);
  v_resolution_factor_bps := public.popclub_support_resolution_factor_bps(v_support_score);

  if new.popclub_current_tier is null then
    new.popclub_current_tier := v_current_tier;
  end if;

  if coalesce(new.popclub_priority_score, 0) <= 0 then
    new.popclub_priority_score := v_support_score;
  end if;

  if coalesce(new.queue_priority_score, 0) <= 0 then
    new.queue_priority_score := greatest(v_support_score, coalesce(new.popclub_priority_score, 0));
  end if;

  if new.priority_band is null then
    new.priority_band := v_priority_band;
  end if;

  if coalesce(nullif(btrim(new.priority), ''), 'normal') = 'normal' then
    new.priority := case
      when coalesce(new.queue_priority_score, 0) >= 90 then 'urgent'
      when coalesce(new.queue_priority_score, 0) >= 50 then 'high'
      else 'normal'
    end;
  end if;

  if new.first_response_target_hours is null then
    new.first_response_target_hours := greatest(
      1,
      ceil((v_first_response_hours::numeric * v_factor_bps::numeric) / 10000)::integer
    );
  end if;

  if new.resolution_target_hours is null then
    new.resolution_target_hours := greatest(
      1,
      ceil((v_resolution_hours::numeric * v_resolution_factor_bps::numeric) / 10000)::integer
    );
  end if;

  if new.first_response_due_at is null then
    new.first_response_due_at := v_created_at + make_interval(hours => new.first_response_target_hours);
  end if;

  if new.resolution_due_at is null then
    new.resolution_due_at := v_created_at + make_interval(hours => new.resolution_target_hours);
  end if;

  if new.sla_deadline is null then
    new.sla_deadline := new.first_response_due_at;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_support_tickets_popclub_priority_defaults on public.support_tickets;
create trigger trg_support_tickets_popclub_priority_defaults
before insert or update on public.support_tickets
for each row execute function public.popclub_apply_support_ticket_priority_defaults();

create or replace function public.popclub_reserve_sample_fulfillment(
  p_order_id uuid,
  p_source_event_at timestamptz default now(),
  p_source text default 'sample_decision'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snapshot public.popclub_order_benefit_snapshots%rowtype;
  v_decision public.popclub_sample_eligibility_decisions%rowtype;
  v_existing public.popclub_sample_reservations%rowtype;
  v_campaign public.popclub_sample_campaigns%rowtype;
  v_inventory public.popclub_sample_inventory%rowtype;
  v_eligible_slots integer := 0;
  v_reserved_slots integer := 0;
  v_reason text := 'inventory_unavailable';
begin
  if p_order_id is null then
    return jsonb_build_object(
      'reservation_id', null,
      'status', 'unavailable',
      'reserved_slots', 0
    );
  end if;

  select *
  into v_decision
  from public.popclub_sample_eligibility_decisions sed
  where sed.order_id = p_order_id
  for update;

  if not found then
    return jsonb_build_object(
      'reservation_id', null,
      'status', 'unavailable',
      'reserved_slots', 0
    );
  end if;

  select *
  into v_snapshot
  from public.popclub_order_benefit_snapshots snap
  where snap.order_id = p_order_id;

  select *
  into v_existing
  from public.popclub_sample_reservations r
  where r.order_id = p_order_id
  for update;

  if found and v_existing.status in ('reserved', 'partially_fulfilled', 'fulfilled') then
    return jsonb_build_object(
      'reservation_id', v_existing.id,
      'status', v_existing.status,
      'reserved_slots', v_existing.reserved_slots,
      'fulfilled_slots', v_existing.fulfilled_slots
    );
  end if;

  v_eligible_slots := greatest(
    coalesce(v_decision.sample_slots, 0),
    coalesce(v_snapshot.sample_slots, 0),
    0
  );

  if v_decision.status <> 'eligible' or v_eligible_slots <= 0 then
    return jsonb_build_object(
      'reservation_id', null,
      'status', 'unavailable',
      'reserved_slots', 0
    );
  end if;

  select *
  into v_campaign
  from public.popclub_sample_campaigns c
  where c.active
    and (c.starts_at is null or c.starts_at <= coalesce(p_source_event_at, now()))
    and (c.ends_at is null or c.ends_at >= coalesce(p_source_event_at, now()))
    and (
      c.eligible_tiers is null
      or coalesce(v_snapshot.tier_id, v_decision.tier_id) = any(c.eligible_tiers)
    )
  order by c.priority_rank desc, c.created_at asc
  limit 1;

  if not found then
    v_reason := 'no_active_campaign';
  else
    select *
    into v_inventory
    from public.popclub_sample_inventory i
    where i.campaign_id = v_campaign.id
      and i.active
      and greatest(i.total_units - i.reserved_units - i.fulfilled_units, 0) > 0
    order by i.updated_at asc, i.created_at asc
    limit 1
    for update;

    if found then
      v_reserved_slots := least(
        v_eligible_slots,
        greatest(coalesce(v_campaign.max_slots_per_order, v_eligible_slots), 1),
        greatest(v_inventory.total_units - v_inventory.reserved_units - v_inventory.fulfilled_units, 0)
      );
      v_reason := 'inventory_reserved';
    end if;
  end if;

  if v_reserved_slots <= 0 then
    insert into public.popclub_sample_reservations (
      order_id,
      user_id,
      tier_id,
      campaign_id,
      inventory_id,
      eligible_slots,
      reserved_slots,
      fulfilled_slots,
      reversed_slots,
      status,
      decision_reason,
      source_event_name,
      source_event_at,
      metadata
    )
    values (
      v_decision.order_id,
      v_decision.user_id,
      v_decision.tier_id,
      v_campaign.id,
      v_inventory.id,
      v_eligible_slots,
      0,
      0,
      0,
      case when v_reason = 'no_active_campaign' then 'waived' else 'unavailable' end,
      v_reason,
      v_decision.source_event_name,
      coalesce(p_source_event_at, v_decision.source_event_at, now()),
      jsonb_build_object('source', coalesce(nullif(p_source, ''), 'sample_decision'))
    )
    on conflict (order_id) do update
    set
      campaign_id = excluded.campaign_id,
      inventory_id = excluded.inventory_id,
      eligible_slots = excluded.eligible_slots,
      status = excluded.status,
      decision_reason = excluded.decision_reason,
      source_event_name = excluded.source_event_name,
      source_event_at = excluded.source_event_at,
      metadata = public.popclub_sample_reservations.metadata || excluded.metadata,
      updated_at = now()
    returning * into v_existing;

  update public.popclub_sample_eligibility_decisions
  set
      status = v_existing.status,
      decision_reason = v_reason,
      metadata = metadata || jsonb_build_object(
        'reservation_status', v_existing.status,
        'reservation_source', coalesce(nullif(p_source, ''), 'sample_decision')
      ),
      updated_at = now()
    where order_id = p_order_id;

    update public.popclub_order_benefit_snapshots
    set
      sample_campaign_id = v_campaign.id,
      sample_inventory_id = v_inventory.id,
      sample_reserved_slots = 0,
      sample_fulfilled_slots = 0,
      sample_reversed_slots = 0,
      sample_reservation_status = v_existing.status,
      sample_decision_status = v_existing.status,
      metadata = metadata || jsonb_build_object(
        'sample_reservation_reason', v_reason,
        'sample_reservation_source', coalesce(nullif(p_source, ''), 'sample_decision')
      ),
      updated_at = now()
    where order_id = p_order_id;

    perform public.popclub_refresh_membership_benefits(v_decision.user_id);

    return jsonb_build_object(
      'reservation_id', v_existing.id,
      'status', v_existing.status,
      'reserved_slots', 0
    );
  end if;

  update public.popclub_sample_inventory
  set
    reserved_units = reserved_units + v_reserved_slots,
    updated_at = now()
  where id = v_inventory.id;

  insert into public.popclub_sample_reservations (
    order_id,
    user_id,
    tier_id,
    campaign_id,
    inventory_id,
    eligible_slots,
    reserved_slots,
    fulfilled_slots,
    reversed_slots,
    status,
    decision_reason,
    source_event_name,
    source_event_at,
    metadata
  )
  values (
    v_decision.order_id,
    v_decision.user_id,
    v_decision.tier_id,
    v_campaign.id,
    v_inventory.id,
    v_eligible_slots,
    v_reserved_slots,
    0,
    0,
    'reserved',
    'inventory_reserved',
    v_decision.source_event_name,
    coalesce(p_source_event_at, v_decision.source_event_at, now()),
    jsonb_build_object(
      'source', coalesce(nullif(p_source, ''), 'sample_decision'),
      'inventory_title', v_inventory.title,
      'inventory_sku', v_inventory.sku
    )
  )
  on conflict (order_id) do update
  set
    campaign_id = excluded.campaign_id,
    inventory_id = excluded.inventory_id,
    eligible_slots = excluded.eligible_slots,
    reserved_slots = excluded.reserved_slots,
    fulfilled_slots = excluded.fulfilled_slots,
    reversed_slots = excluded.reversed_slots,
    status = excluded.status,
    decision_reason = excluded.decision_reason,
    source_event_name = excluded.source_event_name,
    source_event_at = excluded.source_event_at,
    metadata = public.popclub_sample_reservations.metadata || excluded.metadata,
    updated_at = now()
  returning * into v_existing;

  update public.popclub_sample_eligibility_decisions
  set
    status = 'reserved',
    decision_reason = 'inventory_reserved',
    metadata = metadata || jsonb_build_object(
      'sample_campaign_id', v_campaign.id,
      'sample_inventory_id', v_inventory.id,
      'reserved_slots', v_reserved_slots,
      'reservation_source', coalesce(nullif(p_source, ''), 'sample_decision')
    ),
    updated_at = now()
  where order_id = p_order_id;

  update public.popclub_order_benefit_snapshots
  set
    sample_campaign_id = v_campaign.id,
    sample_inventory_id = v_inventory.id,
    sample_reserved_slots = v_reserved_slots,
    sample_fulfilled_slots = 0,
    sample_reversed_slots = 0,
    sample_reservation_status = 'reserved',
    sample_decision_status = 'reserved',
    metadata = metadata || jsonb_build_object(
      'sample_campaign_code', v_campaign.code,
      'sample_inventory_sku', v_inventory.sku,
      'sample_reservation_source', coalesce(nullif(p_source, ''), 'sample_decision')
    ),
    updated_at = now()
  where order_id = p_order_id;

  perform public.popclub_refresh_membership_benefits(v_decision.user_id);

  return jsonb_build_object(
    'reservation_id', v_existing.id,
    'status', 'reserved',
    'reserved_slots', v_reserved_slots,
    'campaign_id', v_campaign.id,
    'inventory_id', v_inventory.id
  );
end;
$$;

create or replace function public.popclub_fulfill_sample_reservation(
  p_order_id uuid,
  p_fulfilled_slots integer default null,
  p_source_event_at timestamptz default now(),
  p_source text default 'fulfillment'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.popclub_sample_reservations%rowtype;
  v_inventory public.popclub_sample_inventory%rowtype;
  v_available_to_fulfill integer := 0;
  v_fulfilled_slots integer := 0;
  v_status text;
begin
  if p_order_id is null then
    return jsonb_build_object(
      'reservation_id', null,
      'status', 'unavailable',
      'fulfilled_slots', 0
    );
  end if;

  select *
  into v_reservation
  from public.popclub_sample_reservations r
  where r.order_id = p_order_id
  for update;

  if not found then
    return jsonb_build_object(
      'reservation_id', null,
      'status', 'unavailable',
      'fulfilled_slots', 0
    );
  end if;

  if v_reservation.inventory_id is null then
    return jsonb_build_object(
      'reservation_id', v_reservation.id,
      'status', v_reservation.status,
      'fulfilled_slots', v_reservation.fulfilled_slots
    );
  end if;

  select *
  into v_inventory
  from public.popclub_sample_inventory i
  where i.id = v_reservation.inventory_id
  for update;

  v_available_to_fulfill := greatest(
    v_reservation.reserved_slots - v_reservation.fulfilled_slots - v_reservation.reversed_slots,
    0
  );
  v_fulfilled_slots := least(
    greatest(coalesce(p_fulfilled_slots, v_available_to_fulfill), 0),
    v_available_to_fulfill
  );

  if v_fulfilled_slots <= 0 then
    return jsonb_build_object(
      'reservation_id', v_reservation.id,
      'status', v_reservation.status,
      'fulfilled_slots', v_reservation.fulfilled_slots
    );
  end if;

  update public.popclub_sample_inventory
  set
    reserved_units = greatest(reserved_units - v_fulfilled_slots, 0),
    fulfilled_units = fulfilled_units + v_fulfilled_slots,
    updated_at = now()
  where id = v_inventory.id;

  v_status := case
    when v_reservation.fulfilled_slots + v_fulfilled_slots + v_reservation.reversed_slots >= v_reservation.reserved_slots
      then 'fulfilled'
    else 'partially_fulfilled'
  end;

  update public.popclub_sample_reservations
  set
    fulfilled_slots = fulfilled_slots + v_fulfilled_slots,
    status = v_status,
    fulfillment_event_name = coalesce(nullif(p_source, ''), 'fulfillment'),
    fulfillment_event_at = coalesce(p_source_event_at, now()),
    metadata = metadata || jsonb_build_object(
      'last_fulfillment_source', coalesce(nullif(p_source, ''), 'fulfillment'),
      'last_fulfilled_slots', v_fulfilled_slots
    ),
    updated_at = now()
  where order_id = p_order_id;

  update public.popclub_sample_eligibility_decisions
  set
    status = 'fulfilled',
    decision_reason = 'sample_fulfilled',
    metadata = metadata || jsonb_build_object(
      'fulfilled_slots', coalesce((metadata->>'fulfilled_slots')::integer, 0) + v_fulfilled_slots,
      'fulfillment_source', coalesce(nullif(p_source, ''), 'fulfillment')
    ),
    updated_at = now()
  where order_id = p_order_id;

  update public.popclub_order_benefit_snapshots
  set
    sample_fulfilled_slots = sample_fulfilled_slots + v_fulfilled_slots,
    sample_reservation_status = v_status,
    sample_decision_status = 'fulfilled',
    metadata = metadata || jsonb_build_object(
      'sample_fulfillment_source', coalesce(nullif(p_source, ''), 'fulfillment'),
      'sample_fulfilled_slots', sample_fulfilled_slots + v_fulfilled_slots
    ),
    updated_at = now()
  where order_id = p_order_id;

  perform public.popclub_refresh_membership_benefits(v_reservation.user_id);

  return jsonb_build_object(
    'reservation_id', v_reservation.id,
    'status', v_status,
    'fulfilled_slots', v_reservation.fulfilled_slots + v_fulfilled_slots
  );
end;
$$;

create or replace function public.popclub_reverse_sample_reservation(
  p_order_id uuid,
  p_event_name text,
  p_source_event_at timestamptz default now(),
  p_source text default 'marketplace_events'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.popclub_sample_reservations%rowtype;
  v_inventory public.popclub_sample_inventory%rowtype;
  v_release_slots integer := 0;
begin
  if p_order_id is null then
    return jsonb_build_object(
      'reservation_id', null,
      'status', 'unavailable',
      'reversed_slots', 0
    );
  end if;

  select *
  into v_reservation
  from public.popclub_sample_reservations r
  where r.order_id = p_order_id
  for update;

  if not found then
    return jsonb_build_object(
      'reservation_id', null,
      'status', 'unavailable',
      'reversed_slots', 0
    );
  end if;

  if v_reservation.inventory_id is not null then
    select *
    into v_inventory
    from public.popclub_sample_inventory i
    where i.id = v_reservation.inventory_id
    for update;
  end if;

  v_release_slots := greatest(
    v_reservation.reserved_slots - v_reservation.fulfilled_slots - v_reservation.reversed_slots,
    0
  );

  if v_release_slots > 0 and v_inventory.id is not null then
    update public.popclub_sample_inventory
    set
      reserved_units = greatest(reserved_units - v_release_slots, 0),
      released_units = released_units + v_release_slots,
      updated_at = now()
    where id = v_inventory.id;
  end if;

  update public.popclub_sample_reservations
  set
    reversed_slots = reversed_slots + v_release_slots,
    status = 'reversed',
    reversal_event_name = coalesce(nullif(p_event_name, ''), 'refund_settled'),
    reversal_event_at = coalesce(p_source_event_at, now()),
    metadata = metadata || jsonb_build_object(
      'sample_reversal_source', coalesce(nullif(p_source, ''), 'marketplace_events'),
      'released_slots', v_release_slots
    ),
    updated_at = now()
  where order_id = p_order_id;

  update public.popclub_sample_eligibility_decisions
  set
    status = 'reversed',
    reversal_event_name = coalesce(nullif(p_event_name, ''), 'refund_settled'),
    reversal_event_at = coalesce(p_source_event_at, now()),
    decision_reason = 'sample_reversed_after_financial_adjustment',
    metadata = metadata || jsonb_build_object(
      'sample_reversal_source', coalesce(nullif(p_source, ''), 'marketplace_events'),
      'released_slots', v_release_slots
    ),
    updated_at = now()
  where order_id = p_order_id;

  update public.popclub_order_benefit_snapshots
  set
    sample_reversed_slots = sample_reversed_slots + v_release_slots,
    sample_reservation_status = 'reversed',
    sample_decision_status = 'reversed',
    metadata = metadata || jsonb_build_object(
      'sample_reversal_source', coalesce(nullif(p_source, ''), 'marketplace_events'),
      'sample_released_slots', sample_reversed_slots + v_release_slots
    ),
    updated_at = now()
  where order_id = p_order_id;

  perform public.popclub_refresh_membership_benefits(v_reservation.user_id);

  return jsonb_build_object(
    'reservation_id', v_reservation.id,
    'status', 'reversed',
    'reversed_slots', v_reservation.reversed_slots + v_release_slots
  );
end;
$$;

create or replace function public.popclub_project_sample_decision_to_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_id is null then
    return new;
  end if;

  if new.status = 'eligible' and (tg_op = 'INSERT' or old.status is distinct from new.status or old.sample_slots is distinct from new.sample_slots) then
    perform public.popclub_reserve_sample_fulfillment(
      new.order_id,
      coalesce(new.source_event_at, now()),
      'sample_decision_trigger'
    );
  elsif new.status = 'reversed' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    perform public.popclub_reverse_sample_reservation(
      new.order_id,
      coalesce(new.reversal_event_name, 'refund_settled'),
      coalesce(new.reversal_event_at, now()),
      'sample_decision_trigger'
    );
  end if;

  return new;
exception
  when others then
    raise warning
      'PopClub sample reservation projection failed for order % (%): %',
      new.order_id,
      tg_op,
      sqlerrm;
    return new;
end;
$$;

drop trigger if exists trg_popclub_sample_decisions_to_reservations on public.popclub_sample_eligibility_decisions;
create trigger trg_popclub_sample_decisions_to_reservations
after insert or update on public.popclub_sample_eligibility_decisions
for each row execute function public.popclub_project_sample_decision_to_reservation();

create or replace function public.popclub_backfill_sample_reservations(
  p_limit integer default 5000
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_processed integer := 0;
begin
  for v_row in
    select sed.order_id, sed.source_event_at
    from public.popclub_sample_eligibility_decisions sed
    left join public.popclub_sample_reservations psr on psr.order_id = sed.order_id
    where sed.order_id is not null
      and sed.status = 'eligible'
      and coalesce(sed.sample_slots, 0) > 0
      and (
        psr.id is null
        or psr.status in ('unavailable', 'waived', 'reversed')
      )
    order by sed.source_event_at asc nulls last, sed.created_at asc
    limit greatest(coalesce(p_limit, 5000), 1)
  loop
    perform public.popclub_reserve_sample_fulfillment(
      v_row.order_id,
      coalesce(v_row.source_event_at, now()),
      'sample_backfill'
    );
    v_processed := v_processed + 1;
  end loop;

  return v_processed;
end;
$$;

create or replace function public.popclub_backfill_support_ticket_priority(
  p_limit integer default 5000
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_processed integer := 0;
begin
  for v_row in
    select st.id
    from public.support_tickets st
    where
      st.popclub_current_tier is null
      or coalesce(st.popclub_priority_score, 0) <= 0
      or coalesce(st.queue_priority_score, 0) <= 0
      or st.priority_band is null
      or st.sla_deadline is null
      or st.first_response_due_at is null
      or st.resolution_due_at is null
    order by st.created_at desc nulls last
    limit greatest(coalesce(p_limit, 5000), 1)
  loop
    update public.support_tickets
    set
      customer_id = coalesce(customer_id, user_id),
      priority = coalesce(nullif(priority, ''), 'normal'),
      sla_deadline = coalesce(sla_deadline, first_response_due_at)
    where id = v_row.id;

    v_processed := v_processed + 1;
  end loop;

  return v_processed;
end;
$$;

revoke all on function public.popclub_priority_band_from_score(integer) from public;
grant execute on function public.popclub_priority_band_from_score(integer) to authenticated, service_role;

revoke all on function public.popclub_support_priority_factor_bps(integer) from public;
grant execute on function public.popclub_support_priority_factor_bps(integer) to authenticated, service_role;

revoke all on function public.popclub_support_resolution_factor_bps(integer) from public;
grant execute on function public.popclub_support_resolution_factor_bps(integer) to authenticated, service_role;

revoke all on function public.popclub_resolve_priority_snapshot(uuid) from public;
grant execute on function public.popclub_resolve_priority_snapshot(uuid) to authenticated, service_role;

revoke all on function public.popclub_apply_support_ticket_priority_defaults() from public;
grant execute on function public.popclub_apply_support_ticket_priority_defaults() to service_role;

revoke all on function public.popclub_reserve_sample_fulfillment(uuid, timestamptz, text) from public;
grant execute on function public.popclub_reserve_sample_fulfillment(uuid, timestamptz, text) to service_role;

revoke all on function public.popclub_fulfill_sample_reservation(uuid, integer, timestamptz, text) from public;
grant execute on function public.popclub_fulfill_sample_reservation(uuid, integer, timestamptz, text) to service_role;

revoke all on function public.popclub_reverse_sample_reservation(uuid, text, timestamptz, text) from public;
grant execute on function public.popclub_reverse_sample_reservation(uuid, text, timestamptz, text) to service_role;

revoke all on function public.popclub_project_sample_decision_to_reservation() from public;
grant execute on function public.popclub_project_sample_decision_to_reservation() to service_role;

revoke all on function public.popclub_backfill_sample_reservations(integer) from public;
grant execute on function public.popclub_backfill_sample_reservations(integer) to service_role;

revoke all on function public.popclub_backfill_support_ticket_priority(integer) from public;
grant execute on function public.popclub_backfill_support_ticket_priority(integer) to service_role;

do $$
begin
  if to_regclass('public.popclub_sample_campaigns') is not null then
    alter table public.popclub_sample_campaigns enable row level security;
    revoke all on table public.popclub_sample_campaigns from anon;
    grant select on table public.popclub_sample_campaigns to authenticated;

    drop policy if exists popclub_sample_campaigns_select_all on public.popclub_sample_campaigns;
    create policy popclub_sample_campaigns_select_all
      on public.popclub_sample_campaigns
      for select
      to authenticated
      using (true);

    drop policy if exists popclub_sample_campaigns_service_all on public.popclub_sample_campaigns;
    create policy popclub_sample_campaigns_service_all
      on public.popclub_sample_campaigns
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.popclub_sample_inventory') is not null then
    alter table public.popclub_sample_inventory enable row level security;
    revoke all on table public.popclub_sample_inventory from anon, authenticated;

    drop policy if exists popclub_sample_inventory_service_all on public.popclub_sample_inventory;
    create policy popclub_sample_inventory_service_all
      on public.popclub_sample_inventory
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.popclub_sample_reservations') is not null then
    alter table public.popclub_sample_reservations enable row level security;
    revoke all on table public.popclub_sample_reservations from anon, authenticated;
    grant select on table public.popclub_sample_reservations to authenticated;

    drop policy if exists popclub_sample_reservations_select_own on public.popclub_sample_reservations;
    create policy popclub_sample_reservations_select_own
      on public.popclub_sample_reservations
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin(auth.uid()));

    drop policy if exists popclub_sample_reservations_service_all on public.popclub_sample_reservations;
    create policy popclub_sample_reservations_service_all
      on public.popclub_sample_reservations
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.popclub_concierge_requests') is not null then
    alter table public.popclub_concierge_requests enable row level security;
    revoke all on table public.popclub_concierge_requests from anon, authenticated;
    grant select on table public.popclub_concierge_requests to authenticated;

    drop policy if exists popclub_concierge_requests_select_own on public.popclub_concierge_requests;
    create policy popclub_concierge_requests_select_own
      on public.popclub_concierge_requests
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin(auth.uid()));

    drop policy if exists popclub_concierge_requests_service_all on public.popclub_concierge_requests;
    create policy popclub_concierge_requests_service_all
      on public.popclub_concierge_requests
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if to_regclass('public.popclub_reorder_requests') is not null then
    alter table public.popclub_reorder_requests enable row level security;
    revoke all on table public.popclub_reorder_requests from anon, authenticated;
    grant select on table public.popclub_reorder_requests to authenticated;

    drop policy if exists popclub_reorder_requests_select_own on public.popclub_reorder_requests;
    create policy popclub_reorder_requests_select_own
      on public.popclub_reorder_requests
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin(auth.uid()));

    drop policy if exists popclub_reorder_requests_service_all on public.popclub_reorder_requests;
    create policy popclub_reorder_requests_service_all
      on public.popclub_reorder_requests
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end;
$$;

select public.popclub_backfill_support_ticket_priority();
select public.popclub_backfill_sample_reservations();
