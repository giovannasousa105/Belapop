import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { skinGptAskSchema } from "@/lib/skincare/contracts";
import { mapUserSkinProfile, type RoutineRecommendationRow } from "@/lib/skincare/routine";
import { loadCurrentSkinProfile, loadSkinProfileOptions, loadSkinTwinBundle } from "@/lib/skincare/server";
import { answerSkinGpt, inferConcernSlug } from "@/lib/skingpt/assistant";
import { searchDermatologyDocumentsByVector } from "@/lib/skingpt/documentEmbeddings";
import { rankEvidenceDocuments } from "@/lib/skingpt/evidence";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { deriveBaselineMetrics, metricsFromScan, metricsFromTwin } from "@/lib/skincare/twin";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

async function hydrateKnowledgeDocuments(
  admin: AdminClient,
  docs: Array<{
    id: string;
    slug: string;
    title: string;
    topic_slug: string;
    body: string;
    source_label: string | null;
    source_url: string | null;
    similarity?: number | null;
    status?: string | null;
    editorial_boost?: number | null;
    published_at?: string | null;
  }>
) {
  if (docs.length === 0) return [];

  const ids = docs.map((doc) => doc.id);
  const { data, error } = await admin
    .from("dermatology_documents")
    .select("id,metadata,updated_at,status,editorial_boost,published_at")
    .in("id", ids);

  if (error) throw error;
  const byId = new Map(
    (data ?? []).map((item) => [
      String(item.id),
      {
        metadata: (item.metadata as Record<string, unknown> | null) ?? null,
        updated_at: (item.updated_at as string | null) ?? null,
        status: (item.status as string | null) ?? null,
        editorial_boost: (item.editorial_boost as number | null) ?? null,
        published_at: (item.published_at as string | null) ?? null
      }
    ])
  );

  return docs.map((doc) => ({
    ...doc,
    metadata: byId.get(doc.id)?.metadata ?? null,
    updated_at: byId.get(doc.id)?.updated_at ?? null,
    status: byId.get(doc.id)?.status ?? null,
    editorial_boost: byId.get(doc.id)?.editorial_boost ?? null,
    published_at: byId.get(doc.id)?.published_at ?? null
  }));
}

function rankKnowledgeDocuments(
  question: string,
  concernSlug: string,
  docs: Array<{
    id: string;
    slug: string;
    title: string;
    topic_slug: string;
    body: string;
    source_label: string | null;
    source_url: string | null;
    metadata?: Record<string, unknown> | null;
    similarity?: number | null;
    updated_at?: string | null;
    status?: string | null;
    editorial_boost?: number | null;
    published_at?: string | null;
  }>
) {
  return rankEvidenceDocuments(question, concernSlug, docs).slice(0, 3);
}

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
    let knowledgeDocuments: Array<{
      id: string;
      slug: string;
      title: string;
      topic_slug: string;
      body: string;
      source_label: string | null;
      source_url: string | null;
    }> = [];

    try {
      knowledgeDocuments = await searchDermatologyDocumentsByVector(admin, {
        question: parsed.data.question,
        profile: mappedProfile,
        metrics: currentMetrics,
        latestOverallScore: latestFaceScore,
        topicSlug: concernSlug,
        limit: 8
      });
      knowledgeDocuments = rankKnowledgeDocuments(
        parsed.data.question,
        concernSlug,
        await hydrateKnowledgeDocuments(admin, knowledgeDocuments)
      );
    } catch {
      const { data: docsResult, error: docsError } = await admin
        .from("dermatology_documents")
        .select("id,slug,title,topic_slug,body,source_label,source_url,metadata,updated_at,status,editorial_boost,published_at")
        .eq("status", "published")
        .order("topic_slug", { ascending: true });

      if (docsError) {
        return NextResponse.json({ error: docsError.message }, { status: 500 });
      }

      knowledgeDocuments = rankKnowledgeDocuments(
        parsed.data.question,
        concernSlug,
        (docsResult ?? []).map((item) => ({
          id: item.id as string,
          slug: item.slug as string,
          title: item.title as string,
          topic_slug: item.topic_slug as string,
          body: item.body as string,
          source_label: (item.source_label as string | null) ?? null,
          source_url: (item.source_url as string | null) ?? null,
          metadata: (item.metadata as Record<string, unknown> | null) ?? null,
          updated_at: (item.updated_at as string | null) ?? null,
          status: (item.status as string | null) ?? null,
          editorial_boost: (item.editorial_boost as number | null) ?? null,
          published_at: (item.published_at as string | null) ?? null
        }))
      );
    }

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

