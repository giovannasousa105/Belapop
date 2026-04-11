import type { CustomerSkinProfile } from "@/lib/customer/api";
import type { SimilarSkinProfileRow } from "@/lib/skincare/server";
import type { RoutineRecommendationRow } from "@/lib/skincare/routine";
import type { SkinMetricSet } from "@/lib/skincare/twin";

type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").getSupabaseAdminClient>;

type ProductEffectivenessRow = {
  product_id: string;
  acne_effectiveness: number | null;
  hydration_effectiveness: number | null;
  pigmentation_effectiveness: number | null;
  redness_effectiveness: number | null;
  confidence_score: number | null;
};

type IngredientMetric =
  | "acne"
  | "hydration"
  | "pigmentation"
  | "redness"
  | "pore"
  | "elasticity";

type MetricWeightMap = Record<IngredientMetric, number>;

type ProductIngredientEffectRow = {
  product_id: string;
  ingredient_id: string;
  target_metric: IngredientMetric | string;
  improvement_rate: number | null;
  confidence_score: number | null;
};

function normalizeScore(value: number, max = 100) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value / max));
}

function normalizeSimilarity(value: number | null | undefined) {
  if (!Number.isFinite(Number(value))) return 0;
  return Math.max(0, Math.min(1, Number(value)));
}

function normalizeWeightMap(weights: MetricWeightMap) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return {
      acne: 0.2,
      hydration: 0.3,
      pigmentation: 0.2,
      redness: 0.15,
      pore: 0.1,
      elasticity: 0.05
    } satisfies MetricWeightMap;
  }

  return {
    acne: weights.acne / total,
    hydration: weights.hydration / total,
    pigmentation: weights.pigmentation / total,
    redness: weights.redness / total,
    pore: weights.pore / total,
    elasticity: weights.elasticity / total
  } satisfies MetricWeightMap;
}

function metricUrgency(metrics: SkinMetricSet): MetricWeightMap {
  return {
    acne: normalizeScore(metrics.acne_level),
    hydration: normalizeScore(100 - metrics.hydration_level),
    pigmentation: normalizeScore(metrics.pigmentation_level),
    redness: normalizeScore(metrics.redness_level),
    pore: normalizeScore(metrics.pore_visibility),
    elasticity: normalizeScore(100 - metrics.elasticity_level)
  };
}

function concernMetricWeight(profile: CustomerSkinProfile | null, metrics: SkinMetricSet): MetricWeightMap {
  const concern = profile?.main_concern?.slug ?? "";
  const urgency = metricUrgency(metrics);
  let baseWeights: MetricWeightMap;

  if (concern === "acne") {
    baseWeights = { acne: 0.52, hydration: 0.06, pigmentation: 0.04, redness: 0.14, pore: 0.2, elasticity: 0.04 };
  } else if (concern === "oiliness") {
    baseWeights = { acne: 0.34, hydration: 0.04, pigmentation: 0.03, redness: 0.08, pore: 0.46, elasticity: 0.05 };
  } else if (concern === "visible_pores") {
    baseWeights = { acne: 0.18, hydration: 0.05, pigmentation: 0.03, redness: 0.04, pore: 0.62, elasticity: 0.08 };
  } else if (concern === "dehydration" || concern === "barrier_damage") {
    baseWeights = { acne: 0.03, hydration: 0.52, pigmentation: 0.03, redness: 0.17, pore: 0.05, elasticity: 0.2 };
  } else if (concern === "dark_spots") {
    baseWeights = { acne: 0.03, hydration: 0.08, pigmentation: 0.62, redness: 0.08, pore: 0.04, elasticity: 0.15 };
  } else if (concern === "rosacea") {
    baseWeights = { acne: 0.08, hydration: 0.12, pigmentation: 0.03, redness: 0.56, pore: 0.05, elasticity: 0.16 };
  } else if (concern === "uneven_texture") {
    baseWeights = { acne: 0.08, hydration: 0.08, pigmentation: 0.18, redness: 0.05, pore: 0.31, elasticity: 0.3 };
  } else if (concern === "under_eye") {
    baseWeights = { acne: 0.01, hydration: 0.24, pigmentation: 0.26, redness: 0.06, pore: 0.03, elasticity: 0.4 };
  } else if (concern === "aging") {
    baseWeights = { acne: 0.02, hydration: 0.15, pigmentation: 0.18, redness: 0.05, pore: 0.05, elasticity: 0.55 };
  } else {
    baseWeights = { acne: 0.16, hydration: 0.24, pigmentation: 0.18, redness: 0.14, pore: 0.14, elasticity: 0.14 };
  }

  return normalizeWeightMap({
    acne: baseWeights.acne + urgency.acne * 0.18,
    hydration: baseWeights.hydration + urgency.hydration * 0.22,
    pigmentation: baseWeights.pigmentation + urgency.pigmentation * 0.18,
    redness: baseWeights.redness + urgency.redness * 0.18,
    pore: baseWeights.pore + urgency.pore * 0.14,
    elasticity: baseWeights.elasticity + urgency.elasticity * 0.14
  });
}

function confidenceAmplifier(value: number | null | undefined, floor = 0.35) {
  const normalized = normalizeSimilarity(value ?? 0);
  return floor + Math.sqrt(normalized) * (1 - floor);
}

function productEffectivenessBoost(
  row: ProductEffectivenessRow | undefined,
  profile: CustomerSkinProfile | null,
  metrics: SkinMetricSet
) {
  if (!row) return 0;
  const weight = concernMetricWeight(profile, metrics);
  const availableWeight = weight.acne + weight.hydration + weight.pigmentation + weight.redness;
  if (availableWeight <= 0) return 0;

  const score =
    normalizeScore(Number(row.acne_effectiveness ?? 0)) * weight.acne +
    normalizeScore(Number(row.hydration_effectiveness ?? 0)) * weight.hydration +
    normalizeScore(Number(row.pigmentation_effectiveness ?? 0)) * weight.pigmentation +
    normalizeScore(Number(row.redness_effectiveness ?? 0)) * weight.redness;

  return (score / availableWeight) * confidenceAmplifier(row.confidence_score ?? 0.5, 0.38);
}

function ingredientMetricWeight(metric: string, weight: MetricWeightMap) {
  if (metric === "acne") return weight.acne;
  if (metric === "hydration") return weight.hydration;
  if (metric === "pigmentation") return weight.pigmentation;
  if (metric === "redness") return weight.redness;
  if (metric === "pore") return weight.pore;
  if (metric === "elasticity") return weight.elasticity;
  return 0;
}

function buildIngredientBoostMap(args: {
  rows: RoutineRecommendationRow[];
  ingredientRows: ProductIngredientEffectRow[];
  profile: CustomerSkinProfile | null;
  metrics: SkinMetricSet;
}) {
  const weight = concernMetricWeight(args.profile, args.metrics);
  const grouped = new Map<string, Array<{ signal: number; metricWeight: number }>>();

  for (const row of args.ingredientRows) {
    const metricWeight = ingredientMetricWeight(row.target_metric, weight);
    if (metricWeight <= 0) continue;

    const signal =
      normalizeScore(Number(row.improvement_rate ?? 0), 20) *
      confidenceAmplifier(row.confidence_score ?? 0.5, 0.42);

    const current = grouped.get(row.product_id) ?? [];
    current.push({ signal, metricWeight });
    grouped.set(row.product_id, current);
  }

  return new Map(
    args.rows.map((row) => {
      const signals = (grouped.get(row.product_id) ?? []).sort(
        (left, right) => right.signal * right.metricWeight - left.signal * left.metricWeight
      );

      if (signals.length === 0) {
        return [row.product_id, 0] as const;
      }

      const cappedSignals = signals.slice(0, 4);
      const weighted = cappedSignals.reduce(
        (accumulator, item) => {
          accumulator.signal += item.signal * item.metricWeight;
          accumulator.totalWeight += item.metricWeight;
          return accumulator;
        },
        { signal: 0, totalWeight: 0 }
      );

      const diversityBoost = Math.min(0.12, Math.max(0, cappedSignals.length - 1) * 0.04);
      const score = weighted.totalWeight > 0 ? weighted.signal / weighted.totalWeight : 0;

      return [row.product_id, Math.min(1, score + diversityBoost)] as const;
    })
  );
}

function buildOutcomeBoostMap(args: {
  rows: RoutineRecommendationRow[];
  similarProfiles: SimilarSkinProfileRow[];
  usageRows: Array<{
    user_id: string;
    product_id: string;
    routine_cart_id: string | null;
    adherence_score: number | null;
  }>;
  outcomes: Array<{
    user_id: string;
    routine_cart_id: string | null;
    improvement_score: number;
  }>;
}) {
  const productIds = new Set(args.rows.map((row) => row.product_id));
  const similarityMap = new Map(args.similarProfiles.map((item) => [item.similar_user_id, normalizeSimilarity(item.similarity)]));
  const outcomeMap = new Map(
    args.outcomes
      .filter((item) => item.routine_cart_id)
      .map((item) => [`${item.user_id}:${item.routine_cart_id}`, item.improvement_score])
  );

  const accumulator = new Map<string, { weighted: number; totalWeight: number }>();

  for (const usage of args.usageRows) {
    if (!productIds.has(usage.product_id)) continue;
    const similarity = similarityMap.get(usage.user_id) ?? 0;
    if (similarity <= 0) continue;
    const improvement = usage.routine_cart_id ? outcomeMap.get(`${usage.user_id}:${usage.routine_cart_id}`) ?? 0 : 0;
    const adherence = normalizeSimilarity((usage.adherence_score ?? 50) / 100);
    const weight = similarity * (0.6 + adherence * 0.4);
    const current = accumulator.get(usage.product_id) ?? { weighted: 0, totalWeight: 0 };
    current.weighted += improvement * weight;
    current.totalWeight += weight;
    accumulator.set(usage.product_id, current);
  }

  return new Map(
    Array.from(accumulator.entries()).map(([productId, current]) => [
      productId,
      current.totalWeight > 0 ? normalizeScore(current.weighted / current.totalWeight) : 0
    ])
  );
}

export async function rerankRoutineRecommendations(args: {
  admin: AdminClient;
  userId: string;
  profile: CustomerSkinProfile | null;
  metrics: SkinMetricSet;
  rows: RoutineRecommendationRow[];
}) {
  if (args.rows.length === 0) return args.rows;

  const productIds = Array.from(new Set(args.rows.map((row) => row.product_id)));

  let similarProfiles: SimilarSkinProfileRow[] = [];
  try {
    const { data, error } = await args.admin.rpc("find_similar_skin_profiles", {
      p_user_id: args.userId,
      p_limit: 12
    });
    if (error) throw error;
    similarProfiles = (data ?? []) as SimilarSkinProfileRow[];
  } catch {
    similarProfiles = [];
  }

  const similarUserIds = similarProfiles.map((item) => item.similar_user_id);

  const [effectivenessResult, ingredientEffectsResult, usageResult, outcomesResult] = await Promise.all([
    args.admin
      .from("product_effectiveness")
      .select("product_id,acne_effectiveness,hydration_effectiveness,pigmentation_effectiveness,redness_effectiveness,confidence_score")
      .in("product_id", productIds),
    args.admin
      .from("product_ingredients")
      .select("product_id,ingredient_id,ingredient_effects!inner(target_metric,improvement_rate,confidence_score)")
      .in("product_id", productIds),
    similarUserIds.length
      ? args.admin
          .from("skincare_usage")
          .select("user_id,product_id,routine_cart_id,adherence_score")
          .in("user_id", similarUserIds)
          .in("product_id", productIds)
      : Promise.resolve({ data: [], error: null }),
    similarUserIds.length
      ? args.admin
          .from("skin_outcomes")
          .select("user_id,routine_cart_id,improvement_score")
          .in("user_id", similarUserIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  const error = effectivenessResult.error ?? ingredientEffectsResult.error ?? usageResult.error ?? outcomesResult.error;
  if (error) throw error;

  const effectivenessMap = new Map(
    ((effectivenessResult.data ?? []) as ProductEffectivenessRow[]).map((item) => [item.product_id, item])
  );
  const outcomeBoostMap = buildOutcomeBoostMap({
    rows: args.rows,
    similarProfiles,
    usageRows: (usageResult.data ?? []) as Array<{
      user_id: string;
      product_id: string;
      routine_cart_id: string | null;
      adherence_score: number | null;
    }>,
    outcomes: (outcomesResult.data ?? []) as Array<{
      user_id: string;
      routine_cart_id: string | null;
      improvement_score: number;
    }>
  });
  const ingredientBoostMap = buildIngredientBoostMap({
    rows: args.rows,
    ingredientRows: ((ingredientEffectsResult.data ?? []) as Array<{
      product_id: string;
      ingredient_id: string;
      ingredient_effects:
        | {
            target_metric: string;
            improvement_rate: number | null;
            confidence_score: number | null;
          }
        | Array<{
            target_metric: string;
            improvement_rate: number | null;
            confidence_score: number | null;
          }>
        | null;
    }>).flatMap((item) => {
      const effects = Array.isArray(item.ingredient_effects)
        ? item.ingredient_effects
        : item.ingredient_effects
          ? [item.ingredient_effects]
          : [];

      return effects.map((effect) => ({
        product_id: item.product_id,
        ingredient_id: item.ingredient_id,
        target_metric: effect.target_metric,
        improvement_rate: effect.improvement_rate,
        confidence_score: effect.confidence_score
      }));
    }),
    profile: args.profile,
    metrics: args.metrics
  });

  return args.rows
    .map((row) => {
      const base = normalizeScore(Number(row.score ?? 0));
      const outcomeBoost = outcomeBoostMap.get(row.product_id) ?? 0;
      const effectivenessBoost = productEffectivenessBoost(effectivenessMap.get(row.product_id), args.profile, args.metrics);
      const ingredientBoost = ingredientBoostMap.get(row.product_id) ?? 0;
      const rerankedScore = Number(
        (base * 0.44 + outcomeBoost * 0.24 + effectivenessBoost * 0.2 + ingredientBoost * 0.12).toFixed(6)
      );
      return {
        ...row,
        score: Number((rerankedScore * 100).toFixed(2))
      };
    })
    .sort((left, right) => {
      if (left.step_order !== right.step_order) return left.step_order - right.step_order;
      return right.score - left.score;
    });
}

export async function createRoutineCartFromRecommendations(args: {
  admin: AdminClient;
  userId: string;
  rows: RoutineRecommendationRow[];
  profileId: string | null;
}) {
  const uniqueTopRows = Array.from(
    new Map(
      args.rows
        .sort((left, right) => left.step_order - right.step_order || right.score - left.score)
        .map((row) => [`${row.routine_step_id}:${row.product_id}`, row])
    ).values()
  );

  const topPerStep = Array.from(
    new Map(uniqueTopRows.map((row) => [row.routine_step_id, row])).values()
  );

  const { data: cart, error: cartError } = await args.admin
    .from("routine_carts")
    .insert({
      user_id: args.userId,
      profile_id: args.profileId
    })
    .select("id")
    .single();

  if (cartError) throw cartError;

  if (topPerStep.length > 0) {
    const { error: itemsError } = await args.admin.from("routine_cart_items").insert(
      topPerStep.map((row, index) => ({
        cart_id: cart.id,
        product_id: row.product_id,
        routine_step_id: row.routine_step_id,
        position: index + 1
      }))
    );

    if (itemsError) throw itemsError;
  }

  return cart.id as string;
}
