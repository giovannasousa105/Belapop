import type { CustomerSkinProfile } from "@/lib/customer/api";
import type { SkinMetricSet } from "@/lib/skincare/twin";
import { toPgVectorLiteral } from "@/lib/skingpt/embedding";

type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").getSupabaseAdminClient>;

const VECTOR_SIZE = 128;
const DOCUMENT_EMBEDDING_VERSION = "semantic_v1";

type DermatologyDocumentRecord = {
  id: string;
  slug: string;
  title: string;
  topic_slug: string;
  body: string;
  source_label: string | null;
  metadata: Record<string, unknown> | null;
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function hashToken(token: string) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function normalizeVector(values: number[]) {
  const norm = Math.sqrt(values.reduce((total, value) => total + value * value, 0)) || 1;
  return values.map((value) => Number((value / norm).toFixed(6)));
}

function appendMetricFeatures(vector: number[], metrics: SkinMetricSet, overallScore: number | null) {
  const features = [
    metrics.hydration_level / 100,
    metrics.elasticity_level / 100,
    metrics.pigmentation_level / 100,
    metrics.acne_level / 100,
    metrics.redness_level / 100,
    metrics.pore_visibility / 100,
    metrics.wrinkle_depth / 100,
    overallScore !== null ? overallScore / 100 : 0
  ];

  for (let index = 0; index < features.length; index += 1) {
    vector[index] += features[index];
  }
}

function createSemanticVector(text: string, extraTokens: string[] = []) {
  const vector = new Array<number>(VECTOR_SIZE).fill(0);
  const tokens = [...tokenize(text), ...extraTokens.map((item) => item.toLowerCase())];

  for (const token of tokens) {
    const hash = hashToken(token);
    const index = hash % VECTOR_SIZE;
    const weight = 1 + ((hash % 11) / 20);
    vector[index] += weight;
    vector[(index + 17) % VECTOR_SIZE] += weight * 0.35;
  }

  return normalizeVector(vector);
}

function tagsFromMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata || !Array.isArray(metadata.tags)) return [];
  return metadata.tags.filter((item): item is string => typeof item === "string");
}

function sourceTokensFromMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata) return [];

  const candidates = [
    metadata.source_family,
    metadata.study_type,
    metadata.evidence_level,
    metadata.published_year
  ];

  return candidates
    .flatMap((item) => {
      if (typeof item === "string" && item.trim()) return [item.trim()];
      if (typeof item === "number" && Number.isFinite(item)) return [String(item)];
      return [];
    })
    .map((item) => item.toLowerCase());
}

export function buildDermatologyDocumentEmbedding(document: DermatologyDocumentRecord) {
  const tags = tagsFromMetadata(document.metadata);
  const sourceTokens = sourceTokensFromMetadata(document.metadata);
  return createSemanticVector(
    `${document.title} ${document.topic_slug} ${document.body} ${document.source_label ?? ""}`,
    [...tags, ...sourceTokens]
  );
}

export function buildSkinQueryEmbedding(args: {
  question: string;
  profile: CustomerSkinProfile | null;
  metrics: SkinMetricSet;
  latestOverallScore: number | null;
}) {
  const profileTokens = [
    args.profile?.skin_type?.slug ?? "",
    args.profile?.skin_tone?.slug ?? "",
    args.profile?.main_concern?.slug ?? "",
    `sensitivity_${args.profile?.sensitivity_level ?? 0}`
  ].filter(Boolean);
  const vector = createSemanticVector(args.question, profileTokens);
  appendMetricFeatures(vector, args.metrics, args.latestOverallScore);
  return normalizeVector(vector);
}

export async function ensureDermatologyDocumentEmbeddings(admin: AdminClient) {
  const { data, error } = await admin
    .from("dermatology_documents")
    .select("id,slug,title,topic_slug,body,source_label,metadata,embedding_version")
    .or(`embedding.is.null,embedding_version.neq.${DOCUMENT_EMBEDDING_VERSION}`);

  if (error) throw error;
  const docs = (data ?? []) as Array<DermatologyDocumentRecord & { embedding_version?: string | null }>;
  if (docs.length === 0) return;

  const payload = docs.map((doc) => ({
    id: doc.id,
    embedding: toPgVectorLiteral(buildDermatologyDocumentEmbedding(doc)),
    embedding_version: DOCUMENT_EMBEDDING_VERSION
  }));

  const { error: updateError } = await admin.from("dermatology_documents").upsert(payload, { onConflict: "id" });
  if (updateError) throw updateError;
}

export async function searchDermatologyDocumentsByVector(
  admin: AdminClient,
  args: {
    question: string;
    profile: CustomerSkinProfile | null;
    metrics: SkinMetricSet;
    latestOverallScore: number | null;
    topicSlug?: string | null;
    limit?: number;
  }
) {
  await ensureDermatologyDocumentEmbeddings(admin);
  const vector = buildSkinQueryEmbedding(args);
  const { data, error } = await admin.rpc("search_dermatology_documents", {
    p_query_embedding: toPgVectorLiteral(vector),
    p_limit: args.limit ?? 4,
    p_topic_slug: args.topicSlug ?? null
  });

  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    topic_slug: string;
    body: string;
    source_label: string | null;
    source_url: string | null;
    similarity: number;
    editorial_boost?: number | null;
    published_at?: string | null;
  }>;
}
