import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Queue } from "bullmq";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { QUEUE_NAME, type SkinScanJobPayload } from "@/jobs/skinScanWorker.types";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const DEDUP_WINDOW_MS = 5 * 60 * 1000;    // 5 minutos

function getRedisConnection() {
  return { url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379" };
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const sessionBp = cookieStore.get("belapop_anon_id")?.value ?? "";

  // Ler body — aceita JSON com image_base64 ou FormData
  let image_base64: string;
  let focos: string[];
  let consentimento: string;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const imageFile = form.get("image") as File | null;
    consentimento   = (form.get("consentimento") as string | null) ?? "";
    const focosRaw  = (form.get("focos") as string | null) ?? "[]";

    if (!imageFile) {
      return NextResponse.json({ error: "Campo image obrigatório." }, { status: 400 });
    }
    if (!["image/jpeg", "image/png"].includes(imageFile.type)) {
      return NextResponse.json({ error: "Apenas JPEG ou PNG." }, { status: 400 });
    }
    if (imageFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Imagem excede 10 MB." }, { status: 400 });
    }
    const buf = Buffer.from(await imageFile.arrayBuffer());
    image_base64 = buf.toString("base64");
    focos = JSON.parse(focosRaw) as string[];
  } else {
    // JSON com image_base64 (enviado pelo ImageCapture atual)
    let body: { image_base64?: string; focos?: string[]; consentimento?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Body inválido." }, { status: 400 });
    }
    image_base64 = body.image_base64 ?? "";
    focos        = body.focos ?? [];
    consentimento = body.consentimento ?? "";
  }

  // ── Validações obrigatórias ───────────────────────────────────────────────

  // Consentimento LGPD — obrigatório, nunca processar imagem sem ele
  if (consentimento !== "true") {
    return NextResponse.json(
      { error: "Consentimento obrigatório para processar a imagem." },
      { status: 400 }
    );
  }

  if (!image_base64) {
    return NextResponse.json({ error: "Imagem obrigatória." }, { status: 400 });
  }

  const estimatedBytes = Math.ceil((image_base64.length * 3) / 4);
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Imagem excede 10 MB." }, { status: 400 });
  }

  if (!Array.isArray(focos) || focos.length === 0) {
    return NextResponse.json(
      { error: "Selecione pelo menos um foco de cuidado." },
      { status: 400 }
    );
  }

  // ── Hash para dedup (mesmo conteúdo nos últimos 5 min) ────────────────────
  const imagem_hash = createHash("sha256").update(image_base64).digest("hex");

  const admin = getSupabaseAdminClient();
  const janelaDe = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();

  const { data: existente } = await admin
    .from("skin_scans")
    .select("id, status")
    .eq("imagem_hash", imagem_hash)
    .gte("criado_em", janelaDe)
    .in("status", ["AGUARDANDO", "PROCESSANDO_CV", "SCORING", "RECOMENDANDO", "CONCLUIDO"])
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existente) {
    // Scan idêntico recente — retornar o existente sem reprocessar
    return NextResponse.json({ scan_id: existente.id }, { status: 200 });
  }

  // ── Inserir registro ──────────────────────────────────────────────────────
  const { data: scan, error: insertErr } = await admin
    .from("skin_scans")
    .insert({
      user_id:               user?.id ?? null,
      session_bp:            sessionBp || null,
      focos_selecionados:    focos,
      imagem_hash,
      status:                "AGUARDANDO",
      consentimento_dado_em: new Date().toISOString(),
      atualizado_em:         new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertErr || !scan) {
    console.error("[skin-scan/iniciar] INSERT falhou:", insertErr?.message);
    return NextResponse.json(
      { error: "Não foi possível iniciar o scan." },
      { status: 500 }
    );
  }

  const scanId = scan.id as string;

  // ── Enfileirar job BullMQ ─────────────────────────────────────────────────
  try {
    const queue = new Queue<SkinScanJobPayload>(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });

    const job = await queue.add(
      "analisar",
      {
        scan_id:              scanId,
        image_buffer_base64:  image_base64,
        focos,
        session_bp:           sessionBp,
        user_id:              user?.id,
      },
      { jobId: scanId } // idempotência
    );

    await queue.close();

    // Salvar job_id para rastreamento
    await admin
      .from("skin_scans")
      .update({ job_id: job.id })
      .eq("id", scanId);
  } catch (err) {
    console.error("[skin-scan/iniciar] BullMQ enqueue falhou:", err);
    await admin
      .from("skin_scans")
      .update({ status: "ERRO", erro_mensagem: "fila_indisponivel" })
      .eq("id", scanId);

    return NextResponse.json(
      { error: "Serviço de processamento indisponível. Tente novamente." },
      { status: 503 }
    );
  }

  return NextResponse.json({ scan_id: scanId }, { status: 202 });
}
