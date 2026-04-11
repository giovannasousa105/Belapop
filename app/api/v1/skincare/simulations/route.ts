import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { skinSimulationPersistSchema, skinSimulationQuerySchema } from "@/lib/skincare/contracts";
import { mapUserSkinProfile, resolveProductImage, type RoutineRecommendationRow } from "@/lib/skincare/routine";
import { loadCurrentSkinProfile, loadSkinProfileOptions, loadSkinTwinBundle } from "@/lib/skincare/server";
import { rerankRoutineRecommendations } from "@/lib/skincare/routineRanking";
import {
  buildSimulationScenarios,
  deriveBaselineMetrics,
  metricsFromScan,
  metricsFromTwin,
  type IngredientEffectRow,
  type SimulationScenario
} from "@/lib/skincare/twin";

type SimulationContext = {
  profileRequired: boolean;
  profile: ReturnType<typeof mapUserSkinProfile>;
  twin: Awaited<ReturnType<typeof loadSkinTwinBundle>>["twin"];
  twinBundle: Awaited<ReturnType<typeof loadSkinTwinBundle>>;
  currentMetrics: ReturnType<typeof deriveBaselineMetrics>;
  baselineSource: "twin" | "scan" | "profile" | "default";
  latestOutcome: Awaited<ReturnType<typeof loadSkinTwinBundle>>["recentOutcomes"][number] | null;
  topProducts: Array<{
    product_id: string;
    product_name: string;
    seller_id: string;
    routine_step_name: string;
    routine_step_slug: string;
    price_cents: number;
    hero_image_url: string | null;
    score: number;
    effectiveness: {
      acne_effectiveness: number;
      hydration_effectiveness: number;
      pigmentation_effectiveness: number;
      redness_effectiveness: number;
      confidence_score: number;
    } | null;
  }>;
  scenarios: SimulationScenario[];
};

async function buildSimulationContext(args: {
  admin: ReturnType<typeof import("@/lib/supabase/admin").getSupabaseAdminClient>;
  userId: string;
  days: number[];
}) : Promise<SimulationContext> {
  const { admin, userId, days } = args;
  const [{ skinTypes, skinTones, concerns }, profile, twinBundle] = await Promise.all([
    loadSkinProfileOptions(admin),
    loadCurrentSkinProfile(admin, userId),
    loadSkinTwinBundle(admin, userId)
  ]);

  const mappedProfile = mapUserSkinProfile(profile, skinTypes, concerns, skinTones);
  if (!mappedProfile) {
    return {
      profileRequired: true,
      profile: null,
      twin: twinBundle.twin,
      twinBundle,
      currentMetrics: deriveBaselineMetrics(null),
      baselineSource: "default",
      latestOutcome: twinBundle.recentOutcomes[0] ?? null,
      topProducts: [],
      scenarios: []
    };
  }

  const baselineSource = twinBundle.twin
    ? "twin"
    : twinBundle.recentScans[0]
      ? "scan"
      : "profile";
  const currentMetrics = twinBundle.twin
    ? metricsFromTwin(twinBundle.twin)
    : twinBundle.recentScans[0]
      ? metricsFromScan(twinBundle.recentScans[0])
      : deriveBaselineMetrics(mappedProfile);

  const { data: routineRows, error: routineError } = await admin.rpc("build_skincare_routine", {
    p_user_id: userId,
    p_limit_per_step: 1
  });

  if (routineError) {
    throw routineError;
  }

  const topProducts = await rerankRoutineRecommendations({
    admin,
    userId,
    profile: mappedProfile,
    metrics: currentMetrics,
    rows: (routineRows ?? []) as RoutineRecommendationRow[]
  });
  const productIds = topProducts.map((item) => item.product_id);

  const [{ data: productIngredients, error: ingredientJoinError }, { data: effectivenessRows, error: effectivenessError }] =
    productIds.length
      ? await Promise.all([
          admin
            .from("product_ingredients")
            .select("product_id,ingredient:ingredients(id,name),ingredient_id")
            .in("product_id", productIds),
          admin
            .from("product_effectiveness")
            .select("product_id,acne_effectiveness,hydration_effectiveness,pigmentation_effectiveness,redness_effectiveness,confidence_score")
            .in("product_id", productIds)
        ])
      : [{ data: [], error: null }, { data: [], error: null }];

  if (ingredientJoinError ?? effectivenessError) {
    throw ingredientJoinError ?? effectivenessError;
  }

  const ingredientIds = Array.from(
    new Set((productIngredients ?? []).map((item) => item.ingredient_id).filter((value): value is string => Boolean(value)))
  );

  const { data: effectRows, error: effectsError } = ingredientIds.length
    ? await admin
        .from("ingredient_effects")
        .select("ingredient_id,target_metric,improvement_rate,confidence_score,ingredient:ingredients(name)")
        .in("ingredient_id", ingredientIds)
    : { data: [], error: null };

  if (effectsError) {
    throw effectsError;
  }

  const effects: IngredientEffectRow[] = (effectRows ?? []).map((row) => ({
    ingredient_id: row.ingredient_id as string,
    ingredient_name:
      row.ingredient && typeof row.ingredient === "object" && "name" in row.ingredient
        ? String((row.ingredient as { name: unknown }).name ?? "")
        : "",
    target_metric: row.target_metric as IngredientEffectRow["target_metric"],
    improvement_rate: Number(row.improvement_rate ?? 0),
    confidence_score: Number(row.confidence_score ?? 0)
  }));

  const scenarios = buildSimulationScenarios(currentMetrics, effects, days);
  const effectivenessMap = new Map(
    (effectivenessRows ?? []).map((item) => [item.product_id as string, item])
  );

  return {
    profileRequired: false,
    profile: mappedProfile,
    twin: twinBundle.twin,
    twinBundle,
    currentMetrics,
    baselineSource,
    latestOutcome: twinBundle.recentOutcomes[0] ?? null,
    topProducts: topProducts.map((item) => {
      const effectiveness = effectivenessMap.get(item.product_id);
      return {
        product_id: item.product_id,
        product_name: item.product_name,
        seller_id: item.seller_id,
        routine_step_name: item.routine_step_name,
        routine_step_slug: item.routine_step_slug,
        price_cents: item.price_cents,
        hero_image_url: resolveProductImage(item.hero_image_url, []),
        score: item.score,
        effectiveness: effectiveness
          ? {
              acne_effectiveness: Number(effectiveness.acne_effectiveness ?? 0),
              hydration_effectiveness: Number(effectiveness.hydration_effectiveness ?? 0),
              pigmentation_effectiveness: Number(effectiveness.pigmentation_effectiveness ?? 0),
              redness_effectiveness: Number(effectiveness.redness_effectiveness ?? 0),
              confidence_score: Number(effectiveness.confidence_score ?? 0)
            }
          : null
      };
    }),
    scenarios
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const parsedQuery = skinSimulationQuerySchema.safeParse({
    days: request.nextUrl.searchParams.get("days") ?? undefined
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Parametros invalidos.", details: parsedQuery.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const context = await buildSimulationContext({
      admin,
      userId,
      days: parsedQuery.data.days
    });

    return NextResponse.json({
      profile_required: context.profileRequired,
      profile: context.profile,
      twin: context.twin,
      current_metrics: context.currentMetrics,
      baseline_source: context.baselineSource,
      latest_outcome: context.latestOutcome,
      top_products: context.topProducts,
      scenarios: context.scenarios
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao gerar simulacoes da rotina.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = await request.json().catch(() => ({}));
  const parsedBody = skinSimulationPersistSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Payload invalido.", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const context = await buildSimulationContext({
      admin,
      userId,
      days: parsedBody.data.days
    });

    if (context.profileRequired || !context.twin) {
      return NextResponse.json(
        {
          error: "Perfil e skin twin sao obrigatorios para salvar simulacoes.",
          profile_required: true
        },
        { status: 400 }
      );
    }

    const routineCartId =
      parsedBody.data.routine_cart_id ??
      context.twinBundle.usageRows.find((row) => row.routine_cart_id)?.routine_cart_id ??
      null;
    const batchId = randomUUID();

    const { data: insertedRows, error: insertError } = await admin
      .from("routine_simulations")
      .insert(
        context.scenarios.map((scenario) => ({
          skin_twin_id: context.twin?.id,
          routine_cart_id: routineCartId,
          simulation_period_days: scenario.days,
          predicted_improvement: scenario.predicted_improvement,
          confidence_score: scenario.confidence_score,
          current_metrics: context.currentMetrics,
          predicted_metrics: scenario.predicted_metrics,
          metadata: {
            batch_id: batchId,
            saved_by: "explicit_action",
            baseline_source: context.baselineSource,
            key_effects: scenario.key_effects,
            top_product_ids: context.topProducts.map((product) => product.product_id)
          }
        }))
      )
      .select(
        "id,skin_twin_id,routine_cart_id,simulation_period_days,predicted_improvement,confidence_score,current_metrics,predicted_metrics,metadata,created_at"
      )
      .order("simulation_period_days", { ascending: true });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      batch_id: batchId,
      profile_required: false,
      profile: context.profile,
      twin: context.twin,
      current_metrics: context.currentMetrics,
      baseline_source: context.baselineSource,
      latest_outcome: context.latestOutcome,
      top_products: context.topProducts,
      scenarios: context.scenarios,
      saved_simulations: insertedRows ?? []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar simulacoes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
