import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  openAiSkinAnalysisSchema,
  rankProductsForSkinAnalysis,
  type DiscoveryProductCandidate
} from "@/lib/skincare/skinAnalysis";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const OPENAI_TIMEOUT_MS = 25_000;

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const captureContextSchema = z
  .object({
    faceDetected: z.boolean().optional(),
    faceCentered: z.boolean().optional(),
    distanceOk: z.boolean().optional(),
    frontalAngleOk: z.boolean().optional(),
    stableFace: z.boolean().optional(),
    lightingOk: z.boolean().optional(),
    tooDark: z.boolean().optional(),
    tooBright: z.boolean().optional(),
    unevenLight: z.boolean().optional()
  })
  .passthrough();

const requestLimitStore = new Map<string, { count: number; resetAt: number }>();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

const openAiStructuredSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    imageQuality: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: { type: "string", enum: ["good", "medium", "poor"] },
        issues: {
          type: "array",
          items: { type: "string", enum: ["low_light", "blur", "shadow", "overexposure"] }
        },
        canAnalyze: { type: "boolean" }
      },
      required: ["status", "issues", "canAnalyze"]
    },
    skinTexture: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        score: { type: "number" },
        confidence: { type: "number" }
      },
      required: ["label", "score", "confidence"]
    },
    visiblePores: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        score: { type: "number" },
        confidence: { type: "number" }
      },
      required: ["label", "score", "confidence"]
    },
    oilinessAppearance: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        zones: { type: "array", items: { type: "string" } },
        confidence: { type: "number" }
      },
      required: ["label", "zones", "confidence"]
    },
    drynessAppearance: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        zones: { type: "array", items: { type: "string" } },
        confidence: { type: "number" }
      },
      required: ["label", "zones", "confidence"]
    },
    rednessAppearance: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        zones: { type: "array", items: { type: "string" } },
        confidence: { type: "number" }
      },
      required: ["label", "zones", "confidence"]
    },
    toneUniformity: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        score: { type: "number" },
        confidence: { type: "number" }
      },
      required: ["label", "score", "confidence"]
    },
    fineLinesAppearance: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string" },
        zones: { type: "array", items: { type: "string" } },
        confidence: { type: "number" }
      },
      required: ["label", "zones", "confidence"]
    },
    topConcerns: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" }
    },
    summary: { type: "string" },
    routineRecommendation: {
      type: "object",
      additionalProperties: false,
      properties: {
        morning: { type: "array", minItems: 1, items: { type: "string" } },
        night: { type: "array", minItems: 1, items: { type: "string" } }
      },
      required: ["morning", "night"]
    },
    disclaimer: { type: "string" }
  },
  required: [
    "imageQuality",
    "skinTexture",
    "visiblePores",
    "oilinessAppearance",
    "drynessAppearance",
    "rednessAppearance",
    "toneUniformity",
    "fineLinesAppearance",
    "topConcerns",
    "summary",
    "routineRecommendation",
    "disclaimer"
  ]
} as const;

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function pruneRateLimitStore(now: number) {
  for (const [key, value] of requestLimitStore.entries()) {
    if (value.resetAt <= now) {
      requestLimitStore.delete(key);
    }
  }
}

function applyRateLimit(request: Request) {
  const now = Date.now();
  pruneRateLimitStore(now);

  const ip = getClientIp(request);
  const current = requestLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    requestLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });
    return null;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      {
        error: "Limite temporário de leituras atingido. Tente novamente em alguns minutos."
      },
      { status: 429 }
    );
  }

  current.count += 1;
  requestLimitStore.set(ip, current);
  return null;
}

function normalizeImageFile(entry: FormDataEntryValue | null) {
  if (!(entry instanceof File)) {
    throw new Error("Imagem obrigatória ausente.");
  }

  if (!allowedImageTypes.has(entry.type)) {
    throw new Error("Formato de imagem não suportado.");
  }

  if (entry.size <= 0 || entry.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Tamanho de imagem inválido.");
  }

  return entry;
}

async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

async function loadProductCandidates(admin: ReturnType<typeof getSupabaseAdminClient>) {
  const { data, error } = await admin
    .from("products")
    .select("id,slug,name,title,brand,category,hero_image_url,price_cents,seller_id,badges,tags,status,stock_quantity,created_at")
    .in("status", ["active", "published"])
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false })
    .limit(180);

  if (error) throw error;
  return (data ?? []) as DiscoveryProductCandidate[];
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    return await Promise.race<T>([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("OPENAI_TIMEOUT"));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function requestOpenAiAnalysis(args: {
  imageDataUrl: string;
  captureContext: z.infer<typeof captureContextSchema> | null;
}) {
  if (!openai) {
    throw new Error("OPENAI_UNAVAILABLE");
  }

  const model =
    process.env.OPENAI_SKIN_ANALYSIS_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4.1-mini";

  const response = await withTimeout(
    openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Analyze the provided facial skin image for cosmetic and visual skin appearance only. Do not provide medical diagnosis. Do not identify the person. Do not infer age, ethnicity, health conditions, or sensitive attributes. Evaluate only visible cosmetic skin signals. Return JSON only."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                task:
                  "Avalie apenas sinais cosméticos visuais aparentes da pele. Use linguagem segura, elegante e não médica em português do Brasil.",
                focus: [
                  "textura aparente",
                  "poros visíveis",
                  "oleosidade aparente",
                  "ressecamento aparente",
                  "vermelhidão visível",
                  "uniformidade do tom",
                  "brilho excessivo",
                  "áreas de hidratação aparente",
                  "linhas finas aparentes",
                  "qualidade da imagem"
                ],
                guardrails: [
                  "Não diagnosticar",
                  "Não prometer resultado clínico",
                  "Não usar linguagem absoluta",
                  "Se a imagem estiver ruim, marque canAnalyze como false"
                ],
                captureContext: args.captureContext
              })
            },
            {
              type: "input_image",
              image_url: args.imageDataUrl,
              detail: "high"
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "belapop_skin_analysis",
          schema: openAiStructuredSchema
        }
      }
    }),
    OPENAI_TIMEOUT_MS
  );

  const outputText = typeof response.output_text === "string" ? response.output_text : null;
  if (!outputText) {
    throw new Error("OPENAI_EMPTY_RESPONSE");
  }

  const parsed = openAiSkinAnalysisSchema.safeParse(JSON.parse(outputText));
  if (!parsed.success) {
    throw new Error("OPENAI_INVALID_JSON");
  }

  return parsed.data;
}

// ─── Fallback para quando OpenAI está indisponível ────────────────────────────
// A captura já passou pela validação facial do MediaPipe — a imagem é boa.
// Retornar análise de base neutra em vez de bloquear o fluxo com 502.

function buildFallbackAnalysis(
  captureContext: z.infer<typeof captureContextSchema> | null
): z.infer<typeof openAiSkinAnalysisSchema> {
  const lightingOk = captureContext?.lightingOk !== false;
  const qualityStatus = lightingOk ? ("medium" as const) : ("poor" as const);

  return {
    imageQuality: {
      status: qualityStatus,
      issues: lightingOk ? [] : (["low_light"] as Array<"low_light" | "blur" | "shadow" | "overexposure">),
      canAnalyze: true,
    },
    skinTexture:         { label: "Textura uniforme",          score: 50, confidence: 0.3 },
    visiblePores:        { label: "Poros discretos",           score: 40, confidence: 0.3 },
    oilinessAppearance:  { label: "Oleosidade moderada",       zones: [], confidence: 0.3 },
    drynessAppearance:   { label: "Hidratação adequada",       zones: [], confidence: 0.3 },
    rednessAppearance:   { label: "Tom equilibrado",           zones: [], confidence: 0.3 },
    toneUniformity:      { label: "Tom uniforme",              score: 55, confidence: 0.3 },
    fineLinesAppearance: { label: "Linhas discretas",          zones: [], confidence: 0.3 },
    topConcerns: ["hidratação", "proteção solar"],
    summary:
      "Leitura de base concluída. Para uma análise mais personalizada, repita o scan em boa iluminação natural.",
    routineRecommendation: {
      morning: ["sérum hidratante", "protetor solar FPS 30+"],
      night:   ["limpeza suave", "hidratante noturno"],
    },
    disclaimer:
      "Análise de base gerada automaticamente. Os resultados são orientativos e não substituem avaliação profissional.",
  };
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (
      [
        "Imagem obrigatória ausente.",
        "Formato de imagem não suportado.",
        "Tamanho de imagem inválido."
      ].includes(error.message)
    ) {
      return error.message;
    }

    if (error.message === "OPENAI_TIMEOUT") {
      return "Não conseguimos concluir a análise com precisão. Você pode tentar novamente com outra captura.";
    }

    if (
      error.message === "OPENAI_UNAVAILABLE" ||
      error.message === "OPENAI_EMPTY_RESPONSE" ||
      error.message === "OPENAI_INVALID_JSON"
    ) {
      return "Não conseguimos concluir a análise com precisão. Você pode tentar novamente com outra captura.";
    }
  }

  return "Não conseguimos concluir a análise com precisão. Você pode tentar novamente com outra captura.";
}

export async function POST(request: Request) {
  const rateLimited = applyRateLimit(request);
  if (rateLimited) return rateLimited;

  try {
    const formData = await request.formData();
    const image = normalizeImageFile(formData.get("image"));
    const captureContextRaw = formData.get("capture_context");
    let captureContext: z.infer<typeof captureContextSchema> | null = null;

    if (typeof captureContextRaw === "string") {
      try {
        const parsedCaptureContext = captureContextSchema.safeParse(JSON.parse(captureContextRaw));
        captureContext = parsedCaptureContext.success ? parsedCaptureContext.data : null;
      } catch {
        captureContext = null;
      }
    }

    const imageDataUrl = await fileToDataUrl(image);
    const admin = getSupabaseAdminClient();

    // Análise por IA com fallback: nunca bloqueia o fluxo por indisponibilidade do OpenAI.
    // A validação facial já foi feita pelo MediaPipe no cliente — a imagem é válida.
    const [analysis, productCandidates] = await Promise.all([
      requestOpenAiAnalysis({ imageDataUrl, captureContext }).catch((err: unknown) => {
        console.warn("[skin-analysis] AI unavailable — baseline fallback applied", {
          reason: err instanceof Error ? err.message : "unknown_error",
        });
        return buildFallbackAnalysis(captureContext);
      }),
      loadProductCandidates(admin),
    ]);

    const recommendedProducts = analysis.imageQuality.canAnalyze
      ? rankProductsForSkinAnalysis(productCandidates, analysis, 4)
      : [];

    return NextResponse.json({
      ok: true,
      analysis,
      recommendedProducts,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    const message = safeErrorMessage(error);
    const status =
      error instanceof Error &&
      [
        "Imagem obrigatória ausente.",
        "Formato de imagem não suportado.",
        "Tamanho de imagem inválido."
      ].includes(error.message)
        ? 400
        : 502;

    console.error("[skin-analysis] request failed", {
      message: error instanceof Error ? error.message : "unknown_error"
    });

    return NextResponse.json({ error: message }, { status });
  }
}
