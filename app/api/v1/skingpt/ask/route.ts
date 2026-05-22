import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { skinGptAskSchema } from "@/lib/skincare/contracts";
import { mapUserSkinProfile, type RoutineRecommendationRow } from "@/lib/skincare/routine";
import { loadCurrentSkinProfile, loadSkinProfileOptions, loadSkinTwinBundle } from "@/lib/skincare/server";
import { answerSkinGpt, inferConcernSlug } from "@/lib/skingpt/assistant";
import { getRankedDermatologyKnowledge } from "@/lib/skingpt/knowledge";
import { deriveBaselineMetrics, metricsFromScan, metricsFromTwin } from "@/lib/skincare/twin";

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = await request.json().catch(() => ({}));
  const parsed = skinGptAskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalido.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const [{ skinTypes, skinTones, concerns }, profile, twinBundle, routineResult, conditionsResult, linksResult] = await Promise.all([
      loadSkinProfileOptions(admin),
      loadCurrentSkinProfile(admin, userId),
      loadSkinTwinBundle(admin, userId),
      admin.rpc("build_skincare_routine", {
        p_user_id: userId,
        p_limit_per_step: 1
      }),
      admin
        .from("dermatology_conditions")
        .select("id,slug,condition_name,description,symptoms,recommended_ingredients,contraindications")
        .order("condition_name", { ascending: true }),
      admin
        .from("dermatology_condition_ingredients")
        .select("condition_id,recommendation_strength,notes,condition:dermatology_conditions(slug),ingredient:skincare_ingredients(slug,name)")
    ]);

    const combinedError =
      routineResult.error ?? conditionsResult.error ?? linksResult.error ?? null;
    if (combinedError) {
      return NextResponse.json({ error: combinedError.message }, { status: 500 });
    }

    const mappedProfile = mapUserSkinProfile(profile, skinTypes, concerns, skinTones);
    const currentMetrics = twinBundle.twin
      ? metricsFromTwin(twinBundle.twin)
      : twinBundle.recentScans[0]
        ? metricsFromScan(twinBundle.recentScans[0])
        : deriveBaselineMetrics(mappedProfile);

    const latestFaceScore = twinBundle.twin
      ? Math.round(
          currentMetrics.hydration_level * 0.25 +
            (100 - currentMetrics.pore_visibility) * 0.2 +
            (100 - currentMetrics.pigmentation_level) * 0.2 +
            (100 - currentMetrics.acne_level) * 0.15 +
            (100 - currentMetrics.wrinkle_depth) * 0.2
        )
      : null;

    const concernSlug = inferConcernSlug(parsed.data.question, mappedProfile, currentMetrics);
    const knowledgeDocuments = await getRankedDermatologyKnowledge(admin, {
      question: parsed.data.question,
      concernSlug,
      profile: mappedProfile,
      metrics: currentMetrics,
      latestOverallScore: latestFaceScore,
      searchLimit: 8,
      topN: 3
    });

    const answer = await answerSkinGpt({
      question: parsed.data.question,
      profile: mappedProfile,
      metrics: currentMetrics,
      latestOverallScore: latestFaceScore,
      knowledgeDocuments,
      conditions: (conditionsResult.data ?? []).map((item) => ({
        id: item.id as string,
        slug: item.slug as string,
        condition_name: item.condition_name as string,
        description: (item.description as string | null) ?? null,
        symptoms: (item.symptoms as string | null) ?? null,
        recommended_ingredients: (item.recommended_ingredients as string | null) ?? null,
        contraindications: (item.contraindications as string | null) ?? null
      })),
      ingredientLinks: (linksResult.data ?? []).flatMap((item) => {
        const conditionSlug =
          item.condition && typeof item.condition === "object" && "slug" in item.condition
            ? String((item.condition as { slug: unknown }).slug ?? "")
            : "";
        const ingredientName =
          item.ingredient && typeof item.ingredient === "object" && "name" in item.ingredient
            ? String((item.ingredient as { name: unknown }).name ?? "")
            : "";
        const ingredientSlug =
          item.ingredient && typeof item.ingredient === "object" && "slug" in item.ingredient
            ? String((item.ingredient as { slug: unknown }).slug ?? "")
            : "";

        if (!conditionSlug || !ingredientName || !ingredientSlug) return [];

        return [
          {
            condition_id: String(item.condition_id ?? ""),
            condition_slug: conditionSlug,
            ingredient_name: ingredientName,
            ingredient_slug: ingredientSlug,
            recommendation_strength: Number(item.recommendation_strength ?? 0),
            notes: (item.notes as string | null) ?? null
          }
        ];
      }),
      recommendedProducts: ((routineResult.data ?? []) as RoutineRecommendationRow[]).map((item) => ({
        product_name: item.product_name,
        routine_step_name: item.routine_step_name,
        score: item.score
      }))
    });

    return NextResponse.json({
      question: parsed.data.question,
      context: {
        skin_type: mappedProfile?.skin_type?.name ?? null,
        main_concern: mappedProfile?.main_concern?.name ?? null,
        overall_score: latestFaceScore,
        metrics: currentMetrics
      },
      knowledge_documents: knowledgeDocuments.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        topic_slug: item.topic_slug,
        body: item.body,
        source_label: item.source_label,
        source_url: item.source_url
      })),
      answer
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar o SkinBela.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

