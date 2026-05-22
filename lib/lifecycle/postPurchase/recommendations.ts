import type {
  CustomerSkinProfile,
  Order,
  ProductLifecycleCategory,
  RecommendationProduct,
  RecommendationRule
} from "@/lib/lifecycle/postPurchase/types";

export const recommendationRules: RecommendationRule[] = [
  {
    id: "limpeza-hidratação-proteção",
    label: "Limpeza pede hidratação ou proteção",
    sourceCategory: "limpeza",
    targetCategories: ["hidratante", "protetor-solar"],
    priority: 90,
    reason: "limpeza funciona melhor quando a barreira e a proteção entram na sequencia"
  },
  {
    id: "vitamina-c-protetor",
    label: "Vitamina C pede protetor",
    sourceCategory: "serum-vitamina-c",
    targetCategories: ["protetor-solar"],
    priority: 100,
    reason: "antioxidante pela manha ganha sentido com proteção solar consistente"
  },
  {
    id: "barreira-calmante",
    label: "Barreira pede calmantes",
    sourceConcern: "barreira",
    targetCategories: ["hidratante"],
    targetConcerns: ["ceramidas", "pantenol", "calmante"],
    priority: 95,
    reason: "a rotina de barreira precisa de conforto, ceramidas ou pantenol"
  },
  {
    id: "manchas-proteção-antioxidante",
    label: "Manchas pedem proteção",
    sourceConcern: "manchas",
    targetCategories: ["protetor-solar", "serum-vitamina-c"],
    targetConcerns: ["antioxidante", "uniformizacao"],
    priority: 92,
    reason: "uniformizacao sem proteção solar perde consistencia"
  },
  {
    id: "bundle-reposicao",
    label: "Bundle pede reposicao dos itens de maior consumo",
    sourceCategory: "bundle",
    targetCategories: ["limpeza", "hidratante", "protetor-solar"],
    priority: 86,
    reason: "kits costumam acabar em ritmos diferentes; a reposicao deve priorizar uso diario"
  },
  {
    id: "sensível-evitar-agressivos",
    label: "Pele sensível evita agressivos",
    requiredSkinType: "sensível",
    avoidForSensitiveSkin: true,
    targetCategories: ["hidratante", "protetor-solar"],
    targetConcerns: ["calmante", "barreira", "baixa irritabilidade"],
    priority: 98,
    reason: "pele sensível pede conforto e baixa irritabilidade antes de ativos intensos"
  }
];

const normalizeText = (value: string | null | undefined) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const itemMatchesRule = (
  item: Order["items"][number],
  rule: RecommendationRule,
  order: Order,
  customerProfile?: CustomerSkinProfile
) => {
  if (rule.sourceCategory && item.category !== rule.sourceCategory) return false;
  if (rule.sourceConcern && !normalizeText(item.concern).includes(normalizeText(rule.sourceConcern))) return false;
  if (rule.requiredSkinType && customerProfile?.skinType !== rule.requiredSkinType) return false;
  if (item.isBundleItem && order.bundleId && rule.sourceCategory === "bundle") return true;
  return true;
};

const productMatchesRule = (
  product: RecommendationProduct,
  rule: RecommendationRule,
  customerProfile?: CustomerSkinProfile
) => {
  const sensitive = customerProfile?.skinType === "sensível";
  const productTags = product.tags.map(normalizeText);
  const concern = normalizeText(product.concern);

  if (!rule.targetCategories.includes(product.category)) return false;

  if (sensitive && productTags.some((tag) => ["retinol", "acido forte", "esfoliante intenso"].includes(tag))) {
    return false;
  }

  if (rule.targetConcerns?.length) {
    return rule.targetConcerns.some((target) => concern.includes(normalizeText(target)) || productTags.includes(normalizeText(target)));
  }

  return true;
};

export function getComplementaryRecommendations(
  order: Order,
  customerProfile?: CustomerSkinProfile,
  catalog: RecommendationProduct[] = []
): RecommendationProduct[] {
  const purchasedProductIds = new Set(order.items.map((item) => item.productId));
  const matches: Array<RecommendationProduct & { priority: number }> = [];

  for (const item of order.items) {
    const candidateRules = recommendationRules
      .filter((rule) => itemMatchesRule(item, rule, order, customerProfile))
      .sort((left, right) => right.priority - left.priority);

    for (const rule of candidateRules) {
      catalog
        .filter((product) => !purchasedProductIds.has(product.id))
        .filter((product) => productMatchesRule(product, rule, customerProfile))
        .forEach((product) => {
          matches.push({
            ...product,
            priority: rule.priority,
            reason: product.reason ?? rule.reason
          });
        });
    }
  }

  const seen = new Set<string>();
  return matches
    .sort((left, right) => right.priority - left.priority || left.priceCents - right.priceCents)
    .filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    })
    .slice(0, 4);
}
