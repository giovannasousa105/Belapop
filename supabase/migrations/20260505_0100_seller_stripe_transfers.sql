-- Stripe Connect seller transfer ledger.
-- Keeps one auditable row per seller/order/payment_intent transfer attempt.

create table if not exists public.seller_transfers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sub_order_id uuid not null references public.sub_orders(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  payment_intent_id text not null,
  stripe_account_id text not null,
  stripe_transfer_id text,
  gross_amount_cents integer not null default 0,
  platform_fee_cents integer not null default 0,
  shipping_total_cents integer not null default 0,
  seller_net_cents integer not null default 0,
  currency text not null default 'BRL',
  status text not null default 'pending',
  failure_reason text,
  transferred_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_transfers_status_check
    check (status in ('pending', 'transferred', 'failed', 'reversed')),
  constraint seller_transfers_amounts_check
    check (
      gross_amount_cents >= 0
      and platform_fee_cents >= 0
      and shipping_total_cents >= 0
      and seller_net_cents >= 0
    ),
  constraint seller_transfers_stripe_account_check
    check (length(trim(stripe_account_id)) > 0),
  constraint seller_transfers_payment_intent_check
    check (length(trim(payment_intent_id)) > 0)
);

create unique index if not exists uq_seller_transfers_order_seller_payment
  on public.seller_transfers (order_id, seller_id, payment_intent_id);

create unique index if not exists uq_seller_transfers_stripe_transfer
  on public.seller_transfers (stripe_transfer_id)
  where stripe_transfer_id is not null;

create index if not exists idx_seller_transfers_seller_created
  on public.seller_transfers (seller_id, created_at desc);

create index if not exists idx_seller_transfers_order
  on public.seller_transfers (order_id, created_at desc);

create index if not exists idx_seller_transfers_status_created
  on public.seller_transfers (status, created_at desc);

drop trigger if exists trg_seller_transfers_updated on public.seller_transfers;
create trigger trg_seller_transfers_updated
before update on public.seller_transfers
for each row execute function public.set_updated_at();

alter table public.seller_transfers enable row level security;

drop policy if exists seller_transfers_select_scope on public.seller_transfers;
create policy seller_transfers_select_scope
on public.seller_transfers
for select
to authenticated
using (public.has_seller_tenant_access(seller_id));

drop policy if exists seller_transfers_service_all on public.seller_transfers;
create policy seller_transfers_service_all
on public.seller_transfers
for all
to service_role
using (true)
with check (true);

grant select on public.seller_transfers to authenticated;
grant all on public.seller_transfers to service_role;
