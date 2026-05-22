import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// ─── GET /api/copilot/checkin ──────────────────────────────────────────────────
//
// Retorna as interações in_app não respondidas da usuária para o dia de hoje.
// Usado pelo widget de check-in da UI — resposta < 50ms (leitura simples).

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  // Interações entregues (in_app) nos últimos 2 dias ainda não respondidas
  const desde = new Date(Date.now() - 2 * 86400000).toISOString();

  const { data: interacoes, error } = await admin
    .from("copilot_interacoes")
    .select("id, tipo, status, payload, seed_snapshot, criado_em")
    .eq("user_id", user.id)
    .in("status", ["ENVIADA", "ENTREGUE"])
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[copilot/checkin] fetch error", error.message);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  // Marcar como LIDA as que ainda eram ENTREGUE
  const ids = (interacoes ?? [])
    .filter((i) => i.status === "ENTREGUE")
    .map((i) => i.id as string);

  if (ids.length > 0) {
    await admin
      .from("copilot_interacoes")
      .update({ status: "LIDA" })
      .in("id", ids);
  }

  return NextResponse.json({
    ok: true,
    interacoes: interacoes ?? [],
  });
}
