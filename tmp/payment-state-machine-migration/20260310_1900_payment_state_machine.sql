-- =========================================================
-- Payment State Machine
-- =========================================================

alter table public.orders
  add column if not exists payment_state text not null default 'created';

update public.orders
set payment_state = case
  when lower(coalesce(payment_status, '')) in ('paid', 'approved', 'captured', 'completed', 'succeeded') then 'succeeded'
  when lower(coalesce(payment_status, '')) = 'refunded' then 'refunded'
  when lower(coalesce(payment_status, '')) = 'chargeback' then 'chargeback'
  when lower(coalesce(payment_status, '')) = 'failed' then 'failed'
  when lower(coalesce(payment_status, '')) = 'pending' then 'requires_payment_method'
  else 'created'
end
where coalesce(nullif(trim(payment_state), ''), 'created') = 'created';

create table if not exists public.payment_states (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_intent_id text,
  provider text not null default 'stripe',
  provider_event_id text,
  state text not null,
  amount_cents integer,
  currency text not null default 'BRL',
  event text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_states_order_created
  on public.payment_states (order_id, created_at desc);

create index if not exists idx_payment_states_payment_intent
  on public.payment_states (payment_intent_id, created_at desc);

create unique index if not exists uq_payment_states_provider_event
  on public.payment_states (provider_event_id)
  where provider_event_id is not null;

create table if not exists public.payment_state_transitions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_intent_id text,
  provider text not null default 'stripe',
  provider_event_id text,
  from_state text not null,
  to_state text not null,
  event text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_state_transitions_order_created
  on public.payment_state_transitions (order_id, created_at desc);

create index if not exists idx_payment_state_transitions_from_to
  on public.payment_state_transitions (from_state, to_state, created_at desc);

create table if not exists public.valid_payment_transitions (
  from_state text not null,
  to_state text not null,
  primary key (from_state, to_state)
);

insert into public.valid_payment_transitions (from_state, to_state)
values
  ('created', 'requires_payment_method'),
  ('created', 'requires_confirmation'),
  ('created', 'requires_action'),
  ('created', 'processing'),
  ('created', 'succeeded'),
  ('created', 'failed'),
  ('created', 'canceled'),
  ('requires_payment_method', 'requires_confirmation'),
  ('requires_payment_method', 'requires_action'),
  ('requires_payment_method', 'processing'),
  ('requires_payment_method', 'succeeded'),
  ('requires_payment_method', 'failed'),
  ('requires_payment_method', 'canceled'),
  ('requires_confirmation', 'requires_payment_method'),
  ('requires_confirmation', 'requires_action'),
  ('requires_confirmation', 'processing'),
  ('requires_confirmation', 'succeeded'),
  ('requires_confirmation', 'failed'),
  ('requires_confirmation', 'canceled'),
  ('requires_action', 'requires_payment_method'),
  ('requires_action', 'requires_confirmation'),
  ('requires_action', 'processing'),
  ('requires_action', 'succeeded'),
  ('requires_action', 'failed'),
  ('requires_action', 'canceled'),
  ('processing', 'requires_action'),
  ('processing', 'succeeded'),
  ('processing', 'failed'),
  ('processing', 'canceled'),
  ('succeeded', 'refunded'),
  ('succeeded', 'chargeback'),
  ('refunded', 'chargeback')
on conflict do nothing;

create or replace function public.validate_payment_transition(
  current_state text,
  next_state text
)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists(
    select 1
    from public.valid_payment_transitions vpt
    where vpt.from_state = lower(coalesce(current_state, 'created'))
      and vpt.to_state = lower(coalesce(next_state, ''))
  );
$$;

create or replace function public.payment_state_summary(
  p_state text
)
returns public.paymentstatus
language plpgsql
immutable
set search_path = public
as $$
declare
  v_state text := lower(coalesce(p_state, 'created'));
begin
  if v_state in (
    'created',
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing'
  ) then
    return 'pending'::public.paymentstatus;
  end if;

  if v_state = 'succeeded' then
    return 'paid'::public.paymentstatus;
  end if;

  if v_state = 'refunded' then
    return 'refunded'::public.paymentstatus;
  end if;

  if v_state = 'chargeback' then
    return 'chargeback'::public.paymentstatus;
  end if;

  return 'failed'::public.paymentstatus;
end;
$$;

create or replace function public.seed_order_payment_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.payment_states (
    order_id,
    payment_intent_id,
    provider,
    state,
    amount_cents,
    currency,
    event,
    metadata,
    created_at
  )
  values (
    new.id,
    new.payment_intent_id,
    coalesce(nullif(new.payment_provider, ''), 'stripe'),
    lower(coalesce(nullif(new.payment_state, ''), 'created')),
    new.total_order_cents,
    'BRL',
    'order.created',
    jsonb_build_object(
      'source', 'orders_trigger'
    ),
    coalesce(new.created_at, now())
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_orders_seed_payment_state on public.orders;
create trigger trg_orders_seed_payment_state
after insert on public.orders
for each row execute function public.seed_order_payment_state();

insert into public.payment_states (
  order_id,
  payment_intent_id,
  provider,
  state,
  amount_cents,
  currency,
  event,
  metadata,
  created_at
)
select
  o.id,
  o.payment_intent_id,
  coalesce(nullif(o.payment_provider, ''), 'stripe'),
  lower(coalesce(nullif(o.payment_state, ''), 'created')),
  o.total_order_cents,
  'BRL',
  'backfill',
  jsonb_build_object(
    'source', 'payment_state_machine_backfill',
    'payment_status', o.payment_status
  ),
  o.created_at
from public.orders o
where not exists (
  select 1
  from public.payment_states ps
  where ps.order_id = o.id
);

create or replace function public.update_payment_state(
  p_order_id uuid,
  p_state text,
  p_payment_intent_id text default null,
  p_amount_cents integer default null,
  p_currency text default 'BRL',
  p_provider text default 'stripe',
  p_event text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_provider_event_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state_id uuid;
  v_current_state text;
  v_next_state text := lower(coalesce(nullif(trim(p_state), ''), 'created'));
  v_payment_intent_id text;
  v_provider text;
  v_summary public.paymentstatus;
  v_payment_id uuid;
  v_existing_state_id uuid;
begin
  if v_next_state not in (
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
  ) then
    raise exception 'invalid_payment_state: %', v_next_state using errcode = 'P0001';
  end if;

  if nullif(trim(coalesce(p_provider_event_id, '')), '') is not null then
    select ps.id
    into v_existing_state_id
    from public.payment_states ps
    where ps.provider_event_id = trim(p_provider_event_id)
    limit 1;

    if v_existing_state_id is not null then
      return v_existing_state_id;
    end if;
  end if;

  select
    lower(coalesce(nullif(o.payment_state, ''), 'created')),
    coalesce(nullif(trim(p_payment_intent_id), ''), nullif(o.payment_intent_id, '')),
    coalesce(nullif(trim(p_provider), ''), nullif(o.payment_provider, ''), 'stripe')
  into
    v_current_state,
    v_payment_intent_id,
    v_provider
  from public.orders o
  where o.id = p_order_id
  for update;

  if not found then
    raise exception 'payment_state_order_not_found: %', p_order_id using errcode = 'P0001';
  end if;

  if v_current_state <> v_next_state
    and not public.validate_payment_transition(v_current_state, v_next_state) then
    raise exception 'invalid_payment_transition: % -> %', v_current_state, v_next_state
      using errcode = 'P0001';
  end if;

  v_summary := public.payment_state_summary(v_next_state);

  update public.orders
  set
    payment_state = v_next_state,
    payment_status = v_summary::text,
    payment_provider = coalesce(v_provider, payment_provider),
    payment_intent_id = coalesce(v_payment_intent_id, payment_intent_id)
  where id = p_order_id;

  select p.id
  into v_payment_id
  from public.payments p
  where p.order_id = p_order_id
  order by p.created_at desc nulls last
  limit 1;

  if v_payment_id is null then
    insert into public.payments (
      id,
      order_id,
      status,
      amount_cents,
      currency,
      provider,
      provider_ref
    )
    values (
      gen_random_uuid(),
      p_order_id,
      v_summary,
      coalesce(p_amount_cents, 0),
      upper(coalesce(nullif(trim(p_currency), ''), 'BRL')),
      v_provider,
      v_payment_intent_id
    )
    returning id into v_payment_id;
  else
    update public.payments
    set
      status = v_summary,
      amount_cents = coalesce(p_amount_cents, amount_cents),
      currency = upper(coalesce(nullif(trim(p_currency), ''), currency, 'BRL')),
      provider = coalesce(v_provider, provider),
      provider_ref = coalesce(v_payment_intent_id, provider_ref),
      updated_at = now()
    where id = v_payment_id;
  end if;

  insert into public.payment_states (
    order_id,
    payment_intent_id,
    provider,
    provider_event_id,
    state,
    amount_cents,
    currency,
    event,
    metadata
  )
  values (
    p_order_id,
    v_payment_intent_id,
    v_provider,
    nullif(trim(coalesce(p_provider_event_id, '')), ''),
    v_next_state,
    p_amount_cents,
    upper(coalesce(nullif(trim(p_currency), ''), 'BRL')),
    p_event,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_state_id;

  if v_current_state <> v_next_state then
    insert into public.payment_state_transitions (
      order_id,
      payment_intent_id,
      provider,
      provider_event_id,
      from_state,
      to_state,
      event,
      metadata
    )
    values (
      p_order_id,
      v_payment_intent_id,
      v_provider,
      nullif(trim(coalesce(p_provider_event_id, '')), ''),
      v_current_state,
      v_next_state,
      p_event,
      coalesce(p_metadata, '{}'::jsonb)
    );
  end if;

  return v_state_id;
end;
$$;

grant execute on function public.validate_payment_transition(text, text) to service_role;
grant execute on function public.payment_state_summary(text) to service_role;
grant execute on function public.update_payment_state(uuid, text, text, integer, text, text, text, jsonb, text) to service_role;

alter table public.payment_states enable row level security;
alter table public.payment_state_transitions enable row level security;
alter table public.valid_payment_transitions enable row level security;

drop policy if exists payment_states_admin_select on public.payment_states;
create policy payment_states_admin_select
on public.payment_states
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists payment_states_service_all on public.payment_states;
create policy payment_states_service_all
on public.payment_states
for all
to service_role
using (true)
with check (true);

drop policy if exists payment_state_transitions_admin_select on public.payment_state_transitions;
create policy payment_state_transitions_admin_select
on public.payment_state_transitions
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists payment_state_transitions_service_all on public.payment_state_transitions;
create policy payment_state_transitions_service_all
on public.payment_state_transitions
for all
to service_role
using (true)
with check (true);

drop policy if exists valid_payment_transitions_admin_select on public.valid_payment_transitions;
create policy valid_payment_transitions_admin_select
on public.valid_payment_transitions
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists valid_payment_transitions_service_all on public.valid_payment_transitions;
create policy valid_payment_transitions_service_all
on public.valid_payment_transitions
for all
to service_role
using (true)
with check (true);

revoke all on public.payment_states from anon;
revoke all on public.payment_state_transitions from anon;
revoke all on public.valid_payment_transitions from anon;

grant select on public.payment_states to authenticated;
grant select on public.payment_state_transitions to authenticated;
grant select on public.valid_payment_transitions to authenticated;

grant all on public.payment_states to service_role;
grant all on public.payment_state_transitions to service_role;
grant all on public.valid_payment_transitions to service_role;
