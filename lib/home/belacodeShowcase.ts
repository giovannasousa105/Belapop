import "server-only";

import { cache } from "react";

import type { EditorialProduct } from "@/lib/queries/products";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type PublicBelaCodeSnapshot = {
  score: number;
  validatedSampleCount: number;
  dominantConcern: string | null;
  latestUpdatedAt: string | null;
};

export type PublicBelaCodeShowcase = {
  score: number;
  scoreDisplay: string;
  validatedSampleCount: number;
  dominantConcern: string | null;
  dominantConcernLabel: string;
  summary: string;
  sidebarSummary: string;
  statusLabel: string;
  routineProducts: EditorialProduct[];
};

const DEFAULT_SCORE = 76;
const DEFAULT_CONCERN = "barrier_damage";
const SNAPSHOT_SAMPLE_SIZE = 32;

const CONCERN_COPY: Record<
  string,
  {
    label: string;
    summary: string;
    sidebarSummary: string;
    productKeywords: string[];
  }
> = {
  acne: {
    label: "Acne e cravos",
    summary: "Acne, textura irregular e brilho localizado lideram a leitura publica mais recente.",
    sidebarSummary: "A leitura atual pede controle de oleosidade, textura mais limpa e suporte de barreira.",
    productKeywords: ["acne", "oleo", "oleosidade", "gel", "clean", "clarify", "purify", "poros", "niacin"]
  },
  dark_spots: {
    label: "Manchas e marcas",
    summary: "Pigmentacao desigual, marcas visiveis e perda de uniformidade puxam a leitura dominante.",
    sidebarSummary: "A leitura atual pede uniformizacao, luminosidade estavel e fotoprotecao consistente.",
    productKeywords: ["lumi", "glow", "bright", "radiance", "mancha", "pigment", "tone", "uniform", "solar"]
  },
  dehydration: {
    label: "Desidratacao",
    summary: "Conforto reduzido, viço menor e necessidade de hidratacao refinada concentram a leitura publica.",
    sidebarSummary: "A leitura atual pede hidratacao inteligente, conforto imediato e textura mais macia.",
    productKeywords: ["hydr", "essence", "dew", "rosee", "cream", "comfort", "moist", "ceramide", "repair"]
  },
  barrier_damage: {
    label: "Barreira sensibilizada",
    summary: "Barreira sensibilizada, textura irregular e necessidade de reparacao elegante seguem no centro da leitura.",
    sidebarSummary: "A leitura atual pede reparacao de barreira, rotina gentil e protecao diaria consistente.",
    productKeywords: ["barrier", "repair", "ceramide", "cream", "calm", "comfort", "soothing", "restore"]
  },
  rosacea: {
    label: "Vermelhidao e rosacea",
    summary: "Vermelhidao reativa, sensibilidade e cuidado calmante aparecem como prioridade atual.",
    sidebarSummary: "A leitura atual pede menos agressao, mais conforto e rotina calmante.",
    productKeywords: ["calm", "sensitive", "comfort", "barrier", "repair", "soothing", "gentle", "cream"]
  },
  aging: {
    label: "Linhas finas e firmeza",
    summary: "Linhas, textura e perda sutil de firmeza concentram a leitura atual do BelaCode.",
    sidebarSummary: "A leitura atual pede rotina noturna de firmeza, textura lisa e protecao impecavel.",
    productKeywords: ["night", "nuit", "sculpt", "firm", "lift", "renew", "serum", "peptide"]
  }
};

function normalizeToken(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatStatusLabel(validatedSampleCount: number, latestUpdatedAt: string | null) {
  if (validatedSampleCount <= 0 || !latestUpdatedAt) {
    return "Curadoria ativa";
  }

  const date = new Date(latestUpdatedAt);
  if (Number.isNaN(date.getTime())) {
    return `${validatedSampleCount} leituras validadas`;
  }

  return `${validatedSampleCount} leituras validadas - ${date.toLocaleDateString("pt-BR")}`;
}

function resolveConcernCopy(rawConcern: string | null | undefined) {
  const concern = normalizeToken(rawConcern).replaceAll("-", "_");
  return {
    concern,
    copy: CONCERN_COPY[concern] ?? CONCERN_COPY[DEFAULT_CONCERN]
  };
}

function scoreProductForConcern(product: EditorialProduct, concern: string | null) {
  const { copy } = resolveConcernCopy(concern);
  const searchableText = normalizeToken(
    [
      product.title,
      product.category,
      product.badge,
      product.brand,
      product.editorialReason,
      product.ritual,
      product.texture,
      ...(product.tags ?? []),
      ...(product.sensation ?? []),
      ...(product.result ?? [])
    ].join(" ")
  );

  let score = 0;

  for (const keyword of copy.productKeywords) {
    if (searchableText.includes(keyword)) score += 4;
  }

  const category = normalizeToken(product.category);
  if (category.includes("skincare")) score += 2;
  if (category.includes("bem-estar")) score -= 1;
  if (category.includes("maquiagem") && concern !== "dark_spots") score -= 1;

  return score;
}

function pickRoutineProducts(products: EditorialProduct[], concern: string | null) {
  const skincareOnly = products.filter((product) => normalizeToken(product.category) === "skincare");
  const candidateProducts = skincareOnly.length >= 4 ? skincareOnly : products;

  const sorted = [...candidateProducts].sort((left, right) => {
    const scoreDelta = scoreProductForConcern(right, concern) - scoreProductForConcern(left, concern);
    if (scoreDelta !== 0) return scoreDelta;
    return right.price_cents - left.price_cents;
  });

  return sorted.slice(0, 4);
}

const getPublicBelaCodeSnapshot = cache(async (): Promise<PublicBelaCodeSnapshot> => {
  try {
    const admin = getSupabaseAdminClient();
    const { data: scans, error: scansError } = await admin
      .from("face_scans")
      .select("id,created_at,updated_at")
      .eq("scan_status", "validated")
      .order("created_at", { ascending: false })
      .limit(SNAPSHOT_SAMPLE_SIZE);

    if (scansError || !scans?.length) {
      return {
        score: DEFAULT_SCORE,
        validatedSampleCount: 0,
        dominantConcern: DEFAULT_CONCERN,
        latestUpdatedAt: null
      };
    }

    const scanIds = scans.map((item) => item.id).filter(Boolean);
    const { data: scores, error: scoresError } = await admin
      .from("skin_scores")
      .select("scan_id,overall_score,main_concern")
      .in("scan_id", scanIds);

    if (scoresError || !scores?.length) {
      return {
        score: DEFAULT_SCORE,
        validatedSampleCount: scans.length,
        dominantConcern: DEFAULT_CONCERN,
        latestUpdatedAt: scans[0]?.updated_at ?? scans[0]?.created_at ?? null
      };
    }

    const validScores = scores
      .map((item) => Number(item.overall_score))
      .filter((value) => Number.isFinite(value) && value > 0);

    const concernFrequency = new Map<string, number>();
    for (const item of scores) {
      const concern = normalizeToken(item.main_concern).replaceAll("-", "_");
      if (!concern) continue;
      concernFrequency.set(concern, (concernFrequency.get(concern) ?? 0) + 1);
    }

    const dominantConcern =
      [...concernFrequency.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? DEFAULT_CONCERN;

    const score =
      validScores.length > 0
        ? Math.max(0, Math.min(100, Math.round(validScores.reduce((total, value) => total + value, 0) / validScores.length)))
        : DEFAULT_SCORE;

    return {
      score,
      validatedSampleCount: scores.length,
      dominantConcern,
      latestUpdatedAt: scans[0]?.updated_at ?? scans[0]?.created_at ?? null
    };
  } catch {
    return {
      score: DEFAULT_SCORE,
      validatedSampleCount: 0,
      dominantConcern: DEFAULT_CONCERN,
      latestUpdatedAt: null
    };
  }
});

export async function getPublicBelaCodeShowcase(
  products: EditorialProduct[]
): Promise<PublicBelaCodeShowcase> {
  const snapshot = await getPublicBelaCodeSnapshot();
  const routineProducts = pickRoutineProducts(products, snapshot.dominantConcern);

  if (snapshot.validatedSampleCount <= 0) {
    return {
      score: snapshot.score,
      scoreDisplay: "--",
      validatedSampleCount: 0,
      dominantConcern: null,
      dominantConcernLabel: "Radar publico em preparacao",
      summary:
        "O bloco publico passa a refletir leituras validadas do BelaCode assim que houver amostra suficiente para mostrar tendencia real.",
      sidebarSummary:
        "Assim que houver leituras validadas suficientes, este radar passa a mostrar a tendencia publica do BelaCode.",
      statusLabel: "Aguardando leituras validadas",
      routineProducts
    };
  }

  const { concern, copy } = resolveConcernCopy(snapshot.dominantConcern);

  return {
    score: snapshot.score,
    scoreDisplay: String(snapshot.score),
    validatedSampleCount: snapshot.validatedSampleCount,
    dominantConcern: concern,
    dominantConcernLabel: copy.label,
    summary: copy.summary,
    sidebarSummary: copy.sidebarSummary,
    statusLabel: formatStatusLabel(snapshot.validatedSampleCount, snapshot.latestUpdatedAt),
    routineProducts: pickRoutineProducts(products, concern)
  };
}
