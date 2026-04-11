-- =========================================================
-- SkinGPT Evidence Curation + Source Ingestion
-- =========================================================

alter table public.dermatology_documents
  add column if not exists status text not null default 'published',
  add column if not exists editorial_boost integer not null default 0,
  add column if not exists published_at timestamptz;

alter table public.dermatology_documents
  drop constraint if exists dermatology_documents_status_check;

alter table public.dermatology_documents
  add constraint dermatology_documents_status_check
  check (status in ('draft', 'published', 'archived'));

alter table public.dermatology_documents
  drop constraint if exists dermatology_documents_editorial_boost_check;

alter table public.dermatology_documents
  add constraint dermatology_documents_editorial_boost_check
  check (editorial_boost >= 0 and editorial_boost <= 100);

update public.dermatology_documents
set
  status = coalesce(status, 'published'),
  editorial_boost = coalesce(editorial_boost, 0),
  published_at = coalesce(published_at, created_at)
where true;

create index if not exists idx_dermatology_documents_status_topic
  on public.dermatology_documents (status, topic_slug, editorial_boost desc, published_at desc, updated_at desc);

drop function if exists public.search_dermatology_documents(extensions.vector, integer, text);

create function public.search_dermatology_documents(
  p_query_embedding extensions.vector(128),
  p_limit integer default 4,
  p_topic_slug text default null
)
returns table (
  id uuid,
  slug text,
  title text,
  topic_slug text,
  body text,
  source_label text,
  source_url text,
  editorial_boost integer,
  published_at timestamptz,
  similarity numeric
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select
    dd.id,
    dd.slug,
    dd.title,
    dd.topic_slug,
    dd.body,
    dd.source_label,
    dd.source_url,
    dd.editorial_boost,
    dd.published_at,
    round(greatest(0::numeric, (1 - (dd.embedding <=> p_query_embedding))::numeric), 4) as similarity
  from public.dermatology_documents dd
  where dd.embedding is not null
    and dd.status = 'published'
    and (
      p_topic_slug is null
      or dd.topic_slug = p_topic_slug
      or dd.topic_slug = 'general'
    )
  order by dd.embedding <=> p_query_embedding asc, dd.editorial_boost desc, dd.published_at desc nulls last, dd.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 4), 8));
$$;

grant execute on function public.search_dermatology_documents(extensions.vector, integer, text)
  to authenticated, service_role;

drop policy if exists dermatology_documents_public_read on public.dermatology_documents;
create policy dermatology_documents_public_read
on public.dermatology_documents
for select
 to authenticated
using (status = 'published');

insert into public.dermatology_documents (
  slug,
  title,
  topic_slug,
  body,
  source_label,
  source_url,
  status,
  editorial_boost,
  published_at,
  metadata
)
values
  (
    'acne-jaad-guideline-2024',
    'Guidelines of care for the management of acne vulgaris',
    'acne',
    'Leitura pratica: para acne, a melhor base continua sendo combinacao de peroxido de benzoila, retinoide topico e escalonamento cuidadoso para terapias sistemicas quando houver cicatriz, carga psicossocial ou falha de topicos. O ponto central para o SkinGPT e evitar excesso de secativos e preservar a barreira enquanto controla inflamacao.',
    'JAAD',
    'https://pubmed.ncbi.nlm.nih.gov/38300170/',
    'published',
    14,
    '2026-03-11T00:00:00Z',
    jsonb_build_object(
      'source_family', 'jaad',
      'study_type', 'guideline',
      'evidence_level', 'level_1',
      'published_year', 2024,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('acne', 'benzoyl-peroxide', 'topical-retinoids', 'isotretinoin', 'guideline')
    )
  ),
  (
    'rosacea-jama-dermatology-erenumab-2024',
    'Erenumab for Treatment of Persistent Erythema and Flushing in Rosacea',
    'rosacea',
    'Leitura pratica: para rosacea com vermelhidao e flushing persistentes, este estudo aponta um caminho biologico promissor, mas ainda nao muda sozinho a rotina do dia a dia. Para a usuaria, a traducao segura continua sendo rotina curta, gatilhos sob controle e introducao conservadora de ativos enquanto a evidencia de novas terapias amadurece.',
    'JAMA Dermatology',
    'https://jamanetwork.com/journals/jamadermatology/fullarticle/2817738',
    'published',
    12,
    '2026-03-11T00:00:00Z',
    jsonb_build_object(
      'source_family', 'jama_dermatology',
      'study_type', 'clinical_trial',
      'evidence_level', 'moderate',
      'published_year', 2024,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('rosacea', 'erythema', 'flushing', 'cgrp', 'clinical-trial')
    )
  ),
  (
    'dark-spots-bjd-melasma-topical-meta-2022',
    'Self-applied topical interventions for melasma: a systematic review and meta-analysis of randomized trials',
    'dark-spots',
    'Leitura pratica: para manchas e melasma, a base mais defensavel continua sendo fotoprotecao diaria e escolhas topicas com boa tolerancia. A meta-analise reforca que clareadores topicos e combinacoes bem selecionadas funcionam melhor que trocas frequentes e protocolos agressivos em pele irritada.',
    'British Journal of Dermatology',
    'https://academic.oup.com/bjd/article/187/3/309/6966577',
    'published',
    12,
    '2026-03-11T00:00:00Z',
    jsonb_build_object(
      'source_family', 'bjd',
      'study_type', 'meta_analysis',
      'evidence_level', 'level_1',
      'published_year', 2022,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('melasma', 'dark-spots', 'topical-treatment', 'tranexamic-acid', 'photoprotection')
    )
  ),
  (
    'acne-abd-adult-female-acne-guide-2019',
    'Adult female acne: a guide to clinical practice',
    'acne',
    'Leitura pratica: acne feminina adulta costuma pedir manutencao longa, leitura hormonal e rotina menos irritativa do que a acne do adolescente. Para o SkinGPT, esse documento ajuda a traduzir acne persistente com sensibilidade e recidiva, principalmente na metade inferior do rosto.',
    'Anais Brasileiros de Dermatologia',
    'https://www.anaisdedermatologia.org.br/en-download-pdf-S0365059620302658',
    'published',
    10,
    '2026-03-11T00:00:00Z',
    jsonb_build_object(
      'source_family', 'abd',
      'study_type', 'guideline',
      'evidence_level', 'moderate',
      'published_year', 2019,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('acne', 'adult-female-acne', 'maintenance', 'hormonal-pattern')
    )
  ),
  (
    'rosacea-abd-consensus-2020',
    'Consensus on the therapeutic management of rosacea - Brazilian Society of Dermatology',
    'rosacea',
    'Leitura pratica: o consenso brasileiro reforca que rosacea melhora mais quando a rotina protege a barreira e evita gatilhos do que quando se empilha ativo irritativo. Limpeza suave, hidratacao com ceramidas e fotoprotecao entram como base antes de qualquer escalada.',
    'Anais Brasileiros de Dermatologia',
    'https://www.anaisdedermatologia.org.br/en-consensus-on-therapeutic-management-rosacea-articulo-S0365059620302543',
    'published',
    14,
    '2026-03-11T00:00:00Z',
    jsonb_build_object(
      'source_family', 'abd',
      'study_type', 'guideline',
      'evidence_level', 'high',
      'published_year', 2020,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('rosacea', 'ceramides', 'hyaluronic-acid', 'niacinamide', 'trigger-control')
    )
  ),
  (
    'rosacea-lilacs-dermocosmetic-care-2017',
    'Dermocosmetic care for rosacea',
    'rosacea',
    'Leitura pratica: para rosacea e pele muito reativa, a literatura indexada em LILACS sustenta bem o papel da dermocosmetica como suporte para reduzir ardor, sensibilidade e desidratacao. Na conversa com a usuaria, isso vira uma recomendacao objetiva de rotina curta, sem friccao, com foco em conforto e reparo.',
    'LILACS',
    'https://pesquisa.bvsalud.org/portal/resource/enl/biblio-889438',
    'published',
    8,
    '2026-03-11T00:00:00Z',
    jsonb_build_object(
      'source_family', 'lilacs',
      'study_type', 'review',
      'evidence_level', 'moderate',
      'published_year', 2017,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('rosacea', 'dermocosmetics', 'sensitive-skin', 'barrier', 'quality-of-life')
    )
  ),
  (
    'dark-spots-lilacs-melasma-review-2014',
    'Melasma: a clinical and epidemiological review',
    'dark-spots',
    'Leitura pratica: o registro indexado em LILACS reforca o perfil epidemiologico do melasma na America Latina e a necessidade de fotoprotecao rigorosa, controle de calor e prudencia com irritantes. Isso ajuda o SkinGPT a traduzir recidiva e agravantes do cotidiano de forma simples para a usuaria brasileira.',
    'LILACS',
    'https://pesquisa.bvsalud.org/portal/resource/e/lil-720785',
    'published',
    7,
    '2026-03-11T00:00:00Z',
    jsonb_build_object(
      'source_family', 'lilacs',
      'study_type', 'review',
      'evidence_level', 'moderate',
      'published_year', 2014,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('melasma', 'dark-spots', 'epidemiology', 'sun-exposure', 'pregnancy')
    )
  ),
  (
    'dark-spots-scielo-melasma-survey-2024',
    'Factors associated with facial melasma severity in Brazilian women: an internet-based survey',
    'dark-spots',
    'Leitura pratica: no contexto brasileiro, este estudo em SciELO reforca fatores que costumam piorar o melasma no dia a dia, como sol, calor e estresse. Para o SkinGPT, isso entra como orientacao comportamental concreta: fotoprotecao disciplinada, reducao de calor e cuidado com inflamacao recorrente.',
    'SciELO',
    'https://www.scielo.br/j/abd/a/LGWmq3KcDpvDxTyfcsRMs6j/',
    'published',
    9,
    '2026-03-11T00:00:00Z',
    jsonb_build_object(
      'source_family', 'scielo',
      'study_type', 'specialty_journal',
      'evidence_level', 'moderate',
      'published_year', 2024,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('melasma', 'dark-spots', 'heat-exposure', 'stress', 'brazil')
    )
  ),
  (
    'acne-scielo-adult-female-acne-2019',
    'Adult female acne: a guide to clinical practice',
    'acne',
    'Leitura pratica: a versao aberta em SciELO e valiosa para manter uma base brasileira acessivel sobre acne feminina adulta. Ela reforca que manutencao, aderencia e leitura hormonal importam mais do que alternar muitos produtos irritativos sem estrategia.',
    'SciELO',
    'https://www.scielo.br/j/abd/a/qXdkswPvSxTtFyc4LzGswYx/?format=pdf&lang=en',
    'published',
    6,
    '2026-03-11T00:00:00Z',
    jsonb_build_object(
      'source_family', 'scielo',
      'study_type', 'specialty_journal',
      'evidence_level', 'moderate',
      'published_year', 2019,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('acne', 'adult-female-acne', 'brazil', 'maintenance', 'sensitive-skin')
    )
  )
on conflict (slug) do update set
  title = excluded.title,
  topic_slug = excluded.topic_slug,
  body = excluded.body,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  status = excluded.status,
  editorial_boost = excluded.editorial_boost,
  published_at = excluded.published_at,
  metadata = excluded.metadata,
  updated_at = now();
