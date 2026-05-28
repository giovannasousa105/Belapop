import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID do pedido obrigatório." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Autenticação obrigatória." }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("payment_status, payment_intent_id")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[orders/payment-status] query error", error.message);
    return NextResponse.json({ error: "Erro ao consultar o pedido." }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    status: order.payment_status ?? "pending",
    paymentIntentId: order.payment_intent_id ?? null,
  });
}
