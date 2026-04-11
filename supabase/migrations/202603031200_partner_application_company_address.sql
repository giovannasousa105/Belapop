-- partner application: company address fields for seller account onboarding

alter table if exists public.partner_applications
  add column if not exists company_postal_code text,
  add column if not exists company_street text,
  add column if not exists company_number text,
  add column if not exists company_complement text,
  add column if not exists company_district text,
  add column if not exists company_city text,
  add column if not exists company_state text;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'partner_applications_company_state_check'
  ) then
    alter table public.partner_applications
      add constraint partner_applications_company_state_check
      check (
        company_state is null
        or company_state ~ '^[A-Z]{2}$'
      );
  end if;
end
$$;
