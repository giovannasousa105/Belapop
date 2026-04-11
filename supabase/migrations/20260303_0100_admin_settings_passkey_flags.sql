-- admin settings for security feature flags

create table if not exists public.admin_settings (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admin_settings_pkey'
      and conrelid = 'public.admin_settings'::regclass
  ) then
    alter table public.admin_settings
      add constraint admin_settings_pkey primary key (key);
  end if;
end
$$;
do $$
begin
  if exists (
    select 1
    from pg_proc
    where proname = 'set_updated_at'
      and pg_function_is_visible(oid)
  ) then
    execute 'drop trigger if exists trg_admin_settings_updated_at on public.admin_settings';
    execute 'create trigger trg_admin_settings_updated_at before update on public.admin_settings for each row execute function public.set_updated_at()';
  end if;
end
$$;
alter table public.admin_settings enable row level security;
drop policy if exists admin_settings_select_admin on public.admin_settings;
create policy admin_settings_select_admin
on public.admin_settings
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
drop policy if exists admin_settings_write_admin on public.admin_settings;
create policy admin_settings_write_admin
on public.admin_settings
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
revoke all on public.admin_settings from anon;
grant select on public.admin_settings to authenticated;
grant select, insert, update, delete on public.admin_settings to service_role;
insert into public.admin_settings (key, value)
values ('require_passkey_partner', 'true')
on conflict (key) do nothing;
