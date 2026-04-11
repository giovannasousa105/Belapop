import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { uploadSkinScanBinary } from "@/lib/skincare/images";
import { mapUserSkinProfile } from "@/lib/skincare/routine";
import { loadCurrentSkinProfile, loadSkinProfileOptions, refreshProductEffectivenessForUser } from "@/lib/skincare/server";
import { persistBelaCodeScan } from "@/lib/skincare/faceshieldPersistence";

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

const MAX_FILE_SIZE = 8 * 1024 * 1024;

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

export async function POST(request: Request) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;

  try {
    const formData = await request.formData();
    const neutralFrame = normalizeImageFile(formData.get("neutral_frame"), "neutral_frame");
    const blinkFrame = normalizeImageFile(formData.get("blink_frame"), "blink_frame");
    const smileFrame = normalizeImageFile(formData.get("smile_frame"), "smile_frame");
    const frownFrame = normalizeImageFile(formData.get("frown_frame"), "frown_frame");
    const turnFrame = normalizeImageFile(formData.get("turn_frame"), "turn_frame");

    const serviceUrl = getServiceUrl();
    if (!serviceUrl) {
      return NextResponse.json(
        { error: "SKIN_AI_SERVICE_URL nao configurada para producao." },
        { status: 503 }
      );
    }

    const upstream = new FormData();
    upstream.set("neutral_frame", neutralFrame);
    upstream.set("blink_frame", blinkFrame);
    upstream.set("smile_frame", smileFrame);
    upstream.set("frown_frame", frownFrame);
    upstream.set("turn_frame", turnFrame);
    upstream.set("user_id", userId);
    upstream.set("capture_mode", String(formData.get("capture_mode") ?? "guided_camera"));

    const serviceResponse = await fetch(serviceUrl, {
      method: "POST",
      headers: optionalSecretHeader(),
      body: upstream
    });

    if (!serviceResponse.ok) {
      const raw = await serviceResponse.text();
      return NextResponse.json(
        { error: raw || "Falha ao processar imagem no Skin AI Service." },
        { status: 502 }
      );
    }

    const parsed = analyzeResponseSchema.safeParse(await serviceResponse.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Resposta invalida do Skin AI Service.", details: parsed.error.flatten() },
        { status: 502 }
      );
    }

    const capturePathToken = randomUUID();
    const [neutralBuffer, blinkBuffer, smileBuffer, frownBuffer, turnBuffer, heatmapBuffer, { skinTypes, skinTones, concerns }, profile] = await Promise.all([
      neutralFrame.arrayBuffer(),
      blinkFrame.arrayBuffer(),
      smileFrame.arrayBuffer(),
      frownFrame.arrayBuffer(),
      turnFrame.arrayBuffer(),
      Promise.resolve(decodeBase64Png(parsed.data.heatmap_image_base64)),
      loadSkinProfileOptions(admin),
      loadCurrentSkinProfile(admin, userId)
    ]);

    const [neutralUrl, blinkUrl, smileUrl, frownUrl, turnUrl, heatmapUrl] = await Promise.all([
      uploadSkinScanBinary(admin, {
        userId,
        kind: "neutral",
        contentType: neutralFrame.type || "image/jpeg",
        extension: neutralFrame.name.split(".").pop()?.toLowerCase() || "jpg",
        buffer: neutralBuffer,
        pathToken: capturePathToken
      }),
      uploadSkinScanBinary(admin, {
        userId,
        kind: "blink",
        contentType: blinkFrame.type || "image/jpeg",
        extension: blinkFrame.name.split(".").pop()?.toLowerCase() || "jpg",
        buffer: blinkBuffer,
        pathToken: capturePathToken
      }),
      uploadSkinScanBinary(admin, {
        userId,
        kind: "smile",
        contentType: smileFrame.type || "image/jpeg",
        extension: smileFrame.name.split(".").pop()?.toLowerCase() || "jpg",
        buffer: smileBuffer,
        pathToken: capturePathToken
      }),
      uploadSkinScanBinary(admin, {
        userId,
        kind: "frown",
        contentType: frownFrame.type || "image/jpeg",
        extension: frownFrame.name.split(".").pop()?.toLowerCase() || "jpg",
        buffer: frownBuffer,
        pathToken: capturePathToken
      }),
      uploadSkinScanBinary(admin, {
        userId,
        kind: "turn",
        contentType: turnFrame.type || "image/jpeg",
        extension: turnFrame.name.split(".").pop()?.toLowerCase() || "jpg",
        buffer: turnBuffer,
        pathToken: capturePathToken
      }),
      uploadSkinScanBinary(admin, {
        userId,
        kind: "heatmap",
        contentType: "image/png",
        extension: "png",
        buffer: heatmapBuffer,
        pathToken: capturePathToken
      })
    ]);

    const mappedProfile = mapUserSkinProfile(profile, skinTypes, concerns, skinTones);

    const result = await persistBelaCodeScan({
      admin,
      userId,
      profile: mappedProfile,
      scan: {
        ...parsed.data.scores,
        scan_source: "ai_scan",
        image_url: neutralUrl,
        heatmap_url: heatmapUrl,
        capture_metadata: {
          capture_mode: String(formData.get("capture_mode") ?? "guided_camera"),
          quality_gate_status: parsed.data.quality_gate.status,
          brightness_score: parsed.data.quality_gate.brightness_score,
          sharpness_score: parsed.data.quality_gate.sharpness_score,
          face_coverage_score: parsed.data.quality_gate.face_coverage_score,
          centered_face_score: parsed.data.quality_gate.centered_face_score,
          minimal_makeup_score: parsed.data.quality_gate.minimal_makeup_score,
          quality_gate_reasons: parsed.data.quality_gate.reasons,
          path_token: capturePathToken
        },
        metadata: {
          vision_diagnostics: parsed.data.diagnostics ?? {},
          uploaded_via: "faceshield.analyze",
          requires_clinical_review: parsed.data.requires_clinical_review
        },
        liveness: {
          ...parsed.data.liveness,
          scan_status: parsed.data.scan_status
        },
        heatmap_regions: parsed.data.heatmap_regions,
        findings: parsed.data.findings,
        requires_clinical_review: parsed.data.requires_clinical_review,
        embedding_vector: parsed.data.embedding,
        embedding_version: parsed.data.embedding_version,
        embedding_metadata: {
          source: "vision_service",
          capture_mode: String(formData.get("capture_mode") ?? "guided_camera")
        },
        captured_frames: [
          { kind: "neutral", image_url: neutralUrl },
          { kind: "blink", image_url: blinkUrl },
          { kind: "smile", image_url: smileUrl },
          { kind: "frown", image_url: frownUrl },
          { kind: "turn", image_url: turnUrl }
        ]
      }
    });

    if (result.ok) {
      await refreshProductEffectivenessForUser(admin, userId);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao executar o BelaCode.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

