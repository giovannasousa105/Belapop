-- Stripe webhook idempotency + lote_reservas payment_intent linkage.

-- Track which Stripe events have already been fully processed.
-- INSERT ON CONFLICT DO NOTHING + check count → safe idempotency gate.
create table if not exists public.stripe_eventos_processados (
  stripe_event_id  varchar(255)  primary key,
  event_type       varchar(120)  not null,
  processado_em    timestamptz   not null default now(),
  resultado        jsonb         not null default '{}'
);

create index if not exists idx_stripe_eventos_processados_type
  on public.stripe_eventos_processados (event_type, processado_em desc);

-- Add payment_intent_id to lote_reservas so the webhook can locate the
-- reservation without requiring metadata in the PaymentIntent itself.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'lote_reservas'
      and column_name  = 'payment_intent_id'
  ) then
    alter table public.lote_reservas
      add column payment_intent_id varchar(255);
  end if;
end
$$;

create index if not exists idx_lote_reservas_payment_intent
  on public.lote_reservas (payment_intent_id)
  where payment_intent_id is not null;

-- Allow service_role full access (admin client bypasses RLS already,
-- but explicit grants avoid surprises after future RLS tightening).
alter table public.stripe_eventos_processados enable row level security;

drop policy if exists stripe_eventos_service_role_all on public.stripe_eventos_processados;
create policy stripe_eventos_service_role_all
  on public.stripe_eventos_processados
  for all
  to service_role
  using (true)
  with check (true);
