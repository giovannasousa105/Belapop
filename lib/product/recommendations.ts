import "server-only";

type SupabaseAdminClient = {
  from: (table: string) => any;
};

type BehaviorEventRow = {
  type: string | null;
  product_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type WishlistRow = {
  product_id: string;
  created_at: string;
};

type ProductRow = {
  id: string;
  slug: string | null;
  name: string | null;
  title: string | null;
  price_cents: number | null;
  brand: string | null;
  category: string | null;
  hero_image_url: string | null;
  badges: string[] | null;
  tags: string[] | null;
  seller_id: string | null;
  curated: boolean | null;
  is_featured: boolean | null;
  created_at: string | null;
};

type ProductScoreRow = {
  product_id: string;
  final_score: number | null;
  eligible_search: boolean | null;
};

type ProductTrendingRow = {
  product_id: string;
  trend_score: number | null;
  views_24h: number | null;
  purchases_24h: number | null;
};

type RankingRow = {
  product_id: string;
  final_rank_score: number | null;
  surface: string | null;
  eligible: boolean | null;
};

export type RecommendedProduct = {
  id: string;
  name: string;
  title: string;
  slug: string;
  price_cents: number | null;
  brand: string | null;
  category: string | null;
  hero_image_url: string | null;
  badges: string[] | null;
  tags: string[] | null;
};

const MAX_CANDIDATES = 180;
const RECENT_EVENT_LIMIT = 240;

const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string | null | undefined) =>
  normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

const getDaysAgo = (iso: string | null | undefined) => {
  if (!iso) return 999;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 999;
  return Math.max(0, (Date.now() - parsed.getTime()) / 86_400_000);
};

const recencyMultiplier = (iso: string | null | undefined) => {
  const daysAgo = getDaysAgo(iso);
  if (daysAgo <= 3) return 1;
  if (daysAgo <= 7) return 0.8;
  if (daysAgo <= 14) return 0.65;
  if (daysAgo <= 30) return 0.45;
  return 0.25;
};

const eventWeight = (type: string | null | undefined) => {
  const normalized = String(type ?? "").toLowerCase().trim();
  switch (normalized) {
    case "purchase":
      return 8;
    case "favorite":
      return 6;
    case "add_to_cart":
      return 5;
    case "view_product":
      return 3;
    case "search":
      return 2;
    default:
      return 1;
  }
};

const addWeight = (map: Map<string, number>, key: string | null | undefined, value: number) => {
  const normalized = normalizeText(key);
  if (!normalized) return;
  map.set(normalized, (map.get(normalized) ?? 0) + value);
};

const getTopKeys = (map: Map<string, number>, limit = 6) =>
  [...map.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([key]) => key);

type RecommendationState = {
  categoryWeights: Map<string, number>;
  brandWeights: Map<string, number>;
  tokenWeights: Map<string, number>;
  productWeights: Map<string, number>;
  hasHistory: boolean;
};

const buildRecommendationState = (
  events: BehaviorEventRow[],
  wishlist: WishlistRow[],
  productById: Map<string, ProductRow>
): RecommendationState => {
  const categoryWeights = new Map<string, number>();
  const brandWeights = new Map<string, number>();
  const tokenWeights = new Map<string, number>();
  const productWeights = new Map<string, number>();

  for (const event of events) {
    const baseWeight = eventWeight(event.type) * recencyMultiplier(event.created_at);

    if (event.product_id) {
      productWeights.set(
        event.product_id,
        (productWeights.get(event.product_id) ?? 0) + baseWeight
      );
      const product = productById.get(event.product_id);
      if (product) {
        addWeight(categoryWeights, product.category, baseWeight);
        addWeight(brandWeights, product.brand, baseWeight);
      }
    }

    if (String(event.type ?? "").toLowerCase().trim() === "search") {
      const query =
        typeof event.metadata?.query === "string"
          ? event.metadata.query
          : typeof event.metadata?.q === "string"
            ? event.metadata.q
            : "";
      for (const token of tokenize(query)) {
        addWeight(tokenWeights, token, baseWeight);
      }
    }
  }

  for (const favorite of wishlist) {
    const favoriteWeight = 4 * recencyMultiplier(favorite.created_at);
    productWeights.set(
      favorite.product_id,
      (productWeights.get(favorite.product_id) ?? 0) + favoriteWeight
    );
    const product = productById.get(favorite.product_id);
    if (product) {
      addWeight(categoryWeights, product.category, favoriteWeight);
      addWeight(brandWeights, product.brand, favoriteWeight);
      for (const token of tokenize(product.name ?? product.title ?? "")) {
        addWeight(tokenWeights, token, favoriteWeight * 0.6);
      }
    }
  }

  return {
    categoryWeights,
    brandWeights,
    tokenWeights,
    productWeights,
    hasHistory: events.length > 0 || wishlist.length > 0
  };
};

const chunk = <T>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

async function fetchProductsByIds(admin: SupabaseAdminClient, ids: string[]) {
  const rows: ProductRow[] = [];
  for (const group of chunk(ids, 100)) {
    const { data, error } = await admin
      .from("products")
      .select("id,slug,name,title,price_cents,brand,category,hero_image_url,badges,tags,seller_id,curated,is_featured,created_at,status,stock_quantity")
      .in("id", group)
      .in("status", ["active", "published"])
      .gt("stock_quantity", 0);
    if (error) throw error;
    rows.push(...((data ?? []) as ProductRow[]));
  }
  return rows;
}

export async function getPersonalizedRecommendations(
  admin: SupabaseAdminClient,
  userId: string,
  limit: number
): Promise<RecommendedProduct[]> {
  const safeLimit = Math.min(20, Math.max(1, limit));

  const [eventsResult, wishlistResult, topScoresResult, topTrendingResult, featuredRankingResult] =
    await Promise.all([
      admin
        .from("analytics_events")
        .select("type,product_id,metadata,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(RECENT_EVENT_LIMIT),
      admin
        .from("wishlist_items")
        .select("product_id,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(80),
      admin
        .from("product_scores")
        .select("product_id,final_score,eligible_search")
        .eq("eligible_search", true)
        .order("final_score", { ascending: false })
        .limit(MAX_CANDIDATES),
      admin
        .from("product_trending")
        .select("product_id,trend_score,views_24h,purchases_24h")
        .order("trend_score", { ascending: false })
        .limit(MAX_CANDIDATES),
      admin
        .from("product_ranking_snapshot")
        .select("product_id,final_rank_score,surface,eligible")
        .eq("surface", "featured")
        .eq("context_key", "global")
        .eq("eligible", true)
        .order("computed_at", { ascending: false })
        .order("final_rank_score", { ascending: false })
        .limit(MAX_CANDIDATES)
    ]);

  if (eventsResult.error) throw eventsResult.error;
  if (wishlistResult.error) throw wishlistResult.error;
  if (topScoresResult.error) throw topScoresResult.error;
  if (featuredRankingResult.error) throw featuredRankingResult.error;

  const events = (eventsResult.data ?? []) as BehaviorEventRow[];
  const wishlist = (wishlistResult.data ?? []) as WishlistRow[];
  const scoreRows = (topScoresResult.data ?? []) as ProductScoreRow[];
  const trendingRows = topTrendingResult.error ? [] : (((topTrendingResult.data ?? []) as ProductTrendingRow[]) ?? []);
  const featuredRows = (featuredRankingResult.data ?? []) as RankingRow[];

  const candidateIds = new Set<string>();
  for (const row of events) {
    if (row.product_id) candidateIds.add(row.product_id);
  }
  for (const row of wishlist) candidateIds.add(row.product_id);
  for (const row of scoreRows.slice(0, MAX_CANDIDATES)) candidateIds.add(row.product_id);
  for (const row of trendingRows.slice(0, MAX_CANDIDATES)) candidateIds.add(row.product_id);
  for (const row of featuredRows.slice(0, MAX_CANDIDATES)) candidateIds.add(row.product_id);

  let products = await fetchProductsByIds(admin, [...candidateIds]);
  if (!products.length) {
    const { data, error } = await admin
      .from("products")
      .select("id,slug,name,title,price_cents,brand,category,hero_image_url,badges,tags,seller_id,curated,is_featured,created_at,status,stock_quantity")
      .in("status", ["active", "published"])
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false })
      .limit(MAX_CANDIDATES);
    if (error) throw error;
    products = (data ?? []) as ProductRow[];
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const state = buildRecommendationState(events, wishlist, productById);

  const scoreByProduct = new Map(scoreRows.map((row) => [row.product_id, row]));
  const trendByProduct = new Map(trendingRows.map((row) => [row.product_id, row]));
  const rankingByProduct = new Map<string, number>();
  for (const row of featuredRows) {
    if (!row.eligible) continue;
    const current = rankingByProduct.get(row.product_id) ?? 0;
    rankingByProduct.set(row.product_id, Math.max(current, Number(row.final_rank_score ?? 0)));
  }

  const topAffinityCategories = new Set(getTopKeys(state.categoryWeights, 8));
  const topAffinityBrands = new Set(getTopKeys(state.brandWeights, 8));

  const ranked = products.map((product) => {
    const productScore = Number(scoreByProduct.get(product.id)?.final_score ?? 0);
    const trendScore = Number(trendByProduct.get(product.id)?.trend_score ?? 0);
    const rankingScore = rankingByProduct.get(product.id) ?? 0;
    const affinityWeight = state.productWeights.get(product.id) ?? 0;
    const categoryWeight = state.categoryWeights.get(normalizeText(product.category)) ?? 0;
    const brandWeight = state.brandWeights.get(normalizeText(product.brand)) ?? 0;
    const tokenMatchWeight = tokenize(
      [product.name, product.title, product.brand, product.category].filter(Boolean).join(" ")
    ).reduce((total, token) => total + (state.tokenWeights.get(token) ?? 0), 0);
    const freshnessDays = getDaysAgo(product.created_at);
    const freshnessBoost = freshnessDays <= 14 ? 6 : freshnessDays <= 30 ? 3 : 0;
    const editorialBoost = (product.curated ? 7 : 0) + (product.is_featured ? 5 : 0);
    const affinityBoost =
      affinityWeight * 4 + categoryWeight * 2.2 + brandWeight * 1.8 + tokenMatchWeight * 1.1;
    const categoryFeaturedBoost = topAffinityCategories.has(normalizeText(product.category)) ? 5 : 0;
    const brandFeaturedBoost = topAffinityBrands.has(normalizeText(product.brand)) ? 4 : 0;
    const score =
      productScore * 0.48 +
      trendScore * 0.2 +
      rankingScore * 0.12 +
      editorialBoost +
      freshnessBoost +
      affinityBoost +
      categoryFeaturedBoost +
      brandFeaturedBoost;

    return {
      product,
      score
    };
  });

  ranked.sort((left, right) => right.score - left.score);

  const pickedIds = new Set<string>();
  const personalized = ranked
    .filter((entry) => {
      const eligibleSearch = scoreByProduct.get(entry.product.id)?.eligible_search;
      return eligibleSearch !== false;
    })
    .filter((entry) => {
      if (pickedIds.has(entry.product.id)) return false;
      pickedIds.add(entry.product.id);
      return true;
    })
    .slice(0, safeLimit);

  if (personalized.length < safeLimit && !state.hasHistory) {
    const fallback = [...products]
      .sort((left, right) => {
        const leftComposite =
          Number(scoreByProduct.get(left.id)?.final_score ?? 0) +
          Number(trendByProduct.get(left.id)?.trend_score ?? 0) +
          (rankingByProduct.get(left.id) ?? 0);
        const rightComposite =
          Number(scoreByProduct.get(right.id)?.final_score ?? 0) +
          Number(trendByProduct.get(right.id)?.trend_score ?? 0) +
          (rankingByProduct.get(right.id) ?? 0);
        return rightComposite - leftComposite;
      })
      .filter((product) => !pickedIds.has(product.id))
      .slice(0, safeLimit - personalized.length)
      .map((product) => ({ product, score: 0 }));

    personalized.push(...fallback);
  }

  return personalized.slice(0, safeLimit).map(({ product }) => ({
    id: product.id,
    name: product.name ?? product.title ?? "Produto BelaPop",
    title: product.title ?? product.name ?? "Produto BelaPop",
    slug: product.slug ?? product.id,
    price_cents: product.price_cents ?? null,
    brand: product.brand,
    category: product.category,
    hero_image_url: product.hero_image_url,
    badges: Array.isArray(product.badges) ? product.badges : null,
    tags: Array.isArray(product.tags) ? product.tags : null
  }));
}
