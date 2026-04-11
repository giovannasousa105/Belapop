import { createHash } from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;
const SKIN_SCAN_BUCKET = "skin-scans";

type UpsertSkinImageArgs = {
  userId: string;
  skinScanId?: string | null;
  faceScanId?: string | null;
  imageUrl: string;
  heatmapUrl?: string | null;
  imageKind?: "scan" | "heatmap" | "overlay" | "neutral" | "blink" | "smile" | "frown" | "turn";
  source?: "manual" | "faceshield" | "imported" | "generated";
  metadata?: Record<string, unknown>;
};

type UploadSkinBinaryArgs = {
  userId: string;
  faceScanId?: string | null;
  kind: "neutral" | "blink" | "smile" | "frown" | "turn" | "heatmap";
  contentType: string;
  buffer: ArrayBuffer | Uint8Array | Buffer;
  extension?: string;
  pathToken?: string;
};

export async function upsertSkinImageAsset(admin: AdminClient, args: UpsertSkinImageArgs) {
  if (!args.skinScanId && !args.faceScanId) return;

  const payload = {
    user_id: args.userId,
    skin_scan_id: args.skinScanId ?? null,
    face_scan_id: args.faceScanId ?? null,
    image_url: args.imageUrl,
    heatmap_url: args.heatmapUrl ?? null,
    image_kind: args.imageKind ?? "scan",
    source: args.source ?? "faceshield",
    metadata: args.metadata ?? {}
  };

  const onConflict = args.faceScanId ? "face_scan_id,image_kind" : "skin_scan_id,image_kind";
  const { error } = await admin.from("skin_images").upsert(payload, { onConflict });

  if (error) throw error;
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "asset";
}

function anonymizeStorageUserId(userId: string) {
  const salt = process.env.SKIN_SCAN_STORAGE_SALT?.trim() || "belapop-skin-scan";
  return createHash("sha256").update(`${salt}:${userId}`).digest("hex").slice(0, 24);
}

export async function uploadSkinScanBinary(admin: AdminClient, args: UploadSkinBinaryArgs) {
  const extension =
    args.extension ??
    (args.contentType.includes("png")
      ? "png"
      : args.contentType.includes("webp")
        ? "webp"
        : "jpg");

  const path = [
    anonymizeStorageUserId(args.userId),
    args.pathToken
      ? sanitizeSegment(args.pathToken)
      : args.faceScanId
        ? sanitizeSegment(args.faceScanId)
        : new Date().toISOString().slice(0, 10),
    `${args.kind}.${extension}`
  ].join("/");

  const { error } = await admin.storage.from(SKIN_SCAN_BUCKET).upload(path, args.buffer, {
    contentType: args.contentType,
    upsert: true
  });

  if (error) throw error;

  const { data } = admin.storage.from(SKIN_SCAN_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
