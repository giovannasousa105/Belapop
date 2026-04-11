-- =========================================================
-- SkinGPT Evidence Sources
-- =========================================================

update public.dermatology_documents
set
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'source_family', 'belapop_clinical_notes',
    'study_type', 'expert_note',
    'evidence_level', 'low',
    'published_year', 2026,
    'last_reviewed_at', '2026-03-11'
  ),
  updated_at = now()
where source_label = 'BelaPop Clinical Notes';

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
    'acne-jama-review-2021',
    'Management of Acne Vulgaris: A Review',
    'acne',
    'Resumo pratico: acne leve a moderada costuma responder melhor a combinacoes bem toleradas, com retinoide topico, peroxido de benzoila e, em alguns perfis, acido azelaico. O ponto central nao e secar a pele o maximo possivel, e sim desinflamar sem destruir a barreira.',
    'JAMA',
    'https://jamanetwork.com/journals/jama/fullarticle/2786495',
    jsonb_build_object(
      'source_family', 'jama',
      'study_type', 'review',
      'evidence_level', 'moderate',
      'published_year', 2021,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('acne', 'retinoid', 'benzoyl-peroxide', 'azelaic-acid')
    )
  ),
  (
    'acne-cochrane-benzoyl-peroxide-2020',
    'Topical benzoyl peroxide for acne',
    'acne',
    'Resumo pratico: o peroxido de benzoila melhora acne inflamatoria em comparacao com placebo, mas irritacao e ressecamento sao comuns. Para pele sensivel, a tendencia e funcionar melhor quando a frequencia sobe devagar e a rotina mantem hidratacao adequada.',
    'Cochrane',
    'https://www.cochrane.org/evidence/CD011154_topical-benzoyl-peroxide-acne',
    jsonb_build_object(
      'source_family', 'cochrane',
      'study_type', 'systematic_review',
      'evidence_level', 'high',
      'published_year', 2020,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('acne', 'benzoyl-peroxide', 'irritation', 'tolerability')
    )
  ),
  (
    'rosacea-pubmed-review-2024',
    'Rosacea treatment review and evidence update',
    'rosacea',
    'Resumo pratico: em rosacea, a evidenca mais util para o dia a dia favorece rotina curta, controle de gatilhos, barreira estavel e tratamento anti-inflamatorio progressivo. Quanto mais reativa a pele, maior o ganho ao simplificar a rotina antes de adicionar ativos.',
    'PubMed',
    'https://pubmed.ncbi.nlm.nih.gov/?term=rosacea+treatment+systematic+review+2024',
    jsonb_build_object(
      'source_family', 'pubmed',
      'study_type', 'systematic_review',
      'evidence_level', 'moderate',
      'published_year', 2024,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('rosacea', 'inflammation', 'trigger-control', 'barrier')
    )
  ),
  (
    'dark-spots-pubmed-systematic-review-2024',
    'Topical Treatment for Postinflammatory Hyperpigmentation: A Systematic Review',
    'dark-spots',
    'Resumo pratico: para manchas, a combinacao mais coerente costuma ser fotoprotecao diaria e clareadores que a pele tolera bem. Niacinamida, vitamina C, acido tranexamico e acido azelaico aparecem de forma recorrente como opcoes razoaveis, desde que a barreira esteja calma.',
    'PubMed',
    'https://pubmed.ncbi.nlm.nih.gov/?term=Topical+treatment+for+postinflammatory+hyperpigmentation+a+systematic+review',
    jsonb_build_object(
      'source_family', 'pubmed',
      'study_type', 'systematic_review',
      'evidence_level', 'moderate',
      'published_year', 2024,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('hyperpigmentation', 'vitamin-c', 'tranexamic-acid', 'niacinamide', 'spf')
    )
  ),
  (
    'barrier-ceramides-pubmed-review-2024',
    'The Role of Ceramides in Skin Barrier Function',
    'barrier-damage',
    'Resumo pratico: quando a barreira esta fragilizada, ceramidas e hidratacao consistente tendem a devolver tolerancia antes de qualquer rotina mais agressiva. Em pele ardendo, o melhor resultado costuma vir de reduzir etapas e remover ativos irritativos por alguns dias ou semanas.',
    'PubMed',
    'https://pubmed.ncbi.nlm.nih.gov/?term=The+role+of+ceramides+in+skin+barrier+function',
    jsonb_build_object(
      'source_family', 'pubmed',
      'study_type', 'review',
      'evidence_level', 'moderate',
      'published_year', 2024,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('ceramides', 'barrier', 'dehydration', 'repair')
    )
  ),
  (
    'dehydration-ceramides-pubmed-review-2024',
    'Ceramide-focused barrier repair for dry and dehydrated skin',
    'dehydration',
    'Resumo pratico: pele desidratada tende a melhorar mais com limpeza suave, humectantes e reparo de barreira do que com excesso de ativos. Quando a pele esta repuxando, o ganho maior normalmente vem de consistencia, menos friccao e melhor selagem.',
    'PubMed',
    'https://pubmed.ncbi.nlm.nih.gov/?term=ceramides+skin+barrier+function+review',
    jsonb_build_object(
      'source_family', 'pubmed',
      'study_type', 'review',
      'evidence_level', 'moderate',
      'published_year', 2024,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('dehydration', 'humectants', 'ceramides', 'barrier')
    )
  ),
  (
    'aging-pubmed-retinoid-review-2025',
    'Tretinoin for Improving Photoaged Skin: A Systematic Review',
    'aging',
    'Resumo pratico: para fotoenvelhecimento e linhas finas, retinoide continua sendo um dos pilares com melhor respaldo, mas so quando entra de forma gradual e com fotoprotecao diaria. Tolerancia e aderencia costumam importar mais do que intensidade inicial.',
    'PubMed',
    'https://pubmed.ncbi.nlm.nih.gov/?term=Tretinoin+for+improving+photoaged+skin+a+systematic+review',
    jsonb_build_object(
      'source_family', 'pubmed',
      'study_type', 'systematic_review',
      'evidence_level', 'moderate',
      'published_year', 2025,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('aging', 'retinoid', 'photoaging', 'tretinoin', 'sunscreen')
    )
  ),
  (
    'general-evidence-ladder-2026',
    'How SkinGPT prioritizes evidence',
    'general',
    'Resumo pratico: quando houver mais de uma fonte sobre o mesmo tema, a ordem de prioridade deve ser sumario clinico atualizado, revisao Cochrane, review ou guideline de alto impacto e, depois, revisoes indexadas no PubMed. Notas editoriais entram como apoio, nunca como base principal quando existe evidencia melhor.',
    'BelaPop Clinical Notes',
    null,
    jsonb_build_object(
      'source_family', 'belapop_clinical_notes',
      'study_type', 'expert_note',
      'evidence_level', 'low',
      'published_year', 2026,
      'last_reviewed_at', '2026-03-11',
      'tags', jsonb_build_array('evidence', 'cochrane', 'jama', 'pubmed', 'uptodate')
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
