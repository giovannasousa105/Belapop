import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { skinScanCreateSchema } from "@/lib/skincare/contracts";
import { upsertSkinImageAsset } from "@/lib/skincare/images";
import { mapUserSkinProfile } from "@/lib/skincare/routine";
import {
  loadCurrentSkinProfile,
  loadSkinProfileOptions,
  loadSkinTwinBundle,
  refreshProductEffectivenessForUser,
  syncLatestSkinOutcome
} from "@/lib/skincare/server";
import { deriveBaselineMetrics, metricsFromScan, metricsFromTwin } from "@/lib/skincare/twin";

function summarizeActiveUsage(usageRows: Awaited<ReturnType<typeof loadSkinTwinBundle>>["usageRows"]) {
  const today = new Date().toISOString().slice(0, 10);
  const active = usageRows.filter((row) => row.end_date === null || row.end_date >= today);
  if (!active.length) return null;

  const startedAt = active.reduce((min, row) => (row.start_date < min ? row.start_date : min), active[0].start_date);
  return {
    started_at: startedAt,
    total_products: active.length,
    routine_cart_id: active[0]?.routine_cart_id ?? null
  };
}

export async function GET() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;

  try {
    const [{ skinTypes, skinTones, concerns, steps }, profile, twinBundle] = await Promise.all([
      loadSkinProfileOptions(admin),
      loadCurrentSkinProfile(admin, userId),
      loadSkinTwinBundle(admin, userId)
    ]);

    await syncLatestSkinOutcome(admin, userId, twinBundle);

    const mappedProfile = mapUserSkinProfile(profile, skinTypes, concerns, skinTones);
    const baselineSource = twinBundle.twin
      ? "twin"
      : twinBundle.recentScans[0]
        ? "scan"
        : mappedProfile
          ? "profile"
          : "default";
    const currentMetrics = twinBundle.twin
      ? metricsFromTwin(twinBundle.twin)
      : twinBundle.recentScans[0]
        ? metricsFromScan(twinBundle.recentScans[0])
        : deriveBaselineMetrics(mappedProfile);

    return NextResponse.json({
      profile: mappedProfile,
      twin: twinBundle.twin,
      recent_scans: twinBundle.recentScans,
      snapshots: twinBundle.snapshots,
      latest_outcome: twinBundle.recentOutcomes[0] ?? null,
      recent_simulations: twinBundle.recentSimulations,
      active_usage: summarizeActiveUsage(twinBundle.usageRows),
      recent_images: twinBundle.recentImages,
      similar_profiles: twinBundle.similarSkinProfiles,
      current_metrics: currentMetrics,
      baseline_source: baselineSource,
      options: {
        skin_types: skinTypes,
        skin_tones: skinTones,
        skin_concerns: concerns,
        routine_steps: steps
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar o skin twin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = await request.json().catch(() => ({}));
  const parsed = skinScanCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalido.",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  try {
    const { data: scanId, error } = await admin.rpc("record_skin_scan", {
      p_user_id: userId,
      p_hydration_score: parsed.data.hydration_score,
      p_acne_score: parsed.data.acne_score,
      p_pigmentation_score: parsed.data.pigmentation_score,
      p_redness_score: parsed.data.redness_score,
      p_elasticity_score: parsed.data.elasticity_score ?? 50,
      p_pore_visibility: parsed.data.pore_visibility ?? 50,
      p_wrinkle_depth: parsed.data.wrinkle_depth ?? 50,
      p_scan_source: parsed.data.scan_source ?? "manual",
      p_image_url: parsed.data.image_url ?? null,
      p_metadata: parsed.data.metadata ?? {}
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (parsed.data.image_url && scanId) {
      await upsertSkinImageAsset(admin, {
        userId,
        skinScanId: String(scanId),
        imageUrl: parsed.data.image_url,
        source: (parsed.data.scan_source ?? "manual") as "manual" | "faceshield" | "imported" | "generated",
        metadata: {
          ...(parsed.data.metadata ?? {}),
          source_route: "me.skin-twin.post"
        }
      });
    }

    const [{ skinTypes, skinTones, concerns }, profile, twinBundle] = await Promise.all([
      loadSkinProfileOptions(admin),
      loadCurrentSkinProfile(admin, userId),
      loadSkinTwinBundle(admin, userId)
    ]);

    await syncLatestSkinOutcome(admin, userId, twinBundle);
    await refreshProductEffectivenessForUser(admin, userId);

    return NextResponse.json({
      ok: true,
      profile: mapUserSkinProfile(profile, skinTypes, concerns, skinTones),
      twin: twinBundle.twin,
      recent_scans: twinBundle.recentScans,
      snapshots: twinBundle.snapshots,
      latest_outcome: twinBundle.recentOutcomes[0] ?? null,
      recent_simulations: twinBundle.recentSimulations,
      recent_images: twinBundle.recentImages,
      similar_profiles: twinBundle.similarSkinProfiles,
      current_metrics: twinBundle.twin
        ? metricsFromTwin(twinBundle.twin)
        : twinBundle.recentScans[0]
          ? metricsFromScan(twinBundle.recentScans[0])
          : null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao registrar scan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
