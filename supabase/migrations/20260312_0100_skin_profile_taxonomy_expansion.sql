-- =========================================================
-- Skin profile taxonomy expansion
-- =========================================================

alter table public.skin_types
  add column if not exists description text,
  add column if not exists sort_order integer not null default 100;

alter table public.skin_concerns
  add column if not exists sort_order integer not null default 100;

create table if not exists public.skin_tones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.user_skin_profiles
  add column if not exists skin_tone_id uuid references public.skin_tones(id) on delete set null;

create index if not exists idx_user_skin_profiles_skin_tone_id
  on public.user_skin_profiles (skin_tone_id);

insert into public.skin_types (slug, name, description, sort_order)
values
  ('normal', 'Normal ou equilibrada', 'Pele com oleosidade e ressecamento geralmente equilibrados ao longo do dia.', 10),
  ('oily', 'Oleosa', 'Pele com brilho mais intenso, maior oleosidade e tendencia a poros mais aparentes.', 20),
  ('dry', 'Seca', 'Pele com sensacao de ressecamento, repuxamento e menor conforto cutaneo.', 30),
  ('combination', 'Mista', 'Pele com zona T mais oleosa e laterais do rosto mais equilibradas ou secas.', 40),
  ('sensitive', 'Sensivel', 'Pele que reage com facilidade a calor, fragrancia, atrito ou ativos mais fortes.', 50),
  ('acne_prone', 'Com tendencia a acne', 'Pele que costuma formar cravos, espinhas ou inflamacao com mais facilidade.', 60)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.skin_tones (slug, name, description, sort_order)
values
  ('fair', 'Pele clara', 'Tons mais claros, com maior tendencia a vermelhidao visivel e sensibilidade solar.', 10),
  ('medium', 'Tom medio', 'Tons medios, com variacao entre subtom neutro, quente e frio.', 20),
  ('tan', 'Pele morena', 'Tons morenos, com maior tendencia a hiperpigmentacao pos-inflamatoria em alguns cenarios.', 30),
  ('deep', 'Pele negra', 'Tons profundos, em que manchas residuais e hiperpigmentacao pedem cuidado especial.', 40),
  ('rich', 'Pele retinta', 'Tons muito profundos, com atencao extra a pigmentacao, sensibilidade e acabamento cosmetico.', 50)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.skin_concerns (slug, name, description, sort_order)
values
  ('acne', 'Acne e cravos', 'Controle de oleosidade, comedoes, inflamacao e recorrencia de lesoes.', 10),
  ('oiliness', 'Oleosidade excessiva', 'Brilho intenso, desconforto ao longo do dia e necessidade de controle de sebo.', 20),
  ('visible_pores', 'Poros aparentes', 'Textura com poros mais visiveis, especialmente em testa, nariz e bochechas.', 30),
  ('dark_spots', 'Manchas e marcas', 'Uniformizacao do tom, marcas residuais e cuidado com hiperpigmentacao.', 40),
  ('dehydration', 'Desidratacao', 'Reposicao de agua e melhora da sensacao de repuxamento e aspereza.', 50),
  ('barrier_damage', 'Barreira sensibilizada', 'Desconforto, ardor, descamacao ou dificuldade de tolerar ativos.', 60),
  ('rosacea', 'Vermelhidao e rosacea', 'Calmar vermelhidao reativa, ardor e rubor persistente.', 70),
  ('aging', 'Linhas finas e firmeza', 'Foco em firmeza, linhas, elasticidade e envelhecimento cutaneo.', 80),
  ('uneven_texture', 'Textura irregular', 'Aspereza, relevo irregular e necessidade de refinamento progressivo.', 90),
  ('under_eye', 'Olheiras e area dos olhos', 'Bolsa leve, aspecto cansado, desidratacao e pigmentacao periocular.', 100)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.skin_concern_ingredients (concern_id, ingredient_id, weight)
select sc.id, i.id, m.weight
from (
  values
    ('oiliness', 'niacinamide', 1.00::numeric),
    ('visible_pores', 'niacinamide', 0.95::numeric),
    ('uneven_texture', 'retinol', 0.90::numeric),
    ('uneven_texture', 'niacinamide', 0.65::numeric),
    ('under_eye', 'hyaluronic-acid', 0.85::numeric),
    ('under_eye', 'niacinamide', 0.55::numeric)
) as m(concern_slug, ingredient_slug, weight)
join public.skin_concerns sc on sc.slug = m.concern_slug
join public.ingredients i on i.slug = m.ingredient_slug
on conflict (concern_id, ingredient_id) do update
set weight = excluded.weight;

alter table public.skin_tones enable row level security;

drop policy if exists skin_tones_public_read on public.skin_tones;
create policy skin_tones_public_read
on public.skin_tones
for select
to anon, authenticated
using (true);

drop policy if exists skin_tones_service_all on public.skin_tones;
create policy skin_tones_service_all
on public.skin_tones
for all
to service_role
using (true)
with check (true);

grant select on table public.skin_tones to anon, authenticated;
grant all on table public.skin_tones to service_role;
