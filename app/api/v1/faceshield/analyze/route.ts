import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { computeFaceLiveness, deriveSkinHealthScore } from "@/lib/skincare/faceshield";
import {
  buildFaceShieldAnalysisStorageSnapshot,
  buildHeatmapRegionsFromAnalysis,
  createFaceShieldAnalysisWithEvidence,
  type FaceShieldAnalysisResult,
  type FaceShieldAnalysisInput
} from "@/lib/skincare/faceshieldAnalysisEngine";
import { FACE_MAPPING_REGION_KEYS, type FaceMappingResult } from "@/lib/skincare/faceMappingService";
import { uploadSkinScanBinary } from "@/lib/skincare/images";
import { mapUserSkinProfile } from "@/lib/skincare/routine";
import { loadCurrentSkinProfile, loadSkinProfileOptions, refreshProductEffectivenessForUser } from "@/lib/skincare/server";
import type { SkinScanRow } from "@/lib/skincare/twin";
import { persistBelaCodeScan } from "@/lib/skincare/faceshieldPersistence";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const findingSchema = z.object({
  finding_type: z.enum([
    "nevus_melanocytic",
    "cherry_angioma",
    "keratosis",
    "melanoma_triage",
    "scc_triage"
  ]),
  region_slug: z.string().min(1),
  confidence_score: z.number().min(0).max(1),
  severity_score: z.number().min(0).max(100),
  position_x: z.number().min(0).max(1),
  position_y: z.number().min(0).max(1),
  radius: z.number().min(0).max(1),
  requires_clinical_review: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const analyzeResponseSchema = z.object({
  scan_status: z.enum(["validated", "rejected", "pending"]),
  quality_gate: z.object({
    status: z.enum(["validated", "rejected", "pending"]),
    brightness_score: z.number().min(0).max(1),
    sharpness_score: z.number().min(0).max(1),
    face_coverage_score: z.number().min(0).max(1),
    centered_face_score: z.number().min(0).max(1),
    minimal_makeup_score: z.number().min(0).max(1),
    reasons: z.array(z.string())
  }),
  liveness: z.object({
    blink_detected: z.boolean(),
    head_movement: z.boolean(),
    smile_detected: z.boolean(),
    frown_detected: z.boolean(),
    depth_score: z.number().min(0).max(1),
    texture_score: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    liveness_score: z.number().min(0).max(1)
  }),
  scores: z.object({
    hydration_score: z.number().min(0).max(100),
    acne_score: z.number().min(0).max(100),
    pigmentation_score: z.number().min(0).max(100),
    redness_score: z.number().min(0).max(100),
    elasticity_score: z.number().min(0).max(100),
    pore_visibility: z.number().min(0).max(100),
    wrinkle_depth: z.number().min(0).max(100)
  }),
  heatmap_regions: z.array(
    z.object({
      condition_type: z.enum(["acne", "hydration", "pigmentation", "pores", "wrinkles", "redness"]),
      region_slug: z.string().min(1),
      intensity: z.number().min(0).max(100),
      position_x: z.number().min(0).max(1),
      position_y: z.number().min(0).max(1),
      radius: z.number().min(0).max(1)
    })
  ),
  findings: z.array(findingSchema),
  requires_clinical_review: z.boolean(),
  embedding: z.array(z.number()).length(128),
  embedding_version: z.string().min(1),
  heatmap_image_base64: z.string().min(32),
  diagnostics: z.record(z.string(), z.unknown()).optional()
});

const regionAnalysisSchema = z.object({
  averageBrightness: z.number().min(0).max(1),
  rednessScore: z.number().min(0).max(1),
  darkSpotScore: z.number().min(0).max(1),
  textureScore: z.number().min(0).max(1),
  shineScore: z.number().min(0).max(1),
  poreVisibilityScore: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1)
});

const faceImageQualitySchema = z.object({
  brightness: z.enum(["low", "good", "high"]),
  blur: z.enum(["low", "medium", "high"]),
  faceCentered: z.boolean(),
  multipleFaces: z.boolean(),
  imageQualityScore: z.number().min(0).max(1),
  messages: z.array(z.string())
});

const faceMappingResultSchema = z.object({
  faceDetected: z.boolean(),
  quality: faceImageQualitySchema,
  regions: z.object(
    FACE_MAPPING_REGION_KEYS.reduce(
      (shape, key) => {
        shape[key] = regionAnalysisSchema;
        return shape;
      },
      {} as Record<(typeof FACE_MAPPING_REGION_KEYS)[number], typeof regionAnalysisSchema>
    )
  )
});

const MAX_FILE_SIZE = 8 * 1024 * 1024;

type AnalyzeServiceResponse = z.infer<typeof analyzeResponseSchema>;
type ServiceAnalysisResult = Awaited<ReturnType<typeof requestServiceAnalysis>>;

function safeJsonField<T = Record<string, unknown>>(formData: FormData, field: string): T | null {
  const raw = formData.get(field);
  if (typeof raw !== "string" || !raw.trim()) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function resolveFaceMapping(formData: FormData) {
  const raw = safeJsonField<FaceMappingResult>(formData, "face_mapping");
  if (!raw) return null;

  const parsed = faceMappingResultSchema.safeParse(raw);
  if (!parsed.success) return null;

  return parsed.data;
}

function optionalSecretHeader() {
  const secret = process.env.SKIN_AI_SHARED_SECRET?.trim();
  return secret ? ({ "x-skin-ai-secret": secret } satisfies Record<string, string>) : undefined;
}

function getServiceUrl() {
  const configured = process.env.SKIN_AI_SERVICE_URL?.trim();
  if (configured) return `${configured}/skin-ai/analyze`;
  if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:8000/skin-ai/analyze";
  return null;
}

function normalizeImageFile(value: FormDataEntryValue | null, field: string) {
  if (!(value instanceof File)) {
    throw new Error(`Arquivo obrigatorio ausente: ${field}.`);
  }
  if (!value.type.startsWith("image/")) {
    throw new Error(`Formato invalido em ${field}.`);
  }
  if (value.size <= 0 || value.size > MAX_FILE_SIZE) {
    throw new Error(`Tamanho invalido em ${field}.`);
  }
  return value;
}

function decodeBase64Png(value: string) {
  const raw = value.includes(",") ? value.split(",")[1] : value;
  return Buffer.from(raw, "base64");
}

async function loadRecentSkinScansForAnalysis(admin: ReturnType<typeof import("@/lib/supabase/admin").getSupabaseAdminClient>, userId: string) {
  const { data, error } = await admin
    .from("skin_scans")
    .select(
      "id,user_id,skin_twin_id,hydration_score,elasticity_score,pigmentation_score,acne_score,redness_score,pore_visibility,wrinkle_depth,scan_source,image_url,metadata,created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw error;
  return (data ?? []) as SkinScanRow[];
}

async function loadProductCandidatesForAnalysis(admin: ReturnType<typeof import("@/lib/supabase/admin").getSupabaseAdminClient>) {
  const { data, error } = await admin
    .from("products")
    .select("id,slug,name,title,brand,category,hero_image_url,price_cents,seller_id,tags,status,stock_quantity,created_at")
    .in("status", ["active", "published"])
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false })
    .limit(180);

  if (error) throw error;
  return (data ?? []) as NonNullable<FaceShieldAnalysisInput["productCandidates"]>;
}

async function requestServiceAnalysis(args: {
  serviceUrl: string | null;
  upstream: FormData;
}) {
  if (!args.serviceUrl) {
    return {
      data: null,
      fallbackReason: "service_url_missing"
    } as const;
  }

  try {
    const serviceResponse = await fetch(args.serviceUrl, {
      method: "POST",
      headers: optionalSecretHeader(),
      body: args.upstream
    });

    if (!serviceResponse.ok) {
      return {
        data: null,
        fallbackReason: `service_http_${serviceResponse.status}`
      } as const;
    }

    const parsed = analyzeResponseSchema.safeParse(await serviceResponse.json());
    if (!parsed.success) {
      return {
        data: null,
        fallbackReason: "service_payload_invalid"
      } as const;
    }

    return {
      data: parsed.data,
      fallbackReason: null
    } as const;
  } catch {
    return {
      data: null,
      fallbackReason: "service_request_failed"
    } as const;
  }
}

function buildFallbackVisualMetrics(profile: ReturnType<typeof mapUserSkinProfile>, recentScans: SkinScanRow[]) {
  const latestScan = recentScans[0] ?? null;
  if (latestScan) {
    return {
      hydrationScore: latestScan.hydration_score,
      acneScore: latestScan.acne_score,
      pigmentationScore: latestScan.pigmentation_score,
      rednessScore: latestScan.redness_score,
      elasticityScore: latestScan.elasticity_score,
      poreVisibilityScore: latestScan.pore_visibility,
      wrinkleDepthScore: latestScan.wrinkle_depth
    };
  }

  return {
    hydrationScore: profile?.main_concern?.slug === "dehydration" ? 34 : 54,
    acneScore: profile?.main_concern?.slug === "acne" ? 62 : 38,
    pigmentationScore: profile?.main_concern?.slug === "dark_spots" ? 58 : 34,
    rednessScore: profile?.skin_type?.slug === "sensitive" ? 62 : 30,
    elasticityScore: profile?.main_concern?.slug === "aging" ? 38 : 56,
    poreVisibilityScore: profile?.skin_type?.slug === "oily" ? 64 : 42,
    wrinkleDepthScore: profile?.main_concern?.slug === "aging" ? 58 : 28
  };
}

function brightnessScoreFromFaceMapping(faceMapping: FaceMappingResult | null) {
  if (!faceMapping) return null;
  if (faceMapping.quality.brightness === "low") return 0.22;
  if (faceMapping.quality.brightness === "high") return 0.84;
  return 0.62;
}

function sharpnessScoreFromFaceMapping(faceMapping: FaceMappingResult | null) {
  if (!faceMapping) return null;
  if (faceMapping.quality.blur === "high") return 0.18;
  if (faceMapping.quality.blur === "medium") return 0.46;
  return 0.82;
}

function logSafeFaceShieldAnalysis(args: {
  userId: string;
  captureMode: string;
  analysis: FaceShieldAnalysisResult;
  fallbackReason: string | null;
}) {
  console.info(
    "[faceshield-analysis]",
    JSON.stringify({
      userId: args.userId,
      captureMode: args.captureMode,
      analysisMode: args.analysis.analysisMode,
      imageQualityScore: args.analysis.imageQuality.imageQualityScore,
      fusionConfidence: args.analysis.fusionResult.confidenceScore,
      visualWeight: args.analysis.weights.visualWeight,
      quizWeight: args.analysis.weights.quizWeight,
      historyWeight: args.analysis.weights.historyWeight,
      probableSkinType: args.analysis.probableSkinProfile.skinType,
      primaryConcern: args.analysis.probableSkinProfile.primaryConcern,
      warningCount: args.analysis.cosmeticSafetyWarnings.length,
      productMatches: args.analysis.productsCompatible.length,
      evidenceDocuments: args.analysis.evidenceSummary?.documents.length ?? 0,
      evidenceTopic: args.analysis.evidenceSummary?.topicSlug ?? null,
      fallbackReason: args.fallbackReason
    })
  );
}

function buildEphemeralFaceScanResponse(args: {
  guestUserId: string;
  captureMode: string;
  analysis: FaceShieldAnalysisResult;
  serviceAnalysis: ServiceAnalysisResult;
  mappedProfile: ReturnType<typeof mapUserSkinProfile>;
}) {
  const timestamp = new Date().toISOString();
  const scanId = randomUUID();
  const baseLiveness = computeFaceLiveness({
    brightness_score: args.analysis.imageQuality.brightnessScore,
    texture_score: args.serviceAnalysis.data?.liveness.texture_score ?? args.analysis.imageQuality.blurScore,
    depth_score: args.serviceAnalysis.data?.liveness.depth_score ?? args.analysis.fusionResult.confidenceScore,
    blink_detected: args.serviceAnalysis.data?.liveness.blink_detected ?? false,
    head_movement: args.serviceAnalysis.data?.liveness.head_movement ?? false
  });
  const scanStatus =
    args.analysis.analysisMode === "validated_visual"
      ? "validated"
      : baseLiveness.scan_status === "validated"
        ? "validated"
        : "pending";

  const syntheticSkinScan: SkinScanRow = {
    id: scanId,
    user_id: args.guestUserId,
    skin_twin_id: null,
    hydration_score: args.analysis.weightedMetrics.hydrationScore,
    elasticity_score: args.analysis.weightedMetrics.elasticityScore,
    pigmentation_score: args.analysis.weightedMetrics.pigmentationScore,
    acne_score: args.analysis.weightedMetrics.acneScore,
    redness_score: args.analysis.weightedMetrics.rednessScore,
    pore_visibility: args.analysis.weightedMetrics.poreVisibility,
    wrinkle_depth: args.analysis.weightedMetrics.wrinkleDepth,
    scan_source: args.serviceAnalysis.data ? "ai_scan" : "manual",
    image_url: null,
    metadata: {},
    created_at: timestamp
  };

  const score = deriveSkinHealthScore(syntheticSkinScan, args.mappedProfile);
  const captureMetadata = {
    capture_mode: args.captureMode,
    quality_gate_status: args.serviceAnalysis.data?.quality_gate.status ?? "pending",
    brightness_score: args.analysis.imageQuality.brightnessScore,
    sharpness_score: args.serviceAnalysis.data?.quality_gate.sharpness_score ?? null,
    blur_score: args.analysis.imageQuality.blurScore,
    face_coverage_score: args.serviceAnalysis.data?.quality_gate.face_coverage_score ?? null,
    centered_face_score: args.analysis.imageQuality.faceCenteredScore,
    minimal_makeup_score: args.serviceAnalysis.data?.quality_gate.minimal_makeup_score ?? null,
    quality_gate_reasons: args.serviceAnalysis.data?.quality_gate.reasons ?? [],
    image_quality_score: args.analysis.imageQuality.imageQualityScore,
    face_detected: args.analysis.imageQuality.faceDetected,
    multiple_faces_detected: args.analysis.imageQuality.multipleFacesDetected,
    fallback_reason: args.serviceAnalysis.fallbackReason,
    guest_mode: true,
    persisted: false,
    faceshield_analysis: buildFaceShieldAnalysisStorageSnapshot(args.analysis)
  } satisfies Record<string, unknown>;

  const heatmapRegions = (
    args.serviceAnalysis.data?.heatmap_regions.length
      ? args.serviceAnalysis.data.heatmap_regions
      : buildHeatmapRegionsFromAnalysis(args.analysis)
  ).map((region) => ({
    id: randomUUID(),
    scan_id: scanId,
    ...region,
    created_at: timestamp
  }));

  const findings = (args.serviceAnalysis.data?.findings ?? []).map((finding) => ({
    id: randomUUID(),
    scan_id: scanId,
    finding_type: finding.finding_type,
    region_slug: finding.region_slug,
    confidence_score: finding.confidence_score,
    severity_score: finding.severity_score,
    position_x: finding.position_x,
    position_y: finding.position_y,
    radius: finding.radius,
    appearance_status: "new" as const,
    requires_clinical_review: Boolean(finding.requires_clinical_review),
    metadata: finding.metadata ?? {},
    created_at: timestamp,
    updated_at: timestamp
  }));

  return {
    ok: true,
    message:
      args.analysis.analysisMode === "validated_visual"
        ? "Skin Scan concluido com leitura temporaria."
        : "Skin Scan concluido com leitura assistida temporaria.",
    face_scan: {
      id: scanId,
      user_id: args.guestUserId,
      skin_scan_id: null,
      image_url: null,
      heatmap_url: null,
      liveness_score:
        args.serviceAnalysis.data?.liveness.liveness_score ??
        Math.max(baseLiveness.liveness_score, args.analysis.confidenceLevel * 0.72),
      scan_status: scanStatus,
      capture_metadata: captureMetadata,
      created_at: timestamp,
      updated_at: timestamp,
      liveness: {
        id: randomUUID(),
        scan_id: scanId,
        blink_detected: args.serviceAnalysis.data?.liveness.blink_detected ?? baseLiveness.blink_detected,
        head_movement: args.serviceAnalysis.data?.liveness.head_movement ?? baseLiveness.head_movement,
        smile_detected: args.serviceAnalysis.data?.liveness.smile_detected ?? false,
        frown_detected: args.serviceAnalysis.data?.liveness.frown_detected ?? false,
        depth_score: args.serviceAnalysis.data?.liveness.depth_score ?? baseLiveness.depth_score,
        texture_score: args.serviceAnalysis.data?.liveness.texture_score ?? baseLiveness.texture_score,
        confidence:
          args.serviceAnalysis.data?.liveness.confidence ??
          Math.max(baseLiveness.confidence, args.analysis.confidenceLevel * 0.75),
        created_at: timestamp,
        updated_at: timestamp
      },
      score: {
        scan_id: scanId,
        overall_score: score.overall_score,
        skin_type: args.analysis.probableSkinProfile.skinType ?? score.skin_type,
        main_concern: args.analysis.probableSkinProfile.primaryConcern ?? score.main_concern,
        created_at: timestamp,
        updated_at: timestamp
      },
      progress: null,
      heatmap_regions: heatmapRegions,
      findings
    }
  };
}

export async function POST(request: Request) {
  const auth = await requireCustomerApiContext();
  const isGuestMode = !auth.ok && auth.response.status === 401;
  if (!auth.ok && !isGuestMode) return auth.response;

  const admin = auth.ok ? auth.ctx.admin : getSupabaseAdminClient();
  const userId = auth.ok ? auth.ctx.userId : randomUUID();

  try {
    const formData = await request.formData();
    const neutralFrame = normalizeImageFile(formData.get("neutral_frame"), "neutral_frame");
    const blinkFrame = normalizeImageFile(formData.get("blink_frame"), "blink_frame");
    const smileFrame = normalizeImageFile(formData.get("smile_frame"), "smile_frame");
    const frownFrame = normalizeImageFile(formData.get("frown_frame"), "frown_frame");
    const turnFrame = normalizeImageFile(formData.get("turn_frame"), "turn_frame");
    const captureMode = String(formData.get("capture_mode") ?? "guided_camera");
    const responses = safeJsonField<FaceShieldAnalysisInput["responses"]>(formData, "quiz_answers");
    const routineContext = safeJsonField<FaceShieldAnalysisInput["routineContext"]>(formData, "routine_context");
    const preferences = safeJsonField<FaceShieldAnalysisInput["preferences"]>(formData, "declared_preferences");
    const restrictions = safeJsonField<FaceShieldAnalysisInput["restrictions"]>(formData, "restrictions");
    const faceMapping = resolveFaceMapping(formData);

    const upstream = new FormData();
    upstream.set("neutral_frame", neutralFrame);
    upstream.set("blink_frame", blinkFrame);
    upstream.set("smile_frame", smileFrame);
    upstream.set("frown_frame", frownFrame);
    upstream.set("turn_frame", turnFrame);
    upstream.set("user_id", userId);
    upstream.set("capture_mode", captureMode);

    const [{ skinTypes, skinTones, concerns }, profile, recentScans, productCandidates, serviceAnalysis] =
      await Promise.all([
        loadSkinProfileOptions(admin),
        auth.ok ? loadCurrentSkinProfile(admin, userId) : Promise.resolve(null),
        auth.ok ? loadRecentSkinScansForAnalysis(admin, userId) : Promise.resolve([] as SkinScanRow[]),
        loadProductCandidatesForAnalysis(admin),
        requestServiceAnalysis({
          serviceUrl: getServiceUrl(),
          upstream
        })
      ]);

    const mappedProfile = mapUserSkinProfile(profile, skinTypes, concerns, skinTones);
    const visualMetrics = serviceAnalysis.data
      ? {
          hydrationScore: serviceAnalysis.data.scores.hydration_score,
          acneScore: serviceAnalysis.data.scores.acne_score,
          pigmentationScore: serviceAnalysis.data.scores.pigmentation_score,
          rednessScore: serviceAnalysis.data.scores.redness_score,
          elasticityScore: serviceAnalysis.data.scores.elasticity_score,
          poreVisibilityScore: serviceAnalysis.data.scores.pore_visibility,
          wrinkleDepthScore: serviceAnalysis.data.scores.wrinkle_depth
        }
      : buildFallbackVisualMetrics(mappedProfile, recentScans);

    const analysis = await createFaceShieldAnalysisWithEvidence(admin, {
      image: {
        provided: true,
        captureMode,
        persistedWithConsent: true
      },
      qualitySignals: serviceAnalysis.data
        ? {
            brightnessScore:
              brightnessScoreFromFaceMapping(faceMapping) ?? serviceAnalysis.data.quality_gate.brightness_score,
            sharpnessScore:
              sharpnessScoreFromFaceMapping(faceMapping) ?? serviceAnalysis.data.quality_gate.sharpness_score,
            faceCoverageScore: serviceAnalysis.data.quality_gate.face_coverage_score,
            centeredFaceScore: faceMapping
              ? faceMapping.quality.faceCentered
                ? Math.max(serviceAnalysis.data.quality_gate.centered_face_score, 0.88)
                : Math.min(serviceAnalysis.data.quality_gate.centered_face_score, 0.35)
              : serviceAnalysis.data.quality_gate.centered_face_score,
            minimalMakeupScore: serviceAnalysis.data.quality_gate.minimal_makeup_score,
            faceDetected: faceMapping?.faceDetected ?? true,
            multipleFacesDetected: faceMapping?.quality.multipleFaces ?? false,
            serviceStatus: serviceAnalysis.data.quality_gate.status,
            serviceReasons: [
              ...serviceAnalysis.data.quality_gate.reasons,
              ...(faceMapping?.quality.messages ?? [])
            ]
          }
        : {
            brightnessScore: brightnessScoreFromFaceMapping(faceMapping),
            sharpnessScore: sharpnessScoreFromFaceMapping(faceMapping),
            centeredFaceScore: faceMapping?.quality.faceCentered ? 1 : 0.2,
            faceDetected: faceMapping?.faceDetected ?? false,
            multipleFacesDetected: faceMapping?.quality.multipleFaces ?? false,
            serviceStatus: "pending",
            serviceReasons: [
              ...(serviceAnalysis.fallbackReason ? [serviceAnalysis.fallbackReason] : []),
              ...(faceMapping?.quality.messages ?? [])
            ]
          },
      visualMetrics,
      heatmapRegions: serviceAnalysis.data?.heatmap_regions ?? null,
      responses,
      routineContext,
      preferences,
      restrictions,
      profile: mappedProfile,
      recentScans,
      productCandidates,
      faceMapping
    });

    logSafeFaceShieldAnalysis({
      userId,
      captureMode,
      analysis,
      fallbackReason: serviceAnalysis.fallbackReason
    });

    if (isGuestMode) {
      return NextResponse.json(
        buildEphemeralFaceScanResponse({
          guestUserId: userId,
          captureMode,
          analysis,
          serviceAnalysis,
          mappedProfile
        })
      );
    }

    const capturePathToken = randomUUID();
    const shouldPersistImages = Boolean(serviceAnalysis.data);
    const [neutralBuffer, blinkBuffer, smileBuffer, frownBuffer, turnBuffer, heatmapBuffer] = shouldPersistImages
      ? await Promise.all([
      neutralFrame.arrayBuffer(),
      blinkFrame.arrayBuffer(),
      smileFrame.arrayBuffer(),
      frownFrame.arrayBuffer(),
      turnFrame.arrayBuffer(),
      Promise.resolve(decodeBase64Png((serviceAnalysis.data as AnalyzeServiceResponse).heatmap_image_base64))
        ])
      : [null, null, null, null, null, null];

    const [neutralUrl, blinkUrl, smileUrl, frownUrl, turnUrl, heatmapUrl] = shouldPersistImages
      ? await Promise.all([
          uploadSkinScanBinary(admin, {
            userId,
            kind: "neutral",
            contentType: neutralFrame.type || "image/jpeg",
            extension: neutralFrame.name.split(".").pop()?.toLowerCase() || "jpg",
            buffer: neutralBuffer as ArrayBuffer,
            pathToken: capturePathToken
          }),
          uploadSkinScanBinary(admin, {
            userId,
            kind: "blink",
            contentType: blinkFrame.type || "image/jpeg",
            extension: blinkFrame.name.split(".").pop()?.toLowerCase() || "jpg",
            buffer: blinkBuffer as ArrayBuffer,
            pathToken: capturePathToken
          }),
          uploadSkinScanBinary(admin, {
            userId,
            kind: "smile",
            contentType: smileFrame.type || "image/jpeg",
            extension: smileFrame.name.split(".").pop()?.toLowerCase() || "jpg",
            buffer: smileBuffer as ArrayBuffer,
            pathToken: capturePathToken
          }),
          uploadSkinScanBinary(admin, {
            userId,
            kind: "frown",
            contentType: frownFrame.type || "image/jpeg",
            extension: frownFrame.name.split(".").pop()?.toLowerCase() || "jpg",
            buffer: frownBuffer as ArrayBuffer,
            pathToken: capturePathToken
          }),
          uploadSkinScanBinary(admin, {
            userId,
            kind: "turn",
            contentType: turnFrame.type || "image/jpeg",
            extension: turnFrame.name.split(".").pop()?.toLowerCase() || "jpg",
            buffer: turnBuffer as ArrayBuffer,
            pathToken: capturePathToken
          }),
          uploadSkinScanBinary(admin, {
            userId,
            kind: "heatmap",
            contentType: "image/png",
            extension: "png",
            buffer: heatmapBuffer as Buffer,
            pathToken: capturePathToken
          })
        ])
      : [null, null, null, null, null, null];

    const result = await persistBelaCodeScan({
      admin,
      userId,
      profile: mappedProfile,
      scan: {
        hydration_score: analysis.weightedMetrics.hydrationScore,
        acne_score: analysis.weightedMetrics.acneScore,
        pigmentation_score: analysis.weightedMetrics.pigmentationScore,
        redness_score: analysis.weightedMetrics.rednessScore,
        elasticity_score: analysis.weightedMetrics.elasticityScore,
        pore_visibility: analysis.weightedMetrics.poreVisibility,
        wrinkle_depth: analysis.weightedMetrics.wrinkleDepth,
        scan_source: serviceAnalysis.data ? "ai_scan" : "manual",
        image_url: neutralUrl,
        heatmap_url: heatmapUrl,
        capture_metadata: {
          capture_mode: captureMode,
          quality_gate_status: serviceAnalysis.data?.quality_gate.status ?? "pending",
          brightness_score: analysis.imageQuality.brightnessScore,
          sharpness_score: serviceAnalysis.data?.quality_gate.sharpness_score ?? null,
          blur_score: analysis.imageQuality.blurScore,
          face_coverage_score: serviceAnalysis.data?.quality_gate.face_coverage_score ?? null,
          centered_face_score: analysis.imageQuality.faceCenteredScore,
          minimal_makeup_score: serviceAnalysis.data?.quality_gate.minimal_makeup_score ?? null,
          quality_gate_reasons: serviceAnalysis.data?.quality_gate.reasons ?? [],
          image_quality_score: analysis.imageQuality.imageQualityScore,
          face_detected: analysis.imageQuality.faceDetected,
          multiple_faces_detected: analysis.imageQuality.multipleFacesDetected,
          path_token: shouldPersistImages ? capturePathToken : null,
          faceshield_analysis: buildFaceShieldAnalysisStorageSnapshot(analysis),
          fallback_reason: serviceAnalysis.fallbackReason
        },
        metadata: {
          vision_diagnostics: serviceAnalysis.data?.diagnostics ?? {},
          uploaded_via: "faceshield.analyze",
          requires_clinical_review: serviceAnalysis.data?.requires_clinical_review ?? false,
          faceshield_analysis: buildFaceShieldAnalysisStorageSnapshot(analysis)
        },
        liveness: {
          blink_detected: serviceAnalysis.data?.liveness.blink_detected ?? false,
          head_movement: serviceAnalysis.data?.liveness.head_movement ?? false,
          smile_detected: serviceAnalysis.data?.liveness.smile_detected ?? false,
          frown_detected: serviceAnalysis.data?.liveness.frown_detected ?? false,
          depth_score: serviceAnalysis.data?.liveness.depth_score ?? 0,
          texture_score: serviceAnalysis.data?.liveness.texture_score ?? 0,
          confidence:
            serviceAnalysis.data?.liveness.confidence ??
            Math.max(0.35, analysis.confidenceLevel * 0.75),
          liveness_score:
            serviceAnalysis.data?.liveness.liveness_score ??
            Math.max(0.35, analysis.confidenceLevel * 0.72),
          scan_status: analysis.analysisMode === "validated_visual" ? "validated" : "pending"
        },
        heatmap_regions:
          serviceAnalysis.data?.heatmap_regions.length
            ? serviceAnalysis.data.heatmap_regions
            : buildHeatmapRegionsFromAnalysis(analysis),
        findings: serviceAnalysis.data?.findings ?? [],
        requires_clinical_review: serviceAnalysis.data?.requires_clinical_review ?? false,
        embedding_vector: serviceAnalysis.data?.embedding ?? null,
        embedding_version: serviceAnalysis.data?.embedding_version ?? null,
        embedding_metadata: {
          source: serviceAnalysis.data ? "vision_service" : "faceshield_fallback_engine",
          capture_mode: captureMode,
          analysis_mode: analysis.analysisMode
        },
        captured_frames: shouldPersistImages
          ? [
              { kind: "neutral", image_url: neutralUrl as string },
              { kind: "blink", image_url: blinkUrl as string },
              { kind: "smile", image_url: smileUrl as string },
              { kind: "frown", image_url: frownUrl as string },
              { kind: "turn", image_url: turnUrl as string }
            ]
          : undefined,
        analysis
      }
    });

    if (result.ok && auth.ok) {
      await refreshProductEffectivenessForUser(admin, userId);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao executar o BelaCode.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

