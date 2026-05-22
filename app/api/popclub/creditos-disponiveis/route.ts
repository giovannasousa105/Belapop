import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// ─── GET /api/popclub/creditos-disponiveis ────────────────────────────────────
//
// Retorna créditos BRL disponíveis + pontos do membro.
// Usado pelo CreditoPopClub no checkout.

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ creditos: [], pontos_disponiveis: 0 });
  }

  const admin = getSupabaseAdminClient();

  const { data: membro } = await admin
    .from("popclub_membros")
    .select("id, pontos_disponiveis")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .single();

  if (!membro) {
    return NextResponse.json({ creditos: [], pontos_disponiveis: 0 });
  }

  const { data: creditos } = await admin
    .from("popclub_creditos")
    .select("id, valor_brl, stripe_coupon_id, expira_em")
    .eq("membro_id", (membro as { id: string; pontos_disponiveis: number }).id)
    .eq("status", "DISPONIVEL")
    .order("expira_em", { ascending: true });

  return NextResponse.json({
    creditos: creditos ?? [],
    pontos_disponiveis: (membro as { id: string; pontos_disponiveis: number }).pontos_disponiveis,
  });
}
