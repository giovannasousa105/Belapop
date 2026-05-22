import { NextResponse }             from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient }     from "@/lib/supabase/admin";
import { consumeRateLimit }           from "@/lib/security/rateLimit";
import { getRequestIp }               from "@/lib/security/request";

export const dynamic = "force-dynamic";

// Delay de processamento: 48h para permitir reflexão (LGPD permite período de cancelamento)
const DELAY_PROCESSAMENTO_MS = 48 * 60 * 60 * 1000;

export async function POST(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // ── Rate limit: 1 solicitação por hora por usuária ────────────────────────
  const ip = getRequestIp(req);
  const rl = await consumeRateLimit({
    scope:         "exclusao-conta",
    actorKey:      user.id,
    windowSeconds: 3600,
    limit:         3,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas solicitações. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((Date.parse(rl.resetAt) - Date.now()) / 1000)) } },
    );
  }

  // ── Verificar pedidos em andamento ────────────────────────────────────────
  const admin = getSupabaseAdminClient();

  const { data: pedidosAtivos } = await admin
    .from("orders")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed", "processing", "shipped"]);

  if (pedidosAtivos && pedidosAtivos.length > 0) {
    return NextResponse.json(
      {
        error:    "Pedidos em andamento.",
        mensagem: "Aguarde a conclusão ou cancelamento dos seus pedidos antes de solicitar a exclusão da conta.",
        pedidos:  pedidosAtivos.length,
      },
      { status: 409 },
    );
  }

  // ── Verificar solicitação duplicada (pendente) ────────────────────────────
  const { data: solicitacaoPendente } = await admin
    .from("lgpd_solicitacoes")
    .select("id, criado_em")
    .eq("user_id", user.id)
    .eq("tipo",    "EXCLUSAO")
    .eq("status",  "PENDENTE")
    .maybeSingle();

  if (solicitacaoPendente) {
    const prazo = new Date(
      new Date(solicitacaoPendente.criado_em as string).getTime() + DELAY_PROCESSAMENTO_MS,
    ).toISOString();

    return NextResponse.json(
      {
        mensagem: "Solicitação de exclusão já está em andamento.",
        prazo,
      },
      { status: 200 },
    );
  }

  // ── Registrar solicitação ─────────────────────────────────────────────────
  const { error: insertError } = await admin
    .from("lgpd_solicitacoes")
    .insert({
      user_id: user.id,
      tipo:    "EXCLUSAO",
      status:  "PENDENTE",
      motivo:  "Solicitação voluntária via configurações de conta.",
    });

  if (insertError) {
    console.error("[usuario/exclusao] insert:", insertError);
    return NextResponse.json({ error: "Erro ao registrar solicitação." }, { status: 500 });
  }

  // ── Retornar prazo de processamento ──────────────────────────────────────
  const prazo = new Date(Date.now() + DELAY_PROCESSAMENTO_MS).toISOString();

  return NextResponse.json({
    mensagem: "Solicitação recebida. Seus dados serão removidos em até 48 horas. " +
              "Você pode cancelar esta solicitação durante este período.",
    prazo,
  });
}

// Cancelar solicitação pendente (dentro do período de reflexão)
export async function DELETE(_req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  const { error } = await admin
    .from("lgpd_solicitacoes")
    .update({ status: "CANCELADO" })
    .eq("user_id", user.id)
    .eq("tipo",    "EXCLUSAO")
    .eq("status",  "PENDENTE");

  if (error) {
    return NextResponse.json({ error: "Erro ao cancelar." }, { status: 500 });
  }

  return NextResponse.json({ mensagem: "Solicitação de exclusão cancelada." });
}
