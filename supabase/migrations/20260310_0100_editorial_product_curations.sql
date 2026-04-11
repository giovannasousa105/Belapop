create table if not exists public.editorial_product_curations (
  id uuid primary key default gen_random_uuid(),
  surface text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  position integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_product_curations_surface_check
    check (surface in ('featured')),
  constraint editorial_product_curations_position_check
    check (position > 0),
  constraint editorial_product_curations_surface_product_unique
    unique (surface, product_id),
  constraint editorial_product_curations_surface_position_unique
    unique (surface, position)
);

create index if not exists idx_editorial_product_curations_surface_position
  on public.editorial_product_curations(surface, position);

create index if not exists idx_editorial_product_curations_product_id
  on public.editorial_product_curations(product_id);

create or replace function public.set_editorial_product_curation(
  p_surface text,
  p_product_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
  v_position integer := 1;
begin
  if coalesce(trim(p_surface), '') = '' then
    raise exception 'editorial_curation_surface_required';
  end if;

  if p_surface not in ('featured') then
    raise exception 'editorial_curation_surface_invalid';
  end if;

  delete from public.editorial_product_curations
  where surface = p_surface;

  if p_product_ids is null or coalesce(array_length(p_product_ids, 1), 0) = 0 then
    return;
  end if;

  foreach v_product_id in array p_product_ids loop
    if v_product_id is null then
      continue;
    end if;

    insert into public.editorial_product_curations (
      surface,
      product_id,
      position,
      is_active,
      created_at,
      updated_at
    )
    values (
      p_surface,
      v_product_id,
      v_position,
      true,
      now(),
      now()
    );

    v_position := v_position + 1;
  end loop;
end;
$$;

insert into public.editorial_product_curations (surface, product_id, position, is_active)
select
  'featured',
  p.id,
  ranked.position,
  true
from (
  select *
  from (
    values
      ('oleo-capilar-nuit', 1),
      ('blush-veu-rose', 2),
      ('creme-barrier-celeste', 3),
      ('serum-radiance-01', 4),
      ('patch-olhos-aurora', 5),
      ('gel-limpeza-veludo', 6),
      ('lip-tint-atelier', 7),
      ('mascara-lumiere', 8),
      ('body-mist-rosa-profundo', 9),
      ('velas-calm-02', 10),
      ('cha-botanical-calm', 11),
      ('escova-ritual-zen', 12)
  ) as seed(slug, position)
) ranked
join public.products p
  on p.slug = ranked.slug
where not exists (
  select 1
  from public.editorial_product_curations existing
  where existing.surface = 'featured'
);
