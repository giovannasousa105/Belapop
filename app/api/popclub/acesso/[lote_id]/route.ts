import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { verificarAcesso } from "@/lib/popclub/accessGate";

export const runtime = "nodejs";

// ─── GET /api/popclub/acesso/[lote_id] ───────────────────────────────────────
//
// Retorna o status de acesso antecipado do membro para um lote específico.
// Usado pelo frontend da PDP para exibir o countdown e o badge de tier.
//
// Resposta para cada cenário:
//   Membro Luxo com acesso: { tem_acesso: true, tier: "LUXO", tempo_restante_ms: 0 }
//   Membro sem acesso ainda: { tem_acesso: false, tier: "PREMIUM", abertura_em: "...", tempo_restante_ms: 7200000 }
//   Público sem acesso:      { tem_acesso: false, tier: "PUBLICO", abertura_em: "...", tempo_restante_ms: 86400000 }

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ lote_id: string }> }
) {
  const { lote_id } = await context.params;

  if (!lote_id) {
    return NextResponse.json({ error: "lote_id obrigatório." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const agora = new Date();

  try {
    const resultado = await verificarAcesso(
      user?.id ?? "", // string vazia → sem membro → acesso público
      lote_id,
      agora
    );

    return NextResponse.json({
      ok: true,
      tem_acesso: resultado.tem_acesso,
      tier: resultado.tier,
      abertura_em: resultado.abertura_em.toISOString(),
      tempo_restante_ms: resultado.tempo_restante_ms,
    });
  } catch (err) {
    console.error("[popclub/acesso] erro", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Erro ao verificar acesso." }, { status: 500 });
  }
}
