import type { CustomerSkinProfile } from "@/lib/customer/api";
import type { SkinMetricSet } from "@/lib/skincare/twin";
import {
  buildEvidenceBadge,
  evidenceLeadCopy,
  evidenceStrengthLabel,
  formatEvidenceCitation,
  type EvidenceDocument
} from "@/lib/skingpt/evidence";

type DermatologyConditionRow = {
  id: string;
  slug: string;
  condition_name: string;
  description: string | null;
  symptoms: string | null;
  recommended_ingredients: string | null;
  contraindications: string | null;
};

type DermatologyDocumentRow = {
  id: string;
  slug: string;
  title: string;
  topic_slug: string;
  body: string;
  source_label: string | null;
  source_url: string | null;
  metadata?: Record<string, unknown> | null;
  similarity?: number | null;
};

type IngredientRecommendationRow = {
  condition_id: string;
  condition_slug: string;
  ingredient_name: string;
  ingredient_slug: string;
  recommendation_strength: number;
  notes: string | null;
};

export type SkinGptContext = {
  question: string;
  profile: CustomerSkinProfile | null;
  metrics: SkinMetricSet;
  latestOverallScore: number | null;
  conditions: DermatologyConditionRow[];
  knowledgeDocuments: DermatologyDocumentRow[];
  ingredientLinks: IngredientRecommendationRow[];
  recommendedProducts: Array<{
    product_name: string;
    routine_step_name: string;
    score: number;
  }>;
};

export type SkinGptAnswer = {
  answer: string;
  highlights: string[];
  suggested_ingredients: string[];
  suggested_routine_focus: string[];
  citations: string[];
  disclaimers: string[];
  source_mode: "fallback" | "llm";
};

const concernSlugMap: Record<string, string> = {
  acne: "acne",
  oiliness: "oiliness",
  visible_pores: "visible-pores",
  dark_spots: "dark-spots",
  rosacea: "rosacea",
  dehydration: "dehydration",
  aging: "aging",
  barrier_damage: "barrier-damage",
  uneven_texture: "uneven-texture",
  under_eye: "under-eye"
};

const concernUserCopy: Record<string, string> = {
  acne: "controlar inflamacao, desobstruir poros e evitar excesso de agressao",
  oiliness: "reduzir brilho excessivo, controlar poros e equilibrar a limpeza sem rebote",
  "visible-pores": "controlar a oleosidade e melhorar a textura para reduzir a aparencia dos poros",
  "dark-spots": "reduzir a pigmentacao sem irritar e manter fotoprotecao diaria",
  rosacea: "acalmar a pele e cortar estimulos que costumam piorar vermelhidao e ardor",
  dehydration: "recuperar agua e selar a barreira com uma rotina mais suave",
  aging: "introduzir ativos de resultado com progressao lenta e boa tolerancia",
  "barrier-damage": "reparar a barreira antes de pensar em ativos mais fortes",
  "uneven-texture": "uniformizar a superficie da pele com progressao lenta e boa tolerancia",
  "under-eye": "hidratar, suavizar marcas e proteger a area dos olhos com ativos bem tolerados"
};

const concernAvoidanceCopy: Record<string, string> = {
  acne: "Evite misturar muitos secativos, esfoliar demais ou aumentar a limpeza porque isso pode inflamar mais.",
  oiliness: "Evite limpar demais, usar alcool forte ou secativos agressivos porque isso pode piorar o rebote.",
  "visible-pores": "Evite excesso de esfoliacao e combinacoes irritantes no mesmo dia se a pele estiver sensivel.",
  "dark-spots": "Evite calor excessivo, friccao e ativos fortes em sequencia se sua pele estiver irritada.",
  rosacea: "Evite acidos frequentes, fragrancia intensa, agua muito quente e rotina longa.",
  dehydration: "Evite limpeza agressiva, sabonete forte e trocar de produto toda semana.",
  aging: "Evite iniciar retinoide, esfoliante e vitamina C forte de uma vez so.",
  "barrier-damage": "Evite qualquer combinacao de ativos agressivos enquanto houver ardor, queima ou descamacao importante.",
  "uneven-texture": "Evite acelerar demais com acidos e retinoides juntos logo no inicio.",
  "under-eye": "Evite produtos fortes muito perto dos olhos e atrito frequente nessa area."
};

const concernEscalationCopy: Record<string, string> = {
  acne: "Se houver nodulos dolorosos, cicatriz, piora rapida ou falha apos algumas semanas, vale procurar dermatologista.",
  oiliness: "Se a oleosidade vier com acne moderada, inflamacao persistente ou piora progressiva, vale avaliacao dermatologica.",
  "visible-pores": "Se a textura piorar rapido, houver inflamacoes ou irritacao persistente, vale avaliacao medica.",
  "dark-spots": "Se a mancha crescer rapido, mudar de formato ou vier com irritacao persistente, vale avaliacao medica.",
  rosacea: "Se houver ardor forte, olhos irritados, vermelhidao persistente ou piora importante, vale avaliacao dermatologica.",
  dehydration: "Se houver ardor intenso, fissuras ou piora apesar de rotina simples, vale avaliacao dermatologica.",
  aging: "Se houver irritacao que nao cede ou duvida sobre uso de retinoides, vale discutir com dermatologista.",
  "barrier-damage": "Se houver queima, piora progressiva ou eczema importante, procure dermatologista.",
  "uneven-texture": "Se a pele ficar muito sensivel, inflamada ou descamando de forma persistente, procure avaliacao dermatologica.",
  "under-eye": "Se houver irritacao persistente, edema ou mudanca importante ao redor dos olhos, vale avaliacao medica."
};

const skinTypeFriendlyCopy: Record<string, string> = {
  normal: "pele normal ou equilibrada",
  oily: "pele oleosa",
  dry: "pele seca",
  combination: "pele mista",
  sensitive: "pele sensivel",
  acne_prone: "pele com tendencia a acne",
};

const skinToneFriendlyCopy: Record<string, string> = {
  fair: "pele clara",
  medium: "tom medio",
  tan: "pele morena",
  deep: "pele negra",
  rich: "pele retinta"
};

function formatMetricReadout(metrics: SkinMetricSet) {
  return `Hoje sua leitura esta assim: hidratacao ${Math.round(metrics.hydration_level)}/100, acne ${Math.round(metrics.acne_level)}/100, pigmentacao ${Math.round(metrics.pigmentation_level)}/100 e vermelhidao ${Math.round(metrics.redness_level)}/100.`;
}

function formatSkinTypeCopy(profile: CustomerSkinProfile | null) {
  const slug = profile?.skin_type?.slug ?? null;
  if (slug && skinTypeFriendlyCopy[slug]) return skinTypeFriendlyCopy[slug];
  if (profile?.skin_type?.name) return profile.skin_type.name.toLowerCase();
  return null;
}

function formatSkinToneCopy(profile: CustomerSkinProfile | null) {
  const slug = profile?.skin_tone?.slug ?? null;
  if (slug && skinToneFriendlyCopy[slug]) return skinToneFriendlyCopy[slug];
  if (profile?.skin_tone?.name) return profile.skin_tone.name.toLowerCase();
  return null;
}

function summarizeEvidence(documents: EvidenceDocument[], concernSlug: string, ingredientNames: string[]) {
  if (documents.length === 0) {
    return {
      lead: "Hoje eu nao tenho uma fonte forte suficientemente especifica para esta pergunta.",
      action: ingredientNames.length
        ? `Mesmo assim, a orientacao conservadora e priorizar ${ingredientNames.join(", ")} com progressao lenta e observacao da resposta da pele.`
        : "Mesmo assim, a orientacao conservadora e priorizar limpeza suave, hidratacao e constancia."
    };
  }

  const topBadges = documents.slice(0, 2).map((doc) => buildEvidenceBadge(doc));
  const sourceLine = topBadges
    .map((item) => `${item.sourceFamily}${item.publishedYear ? ` ${item.publishedYear}` : ""}`)
    .join(" e ");
  const priority = concernUserCopy[concernSlug] ?? "estabilizar a pele com rotina simples, consistente e toleravel";
  const ingredientLine = ingredientNames.length
    ? `Os ativos que mais fazem sentido neste momento sao ${ingredientNames.join(", ")}.`
    : "O foco maior continua sendo tolerancia da pele e regularidade de uso.";

  return {
    lead: `Pelo que a melhor evidencia sugere hoje, o mais importante para voce agora e ${priority}.`,
    action: `${ingredientLine} Entre as fontes mais fortes deste recorte, eu estou apoiando a resposta principalmente em ${sourceLine}.`
  };
}

const sanitizeOptionalEnv = (value: string | undefined) => {
  if (!value) return null;
  const trimmed = value.trim().replace(/\\r\\n|\\n|\\r/g, "");
  return trimmed || null;
};

export function inferConcernSlug(question: string, profile: CustomerSkinProfile | null, metrics: SkinMetricSet) {
  const q = question.toLowerCase();
  if (profile?.main_concern?.slug && concernSlugMap[profile.main_concern.slug]) {
    return concernSlugMap[profile.main_concern.slug];
  }
  if (q.includes("acne") || metrics.acne_level >= 55) return "acne";
  if (q.includes("oleos") || q.includes("brilho")) return "oiliness";
  if (q.includes("poro")) return "visible-pores";
  if (q.includes("mancha") || q.includes("pigment") || metrics.pigmentation_level >= 55) return "dark-spots";
  if (q.includes("rosacea") || q.includes("vermelh") || metrics.redness_level >= 55) return "rosacea";
  if (q.includes("hidrat") || q.includes("ressec") || metrics.hydration_level <= 45) return "dehydration";
  if (q.includes("textura")) return "uneven-texture";
  if (q.includes("olheira") || q.includes("olho")) return "under-eye";
  if (q.includes("ruga") || q.includes("linha") || metrics.wrinkle_depth >= 55) return "aging";
  return "barrier-damage";
}

function buildFallbackAnswer(context: SkinGptContext): SkinGptAnswer {
  const concernSlug = inferConcernSlug(context.question, context.profile, context.metrics);
  const condition =
    context.conditions.find((item) => item.slug === concernSlug) ??
    context.conditions[0] ??
    null;
  const ingredientLinks = context.ingredientLinks
    .filter((item) => item.condition_slug === concernSlug)
    .sort((a, b) => b.recommendation_strength - a.recommendation_strength)
    .slice(0, 3);

  const ingredientNames = ingredientLinks.map((item) => item.ingredient_name);
  const knowledgeDocs = context.knowledgeDocuments
    .filter((item) => item.topic_slug === concernSlug || item.topic_slug === "general")
    .slice(0, 3);
  const routineFocus = context.recommendedProducts.slice(0, 3).map((item) => `${item.routine_step_name}: ${item.product_name}`);
  const scoreCopy =
    context.latestOverallScore !== null ? `Seu Skin Health Score atual esta em ${Math.round(context.latestOverallScore)}/100.` : null;
  const profileLabel = formatSkinTypeCopy(context.profile);
  const skinToneLabel = formatSkinToneCopy(context.profile);
  const profileCopy = profileLabel
    ? `Seu perfil atual aponta para ${profileLabel}${skinToneLabel ? `, em ${skinToneLabel}` : ""}`
    : "Seu perfil atual ainda esta em consolidacao";
  const concernCopy = condition
    ? `O foco principal agora e ${condition.condition_name.toLowerCase()}.`
    : "O foco principal agora e reparacao e estabilidade da pele.";

  const evidenceSummary = summarizeEvidence(knowledgeDocs, concernSlug, ingredientNames);
  const answer = [
    `${profileCopy}. ${concernCopy}`,
    evidenceLeadCopy(knowledgeDocs),
    evidenceSummary.lead,
    formatMetricReadout(context.metrics),
    scoreCopy,
    evidenceSummary.action,
    routineFocus.length
      ? `Em linguagem simples: eu comecaria por ${routineFocus.join(" | ")}.`
      : "Em linguagem simples: eu comecaria por uma rotina curta, com hidratacao e ativos de boa tolerancia."
  ]
    .filter(Boolean)
    .join(" ");

  return {
    answer,
    highlights: [
      `Leitura principal: ${evidenceStrengthLabel(knowledgeDocs)}.`,
      condition?.symptoms ? `O que costuma aparecer nesse quadro: ${condition.symptoms}.` : null,
      routineFocus.length ? `O que eu priorizaria agora: ${routineFocus.join(" | ")}.` : null,
      concernAvoidanceCopy[concernSlug] ?? "Evite somar varios ativos fortes de uma vez."
    ].filter((item): item is string => Boolean(item)),
    suggested_ingredients: ingredientNames,
    suggested_routine_focus: routineFocus,
    citations: knowledgeDocs.map((item) => formatEvidenceCitation(item)),
    disclaimers: [
      "SkinBela organiza evidencia e contexto da sua pele, mas nao faz diagnostico medico.",
      concernEscalationCopy[concernSlug] ?? "Se houver dor, piora importante ou irritacao persistente, procure dermatologista.",
      condition?.contraindications ? `Cautela pratica: ${condition.contraindications}.` : "Suba ativos fortes devagar e observe a tolerancia da sua pele."
    ],
    source_mode: "fallback"
  };
}

async function askOpenAi(context: SkinGptContext): Promise<SkinGptAnswer | null> {
  const apiKey = sanitizeOptionalEnv(process.env.OPENAI_API_KEY);
  if (!apiKey) return null;

  const model = sanitizeOptionalEnv(process.env.OPENAI_MODEL) ?? "gpt-4.1-mini";
  const fallback = buildFallbackAnswer(context);
  const payload = {
    model,
    input: [
      {
        role: "system",
        content:
          "You are SkinBela for BelaPop. Answer in Brazilian Portuguese, with simple patient-friendly language, grounded only in the provided evidence documents and user context. Prioritize stronger and more recent dermatology evidence. Give highest weight to meta-analyses, systematic reviews, randomized controlled trials, and clinical guidelines. Prefer point-of-care summaries and high-evidence dermatology sources when present: UpToDate, DynaMed, BMJ Best Practice, Cochrane, AAD/BAD/ECRI guidelines, JAMA Dermatology, JAAD, BJD, PubMed/MEDLINE, Embase, LILACS, SciELO, DermNet and Anais Brasileiros de Dermatologia. Use VisualDx only as visual support, not as stronger evidence than high-level trials or guidelines. Never invent licensed content, never diagnose, never promise outcomes, and return JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({
          question: context.question,
          profile: {
            skin_type: context.profile?.skin_type?.name ?? null,
            main_concern: context.profile?.main_concern?.name ?? null,
            sensitivity_level: context.profile?.sensitivity_level ?? null
          },
          metrics: context.metrics,
          latest_overall_score: context.latestOverallScore,
          condition_knowledge: context.conditions,
          knowledge_documents: context.knowledgeDocuments.map((document) => ({
            ...document,
            citation: formatEvidenceCitation(document),
            evidence_badge: buildEvidenceBadge(document)
          })),
          ingredient_links: context.ingredientLinks,
          routine_products: context.recommendedProducts,
          response_style: {
            answer_shape: [
              "comece explicando em uma frase o que parece mais importante agora",
              "depois diga o que a melhor evidencia sustenta em linguagem simples",
              "inclua o que priorizar e o que evitar",
              "se houver risco, diga quando vale procurar dermatologista"
            ]
          }
        })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "skingpt_answer",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            answer: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            suggested_ingredients: { type: "array", items: { type: "string" } },
            suggested_routine_focus: { type: "array", items: { type: "string" } },
            citations: { type: "array", items: { type: "string" } },
            disclaimers: { type: "array", items: { type: "string" } }
          },
          required: ["answer", "highlights", "suggested_ingredients", "suggested_routine_focus", "citations", "disclaimers"]
        }
      }
    }
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return null;
    const json = (await response.json()) as Record<string, unknown>;
    const outputText =
      typeof json.output_text === "string"
        ? json.output_text
        : Array.isArray(json.output)
          ? ""
          : "";

    if (!outputText) return null;
    const parsed = JSON.parse(outputText) as Omit<SkinGptAnswer, "source_mode">;
    return {
      ...parsed,
      source_mode: "llm"
    };
  } catch {
    return fallback;
  }
}

export async function answerSkinGpt(context: SkinGptContext): Promise<SkinGptAnswer> {
  const llm = await askOpenAi(context);
  if (llm) return llm;
  return buildFallbackAnswer(context);
}

