create table if not exists public.adm_entity_states (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null
    check (entity_type in ('product', 'seller', 'payout', 'refund', 'shipment', 'incident', 'document', 'review')),
  entity_id text not null,
  seller_id uuid references public.sellers(id) on delete cascade,
  status text not null,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);

create index if not exists idx_adm_entity_states_type_status
  on public.adm_entity_states (entity_type, status, updated_at desc);

create index if not exists idx_adm_entity_states_seller_updated
  on public.adm_entity_states (seller_id, updated_at desc);

drop trigger if exists trg_adm_entity_states_updated on public.adm_entity_states;
create trigger trg_adm_entity_states_updated
before update on public.adm_entity_states
for each row execute function public.set_updated_at();

alter table public.adm_entity_states enable row level security;

drop policy if exists adm_entity_states_admin_select on public.adm_entity_states;
create policy adm_entity_states_admin_select
on public.adm_entity_states
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists adm_entity_states_service_all on public.adm_entity_states;
create policy adm_entity_states_service_all
on public.adm_entity_states
for all
to service_role
using (true)
with check (true);

grant select on public.adm_entity_states to authenticated;
grant all on public.adm_entity_states to service_role;
