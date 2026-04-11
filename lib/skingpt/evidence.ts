type EvidenceMetadata = {
  source_family: string | null;
  study_type: string | null;
  evidence_level: string | null;
  published_year: number | null;
  last_reviewed_at: string | null;
  tags: string[];
};

export type EvidenceDocument = {
  id: string;
  slug: string;
  title: string;
  topic_slug: string;
  body: string;
  source_label: string | null;
  source_url: string | null;
  metadata?: Record<string, unknown> | null;
  similarity?: number | null;
  updated_at?: string | null;
  status?: string | null;
  editorial_boost?: number | null;
  published_at?: string | null;
};

const SOURCE_PRIORITY: Record<string, number> = {
  uptodate: 116,
  dynamed: 114,
  bmj_best_practice: 112,
  visualdx: 104,
  aad_guideline: 102,
  bad_guideline: 101,
  ecri_guideline: 100,
  cochrane: 98,
  cebd: 96,
  jaad: 94,
  jama_dermatology: 93,
  jama: 92,
  bjd: 91,
  guideline: 90,
  abd: 88,
  dermnet: 84,
  pubmed: 82,
  medline: 81,
  embase: 80,
  web_of_science: 78,
  sciencedirect: 76,
  lilacs: 75,
  scielo: 74,
  review_journal: 70,
  belapop_clinical_notes: 42
};

const STUDY_PRIORITY: Record<string, number> = {
  living_summary: 24,
  guideline: 23,
  meta_analysis: 22,
  systematic_review: 21,
  umbrella_review: 20,
  network_meta_analysis: 19,
  randomized_trial: 18,
  pragmatic_randomized_trial: 17,
  clinical_trial: 14,
  specialty_journal: 10,
  clinical_reference: 9,
  visual_reference: 8,
  review: 7,
  narrative_review: 5,
  index_database: 4,
  evidence_center: 4,
  expert_note: 2
};

const EVIDENCE_LEVEL_PRIORITY: Record<string, number> = {
  level_1: 16,
  high: 12,
  level_2: 10,
  moderate: 8,
  low: 4
};

export const EVIDENCE_SOURCE_FAMILY_LABELS: Record<string, string> = {
  uptodate: "UpToDate",
  dynamed: "DynaMed",
  bmj_best_practice: "BMJ Best Practice",
  visualdx: "VisualDx",
  aad_guideline: "AAD",
  bad_guideline: "BAD",
  ecri_guideline: "ECRI",
  cochrane: "Cochrane",
  cebd: "CEBD Nottingham",
  jaad: "JAAD",
  jama_dermatology: "JAMA Dermatology",
  jama: "JAMA",
  bjd: "BJD",
  abd: "Anais Brasileiros de Dermatologia",
  dermnet: "DermNet",
  pubmed: "PubMed",
  medline: "MEDLINE",
  embase: "Embase",
  web_of_science: "Web of Science",
  sciencedirect: "ScienceDirect",
  lilacs: "LILACS",
  scielo: "SciELO",
  guideline: "Guideline",
  review_journal: "Review",
  belapop_clinical_notes: "BelaPop"
};

export const EVIDENCE_STUDY_TYPE_LABELS: Record<string, string> = {
  living_summary: "sumario clinico",
  guideline: "diretriz clinica",
  meta_analysis: "meta-analise",
  systematic_review: "revisao sistematica",
  umbrella_review: "umbrella review",
  network_meta_analysis: "meta-analise em rede",
  randomized_trial: "ensaio randomizado",
  pragmatic_randomized_trial: "ensaio randomizado pragmatico",
  clinical_trial: "ensaio clinico",
  specialty_journal: "revista dermatologica",
  clinical_reference: "referencia clinica",
  visual_reference: "referencia visual",
  review: "review",
  narrative_review: "revisao narrativa",
  index_database: "base de indexacao",
  evidence_center: "centro de evidencia",
  expert_note: "nota clinica"
};

export const EVIDENCE_LEVEL_LABELS: Record<string, string> = {
  level_1: "Nivel 1",
  high: "Alta",
  level_2: "Nivel 2",
  moderate: "Moderada",
  low: "Baixa"
};

const dermatologyEvidenceFamilies = new Set([
  "aad_guideline",
  "bad_guideline",
  "ecri_guideline",
  "cochrane",
  "cebd",
  "jaad",
  "jama_dermatology",
  "jama",
  "bjd",
  "abd",
  "dermnet",
  "pubmed",
  "medline",
  "embase",
  "lilacs",
  "scielo",
  "web_of_science",
  "sciencedirect",
  "uptodate",
  "dynamed",
  "bmj_best_practice",
  "visualdx"
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function recencyBonus(year: number | null) {
  if (!year) return 0;
  const delta = Math.max(0, new Date().getFullYear() - year);
  if (delta <= 1) return 8;
  if (delta <= 3) return 6;
  if (delta <= 5) return 4;
  if (delta <= 8) return 2;
  return 0;
}

export function parseEvidenceMetadata(metadata: Record<string, unknown> | null | undefined): EvidenceMetadata {
  const safe = metadata ?? {};
  return {
    source_family: toStringOrNull(safe.source_family)?.toLowerCase() ?? null,
    study_type: toStringOrNull(safe.study_type)?.toLowerCase() ?? null,
    evidence_level: toStringOrNull(safe.evidence_level)?.toLowerCase() ?? null,
    published_year: toNumber(safe.published_year),
    last_reviewed_at: toStringOrNull(safe.last_reviewed_at),
    tags: Array.isArray(safe.tags) ? safe.tags.filter((item): item is string => typeof item === "string") : []
  };
}

export function formatEvidenceCitation(doc: EvidenceDocument) {
  const metadata = parseEvidenceMetadata(doc.metadata);
  const sourceFamily =
    EVIDENCE_SOURCE_FAMILY_LABELS[metadata.source_family ?? ""] ??
    doc.source_label ??
    "Fonte dermatologica";
  const yearSuffix = metadata.published_year ? ` ${metadata.published_year}` : "";
  const studyType = metadata.study_type ? EVIDENCE_STUDY_TYPE_LABELS[metadata.study_type] ?? metadata.study_type : null;

  return `${sourceFamily}${yearSuffix} | ${doc.title}${studyType ? ` (${studyType})` : ""}`;
}

export function buildEvidenceBadge(doc: EvidenceDocument) {
  const metadata = parseEvidenceMetadata(doc.metadata);
  const sourceFamily =
    EVIDENCE_SOURCE_FAMILY_LABELS[metadata.source_family ?? ""] ??
    doc.source_label ??
    "Fonte dermatologica";
  return {
    sourceFamily,
    publishedYear: metadata.published_year,
    studyType: metadata.study_type,
    evidenceLevel: metadata.evidence_level
  };
}

function lexicalOverlap(question: string, concernSlug: string, doc: EvidenceDocument) {
  const tokens = new Set([...tokenize(question), ...tokenize(concernSlug.replaceAll("-", " "))]);
  const haystack = [
    doc.title,
    doc.topic_slug,
    doc.body,
    ...(parseEvidenceMetadata(doc.metadata).tags ?? [])
  ]
    .join(" ")
    .toLowerCase();

  let score = doc.topic_slug === concernSlug ? 34 : doc.topic_slug === "general" ? 4 : 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1.5;
  }
  return score;
}

function contextualSourceBoost(question: string, doc: EvidenceDocument) {
  const questionText = question.toLowerCase();
  const metadata = parseEvidenceMetadata(doc.metadata);
  const sourceFamily = metadata.source_family ?? "";
  let score = 0;

  if (
    /brasil|brasileir|latino|america latina|sbd|sociedade brasileira/.test(questionText) &&
    ["abd", "lilacs", "scielo"].includes(sourceFamily)
  ) {
    score += 8;
  }

  if (
    /foto|imagem|lesao|parecida|diagnostico visual|mapa|heatmap/.test(questionText) &&
    ["visualdx", "dermnet"].includes(sourceFamily)
  ) {
    score += 6;
  }

  if (/meta|randomiz|ensaio|revisao sistematica|nivel 1|evidencia forte/.test(questionText)) {
    if (["meta_analysis", "systematic_review", "umbrella_review", "randomized_trial", "guideline"].includes(metadata.study_type ?? "")) {
      score += 7;
    }
  }

  return score;
}

export function rankEvidenceDocuments(question: string, concernSlug: string, docs: EvidenceDocument[]) {
  return docs
    .map((doc) => {
      const metadata = parseEvidenceMetadata(doc.metadata);
      const sourceScore = SOURCE_PRIORITY[metadata.source_family ?? ""] ?? 28;
      const studyScore = STUDY_PRIORITY[metadata.study_type ?? ""] ?? 0;
      const evidenceScore = EVIDENCE_LEVEL_PRIORITY[metadata.evidence_level ?? ""] ?? 0;
      const topicalScore = lexicalOverlap(question, concernSlug, doc);
      const similarityScore = Math.max(0, Number(doc.similarity ?? 0)) * 35;
      const freshnessScore = recencyBonus(metadata.published_year);
      const contextBoost = contextualSourceBoost(question, doc);
      const generalTopicPenalty = concernSlug !== "general" && doc.topic_slug === "general" ? 26 : 0;
      const editorialBoost = Math.max(0, Math.min(100, Number(doc.editorial_boost ?? 0))) * 0.18;
      const finalScore =
        similarityScore +
        topicalScore +
        sourceScore +
        studyScore +
        evidenceScore +
        freshnessScore +
        contextBoost +
        editorialBoost -
        generalTopicPenalty;

      return {
        ...doc,
        _rank_score: Number(finalScore.toFixed(3))
      };
    })
    .sort((left, right) => right._rank_score - left._rank_score)
    .map(({ _rank_score, ...doc }) => doc);
}

export function evidenceLeadCopy(documents: EvidenceDocument[]) {
  const topFamilies = Array.from(
    new Set(
      documents
        .map((doc) => buildEvidenceBadge(doc).sourceFamily)
        .filter(Boolean)
        .slice(0, 3)
    )
  );

  if (topFamilies.length === 0) {
    return "Vou responder de forma conservadora, priorizando tolerancia da pele, consistencia da rotina e o que costuma ter melhor respaldo dermatologico.";
  }

  if (topFamilies.length === 1) {
    return `Vou priorizar o que tem melhor respaldo em ${topFamilies[0]}, dando mais peso a revisoes sistematicas, meta-analises, ensaios randomizados e diretrizes, e traduzir isso para uma orientacao pratica.`;
  }

  return `Vou priorizar o que tem melhor respaldo entre ${topFamilies.join(", ")}, com preferencia por revisoes sistematicas, meta-analises, ensaios randomizados e diretrizes, e traduzir isso para uma orientacao pratica.`;
}

export function evidenceStrengthLabel(documents: EvidenceDocument[]) {
  const best = documents[0];
  if (!best) return "base conservadora";
  const metadata = parseEvidenceMetadata(best.metadata);
  if (["uptodate", "dynamed", "bmj_best_practice"].includes(metadata.source_family ?? "")) return "sumario clinico premium";
  if (
    ["cochrane", "aad_guideline", "bad_guideline", "ecri_guideline"].includes(metadata.source_family ?? "") ||
    ["guideline", "meta_analysis", "systematic_review", "umbrella_review"].includes(metadata.study_type ?? "") ||
    metadata.evidence_level === "level_1"
  ) {
    return "evidencia nivel 1";
  }
  if (["jaad", "jama_dermatology", "jama", "bjd", "abd"].includes(metadata.source_family ?? "")) return "dermatologia de alto impacto";
  if (["pubmed", "medline", "embase", "web_of_science", "sciencedirect", "lilacs", "scielo"].includes(metadata.source_family ?? "")) {
    return "literatura indexada recente";
  }
  if (["visualdx", "dermnet"].includes(metadata.source_family ?? "")) return "apoio clinico visual";
  if (dermatologyEvidenceFamilies.has(metadata.source_family ?? "")) return "base dermatologica especializada";
  return "base contextual";
}
