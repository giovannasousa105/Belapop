import type { PostgrestError } from "@supabase/supabase-js";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  normalizeSkinConcernOptions,
  normalizeSkinToneOptions,
  normalizeSkinTypeOptions
} from "@/lib/skincare/profileTaxonomy";
import type {
  RoutineStepOption,
  SkinConcernOption,
  SkinToneOption,
  SkinTypeOption,
  UserSkinProfileRow
} from "@/lib/skincare/routine";
import type {
  SavedRoutineSimulationRow,
  SkincareUsageRow,
  SkinImageRow,
  SkinScanRow,
  SkinTwinRow,
  SkinTwinSnapshotRow,
  TreatmentOutcomeRow
} from "@/lib/skincare/twin";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

export type SimilarSkinProfileRow = {
  similar_user_id: string;
  face_scan_id: string | null;
  skin_scan_id: string | null;
  similarity: number;
  overall_score: number | null;
  latest_improvement_score: number | null;
  skin_type: string | null;
  main_concern: string | null;
  hydration_level: number | null;
  pigmentation_level: number | null;
  acne_level: number | null;
  redness_level: number | null;
};

function throwOnError(error: PostgrestError | null) {
  if (error) throw error;
}

export async function loadSkinProfileOptions(admin: AdminClient) {
  const [
    { data: skinTypes, error: skinTypesError },
    { data: skinTones, error: skinTonesError },
    { data: concerns, error: concernsError },
    { data: steps, error: stepsError }
  ] =
    await Promise.all([
      admin.from("skin_types").select("id,slug,name,description").order("sort_order", { ascending: true }),
      admin.from("skin_tones").select("id,slug,name,description").order("sort_order", { ascending: true }),
      admin.from("skin_concerns").select("id,slug,name,description").order("sort_order", { ascending: true }),
      admin.from("routine_steps").select("id,slug,name,step_order").eq("is_active", true).order("step_order", {
        ascending: true
      })
    ]);

  throwOnError(skinTypesError ?? skinTonesError ?? concernsError ?? stepsError);

  return {
    skinTypes: normalizeSkinTypeOptions((skinTypes ?? []) as SkinTypeOption[]),
    skinTones: normalizeSkinToneOptions((skinTones ?? []) as SkinToneOption[]),
    concerns: normalizeSkinConcernOptions((concerns ?? []) as SkinConcernOption[]),
    steps: (steps ?? []) as RoutineStepOption[]
  };
}

export async function loadCurrentSkinProfile(admin: AdminClient, userId: string) {
  const { data, error } = await admin
    .from("user_skin_profiles")
    .select(
      "id,user_id,skin_type_id,skin_tone_id,main_concern_id,sensitivity_level,price_affinity_cents,metadata,created_at,updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  throwOnError(error);
  return (data ?? null) as UserSkinProfileRow | null;
}

export async function loadSkinTwinBundle(admin: AdminClient, userId: string) {
  const [
    { data: twin, error: twinError },
    { data: scans, error: scansError },
    { data: outcomes, error: outcomesError },
    { data: usage, error: usageError },
    { data: images, error: imagesError },
    { data: similarProfiles, error: similarProfilesError }
  ] = await Promise.all([
      admin
        .from("skin_twins")
        .select(
          "id,user_id,latest_scan_id,hydration_level,elasticity_level,pigmentation_level,acne_level,redness_level,pore_visibility,wrinkle_depth,confidence_score,created_at,updated_at"
        )
        .eq("user_id", userId)
        .maybeSingle(),
      admin
        .from("skin_scans")
        .select(
          "id,user_id,skin_twin_id,hydration_score,elasticity_score,pigmentation_score,acne_score,redness_score,pore_visibility,wrinkle_depth,scan_source,image_url,metadata,created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
      admin
        .from("treatment_outcomes")
        .select("id,user_id,before_scan_id,after_scan_id,improvement_score,metrics_delta,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
      admin
        .from("skincare_usage")
        .select("id,user_id,product_id,routine_cart_id,start_date,end_date,adherence_score,metadata,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("skin_images")
        .select("id,user_id,skin_scan_id,face_scan_id,image_url,heatmap_url,image_kind,source,metadata,created_at,updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      admin.rpc("find_similar_skin_profiles", {
        p_user_id: userId,
        p_limit: 6
      })
    ]);

  throwOnError(twinError ?? scansError ?? outcomesError ?? usageError ?? imagesError ?? similarProfilesError);

  const twinRow = (twin ?? null) as SkinTwinRow | null;
  const recentScans = (scans ?? []) as SkinScanRow[];
  const recentOutcomes = (outcomes ?? []) as TreatmentOutcomeRow[];
  const usageRows = (usage ?? []) as SkincareUsageRow[];
  const recentImages = (images ?? []) as SkinImageRow[];
  const similarSkinProfiles = (similarProfiles ?? []) as SimilarSkinProfileRow[];

  let snapshots: SkinTwinSnapshotRow[] = [];
  let recentSimulations: SavedRoutineSimulationRow[] = [];
  if (twinRow) {
    const [{ data, error }, { data: simulationRows, error: simulationError }] = await Promise.all([
      admin
        .from("skin_twin_snapshots")
        .select(
          "id,skin_twin_id,skin_scan_id,hydration_level,elasticity_level,pigmentation_level,acne_level,redness_level,pore_visibility,wrinkle_depth,confidence_score,created_at"
        )
        .eq("skin_twin_id", twinRow.id)
        .order("created_at", { ascending: false })
        .limit(6),
      admin
        .from("routine_simulations")
        .select(
          "id,skin_twin_id,routine_cart_id,simulation_period_days,predicted_improvement,confidence_score,current_metrics,predicted_metrics,metadata,created_at"
        )
        .eq("skin_twin_id", twinRow.id)
        .order("created_at", { ascending: false })
        .limit(9)
    ]);

    throwOnError(error ?? simulationError);
    snapshots = (data ?? []) as SkinTwinSnapshotRow[];
    recentSimulations = (simulationRows ?? []) as SavedRoutineSimulationRow[];
  }

  return {
    twin: twinRow,
    recentScans,
    recentOutcomes,
    usageRows,
    snapshots,
    recentSimulations,
    recentImages,
    similarSkinProfiles
  };
}

export async function syncLatestSkinOutcome(
  admin: AdminClient,
  userId: string,
  args: {
    recentOutcomes: TreatmentOutcomeRow[];
    usageRows: SkincareUsageRow[];
  }
) {
  const latestOutcome = args.recentOutcomes[0] ?? null;
  if (!latestOutcome?.after_scan_id) return;

  const today = new Date().toISOString().slice(0, 10);
  const activeUsage = args.usageRows.find((row) => row.end_date === null || row.end_date >= today) ?? null;

  const { error } = await admin.from("skin_outcomes").upsert(
    {
      user_id: userId,
      routine_cart_id: activeUsage?.routine_cart_id ?? null,
      before_scan_id: latestOutcome.before_scan_id,
      after_scan_id: latestOutcome.after_scan_id,
      improvement_score: latestOutcome.improvement_score,
      metadata: {
        metrics_delta: latestOutcome.metrics_delta,
        source: "treatment_outcomes"
      },
      created_at: latestOutcome.created_at
    },
    { onConflict: "after_scan_id" }
  );

  if (error) throw error;
}

export async function refreshProductEffectivenessForUser(admin: AdminClient, userId: string) {
  const { error } = await admin.rpc("refresh_product_effectiveness_for_user", {
    p_user_id: userId
  });

  if (!error) return true;
  if (error.code === "42883" || /refresh_product_effectiveness_for_user/i.test(error.message)) {
    return false;
  }
  throw error;
}
