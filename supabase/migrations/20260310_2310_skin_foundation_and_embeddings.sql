-- =========================================================
-- Skin Foundation Model + Embeddings
-- =========================================================

create extension if not exists vector with schema extensions;

create table if not exists public.skin_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  face_scan_id uuid references public.face_scans(id) on delete cascade,
  skin_scan_id uuid references public.skin_scans(id) on delete cascade,
  embedding extensions.vector(128) not null,
  embedding_version text not null default 'heuristic_v1',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skin_embeddings_face_scan_unique unique (face_scan_id)
);

create index if not exists idx_skin_embeddings_user_created
  on public.skin_embeddings (user_id, created_at desc);

drop trigger if exists trg_skin_embeddings_updated on public.skin_embeddings;
create trigger trg_skin_embeddings_updated
before update on public.skin_embeddings
for each row execute function public.set_updated_at();

create table if not exists public.dermatology_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  topic_slug text not null,
  body text not null,
  source_label text,
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dermatology_documents_topic
  on public.dermatology_documents (topic_slug, created_at desc);

drop trigger if exists trg_dermatology_documents_updated on public.dermatology_documents;
create trigger trg_dermatology_documents_updated
before update on public.dermatology_documents
for each row execute function public.set_updated_at();

alter table public.skin_embeddings enable row level security;
alter table public.dermatology_documents enable row level security;

drop policy if exists skin_embeddings_owner_read on public.skin_embeddings;
create policy skin_embeddings_owner_read
on public.skin_embeddings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists dermatology_documents_public_read on public.dermatology_documents;
create policy dermatology_documents_public_read
on public.dermatology_documents
for select
to authenticated
using (true);

drop policy if exists skin_embeddings_service_all on public.skin_embeddings;
create policy skin_embeddings_service_all
on public.skin_embeddings
for all
to service_role
using (true)
with check (true);

drop policy if exists dermatology_documents_service_all on public.dermatology_documents;
create policy dermatology_documents_service_all
on public.dermatology_documents
for all
to service_role
using (true)
with check (true);

grant select on public.skin_embeddings to authenticated;
grant select on public.dermatology_documents to authenticated;

grant all on table public.skin_embeddings to service_role;
grant all on table public.dermatology_documents to service_role;

insert into public.dermatology_documents (
  slug,
  title,
  topic_slug,
  body,
  source_label,
  source_url,
  metadata
)
values
  (
    'acne-barrier-balance',
    'Acne com barreira preservada',
    'acne',
    'Em cenarios de acne leve a moderada, a prioridade e controlar poros e inflamacao sem quebrar a barreira. Acidos queratoliticos em baixa frequencia, niacinamida e ativos calmantes costumam funcionar melhor do que excesso de limpeza.',
    'BelaPop Clinical Notes',
    null,
    jsonb_build_object('tags', jsonb_build_array('acne', 'barreira', 'oleosidade'))
  ),
  (
    'hyperpigmentation-progressive-brightening',
    'Uniformizacao progressiva do tom',
    'dark-spots',
    'Manchas e hipercromia respondem melhor a consistencia, fotoprotecao e ativos de brilho com baixo potencial irritativo. Vitamina C, niacinamida e acido tranexamico tendem a performar melhor quando a barreira esta estavel.',
    'BelaPop Clinical Notes',
    null,
    jsonb_build_object('tags', jsonb_build_array('manchas', 'vitamina-c', 'fotoprotecao'))
  ),
  (
    'rosacea-minimalist-repair',
    'Rosacea e pele reativa',
    'rosacea',
    'Pele reativa exige rotina curta, calmante e sem friccao excessiva. Ceramidas, centella asiatica e pantenol priorizam conforto. O foco deve ser reduzir estimulos irritativos e proteger a barreira.',
    'BelaPop Clinical Notes',
    null,
    jsonb_build_object('tags', jsonb_build_array('rosacea', 'sensibilidade', 'ceramidas'))
  ),
  (
    'dehydration-water-retention',
    'Desidratacao e retencao de agua',
    'dehydration',
    'Baixa hidratacao aparente pede limpeza suave, humectantes e selagem de barreira. Acido hialuronico, glicerina e ceramidas ajudam mais quando combinados com rotina consistente e menor agressao surfactante.',
    'BelaPop Clinical Notes',
    null,
    jsonb_build_object('tags', jsonb_build_array('desidratacao', 'ceramidas', 'humectantes'))
  ),
  (
    'aging-gradual-retinoid-routine',
    'Linhas finas e estrategia gradual',
    'aging',
    'Para linhas finas e perda de elasticidade, a progressao gradual importa mais que intensidade imediata. Retinol, antioxidantes e fotoprotecao tendem a entregar melhor resultado com aderencia alta e baixa irritacao.',
    'BelaPop Clinical Notes',
    null,
    jsonb_build_object('tags', jsonb_build_array('aging', 'retinol', 'antioxidantes'))
  ),
  (
    'barrier-damage-repair-first',
    'Barreira em primeiro lugar',
    'barrier-damage',
    'Quando a barreira esta fragilizada, quase toda decisao deve priorizar reparacao. Pausar excesso de ativos, reduzir friccao e concentrar a rotina em ceramidas, pantenol e ativos calmantes acelera a retomada da performance.',
    'BelaPop Clinical Notes',
    null,
    jsonb_build_object('tags', jsonb_build_array('barreira', 'reparacao', 'pantenol'))
  ),
  (
    'foundation-general-discipline',
    'Disciplina e resposta cutanea',
    'general',
    'A mesma rotina costuma performar melhor quando a usuaria mantem aderencia, reduz combinacoes agressivas e respeita janela de observacao. Em skincare, constancia supera excesso.',
    'BelaPop Clinical Notes',
    null,
    jsonb_build_object('tags', jsonb_build_array('aderencia', 'consistencia', 'rotina'))
  )
on conflict (slug) do update set
  title = excluded.title,
  topic_slug = excluded.topic_slug,
  body = excluded.body,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  metadata = excluded.metadata,
  updated_at = now();
