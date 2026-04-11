import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { skincareRoutineQuerySchema } from "@/lib/skincare/contracts";
import { createRoutineCartFromRecommendations, rerankRoutineRecommendations } from "@/lib/skincare/routineRanking";
import {
  buildRoutineCartResponse,
  buildRoutineSummary,
  groupRoutineRecommendations,
  mapUserSkinProfile,
  type RoutineCartItemRecord,
  type RoutineCartProductRecord,
  type RoutineRecommendationRow,
  type RoutineStepOption,
  type SkinConcernOption,
  type SkinToneOption,
  type SkinTypeOption,
  type UserSkinProfileRow
} from "@/lib/skincare/routine";
import { loadSkinTwinBundle } from "@/lib/skincare/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { deriveBaselineMetrics, metricsFromScan, metricsFromTwin } from "@/lib/skincare/twin";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === "object") {
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : "error" in error && typeof error.error === "string"
          ? error.error
          : null;

    if (message?.trim()) return message;

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // no-op
    }
  }

  return fallback;
}

function createEmptyTwinBundle(): Awaited<ReturnType<typeof loadSkinTwinBundle>> {
  return {
    twin: null,
    recentScans: [],
    recentOutcomes: [],
    usageRows: [],
    snapshots: [],
    recentSimulations: [],
    recentImages: [],
    similarSkinProfiles: []
  };
}

async function loadProfileOptions(admin: AdminClient) {
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
      admin
        .from("routine_steps")
        .select("id,slug,name,step_order")
        .eq("is_active", true)
        .order("step_order", { ascending: true })
    ]);

  const error = skinTypesError ?? skinTonesError ?? concernsError ?? stepsError;
  if (error) throw error;

  return {
    skinTypes: (skinTypes ?? []) as SkinTypeOption[],
    skinTones: (skinTones ?? []) as SkinToneOption[],
    concerns: (concerns ?? []) as SkinConcernOption[],
    steps: (steps ?? []) as RoutineStepOption[]
  };
}

async function loadCurrentProfile(
  admin: AdminClient,
  userId: string
) {
  const { data, error } = await admin
    .from("user_skin_profiles")
    .select(
      "id,user_id,skin_type_id,skin_tone_id,main_concern_id,sensitivity_level,price_affinity_cents,metadata,created_at,updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as UserSkinProfileRow | null;
}

export async function GET(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const parsedQuery = skincareRoutineQuerySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? "1"
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Parametro limit invalido.", details: parsedQuery.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const [{ skinTypes, skinTones, concerns, steps }, profile] = await Promise.all([
      loadProfileOptions(admin),
      loadCurrentProfile(admin, userId)
    ]);

    let twinBundle = createEmptyTwinBundle();
    try {
      twinBundle = await loadSkinTwinBundle(admin, userId);
    } catch (error) {
      console.error("[skincare/routine][GET] twin_bundle_fallback", getErrorMessage(error, "unknown_twin_bundle_error"));
    }

    if (!profile) {
      return NextResponse.json({
        profile_required: true,
        profile: null,
        steps: [],
        summary: {
          steps_count: 0,
          recommended_products_count: 0,
          total_price_cents: 0
        },
        options: {
          skin_types: skinTypes,
          skin_tones: skinTones,
          skin_concerns: concerns,
          routine_steps: steps
        }
      });
    }

    const { data, error } = await admin.rpc("build_skincare_routine", {
      p_user_id: userId,
      p_limit_per_step: parsedQuery.data.limit
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const currentMetrics = twinBundle.twin
      ? metricsFromTwin(twinBundle.twin)
      : twinBundle.recentScans[0]
        ? metricsFromScan(twinBundle.recentScans[0])
        : deriveBaselineMetrics(mapUserSkinProfile(profile, skinTypes, concerns, skinTones));

    let rerankedRows = (data ?? []) as RoutineRecommendationRow[];
    try {
        rerankedRows = await rerankRoutineRecommendations({
          admin,
          userId,
          profile: mapUserSkinProfile(profile, skinTypes, concerns, skinTones),
          metrics: currentMetrics,
          rows: (data ?? []) as RoutineRecommendationRow[]
        });
    } catch (error) {
      console.error("[skincare/routine][GET] rerank_fallback", getErrorMessage(error, "unknown_rerank_error"));
    }

    const groupedSteps = groupRoutineRecommendations(rerankedRows);

      return NextResponse.json({
        profile_required: false,
        profile: mapUserSkinProfile(profile, skinTypes, concerns, skinTones),
        steps: groupedSteps,
        summary: buildRoutineSummary(groupedSteps),
        options: {
          skin_types: skinTypes,
          skin_tones: skinTones,
          skin_concerns: concerns,
          routine_steps: steps
        }
    });
  } catch (error) {
    const message = getErrorMessage(error, "Falha ao montar rotina de skincare.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;

  try {
    const [{ skinTypes, skinTones, concerns, steps }, profile] = await Promise.all([
      loadProfileOptions(admin),
      loadCurrentProfile(admin, userId)
    ]);

    let twinBundle = createEmptyTwinBundle();
    try {
      twinBundle = await loadSkinTwinBundle(admin, userId);
    } catch (error) {
      console.error("[skincare/routine][POST] twin_bundle_fallback", getErrorMessage(error, "unknown_twin_bundle_error"));
    }

    if (!profile) {
      return NextResponse.json({ error: "Perfil de pele obrigatorio para gerar a rotina." }, { status: 409 });
    }

    const mappedProfile = mapUserSkinProfile(profile, skinTypes, concerns, skinTones);
    const currentMetrics = twinBundle.twin
      ? metricsFromTwin(twinBundle.twin)
      : twinBundle.recentScans[0]
        ? metricsFromScan(twinBundle.recentScans[0])
        : deriveBaselineMetrics(mappedProfile);

    const { data: routineRows, error: routineError } = await admin.rpc("build_skincare_routine", {
      p_user_id: userId,
      p_limit_per_step: 3
    });

    if (routineError) {
      return NextResponse.json({ error: routineError.message }, { status: 500 });
    }

    let rerankedRows = (routineRows ?? []) as RoutineRecommendationRow[];
    try {
      rerankedRows = await rerankRoutineRecommendations({
        admin,
        userId,
        profile: mappedProfile,
        metrics: currentMetrics,
        rows: (routineRows ?? []) as RoutineRecommendationRow[]
      });
    } catch (error) {
      console.error("[skincare/routine][POST] rerank_fallback", getErrorMessage(error, "unknown_rerank_error"));
    }

    const cartId = await createRoutineCartFromRecommendations({
      admin,
      userId,
      rows: rerankedRows,
      profileId: profile.id
    });

    const [cartResult, itemsResult] = await Promise.all([
      admin.from("routine_carts").select("id,user_id,created_at").eq("id", cartId).maybeSingle(),
      admin
        .from("routine_cart_items")
        .select("cart_id,product_id,routine_step_id,position")
        .eq("cart_id", cartId)
        .order("position", { ascending: true })
    ]);

    if (cartResult.error) {
      return NextResponse.json({ error: cartResult.error.message }, { status: 500 });
    }
    if (itemsResult.error) {
      return NextResponse.json({ error: itemsResult.error.message }, { status: 500 });
    }

    const productIds = (itemsResult.data ?? []).map((item) => item.product_id);
    const { data: products, error: productsError } = productIds.length
      ? await admin
          .from("products")
          .select("id,name,price_cents,hero_image_url,images,seller_id")
          .in("id", productIds)
      : { data: [], error: null };

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: mapUserSkinProfile(profile, skinTypes, concerns, skinTones),
      cart: buildRoutineCartResponse({
        cartId,
        userId: cartResult.data?.user_id ?? userId,
        createdAt: cartResult.data?.created_at ?? new Date().toISOString(),
        items: (itemsResult.data ?? []) as RoutineCartItemRecord[],
        products: (products ?? []) as RoutineCartProductRecord[],
        steps
      })
    });
  } catch (error) {
    const message = getErrorMessage(error, "Falha ao criar carrinho da rotina.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
