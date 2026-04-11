import type { CustomerSkinProfile } from "@/lib/customer/api";
import type { SkinMetricSet } from "@/lib/skincare/twin";

type UpsertEmbeddingArgs = {
  userId: string;
  faceScanId: string;
  skinScanId: string | null;
  metrics: SkinMetricSet;
  profile: CustomerSkinProfile | null;
  vector?: number[] | null;
  embeddingVersion?: string | null;
  metadata?: Record<string, unknown>;
};

type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").getSupabaseAdminClient>;

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(6))));
}

function flagsForProfile(profile: CustomerSkinProfile | null) {
  const skinType = profile?.skin_type?.slug ?? "";
  const concern = profile?.main_concern?.slug ?? "";
  const skinTone = profile?.skin_tone?.slug ?? "";

  return [
    skinType === "normal" ? 1 : 0,
    skinType === "oily" ? 1 : 0,
    skinType === "dry" ? 1 : 0,
    skinType === "combination" ? 1 : 0,
    skinType === "sensitive" ? 1 : 0,
    skinType === "acne_prone" ? 1 : 0,
    concern === "acne" ? 1 : 0,
    concern === "oiliness" ? 1 : 0,
    concern === "visible_pores" ? 1 : 0,
    concern === "dehydration" ? 1 : 0,
    concern === "dark_spots" ? 1 : 0,
    concern === "aging" ? 1 : 0,
    concern === "rosacea" ? 1 : 0,
    concern === "barrier_damage" ? 1 : 0,
    concern === "uneven_texture" ? 1 : 0,
    concern === "under_eye" ? 1 : 0,
    skinTone === "fair" ? 1 : 0,
    skinTone === "medium" ? 1 : 0,
    skinTone === "tan" ? 1 : 0,
    skinTone === "deep" ? 1 : 0,
    skinTone === "rich" ? 1 : 0
  ];
}

export function buildSkinEmbedding(metrics: SkinMetricSet, profile: CustomerSkinProfile | null) {
  const base = [
    clampUnit(metrics.hydration_level / 100),
    clampUnit(metrics.elasticity_level / 100),
    clampUnit(metrics.pigmentation_level / 100),
    clampUnit(metrics.acne_level / 100),
    clampUnit(metrics.redness_level / 100),
    clampUnit(metrics.pore_visibility / 100),
    clampUnit(metrics.wrinkle_depth / 100),
    clampUnit((100 - metrics.hydration_level) / 100),
    clampUnit((100 - metrics.elasticity_level) / 100),
    clampUnit((metrics.acne_level + metrics.pore_visibility) / 200),
    clampUnit((metrics.pigmentation_level + metrics.redness_level) / 200),
    clampUnit((metrics.wrinkle_depth + (100 - metrics.elasticity_level)) / 200),
    ...flagsForProfile(profile)
  ];

  const vector: number[] = [];
  while (vector.length < 128) {
    const idx = vector.length % base.length;
    const harmonic = ((vector.length % 9) + 1) / 10;
    vector.push(clampUnit(base[idx] * (0.82 + harmonic * 0.18)));
  }
  return vector.slice(0, 128);
}

export function toPgVectorLiteral(values: number[]) {
  return `[${values.map((value) => clampUnit(value)).join(",")}]`;
}

export async function upsertSkinEmbedding(admin: AdminClient, args: UpsertEmbeddingArgs) {
  const vector = args.vector && args.vector.length > 0 ? args.vector : buildSkinEmbedding(args.metrics, args.profile);
  const { error } = await admin.from("skin_embeddings").upsert(
    {
      user_id: args.userId,
      face_scan_id: args.faceScanId,
      skin_scan_id: args.skinScanId,
      embedding: toPgVectorLiteral(vector),
      embedding_version: args.embeddingVersion?.trim() || "heuristic_v1",
      metadata: {
        skin_type: args.profile?.skin_type?.slug ?? null,
        skin_tone: args.profile?.skin_tone?.slug ?? null,
        main_concern: args.profile?.main_concern?.slug ?? null,
        ...(args.metadata ?? {})
      }
    },
    { onConflict: "face_scan_id" }
  );

  if (error) throw error;
}
