alter table public.shipments
  add column if not exists operational_status text;

alter table public.shipments
  add column if not exists operational_notes text;

alter table public.shipments
  add column if not exists operational_updated_at timestamptz;

alter table public.shipments
  add column if not exists operational_updated_by text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shipments_operational_status_check'
      and conrelid = 'public.shipments'::regclass
  ) then
    alter table public.shipments
      add constraint shipments_operational_status_check
      check (
        operational_status is null
        or operational_status in (
          'aprovado',
          'em-revisao',
          'pendente',
          'reprovado',
          'critico',
          'alerta',
          'resolvido',
          'bloqueado'
        )
      );
  end if;
end
$$;

create index if not exists idx_shipments_operational_status_updated
  on public.shipments (operational_status, updated_at desc);

create index if not exists idx_shipments_seller_operational_status
  on public.shipments (seller_id, operational_status, updated_at desc);
