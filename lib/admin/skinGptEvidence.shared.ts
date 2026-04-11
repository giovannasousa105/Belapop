export const SKINGPT_EVIDENCE_STATUSES = ["draft", "published", "archived"] as const;

export type SkinGptEvidenceStatus = (typeof SKINGPT_EVIDENCE_STATUSES)[number];

export const SKINGPT_EVIDENCE_TOPICS = [
  { slug: "acne", label: "Acne" },
  { slug: "rosacea", label: "Rosacea" },
  { slug: "dark-spots", label: "Manchas e pigmentacao" },
  { slug: "dehydration", label: "Desidratacao" },
  { slug: "aging", label: "Envelhecimento" },
  { slug: "barrier-damage", label: "Barreira fragilizada" },
  { slug: "general", label: "Geral" }
] as const;

export const SKINGPT_EVIDENCE_SOURCE_FAMILIES = [
  { key: "uptodate", label: "UpToDate" },
  { key: "dynamed", label: "DynaMed" },
  { key: "bmj_best_practice", label: "BMJ Best Practice" },
  { key: "cochrane", label: "Cochrane" },
  { key: "aad_guideline", label: "AAD" },
  { key: "bad_guideline", label: "BAD" },
  { key: "ecri_guideline", label: "ECRI" },
  { key: "jaad", label: "JAAD" },
  { key: "jama_dermatology", label: "JAMA Dermatology" },
  { key: "bjd", label: "British Journal of Dermatology" },
  { key: "abd", label: "Anais Brasileiros de Dermatologia" },
  { key: "lilacs", label: "LILACS" },
  { key: "scielo", label: "SciELO" },
  { key: "pubmed", label: "PubMed" },
  { key: "medline", label: "MEDLINE" },
  { key: "embase", label: "Embase" },
  { key: "web_of_science", label: "Web of Science" },
  { key: "sciencedirect", label: "ScienceDirect" },
  { key: "dermnet", label: "DermNet" },
  { key: "visualdx", label: "VisualDx" },
  { key: "cebd", label: "CEBD Nottingham" },
  { key: "belapop_clinical_notes", label: "BelaPop Clinical Notes" }
] as const;

export const SKINGPT_EVIDENCE_STUDY_TYPES = [
  { key: "living_summary", label: "Sumario clinico" },
  { key: "guideline", label: "Diretriz clinica" },
  { key: "meta_analysis", label: "Meta-analise" },
  { key: "systematic_review", label: "Revisao sistematica" },
  { key: "umbrella_review", label: "Umbrella review" },
  { key: "network_meta_analysis", label: "Meta-analise em rede" },
  { key: "randomized_trial", label: "Ensaio randomizado" },
  { key: "pragmatic_randomized_trial", label: "Ensaio randomizado pragmatico" },
  { key: "clinical_trial", label: "Ensaio clinico" },
  { key: "specialty_journal", label: "Revista dermatologica" },
  { key: "clinical_reference", label: "Referencia clinica" },
  { key: "visual_reference", label: "Referencia visual" },
  { key: "review", label: "Review" },
  { key: "narrative_review", label: "Revisao narrativa" },
  { key: "index_database", label: "Base indexadora" },
  { key: "evidence_center", label: "Centro de evidencia" },
  { key: "expert_note", label: "Nota clinica" }
] as const;

export const SKINGPT_EVIDENCE_LEVELS = [
  { key: "level_1", label: "Nivel 1" },
  { key: "high", label: "Alta" },
  { key: "level_2", label: "Nivel 2" },
  { key: "moderate", label: "Moderada" },
  { key: "low", label: "Baixa" }
] as const;

export type SkinGptEvidenceAdminRow = {
  id: string;
  slug: string;
  title: string;
  topicSlug: string;
  body: string;
  sourceLabel: string | null;
  sourceUrl: string | null;
  status: SkinGptEvidenceStatus;
  editorialBoost: number;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sourceFamily: string | null;
  studyType: string | null;
  evidenceLevel: string | null;
  publishedYear: number | null;
  lastReviewedAt: string | null;
  tags: string[];
};

export const getSkinGptEvidenceTopicLabel = (slug: string) =>
  SKINGPT_EVIDENCE_TOPICS.find((item) => item.slug === slug)?.label ?? slug;

export const parseTagsInput = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
