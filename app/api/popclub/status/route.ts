import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PopclubMembro, PopclubCredito } from "@/lib/popclub/popclubTypes";

export const runtime = "nodejs";

// ─── GET /api/popclub/status ──────────────────────────────────────────────────
//
// Retorna o status completo do membro: tier, pontos, créditos disponíveis
// e histórico recente de transações.

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  const [membroResult, transacoesResult] = await Promise.all([
    admin
      .from("popclub_membros")
      .select("*")
      .eq("user_id", user.id)
      .eq("ativo", true)
      .single(),

    admin
      .from("popclub_transacoes")
      .select("tipo, pontos, saldo_apos, descricao, criado_em")
      .eq("user_id", user.id)
      .order("criado_em", { ascending: false })
      .limit(20),
  ]);

  if (!membroResult.data) {
    return NextResponse.json({
      ok: true,
      membro: null,
      mensagem: "Usuária ainda não é membro do PopClub.",
    });
  }

  const membro = membroResult.data as PopclubMembro;

  const { data: creditosData } = await admin
    .from("popclub_creditos")
    .select("id, valor_brl, stripe_coupon_id, status, expira_em")
    .eq("membro_id", membro.id)
    .eq("status", "DISPONIVEL")
    .order("expira_em", { ascending: true });

  const creditos = (creditosData ?? []) as PopclubCredito[];

  return NextResponse.json({
    ok: true,
    membro: {
      tier_atual: membro.tier_atual,
      tier_anterior: membro.tier_anterior,
      pontos_disponiveis: membro.pontos_disponiveis,
      pontos_acumulados_12m: membro.pontos_acumulados_12m,
      creditos_disponiveis: membro.creditos_disponiveis,
      data_entrada: membro.data_entrada,
      data_avaliacao_tier: membro.data_avaliacao_tier,
      data_rebaixamento_aviso: membro.data_rebaixamento_aviso,
    },
    transacoes: transacoesResult.data ?? [],
    creditos_ativos: creditos.map((c) => ({
      id: c.id,
      valor_brl: c.valor_brl,
      stripe_coupon_id: c.stripe_coupon_id,
      expira_em: c.expira_em,
    })),
  });
}
