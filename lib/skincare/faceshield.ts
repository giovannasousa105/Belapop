import type { CustomerSkinProfile } from "@/lib/customer/api";
import type { SkinScanRow } from "@/lib/skincare/twin";

export type FaceLivenessInput = {
  brightness_score?: number | null;
  texture_score?: number | null;
  depth_score?: number | null;
  blink_detected?: boolean | null;
  head_movement?: boolean | null;
};

export type FaceLivenessResult = {
  blink_detected: boolean;
  head_movement: boolean;
  depth_score: number;
  texture_score: number;
  confidence: number;
  liveness_score: number;
  scan_status: "pending" | "validated" | "rejected";
};

export type FaceHeatmapRegion = {
  condition_type: "acne" | "hydration" | "pigmentation" | "pores" | "wrinkles" | "redness";
  region_slug: string;
  intensity: number;
  position_x: number;
  position_y: number;
  radius: number;
};

export type FaceSkinScore = {
  overall_score: number;
  skin_type: string | null;
  main_concern: string | null;
};

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function clampHundred(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

export function computeFaceLiveness(input: FaceLivenessInput): FaceLivenessResult {
  const blink = Boolean(input.blink_detected);
  const headMovement = Boolean(input.head_movement);
  const depthScore = clampUnit(input.depth_score ?? 0.58);
  const textureScore = clampUnit(input.texture_score ?? input.brightness_score ?? 0.62);

  const confidence = clampUnit(
    depthScore * 0.45 +
      textureScore * 0.35 +
      (blink ? 0.1 : 0) +
      (headMovement ? 0.1 : 0)
  );

  return {
    blink_detected: blink,
    head_movement: headMovement,
    depth_score: depthScore,
    texture_score: textureScore,
    confidence,
    liveness_score: confidence,
    scan_status: confidence >= 0.55 ? "validated" : "rejected"
  };
}

export function deriveSkinHealthScore(scan: SkinScanRow, profile: CustomerSkinProfile | null): FaceSkinScore {
  const overall = clampHundred(
    scan.hydration_score * 0.25 +
      (100 - scan.pore_visibility) * 0.2 +
      (100 - scan.pigmentation_score) * 0.2 +
      (100 - scan.acne_score) * 0.15 +
      (100 - scan.wrinkle_depth) * 0.2
  );

  const derivedSkinType =
    profile?.skin_type?.name ??
    (scan.acne_score > 60 || scan.pore_visibility > 60
      ? "acne_prone"
      : scan.hydration_score < 40
        ? "dry"
        : scan.redness_score > 60
          ? "sensitive"
          : "combination");

  const derivedConcern =
    profile?.main_concern?.name ??
    (scan.acne_score > 60
      ? "acne"
      : scan.pigmentation_score > 55
        ? "dark_spots"
        : scan.hydration_score < 40
          ? "dehydration"
          : scan.redness_score > 55
            ? "rosacea"
            : scan.wrinkle_depth > 50
              ? "aging"
              : "barrier_damage");

  return {
    overall_score: overall,
    skin_type: derivedSkinType,
    main_concern: derivedConcern
  };
}

export function buildHeatmapRegions(scan: SkinScanRow): FaceHeatmapRegion[] {
  const regions: FaceHeatmapRegion[] = [];

  if (scan.acne_score >= 25) {
    regions.push({
      condition_type: "acne",
      region_slug: "chin",
      intensity: clampHundred(scan.acne_score),
      position_x: 0.52,
      position_y: 0.76,
      radius: 0.1
    });
    regions.push({
      condition_type: "acne",
      region_slug: "forehead",
      intensity: clampHundred(scan.acne_score * 0.8),
      position_x: 0.5,
      position_y: 0.2,
      radius: 0.11
    });
  }

  if (scan.pigmentation_score >= 25) {
    regions.push({
      condition_type: "pigmentation",
      region_slug: "right_cheek",
      intensity: clampHundred(scan.pigmentation_score),
      position_x: 0.68,
      position_y: 0.5,
      radius: 0.11
    });
    regions.push({
      condition_type: "pigmentation",
      region_slug: "left_cheek",
      intensity: clampHundred(scan.pigmentation_score * 0.92),
      position_x: 0.32,
      position_y: 0.5,
      radius: 0.11
    });
  }

  if (scan.redness_score >= 20) {
    regions.push({
      condition_type: "redness",
      region_slug: "nose",
      intensity: clampHundred(scan.redness_score),
      position_x: 0.5,
      position_y: 0.48,
      radius: 0.08
    });
  }

  if (scan.pore_visibility >= 20) {
    regions.push({
      condition_type: "pores",
      region_slug: "t_zone",
      intensity: clampHundred(scan.pore_visibility),
      position_x: 0.5,
      position_y: 0.35,
      radius: 0.14
    });
  }

  if (scan.wrinkle_depth >= 20) {
    regions.push({
      condition_type: "wrinkles",
      region_slug: "eye_area",
      intensity: clampHundred(scan.wrinkle_depth),
      position_x: 0.64,
      position_y: 0.36,
      radius: 0.08
    });
  }

  if (scan.hydration_score <= 60) {
    regions.push({
      condition_type: "hydration",
      region_slug: "cheeks",
      intensity: clampHundred(100 - scan.hydration_score),
      position_x: 0.35,
      position_y: 0.58,
      radius: 0.12
    });
    regions.push({
      condition_type: "hydration",
      region_slug: "jawline",
      intensity: clampHundred((100 - scan.hydration_score) * 0.85),
      position_x: 0.65,
      position_y: 0.7,
      radius: 0.12
    });
  }

  return regions;
}

export function deriveSkinProgress(currentOverall: number, previousOverall: number | null) {
  if (previousOverall === null) return 0;
  return Number((currentOverall - previousOverall).toFixed(2));
}
