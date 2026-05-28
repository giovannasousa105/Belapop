import { z } from "zod";

const imageQualityIssueSchema = z.enum(["low_light", "blur", "shadow", "overexposure"]);

const scoreAppearanceSchema = z.object({
  label: z.string().min(1),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1)
});

const zonedAppearanceSchema = z.object({
  label: z.string().min(1),
  zones: z.array(z.string().min(1)).default([]),
  confidence: z.number().min(0).max(1)
});

export const openAiSkinAnalysisSchema = z.object({
  imageQuality: z.object({
    status: z.enum(["good", "medium", "poor"]),
    issues: z.array(imageQualityIssueSchema).default([]),
    canAnalyze: z.boolean()
  }),
  skinTexture: scoreAppearanceSchema,
  visiblePores: scoreAppearanceSchema,
  oilinessAppearance: zonedAppearanceSchema,
  drynessAppearance: zonedAppearanceSchema,
  rednessAppearance: zonedAppearanceSchema,
  toneUniformity: scoreAppearanceSchema,
  fineLinesAppearance: zonedAppearanceSchema,
  topConcerns: z.array(z.string().min(1)).min(1).max(4),
  summary: z.string().min(1),
  routineRecommendation: z.object({
    morning: z.array(z.string().min(1)).min(1),
    night: z.array(z.string().min(1)).min(1)
  }),
  disclaimer: z.string().min(1)
});

export type OpenAiSkinAnalysis = z.infer<typeof openAiSkinAnalysisSchema>;

export const skinAnalysisProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  heroImageUrl: z.string().nullable(),
  priceCents: z.number().int().nonnegative().nullable(),
  sellerId: z.string().nullable(),
  reason: z.string().min(1),
  matchedConcern: z.string().min(1)
});

export type SkinAnalysisProduct = z.infer<typeof skinAnalysisProductSchema>;

export const skinAnalysisApiResponseSchema = z.object({
  ok: z.literal(true),
  analysis: openAiSkinAnalysisSchema,
  recommendedProducts: z.array(skinAnalysisProductSchema),
  generatedAt: z.string().min(1)
});

export type SkinAnalysisApiResponse = z.infer<typeof skinAnalysisApiResponseSchema>;

export const SKIN_ANALYSIS_SESSION_STORAGE_KEY = "belapop_skin_analysis_last_result";

const scienceRoutineStepSchema = z.object({
  slug: z.string(),
  name: z.string(),
  category: z.string(),
  price: z.number().nullable(),
  step: z.number(),
  period: z.array(z.string()),
  description: z.string(),
  ritual: z.string(),
  whyRecommended: z.string(),
  addresses: z.array(z.string()).optional(),
  keyActives: z.array(z.string()).optional(),
  skinTypes: z.array(z.string()).optional()
});

export const scienceRoutineSchema = z.object({
  manha: z.array(scienceRoutineStepSchema),
  noite: z.array(scienceRoutineStepSchema),
  semanal: z.array(scienceRoutineStepSchema),
  topActives: z.array(z.string()),
  skinProfile: z.string()
});

export type ScienceRoutineSession = z.infer<typeof scienceRoutineSchema>;

export const skinAnalysisSessionSchema = z.object({
  analysis: openAiSkinAnalysisSchema,
  recommendedProducts: z.array(skinAnalysisProductSchema),
  generatedAt: z.string().min(1),
  imagePreviewDataUrl: z.string().min(1).nullable().optional(),
  scienceRoutine: scienceRoutineSchema.optional()
});

export type SkinAnalysisSession = z.infer<typeof skinAnalysisSessionSchema>;

export type DiscoveryProductCandidate = {
  id: string;
  slug: string | null;
  name: string | null;
  title: string | null;
  brand: string | null;
  category: string | null;
  hero_image_url: string | null;
  price_cents: number | null;
  seller_id: string | null;
  badges: string[] | null;
  tags: string[] | null;
};

export type ConcernKey =
  | "hydration"
  | "oiliness"
  | "redness"
  | "texture"
  | "uniformity"
  | "pores"
  | "fine_lines";

type ConcernRule = {
  labels: string[];
  terms: string[];
  categoryTerms: string[];
  reason: string;
};

const concernRules: Record<ConcernKey, ConcernRule> = {
  hydration: {
    labels: ["hidratação", "hidratação", "ressecamento", "barreira"],
    terms: [
      "hidrat",
      "hydrat",
      "hyaluronic",
      "hialuronic",
      "ceram",
      "barrier",
      "barreira",
      "pantenol",
      "panthenol",
      "cica",
      "centella",
      "calm"
    ],
    categoryTerms: ["hidratante", "moisturizer", "mask", "cream", "serum"],
    reason: "Ajuda a reforçar hidratação, conforto e equilíbrio da barreira da pele."
  },
  oiliness: {
    labels: ["oleosidade", "brilho", "controle de brilho"],
    terms: [
      "niacin",
      "salicy",
      "oleos",
      "oil",
      "matte",
      "seco",
      "gel",
      "cleanse",
      "limpeza",
      "purify"
    ],
    categoryTerms: ["gel", "cleanser", "limpeza", "serum", "sunscreen", "protetor"],
    reason: "Ajuda a controlar brilho aparente e manter a rotina mais leve ao longo do dia."
  },
  redness: {
    labels: ["vermelhidão", "vermelhidao", "sensibilidade"],
    terms: [
      "calm",
      "sooth",
      "soothe",
      "sensitive",
      "sensível",
      "centella",
      "cica",
      "barrier",
      "barreira",
      "pantenol",
      "ceram"
    ],
    categoryTerms: ["serum", "hidratante", "moisturizer", "cream"],
    reason: "Ajuda a deixar a rotina mais suave quando a pele pede conforto e menos estímulo."
  },
  texture: {
    labels: ["textura", "renovação", "renovacao"],
    terms: [
      "renew",
      "smooth",
      "texture",
      "aha",
      "bha",
      "pha",
      "retin",
      "peptide",
      "resurface",
      "exfol"
    ],
    categoryTerms: ["serum", "mask", "treatment", "tratamento"],
    reason: "Ajuda a suavizar a aparência da textura com renovação gradual e apoio de hidratação."
  },
  uniformity: {
    labels: ["uniformidade", "luminosidade", "manchas"],
    terms: [
      "vitamin c",
      "vitamina c",
      "tranex",
      "arbut",
      "bright",
      "glow",
      "tone",
      "uniform",
      "lumino",
      "protect"
    ],
    categoryTerms: ["serum", "sunscreen", "protetor", "essence"],
    reason: "Ajuda a apoiar luminosidade e proteção diária quando o foco é uniformidade visual."
  },
  pores: {
    labels: ["poros", "poros aparentes"],
    terms: ["pore", "niacin", "salicy", "refine", "smooth", "clarify", "oil"],
    categoryTerms: ["cleanser", "serum", "toner", "limpeza"],
    reason: "Ajuda a reduzir a aparência dos poros com limpeza equilibrada e textura mais leve."
  },
  fine_lines: {
    labels: ["linhas finas", "linhas", "firmeza"],
    terms: [
      "peptide",
      "retin",
      "collagen",
      "firm",
      "lift",
      "antioxid",
      "renew",
      "eye"
    ],
    categoryTerms: ["serum", "cream", "eye", "hidratante", "moisturizer"],
    reason: "Ajuda a sustentar hidratação e conforto quando a leitura visual sugere linhas finas aparentes."
  }
};

const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesAny = (haystack: string, needles: string[]) =>
  needles.some((needle) => haystack.includes(normalizeText(needle)));

export const normalizeSkinConcern = (value: string): ConcernKey | null => {
  const normalized = normalizeText(value);

  for (const [key, rule] of Object.entries(concernRules) as Array<[ConcernKey, ConcernRule]>) {
    if (rule.labels.some((label) => normalized.includes(normalizeText(label)))) {
      return key;
    }
  }

  if (normalized.includes("uniform")) return "uniformity";
  if (normalized.includes("hidrat") || normalized.includes("seca") || normalized.includes("barreira")) return "hydration";
  if (normalized.includes("oleos") || normalized.includes("brilho")) return "oiliness";
  if (normalized.includes("vermelh") || normalized.includes("sens")) return "redness";
  if (normalized.includes("poro")) return "pores";
  if (normalized.includes("textur")) return "texture";
  if (normalized.includes("linha") || normalized.includes("firme")) return "fine_lines";

  return null;
};

export const ensureTopConcerns = (analysis: OpenAiSkinAnalysis) => {
  const explicit = analysis.topConcerns
    .map(normalizeSkinConcern)
    .filter((value): value is ConcernKey => Boolean(value));

  if (explicit.length > 0) return explicit;

  const inferred: ConcernKey[] = [];

  if (analysis.drynessAppearance.label !== "sem sinais fortes") inferred.push("hydration");
  if (analysis.oilinessAppearance.label !== "baixa") inferred.push("oiliness");
  if (analysis.rednessAppearance.label !== "baixa") inferred.push("redness");
  if (analysis.visiblePores.label !== "baixos") inferred.push("pores");
  if (analysis.skinTexture.label !== "uniforme") inferred.push("texture");
  if (analysis.toneUniformity.label !== "uniforme") inferred.push("uniformity");
  if (analysis.fineLinesAppearance.label !== "não aparentes") inferred.push("fine_lines");

  return [...new Set(inferred)].slice(0, 3);
};

export function rankProductsForSkinAnalysis(
  products: DiscoveryProductCandidate[],
  analysis: OpenAiSkinAnalysis,
  maxProducts = 4
): SkinAnalysisProduct[] {
  const concerns = ensureTopConcerns(analysis);

  const scored = products
    .map((product) => {
      const text = normalizeText(
        [
          product.name,
          product.title,
          product.brand,
          product.category,
          ...(product.tags ?? []),
          ...(product.badges ?? [])
        ]
          .filter(Boolean)
          .join(" ")
      );

      let score = 0;
      let matchedConcern: ConcernKey | null = null;

      for (const concern of concerns) {
        const rule = concernRules[concern];
        const termHits = rule.terms.filter((term) => text.includes(normalizeText(term))).length;
        const categoryBoost = includesAny(text, rule.categoryTerms) ? 10 : 0;
        const baseScore = termHits * 8 + categoryBoost;

        if (baseScore > score) {
          score = baseScore;
          matchedConcern = concern;
        }
      }

      if (product.tags?.some((tag) => normalizeText(tag).includes("curadoria"))) {
        score += 6;
      }
      if (product.badges?.some((badge) => normalizeText(badge).includes("mais amado"))) {
        score += 5;
      }
      if (product.badges?.some((badge) => normalizeText(badge).includes("novidade"))) {
        score += 3;
      }

      return {
        product,
        score,
        matchedConcern
      };
    })
    .filter((item) => item.score > 0 && item.matchedConcern)
    .sort((left, right) => right.score - left.score);

  const unique = new Set<string>();
  const selected: SkinAnalysisProduct[] = [];

  for (const item of scored) {
    if (unique.has(item.product.id)) continue;
    unique.add(item.product.id);

    const matchedConcern = item.matchedConcern as ConcernKey;
    selected.push({
      id: item.product.id,
      slug: item.product.slug ?? item.product.id,
      name: item.product.title ?? item.product.name ?? "Produto BelaPop",
      brand: item.product.brand,
      category: item.product.category,
      heroImageUrl: item.product.hero_image_url,
      priceCents: item.product.price_cents,
      sellerId: item.product.seller_id,
      reason: concernRules[matchedConcern].reason,
      matchedConcern
    });

    if (selected.length >= maxProducts) break;
  }

  return selected;
}
