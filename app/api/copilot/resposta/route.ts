import { NextResponse } from "next/server";
import { z } from "zod";

import { Queue } from "bullmq";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

let _respostaQueue: Queue | null = null;
function getRespostaQueue(): Queue {
  if (!_respostaQueue) {
    _respostaQueue = new Queue("copilot-responses", {
      connection: { url: process.env.REDIS_URL ?? "redis://localhost:6379" },
    });
  }
  return _respostaQueue;
}

export const runtime = "nodejs";

// ─── Schema de validação ──────────────────────────────────────────────────────

const respostaSchema = z.object({
  interacao_id: z.string().uuid(),
  tipo_resposta: z.enum([
    "CHECKIN_ROTINA",
    "NOTA_PELE",
    "RECOMPRA_ACEITA",
    "RECOMPRA_RECUSADA",
    "SCAN_AGENDADO",
    "DESCARTADA",
  ]),
  valor: z.record(z.string(), z.unknown()),
});

// ─── Validação do payload por tipo ────────────────────────────────────────────

const valorSchemas = {
  CHECKIN_ROTINA: z.object({
    fez_rotina: z.boolean(),
    periodo: z.enum(["manha", "noite"]),
  }),
  NOTA_PELE: z.object({
    nota: z.number().int().min(1).max(5),
  }),
  RECOMPRA_ACEITA: z.object({
    produto_id: z.string().uuid(),
  }),
  RECOMPRA_RECUSADA: z.object({
    produto_id: z.string().uuid(),
  }),
  SCAN_AGENDADO: z.object({
    data_pretendida: z.string().datetime({ offset: true }).or(z.string().date()),
  }),
  DESCARTADA: z.object({}).passthrough(),
} as const;

// ─── POST /api/copilot/resposta ────────────────────────────────────────────────
//
// Registra a resposta da usuária a uma interação do copilot e enfileira o
// processamento assíncrono. Retorna em < 200ms — nenhum processamento inline.

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  // Validar body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = respostaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", detalhes: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { interacao_id, tipo_resposta, valor } = parsed.data;

  // Validar payload específico do tipo
  const valorSchema = valorSchemas[tipo_resposta];
  const valorParsed = valorSchema.safeParse(valor);
  if (!valorParsed.success) {
    return NextResponse.json(
      { error: "Valor inválido para o tipo de resposta.", detalhes: valorParsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();

  // Verificar que a interação pertence à usuária autenticada
  const { data: interacao, error: interacaoErr } = await admin
    .from("copilot_interacoes")
    .select("id, user_id, status")
    .eq("id", interacao_id)
    .eq("user_id", user.id)
    .single();

  if (interacaoErr || !interacao) {
    return NextResponse.json({ error: "Interação não encontrada." }, { status: 404 });
  }

  if (interacao.status === "RESPONDIDA") {
    return NextResponse.json({ error: "Interação já respondida." }, { status: 409 });
  }

  // INSERT resposta
  const { data: respostaRow, error: insertErr } = await admin
    .from("copilot_respostas")
    .insert({
      interacao_id,
      user_id: user.id,
      tipo_resposta,
      valor: valorParsed.data as Record<string, unknown>,
      processada: false,
    })
    .select("id")
    .single();

  if (insertErr || !respostaRow) {
    console.error("[copilot/resposta] insert error", insertErr?.message);
    return NextResponse.json({ error: "Erro ao registrar resposta." }, { status: 500 });
  }

  // UPDATE interação: RESPONDIDA
  await admin
    .from("copilot_interacoes")
    .update({ status: "RESPONDIDA", respondida_em: new Date().toISOString() })
    .eq("id", interacao_id);

  // Enfileirar processamento assíncrono — não bloqueia a resposta
  await getRespostaQueue().add(
    "processar-resposta",
    {
      resposta_id: respostaRow.id as string,
      interacao_id,
      user_id: user.id,
      tipo_resposta,
      valor: valorParsed.data as Record<string, unknown>,
    },
    {
      removeOnComplete: 20,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    }
  );

  return NextResponse.json({ ok: true, resposta_id: respostaRow.id });
}
