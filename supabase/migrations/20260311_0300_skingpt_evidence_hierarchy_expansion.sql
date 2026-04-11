-- =========================================================
-- SkinGPT Evidence Hierarchy Expansion
-- =========================================================

update public.dermatology_documents
set
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'evidence_level',
    case
      when (coalesce(metadata, '{}'::jsonb)->>'study_type') in ('systematic_review', 'meta_analysis', 'umbrella_review', 'guideline')
        then 'level_1'
      when (coalesce(metadata, '{}'::jsonb)->>'study_type') in ('randomized_trial', 'review')
        then 'level_2'
      else coalesce((coalesce(metadata, '{}'::jsonb)->>'evidence_level'), 'moderate')
    end,
    'last_reviewed_at', '2026-03-11'
  ),
  updated_at = now()
where slug in (
  'acne-jama-review-2021',
  'acne-cochrane-benzoyl-peroxide-2020',
  'rosacea-pubmed-review-2024',
  'dark-spots-pubmed-systematic-review-2024',
  'barrier-ceramides-pubmed-review-2024',
  'dehydration-ceramides-pubmed-review-2024',
  'aging-pubmed-retinoid-review-2025',
  'general-evidence-ladder-2026'
);

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
    'acne-aad-guideline-2024',
    'AAD acne guideline practical summary',
    'acne',
    'Resumo pratico: quando existe acne com tendencia inflamatoria, a melhor estrategia costuma ser combinar poucos ativos com boa tolerancia, subir a intensidade devagar e manter hidratacao e fotoprotecao. Na hierarquia do SkinGPT, diretrizes da AAD entram acima de reviews narrativas.',
    'AAD Clinical Guideline',
    'https://www.aad.org/member/clinical-quality/guidelines/acne',
    jsonb_build_object(
      'source_family', 'aad_guideline',
      'study_type', 'guideline',
      'evidence_level', 'level_1',
      'published_year', 2024,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('acne', 'guideline', 'aad', 'benzoyl-peroxide', 'retinoid')
    )
  ),
  (
    'rosacea-dermnet-clinical-reference-2026',
    'DermNet rosacea clinical reference',
    'rosacea',
    'Resumo pratico: rosacea tende a responder melhor a rotina curta, barreira preservada e controle de gatilhos. O SkinGPT usa DermNet como referencia clinica confiavel e acessivel, mas abaixo de revisoes sistematicas e guidelines de alto nivel.',
    'DermNet',
    'https://dermnetnz.org/topics/rosacea',
    jsonb_build_object(
      'source_family', 'dermnet',
      'study_type', 'clinical_reference',
      'evidence_level', 'moderate',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('rosacea', 'clinical-reference', 'dermnet', 'barrier', 'trigger-control')
    )
  ),
  (
    'general-uptodate-point-of-care-2026',
    'UpToDate as premium point-of-care summary',
    'general',
    'Na hierarquia do SkinGPT, quando houver documento licenciado do UpToDate no banco, ele entra como sumario clinico premium, acima de reviews narrativas e abaixo apenas de evidencia nivel 1 mais especifica para a pergunta.',
    'UpToDate',
    'https://www.wolterskluwer.com/en/solutions/uptodate',
    jsonb_build_object(
      'source_family', 'uptodate',
      'study_type', 'living_summary',
      'evidence_level', 'high',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('point-of-care', 'uptodate', 'evidence-hierarchy')
    )
  ),
  (
    'general-dynamed-point-of-care-2026',
    'DynaMed as evidence-based point-of-care summary',
    'general',
    'Na hierarquia do SkinGPT, DynaMed entra como sumario clinico rapido e baseado em evidencia, com peso alto quando o documento estiver presente e atualizado.',
    'DynaMed',
    'https://www.dynamed.com/',
    jsonb_build_object(
      'source_family', 'dynamed',
      'study_type', 'living_summary',
      'evidence_level', 'high',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('point-of-care', 'dynamed', 'evidence-hierarchy')
    )
  ),
  (
    'general-bmj-best-practice-2026',
    'BMJ Best Practice as structured bedside summary',
    'general',
    'Na hierarquia do SkinGPT, BMJ Best Practice entra como sumario estruturado para decisao clinica. Ele recebe peso alto quando o documento estiver presente, mas continua abaixo de meta-analise e guideline especifica para o mesmo tema.',
    'BMJ Best Practice',
    'https://bestpractice.bmj.com/',
    jsonb_build_object(
      'source_family', 'bmj_best_practice',
      'study_type', 'living_summary',
      'evidence_level', 'high',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('point-of-care', 'bmj-best-practice', 'evidence-hierarchy')
    )
  ),
  (
    'general-visualdx-dermatology-2026',
    'VisualDx as visual support for dermatology',
    'general',
    'Na hierarquia do SkinGPT, VisualDx funciona como suporte clinico visual. Ele ajuda em comparacao de lesoes e padroes, mas nao sobe acima de revisoes sistematicas, ensaios randomizados ou guidelines dermatologicas.',
    'VisualDx',
    'https://www.visualdx.com/',
    jsonb_build_object(
      'source_family', 'visualdx',
      'study_type', 'visual_reference',
      'evidence_level', 'moderate',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('visual-support', 'visualdx', 'dermatology', 'evidence-hierarchy')
    )
  ),
  (
    'general-embase-literature-2026',
    'Embase as high-coverage pharmacology and clinical index',
    'general',
    'Na hierarquia do SkinGPT, Embase funciona como base de indexacao robusta para literatura clinica e farmacologica. O peso principal continua vindo do tipo de estudo encontrado ali, e nao so do nome da base.',
    'Embase',
    'https://www.elsevier.com/products/embase',
    jsonb_build_object(
      'source_family', 'embase',
      'study_type', 'index_database',
      'evidence_level', 'moderate',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('embase', 'indexed-literature', 'clinical-research')
    )
  ),
  (
    'general-lilacs-latam-evidence-2026',
    'LILACS as Latin American evidence source',
    'general',
    'Na hierarquia do SkinGPT, LILACS ganha valor especial quando a pergunta pede contexto brasileiro ou latino-americano. Ela nao substitui uma meta-analise, mas ajuda a evitar vies de ignorar evidencia regional relevante.',
    'LILACS',
    'https://lilacs.bvsalud.org/en/',
    jsonb_build_object(
      'source_family', 'lilacs',
      'study_type', 'index_database',
      'evidence_level', 'moderate',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('lilacs', 'latin-america', 'brazil', 'regional-evidence')
    )
  ),
  (
    'general-scielo-latam-evidence-2026',
    'SciELO as open Latin American evidence library',
    'general',
    'Na hierarquia do SkinGPT, SciELO reforca evidencia aberta da America Latina e do Brasil. Ela recebe boost contextual quando a pergunta pede adaptacao local ou fontes em portugues.',
    'SciELO',
    'https://scielo.org/en/',
    jsonb_build_object(
      'source_family', 'scielo',
      'study_type', 'index_database',
      'evidence_level', 'moderate',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('scielo', 'latin-america', 'brazil', 'regional-evidence')
    )
  ),
  (
    'general-web-of-science-research-index-2026',
    'Web of Science as cross-disciplinary citation index',
    'general',
    'Na hierarquia do SkinGPT, Web of Science serve como plataforma ampla de literatura cientifica e citacoes. O que pesa de verdade continua sendo a qualidade metodologica do estudo encontrado.',
    'Web of Science',
    'https://clarivate.com/products/scientific-and-academic-research/research-discovery-and-referencing/web-of-science/',
    jsonb_build_object(
      'source_family', 'web_of_science',
      'study_type', 'index_database',
      'evidence_level', 'moderate',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('web-of-science', 'citation-index', 'indexed-literature')
    )
  ),
  (
    'general-sciencedirect-full-text-2026',
    'ScienceDirect as full-text scientific library',
    'general',
    'Na hierarquia do SkinGPT, ScienceDirect entra como biblioteca ampla de texto completo. O sistema continua separando o peso do repositório do peso metodologico do estudo.',
    'ScienceDirect',
    'https://www.sciencedirect.com/',
    jsonb_build_object(
      'source_family', 'sciencedirect',
      'study_type', 'index_database',
      'evidence_level', 'moderate',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('sciencedirect', 'full-text', 'indexed-literature')
    )
  ),
  (
    'general-jaad-dermatology-journal-2026',
    'JAAD as high-impact dermatology journal',
    'general',
    'Na hierarquia do SkinGPT, JAAD entra como revista dermatologica de alto impacto. Revisoes sistematicas, guidelines e ensaios randomizados vindos dela recebem peso alto.',
    'JAAD',
    'https://www.jaad.org/',
    jsonb_build_object(
      'source_family', 'jaad',
      'study_type', 'specialty_journal',
      'evidence_level', 'high',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('jaad', 'dermatology', 'high-impact', 'journal')
    )
  ),
  (
    'general-jama-dermatology-journal-2026',
    'JAMA Dermatology as high-impact specialty source',
    'general',
    'Na hierarquia do SkinGPT, JAMA Dermatology entra como fonte dermatologica de alto impacto. Meta-analises, revisoes sistematicas e ensaios clinicos dela recebem peso alto.',
    'JAMA Dermatology',
    'https://jamanetwork.com/journals/jamadermatology',
    jsonb_build_object(
      'source_family', 'jama_dermatology',
      'study_type', 'specialty_journal',
      'evidence_level', 'high',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('jama-dermatology', 'dermatology', 'high-impact', 'journal')
    )
  ),
  (
    'general-bjd-dermatology-journal-2026',
    'British Journal of Dermatology as specialty evidence source',
    'general',
    'Na hierarquia do SkinGPT, BJD entra como revista dermatologica relevante para estudos clinicos, revisoes e diretrizes interpretadas no contexto de pele.',
    'British Journal of Dermatology',
    'https://academic.oup.com/bjd',
    jsonb_build_object(
      'source_family', 'bjd',
      'study_type', 'specialty_journal',
      'evidence_level', 'high',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('bjd', 'dermatology', 'journal', 'high-impact')
    )
  ),
  (
    'general-abd-brazilian-dermatology-2026',
    'Anais Brasileiros de Dermatologia as official Brazilian dermatology journal',
    'general',
    'Na hierarquia do SkinGPT, Anais Brasileiros de Dermatologia entram como referencia brasileira oficial da Sociedade Brasileira de Dermatologia, com peso extra quando a pergunta exige contexto local ou pratica nacional.',
    'Anais Brasileiros de Dermatologia',
    'https://www.anaisdedermatologia.org.br/',
    jsonb_build_object(
      'source_family', 'abd',
      'study_type', 'specialty_journal',
      'evidence_level', 'high',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('abd', 'brazil', 'sbd', 'dermatology', 'journal')
    )
  ),
  (
    'general-bad-guidelines-2026',
    'BAD clinical guidelines for dermatology',
    'general',
    'Na hierarquia do SkinGPT, diretrizes da British Association of Dermatologists entram como evidencia nivel 1 quando o documento e diretamente aplicavel ao problema da pele em questao.',
    'British Association of Dermatologists',
    'https://www.bad.org.uk/healthcare-professionals/clinical-standards/clinical-guidelines/',
    jsonb_build_object(
      'source_family', 'bad_guideline',
      'study_type', 'guideline',
      'evidence_level', 'level_1',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('bad', 'guideline', 'dermatology', 'level-1')
    )
  ),
  (
    'general-ecri-guidelines-2026',
    'ECRI guideline trust as evidence curation source',
    'general',
    'Na hierarquia do SkinGPT, ECRI entra como camada de validacao e curadoria de guidelines. Nao substitui o guideline original, mas ajuda a reforcar selecao de diretrizes confiaveis.',
    'ECRI Guidelines Trust',
    'https://guidelines.ecri.org/',
    jsonb_build_object(
      'source_family', 'ecri_guideline',
      'study_type', 'guideline',
      'evidence_level', 'level_1',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('ecri', 'guideline', 'curation', 'level-1')
    )
  ),
  (
    'general-cebd-dermatology-evidence-2026',
    'Centre of Evidence Based Dermatology as methods-oriented source',
    'general',
    'Na hierarquia do SkinGPT, o Centre of Evidence Based Dermatology ajuda como referencia metodologica e de pesquisa em doencas de pele, reforcando interpretacao de evidencia forte.',
    'Centre of Evidence Based Dermatology',
    'https://www.nottingham.ac.uk/research/groups/cebd/',
    jsonb_build_object(
      'source_family', 'cebd',
      'study_type', 'evidence_center',
      'evidence_level', 'high',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('cebd', 'dermatology', 'evidence-methods')
    )
  ),
  (
    'general-evidence-ladder-latam-and-dermatology-2026',
    'How SkinGPT now prioritizes dermatology evidence',
    'general',
    'Resumo pratico: quando houver mais de uma fonte para a mesma pergunta, o SkinGPT sobe primeiro sumarios clinicos confiaveis e atualizados, depois diretrizes dermatologicas, revisoes Cochrane, meta-analises, revisoes sistematicas e ensaios randomizados. Bases indexadoras como PubMed, Embase, LILACS, SciELO, Web of Science e ScienceDirect entram para localizar estudos, enquanto ABD, JAAD, JAMA Dermatology, BJD e DermNet ajudam a contextualizar dermatologia e Brasil.',
    'BelaPop Clinical Notes',
    null,
    jsonb_build_object(
      'source_family', 'belapop_clinical_notes',
      'study_type', 'expert_note',
      'evidence_level', 'low',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('evidence', 'uptodate', 'dynamed', 'bmj-best-practice', 'cochrane', 'pubmed', 'embase', 'lilacs', 'scielo', 'abd')
    )
  )
on conflict (slug) do update set
  title = excluded.title,
  topic_slug = excluded.topic_slug,
  body = excluded.body,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  metadata = excluded.metadata,
  updated_at = now();
