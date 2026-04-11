-- =========================================================
-- Beauty Intelligence Platform Core
-- =========================================================

create table if not exists public.dermatology_conditions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  condition_name text not null,
  description text,
  symptoms text,
  recommended_ingredients text,
  contraindications text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_dermatology_conditions_updated on public.dermatology_conditions;
create trigger trg_dermatology_conditions_updated
before update on public.dermatology_conditions
for each row execute function public.set_updated_at();

create table if not exists public.skincare_ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  benefits text,
  skin_conditions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_skincare_ingredients_updated on public.skincare_ingredients;
create trigger trg_skincare_ingredients_updated
before update on public.skincare_ingredients
for each row execute function public.set_updated_at();

create table if not exists public.dermatology_condition_ingredients (
  condition_id uuid not null references public.dermatology_conditions(id) on delete cascade,
  ingredient_id uuid not null references public.skincare_ingredients(id) on delete cascade,
  recommendation_strength numeric(6,4) not null default 0.7 check (recommendation_strength between 0 and 1),
  notes text,
  created_at timestamptz not null default now(),
  primary key (condition_id, ingredient_id)
);

create index if not exists idx_dermatology_condition_ingredients_condition
  on public.dermatology_condition_ingredients (condition_id);

create table if not exists public.skin_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_cart_id uuid references public.routine_carts(id) on delete set null,
  before_scan_id uuid references public.skin_scans(id) on delete set null,
  after_scan_id uuid references public.skin_scans(id) on delete set null,
  improvement_score numeric(6,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skin_outcomes_after_scan_unique unique (after_scan_id)
);

create index if not exists idx_skin_outcomes_user_created
  on public.skin_outcomes (user_id, created_at desc);

drop trigger if exists trg_skin_outcomes_updated on public.skin_outcomes;
create trigger trg_skin_outcomes_updated
before update on public.skin_outcomes
for each row execute function public.set_updated_at();

alter table public.dermatology_conditions enable row level security;
alter table public.skincare_ingredients enable row level security;
alter table public.dermatology_condition_ingredients enable row level security;
alter table public.skin_outcomes enable row level security;

drop policy if exists dermatology_conditions_public_read on public.dermatology_conditions;
create policy dermatology_conditions_public_read
on public.dermatology_conditions
for select
to authenticated
using (true);

drop policy if exists skincare_ingredients_public_read on public.skincare_ingredients;
create policy skincare_ingredients_public_read
on public.skincare_ingredients
for select
to authenticated
using (true);

drop policy if exists dermatology_condition_ingredients_public_read on public.dermatology_condition_ingredients;
create policy dermatology_condition_ingredients_public_read
on public.dermatology_condition_ingredients
for select
to authenticated
using (true);

drop policy if exists skin_outcomes_owner_read on public.skin_outcomes;
create policy skin_outcomes_owner_read
on public.skin_outcomes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists dermatology_conditions_service_all on public.dermatology_conditions;
create policy dermatology_conditions_service_all
on public.dermatology_conditions
for all
to service_role
using (true)
with check (true);

drop policy if exists skincare_ingredients_service_all on public.skincare_ingredients;
create policy skincare_ingredients_service_all
on public.skincare_ingredients
for all
to service_role
using (true)
with check (true);

drop policy if exists dermatology_condition_ingredients_service_all on public.dermatology_condition_ingredients;
create policy dermatology_condition_ingredients_service_all
on public.dermatology_condition_ingredients
for all
to service_role
using (true)
with check (true);

drop policy if exists skin_outcomes_service_all on public.skin_outcomes;
create policy skin_outcomes_service_all
on public.skin_outcomes
for all
to service_role
using (true)
with check (true);

grant select on public.dermatology_conditions to authenticated;
grant select on public.skincare_ingredients to authenticated;
grant select on public.dermatology_condition_ingredients to authenticated;
grant select on public.skin_outcomes to authenticated;

grant all on table public.dermatology_conditions to service_role;
grant all on table public.skincare_ingredients to service_role;
grant all on table public.dermatology_condition_ingredients to service_role;
grant all on table public.skin_outcomes to service_role;

insert into public.dermatology_conditions (
  slug,
  condition_name,
  description,
  symptoms,
  recommended_ingredients,
  contraindications
)
values
  ('acne', 'Acne', 'Inflamacao, cravos e lesoes leves a moderadas.', 'oleosidade, poros, lesoes, textura irregular', 'acido salicilico, niacinamida, centella asiatica', 'evitar excesso de ativos esfoliantes em pele sensibilizada'),
  ('dark-spots', 'Manchas', 'Hipercromia pos-inflamatoria e manchas visiveis.', 'tom desigual, marcas residuais, brilho irregular', 'vitamina c, niacinamida, acido tranexamico', 'cautela com irritacao e combinacoes agressivas de acidos'),
  ('rosacea', 'Rosacea', 'Pele reativa com vermelhidao e desconforto.', 'ardor, vermelhidao, sensibilidade', 'centella asiatica, ceramidas, pantenol', 'evitar fragrancias fortes, retinoides intensos e esfoliacao excessiva'),
  ('dehydration', 'Desidratacao', 'Baixa retencao de agua e perda de conforto cutaneo.', 'repuxamento, opacidade, textura fina', 'ceramidas, acido hialuronico, glicerina', 'evitar limpeza agressiva e excesso de alcool'),
  ('aging', 'Envelhecimento', 'Linhas finas, perda de elasticidade e viço.', 'rugas, textura, perda de firmeza', 'retinol, peptideos, vitamina c', 'cautela com uso combinado de retinoides em pele sensibilizada'),
  ('barrier-damage', 'Barreira fragilizada', 'Deficit de reparacao e alta reatividade.', 'ardor, ressecamento, sensibilidade', 'ceramidas, centella asiatica, pantenol', 'evitar exfoliantes fortes e fragrancias intensas')
on conflict (slug) do update set
  condition_name = excluded.condition_name,
  description = excluded.description,
  symptoms = excluded.symptoms,
  recommended_ingredients = excluded.recommended_ingredients,
  contraindications = excluded.contraindications,
  updated_at = now();

insert into public.skincare_ingredients (
  slug,
  name,
  benefits,
  skin_conditions
)
values
  ('niacinamide', 'Niacinamida', 'Apoia barreira, ajuda no tom desigual e na oleosidade.', 'manchas, acne, textura'),
  ('ceramides', 'Ceramidas', 'Reforcam a barreira e melhoram conforto e hidratacao.', 'desidratacao, sensibilidade, barreira'),
  ('retinol', 'Retinol', 'Melhora textura, linhas e sinais de envelhecimento.', 'rugas, textura, firmeza'),
  ('hyaluronic-acid', 'Acido Hialuronico', 'Atrai agua e aumenta a hidratacao aparente.', 'desidratacao, viço'),
  ('centella-asiatica', 'Centella Asiatica', 'Acalma, reduz sensacao de sensibilidade e ajuda na recuperacao.', 'rosacea, acne, sensibilidade'),
  ('salicylic-acid', 'Acido Salicilico', 'Auxilia na desobstrucao de poros e controle de acne.', 'acne, poros, oleosidade'),
  ('vitamin-c', 'Vitamina C', 'Apoia brilho e uniformizacao do tom.', 'manchas, opacidade'),
  ('panthenol', 'Pantenol', 'Conforto e reparacao da pele sensibilizada.', 'barreira, sensibilidade')
on conflict (slug) do update set
  name = excluded.name,
  benefits = excluded.benefits,
  skin_conditions = excluded.skin_conditions,
  updated_at = now();

insert into public.dermatology_condition_ingredients (condition_id, ingredient_id, recommendation_strength, notes)
select c.id, i.id, link.recommendation_strength, link.notes
from (
  values
    ('acne', 'salicylic-acid', 0.95::numeric, 'Melhor aderencia para poros e lesoes leves.'),
    ('acne', 'niacinamide', 0.82::numeric, 'Apoio para oleosidade e marcas residuais.'),
    ('acne', 'centella-asiatica', 0.74::numeric, 'Bom para acne com sensibilidade.'),
    ('dark-spots', 'vitamin-c', 0.9::numeric, 'Apoio ao brilho e tom desigual.'),
    ('dark-spots', 'niacinamide', 0.82::numeric, 'Ajuda na uniformidade.'),
    ('dehydration', 'ceramides', 0.94::numeric, 'Base de reparacao e retencao.'),
    ('dehydration', 'hyaluronic-acid', 0.88::numeric, 'Apoio de hidratacao imediata.'),
    ('rosacea', 'centella-asiatica', 0.9::numeric, 'Calmante prioritario.'),
    ('rosacea', 'panthenol', 0.8::numeric, 'Suporte de conforto.'),
    ('aging', 'retinol', 0.9::numeric, 'Ativo de performance para linhas.'),
    ('aging', 'vitamin-c', 0.74::numeric, 'Apoio antioxidante e brilho.'),
    ('barrier-damage', 'ceramides', 0.96::numeric, 'Prioridade de reparacao.'),
    ('barrier-damage', 'panthenol', 0.84::numeric, 'Conforto e recuperacao.'),
    ('barrier-damage', 'centella-asiatica', 0.8::numeric, 'Acalma e reduz reatividade.')
) as link(condition_slug, ingredient_slug, recommendation_strength, notes)
join public.dermatology_conditions c on c.slug = link.condition_slug
join public.skincare_ingredients i on i.slug = link.ingredient_slug
on conflict (condition_id, ingredient_id) do update set
  recommendation_strength = excluded.recommendation_strength,
  notes = excluded.notes;
