export const skinBelaEvidenceSectionId = "skinbela-evidence";

export type SkinBelaPublicEvidenceSource = {
  key: string;
  label: string;
  description: string;
  priority: string;
  aliases: string[];
};

export const skinBelaPublicEvidenceSources: SkinBelaPublicEvidenceSource[] = [
  {
    key: "cochrane",
    label: "Cochrane",
    description: "Revisoes sistematicas de alto nivel para apoiar escolhas cosmeticas e contexto de tratamento.",
    priority: "nivel 1",
    aliases: ["cochrane"]
  },
  {
    key: "aad-jaad",
    label: "AAD / JAAD",
    description: "Diretrizes e artigos dermatologicos usados quando a leitura pede criterio clinico mais forte.",
    priority: "diretriz",
    aliases: ["aad", "jaad", "aad / jaad", "aad/jaad"]
  },
  {
    key: "jama-dermatology",
    label: "JAMA Dermatology",
    description: "Revisoes e estudos dermatologicos de alto impacto para textura, rosacea, acne e fotoenvelhecimento.",
    priority: "alto nivel",
    aliases: ["jama dermatology", "jama"]
  },
  {
    key: "pubmed",
    label: "PubMed / MEDLINE",
    description: "Base principal para revisoes, ensaios e atualizacoes recentes em dermatologia e skincare.",
    priority: "base principal",
    aliases: ["pubmed", "medline", "pubmed / medline", "jama dermatology / pubmed"]
  },
  {
    key: "dermnet",
    label: "DermNet",
    description: "Referencia clinica visual para traduzir sinais cutaneos em linguagem clara de autocuidado.",
    priority: "referencia clinica",
    aliases: ["dermnet"]
  },
  {
    key: "abd-lilacs-scielo",
    label: "ABD / LILACS / SciELO",
    description: "Contexto brasileiro e latino-americano para pele sensivel, manchas, fotoprotecao e rotina real.",
    priority: "contexto regional",
    aliases: ["abd", "lilacs", "scielo", "abd / scielo", "abd / lilacs", "abd / lilacs / scielo", "abd / scielo / lilacs"]
  }
];

function normalizeSourceLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function getSkinBelaEvidenceSource(sourceLabel: string) {
  const normalized = normalizeSourceLabel(sourceLabel);
  const fragments = normalized
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    skinBelaPublicEvidenceSources.find((item) =>
      item.aliases.some((alias) => fragments.includes(normalizeSourceLabel(alias)) || normalized.includes(normalizeSourceLabel(alias)))
    ) ?? null
  );
}

export function getSkinBelaEvidenceHref(sourceLabel: string) {
  const source = getSkinBelaEvidenceSource(sourceLabel);
  if (!source) {
    return `/belacode#${skinBelaEvidenceSectionId}`;
  }

  return `/belacode#${skinBelaEvidenceSectionId}-${source.key}`;
}
