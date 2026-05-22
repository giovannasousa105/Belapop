import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type AssistantBudget,
  type AssistantFlow,
  type AssistantRecommendationCard,
  type AssistantRecommendationResponse,
  type AssistantRecommendationSection,
  type AssistantRequest,
  type AssistantRepurchaseAction,
  type GiftInterest,
  type RoutineDepth,
  type RoutineObjective,
  type RoutineSkinType
} from "@/lib/assistant/types";
import { brandCtas } from "@/lib/brand/ctas";
import { brandSectionNames } from "@/lib/brand/sections";
import { getPublicProductBySlug, getPublicProducts, type EditorialProduct } from "@/lib/queries/products";

type SupabaseLike = SupabaseClient<any, any, any>;

type PurchaseHistoryRow = {
  orderId: string;
  createdAt: string;
  status: string;
  productId: string;
  quantity: number;
};

type ProductSlot = "cleanser" | "treatment" | "moisturizer" | "sunscreen" | "gift" | "other";

type IndexedProduct = EditorialProduct & {
  normalizedTitle: string;
  normalizedCategory: string;
  tagSet: Set<string>;
  slot: ProductSlot;
  budget: AssistantBudget;
};

type CandidateProduct = {
  product: IndexedProduct;
  score: number;
};

const MAX_PRODUCTS = 260;

const normalizeText = (value: string | null | undefined) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const startsWithAny = (value: string, candidates: string[]) =>
  candidates.some((candidate) => value.startsWith(candidate));

const includesAny = (value: string, candidates: string[]) =>
  candidates.some((candidate) => value.includes(candidate));

const hasTag = (product: IndexedProduct, tag: string) => product.tagSet.has(normalizeText(tag));
const hasAnyTag = (product: IndexedProduct, tags: string[]) =>
  tags.some((tag) => hasTag(product, tag));

const slotLabels: Record<ProductSlot, string> = {
  cleanser: "Limpeza",
  treatment: "Tratamento",
  moisturizer: "Hidratação",
  sunscreen: "Proteção solar",
  gift: "Presente",
  other: "Seleção"
};

const objectiveMeta: Record<
  RoutineObjective,
  {
    tags: string[];
    priority: string;
    summary: string;
  }
> = {
  "hidratação": {
    tags: ["objetivo_hidratacao", "pos_scan_ressecamento"],
    priority: "Reforçar hidratação e conforto sem pesar na rotina.",
    summary: "Sua seleção prioriza conforto, reposição de água e acabamento equilibrado."
  },
  acne: {
    tags: ["objetivo_acne", "skin_oleosa"],
    priority: "Controlar excesso de oleosidade com passos leves e consistentes.",
    summary: "A rotina foi pensada para manter limpeza, tratamento e conforto sem excesso."
  },
  manchas: {
    tags: ["objetivo_manchas", "glow"],
    priority: "Uniformizar o tom com passos de uso continuo e proteção diaria.",
    summary: "Selecionamos itens que ajudam a trazer mais constancia para luminosidade e tom."
  },
  oleosidade: {
    tags: ["objetivo_oleosidade", "skin_oleosa", "pos_scan_oleosidade"],
    priority: "Equilibrar brilho e poros aparentes sem ressecar.",
    summary: "A recomendação busca limpar, tratar e manter equilibrio ao longo do dia."
  },
  sensibilidade: {
    tags: ["skin_sensivel", "objetivo_sensibilidade"],
    priority: "Preservar a barreira e reduzir atrito na rotina.",
    summary: "A curadoria prioriza passos toleraveis, texturas leves e sequencia simples."
  },
  glow: {
    tags: ["objetivo_glow", "objetivo_manchas"],
    priority: "Trazer mais viço e regularidade visual sem complicar o uso.",
    summary: "A seleção combina luminosidade, hidrataçao e acabamento mais uniforme."
  },
  antissinais: {
    tags: ["objetivo_antissinais", "premium"],
    priority: "Sustentar firmeza, textura e prevencao com rotina consistente.",
    summary: "Montamos uma base de cuidado para textura, elasticidade e continuidade."
  }
};

const skinTypeTags: Record<RoutineSkinType, string[]> = {
  oleosa: ["skin_oleosa"],
  seca: ["skin_seca", "pos_scan_ressecamento"],
  mista: ["skin_mista"],
  "sensível": ["skin_sensivel"],
  nao_sei: []
};

const budgetKeywords: Record<AssistantBudget, string[]> = {
  essencial: ["essencial"],
  intermediaria: [],
  premium: ["premium", "luxo"]
};

const giftInterestTags: Record<GiftInterest, string[]> = {
  skincare: ["categoria_limpeza", "categoria_serum", "categoria_hidratante", "categoria_protetor"],
  maquiagem: ["maquiagem"],
  cabelo: ["cabelos"],
  autocuidado: ["perfumes", "categoria_presente"]
};

const categoryReplenishmentDays: Record<string, number> = {
  skincare: 40,
  cabelos: 45,
  perfumes: 75,
  maquiagem: 90
};

const buildBudgetTier = (priceCents: number): AssistantBudget => {
  if (priceCents <= 15_000) return "essencial";
  if (priceCents <= 32_000) return "intermediaria";
  return "premium";
};

const inferSlot = (product: EditorialProduct): ProductSlot => {
  const title = normalizeText(product.title);
  const category = normalizeText(product.category);
  const tags = new Set((product.tags ?? []).map((tag) => normalizeText(tag)));

  if (
    tags.has("categoria_limpeza") ||
    includesAny(title, ["gel limpeza", "limpeza", "cleanser", "sabonete", "foam"]) ||
    includesAny(category, ["limpeza"])
  ) {
    return "cleanser";
  }

  if (
    tags.has("categoria_serum") ||
    tags.has("categoria_tratamento") ||
    includesAny(title, ["serum", "concentrado", "treatment", "tratamento", "retinol", "vitamina c"])
  ) {
    return "treatment";
  }

  if (
    tags.has("categoria_hidratante") ||
    includesAny(title, ["hidrat", "cream", "creme", "barrier", "barreira"]) ||
    includesAny(category, ["hidrat"])
  ) {
    return "moisturizer";
  }

  if (
    tags.has("categoria_protetor") ||
    includesAny(title, ["protetor", "fps", "sunscreen", "solar"])
  ) {
    return "sunscreen";
  }

  if (tags.has("categoria_presente") || includesAny(title, ["gift", "kit", "presente"])) {
    return "gift";
  }

  return "other";
};

const indexProduct = (product: EditorialProduct): IndexedProduct => ({
  ...product,
  normalizedTitle: normalizeText(product.title),
  normalizedCategory: normalizeText(product.category),
  tagSet: new Set((product.tags ?? []).map((tag) => normalizeText(tag))),
  slot: inferSlot(product),
  budget: buildBudgetTier(product.price_cents)
});

const toCard = (
  product: IndexedProduct,
  reason: string,
  roleLabel?: string | null
): AssistantRecommendationCard => ({
  productId: product.id,
  slug: product.slug,
  title: product.title,
  category: product.category ?? null,
  priceCents: product.price_cents,
  imageUrl: product.coverImage || product.hero_image_url || null,
  sellerId: product.sellerId,
  sellerName: product.sellerName,
  saleOrigin: product.saleOrigin,
  reason,
  roleLabel: roleLabel ?? null
});

const dedupeCards = (cards: AssistantRecommendationCard[]) => {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.productId)) return false;
    seen.add(card.productId);
    return true;
  });
};

const pickBestCandidate = (
  products: IndexedProduct[],
  scorer: (product: IndexedProduct) => number,
  excludedIds: Set<string>
) => {
  const candidates = products
    .filter((product) => !excludedIds.has(product.id))
    .map((product) => ({ product, score: scorer(product) }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || right.product.price_cents - left.product.price_cents);

  return candidates[0] ?? null;
};

const buildRoutineReason = (
  slot: ProductSlot,
  objective: RoutineObjective,
  skinType: RoutineSkinType
) => {
  const objectiveLabel =
    objective === "hidratação"
      ? "hidratar"
      : objective === "oleosidade"
        ? "equilibrar a oleosidade"
        : objective === "sensibilidade"
          ? "preservar a barreira"
          : objective === "manchas"
            ? "uniformizar o tom"
            : objective === "glow"
              ? "trazer luminosidade"
              : objective === "antissinais"
                ? "reforcar textura e firmeza"
                : "organizar a rotina";

  if (slot === "cleanser") {
    return `Etapa de limpeza para ${objectiveLabel} sem tirar conforto da pele ${skinType === "nao_sei" ? "" : skinType}.`.trim();
  }

  if (slot === "treatment") {
    return `Concentrado para ${objectiveLabel} com uso simples e continuo.`;
  }

  if (slot === "moisturizer") {
    return "Ajuda a manter conforto, equilibrio e acabamento mais consistente.";
  }

  if (slot === "sunscreen") {
    return "Proteção diaria para sustentar a rotina e reduzir atrito no cuidado.";
  }

  return "Complemento escolhido para deixar a rotina mais equilibrada.";
};

const buildComplementReason = (objective: RoutineObjective) => {
  if (objective === "hidratação" || objective === "sensibilidade") {
    return "Esse complemento ajuda a sustentar conforto e a deixar a rotina mais estavel.";
  }
  if (objective === "oleosidade" || objective === "acne") {
    return "Esse complemento ajuda a equilibrar a rotina sem adicionar peso desnecessario.";
  }
  return "Esse complemento ajuda a deixar sua rotina mais completa e coerente.";
};

const buildRoutineSelections = (
  products: IndexedProduct[],
  args: {
    objective: RoutineObjective;
    skinType: RoutineSkinType;
    depth: RoutineDepth;
    budget: AssistantBudget;
    preferredProductId?: string | null;
  }
) => {
  const selectedIds = new Set<string>();
  const slotOrder: ProductSlot[] =
    args.depth === "simples"
      ? args.skinType === "seca" || args.skinType === "sensível"
        ? ["cleanser", "moisturizer", "sunscreen"]
        : ["cleanser", "treatment", "sunscreen"]
      : ["cleanser", "treatment", "moisturizer", "sunscreen"];

  const sections: AssistantRecommendationSection[] = [];

  for (const slot of slotOrder) {
    const candidate = pickBestCandidate(
      products,
      (product) => {
        let score = 0;
        if (product.slot === slot) score += 70;
        if (slot === "treatment" && product.slot === "moisturizer" && args.depth === "simples") score += 16;
        if (slot === "moisturizer" && product.slot === "treatment" && args.objective === "hidratação") score += 10;
        if (hasAnyTag(product, objectiveMeta[args.objective].tags)) score += 24;
        if (hasAnyTag(product, skinTypeTags[args.skinType])) score += 18;
        if (hasAnyTag(product, budgetKeywords[args.budget])) score += 10;
        if (product.budget === args.budget) score += 8;
        if (args.budget === "intermediaria" && product.budget !== "premium") score += 5;
        if (args.preferredProductId && product.id === args.preferredProductId) score += 18;
        if (product.saleOrigin === "própria") score += 2;
        return score;
      },
      selectedIds
    );

    if (!candidate) continue;
    selectedIds.add(candidate.product.id);
    sections.push({
      id: slot,
      label: slotLabels[slot],
      reason: buildRoutineReason(slot, args.objective, args.skinType),
      product: toCard(candidate.product, buildRoutineReason(slot, args.objective, args.skinType))
    });
  }

  const primarySection =
    sections.find((section) => section.id === "treatment" && section.product) ??
    sections.find((section) => section.id === "moisturizer" && section.product) ??
    sections[0] ??
    null;

  const complementaryCandidate = pickBestCandidate(
    products,
    (product) => {
      let score = 0;
      if (selectedIds.has(product.id)) return 0;
      if (product.slot === "moisturizer" || product.slot === "treatment") score += 22;
      if (hasAnyTag(product, objectiveMeta[args.objective].tags)) score += 20;
      if (hasAnyTag(product, budgetKeywords[args.budget])) score += 8;
      if (product.budget === args.budget) score += 5;
      return score;
    },
    selectedIds
  );

  const complementaryProduct = complementaryCandidate
    ? toCard(complementaryCandidate.product, buildComplementReason(args.objective), "Complemento")
    : null;

  const kitItems = dedupeCards(
    sections
      .map((section) => section.product)
      .filter((product): product is AssistantRecommendationCard => Boolean(product))
  );
  const kit =
    kitItems.length > 1
      ? {
          name: args.depth === "simples" ? "Rotina essencial BelaPop" : "Rotina completa BelaPop",
          benefit:
            args.depth === "simples"
              ? "Poucos passos, mais clareza e uma entrada segura para a rotina."
              : "Uma sequencia mais completa para sustentar constancia, conforto e resultado visual.",
          items: kitItems,
          totalPriceCents: kitItems.reduce((total, item) => total + item.priceCents, 0),
          ctaLabel: brandCtas.primary.addRoutineToCart
        }
      : null;

  return {
    sections,
    primaryProduct: primarySection?.product ?? null,
    complementaryProduct,
    kit
  };
};

const buildGiftRecommendations = (
  products: IndexedProduct[],
  args: NonNullable<AssistantRequest["gift"]>
) => {
  const recipient = args.recipient?.trim() || "alguem especial";
  const occasion = args.occasion?.trim() || "uma ocasiao especial";
  const interest = args.interest ?? "autocuidado";
  const priceBand = args.priceBand ?? "intermediaria";
  const tone = args.tone ?? "seguro";

  const filtered = products.filter((product) => {
    if (priceBand === "essencial" && product.price_cents > 18_000) return false;
    if (priceBand === "intermediaria" && (product.price_cents < 10_000 || product.price_cents > 38_000)) {
      return false;
    }
    if (priceBand === "premium" && product.price_cents < 20_000) return false;
    return true;
  });

  const buildScore = (product: IndexedProduct) => {
    let score = 0;
    if (hasAnyTag(product, giftInterestTags[interest])) score += 24;
    if (product.slot === "gift") score += 20;
    if (hasTag(product, "categoria_presente")) score += 18;
    if (tone === "sofisticado" && (hasTag(product, "premium") || product.budget === "premium")) score += 14;
    if (tone === "seguro" && product.budget !== "premium") score += 12;
    if (interest === "autocuidado" && includesAny(product.normalizedCategory, ["perf", "corpo", "bem estar"])) score += 10;
    if (product.saleOrigin === "própria") score += 2;
    return score;
  };

  const ranked = filtered
    .map((product) => ({ product, score: buildScore(product) }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || right.product.price_cents - left.product.price_cents);

  const safePick = ranked.find((candidate) => candidate.product.budget !== "premium") ?? ranked[0] ?? null;
  const premiumPick =
    ranked.find((candidate) => hasTag(candidate.product, "premium") || candidate.product.budget === "premium") ??
    ranked[0] ??
    null;
  const valuePick =
    [...ranked].sort(
      (left, right) =>
        right.score / Math.max(1, right.product.price_cents) -
        left.score / Math.max(1, left.product.price_cents)
    )[0] ?? null;

  const recommendations = dedupeCards(
    [
      safePick ? toCard(safePick.product, "Opção segura para presentear com menos risco de erro.", "Opção segura") : null,
      premiumPick ? toCard(premiumPick.product, "Seleção premium para impacto maior de percepcao e acabamento.", "Opção premium") : null,
      valuePick ? toCard(valuePick.product, "Melhor equilibrio entre presenca, curadoria e faixa de preco.", "Melhor custo-beneficio") : null
    ].filter((card): card is AssistantRecommendationCard => Boolean(card))
  ).slice(0, 3);

  const kitItems = recommendations.slice(0, 2);
  return {
    headline: "Presente com curadoria",
    summary: `Selecionamos opções para ${recipient} com foco em ${occasion}, em uma faixa ${priceBand} e com acabamento ${tone === "seguro" ? "mais seguro" : "mais sofisticado"}.`,
    recommendations,
    kit:
      kitItems.length > 1
        ? {
            name: "Kit presente BelaPop",
            benefit: "Uma seleção presenteavel com leitura mais clara de valor, cuidado e intencao.",
            items: kitItems,
            totalPriceCents: kitItems.reduce((total, item) => total + item.priceCents, 0),
            ctaLabel: brandCtas.primary.addKitToCart
          }
        : null,
    packagingNote:
      tone === "sofisticado"
        ? "Finalize com embalagem presenteavel e um cartao curto para reforcar intencao e cuidado."
        : "Uma embalagem presenteavel discreta deixa a experiência mais completa sem exagero."
  };
};

const getRepurchaseDays = (product: IndexedProduct) => {
  if (hasTag(product, "recompra_30_dias")) return 30;
  if (hasTag(product, "recompra_60_dias")) return 60;
  if (hasTag(product, "recompra_90_dias")) return 90;
  if (hasTag(product, "recompra_120_dias")) return 120;

  const category = product.normalizedCategory;
  if (includesAny(category, ["cabel"])) return categoryReplenishmentDays.cabelos;
  if (includesAny(category, ["perf"])) return categoryReplenishmentDays.perfumes;
  if (includesAny(category, ["maqui"])) return categoryReplenishmentDays.maquiagem;
  return categoryReplenishmentDays.skincare;
};

const loadPurchaseHistory = async (supabase: SupabaseLike, userId: string) => {
  const { data: ordersData, error: ordersError } = await supabase
    .from("orders")
    .select("id,status,created_at")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })
    .limit(16);

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  const activeOrders = (ordersData ?? [])
    .filter((order) =>
      ["paid", "processing", "shipped", "delivered", "fulfilled"].includes(normalizeText(order.status))
    )
    .map((order) => ({
      id: String(order.id),
      createdAt: String(order.created_at),
      status: String(order.status ?? "")
    }));

  if (!activeOrders.length) return [];

  const orderIds = activeOrders.map((order) => order.id);
  const orderById = new Map(activeOrders.map((order) => [order.id, order]));
  const { data: orderItemsData, error: orderItemsError } = await supabase
    .from("order_items")
    .select("order_id,product_id,quantity")
    .in("order_id", orderIds)
    .limit(120);

  if (orderItemsError) {
    throw new Error(orderItemsError.message);
  }

  return ((orderItemsData ?? []) as Array<{ order_id?: string | null; product_id?: string | null; quantity?: number | null }>)
    .map((row) => {
      const orderId = String(row.order_id ?? "");
      const order = orderById.get(orderId);
      const productId = String(row.product_id ?? "");
      if (!order || !productId) return null;
      return {
        orderId,
        createdAt: order.createdAt,
        status: order.status,
        productId,
        quantity: Math.max(1, Number(row.quantity ?? 1))
      } satisfies PurchaseHistoryRow;
    })
    .filter((row): row is PurchaseHistoryRow => Boolean(row));
};

const buildRepurchaseSelection = async (
  supabase: SupabaseLike,
  products: IndexedProduct[],
  userId: string | null
) => {
  if (!userId) {
    return {
      emptyMessage:
        "Não encontrei um histórico de compra ativo agora. Faco a curadoria assim que você entrar na sua conta BelaPop.",
      repurchaseAction: null as AssistantRepurchaseAction | null,
      primaryProduct: null as AssistantRecommendationCard | null,
      complementaryProduct: null as AssistantRecommendationCard | null,
      kit: null as AssistantRecommendationResponse["kit"],
      summary: "Entre para ver produtos que fazem sentido para sua proxima reposicao.",
      recommendations: [] as AssistantRecommendationCard[]
    };
  }

  const history = await loadPurchaseHistory(supabase, userId);
  if (!history.length) {
    return {
      emptyMessage:
        "Não encontrei uma recompra perfeita agora, mas você pode falar com a BelaPop para uma curadoria mais precisa.",
      repurchaseAction: null as AssistantRepurchaseAction | null,
      primaryProduct: null as AssistantRecommendationCard | null,
      complementaryProduct: null as AssistantRecommendationCard | null,
      kit: null as AssistantRecommendationResponse["kit"],
      summary: "Assim que houver compras no seu histórico, a recompra inteligente aparece aqui.",
      recommendations: [] as AssistantRecommendationCard[]
    };
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const firstMatch = history.find((row) => productById.has(row.productId)) ?? history[0] ?? null;
  if (!firstMatch) {
    return {
      emptyMessage:
        "Não encontrei uma recomendação perfeita agora, mas a BelaPop pode organizar uma recompra com mais precisao.",
      repurchaseAction: null as AssistantRepurchaseAction | null,
      primaryProduct: null as AssistantRecommendationCard | null,
      complementaryProduct: null as AssistantRecommendationCard | null,
      kit: null as AssistantRecommendationResponse["kit"],
      summary: "Seu histórico existe, mas não foi possivel reconciliar um SKU valido para recompra.",
      recommendations: [] as AssistantRecommendationCard[]
    };
  }
  const purchasedProduct = productById.get(firstMatch.productId) ?? null;

  if (!purchasedProduct) {
    return {
      emptyMessage:
        "Não encontrei uma recomendação perfeita agora, mas a BelaPop pode organizar uma recompra com mais precisao.",
      repurchaseAction: null as AssistantRepurchaseAction | null,
      primaryProduct: null as AssistantRecommendationCard | null,
      complementaryProduct: null as AssistantRecommendationCard | null,
      kit: null as AssistantRecommendationResponse["kit"],
      summary: "Seu histórico existe, mas o SKU anterior não esta disponivel na vitrine atual.",
      recommendations: [] as AssistantRecommendationCard[]
    };
  }

  const daysSincePurchase = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(firstMatch.createdAt)) / 86_400_000)
  );
  const repurchaseDays = getRepurchaseDays(purchasedProduct);
  const complement = pickBestCandidate(
    products,
    (product) => {
      if (product.id === purchasedProduct.id) return 0;
      let score = 0;
      if (product.slot !== purchasedProduct.slot) score += 16;
      if (product.normalizedCategory === purchasedProduct.normalizedCategory) score += 12;
      if (hasAnyTag(product, Array.from(purchasedProduct.tagSet))) score += 10;
      return score;
    },
    new Set([purchasedProduct.id])
  );

  const repurchaseCard = toCard(
    purchasedProduct,
    daysSincePurchase >= repurchaseDays
      ? "Seu tempo estimado de uso sugere que esta pode ser uma boa hora para repor."
      : "Esse item costuma ser recomposto em uma nova compra para manter a rotina consistente.",
    "Recompra"
  );
  const complementaryCard = complement
    ? toCard(complement.product, "Esse complemento ajuda a melhorar encaixe e continuidade da rotina.", "Complemento")
    : null;

  return {
    emptyMessage: null,
    repurchaseAction: {
      orderId: firstMatch.orderId,
      productId: purchasedProduct.id,
      label: "Comprar novamente"
    },
    primaryProduct: repurchaseCard,
    complementaryProduct: complementaryCard,
    kit:
      complementaryCard
        ? {
            name: "Kit de reposicao BelaPop",
            benefit: "Recompra rapida com um complemento coerente para manter a rotina ativa.",
            items: [repurchaseCard, complementaryCard],
            totalPriceCents: repurchaseCard.priceCents + complementaryCard.priceCents,
            ctaLabel: "Adicionar complemento"
          }
        : null,
    summary:
      daysSincePurchase >= repurchaseDays
        ? `Seu ${purchasedProduct.title} pode estar chegando ao fim. Vale repor com rapidez e manter a rotina em continuidade.`
        : `Sua ultima compra de ${purchasedProduct.title} ainda esta recente, mas ja se conecta bem a um proximo complemento.`,
    recommendations: dedupeCards(
      [repurchaseCard, complementaryCard].filter((card): card is AssistantRecommendationCard => Boolean(card))
    )
  };
};

const buildCartAssistSelection = (
  products: IndexedProduct[],
  cartProducts: IndexedProduct[],
  shippingTotalCents: number | null | undefined
) => {
  if (!cartProducts.length) {
    return {
      emptyMessage:
        "Seu carrinho ainda não tem itens suficientes para uma orientacao mais precisa. Adicione um produto e eu continuo daqui.",
      summary: "Assim que houver itens no carrinho, eu analiso complemento, upgrade e recompra futura.",
      complementaryProduct: null as AssistantRecommendationCard | null,
      kit: null as AssistantRecommendationResponse["kit"],
      freeShippingMessage: null as string | null
    };
  }

  const presentSlots = new Set(cartProducts.map((product) => product.slot));
  const selectedIds = new Set(cartProducts.map((product) => product.id));
  const missingSlot: ProductSlot =
    !presentSlots.has("moisturizer")
      ? "moisturizer"
      : !presentSlots.has("sunscreen")
        ? "sunscreen"
        : !presentSlots.has("treatment")
          ? "treatment"
          : "other";

  const complement = pickBestCandidate(
    products,
    (product) => {
      if (selectedIds.has(product.id)) return 0;
      let score = 0;
      if (missingSlot !== "other" && product.slot === missingSlot) score += 32;
      if (product.normalizedCategory === cartProducts[0].normalizedCategory) score += 14;
      if (hasAnyTag(product, Array.from(cartProducts[0].tagSet))) score += 8;
      return score;
    },
    selectedIds
  );

  const complementCard = complement
    ? toCard(
        complement.product,
        "Esse complemento ajuda a deixar sua rotina mais equilibrada e funcional.",
        "Complemento"
      )
    : null;

  const cartCards = cartProducts.slice(0, 2).map((product) =>
    toCard(product, "Item ja escolhido para a rotina atual.", "No carrinho")
  );
  const kitItems = dedupeCards(
    [...cartCards, complementCard].filter((card): card is AssistantRecommendationCard => Boolean(card))
  ).slice(0, 3);

  return {
    emptyMessage: null,
    summary: complementCard
      ? `Esse carrinho pode performar melhor com ${slotLabels[complement.product.slot] ? slotLabels[complement.product.slot].toLowerCase() : "um complemento"} coerente.`
      : "Seu carrinho ja esta enxuto. A proxima acao pode ser seguir para o checkout com mais seguranca.",
    complementaryProduct: complementCard,
    kit:
      kitItems.length > 1
        ? {
            name: "Upgrade de rotina BelaPop",
            benefit: "Uma extensao enxuta para melhorar encaixe, continuidade e percepcao de valor.",
            items: kitItems,
            totalPriceCents: kitItems.reduce((total, item) => total + item.priceCents, 0),
            ctaLabel: brandCtas.primary.addKitToCart
          }
        : null,
    freeShippingMessage:
      typeof shippingTotalCents === "number" && shippingTotalCents === 0
        ? "Seu carrinho ja esta com frete sem custo adicional."
        : null
  };
};

const derivePostScanObjective = (request: AssistantRequest): RoutineObjective => {
  const tags = request.scanContext?.tags?.map((tag) => normalizeText(tag)) ?? [];
  const summary = normalizeText(request.scanContext?.summary);

  if (tags.some((tag) => includesAny(tag, ["oleosidade", "acne", "poros"]))) return "oleosidade";
  if (tags.some((tag) => includesAny(tag, ["ressecamento", "hidratação"]))) return "hidratação";
  if (tags.some((tag) => includesAny(tag, ["mancha"]))) return "manchas";
  if (tags.some((tag) => includesAny(tag, ["sensiv"]))) return "sensibilidade";
  if (includesAny(summary, ["oleosidade", "poros"])) return "oleosidade";
  if (includesAny(summary, ["ressec", "hidrata"])) return "hidratação";
  if (includesAny(summary, ["mancha", "tom"])) return "manchas";
  if (includesAny(summary, ["sensiv", "ardor"])) return "sensibilidade";
  return "glow";
};

const buildPostScanSelection = (
  products: IndexedProduct[],
  request: AssistantRequest
) => {
  const objective = derivePostScanObjective(request);
  const routine = buildRoutineSelections(products, {
    objective,
    skinType: objective === "oleosidade" ? "oleosa" : objective === "sensibilidade" ? "sensível" : "nao_sei",
    depth: "completa",
    budget: "intermediaria",
    preferredProductId: null
  });

  return {
    objective,
    ...routine
  };
};

export async function buildConsultoraBelaPopRecommendations(args: {
  supabase: SupabaseLike;
  request: AssistantRequest;
  userId: string | null;
}) {
  const products = (await getPublicProducts(MAX_PRODUCTS)).map(indexProduct);
  const currentProductSlug = args.request.currentProductSlug?.trim() || null;
  const currentProduct = currentProductSlug ? await getPublicProductBySlug(currentProductSlug) : null;
  const currentProductId = currentProduct?.id ?? null;

  if (args.request.flow === "routine") {
    const objective = args.request.routine?.objective ?? "glow";
    const skinType = args.request.routine?.skinType ?? "nao_sei";
    const depth = args.request.routine?.depth ?? "simples";
    const budget = args.request.routine?.budget ?? "intermediaria";
    const selection = buildRoutineSelections(products, {
      objective,
      skinType,
      depth,
      budget,
      preferredProductId: currentProductId
    });

    return {
      flow: "routine" as AssistantFlow,
      headline: "Sua rotina sugerida",
      summary: objectiveMeta[objective].summary,
      priority: objectiveMeta[objective].priority,
      sections: selection.sections,
      recommendations: [],
      primaryProduct: selection.primaryProduct,
      complementaryProduct: selection.complementaryProduct,
      kit: selection.kit,
      followUpLabel: "Ver minha rotina recomendada",
      followUpHref: "/minha-rotina",
      emptyMessage:
        selection.sections.length > 0
          ? null
          : "Não encontrei uma recomendação perfeita agora, mas você pode falar com a BelaPop para uma curadoria mais precisa.",
      packagingNote: null,
      repurchaseAction: null,
      freeShippingMessage: null
    } satisfies AssistantRecommendationResponse;
  }

  if (args.request.flow === "gift") {
    const gift = buildGiftRecommendations(products, args.request.gift ?? {});
    return {
      flow: "gift",
      headline: gift.headline,
      summary: gift.summary,
      priority: "Presentear com cuidado, beleza e intencao.",
      sections: [],
      recommendations: gift.recommendations,
      primaryProduct: gift.recommendations[0] ?? null,
      complementaryProduct: gift.recommendations[1] ?? null,
      kit: gift.kit,
      followUpLabel: brandCtas.primary.buildGift,
      followUpHref: "/catalogo",
      emptyMessage:
        gift.recommendations.length > 0
          ? null
          : "Não encontrei uma recomendação perfeita agora, mas você pode falar com a BelaPop para uma curadoria mais precisa.",
      packagingNote: gift.packagingNote,
      repurchaseAction: null,
      freeShippingMessage: null
    } satisfies AssistantRecommendationResponse;
  }

  if (args.request.flow === "repurchase") {
    const repurchase = await buildRepurchaseSelection(args.supabase, products, args.userId);
    return {
      flow: "repurchase",
      headline: brandSectionNames.home.smartRepurchase,
      summary: repurchase.summary,
      priority: "Facilidade para manter a rotina sem perder clareza de escolha.",
      sections: [],
      recommendations: repurchase.recommendations,
      primaryProduct: repurchase.primaryProduct,
      complementaryProduct: repurchase.complementaryProduct,
      kit: repurchase.kit,
      followUpLabel: repurchase.primaryProduct ? "Ver produto" : null,
      followUpHref: repurchase.primaryProduct ? `/produto/${repurchase.primaryProduct.slug}` : null,
      emptyMessage: repurchase.emptyMessage,
      packagingNote: null,
      repurchaseAction: repurchase.repurchaseAction,
      freeShippingMessage: null
    } satisfies AssistantRecommendationResponse;
  }

  if (args.request.flow === "cart_assist") {
    const cartProductIds = args.request.cartItems.map((item) => item.productId);
    const cartProducts = products.filter((product) => cartProductIds.includes(product.id));
    const cartAssist = buildCartAssistSelection(
      products,
      cartProducts,
      args.request.shippingTotalCents
    );

    return {
      flow: "cart_assist",
      headline: "Carrinho assistido",
      summary: cartAssist.summary,
      priority: "Uma sugestao por vez para manter decisão clara e confiável.",
      sections: [],
      recommendations: cartAssist.complementaryProduct ? [cartAssist.complementaryProduct] : [],
      primaryProduct: cartAssist.complementaryProduct ?? null,
      complementaryProduct: cartAssist.complementaryProduct ?? null,
      kit: cartAssist.kit ?? null,
      followUpLabel: brandCtas.secondary.seeProducts,
      followUpHref: "/catalogo",
      emptyMessage: cartAssist.emptyMessage ?? null,
      packagingNote: null,
      repurchaseAction: null,
      freeShippingMessage: cartAssist.freeShippingMessage ?? null
    } satisfies AssistantRecommendationResponse;
  }

  const postScan = buildPostScanSelection(products, args.request);
  return {
    flow: "post_scan",
    headline: brandSectionNames.skinScan.nextStep,
    summary:
      args.request.scanContext?.summary?.trim() ||
      "Seu resultado aponta um ponto de cuidado claro. A prioridade agora e organizar a rotina com mais coerencia e menos excesso.",
    priority:
      args.request.scanContext?.priority?.trim() ||
      objectiveMeta[postScan.objective].priority,
    sections: postScan.sections,
    recommendations: [],
    primaryProduct: postScan.primaryProduct,
    complementaryProduct: postScan.complementaryProduct,
    kit: postScan.kit,
    followUpLabel: "Comprar rotina completa",
    followUpHref: "/carrinho",
    emptyMessage:
      postScan.sections.length > 0
        ? null
        : "Não encontrei uma recomendação perfeita agora, mas você pode falar com a BelaPop para uma curadoria mais precisa.",
    packagingNote: null,
    repurchaseAction: null,
    freeShippingMessage: null
  } satisfies AssistantRecommendationResponse;
}
