import type { CustomerSkinProfile } from "@/lib/customer/api";
import type { SkinMetricSet } from "@/lib/skincare/twin";
import { searchDermatologyDocumentsByVector } from "@/lib/skingpt/documentEmbeddings";
import { rankEvidenceDocuments, type EvidenceDocument } from "@/lib/skingpt/evidence";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

export type KnowledgeDocument = EvidenceDocument;

function relevantKnowledgePool(
  docs: KnowledgeDocument[],
  concernSlug: string,
  strictTopicMatch = false
) {
  const topical = docs.filter(
    (doc) => doc.topic_slug === concernSlug || doc.topic_slug === "general"
  );

  if (topical.length > 0) return topical;
  return strictTopicMatch ? [] : docs;
}

export async function hydrateKnowledgeDocuments(
  admin: AdminClient,
  docs: KnowledgeDocument[]
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

export async function getRankedDermatologyKnowledge(
  admin: AdminClient,
  args: {
    question: string;
    concernSlug: string;
    profile: CustomerSkinProfile | null;
    metrics: SkinMetricSet;
    latestOverallScore: number | null;
    searchLimit?: number;
    topN?: number;
    strictTopicMatch?: boolean;
  }
) {
  try {
    const hydrated = await hydrateKnowledgeDocuments(
      admin,
      await searchDermatologyDocumentsByVector(admin, {
        question: args.question,
        profile: args.profile,
        metrics: args.metrics,
        latestOverallScore: args.latestOverallScore,
        topicSlug: args.concernSlug,
        limit: args.searchLimit ?? 8
      })
    );
    const ranked = rankEvidenceDocuments(
      args.question,
      args.concernSlug,
      relevantKnowledgePool(hydrated, args.concernSlug, args.strictTopicMatch)
    );

    return ranked.slice(0, args.topN ?? 3);
  } catch {
    const { data, error } = await admin
      .from("dermatology_documents")
      .select(
        "id,slug,title,topic_slug,body,source_label,source_url,metadata,updated_at,status,editorial_boost,published_at"
      )
      .eq("status", "published");

    if (error) throw error;

    return rankEvidenceDocuments(
      args.question,
      args.concernSlug,
      relevantKnowledgePool(
        (data ?? []).map((item) => ({
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
        })),
        args.concernSlug,
        args.strictTopicMatch
      )
    ).slice(0, args.topN ?? 3);
  }
}
