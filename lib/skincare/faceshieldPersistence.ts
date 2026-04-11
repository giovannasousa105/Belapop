import { buildDeterministicKey, emitPlatformEvent, queueNotificationChannels } from "@/lib/events/platformEventBus";
import type { CustomerSkinProfile } from "@/lib/customer/api";
import {
  buildHeatmapRegions,
  computeFaceLiveness,
  deriveSkinHealthScore,
  deriveSkinProgress,
  type FaceHeatmapRegion,
  type FaceLivenessResult
} from "@/lib/skincare/faceshield";
import { upsertSkinImageAsset } from "@/lib/skincare/images";
import type { FaceScanFindingRow, SkinScanRow } from "@/lib/skincare/twin";
import { metricsFromScan } from "@/lib/skincare/twin";
import { upsertSkinEmbedding } from "@/lib/skingpt/embedding";

type AdminClient = ReturnType<typeof import("@/lib/supabase/admin").getSupabaseAdminClient>;

type FaceFrameKind = "neutral" | "blink" | "smile" | "frown" | "turn";

type FaceImageKind = "scan" | "heatmap" | "overlay" | FaceFrameKind;
const SKIN_SCAN_BUCKET = "skin-scans";

export type FaceScanRow = {
  id: string;
  user_id: string;
  skin_scan_id: string | null;
  image_url: string | null;
  liveness_score: number;
  scan_status: "pending" | "validated" | "rejected";
  capture_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FaceLivenessRow = {
  id: string;
  scan_id: string;
  blink_detected: boolean;
  head_movement: boolean;
  smile_detected?: boolean;
  frown_detected?: boolean;
  depth_score: number;
  texture_score: number;
  confidence: number;
  created_at?: string;
  updated_at?: string;
};

export type FaceScoreRow = {
  scan_id: string;
  overall_score: number;
  skin_type: string | null;
  main_concern: string | null;
  created_at?: string;
  updated_at?: string;
};

export type FaceProgressRow = {
  id: string;
  user_id: string;
  scan_id: string;
  previous_scan_id: string | null;
  improvement_score: number;
  created_at: string;
};

export type FaceHeatmapRow = {
  id: string;
  scan_id: string;
  condition_type: "acne" | "hydration" | "pigmentation" | "pores" | "wrinkles" | "redness";
  region_slug: string;
  intensity: number;
  position_x: number;
  position_y: number;
  radius: number;
  created_at?: string;
};

type FaceImageAssetRow = {
  face_scan_id: string | null;
  image_url: string;
  heatmap_url: string | null;
  image_kind: FaceImageKind;
  metadata?: Record<string, unknown>;
};

type FaceFindingInput = {
  finding_type: FaceScanFindingRow["finding_type"];
  region_slug: string;
  confidence_score: number;
  severity_score: number;
  position_x: number;
  position_y: number;
  radius: number;
  requires_clinical_review?: boolean;
  metadata?: Record<string, unknown>;
};

export type FaceScanPayload = FaceScanRow & {
  heatmap_url: string | null;
  liveness: FaceLivenessRow | null;
  score: FaceScoreRow | null;
  progress: FaceProgressRow | null;
  heatmap_regions: FaceHeatmapRow[];
  findings: FaceScanFindingRow[];
  frame_assets?: Record<string, string>;
};

type PersistBelaCodeScanArgs = {
  admin: AdminClient;
  userId: string;
  profile: CustomerSkinProfile | null;
  scan: {
    hydration_score: number;
    acne_score: number;
    pigmentation_score: number;
    redness_score: number;
    elasticity_score?: number;
    pore_visibility?: number;
    wrinkle_depth?: number;
    scan_source?: "manual" | "ai_scan" | "imported";
    image_url?: string | null;
    heatmap_url?: string | null;
    metadata?: Record<string, unknown>;
    capture_metadata?: Record<string, unknown>;
    liveness?: Partial<FaceLivenessResult> & {
      texture_score?: number;
      depth_score?: number;
      blink_detected?: boolean;
      head_movement?: boolean;
      smile_detected?: boolean;
      frown_detected?: boolean;
    };
    heatmap_regions?: FaceHeatmapRegion[];
    embedding_vector?: number[] | null;
    embedding_version?: string | null;
    embedding_metadata?: Record<string, unknown>;
    captured_frames?: Array<{
      kind: FaceFrameKind;
      image_url: string;
      metadata?: Record<string, unknown>;
    }>;
    findings?: FaceFindingInput[];
    requires_clinical_review?: boolean;
  };
};

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function clampHundred(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

function isFrameKind(value: string): value is FaceFrameKind {
  return value === "neutral" || value === "blink" || value === "smile" || value === "frown" || value === "turn";
}

function parseStoragePath(url: string | null | undefined, bucket = SKIN_SCAN_BUCKET) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

function deriveSkinTwinConfidence(scanCount: number) {
  if (scanCount <= 0) return 0.25;
  return Number(Math.min(1, 0.45 + Math.max(scanCount - 1, 0) * 0.08).toFixed(4));
}

function findingDistance(left: FaceFindingInput, right: FaceScanFindingRow) {
  const deltaX = left.position_x - right.position_x;
  const deltaY = left.position_y - right.position_y;
  const radial = left.radius - right.radius;
  const severity = (left.severity_score - right.severity_score) / 100;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY + radial * radial + severity * severity);
}

function resolveAppearanceStatus(
  finding: FaceFindingInput,
  previousFindings: FaceScanFindingRow[]
): FaceScanFindingRow["appearance_status"] {
  const comparable = previousFindings.filter(
    (item) => item.finding_type === finding.finding_type && item.region_slug === finding.region_slug
  );

  if (!comparable.length) return "new";

  const best = [...comparable].sort((left, right) => findingDistance(finding, left) - findingDistance(finding, right))[0];
  const distance = findingDistance(finding, best);
  const severityDelta = Math.abs(finding.severity_score - best.severity_score);

  if (distance <= 0.09 && severityDelta <= 12) return "stable";
  return "changed";
}

async function persistFrameAssets(args: {
  admin: AdminClient;
  userId: string;
  faceScanId: string;
  skinScanId?: string | null;
  scanImageUrl?: string | null;
  heatmapUrl?: string | null;
  frames?: PersistBelaCodeScanArgs["scan"]["captured_frames"];
  metadata: Record<string, unknown>;
}) {
  const tasks: Array<Promise<unknown>> = [];

  for (const frame of args.frames ?? []) {
    tasks.push(
      upsertSkinImageAsset(args.admin, {
        userId: args.userId,
        faceScanId: args.faceScanId,
        skinScanId: args.skinScanId ?? null,
        imageUrl: frame.image_url,
        imageKind: frame.kind,
        source: "faceshield",
        metadata: {
          ...args.metadata,
          frame_kind: frame.kind,
          ...(frame.metadata ?? {})
        }
      })
    );
  }

  if (args.heatmapUrl) {
    tasks.push(
      upsertSkinImageAsset(args.admin, {
        userId: args.userId,
        faceScanId: args.faceScanId,
        skinScanId: args.skinScanId ?? null,
        imageUrl: args.heatmapUrl,
        heatmapUrl: args.heatmapUrl,
        imageKind: "heatmap",
        source: "generated",
        metadata: {
          ...args.metadata,
          asset_kind: "heatmap"
        }
      })
    );
  }

  if ((!args.frames || args.frames.length === 0) && args.scanImageUrl) {
    tasks.push(
      upsertSkinImageAsset(args.admin, {
        userId: args.userId,
        faceScanId: args.faceScanId,
        skinScanId: args.skinScanId ?? null,
        imageUrl: args.scanImageUrl,
        heatmapUrl: args.heatmapUrl ?? null,
        imageKind: "scan",
        source: "faceshield",
        metadata: {
          ...args.metadata,
          asset_kind: "scan"
        }
      })
    );
  }

  await Promise.all(tasks);
}

async function persistFindings(args: {
  admin: AdminClient;
  faceScanId: string;
  findings: FaceFindingInput[];
  previousScanId?: string | null;
  captureMetadata: Record<string, unknown>;
}) {
  if (!args.findings.length) return [] as FaceScanFindingRow[];

  const previousFindings = args.previousScanId
    ? ((
        (
          await args.admin
            .from("face_scan_findings")
            .select(
              "id,scan_id,finding_type,region_slug,confidence_score,severity_score,position_x,position_y,radius,appearance_status,requires_clinical_review,metadata,created_at,updated_at"
            )
            .eq("scan_id", args.previousScanId)
        ).data ?? []
      ) as FaceScanFindingRow[])
    : [];

  const payload = args.findings.map((finding) => ({
    scan_id: args.faceScanId,
    finding_type: finding.finding_type,
    region_slug: finding.region_slug,
    confidence_score: clampUnit(finding.confidence_score),
    severity_score: clampHundred(finding.severity_score),
    position_x: clampUnit(finding.position_x),
    position_y: clampUnit(finding.position_y),
    radius: clampUnit(finding.radius),
    appearance_status: resolveAppearanceStatus(finding, previousFindings),
    requires_clinical_review: Boolean(finding.requires_clinical_review),
    metadata: {
      ...(finding.metadata ?? {}),
      capture_mode: args.captureMetadata.capture_mode ?? null,
      triage_only: true,
      not_a_diagnosis: true
    }
  }));

  const { data, error } = await args.admin
    .from("face_scan_findings")
    .insert(payload)
    .select(
      "id,scan_id,finding_type,region_slug,confidence_score,severity_score,position_x,position_y,radius,appearance_status,requires_clinical_review,metadata,created_at,updated_at"
    );

  if (error) throw error;
  return (data ?? []) as FaceScanFindingRow[];
}

async function queueClinicalReviewAlert(args: {
  userId: string;
  faceScanId: string;
  findings: FaceScanFindingRow[];
}) {
  const flagged = args.findings.filter(
    (item) => item.requires_clinical_review && item.appearance_status !== "stable"
  );
  if (!flagged.length) return;

  const findingTypes = Array.from(new Set(flagged.map((item) => item.finding_type.replaceAll("_", " "))));
  const eventId = await emitPlatformEvent({
    eventName: "faceshield.clinical_review_flagged",
    aggregateType: "profile",
    aggregateId: args.faceScanId,
    customerUserId: args.userId,
    idempotencyKey: buildDeterministicKey(["faceshield-clinical-review", args.faceScanId]),
    payload: {
      face_scan_id: args.faceScanId,
      findings_count: flagged.length,
      finding_types: findingTypes,
      requires_clinical_review: true,
      triage_only: true,
      not_a_diagnosis: true
    }
  });

  await queueNotificationChannels({
    eventId,
    recipientUserId: args.userId,
    channels: ["email", "in_app"],
    templateKey: "faceshield.clinical_review_flagged",
    title: "BelaCode encontrou um sinal novo que merece avaliacao dermatologica",
    body: `Vimos uma mudanca nova ou suspeita (${findingTypes.join(", ")}) no seu ultimo scan. Isso e uma triagem visual, nao um diagnostico. Recomendamos avaliar com um dermatologista.`,
    ctaLabel: "Ver scan",
    ctaHref: "/conta/skincare",
    metadata: {
      face_scan_id: args.faceScanId,
      findings_count: flagged.length,
      finding_types: findingTypes,
      triage_only: true,
      not_a_diagnosis: true
    },
    dedupeSeed: buildDeterministicKey(["faceshield-clinical-review", args.faceScanId])
  });
}

export async function loadRecentFaceScans(admin: AdminClient, userId: string) {
  const { data, error } = await admin
    .from("face_scans")
    .select("id,user_id,skin_scan_id,image_url,liveness_score,scan_status,capture_metadata,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;
  return (data ?? []) as FaceScanRow[];
}

export async function loadFaceScanDetails(admin: AdminClient, userId: string, scans: Array<{ id: string }>) {
  const scanIds = scans.map((scan) => scan.id);
  if (scanIds.length === 0) {
    return {
      images: [] as FaceImageAssetRow[],
      liveness: [] as FaceLivenessRow[],
      scores: [] as FaceScoreRow[],
      progress: [] as FaceProgressRow[],
      heatmap: [] as FaceHeatmapRow[],
      findings: [] as FaceScanFindingRow[]
    };
  }

  const [imageResult, livenessResult, scoreResult, progressResult, heatmapResult, findingsResult] = await Promise.all([
    admin
      .from("skin_images")
      .select("face_scan_id,image_url,heatmap_url,image_kind,metadata")
      .in("face_scan_id", scanIds),
    admin
      .from("liveness_results")
      .select("id,scan_id,blink_detected,head_movement,smile_detected,frown_detected,depth_score,texture_score,confidence,created_at,updated_at")
      .in("scan_id", scanIds),
    admin
      .from("skin_scores")
      .select("scan_id,overall_score,skin_type,main_concern,created_at,updated_at")
      .in("scan_id", scanIds),
    admin
      .from("skin_progress")
      .select("id,user_id,scan_id,previous_scan_id,improvement_score,created_at")
      .eq("user_id", userId)
      .in("scan_id", scanIds),
    admin
      .from("skin_heatmap_regions")
      .select("id,scan_id,condition_type,region_slug,intensity,position_x,position_y,radius,created_at")
      .in("scan_id", scanIds),
    admin
      .from("face_scan_findings")
      .select("id,scan_id,finding_type,region_slug,confidence_score,severity_score,position_x,position_y,radius,appearance_status,requires_clinical_review,metadata,created_at,updated_at")
      .in("scan_id", scanIds)
  ]);

  const error =
    imageResult.error ?? livenessResult.error ?? scoreResult.error ?? progressResult.error ?? heatmapResult.error ?? findingsResult.error;
  if (error) throw error;

  return {
    images: (imageResult.data ?? []) as FaceImageAssetRow[],
    liveness: (livenessResult.data ?? []) as FaceLivenessRow[],
    scores: (scoreResult.data ?? []) as FaceScoreRow[],
    progress: (progressResult.data ?? []) as FaceProgressRow[],
    heatmap: (heatmapResult.data ?? []) as FaceHeatmapRow[],
    findings: (findingsResult.data ?? []) as FaceScanFindingRow[]
  };
}

export function composeFaceScanPayload(
  scans: FaceScanRow[],
  details: Awaited<ReturnType<typeof loadFaceScanDetails>>
): FaceScanPayload[] {
  return scans.map((scan) => {
    const imageAssets = details.images.filter((item) => item.face_scan_id === scan.id);
    const heatmapAsset = imageAssets.find((item) => item.image_kind === "heatmap");
    const frameAssets = Object.fromEntries(
      imageAssets
        .filter((item) => isFrameKind(item.image_kind))
        .map((item) => [item.image_kind, item.image_url])
    );

    return {
      ...scan,
      heatmap_url: heatmapAsset?.image_url ?? heatmapAsset?.heatmap_url ?? imageAssets.find((item) => item.heatmap_url)?.heatmap_url ?? null,
      liveness: details.liveness.find((item) => item.scan_id === scan.id) ?? null,
      score: details.scores.find((item) => item.scan_id === scan.id) ?? null,
      progress: details.progress.find((item) => item.scan_id === scan.id) ?? null,
      heatmap_regions: details.heatmap.filter((item) => item.scan_id === scan.id),
      findings: details.findings.filter((item) => item.scan_id === scan.id),
      frame_assets: Object.keys(frameAssets).length > 0 ? frameAssets : undefined
    };
  });
}

async function syncSkinTwinAfterFaceScanDeletion(admin: AdminClient, userId: string) {
  const [{ data: latestRemainingScan, error: latestRemainingScanError }, { count, error: countError }] = await Promise.all([
    admin
      .from("skin_scans")
      .select(
        "id,hydration_score,elasticity_score,pigmentation_score,acne_score,redness_score,pore_visibility,wrinkle_depth"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("skin_scans").select("id", { count: "exact", head: true }).eq("user_id", userId)
  ]);

  if (latestRemainingScanError) throw latestRemainingScanError;
  if (countError) throw countError;

  if (!latestRemainingScan) {
    const { error } = await admin
      .from("skin_twins")
      .update({
        latest_scan_id: null,
        hydration_level: 50,
        elasticity_level: 50,
        pigmentation_level: 50,
        acne_level: 50,
        redness_level: 50,
        pore_visibility: 50,
        wrinkle_depth: 50,
        confidence_score: 0.25
      })
      .eq("user_id", userId);

    if (error) throw error;
    return;
  }

  const { error } = await admin
    .from("skin_twins")
    .update({
      latest_scan_id: latestRemainingScan.id,
      hydration_level: latestRemainingScan.hydration_score,
      elasticity_level: latestRemainingScan.elasticity_score,
      pigmentation_level: latestRemainingScan.pigmentation_score,
      acne_level: latestRemainingScan.acne_score,
      redness_level: latestRemainingScan.redness_score,
      pore_visibility: latestRemainingScan.pore_visibility,
      wrinkle_depth: latestRemainingScan.wrinkle_depth,
      confidence_score: deriveSkinTwinConfidence(count ?? 0)
    })
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteBelaCodeScan(admin: AdminClient, userId: string, faceScanId: string) {
  const { data: faceScan, error: faceScanError } = await admin
    .from("face_scans")
    .select("id,user_id,skin_scan_id,image_url")
    .eq("id", faceScanId)
    .eq("user_id", userId)
    .maybeSingle();

  if (faceScanError) throw faceScanError;
  if (!faceScan) return null;

  const skinScanId = faceScan.skin_scan_id ?? null;

  const [{ data: imageAssets, error: imageAssetsError }, { data: skinScan, error: skinScanError }] = await Promise.all([
    admin
      .from("skin_images")
      .select("image_url,heatmap_url")
      .eq("user_id", userId)
      .or(skinScanId ? `face_scan_id.eq.${faceScanId},skin_scan_id.eq.${skinScanId}` : `face_scan_id.eq.${faceScanId}`),
    skinScanId
      ? admin.from("skin_scans").select("id,image_url").eq("id", skinScanId).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null, error: null })
  ]);

  if (imageAssetsError) throw imageAssetsError;
  if (skinScanError) throw skinScanError;

  const storagePaths = new Set<string>();
  const collectStoragePath = (url: string | null | undefined) => {
    const path = parseStoragePath(url);
    if (path) storagePaths.add(path);
  };

  collectStoragePath(faceScan.image_url);
  collectStoragePath(skinScan?.image_url ?? null);
  for (const asset of imageAssets ?? []) {
    collectStoragePath(asset.image_url);
    collectStoragePath(asset.heatmap_url);
  }

  const runDelete = async (operation: PromiseLike<{ error: { message: string } | null }>) => {
    const result = await operation;
    if (result.error) throw new Error(result.error.message);
  };

  await runDelete(admin.from("face_scan_findings").delete().eq("scan_id", faceScanId));
  await runDelete(admin.from("skin_progress").delete().eq("scan_id", faceScanId));
  await runDelete(admin.from("skin_images").delete().eq("face_scan_id", faceScanId));
  await runDelete(admin.from("skin_embeddings").delete().eq("face_scan_id", faceScanId));

  if (skinScanId) {
    await runDelete(
      admin.from("skin_outcomes").delete().eq("user_id", userId).or(`before_scan_id.eq.${skinScanId},after_scan_id.eq.${skinScanId}`)
    );
    await runDelete(
      admin
        .from("treatment_outcomes")
        .delete()
        .eq("user_id", userId)
        .or(`before_scan_id.eq.${skinScanId},after_scan_id.eq.${skinScanId}`)
    );
    await runDelete(admin.from("skin_twin_snapshots").delete().eq("skin_scan_id", skinScanId));
    await runDelete(admin.from("skin_images").delete().eq("skin_scan_id", skinScanId));
    await runDelete(admin.from("skin_embeddings").delete().eq("skin_scan_id", skinScanId));
    await runDelete(admin.from("skin_scans").delete().eq("id", skinScanId).eq("user_id", userId));
  }

  await runDelete(admin.from("face_scans").delete().eq("id", faceScanId).eq("user_id", userId));

  await syncSkinTwinAfterFaceScanDeletion(admin, userId);

  if (storagePaths.size > 0) {
    await admin.storage.from(SKIN_SCAN_BUCKET).remove(Array.from(storagePaths)).catch(() => undefined);
  }

  return {
    faceScanId,
    skinScanId
  };
}

function resolveLiveness(args: PersistBelaCodeScanArgs["scan"]) {
  if (args.liveness?.confidence !== undefined && args.liveness?.scan_status) {
    return {
      blink_detected: Boolean(args.liveness.blink_detected),
      head_movement: Boolean(args.liveness.head_movement),
      smile_detected: Boolean(args.liveness.smile_detected),
      frown_detected: Boolean(args.liveness.frown_detected),
      depth_score: Number(args.liveness.depth_score ?? 0),
      texture_score: Number(args.liveness.texture_score ?? 0),
      confidence: Number(args.liveness.confidence),
      liveness_score: Number(args.liveness.liveness_score ?? args.liveness.confidence),
      scan_status: args.liveness.scan_status
    } as FaceLivenessResult & { smile_detected: boolean; frown_detected: boolean };
  }

  const base = computeFaceLiveness({
    brightness_score: Number(args.capture_metadata?.brightness_score ?? 0),
    texture_score: Number(args.liveness?.texture_score ?? 0),
    depth_score: Number(args.liveness?.depth_score ?? 0),
    blink_detected: Boolean(args.liveness?.blink_detected),
    head_movement: Boolean(args.liveness?.head_movement)
  });

  return {
    ...base,
    smile_detected: Boolean(args.liveness?.smile_detected),
    frown_detected: Boolean(args.liveness?.frown_detected)
  };
}

export async function persistBelaCodeScan(args: PersistBelaCodeScanArgs) {
  const liveness = resolveLiveness(args.scan);
  const captureMetadata = {
    ...(args.scan.capture_metadata ?? {}),
    quality_gate: liveness.scan_status,
    source: args.scan.scan_source ?? "ai_scan",
    requires_clinical_review: Boolean(args.scan.requires_clinical_review)
  };

  const { data: faceScan, error: faceScanError } = await args.admin
    .from("face_scans")
    .insert({
      user_id: args.userId,
      image_url: args.scan.image_url ?? null,
      liveness_score: liveness.liveness_score,
      scan_status: liveness.scan_status,
      capture_metadata: captureMetadata
    })
    .select("id,user_id,skin_scan_id,image_url,liveness_score,scan_status,capture_metadata,created_at,updated_at")
    .single();

  if (faceScanError) throw faceScanError;

  await persistFrameAssets({
    admin: args.admin,
    userId: args.userId,
    faceScanId: faceScan.id,
    scanImageUrl: args.scan.image_url ?? null,
    heatmapUrl: args.scan.heatmap_url ?? null,
    frames: args.scan.captured_frames,
    metadata: {
      ...captureMetadata,
      source_route: "faceshield.persistence",
      scan_status: faceScan.scan_status
    }
  });

  const { error: livenessInsertError } = await args.admin.from("liveness_results").upsert({
    scan_id: faceScan.id,
    blink_detected: liveness.blink_detected,
    head_movement: liveness.head_movement,
    smile_detected: Boolean((liveness as { smile_detected?: boolean }).smile_detected),
    frown_detected: Boolean((liveness as { frown_detected?: boolean }).frown_detected),
    depth_score: liveness.depth_score,
    texture_score: liveness.texture_score,
    confidence: liveness.confidence
  });

  if (livenessInsertError) throw livenessInsertError;

  if (liveness.scan_status !== "validated") {
    const details = await loadFaceScanDetails(args.admin, args.userId, [faceScan]);
    return {
      ok: false,
      message:
        "O scan foi rejeitado pelo quality gate do BelaCode. Use iluminacao frontal, rosto centralizado, pouca maquiagem, expressao neutra, piscada, sorriso, testa franzida e leve giro de cabeca.",
      face_scan: composeFaceScanPayload([faceScan], details)[0]
    };
  }

  const { data: previousFaceScan, error: previousFaceScanError } = await args.admin
    .from("face_scans")
    .select("id")
    .eq("user_id", args.userId)
    .neq("id", faceScan.id)
    .eq("scan_status", "validated")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (previousFaceScanError) throw previousFaceScanError;

  const { data: previousScore, error: previousScoreError } = previousFaceScan?.id
    ? await args.admin.from("skin_scores").select("overall_score").eq("scan_id", previousFaceScan.id).maybeSingle()
    : { data: null, error: null };

  if (previousScoreError) throw previousScoreError;

  const { data: skinScanId, error: scanError } = await args.admin.rpc("record_skin_scan", {
    p_user_id: args.userId,
    p_hydration_score: args.scan.hydration_score,
    p_acne_score: args.scan.acne_score,
    p_pigmentation_score: args.scan.pigmentation_score,
    p_redness_score: args.scan.redness_score,
    p_elasticity_score: args.scan.elasticity_score ?? 50,
    p_pore_visibility: args.scan.pore_visibility ?? 50,
    p_wrinkle_depth: args.scan.wrinkle_depth ?? 50,
    p_scan_source: args.scan.scan_source ?? "ai_scan",
    p_image_url: args.scan.image_url ?? null,
    p_metadata: {
      ...(args.scan.metadata ?? {}),
      face_shield: true,
      capture_metadata: captureMetadata,
      liveness_input: args.scan.liveness ?? {},
      heatmap_url: args.scan.heatmap_url ?? null,
      requires_clinical_review: Boolean(args.scan.requires_clinical_review)
    }
  });

  if (scanError) throw scanError;

  await persistFrameAssets({
    admin: args.admin,
    userId: args.userId,
    faceScanId: faceScan.id,
    skinScanId: String(skinScanId),
    scanImageUrl: args.scan.image_url ?? null,
    heatmapUrl: args.scan.heatmap_url ?? null,
    frames: args.scan.captured_frames,
    metadata: {
      ...captureMetadata,
      source_route: "faceshield.persistence",
      scan_status: "validated"
    }
  });

  const { data: recordedScan, error: recordedScanError } = await args.admin
    .from("skin_scans")
    .select(
      "id,user_id,skin_twin_id,hydration_score,elasticity_score,pigmentation_score,acne_score,redness_score,pore_visibility,wrinkle_depth,scan_source,image_url,metadata,created_at"
    )
    .eq("id", skinScanId)
    .single();

  if (recordedScanError) throw recordedScanError;

  const scanRow = recordedScan as SkinScanRow;
  const score = deriveSkinHealthScore(scanRow, args.profile);
  const heatmapRegions = args.scan.heatmap_regions?.length ? args.scan.heatmap_regions : buildHeatmapRegions(scanRow);

  const { error: faceScanUpdateError } = await args.admin
    .from("face_scans")
    .update({
      skin_scan_id: skinScanId,
      image_url: args.scan.image_url ?? recordedScan.image_url ?? null,
      scan_status: "validated"
    })
    .eq("id", faceScan.id);

  if (faceScanUpdateError) throw faceScanUpdateError;

  const { error: scoreError } = await args.admin.from("skin_scores").upsert({
    scan_id: faceScan.id,
    overall_score: score.overall_score,
    skin_type: score.skin_type,
    main_concern: score.main_concern
  });

  if (scoreError) throw scoreError;

  if (previousFaceScan?.id) {
    const { error: progressError } = await args.admin.from("skin_progress").insert({
      user_id: args.userId,
      scan_id: faceScan.id,
      previous_scan_id: previousFaceScan.id,
      improvement_score: deriveSkinProgress(
        score.overall_score,
        previousScore?.overall_score ? Number(previousScore.overall_score) : null
      )
    });

    if (progressError) throw progressError;
  }

  if (heatmapRegions.length > 0) {
    const { error: heatmapError } = await args.admin.from("skin_heatmap_regions").insert(
      heatmapRegions.map((region) => ({
        scan_id: faceScan.id,
        ...region
      }))
    );

    if (heatmapError) throw heatmapError;
  }

  const persistedFindings = await persistFindings({
    admin: args.admin,
    faceScanId: faceScan.id,
    findings: args.scan.findings ?? [],
    previousScanId: previousFaceScan?.id ?? null,
    captureMetadata
  });

  await upsertSkinEmbedding(args.admin, {
    userId: args.userId,
    faceScanId: faceScan.id,
    skinScanId,
    metrics: metricsFromScan(scanRow),
    profile: args.profile,
    vector: args.scan.embedding_vector ?? null,
    embeddingVersion: args.scan.embedding_version ?? null,
    metadata: args.scan.embedding_metadata ?? {}
  });

  await queueClinicalReviewAlert({
    userId: args.userId,
    faceScanId: faceScan.id,
    findings: persistedFindings
  });

  const refreshedScans = await loadRecentFaceScans(args.admin, args.userId);
  const details = await loadFaceScanDetails(args.admin, args.userId, refreshedScans);
  const payload = composeFaceScanPayload(refreshedScans, details).find((item) => item.id === faceScan.id) ?? null;

  if (!payload) throw new Error("Falha ao carregar o scan recem-criado.");

  return {
    ok: true,
    message: "BelaCode atualizado com sucesso.",
    face_scan: payload
  };
}

