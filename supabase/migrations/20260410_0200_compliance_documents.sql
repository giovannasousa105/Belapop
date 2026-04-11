create table if not exists public.compliance_documents (
  id text primary key,
  seller_id text not null,
  product_id text,
  document_type text not null,
  status text not null default 'pendente',
  due_date date not null,
  owner_area text not null,
  review_notes text,
  metadata jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint compliance_documents_status_check check (
    status in (
      'aprovado',
      'em-revisao',
      'pendente',
      'reprovado',
      'critico',
      'alerta',
      'resolvido',
      'bloqueado',
      'premium',
      'destaque'
    )
  )
);

create index if not exists idx_compliance_documents_seller_status_due
  on public.compliance_documents (seller_id, status, due_date asc);

create index if not exists idx_compliance_documents_product
  on public.compliance_documents (product_id);

do $$
begin
  if exists (
    select 1
    from pg_proc
    where proname = 'set_updated_at'
      and pg_function_is_visible(oid)
  ) then
    execute 'drop trigger if exists trg_compliance_documents_updated on public.compliance_documents';
    execute 'create trigger trg_compliance_documents_updated before update on public.compliance_documents for each row execute function public.set_updated_at()';
  end if;
end
$$;

alter table public.compliance_documents enable row level security;

drop policy if exists compliance_documents_select_admin on public.compliance_documents;
create policy compliance_documents_select_admin
on public.compliance_documents
for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists compliance_documents_write_admin on public.compliance_documents;
create policy compliance_documents_write_admin
on public.compliance_documents
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists compliance_documents_service_all on public.compliance_documents;
create policy compliance_documents_service_all
on public.compliance_documents
for all
to service_role
using (true)
with check (true);

revoke all on public.compliance_documents from anon;
grant select, insert, update, delete on public.compliance_documents to authenticated;
grant all on public.compliance_documents to service_role;
