import type {
  QualityScoreLevel,
  ProductQualityScoreBreakdown,
  ProductSkuStandard,
  SellerQualityScoreBreakdown
} from "@/lib/catalog-standards/types";

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const weightedAverage = (
  values: Record<string, number | undefined>,
  weights: Record<string, number>
) => {
  let total = 0;
  let weightTotal = 0;

  Object.entries(values).forEach(([key, rawValue]) => {
    if (typeof rawValue !== "number") return;
    const weight = Number(weights[key] ?? 1);
    total += rawValue * weight;
    weightTotal += weight;
  });

  return clampScore(weightTotal ? total / weightTotal : 0);
};

export const calculateSellerQualityScore = (breakdown: SellerQualityScoreBreakdown) =>
  weightedAverage({ ...breakdown }, {
    catalogQuality: 1.15,
    complaints: 1,
    reliability: 1.25,
    responseTime: 0.85,
    returnRate: 1,
    reviews: 1,
    shipment: 1.2,
    visualStandardization: 1.1
  });

export const calculateProductQualityScore = (breakdown: ProductQualityScoreBreakdown) =>
  weightedAverage({ ...breakdown }, {
    authenticity: 1.35,
    claims: 1.2,
    content: 1,
    images: 1.2,
    logistics: 1,
    naming: 1.1,
    seo: 0.75
  });

export const deriveProductStandardScore = (standard: ProductSkuStandard) => {
  const missingPenalty = standard.missingFields.length * 4;
  const criticalPenalty = standard.validationAlerts.filter((alert) => alert.severity === "critical").length * 12;
  const warningPenalty = standard.validationAlerts.filter((alert) => alert.severity === "warning").length * 5;
  const base = standard.qualityScore || 100;
  return clampScore(base - missingPenalty - criticalPenalty - warningPenalty);
};

export const resolveQualityScoreLevel = (score: number): QualityScoreLevel => {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "attention";
  return "blocked";
};
