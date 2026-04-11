type ProfileReference = {
  skin_type?: { slug: string } | null;
  main_concern?: { slug: string } | null;
  sensitivity_level?: number | null;
};

export const skinMetricKeys = [
  "hydration_level",
  "elasticity_level",
  "pigmentation_level",
  "acne_level",
  "redness_level",
  "pore_visibility",
  "wrinkle_depth"
] as const;

export type SkinMetricKey = (typeof skinMetricKeys)[number];

export type SkinMetricSet = Record<SkinMetricKey, number>;

export type SkinTwinRow = {
  id: string;
  user_id: string;
  latest_scan_id: string | null;
  hydration_level: number;
  elasticity_level: number;
  pigmentation_level: number;
  acne_level: number;
  redness_level: number;
  pore_visibility: number;
  wrinkle_depth: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
};

export type SkinScanRow = {
  id: string;
  user_id: string;
  skin_twin_id: string | null;
  hydration_score: number;
  elasticity_score: number;
  pigmentation_score: number;
  acne_score: number;
  redness_score: number;
  pore_visibility: number;
  wrinkle_depth: number;
  scan_source: string;
  image_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SkinTwinSnapshotRow = {
  id: string;
  skin_twin_id: string;
  skin_scan_id: string | null;
  hydration_level: number;
  elasticity_level: number;
  pigmentation_level: number;
  acne_level: number;
  redness_level: number;
  pore_visibility: number;
  wrinkle_depth: number;
  confidence_score: number;
  created_at: string;
};

export type TreatmentOutcomeRow = {
  id: string;
  user_id: string;
  before_scan_id: string;
  after_scan_id: string;
  improvement_score: number;
  metrics_delta: Record<string, unknown>;
  created_at: string;
};

export type SkincareUsageRow = {
  id: string;
  user_id: string;
  product_id: string;
  routine_cart_id: string | null;
  start_date: string;
  end_date: string | null;
  adherence_score: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SkinImageRow = {
  id: string;
  user_id: string;
  skin_scan_id: string | null;
  face_scan_id: string | null;
  image_url: string;
  heatmap_url: string | null;
  image_kind: "scan" | "heatmap" | "overlay" | "neutral" | "blink" | "smile" | "frown" | "turn";
  source: "manual" | "faceshield" | "imported" | "generated";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FaceScanFindingType =
  | "nevus_melanocytic"
  | "cherry_angioma"
  | "keratosis"
  | "melanoma_triage"
  | "scc_triage";

export type FaceScanFindingRow = {
  id: string;
  scan_id: string;
  finding_type: FaceScanFindingType;
  region_slug: string;
  confidence_score: number;
  severity_score: number;
  position_x: number;
  position_y: number;
  radius: number;
  appearance_status: "stable" | "new" | "changed";
  requires_clinical_review: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type IngredientEffectRow = {
  ingredient_id: string;
  ingredient_name: string;
  target_metric: SkinMetricKey;
  improvement_rate: number;
  confidence_score: number;
};

export type SimulationScenario = {
  days: number;
  predicted_improvement: number;
  confidence_score: number;
  predicted_metrics: SkinMetricSet;
  key_effects: Array<{
    ingredient_name: string;
    target_metric: SkinMetricKey;
    improvement_rate: number;
  }>;
};

export type SavedRoutineSimulationRow = {
  id: string;
  skin_twin_id: string;
  routine_cart_id: string | null;
  simulation_period_days: number;
  predicted_improvement: number;
  confidence_score: number;
  current_metrics: SkinMetricSet;
  predicted_metrics: SkinMetricSet;
  metadata: Record<string, unknown>;
  created_at: string;
};

const beneficialMetrics = new Set<SkinMetricKey>(["hydration_level", "elasticity_level"]);

export function clampMetric(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

export function metricsFromTwin(twin: SkinTwinRow): SkinMetricSet {
  return {
    hydration_level: twin.hydration_level,
    elasticity_level: twin.elasticity_level,
    pigmentation_level: twin.pigmentation_level,
    acne_level: twin.acne_level,
    redness_level: twin.redness_level,
    pore_visibility: twin.pore_visibility,
    wrinkle_depth: twin.wrinkle_depth
  };
}

export function metricsFromScan(scan: SkinScanRow): SkinMetricSet {
  return {
    hydration_level: scan.hydration_score,
    elasticity_level: scan.elasticity_score,
    pigmentation_level: scan.pigmentation_score,
    acne_level: scan.acne_score,
    redness_level: scan.redness_score,
    pore_visibility: scan.pore_visibility,
    wrinkle_depth: scan.wrinkle_depth
  };
}

export function deriveBaselineMetrics(profile: ProfileReference | null): SkinMetricSet {
  const defaults: SkinMetricSet = {
    hydration_level: 52,
    elasticity_level: 54,
    pigmentation_level: 48,
    acne_level: 42,
    redness_level: 36,
    pore_visibility: 44,
    wrinkle_depth: 32
  };

  if (!profile) return defaults;

  const next = { ...defaults };
  const skinType = profile.skin_type?.slug ?? null;
  const concern = profile.main_concern?.slug ?? null;
  const sensitivity = profile.sensitivity_level ?? 3;

  if (skinType === "dry") {
    next.hydration_level -= 12;
    next.elasticity_level -= 6;
  } else if (skinType === "normal") {
    next.acne_level -= 4;
    next.redness_level -= 4;
  } else if (skinType === "oily") {
    next.acne_level += 12;
    next.pore_visibility += 10;
  } else if (skinType === "combination") {
    next.pore_visibility += 6;
    next.hydration_level -= 4;
  } else if (skinType === "sensitive") {
    next.redness_level += 14;
  } else if (skinType === "acne_prone") {
    next.acne_level += 18;
    next.pore_visibility += 10;
  }

  if (concern === "dehydration") next.hydration_level -= 16;
  if (concern === "oiliness") {
    next.acne_level += 10;
    next.pore_visibility += 12;
    next.hydration_level -= 4;
  }
  if (concern === "visible_pores") next.pore_visibility += 18;
  if (concern === "aging") {
    next.elasticity_level -= 10;
    next.wrinkle_depth += 14;
  }
  if (concern === "dark_spots") next.pigmentation_level += 18;
  if (concern === "acne") next.acne_level += 16;
  if (concern === "rosacea") next.redness_level += 18;
  if (concern === "barrier_damage") {
    next.hydration_level -= 10;
    next.redness_level += 12;
  }
  if (concern === "uneven_texture") {
    next.pore_visibility += 8;
    next.wrinkle_depth += 6;
    next.pigmentation_level += 5;
  }
  if (concern === "under_eye") {
    next.pigmentation_level += 8;
    next.wrinkle_depth += 8;
    next.hydration_level -= 5;
  }

  next.redness_level += (sensitivity - 3) * 4;

  return mapMetricSet(next);
}

export function mapMetricSet(input: Partial<Record<SkinMetricKey, number>>): SkinMetricSet {
  return {
    hydration_level: clampMetric(input.hydration_level ?? 0),
    elasticity_level: clampMetric(input.elasticity_level ?? 0),
    pigmentation_level: clampMetric(input.pigmentation_level ?? 0),
    acne_level: clampMetric(input.acne_level ?? 0),
    redness_level: clampMetric(input.redness_level ?? 0),
    pore_visibility: clampMetric(input.pore_visibility ?? 0),
    wrinkle_depth: clampMetric(input.wrinkle_depth ?? 0)
  };
}

export function computeImprovementScore(before: SkinMetricSet, after: SkinMetricSet) {
  const deltas = skinMetricKeys.map((key) =>
    beneficialMetrics.has(key) ? Math.max(after[key] - before[key], 0) : Math.max(before[key] - after[key], 0)
  );

  const average = deltas.reduce((total, value) => total + value, 0) / deltas.length;
  return Number(average.toFixed(2));
}

export function buildSimulationScenarios(
  currentMetrics: SkinMetricSet,
  effects: IngredientEffectRow[],
  daysList: number[]
) {
  const normalizedEffects = effects.reduce<Record<SkinMetricKey, IngredientEffectRow[]>>(
    (acc, effect) => {
      acc[effect.target_metric].push(effect);
      return acc;
    },
    {
      hydration_level: [],
      elasticity_level: [],
      pigmentation_level: [],
      acne_level: [],
      redness_level: [],
      pore_visibility: [],
      wrinkle_depth: []
    }
  );

  return daysList.map<SimulationScenario>((days) => {
    const multiplier = days / 30;
    const predictedMetrics = skinMetricKeys.reduce((acc, key) => {
      const effectTotal = normalizedEffects[key].reduce((sum, effect) => sum + effect.improvement_rate, 0);
      const nextValue = beneficialMetrics.has(key)
        ? currentMetrics[key] + effectTotal * multiplier
        : currentMetrics[key] - effectTotal * multiplier;
      acc[key] = clampMetric(nextValue);
      return acc;
    }, {} as SkinMetricSet);

    const confidenceSamples = effects.map((effect) => effect.confidence_score);
    const confidenceScore =
      confidenceSamples.length > 0
        ? Number(
            Math.min(0.95, confidenceSamples.reduce((sum, value) => sum + value, 0) / confidenceSamples.length).toFixed(4)
          )
        : 0;

    const keyEffects = effects
      .slice()
      .sort((a, b) => b.improvement_rate - a.improvement_rate)
      .slice(0, 4)
      .map((effect) => ({
        ingredient_name: effect.ingredient_name,
        target_metric: effect.target_metric,
        improvement_rate: Number((effect.improvement_rate * multiplier).toFixed(2))
      }));

    return {
      days,
      predicted_improvement: computeImprovementScore(currentMetrics, predictedMetrics),
      confidence_score: confidenceScore,
      predicted_metrics: predictedMetrics,
      key_effects: keyEffects
    };
  });
}

export const skinMetricLabels: Record<SkinMetricKey, string> = {
  hydration_level: "Hidratacao",
  elasticity_level: "Elasticidade",
  pigmentation_level: "Pigmentacao",
  acne_level: "Acne",
  redness_level: "Vermelhidao",
  pore_visibility: "Poros",
  wrinkle_depth: "Linhas"
};

export function formatMetricDelta(key: SkinMetricKey, before: number, after: number) {
  const delta = beneficialMetrics.has(key) ? after - before : before - after;
  return Number(delta.toFixed(2));
}
