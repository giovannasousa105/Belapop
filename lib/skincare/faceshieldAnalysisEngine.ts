import type { CustomerSkinProfile } from "@/lib/customer/api";
import type { FaceHeatmapRegion } from "@/lib/skincare/faceshield";
import {
  FACE_MAPPING_REGION_KEYS,
  type FaceMappingResult,
  type FaceRegionKey as MappingFaceRegionKey
} from "@/lib/skincare/faceMappingService";
import { createSkinScanFusionResult, type SkinScanFusionResult } from "@/lib/skincare/skinScanFusionEngine";
import {
  deriveBaselineMetrics,
  mapMetricSet,
  metricsFromScan,
  type SkinMetricSet,
  type SkinScanRow
} from "@/lib/skincare/twin";
import {
  buildEvidenceBadge,
  evidenceLeadCopy,
  evidenceStrengthLabel,
  formatEvidenceCitation,
  type EvidenceDocument
} from "@/lib/skingpt/evidence";
import { getRankedDermatologyKnowledge } from "@/lib/skingpt/knowledge";

export const FACE_REGION_KEYS = FACE_MAPPING_REGION_KEYS;

export type FaceRegionKey = MappingFaceRegionKey;
export type RoutineStepKey = "cleanser" | "treatment" | "moisturizer" | "sunscreen" | "complement";

export type ImageQualityResult = {
  brightnessScore: number;
  blurScore: number;
  faceCenteredScore: number;
  faceDetected: boolean;
  multipleFacesDetected: boolean;
  imageQualityScore: number;
  messages: string[];
};

export type FaceRegionAnalysis = {
  region: FaceRegionKey;
  oilinessScore: number;
  drynessScore: number;
  rednessScore: number;
  darkSpotScore: number;
  textureScore: number;
  poreVisibilityScore: number;
  acneLikelihoodScore: number;
  fineLinesScore: number;
  confidence: number;
};

export type ProductMatch = {
  productId: string;
  slug: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  heroImageUrl: string | null;
  priceCents: number | null;
  tags: string[];
  recommendedStep: RoutineStepKey;
  matchScore: number;
  skinTypeMatch: number;
  concernMatch: number;
  sensitivityCompatibility: number;
  texturePreference: number;
  budgetFit: number;
  reasons: string[];
};

export type FaceShieldEvidenceSummary = {
  topicSlug: string;
  strengthLabel: string;
  leadCopy: string;
  explanation: string;
  supportedIngredients: string[];
  documents: Array<{
    id: string;
    slug: string;
    title: string;
    topicSlug: string;
    citation: string;
    sourceLabel: string | null;
    sourceUrl: string | null;
    sourceFamily: string;
    studyType: string | null;
    evidenceLevel: string | null;
    publishedYear: number | null;
  }>;
};

export type FaceShieldAnalysisInput = {
  image?: {
    provided?: boolean;
    captureMode?: string | null;
    persistedWithConsent?: boolean | null;
  };
  qualitySignals?: {
    brightnessScore?: number | null;
    sharpnessScore?: number | null;
    faceCoverageScore?: number | null;
    centeredFaceScore?: number | null;
    minimalMakeupScore?: number | null;
    faceDetected?: boolean | null;
    multipleFacesDetected?: boolean | null;
    serviceStatus?: "validated" | "pending" | "rejected" | null;
    serviceReasons?: string[] | null;
  };
  visualMetrics?: {
    hydrationScore?: number | null;
    acneScore?: number | null;
    pigmentationScore?: number | null;
    rednessScore?: number | null;
    elasticityScore?: number | null;
    poreVisibilityScore?: number | null;
    wrinkleDepthScore?: number | null;
  } | null;
  heatmapRegions?: FaceHeatmapRegion[] | null;
  responses?: {
    skinType?: string | null;
    mainConcern?: string | null;
    secondaryConcerns?: string[] | null;
    sensitivityLevel?: number | null;
    budgetPreference?: string | null;
    texturePreference?: string | null;
    objectives?: string[] | null;
  } | null;
  routineContext?: {
    currentRoutine?: string[] | null;
    stage?: string | null;
  } | null;
  preferences?: {
    budgetPreference?: string | null;
    texturePreference?: string | null;
  } | null;
  restrictions?: {
    isPregnant?: boolean | null;
    sensitivity?: string[] | null;
    avoidActives?: string[] | null;
  } | null;
  profile?: CustomerSkinProfile | null;
  recentScans?: SkinScanRow[] | null;
  productCandidates?: Array<{
    id: string;
    slug: string | null;
    name: string | null;
    title: string | null;
    brand: string | null;
    category: string | null;
    hero_image_url: string | null;
    price_cents: number | null;
    seller_id: string | null;
    tags: string[] | null;
  }> | null;
  faceMapping?: FaceMappingResult | null;
};

export type FaceShieldAnalysisResult = {
  probableSkinProfile: {
    skinType: string;
    primaryConcern: string;
    secondaryConcerns: string[];
    sensitivityLevel: number;
    confidence: number;
  };
  confidenceLevel: number;
  imageQuality: ImageQualityResult;
  concernsDetected: string[];
  regionsAnalyzed: FaceRegionAnalysis[];
  fusionResult: SkinScanFusionResult;
  weights: {
    visualWeight: number;
    quizWeight: number;
    historyWeight: number;
  };
  weightedMetrics: {
    hydrationScore: number;
    acneScore: number;
    pigmentationScore: number;
    rednessScore: number;
    elasticityScore: number;
    poreVisibility: number;
    wrinkleDepth: number;
  };
  routineRecommended: {
    steps: Array<{
      key: RoutineStepKey;
      title: string;
      focus: string;
      recommendedIngredients: string[];
      rationale: string;
    }>;
  };
  productsCompatible: ProductMatch[];
  evidenceSummary: FaceShieldEvidenceSummary | null;
  recommendationReasons: string[];
  cosmeticSafetyWarnings: string[];
  analysisMode: "validated_visual" | "degraded_visual" | "fallback_without_image";
  mediaPipeReady: {
    adapter: "mediapipe-face-mesh";
    status: "ready_for_integration";
    landmarkSchemaVersion: "v1";
  };
};

type ConcernSlug =
  | "acne"
  | "dark_spots"
  | "dehydration"
  | "oiliness"
  | "barrier_damage"
  | "aging"
  | "uneven_texture";

type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").getSupabaseAdminClient>;

type BudgetPreference = "essencial" | "intermediaria" | "premium";

type RegionAccumulator = Omit<FaceRegionAnalysis, "region">;

type EvidenceIngredientDescriptor = {
  label: string;
  aliases: string[];
  concerns: ConcernSlug[];
  steps: RoutineStepKey[];
};

const DEFAULT_IMAGE_QUALITY: ImageQualityResult = {
  brightnessScore: 0,
  blurScore: 1,
  faceCenteredScore: 0,
  faceDetected: false,
  multipleFacesDetected: false,
  imageQualityScore: 0,
  messages: []
};

const REGION_ALIASES: Record<string, FaceRegionKey[]> = {
  forehead: ["forehead"],
  nose: ["nose"],
  left_cheek: ["left_cheek"],
  right_cheek: ["right_cheek"],
  cheeks: ["left_cheek", "right_cheek"],
  chin: ["chin"],
  eye_area: ["eye_area"],
  mouth_area: ["mouth_area"],
  jawline: ["jawline"],
  t_zone: ["t_zone", "forehead", "nose"],
  u_zone: ["u_zone", "left_cheek", "right_cheek", "jawline"]
};

const CONCERN_TOPIC_MAP: Record<ConcernSlug, string> = {
  acne: "acne",
  dark_spots: "dark-spots",
  dehydration: "dehydration",
  oiliness: "oiliness",
  barrier_damage: "barrier-damage",
  aging: "aging",
  uneven_texture: "uneven-texture"
};

const CONCERN_COPY_MAP: Record<ConcernSlug, string> = {
  acne: "acne e textura",
  dark_spots: "manchas e luminosidade",
  dehydration: "hidratação e barreira",
  oiliness: "oleosidade e poros",
  barrier_damage: "barreira sensibilizada",
  aging: "linhas finas e firmeza",
  uneven_texture: "textura irregular"
};

const EVIDENCE_INGREDIENT_LIBRARY: EvidenceIngredientDescriptor[] = [
  {
    label: "niacinamida",
    aliases: ["niacinamida", "niacinamide"],
    concerns: ["acne", "dark_spots", "oiliness", "uneven_texture"],
    steps: ["treatment", "moisturizer", "complement"]
  },
  {
    label: "acido salicilico",
    aliases: ["acido salicilico", "salicylic acid", "bha"],
    concerns: ["acne", "oiliness", "uneven_texture"],
    steps: ["treatment", "complement"]
  },
  {
    label: "acido azelaico",
    aliases: ["acido azelaico", "azelaic acid"],
    concerns: ["acne", "dark_spots", "barrier_damage"],
    steps: ["treatment", "complement"]
  },
  {
    label: "vitamina c",
    aliases: ["vitamina c", "vitamin c", "ascorbic"],
    concerns: ["dark_spots", "aging"],
    steps: ["treatment", "complement"]
  },
  {
    label: "acido tranexamico",
    aliases: ["acido tranexamico", "tranexamic acid"],
    concerns: ["dark_spots"],
    steps: ["treatment", "complement"]
  },
  {
    label: "alfa-arbutin",
    aliases: ["alfa-arbutin", "alpha arbutin", "arbutin"],
    concerns: ["dark_spots"],
    steps: ["treatment", "complement"]
  },
  {
    label: "acido hialuronico",
    aliases: ["acido hialuronico", "hyaluronic acid", "hyaluron"],
    concerns: ["dehydration", "barrier_damage", "aging"],
    steps: ["treatment", "moisturizer"]
  },
  {
    label: "glicerina",
    aliases: ["glicerina", "glycerin"],
    concerns: ["dehydration", "barrier_damage"],
    steps: ["cleanser", "moisturizer"]
  },
  {
    label: "ceramidas",
    aliases: ["ceramida", "ceramidas", "ceramide", "ceramides"],
    concerns: ["dehydration", "barrier_damage"],
    steps: ["moisturizer", "treatment"]
  },
  {
    label: "pantenol",
    aliases: ["pantenol", "panthenol"],
    concerns: ["dehydration", "barrier_damage"],
    steps: ["moisturizer", "treatment"]
  },
  {
    label: "centella asiatica",
    aliases: ["centella asiatica", "centella", "cica"],
    concerns: ["barrier_damage", "dehydration"],
    steps: ["moisturizer", "treatment"]
  },
  {
    label: "peptideos",
    aliases: ["peptideo", "peptideos", "peptide", "peptides"],
    concerns: ["aging"],
    steps: ["treatment", "complement"]
  },
  {
    label: "retinoide",
    aliases: ["retinoide", "retinoid", "retinol", "retinal"],
    concerns: ["aging", "uneven_texture", "acne"],
    steps: ["treatment", "complement"]
  },
  {
    label: "antioxidantes",
    aliases: ["antioxidante", "antioxidantes", "antioxidant", "antioxidants"],
    concerns: ["aging", "dark_spots"],
    steps: ["treatment", "complement"]
  },
  {
    label: "filtros uv",
    aliases: ["filtro uv", "filtros uv", "proteção solar", "photoprotection", "sunscreen", "spf"],
    concerns: ["dark_spots", "aging", "oiliness", "dehydration", "barrier_damage", "acne", "uneven_texture"],
    steps: ["sunscreen"]
  }
];

const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const clampUnit = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
};

const clampHundred = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
};

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const dedupe = <T,>(values: T[]) => values.filter((value, index) => values.indexOf(value) === index);

function weightedOverallScore(metrics: SkinMetricSet) {
  return Math.round(
    metrics.hydration_level * 0.25 +
      (100 - metrics.pore_visibility) * 0.2 +
      (100 - metrics.pigmentation_level) * 0.2 +
      (100 - metrics.acne_level) * 0.15 +
      (100 - metrics.wrinkle_depth) * 0.2
  );
}

function concernLabel(concern: ConcernSlug) {
  return CONCERN_COPY_MAP[concern] ?? "rotina sugerida";
}

function toConcernTopicSlug(concern: ConcernSlug) {
  return CONCERN_TOPIC_MAP[concern] ?? "barrier-damage";
}

function buildEvidenceSearchQuestion(
  input: FaceShieldAnalysisInput,
  result: FaceShieldAnalysisResult
) {
  const objectiveCopy = input.responses?.objectives?.filter(Boolean).join(" ") ?? "";
  const primaryConcern = result.probableSkinProfile.primaryConcern as ConcernSlug;
  const directConcern =
    input.responses?.mainConcern ?? input.profile?.main_concern?.name ?? concernLabel(primaryConcern);
  const skinType = result.probableSkinProfile.skinType.replaceAll("_", " ");
  const secondary = result.probableSkinProfile.secondaryConcerns
    .map((item) => concernLabel(item as ConcernSlug))
    .join(" ");

  return [
    `rotina cosmética para ${skinType}`,
    `foco em ${directConcern}`,
    objectiveCopy,
    secondary,
    input.responses?.skinType ? `pele ${input.responses.skinType}` : ""
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function buildEvidenceHaystack(documents: EvidenceDocument[]) {
  return normalizeText(
    documents
      .map((document) =>
        [
          document.title,
          document.topic_slug,
          document.body,
          ...(Array.isArray(document.metadata?.tags) ? document.metadata.tags.filter((item): item is string => typeof item === "string") : [])
        ].join(" ")
      )
      .join(" ")
  );
}

function extractEvidenceSupportedIngredients(documents: EvidenceDocument[], concern: ConcernSlug) {
  if (documents.length === 0) return [];

  const haystack = buildEvidenceHaystack(documents);
  const supported = EVIDENCE_INGREDIENT_LIBRARY.filter(
    (descriptor) =>
      descriptor.concerns.includes(concern) &&
      descriptor.aliases.some((alias) => haystack.includes(normalizeText(alias)))
  ).map((descriptor) => descriptor.label);

  if (supported.length > 0) {
    return dedupe(supported).slice(0, 5);
  }

  return dedupe(
    EVIDENCE_INGREDIENT_LIBRARY.filter((descriptor) => descriptor.concerns.includes(concern)).map(
      (descriptor) => descriptor.label
    )
  ).slice(0, 5);
}

function buildEvidenceSummary(
  concern: ConcernSlug,
  documents: EvidenceDocument[]
): FaceShieldEvidenceSummary | null {
  if (documents.length === 0) return null;

  const supportedIngredients = extractEvidenceSupportedIngredients(documents, concern);
  return {
    topicSlug: toConcernTopicSlug(concern),
    strengthLabel: evidenceStrengthLabel(documents),
    leadCopy: evidenceLeadCopy(documents),
    explanation: `A rotina sugerida prioriza a melhor base dermatológica disponivel para ${concernLabel(concern)}.`,
    supportedIngredients,
    documents: documents.slice(0, 3).map((document) => {
      const badge = buildEvidenceBadge(document);
      return {
        id: document.id,
        slug: document.slug,
        title: document.title,
        topicSlug: document.topic_slug,
        citation: formatEvidenceCitation(document),
        sourceLabel: document.source_label,
        sourceUrl: document.source_url,
        sourceFamily: badge.sourceFamily,
        studyType: badge.studyType,
        evidenceLevel: badge.evidenceLevel,
        publishedYear: badge.publishedYear ?? null
      };
    })
  };
}

function pickEvidenceIngredientsForStep(
  stepKey: RoutineStepKey,
  supportedIngredients: string[],
  fallback: string[]
) {
  const normalizedSupported = supportedIngredients.map((item) => normalizeText(item));
  const selected = EVIDENCE_INGREDIENT_LIBRARY.filter(
    (descriptor) =>
      descriptor.steps.includes(stepKey) &&
      normalizedSupported.includes(normalizeText(descriptor.label))
  ).map((descriptor) => descriptor.label);

  if (selected.length === 0) return fallback;
  return dedupe(selected).slice(0, 4);
}

function applyEvidenceToRoutine(
  routineRecommended: FaceShieldAnalysisResult["routineRecommended"],
  evidenceSummary: FaceShieldEvidenceSummary | null
) {
  if (!evidenceSummary) return routineRecommended;

  return {
    steps: routineRecommended.steps.map((step) => {
      const nextIngredients =
        step.key === "treatment" || step.key === "moisturizer" || step.key === "complement" || step.key === "sunscreen"
          ? pickEvidenceIngredientsForStep(step.key, evidenceSummary.supportedIngredients, step.recommendedIngredients)
          : step.recommendedIngredients;

      const nextRationale =
        step.key === "treatment" || step.key === "moisturizer"
          ? `${step.rationale} Priorizado por ${evidenceSummary.strengthLabel}.`
          : step.key === "sunscreen"
            ? `${step.rationale} Mantem coerencia com a evidencia priorizada para esta rotina.`
            : step.rationale;

      return {
        ...step,
        recommendedIngredients: nextIngredients,
        rationale: nextRationale
      };
    })
  };
}

function applyEvidenceToProducts(
  productsCompatible: ProductMatch[],
  evidenceSummary: FaceShieldEvidenceSummary | null
) {
  if (!evidenceSummary) return productsCompatible;

  const supported = evidenceSummary.supportedIngredients.map((item) => normalizeText(item));
  const strengthened = productsCompatible.map((product) => {
    const evidenceMatches = supported.filter((needle) =>
      product.tags.some((tag) => {
        const normalizedTag = normalizeText(tag);
        return normalizedTag.includes(needle) || needle.includes(normalizedTag);
      })
    );

    if (evidenceMatches.length === 0) return product;

    return {
      ...product,
      matchScore: Math.min(100, product.matchScore + Math.min(12, evidenceMatches.length * 4)),
      reasons: dedupe([
        ...product.reasons,
        "Ativos alinhados com a evidencia dermatológica priorizada para esta rotina."
      ])
    };
  });

  return [...strengthened].sort((left, right) => right.matchScore - left.matchScore);
}

function applyEvidenceToReasons(
  recommendationReasons: string[],
  evidenceSummary: FaceShieldEvidenceSummary | null
) {
  if (!evidenceSummary) return recommendationReasons;

  return dedupe([
    evidenceSummary.leadCopy,
    `Base documental priorizada: ${evidenceSummary.strengthLabel}.`,
    ...recommendationReasons
  ]).slice(0, 6);
}

function mapBudgetPreference(value: string | null | undefined, priceAffinityCents?: number | null): BudgetPreference {
  const normalized = normalizeText(value);
  if (normalized.includes("premium") || normalized.includes("luxo")) return "premium";
  if (normalized.includes("intermedi")) return "intermediaria";
  if (normalized.includes("essencial") || normalized.includes("basic")) return "essencial";

  if (typeof priceAffinityCents === "number") {
    if (priceAffinityCents >= 45000) return "premium";
    if (priceAffinityCents >= 20000) return "intermediaria";
  }

  return "essencial";
}

function normalizeSkinType(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.includes("oleosa") || normalized === "oily") return "oily";
  if (normalized.includes("seca") || normalized === "dry") return "dry";
  if (normalized.includes("mista") || normalized.includes("combination")) return "combination";
  if (normalized.includes("sensível") || normalized.includes("sensitive")) return "sensitive";
  if (normalized.includes("acne")) return "acne_prone";
  if (normalized.includes("normal")) return "normal";
  return normalized;
}

function normalizeConcern(value: string | null | undefined): ConcernSlug | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.includes("acne")) return "acne";
  if (normalized.includes("mancha") || normalized.includes("spot") || normalized.includes("pigment")) {
    return "dark_spots";
  }
  if (normalized.includes("hidrat") || normalized.includes("seca") || normalized.includes("desidrat")) {
    return "dehydration";
  }
  if (normalized.includes("oleos") || normalized.includes("brilho")) return "oiliness";
  if (normalized.includes("sens") || normalized.includes("barrier") || normalized.includes("vermelh")) {
    return "barrier_damage";
  }
  if (normalized.includes("linha") || normalized.includes("aging") || normalized.includes("sinal")) {
    return "aging";
  }
  if (normalized.includes("textur") || normalized.includes("poros")) return "uneven_texture";
  return null;
}

function buildProfileReference(input: FaceShieldAnalysisInput) {
  const profileSkinType = normalizeSkinType(input.profile?.skin_type?.slug ?? input.profile?.skin_type?.name ?? null);
  const responseSkinType = normalizeSkinType(input.responses?.skinType ?? null);
  const profileConcern = normalizeConcern(
    input.profile?.main_concern?.slug ?? input.profile?.main_concern?.name ?? null
  );
  const responseConcern =
    normalizeConcern(input.responses?.mainConcern ?? null) ??
    normalizeConcern(input.responses?.objectives?.[0] ?? null);

  return {
    skin_type: { slug: responseSkinType ?? profileSkinType ?? "combination" },
    main_concern: { slug: responseConcern ?? profileConcern ?? "dehydration" },
    sensitivity_level:
      input.responses?.sensitivityLevel ??
      input.profile?.sensitivity_level ??
      (input.restrictions?.sensitivity?.length ? 4 : 3)
  };
}

function metricSetFromVisual(input: FaceShieldAnalysisInput["visualMetrics"]): SkinMetricSet | null {
  if (!input) return null;

  const values = [
    input.hydrationScore,
    input.acneScore,
    input.pigmentationScore,
    input.rednessScore,
    input.elasticityScore,
    input.poreVisibilityScore,
    input.wrinkleDepthScore
  ].filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (values.length === 0) return null;

  return mapMetricSet({
    hydration_level: input.hydrationScore ?? 50,
    elasticity_level: input.elasticityScore ?? 50,
    pigmentation_level: input.pigmentationScore ?? 50,
    acne_level: input.acneScore ?? 50,
    redness_level: input.rednessScore ?? 50,
    pore_visibility: input.poreVisibilityScore ?? 50,
    wrinkle_depth: input.wrinkleDepthScore ?? 50
  });
}

function metricSetFromFaceMapping(faceMapping: FaceMappingResult | null | undefined): SkinMetricSet | null {
  if (!faceMapping?.faceDetected) return null;

  const tZone = faceMapping.regions.t_zone;
  const uZone = faceMapping.regions.u_zone;
  const eyeArea = faceMapping.regions.eye_area;
  const mouthArea = faceMapping.regions.mouth_area;
  const cheeksDarkSpots = average([
    faceMapping.regions.left_cheek.darkSpotScore,
    faceMapping.regions.right_cheek.darkSpotScore
  ]);
  const barrierSignal = average([uZone.rednessScore, faceMapping.regions.left_cheek.rednessScore, faceMapping.regions.right_cheek.rednessScore]);

  return mapMetricSet({
    hydration_level: clampHundred(100 - ((1 - uZone.averageBrightness) * 62 + uZone.textureScore * 28)),
    elasticity_level: clampHundred(100 - average([eyeArea.textureScore, mouthArea.textureScore, faceMapping.regions.jawline.textureScore]) * 72),
    pigmentation_level: clampHundred((cheeksDarkSpots * 0.72 + faceMapping.regions.forehead.darkSpotScore * 0.28) * 100),
    acne_level: clampHundred((tZone.rednessScore * 0.28 + tZone.textureScore * 0.26 + tZone.poreVisibilityScore * 0.46) * 100),
    redness_level: clampHundred((barrierSignal * 0.8 + faceMapping.regions.nose.rednessScore * 0.2) * 100),
    pore_visibility: clampHundred((tZone.poreVisibilityScore * 0.72 + faceMapping.regions.nose.poreVisibilityScore * 0.28) * 100),
    wrinkle_depth: clampHundred(average([eyeArea.textureScore, mouthArea.textureScore, faceMapping.regions.jawline.textureScore]) * 100)
  });
}

function mergeVisualMetricSources(
  visualMetrics: FaceShieldAnalysisInput["visualMetrics"],
  faceMapping: FaceMappingResult | null | undefined
): FaceShieldAnalysisInput["visualMetrics"] {
  const mappedMetrics = metricSetFromFaceMapping(faceMapping);
  if (!visualMetrics && !mappedMetrics) return null;
  if (!visualMetrics && mappedMetrics) {
    return {
      hydrationScore: mappedMetrics.hydration_level,
      acneScore: mappedMetrics.acne_level,
      pigmentationScore: mappedMetrics.pigmentation_level,
      rednessScore: mappedMetrics.redness_level,
      elasticityScore: mappedMetrics.elasticity_level,
      poreVisibilityScore: mappedMetrics.pore_visibility,
      wrinkleDepthScore: mappedMetrics.wrinkle_depth
    };
  }
  if (!visualMetrics) return null;
  if (!mappedMetrics) return visualMetrics;

  return {
    hydrationScore: average([visualMetrics.hydrationScore ?? 50, mappedMetrics.hydration_level]),
    acneScore: average([visualMetrics.acneScore ?? 50, mappedMetrics.acne_level]),
    pigmentationScore: average([visualMetrics.pigmentationScore ?? 50, mappedMetrics.pigmentation_level]),
    rednessScore: average([visualMetrics.rednessScore ?? 50, mappedMetrics.redness_level]),
    elasticityScore: average([visualMetrics.elasticityScore ?? 50, mappedMetrics.elasticity_level]),
    poreVisibilityScore: average([visualMetrics.poreVisibilityScore ?? 50, mappedMetrics.pore_visibility]),
    wrinkleDepthScore: average([visualMetrics.wrinkleDepthScore ?? 50, mappedMetrics.wrinkle_depth])
  };
}

function metricSetFromHistory(recentScans: SkinScanRow[] | null | undefined, fallback: SkinMetricSet): SkinMetricSet {
  if (!recentScans || recentScans.length === 0) return fallback;

  const metrics = recentScans.map(metricsFromScan);
  return mapMetricSet({
    hydration_level: average(metrics.map((item) => item.hydration_level)),
    elasticity_level: average(metrics.map((item) => item.elasticity_level)),
    pigmentation_level: average(metrics.map((item) => item.pigmentation_level)),
    acne_level: average(metrics.map((item) => item.acne_level)),
    redness_level: average(metrics.map((item) => item.redness_level)),
    pore_visibility: average(metrics.map((item) => item.pore_visibility)),
    wrinkle_depth: average(metrics.map((item) => item.wrinkle_depth))
  });
}

function brightnessScoreFromMapping(quality: FaceMappingResult["quality"]) {
  if (quality.brightness === "low") return 0.2;
  if (quality.brightness === "high") return 0.86;
  return 0.62;
}

function blurScoreFromMapping(quality: FaceMappingResult["quality"]) {
  if (quality.blur === "high") return 0.88;
  if (quality.blur === "medium") return 0.52;
  return 0.16;
}

function computeImageQuality(input: FaceShieldAnalysisInput): ImageQualityResult {
  const hasImage = Boolean(input.image?.provided);
  if (!hasImage) return DEFAULT_IMAGE_QUALITY;

  if (input.faceMapping) {
    return {
      brightnessScore: brightnessScoreFromMapping(input.faceMapping.quality),
      blurScore: blurScoreFromMapping(input.faceMapping.quality),
      faceCenteredScore: input.faceMapping.quality.faceCentered ? 1 : 0.3,
      faceDetected: input.faceMapping.faceDetected,
      multipleFacesDetected: input.faceMapping.quality.multipleFaces,
      imageQualityScore: clampUnit(input.faceMapping.quality.imageQualityScore),
      messages: input.faceMapping.quality.messages
    };
  }

  const brightnessScore = clampUnit(input.qualitySignals?.brightnessScore ?? 0.5);
  const sharpnessScore = clampUnit(input.qualitySignals?.sharpnessScore ?? 0.45);
  const blurScore = clampUnit(1 - sharpnessScore);
  const faceCoverageScore = clampUnit(input.qualitySignals?.faceCoverageScore ?? 0.55);
  const faceCenteredScore = clampUnit(input.qualitySignals?.centeredFaceScore ?? faceCoverageScore);
  const faceDetected =
    input.qualitySignals?.faceDetected ?? (faceCoverageScore >= 0.3 || faceCenteredScore >= 0.3);
  const multipleFacesDetected = Boolean(input.qualitySignals?.multipleFacesDetected);
  const minimalMakeupScore = clampUnit(input.qualitySignals?.minimalMakeupScore ?? 0.65);
  const statusPenalty = input.qualitySignals?.serviceStatus === "rejected" ? 0.7 : 1;
  const imageQualityScore = clampUnit(
    (brightnessScore * 0.2 +
      (1 - blurScore) * 0.25 +
      faceCenteredScore * 0.2 +
      faceCoverageScore * 0.15 +
      minimalMakeupScore * 0.1 +
      (faceDetected ? 0.1 : 0)) *
      (multipleFacesDetected ? 0.3 : 1) *
      statusPenalty
  );

  return {
    brightnessScore,
    blurScore,
    faceCenteredScore,
    faceDetected: Boolean(faceDetected),
    multipleFacesDetected,
    imageQualityScore,
    messages: input.qualitySignals?.serviceReasons ?? []
  };
}

function resolveWeights(
  imageQuality: ImageQualityResult,
  hasVisualMetrics: boolean,
  fusionResult: SkinScanFusionResult
) {
  if (!hasVisualMetrics) {
    return { visualWeight: 0, quizWeight: 0.85, historyWeight: 0.15 };
  }

  if (fusionResult.visualWeight === 0) {
    return { visualWeight: 0, quizWeight: 0.85, historyWeight: 0.15 };
  }

  if (
    imageQuality.imageQualityScore >= 0.6 &&
    imageQuality.faceDetected &&
    !imageQuality.multipleFacesDetected
  ) {
    return { visualWeight: 0.405, quizWeight: 0.495, historyWeight: 0.1 };
  }

  return { visualWeight: 0.18, quizWeight: 0.72, historyWeight: 0.1 };
}

function blendMetricSets(args: {
  visualMetrics: SkinMetricSet | null;
  quizMetrics: SkinMetricSet;
  historyMetrics: SkinMetricSet;
  weights: {
    visualWeight: number;
    quizWeight: number;
    historyWeight: number;
  };
}) {
  const visual = args.visualMetrics ?? args.quizMetrics;
  const total = args.weights.visualWeight + args.weights.quizWeight + args.weights.historyWeight;

  return mapMetricSet({
    hydration_level:
      (visual.hydration_level * args.weights.visualWeight +
        args.quizMetrics.hydration_level * args.weights.quizWeight +
        args.historyMetrics.hydration_level * args.weights.historyWeight) /
      total,
    elasticity_level:
      (visual.elasticity_level * args.weights.visualWeight +
        args.quizMetrics.elasticity_level * args.weights.quizWeight +
        args.historyMetrics.elasticity_level * args.weights.historyWeight) /
      total,
    pigmentation_level:
      (visual.pigmentation_level * args.weights.visualWeight +
        args.quizMetrics.pigmentation_level * args.weights.quizWeight +
        args.historyMetrics.pigmentation_level * args.weights.historyWeight) /
      total,
    acne_level:
      (visual.acne_level * args.weights.visualWeight +
        args.quizMetrics.acne_level * args.weights.quizWeight +
        args.historyMetrics.acne_level * args.weights.historyWeight) /
      total,
    redness_level:
      (visual.redness_level * args.weights.visualWeight +
        args.quizMetrics.redness_level * args.weights.quizWeight +
        args.historyMetrics.redness_level * args.weights.historyWeight) /
      total,
    pore_visibility:
      (visual.pore_visibility * args.weights.visualWeight +
        args.quizMetrics.pore_visibility * args.weights.quizWeight +
        args.historyMetrics.pore_visibility * args.weights.historyWeight) /
      total,
    wrinkle_depth:
      (visual.wrinkle_depth * args.weights.visualWeight +
        args.quizMetrics.wrinkle_depth * args.weights.quizWeight +
        args.historyMetrics.wrinkle_depth * args.weights.historyWeight) /
      total
  });
}

function inferSkinType(metrics: SkinMetricSet, input: FaceShieldAnalysisInput, weights: FaceShieldAnalysisResult["weights"]) {
  const explicitSkinType = normalizeSkinType(
    input.responses?.skinType ?? input.profile?.skin_type?.slug ?? input.profile?.skin_type?.name ?? null
  );
  const sensitivityLevel = input.responses?.sensitivityLevel ?? input.profile?.sensitivity_level ?? 3;

  const candidates = new Map<string, number>();
  candidates.set("oily", metrics.acne_level * 0.5 + metrics.pore_visibility * 0.45 + (100 - metrics.hydration_level) * 0.05);
  candidates.set("dry", (100 - metrics.hydration_level) * 0.6 + metrics.redness_level * 0.15 + (100 - metrics.elasticity_level) * 0.1);
  candidates.set("combination", Math.abs(metrics.pore_visibility - (100 - metrics.hydration_level)) <= 18 ? 72 : 48);
  candidates.set("sensitive", metrics.redness_level * 0.55 + sensitivityLevel * 8);
  candidates.set("acne_prone", metrics.acne_level * 0.62 + metrics.pore_visibility * 0.24);
  candidates.set("normal", 58 - Math.abs(metrics.hydration_level - 58) * 0.4);

  if (explicitSkinType) {
    candidates.set(explicitSkinType, (candidates.get(explicitSkinType) ?? 0) + weights.quizWeight * 35 + weights.historyWeight * 10);
  }

  return [...candidates.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "combination";
}

function inferConcerns(metrics: SkinMetricSet, input: FaceShieldAnalysisInput, weights: FaceShieldAnalysisResult["weights"]) {
  const candidates = new Map<ConcernSlug, number>();
  candidates.set("acne", metrics.acne_level * 0.65 + metrics.pore_visibility * 0.2);
  candidates.set("dark_spots", metrics.pigmentation_level * 0.72);
  candidates.set("dehydration", (100 - metrics.hydration_level) * 0.75);
  candidates.set("oiliness", metrics.pore_visibility * 0.45 + metrics.acne_level * 0.25);
  candidates.set("barrier_damage", metrics.redness_level * 0.64 + (100 - metrics.hydration_level) * 0.2);
  candidates.set("aging", metrics.wrinkle_depth * 0.6 + (100 - metrics.elasticity_level) * 0.28);
  candidates.set("uneven_texture", metrics.pore_visibility * 0.36 + metrics.wrinkle_depth * 0.24 + metrics.pigmentation_level * 0.18);

  const explicitConcern =
    normalizeConcern(input.responses?.mainConcern ?? null) ??
    normalizeConcern(input.profile?.main_concern?.slug ?? input.profile?.main_concern?.name ?? null);

  if (explicitConcern) {
    candidates.set(explicitConcern, (candidates.get(explicitConcern) ?? 0) + weights.quizWeight * 40 + weights.historyWeight * 8);
  }

  const sorted = [...candidates.entries()].sort((left, right) => right[1] - left[1]);
  return {
    primaryConcern: sorted[0]?.[0] ?? "dehydration",
    secondaryConcerns: sorted
      .slice(1)
      .filter(([, score]) => score >= 28)
      .slice(0, 3)
      .map(([slug]) => slug)
  };
}

function buildRegionBase(metrics: SkinMetricSet, region: FaceRegionKey): RegionAccumulator {
  const dryness = clampHundred(100 - metrics.hydration_level);
  const texture = clampHundred(metrics.pore_visibility * 0.55 + metrics.wrinkle_depth * 0.45);
  const pore = clampHundred(metrics.pore_visibility);
  const acne = clampHundred(metrics.acne_level);
  const fineLines = clampHundred(metrics.wrinkle_depth);
  const redness = clampHundred(metrics.redness_level);
  const darkSpots = clampHundred(metrics.pigmentation_level);
  const oiliness = clampHundred(metrics.pore_visibility * 0.55 + metrics.acne_level * 0.3);

  const regionMultipliers: Record<FaceRegionKey, number> = {
    forehead: 1.05,
    nose: 1.1,
    left_cheek: 0.95,
    right_cheek: 0.95,
    chin: 1.04,
    eye_area: 0.82,
    mouth_area: 0.88,
    jawline: 0.94,
    t_zone: 1.1,
    u_zone: 0.92
  };

  const multiplier = regionMultipliers[region];

  return {
    oilinessScore: clampHundred(oiliness * multiplier),
    drynessScore: clampHundred(dryness * (region === "eye_area" || region === "u_zone" ? 1.12 : 1)),
    rednessScore: clampHundred(redness * (region === "nose" || region === "left_cheek" || region === "right_cheek" ? 1.08 : 0.96)),
    darkSpotScore: clampHundred(darkSpots * (region === "left_cheek" || region === "right_cheek" ? 1.08 : 0.9)),
    textureScore: clampHundred(texture * multiplier),
    poreVisibilityScore: clampHundred(pore * (region === "nose" || region === "t_zone" ? 1.12 : 0.92)),
    acneLikelihoodScore: clampHundred(acne * (region === "chin" || region === "forehead" || region === "jawline" ? 1.08 : 0.9)),
    fineLinesScore: clampHundred(fineLines * (region === "eye_area" || region === "mouth_area" ? 1.14 : 0.86)),
    confidence: 0.45
  };
}

function applyHeatmapToRegions(
  regions: Map<FaceRegionKey, RegionAccumulator>,
  heatmapRegions: FaceHeatmapRegion[] | null | undefined,
  imageQuality: ImageQualityResult
) {
  for (const region of heatmapRegions ?? []) {
    const aliases = REGION_ALIASES[region.region_slug] ?? [];
    for (const alias of aliases) {
      const target = regions.get(alias);
      if (!target) continue;
      const boost = region.intensity * 0.16;
      if (region.condition_type === "acne") target.acneLikelihoodScore = clampHundred(target.acneLikelihoodScore + boost);
      if (region.condition_type === "hydration") target.drynessScore = clampHundred(target.drynessScore + boost);
      if (region.condition_type === "pigmentation") target.darkSpotScore = clampHundred(target.darkSpotScore + boost);
      if (region.condition_type === "pores") {
        target.poreVisibilityScore = clampHundred(target.poreVisibilityScore + boost);
        target.oilinessScore = clampHundred(target.oilinessScore + boost * 0.65);
      }
      if (region.condition_type === "wrinkles") {
        target.fineLinesScore = clampHundred(target.fineLinesScore + boost);
        target.textureScore = clampHundred(target.textureScore + boost * 0.4);
      }
      if (region.condition_type === "redness") target.rednessScore = clampHundred(target.rednessScore + boost);
      target.confidence = clampUnit(Math.max(target.confidence, 0.55 + imageQuality.imageQualityScore * 0.35));
    }
  }
}

function blendRegionSignal(base: number, next: number, influence: number) {
  const normalizedInfluence = clampUnit(influence);
  return clampHundred(base * (1 - normalizedInfluence) + next * normalizedInfluence);
}

function applyFaceMappingToRegions(
  regions: Map<FaceRegionKey, RegionAccumulator>,
  faceMapping: FaceMappingResult | null | undefined,
  imageQuality: ImageQualityResult
) {
  if (!faceMapping?.faceDetected) return;

  const mappingInfluence = clampUnit(0.28 + imageQuality.imageQualityScore * 0.42);

  for (const region of FACE_REGION_KEYS) {
    const nextRegion = faceMapping.regions[region];
    const currentRegion = regions.get(region);
    if (!currentRegion || !nextRegion) continue;

    const inferredDryness = clampHundred((1 - nextRegion.averageBrightness) * 100);
    const inferredOiliness = clampHundred(nextRegion.shineScore * 100);
    const inferredRedness = clampHundred(nextRegion.rednessScore * 100);
    const inferredDarkSpots = clampHundred(nextRegion.darkSpotScore * 100);
    const inferredTexture = clampHundred(nextRegion.textureScore * 100);
    const inferredPores = clampHundred(nextRegion.poreVisibilityScore * 100);
    const inferredAcne = clampHundred(
      (nextRegion.rednessScore * 0.32 +
        nextRegion.textureScore * 0.28 +
        nextRegion.poreVisibilityScore * 0.4) *
        100
    );
    const inferredFineLines = clampHundred(
      ((1 - nextRegion.averageBrightness) * 0.28 + nextRegion.textureScore * 0.72) * 100
    );

    regions.set(region, {
      oilinessScore: blendRegionSignal(currentRegion.oilinessScore, inferredOiliness, mappingInfluence),
      drynessScore: blendRegionSignal(currentRegion.drynessScore, inferredDryness, mappingInfluence * 0.9),
      rednessScore: blendRegionSignal(currentRegion.rednessScore, inferredRedness, mappingInfluence),
      darkSpotScore: blendRegionSignal(currentRegion.darkSpotScore, inferredDarkSpots, mappingInfluence * 0.92),
      textureScore: blendRegionSignal(currentRegion.textureScore, inferredTexture, mappingInfluence),
      poreVisibilityScore: blendRegionSignal(currentRegion.poreVisibilityScore, inferredPores, mappingInfluence),
      acneLikelihoodScore: blendRegionSignal(currentRegion.acneLikelihoodScore, inferredAcne, mappingInfluence),
      fineLinesScore: blendRegionSignal(currentRegion.fineLinesScore, inferredFineLines, mappingInfluence * 0.88),
      confidence: clampUnit(
        Math.max(currentRegion.confidence, nextRegion.confidence * (0.72 + imageQuality.imageQualityScore * 0.28))
      )
    });
  }
}

function buildRegionAnalysis(metrics: SkinMetricSet, input: FaceShieldAnalysisInput, imageQuality: ImageQualityResult) {
  const map = new Map<FaceRegionKey, RegionAccumulator>();
  for (const region of FACE_REGION_KEYS) {
    map.set(region, buildRegionBase(metrics, region));
  }

  applyHeatmapToRegions(map, input.heatmapRegions, imageQuality);
  applyFaceMappingToRegions(map, input.faceMapping, imageQuality);

  return FACE_REGION_KEYS.map((region) => ({
    region,
    ...(map.get(region) as RegionAccumulator),
    confidence: clampUnit((map.get(region)?.confidence ?? 0.45) + imageQuality.imageQualityScore * 0.25)
  }));
}

function buildRoutineRecommendation(probableSkinType: string, concerns: ConcernSlug[]) {
  const primaryConcern = concerns[0] ?? "dehydration";
  const steps: FaceShieldAnalysisResult["routineRecommended"]["steps"] = [];

  const addStep = (
    key: RoutineStepKey,
    title: string,
    focus: string,
    recommendedIngredients: string[],
    rationale: string
  ) => {
    steps.push({ key, title, focus, recommendedIngredients, rationale });
  };

  if (probableSkinType === "oily" || primaryConcern === "acne" || primaryConcern === "oiliness") {
    addStep(
      "cleanser",
      "Limpeza",
      "Limpeza suave que controla brilho sem ressecar.",
      ["niacinamida", "zinco", "agentes de limpeza suaves"],
      "Ajuda a equilibrar oleosidade e manter conforto na rotina."
    );
  } else {
    addStep(
      "cleanser",
      "Limpeza",
      "Limpeza gentil para preservar conforto e barreira.",
      ["agentes de limpeza suaves", "glicerina"],
      "Mantem a rotina limpa sem remover o conforto da pele."
    );
  }

  if (primaryConcern === "dark_spots") {
    addStep(
      "treatment",
      "Tratamento",
      "Foco em uniformidade e luminosidade gradual.",
      ["vitamina C", "niacinamida", "acido tranexamico", "alfa-arbutin"],
      "A rotina sugerida prioriza uniformidade e proteção diaria."
    );
  } else if (primaryConcern === "acne") {
    addStep(
      "treatment",
      "Tratamento",
      "Controle suave de textura e excesso de oleosidade.",
      ["niacinamida", "acido salicilico"],
      "A leitura visual assistida indica foco em equilibrio e textura."
    );
  } else if (primaryConcern === "aging") {
    addStep(
      "treatment",
      "Tratamento",
      "Renovacao gradual com antioxidantes e peptideos.",
      ["peptideos", "antioxidantes", "hidratação progressiva"],
      "A prioridade agora e reforcar elasticidade e suavidade."
    );
  } else if (primaryConcern === "barrier_damage") {
    addStep(
      "treatment",
      "Tratamento",
      "Conforto e reforco de barreira cutanea.",
      ["centella asiatica", "pantenol", "ceramidas"],
      "A rotina sugerida busca reduzir desconforto e preservar equilibrio."
    );
  } else {
    addStep(
      "treatment",
      "Tratamento",
      "Hidratação equilibrada com reforco de luminosidade.",
      ["acido hialuronico", "niacinamida", "pantenol"],
      "A prioridade agora e manter a pele equilibrada e luminosa."
    );
  }

  if (probableSkinType === "dry") {
    addStep(
      "moisturizer",
      "Hidratação",
      "Texturas nutritivas com reforco de barreira.",
      ["ceramidas", "pantenol", "acido hialuronico"],
      "Ajuda a manter conforto e reduzir sensacao de ressecamento."
    );
  } else if (probableSkinType === "sensitive") {
    addStep(
      "moisturizer",
      "Hidratação",
      "Hidratação suave com foco em barreira.",
      ["ceramidas", "centella asiatica", "pantenol"],
      "A rotina sugerida prioriza conforto e compatibilidade."
    );
  } else {
    addStep(
      "moisturizer",
      "Hidratação",
      "Hidratação leve e equilibrada para uso continuo.",
      ["acido hialuronico", "glicerina", "niacinamida"],
      "Mantem a rotina funcional sem pesar."
    );
  }

  addStep(
    "sunscreen",
    "Proteção solar",
    probableSkinType === "oily" ? "Proteção com toque seco." : "Proteção diaria de uso confortavel.",
    probableSkinType === "oily" ? ["filtros UV", "toque seco"] : ["filtros UV", "hidratação leve"],
    "A proteção solar ajuda a sustentar resultado e uniformidade da rotina."
  );

  if (primaryConcern === "aging" || primaryConcern === "uneven_texture" || primaryConcern === "dark_spots") {
    addStep(
      "complement",
      "Complemento",
      "Etapa opcional para elevar consistencia e acabamento da rotina.",
      primaryConcern === "aging" ? ["peptideos"] : primaryConcern === "dark_spots" ? ["vitamina C"] : ["renovacao suave"],
      "Entra como complemento sem sobrecarregar a decisão de compra."
    );
  }

  return { steps };
}

function getCandidateTags(candidate: NonNullable<FaceShieldAnalysisInput["productCandidates"]>[number]) {
  const fromTags = Array.isArray(candidate.tags) ? candidate.tags : [];
  const fromText = [candidate.category, candidate.name, candidate.title]
    .filter(Boolean)
    .flatMap((value) => normalizeText(value).split(" "))
    .filter((token) => token.length >= 2);

  return Array.from(new Set([...fromTags.map((item) => normalizeText(item)), ...fromText])).filter(Boolean);
}

function inferRecommendedStep(tags: string[]): ProductMatch["recommendedStep"] {
  if (tags.some((tag) => tag.includes("categoria_protetor") || tag.includes("protetor") || tag.includes("spf"))) {
    return "sunscreen";
  }
  if (tags.some((tag) => tag.includes("categoria_hidratante") || tag.includes("hidrat") || tag.includes("cream") || tag.includes("gel cream"))) {
    return "moisturizer";
  }
  if (tags.some((tag) => tag.includes("categoria_limpeza") || tag.includes("cleanser") || tag.includes("limpeza"))) {
    return "cleanser";
  }
  if (tags.some((tag) => tag.includes("categoria_serum") || tag.includes("serum") || tag.includes("tratamento"))) {
    return "treatment";
  }
  return "complement";
}

function scoreBudgetFit(priceCents: number | null, budget: BudgetPreference) {
  if (priceCents === null) return 0.6;
  if (budget === "essencial") {
    if (priceCents <= 15000) return 1;
    if (priceCents <= 25000) return 0.7;
    return 0.35;
  }
  if (budget === "intermediaria") {
    if (priceCents >= 12000 && priceCents <= 35000) return 1;
    if (priceCents <= 45000) return 0.7;
    return 0.45;
  }
  if (priceCents >= 30000) return 1;
  if (priceCents >= 20000) return 0.75;
  return 0.5;
}

function scoreTexturePreference(tags: string[], probableSkinType: string, preference: string | null | undefined) {
  const normalizedPreference = normalizeText(preference);
  const wantsLight =
    normalizedPreference.includes("leve") ||
    normalizedPreference.includes("gel") ||
    probableSkinType === "oily" ||
    probableSkinType === "acne_prone";
  const wantsRich =
    normalizedPreference.includes("rico") ||
    normalizedPreference.includes("nutrit") ||
    probableSkinType === "dry";

  if (wantsLight) {
    return tags.some((tag) => tag.includes("oil") || tag.includes("gel") || tag.includes("toque seco")) ? 1 : 0.55;
  }
  if (wantsRich) {
    return tags.some((tag) => tag.includes("cream") || tag.includes("balm") || tag.includes("ceram")) ? 1 : 0.55;
  }
  return 0.7;
}

function buildProductMatches(
  input: FaceShieldAnalysisInput,
  probableSkinType: string,
  concerns: ConcernSlug[],
  safetyWarnings: string[]
) {
  const candidates = input.productCandidates ?? [];
  if (candidates.length === 0) return [] as ProductMatch[];

  const budget = mapBudgetPreference(
    input.preferences?.budgetPreference ?? input.responses?.budgetPreference ?? null,
    input.profile?.price_affinity_cents ?? null
  );
  const texturePreference = input.preferences?.texturePreference ?? input.responses?.texturePreference ?? null;
  const sensitivityLevel = input.responses?.sensitivityLevel ?? input.profile?.sensitivity_level ?? 3;
  const pregnancyFlag = Boolean(input.restrictions?.isPregnant);
  const normalizedSkinTagMap: Record<string, string[]> = {
    oily: ["skin_oleosa", "oily", "oil free", "toque seco"],
    dry: ["skin_seca", "dry", "ceram", "hydrat"],
    combination: ["skin_mista", "combination"],
    sensitive: ["skin_sensivel", "sensitive", "gentle", "pantenol", "centella", "ceram"],
    acne_prone: ["objetivo_acne", "skin_oleosa", "nao comedogenico"]
  };
  const concernTagMap: Record<ConcernSlug, string[]> = {
    acne: ["objetivo_acne", "acne", "salic", "niacinamida"],
    dark_spots: ["objetivo_manchas", "vitamina c", "niacinamida", "tranexam", "arbutin"],
    dehydration: ["hidrat", "acido hialuronico", "ceram", "pantenol"],
    oiliness: ["oil free", "toque seco", "niacinamida", "limpeza"],
    barrier_damage: ["ceram", "centella", "pantenol", "gentle", "skin_sensivel"],
    aging: ["objetivo_antissinais", "peptid", "antioxid", "retinol"],
    uneven_texture: ["objetivo_glow", "renov", "textura", "niacinamida"]
  };

  const scored = candidates.map((candidate) => {
    const tags = getCandidateTags(candidate);
    const recommendedStep = inferRecommendedStep(tags);
    const skinTypeMatch = clampUnit(
      tags.some((tag) => normalizedSkinTagMap[probableSkinType]?.some((needle) => tag.includes(needle))) ? 1 : 0.55
    );
    const concernMatch = clampUnit(
      Math.max(
        ...concerns.map((concern) =>
          tags.some((tag) => concernTagMap[concern]?.some((needle) => tag.includes(needle))) ? 1 : 0.45
        ),
        0.35
      )
    );

    let sensitivityCompatibility = sensitivityLevel >= 4 ? 0.45 : 0.75;
    if (tags.some((tag) => ["gentle", "skin_sensivel", "ceram", "pantenol", "centella"].some((needle) => tag.includes(needle)))) {
      sensitivityCompatibility = 1;
    }
    if (tags.some((tag) => ["retinol", "strong acid", "aha", "bha", "esfoliante forte"].some((needle) => tag.includes(needle)))) {
      sensitivityCompatibility = clampUnit(sensitivityCompatibility - 0.35);
    }
    if (pregnancyFlag && tags.some((tag) => ["retinol", "retinal", "retinoid"].some((needle) => tag.includes(needle)))) {
      sensitivityCompatibility = clampUnit(sensitivityCompatibility - 0.45);
    }

    const budgetFit = scoreBudgetFit(candidate.price_cents, budget);
    const textureFit = scoreTexturePreference(tags, probableSkinType, texturePreference);
    const matchScore = Math.round(
      skinTypeMatch * 30 +
        concernMatch * 35 +
        sensitivityCompatibility * 15 +
        textureFit * 10 +
        budgetFit * 10
    );

    const reasons = [
      skinTypeMatch >= 0.85 ? "Compatibilidade alta com o perfil provavel da pele." : null,
      concernMatch >= 0.85 ? "Conversa bem com a prioridade principal desta leitura assistida." : null,
      sensitivityCompatibility >= 0.85 ? "Textura e proposta mais suaves para rotina continua." : null,
      budgetFit >= 0.85 ? "Faixa de preco alinhada com a afinidade atual." : null
    ].filter((item): item is string => Boolean(item));

    if (pregnancyFlag && tags.some((tag) => ["retinol", "retinal", "retinoid"].some((needle) => tag.includes(needle)))) {
      reasons.push("Pede alerta cosmético extra em caso de gestacao.");
    }

    return {
      productId: candidate.id,
      slug: candidate.slug,
      name: candidate.name ?? candidate.title ?? "Produto BelaPop",
      brand: candidate.brand,
      category: candidate.category,
      heroImageUrl: candidate.hero_image_url,
      priceCents: candidate.price_cents,
      tags,
      recommendedStep,
      matchScore,
      skinTypeMatch,
      concernMatch,
      sensitivityCompatibility,
      texturePreference: textureFit,
      budgetFit,
      reasons
    } satisfies ProductMatch;
  });

  const selected = [...scored]
    .sort((left, right) => right.matchScore - left.matchScore)
    .filter((candidate, index, array) => array.findIndex((item) => item.productId === candidate.productId) === index)
    .slice(0, 8);

  if (safetyWarnings.length > 0) {
    return selected.map((item) => ({
      ...item,
      reasons: [...item.reasons, ...safetyWarnings.slice(0, 1)]
    }));
  }

  return selected;
}

function buildCosmeticSafetyWarnings(
  metrics: SkinMetricSet,
  input: FaceShieldAnalysisInput,
  concerns: ConcernSlug[]
) {
  const warnings: string[] = [];
  if (metrics.acne_level >= 78) {
    warnings.push("Leitura visual assistida sugere atenção extra para acne mais intensa.");
  }
  if (metrics.pigmentation_level >= 74) {
    warnings.push("Se as manchas forem recentes ou mudarem rapido, vale buscar orientacao dermatológica.");
  }
  if (metrics.redness_level >= 76) {
    warnings.push("Ha sinal de sensibilidade elevada; prefira introducao gradual e formulas suaves.");
  }
  if (Boolean(input.restrictions?.isPregnant)) {
    warnings.push("Em caso de gestacao, priorize confirmacao cosmética antes de ativos mais intensos.");
  }
  if (concerns.includes("barrier_damage")) {
    warnings.push("A rotina sugerida usa linguagem cosmética e não substitui avaliação médica.");
  }
  return warnings;
}

function confidenceFromSignals(
  input: FaceShieldAnalysisInput,
  imageQuality: ImageQualityResult,
  probableSkinType: string,
  primaryConcern: ConcernSlug
) {
  const explicitSkinType = normalizeSkinType(
    input.responses?.skinType ?? input.profile?.skin_type?.slug ?? input.profile?.skin_type?.name ?? null
  );
  const explicitConcern =
    normalizeConcern(input.responses?.mainConcern ?? null) ??
    normalizeConcern(input.profile?.main_concern?.slug ?? input.profile?.main_concern?.name ?? null);
  const agreementBoost =
    (explicitSkinType && explicitSkinType === probableSkinType ? 0.08 : 0) +
    (explicitConcern && explicitConcern === primaryConcern ? 0.08 : 0);
  const historyBoost = (input.recentScans?.length ?? 0) > 0 ? 0.07 : 0;
  return clampUnit(0.48 + imageQuality.imageQualityScore * 0.25 + agreementBoost + historyBoost);
}

function buildRecommendationReasons(
  result: Pick<FaceShieldAnalysisResult, "probableSkinProfile" | "weights" | "imageQuality" | "fusionResult">
) {
  const reasons = [
    result.fusionResult.explanation,
    `Perfil provavel identificado como ${result.probableSkinProfile.skinType}.`,
    `Prioridade principal desta leitura assistida: ${result.probableSkinProfile.primaryConcern}.`
  ];

  if (result.weights.visualWeight === 0) {
    reasons.push("A recomendação foi reforcada por respostas declaradas e histórico, sem depender da imagem.");
  } else if (result.imageQuality.imageQualityScore < 0.6) {
    reasons.push("A imagem teve peso reduzido para manter a recomendação util e conservadora.");
  } else {
    reasons.push("Imagem, respostas declaradas e histórico foram combinados com pesos equilibrados.");
  }

  return reasons;
}

function buildHeatmapFromAnalysis(regions: FaceRegionAnalysis[], primaryConcern: ConcernSlug): FaceHeatmapRegion[] {
  const topRegions = [...regions]
    .sort((left, right) => {
      const leftValue =
        primaryConcern === "acne"
          ? left.acneLikelihoodScore
          : primaryConcern === "dark_spots"
            ? left.darkSpotScore
            : primaryConcern === "aging"
              ? left.fineLinesScore
              : primaryConcern === "barrier_damage"
                ? left.rednessScore
                : primaryConcern === "oiliness"
                  ? left.oilinessScore
                  : left.drynessScore;
      const rightValue =
        primaryConcern === "acne"
          ? right.acneLikelihoodScore
          : primaryConcern === "dark_spots"
            ? right.darkSpotScore
            : primaryConcern === "aging"
              ? right.fineLinesScore
              : primaryConcern === "barrier_damage"
                ? right.rednessScore
                : primaryConcern === "oiliness"
                  ? right.oilinessScore
                  : right.drynessScore;
      return rightValue - leftValue;
    })
    .slice(0, 4);

  return topRegions.map((region) => ({
    condition_type:
      primaryConcern === "acne"
        ? "acne"
        : primaryConcern === "dark_spots"
          ? "pigmentation"
          : primaryConcern === "aging"
            ? "wrinkles"
            : primaryConcern === "barrier_damage"
              ? "redness"
              : primaryConcern === "oiliness"
                ? "pores"
                : "hydration",
    region_slug: region.region,
    intensity:
      primaryConcern === "acne"
        ? region.acneLikelihoodScore
        : primaryConcern === "dark_spots"
          ? region.darkSpotScore
          : primaryConcern === "aging"
            ? region.fineLinesScore
            : primaryConcern === "barrier_damage"
              ? region.rednessScore
              : primaryConcern === "oiliness"
                ? region.poreVisibilityScore
                : region.drynessScore,
    position_x:
      region.region === "left_cheek"
        ? 0.34
        : region.region === "right_cheek"
          ? 0.66
          : region.region === "nose" || region.region === "t_zone"
            ? 0.5
            : region.region === "chin"
              ? 0.52
              : region.region === "eye_area"
                ? 0.62
                : region.region === "jawline"
                  ? 0.64
                  : 0.5,
    position_y:
      region.region === "forehead"
        ? 0.2
        : region.region === "nose"
          ? 0.45
          : region.region === "left_cheek" || region.region === "right_cheek"
            ? 0.54
            : region.region === "chin"
              ? 0.77
              : region.region === "eye_area"
                ? 0.34
                : region.region === "jawline"
                  ? 0.71
                  : 0.58,
    radius: region.region === "t_zone" || region.region === "u_zone" ? 0.14 : 0.1
  }));
}

export function createFaceShieldAnalysis(input: FaceShieldAnalysisInput): FaceShieldAnalysisResult {
  const profileReference = buildProfileReference(input);
  const quizMetrics = deriveBaselineMetrics(profileReference);
  const historyMetrics = metricSetFromHistory(input.recentScans, quizMetrics);
  const visualMetrics = metricSetFromVisual(mergeVisualMetricSources(input.visualMetrics, input.faceMapping));
  const imageQuality = computeImageQuality(input);
  const fusionResult = createSkinScanFusionResult({
    hasImage: Boolean(input.image?.provided),
    hasQuizSignals: Boolean(
      input.responses?.skinType ||
        input.responses?.mainConcern ||
        input.responses?.objectives?.length ||
        input.profile?.skin_type?.slug ||
        input.profile?.main_concern?.slug
    ),
    hasHistorySignals: Boolean(input.recentScans?.length),
    faceMapping: input.faceMapping ?? null
  });
  const weights = resolveWeights(imageQuality, Boolean(visualMetrics), fusionResult);
  const blendedMetrics = blendMetricSets({
    visualMetrics,
    quizMetrics,
    historyMetrics,
    weights
  });
  const probableSkinType = inferSkinType(blendedMetrics, input, weights);
  const { primaryConcern, secondaryConcerns } = inferConcerns(blendedMetrics, input, weights);
  const confidenceLevel = clampUnit(
    confidenceFromSignals(input, imageQuality, probableSkinType, primaryConcern) * 0.7 +
      fusionResult.confidenceScore * 0.3
  );
  const regionsAnalyzed = buildRegionAnalysis(blendedMetrics, input, imageQuality);
  const concernsDetected = [primaryConcern, ...secondaryConcerns];
  const cosmeticSafetyWarnings = buildCosmeticSafetyWarnings(blendedMetrics, input, concernsDetected);
  const routineRecommended = buildRoutineRecommendation(probableSkinType, concernsDetected);
  const productsCompatible = buildProductMatches(input, probableSkinType, concernsDetected, cosmeticSafetyWarnings);
  const recommendationReasons = buildRecommendationReasons({
    probableSkinProfile: {
      skinType: probableSkinType,
      primaryConcern,
      secondaryConcerns,
      sensitivityLevel: profileReference.sensitivity_level ?? 3,
      confidence: confidenceLevel
    },
    weights,
    imageQuality,
    fusionResult
  });

  return {
    probableSkinProfile: {
      skinType: probableSkinType,
      primaryConcern,
      secondaryConcerns,
      sensitivityLevel: profileReference.sensitivity_level ?? 3,
      confidence: confidenceLevel
    },
    confidenceLevel,
    imageQuality,
    concernsDetected,
    regionsAnalyzed,
    fusionResult,
    weights,
    weightedMetrics: {
      hydrationScore: blendedMetrics.hydration_level,
      acneScore: blendedMetrics.acne_level,
      pigmentationScore: blendedMetrics.pigmentation_level,
      rednessScore: blendedMetrics.redness_level,
      elasticityScore: blendedMetrics.elasticity_level,
      poreVisibility: blendedMetrics.pore_visibility,
      wrinkleDepth: blendedMetrics.wrinkle_depth
    },
    routineRecommended,
    productsCompatible,
    evidenceSummary: null,
    recommendationReasons,
    cosmeticSafetyWarnings,
    analysisMode:
      weights.visualWeight === 0
        ? "fallback_without_image"
        : imageQuality.imageQualityScore >= 0.6
          ? "validated_visual"
          : "degraded_visual",
    mediaPipeReady: {
      adapter: "mediapipe-face-mesh",
      status: "ready_for_integration",
      landmarkSchemaVersion: "v1"
    }
  };
}

export async function createFaceShieldAnalysisWithEvidence(
  admin: AdminClient,
  input: FaceShieldAnalysisInput
): Promise<FaceShieldAnalysisResult> {
  const baseResult = createFaceShieldAnalysis(input);
  const metrics = mapMetricSet({
    hydration_level: baseResult.weightedMetrics.hydrationScore,
    elasticity_level: baseResult.weightedMetrics.elasticityScore,
    pigmentation_level: baseResult.weightedMetrics.pigmentationScore,
    acne_level: baseResult.weightedMetrics.acneScore,
    redness_level: baseResult.weightedMetrics.rednessScore,
    pore_visibility: baseResult.weightedMetrics.poreVisibility,
    wrinkle_depth: baseResult.weightedMetrics.wrinkleDepth
  });

  try {
    const primaryConcern = baseResult.probableSkinProfile.primaryConcern as ConcernSlug;
    const knowledgeDocuments = await getRankedDermatologyKnowledge(admin, {
      question: buildEvidenceSearchQuestion(input, baseResult),
      concernSlug: toConcernTopicSlug(primaryConcern),
      profile: input.profile ?? null,
      metrics,
      latestOverallScore: weightedOverallScore(metrics),
      searchLimit: 8,
      topN: 3,
      strictTopicMatch: true
    });

    const evidenceSummary = buildEvidenceSummary(primaryConcern, knowledgeDocuments);

    return {
      ...baseResult,
      routineRecommended: applyEvidenceToRoutine(baseResult.routineRecommended, evidenceSummary),
      productsCompatible: applyEvidenceToProducts(baseResult.productsCompatible, evidenceSummary),
      evidenceSummary,
      recommendationReasons: applyEvidenceToReasons(baseResult.recommendationReasons, evidenceSummary)
    };
  } catch {
    return baseResult;
  }
}

export function buildFaceShieldAnalysisStorageSnapshot(result: FaceShieldAnalysisResult) {
  return {
    version: 3,
    analysis_mode: result.analysisMode,
    probable_skin_profile: result.probableSkinProfile,
    image_quality: result.imageQuality,
    fusion_result: result.fusionResult,
    weights: result.weights,
    concerns_detected: result.concernsDetected,
    evidence_summary: result.evidenceSummary
      ? {
          topic_slug: result.evidenceSummary.topicSlug,
          strength_label: result.evidenceSummary.strengthLabel,
          lead_copy: result.evidenceSummary.leadCopy,
          explanation: result.evidenceSummary.explanation,
          supported_ingredients: result.evidenceSummary.supportedIngredients,
          documents: result.evidenceSummary.documents
        }
      : null,
    recommendation_reasons: result.recommendationReasons,
    cosmetic_safety_warnings: result.cosmeticSafetyWarnings,
    routine_recommended: {
      steps: result.routineRecommended.steps.map((step) => ({
        key: step.key,
        title: step.title,
        focus: step.focus,
        rationale: step.rationale
      }))
    },
    product_matches: result.productsCompatible.slice(0, 5).map((item) => ({
      product_id: item.productId,
      slug: item.slug,
      step: item.recommendedStep,
      match_score: item.matchScore,
      reasons: item.reasons
    })),
    regions_analyzed: result.regionsAnalyzed,
    mediapipe_ready: result.mediaPipeReady
  };
}

export function buildHeatmapRegionsFromAnalysis(result: FaceShieldAnalysisResult) {
  return buildHeatmapFromAnalysis(result.regionsAnalyzed, result.probableSkinProfile.primaryConcern as ConcernSlug);
}
