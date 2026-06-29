import type { SkinProfile, NecessidadeClinica, TipoPele } from "@/lib/skinScan/types";
import type { RotinaResult, PassoRotina } from "@/lib/skinScan/rotinaBuilder";
import type { SkinAnalysisSession } from "@/lib/skincare/skinAnalysis";
import { getPublicProductsByIds, type EditorialProduct } from "@/lib/queries/products";

const TIPO_PELE_LABEL: Record<TipoPele, string> = {
  SECA: "Seca",
  MISTA: "Mista",
  OLEOSA: "Oleosa",
  NORMAL: "Normal",
  SENSIVEL: "Sensível"
};

const NECESSIDADE_LABEL: Record<NecessidadeClinica, string> = {
  controle_sebaceo: "Oleosidade",
  tratamento_acne: "Acne",
  refinamento_textura: "Textura",
  balanceamento_sebaceo: "Oleosidade",
  uniformizacao_tom: "Manchas e uniformidade",
  calmante_barreira: "Sensibilidade",
  hidratacao_profunda: "Hidratação",
  renovacao_celular: "Renovação celular"
};

function scoreLabel(score: number): string {
  if (score >= 67) return "Alta";
  if (score >= 34) return "Moderada";
  return "Baixa";
}

function zoned(score: number, zoneIfHigh: string) {
  return {
    label: scoreLabel(score),
    zones: score >= 50 ? [zoneIfHigh] : [],
    confidence: 0.8
  };
}

function scored(score: number) {
  return {
    label: scoreLabel(score),
    score,
    confidence: 0.8
  };
}

function passoToStep(passo: PassoRotina, period: "manha" | "noite", product: EditorialProduct | null) {
  return {
    slug: product?.slug ?? passo.produto_id,
    name: passo.produto_nome,
    category: product?.category ?? passo.passo,
    price: product?.price_cents ?? null,
    step: passo.ordem,
    period: [period],
    description: passo.justificativa_curta,
    ritual: `Aplicar na etapa de ${passo.passo}.`,
    whyRecommended: passo.justificativa_curta
  };
}

export async function buildPdfSessionFromScan(
  skinProfile: SkinProfile,
  rotinaManha: RotinaResult | null,
  rotinaNoite: RotinaResult | null,
  generatedAt: string
): Promise<SkinAnalysisSession> {
  const passosManha = rotinaManha?.passos ?? [];
  const passosNoite = rotinaNoite?.passos ?? [];
  const allPassos = [...passosManha, ...passosNoite];

  const productIds = allPassos.map((passo) => passo.produto_id);
  const products = await getPublicProductsByIds(productIds);
  const productById = new Map(products.map((product) => [product.id, product]));

  const scores = skinProfile.scores_normalizados;
  const tipoPeleLabel = TIPO_PELE_LABEL[skinProfile.tipo_pele] ?? "Normal";

  const topConcerns = skinProfile.necessidades_rankeadas
    .map((necessidade) => NECESSIDADE_LABEL[necessidade])
    .filter((label, index, self) => self.indexOf(label) === index)
    .slice(0, 4);

  const recommendedProducts = allPassos
    .filter((passo, index, self) => self.findIndex((p) => p.produto_id === passo.produto_id) === index)
    .map((passo) => {
      const product = productById.get(passo.produto_id) ?? null;
      return {
        id: passo.produto_id,
        slug: product?.slug ?? passo.produto_id,
        name: passo.produto_nome,
        brand: product?.brand ?? null,
        category: product?.category ?? null,
        heroImageUrl: product?.hero_image_url ?? null,
        priceCents: product?.price_cents ?? null,
        sellerId: product?.sellerId ?? null,
        reason: passo.justificativa_curta,
        matchedConcern: topConcerns[0] ?? "Rotina personalizada"
      };
    });

  return {
    analysis: {
      imageQuality: { status: "good", issues: [], canAnalyze: true },
      skinTexture: scored(scores.textura),
      visiblePores: scored(scores.poros),
      oilinessAppearance: zoned(scores.oleosidade, "Zona T"),
      drynessAppearance: zoned(scores.ressecamento, "Bochechas"),
      rednessAppearance: zoned(scores.vermelhidao, "Bochechas e nariz"),
      toneUniformity: scored(Math.max(0, 100 - scores.pigmentacao)),
      fineLinesAppearance: { label: "Não avaliado nesta leitura", zones: [], confidence: 0.5 },
      topConcerns: topConcerns.length > 0 ? topConcerns : ["Rotina personalizada"],
      summary: `Pele de perfil ${tipoPeleLabel.toLowerCase()}, com foco em ${
        topConcerns[0]?.toLowerCase() ?? "equilíbrio geral"
      }.`,
      routineRecommendation: {
        morning: passosManha.length > 0 ? passosManha.map((p) => p.produto_nome) : ["Rotina personalizada BelaPop"],
        night: passosNoite.length > 0 ? passosNoite.map((p) => p.produto_nome) : ["Rotina personalizada BelaPop"]
      },
      disclaimer:
        "Esta leitura é uma orientação cosmética baseada em sinais visuais, não substitui avaliação dermatológica."
    },
    recommendedProducts,
    generatedAt,
    imagePreviewDataUrl: null,
    scienceRoutine: {
      manha: passosManha.map((passo) => passoToStep(passo, "manha", productById.get(passo.produto_id) ?? null)),
      noite: passosNoite.map((passo) => passoToStep(passo, "noite", productById.get(passo.produto_id) ?? null)),
      semanal: [],
      topActives: skinProfile.ativos_recomendados.slice(0, 4),
      skinProfile: tipoPeleLabel
    }
  };
}
