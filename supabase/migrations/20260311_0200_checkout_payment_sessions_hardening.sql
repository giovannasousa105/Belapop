create table if not exists public.checkout_payment_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid null references public.orders(id) on delete set null,
  idempotency_key text not null,
  cart_hash text not null,
  address_hash text not null,
  payment_method_preference text not null default 'automatic',
  currency text not null default 'BRL',
  request_ip text null,
  user_agent text null,
  device_fingerprint text null,
  risk_score numeric(6,2) not null default 0,
  risk_tier text not null default 'low',
  risk_flags jsonb not null default '[]'::jsonb,
  pricing_snapshot jsonb not null default '{}'::jsonb,
  shipping_snapshot jsonb not null default '{}'::jsonb,
  allowed_payment_methods jsonb not null default '[]'::jsonb,
  provider text null,
  provider_status text null,
  payment_intent_id text null,
  status text not null default 'draft_created',
  failure_code text null,
  failure_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);

create index if not exists idx_checkout_payment_sessions_customer_created
  on public.checkout_payment_sessions (customer_id, created_at desc);

create index if not exists idx_checkout_payment_sessions_idempotency_created
  on public.checkout_payment_sessions (customer_id, idempotency_key, created_at desc);

create unique index if not exists uq_checkout_payment_sessions_customer_idempotency
  on public.checkout_payment_sessions (customer_id, idempotency_key);

create index if not exists idx_checkout_payment_sessions_payment_intent
  on public.checkout_payment_sessions (payment_intent_id)
  where payment_intent_id is not null;

create index if not exists idx_checkout_payment_sessions_request_ip_created
  on public.checkout_payment_sessions (request_ip, created_at desc)
  where request_ip is not null;

create index if not exists idx_checkout_payment_sessions_status_created
  on public.checkout_payment_sessions (status, created_at desc);

alter table public.checkout_payment_sessions enable row level security;

drop policy if exists checkout_payment_sessions_service_all on public.checkout_payment_sessions;
create policy checkout_payment_sessions_service_all
on public.checkout_payment_sessions
for all
to service_role
using (true)
with check (true);

drop policy if exists checkout_payment_sessions_admin_select on public.checkout_payment_sessions;
create policy checkout_payment_sessions_admin_select
on public.checkout_payment_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

revoke all on public.checkout_payment_sessions from anon;
grant select on public.checkout_payment_sessions to authenticated;
grant all on public.checkout_payment_sessions to service_role;
