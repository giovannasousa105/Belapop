import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { buildRotina, normalizeFocos } from "@/lib/skin-science";
import { enrichRotinaWithEvidence } from "@/lib/evidence";
import type {
  AchadosVisuais,
  Fototipo,
  SkinAnaliseFull,
  SkinScanResult,
  SkinScores,
  TipoPele,
} from "@/types/skin-scan";

// ── Melhoria 4.1 — Persistência silenciosa no FaceShield quando logada ────────

/**
 * Mapeia os achados do SkinScan para scores 0-100 do FaceShield.
 * Executado de forma assíncrona após retornar a resposta — falhas são ignoradas.
 */
async function persistScanIfLoggedIn(analise: SkinAnaliseFull, scanId: string): Promise<void> {
  try {
    // Importações dinâmicas para evitar bundle no edge
    const { createSupabaseServer } = await import("@/lib/supabase/server");
    const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // não logada — ignorar silenciosamente

    const admin = getSupabaseAdminClient();

    // Mapear scores 1-10 → 0-100
    const s = analise.scores;
    const a = analise.achados;

    const acneMap: Record<string, number> = {
      ativa_severa: 90, ativa_leve: 70, comedoes: 40, ausente: 10
    };
    const manchasMap: Record<string, number> = {
      hiperpigmentadas: 80, melasma: 80, pos_inflamatorias: 60, ausentes: 10
    };
    const porosMap: Record<string, number> = {
      dilatados_severos: 90, dilatados_moderados: 60, normais: 30, finos: 10
    };
    const linhasMap: Record<string, number> = {
      presentes_moderadas: 70, presentes_leves: 40, ausentes: 10
    };

    const payload = {
      hydration_score:    Math.round(s.hidratacao * 10),
      acne_score:         acneMap[a.acne ?? "ausente"] ?? 10,
      pigmentation_score: manchasMap[a.manchas ?? "ausentes"] ?? 10,
      redness_score:      Math.round(s.sensibilidade * 10),
      pore_visibility:    porosMap[a.poros ?? "normais"] ?? 30,
      wrinkle_depth:      linhasMap[a.linhasFinas ?? "ausentes"] ?? 10,
      scan_source:        "ai_scan" as const,
      metadata: {
        belapop_scan_id:  scanId,
        tipo_pele:        analise.tipoPele,
        fototipo:         analise.fototipo,
        confianca:        analise.confianca,
        modo_fallback:    analise.modoFallback,
      },
    };

    // Gravar skin_scan diretamente (sem passar pelo FaceShield — evita complexidade)
    await admin.from("skin_scans").insert({
      user_id:            user.id,
      hydration_score:    payload.hydration_score,
      acne_score:         payload.acne_score,
      pigmentation_score: payload.pigmentation_score,
      redness_score:      payload.redness_score,
      pore_visibility:    payload.pore_visibility,
      wrinkle_depth:      payload.wrinkle_depth,
      scan_source:        payload.scan_source,
      metadata:           payload.metadata,
    });
  } catch {
    // Silencioso — falha na persistência não deve quebrar o fluxo principal
  }
}

async function registerLgpdConsent(request: NextRequest): Promise<void> {
  try {
    const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const { createSupabaseServer } = await import("@/lib/supabase/server");

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const ip = getClientIp(request);
    const ipBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const ipHash = Array.from(new Uint8Array(ipBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500);
    const sessionId = request.cookies.get("session_bp")?.value?.slice(0, 128) ?? null;

    const admin = getSupabaseAdminClient();
    await admin.from("lgpd_consentimentos").insert({
      user_id: user?.id ?? null,
      session_id: sessionId,
      tipo: "BIOMETRICO_SCAN",
      acao: "CONCEDIDO",
      ip_hash: ipHash,
      user_agent: userAgent,
    });
  } catch {
    // Fire-and-forget — falha silenciosa
  }
}

export const runtime = "nodejs";
export const maxDuration = 45;

// ── Configuração ──────────────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;        // 10 MB
const MIN_IMAGE_BYTES = 10 * 1024;               // 10 KB — descarta strings aleatórias
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;    // 10 minutos
const RATE_LIMIT_MAX_REQUESTS = 10;
const CLAUDE_MODEL = "claude-sonnet-4-6";
const CLAUDE_TIMEOUT_MS = 35_000;

const requestLimitStore = new Map<string, { count: number; resetAt: number }>();
const TIPO_PELE_VALUES: TipoPele[] = ["seca", "oleosa", "mista", "normal", "sensivel"];

// ── Prompt clínico para Claude Vision ────────────────────────────────────────
// Referências: AAD 2024 Acne Guidelines, BJD 2025, Fitzpatrick Dermatology 9th ed.

const VISION_PROMPT = `Você é um sistema especializado em análise dermatológica computacional.
Analise a imagem facial fornecida e retorne uma avaliação objetiva da pele visível.
IMPORTANTE: Responda sempre em português brasileiro com acentuação correta (ã, ç, é, ó, etc.).

INSTRUÇÕES OBRIGATÓRIAS:
1. Analise APENAS o que e claramente visivel na imagem. Nao invente dados.
2. Se um aspecto nao for visivel, use o valor padrao indicado.
3. Retorne APENAS JSON valido — sem markdown, sem texto adicional, sem codigo.
4. Se nao houver rosto visivel ou a imagem for ilegivel, defina modoFallback:true.

ESTRUTURA JSON EXATA A RETORNAR:
{
  "tipoPele": "<seca|oleosa|mista|normal|sensível>",
  "subtipo": "<descricao especifica, ex: mista com zona T oleosa e bochechas normais>",
  "fototipo": <numero 1-6 segundo Fitzpatrick, ou null se não determinavel>,
  "confianca": <0-100 real, baseado na qualidade da imagem e clareza dos sinais — NAO use 55 fixo>,
  "scores": {
    "hidratação":   <1-10 — 10=muito hidratada, 1=muito desidratada. Avalie aspecto opaco vs brilho saudavel>,
    "oleosidade":   <1-10 — 10=muito oleosa. Avalie reflexo sebaceo, brilho zona T>,
    "uniformidade": <1-10 — 10=uniforme. Avalie manchas, hiperpigmentacao, eritema>,
    "textura":      <1-10 — 10=lisa. Avalie poros, irregularidades, descamacao>,
    "luminosidade": <1-10 — 10=radiante>,
    "sensibilidade":<1-10 — 10=muito sensível. Avalie eritema, rosacea, reatividade>
  },
  "achados": {
    "zonaT":        "<oleosa|mista|normal>",
    "bochechas":    "<secas|normais|oleosas>",
    "poros":        "<dilatados_severos|dilatados_moderados|normais|finos>",
    "eritema":      "<presente|leve|ausente>",
    "manchas":      "<hiperpigmentadas|melasma|pos_inflamatorias|ausentes>",
    "descamacao":   "<presente|leve|ausente>",
    "linhasFinas":  "<presentes_moderadas|presentes_leves|ausentes>",
    "acne":         "<ativa_severa|ativa_leve|comedoes|ausente>"
  },
  "observacao": "<1-2 frases objetivas descrevendo os achados principais visíveis>",
  "alertas": [],
  "modoFallback": false
}

Escala Fitzpatrick para referencia:
I=pele muito clara, sempre queima; II=clara, frequentemente queima; III=media, as vezes queima;
IV=morena clara; V=morena escura; VI=negra profunda.

IMPORTANTE: O campo "confianca" deve refletir a qualidade REAL da imagem.
Se imagem clara e rosto visivel: confianca >= 75.
Se imagem escura ou desfocada: confianca 40-60 e modoFallback:true.
Se sem rosto: confianca 0 e modoFallback:true.`;

// ── Rate limiting ─────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip")?.trim() ?? "unknown";
}

function applyRateLimit(req: NextRequest): NextResponse | null {
  const now = Date.now();
  for (const [key, value] of requestLimitStore.entries()) {
    if (value.resetAt <= now) requestLimitStore.delete(key);
  }

  const ip = getClientIp(req);
  const current = requestLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    requestLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Limite temporario atingido. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }
  current.count += 1;
  return null;
}

// ── Utilitários ───────────────────────────────────────────────────────────────

function estimateBase64Bytes(base64: string): number {
  return Math.floor((base64.replace(/=+$/, "").length * 3) / 4);
}

function cleanBase64(value: string): { mimeType: string; base64: string } {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { mimeType: "image/jpeg", base64: value };
  return { mimeType: match[1] ?? "image/jpeg", base64: match[2] ?? "" };
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function pickEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
  const normalized = normalizeText(value);
  return allowed.includes(normalized as T[number]) ? (normalized as T[number]) : fallback;
}

function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("INVALID_JSON_IN_RESPONSE");
  return JSON.parse(match[0]) as unknown;
}

// ── Parsers tipados ───────────────────────────────────────────────────────────

function inferTipoPele(focos: string[]): TipoPele {
  const norm = normalizeFocos(focos);
  if (norm.includes("oleosidade") || norm.includes("poros") || norm.includes("acne")) return "oleosa";
  if (norm.includes("sensibilidade")) return "sensivel";
  if (norm.includes("hidratação")) return "seca";
  return "mista";
}

function parseTipoPele(value: unknown, focos: string[]): TipoPele {
  const normalized = normalizeText(value);
  if (normalized === "sensivel" || normalized === "sensivel") return "sensivel";
  if (TIPO_PELE_VALUES.includes(normalized as TipoPele)) return normalized as TipoPele;
  return inferTipoPele(focos);
}

function parseFototipo(value: unknown): Fototipo | null {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/\D/g, ""));
  return [1, 2, 3, 4, 5, 6].includes(n) ? (n as Fototipo) : null;
}

function parseScores(scores: unknown): SkinScores {
  const s =
    scores && typeof scores === "object" ? (scores as Record<string, unknown>) : {};
  return {
    hidratacao:   clampNumber(s.hidratacao, 1, 10, 6),
    oleosidade:   clampNumber(s.oleosidade, 1, 10, 6),
    uniformidade: clampNumber(s.uniformidade, 1, 10, 6),
    textura:      clampNumber(s.textura, 1, 10, 6),
    luminosidade: clampNumber(s.luminosidade, 1, 10, 6),
    sensibilidade:clampNumber(s.sensibilidade, 1, 10, 5),
  };
}

function parseAchados(achados: unknown): AchadosVisuais {
  const a =
    achados && typeof achados === "object" ? (achados as Record<string, unknown>) : {};
  return {
    zonaT:     pickEnum(a.zonaT,      ["oleosa", "mista", "normal"] as const, "normal"),
    bochechas: pickEnum(a.bochechas,  ["secas", "normais", "oleosas"] as const, "normais"),
    poros:     pickEnum(a.poros,      ["dilatados_severos", "dilatados_moderados", "normais", "finos"] as const, "normais"),
    eritema:   pickEnum(a.eritema,    ["presente", "leve", "ausente"] as const, "ausente"),
    manchas:   pickEnum(a.manchas,    ["hiperpigmentadas", "melasma", "pos_inflamatorias", "ausentes"] as const, "ausentes"),
    descamacao:pickEnum(a.descamacao, ["presente", "leve", "ausente"] as const, "ausente"),
    linhasFinas:pickEnum(a.linhasFinas,["presentes_moderadas", "presentes_leves", "ausentes"] as const, "ausentes"),
    acne:      pickEnum(a.acne,       ["ativa_severa", "ativa_leve", "comedoes", "ausente"] as const, "ausente"),
  };
}

function parseVisionPayload(raw: unknown, focos: string[], forcedFallback: boolean): SkinAnaliseFull {
  const p = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rawConfianca = clampNumber(p.confianca, 0, 100, 70);
  const modoFallback = forcedFallback || p.modoFallback === true || rawConfianca < 45;
  const alertas = Array.isArray(p.alertas)
    ? p.alertas.filter((x): x is string => typeof x === "string")
    : [];

  return {
    tipoPele: parseTipoPele(p.tipoPele, focos),
    subtipo:
      typeof p.subtipo === "string" && p.subtipo.trim() ? p.subtipo.trim() : undefined,
    fototipo: parseFototipo(p.fototipo),
    confianca: modoFallback
      ? Math.min(rawConfianca, 60)
      : rawConfianca,
    scores: parseScores(p.scores),
    achados: parseAchados(p.achados),
    observacao:
      typeof p.observacao === "string" && p.observacao.trim()
        ? p.observacao.trim()
        : "Análise visual estruturada concluida com base nos sinais dermatologicos identificados.",
    alertas:
      modoFallback && alertas.length === 0
        ? ["Visibilidade insuficiente para análise completa."]
        : alertas,
    modoFallback,
  };
}

// ── Fallback inteligente (acionado APENAS quando análise real falha) ────────────

function buildFallbackAnalise(focos: string[], alertas: string[]): SkinAnaliseFull {
  const tipoPele = inferTipoPele(focos);
  const norm = normalizeFocos(focos);

  // Scores ajustados pelos focos selecionados — mais informativo que todos-6
  const scores: SkinScores = {
    hidratacao:   norm.includes("hidratação") ? 4 : 6,
    oleosidade:   norm.includes("oleosidade") ? 8 : 5,
    uniformidade: norm.includes("manchas") ? 5 : 7,
    textura:      norm.includes("textura") || norm.includes("poros") ? 5 : 7,
    luminosidade: norm.includes("luminosidade") || norm.includes("brilho") ? 4 : 6,
    sensibilidade:norm.includes("sensibilidade") ? 7 : 4,
  };

  return {
    tipoPele,
    subtipo: `${tipoPele} — rotina gerada pelos focos selecionados`,
    fototipo: null,
    confianca: 55,
    scores,
    achados: {
      zonaT:      tipoPele === "oleosa" || tipoPele === "mista" ? "mista" : "normal",
      bochechas:  tipoPele === "seca" ? "secas" : "normais",
      poros:      norm.includes("poros") ? "dilatados_moderados" : "normais",
      eritema:    norm.includes("sensibilidade") ? "leve" : "ausente",
      manchas:    norm.includes("manchas") ? "hiperpigmentadas" : "ausentes",
      descamacao: norm.includes("hidratação") ? "leve" : "ausente",
      linhasFinas:norm.includes("linhas_finas") || norm.includes("linhas") ? "presentes_leves" : "ausentes",
      acne:       norm.includes("acne") ? "comedoes" : "ausente",
    },
    observacao:
      "A leitura visual não ficou conclusiva. A rotina foi personalizada pelos focos informados e prioriza passos seguros de limpeza, barreira e fotoproteção.",
    alertas,
    modoFallback: true,
  };
}

function buildResult(focos: string[], analise: SkinAnaliseFull): SkinScanResult {
  const rotinaRaw = buildRotina(
    analise.tipoPele,
    focos,
    analise.achados as Record<string, string>
  );

  // Enriquecer passos com evidência do banco local (zero latência)
  const rotina = {
    manha:   enrichRotinaWithEvidence(rotinaRaw.manha   ?? []),
    noite:   enrichRotinaWithEvidence(rotinaRaw.noite   ?? []),
    semanal: enrichRotinaWithEvidence(rotinaRaw.semanal ?? []),
    ...(rotinaRaw.semana1?.length
      ? { semana1: enrichRotinaWithEvidence(rotinaRaw.semana1) }
      : {}),
  };

  return {
    scanId:    `BP-${Date.now().toString(36).toUpperCase()}`,
    timestamp: Date.now(),
    focos,
    analise,
    rotina,
  };
}

// ── Backend de visão: Claude claude-sonnet-4-5 (Anthropic) ────────────────────────────

async function callClaudeVision(
  imageBase64: string,
  mimeType: string,
  focos: string[],
  apiKey: string
): Promise<string> {
  const sizeKb = Math.round((imageBase64.length * 3) / 4 / 1024);
  console.log(`[skin-scan/analyze] Imagem: ${sizeKb}KB, mime: ${mimeType}, modelo: ${CLAUDE_MODEL}`);

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  // Personalizar o prompt com os focos da usuária
  const focosStr = focos.length > 0 ? focos.join(", ") : "hidratacao, textura geral";
  const promptWithFocos = `${VISION_PROMPT}

FOCOS DE PREOCUPACAO DA USUARIO: ${focosStr}
Priorize esses aspectos na sua analise e reflita-os nos scores relevantes.`;

  const message = await Promise.race([
    client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: promptWithFocos,
            },
          ],
        },
      ],
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("CLAUDE_TIMEOUT")), CLAUDE_TIMEOUT_MS)
    ),
  ]);

  const block = message.content[0];
  if (!block || block.type !== "text") throw new Error("CLAUDE_EMPTY_RESPONSE");
  return block.text;
}

// ── Leitura e validação do payload da requisição ──────────────────────────────

type PayloadOk = { imageBase64: string; mimeType: string; focos: string[]; consentimento: string };
type PayloadError = { error: string; status: 400 | 413 };

async function readPayload(request: NextRequest): Promise<PayloadOk | PayloadError> {
  const contentType = request.headers.get("content-type") ?? "";
  let imageBase64 = "";
  let mimeType = "image/jpeg";
  let focos: string[] = [];
  let consentimento = "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");

      if (!(file instanceof File)) {
        return { error: "Campo 'image' obrigatorio.", status: 400 };
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return { error: "Imagem excede 10 MB.", status: 413 };
      }
      if (file.size < MIN_IMAGE_BYTES) {
        return { error: "Imagem muito pequena ou invalida (minimo 10 KB).", status: 400 };
      }

      mimeType = file.type || "image/jpeg";
      imageBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");

      const focosRaw = formData.get("focos");
      if (typeof focosRaw === "string") {
        try {
          const parsed = JSON.parse(focosRaw) as unknown;
          if (Array.isArray(parsed)) {
            focos = parsed.filter((x): x is string => typeof x === "string");
          }
        } catch { /* ignora focos malformados */ }
      }
      consentimento = String(formData.get("consentimento") ?? "");
    } else {
      const body = (await request.json()) as {
        image_base64?: string;
        image?: string;
        focos?: unknown;
        mime_type?: string;
        consentimento?: string;
      };

      const rawImage = body.image_base64 ?? body.image ?? "";

      if (!rawImage) {
        return { error: "Campo 'image_base64' obrigatorio.", status: 400 };
      }

      // Validar se é um data URL de imagem real ou base64 puro
      const isDataUrl = rawImage.startsWith("data:image/");
      const isLikelyBase64 = /^[A-Za-z0-9+/=]{100,}/.test(rawImage);
      if (!isDataUrl && !isLikelyBase64) {
        return { error: "Imagem invalida. Envie um data URL (data:image/...) ou base64 puro.", status: 400 };
      }

      const cleaned = cleanBase64(rawImage);
      imageBase64 = cleaned.base64;
      mimeType = body.mime_type ?? cleaned.mimeType ?? "image/jpeg";

      const estimatedBytes = estimateBase64Bytes(imageBase64);
      if (estimatedBytes > MAX_IMAGE_BYTES) {
        return { error: "Imagem excede 10 MB.", status: 413 };
      }
      if (estimatedBytes < MIN_IMAGE_BYTES) {
        return {
          error: "Imagem muito pequena ou invalida. Certifique-se de que a foto foi capturada corretamente.",
          status: 400,
        };
      }

      if (Array.isArray(body.focos)) {
        focos = body.focos.filter((x): x is string => typeof x === "string");
      }
      consentimento = body.consentimento ?? "";
    }
  } catch (e) {
    console.error("[skin-scan/analyze] Erro ao ler payload:", e);
    return { error: "Payload invalido.", status: 400 };
  }

  // Normalizar MIME type para tipos aceitos pelo Claude
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedMimes.includes(mimeType)) mimeType = "image/jpeg";

  return { imageBase64, mimeType, focos: normalizeFocos(focos), consentimento };
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const rateLimited = applyRateLimit(request);
  if (rateLimited) return rateLimited;

  // 2. Parse e validação de entrada
  const payload = await readPayload(request);
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: payload.status });
  }
  const { imageBase64, mimeType, focos, consentimento } = payload;

  // 2b. Consentimento LGPD obrigatório (art. 11 — dado biométrico sensível)
  if (consentimento !== "true") {
    return NextResponse.json(
      { error: "Consentimento obrigatório para processar a imagem." },
      { status: 400 }
    );
  }

  // 3. Verificar se a chave Anthropic está configurada
  // Aceita tanto ANTHROPIC_API_KEY quanto OPENAI_API_KEY (alias para quem salvou com esse nome)
  const anthropicKey = process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!anthropicKey) {
    console.warn("[skin-scan/analyze] Nenhuma chave de API configurada — usando fallback.");
    const analise = buildFallbackAnalise(focos, [
      "Servico de análise visual não configurado. Rotina gerada pelos focos selecionados.",
    ]);
    return NextResponse.json({ success: true, analysis: buildResult(focos, analise) });
  }

  // 4. Análise visual com Claude claude-sonnet-4-5
  try {
    console.log(`[skin-scan/analyze] Chamando Claude Vision — focos: [${focos.join(", ")}], mime: ${mimeType}`);

    const rawText = await callClaudeVision(imageBase64, mimeType, focos, anthropicKey);

    // Extrair e parsear JSON retornado pelo modelo
    let visionPayload: unknown;
    try {
      visionPayload = extractJson(rawText);
    } catch {
      console.error("[skin-scan/analyze] Claude retornou resposta nao-JSON:", rawText.slice(0, 200));
      throw new Error("VISION_JSON_PARSE_FAILED");
    }

    const analise = parseVisionPayload(visionPayload, focos, false);
    const result = buildResult(focos, analise);

    console.log(
      `[skin-scan/analyze] Análise concluida — tipoPele: ${analise.tipoPele}, confianca: ${analise.confianca}%, fallback: ${analise.modoFallback}`
    );

    // Melhoria 4.1 — Persistir no backend se logada + registrar consentimento LGPD
    void Promise.race([
      persistScanIfLoggedIn(analise, result.scanId),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]).catch(() => { /* garantia extra — nenhum erro vaza */ });

    void Promise.race([
      registerLgpdConsent(request),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ]).catch(() => {});

    return NextResponse.json({ success: true, analysis: result });
  } catch (err) {
    // 5. Fallback inteligente apenas quando a análise real falha
    const isTimeout = err instanceof Error && err.message.includes("TIMEOUT");
    const isAuthError = err instanceof Error && (err.message.includes("401") || err.message.includes("authentication") || err.message.includes("invalid_api_key") || err.message.includes("auth"));
    const errorMsg = isTimeout
      ? "Análise visual excedeu o tempo limite. Rotina gerada pelos focos selecionados."
      : "Não foi possível concluir a leitura visual. Rotina gerada pelos focos selecionados.";

    console.error("[skin-scan/analyze] ERRO tipo:", isTimeout ? "TIMEOUT" : isAuthError ? "AUTH_INVALID_KEY" : "UNKNOWN");
    console.error("[skin-scan/analyze] Mensagem:", err instanceof Error ? err.message : String(err));
    if (err instanceof Error && (err as NodeJS.ErrnoException).cause) {
      console.error("[skin-scan/analyze] Causa:", (err as NodeJS.ErrnoException).cause);
    }

    const analise = buildFallbackAnalise(focos, [errorMsg]);
    const result = buildResult(focos, analise);

    // Retorna 200 com fallback (não quebra o frontend) mas sinaliza modoFallback:true
    return NextResponse.json({ success: true, analysis: result });
  }
}
