type UnknownRecord = Record<string, unknown>;

export type SkinTypeOption = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
};

export type SkinToneOption = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type SkinConcernOption = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type RoutineStepOption = {
  id: string;
  slug: string;
  name: string;
  step_order: number;
};

export type UserSkinProfileRow = {
  id: string;
  user_id: string;
  skin_type_id: string | null;
  skin_tone_id: string | null;
  main_concern_id: string | null;
  sensitivity_level: number;
  price_affinity_cents: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RoutineRecommendationRow = {
  routine_step_id: string;
  routine_step_slug: string;
  routine_step_name: string;
  step_order: number;
  product_id: string;
  product_name: string;
  seller_id: string;
  price_cents: number;
  hero_image_url: string | null;
  score: number;
  ingredient_match_score: number;
  rating_score: number;
  skin_type_match_score: number;
  price_affinity_score: number;
};

export type RoutineCartItemRecord = {
  cart_id: string;
  product_id: string;
  routine_step_id: string | null;
  position: number;
};

export type RoutineCartProductRecord = {
  id: string;
  name: string;
  price_cents: number;
  hero_image_url: string | null;
  images: unknown;
  seller_id: string;
};

const asRecord = (value: unknown): UnknownRecord =>
  typeof value === "object" && value !== null ? (value as UnknownRecord) : {};

const asString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

export function resolveProductImage(heroImageUrl: string | null | undefined, images: unknown): string | null {
  if (typeof heroImageUrl === "string" && heroImageUrl.trim()) {
    return heroImageUrl.trim();
  }

  if (!Array.isArray(images)) return null;

  for (const image of images) {
    if (typeof image === "string" && image.trim()) return image.trim();
    const record = asRecord(image);
    const candidate = asString(record.url) ?? asString(record.src) ?? asString(record.image_url);
    if (candidate) return candidate;
  }

  return null;
}

export function mapUserSkinProfile(
  profile: UserSkinProfileRow | null,
  skinTypes: SkinTypeOption[],
  concerns: SkinConcernOption[],
  skinTones: SkinToneOption[] = []
) {
  if (!profile) return null;

  const skinType = profile.skin_type_id
    ? skinTypes.find((item) => item.id === profile.skin_type_id) ?? null
    : null;
  const skinTone = profile.skin_tone_id
    ? skinTones.find((item) => item.id === profile.skin_tone_id) ?? null
    : null;
  const mainConcern = profile.main_concern_id
    ? concerns.find((item) => item.id === profile.main_concern_id) ?? null
    : null;

  return {
    ...profile,
    skin_type: skinType,
    skin_tone: skinTone,
    main_concern: mainConcern
  };
}

export function groupRoutineRecommendations(rows: RoutineRecommendationRow[]) {
  const stepMap = new Map<
    string,
    {
      routine_step_id: string;
      routine_step_slug: string;
      routine_step_name: string;
      step_order: number;
      recommendations: Array<{
        product_id: string;
        product_name: string;
        seller_id: string;
        price_cents: number;
        hero_image_url: string | null;
        score: number;
        ingredient_match_score: number;
        rating_score: number;
        skin_type_match_score: number;
        price_affinity_score: number;
      }>;
    }
  >();

  for (const row of rows) {
    if (!stepMap.has(row.routine_step_id)) {
      stepMap.set(row.routine_step_id, {
        routine_step_id: row.routine_step_id,
        routine_step_slug: row.routine_step_slug,
        routine_step_name: row.routine_step_name,
        step_order: row.step_order,
        recommendations: []
      });
    }

    stepMap.get(row.routine_step_id)?.recommendations.push({
      product_id: row.product_id,
      product_name: row.product_name,
      seller_id: row.seller_id,
      price_cents: row.price_cents,
      hero_image_url: row.hero_image_url,
      score: row.score,
      ingredient_match_score: row.ingredient_match_score,
      rating_score: row.rating_score,
      skin_type_match_score: row.skin_type_match_score,
      price_affinity_score: row.price_affinity_score
    });
  }

  return Array.from(stepMap.values()).sort((a, b) => a.step_order - b.step_order);
}

export function buildRoutineSummary(steps: ReturnType<typeof groupRoutineRecommendations>) {
  const topPicks = steps
    .map((step) => step.recommendations[0] ?? null)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    steps_count: steps.length,
    recommended_products_count: topPicks.length,
    total_price_cents: topPicks.reduce((total, item) => total + item.price_cents, 0)
  };
}

export function buildRoutineCartResponse(args: {
  cartId: string;
  userId: string;
  createdAt: string;
  items: RoutineCartItemRecord[];
  products: RoutineCartProductRecord[];
  steps: RoutineStepOption[];
}) {
  const productMap = new Map(args.products.map((item) => [item.id, item]));
  const stepMap = new Map(args.steps.map((item) => [item.id, item]));

  const items = [...args.items]
    .sort((a, b) => a.position - b.position)
    .map((item) => {
      const product = productMap.get(item.product_id);
      const step = item.routine_step_id ? stepMap.get(item.routine_step_id) ?? null : null;

      return {
        cart_id: item.cart_id,
        product_id: item.product_id,
        routine_step_id: item.routine_step_id,
        position: item.position,
        routine_step: step,
        product: product
          ? {
              id: product.id,
              name: product.name,
              seller_id: product.seller_id,
              price_cents: product.price_cents,
              hero_image_url: resolveProductImage(product.hero_image_url, product.images)
            }
          : null
      };
    });

  return {
    id: args.cartId,
    user_id: args.userId,
    created_at: args.createdAt,
    items,
    total_price_cents: items.reduce((total, item) => total + (item.product?.price_cents ?? 0), 0)
  };
}
