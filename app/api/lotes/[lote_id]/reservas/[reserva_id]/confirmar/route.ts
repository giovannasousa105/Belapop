import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Params = { lote_id: string; reserva_id: string };

type ConfirmarBody = {
  pedido_id: string;
  actor_id?: string;
};

// POST /api/lotes/:lote_id/reservas/:reserva_id/confirmar
// Chamado no webhook de pagamento confirmado (Stripe).
// Idempotente: chamadas repetidas com a mesma reserva retornam ok.
export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { lote_id: loteId, reserva_id: reservaId } = await context.params;

  let body: ConfirmarBody;
  try {
    body = (await request.json()) as ConfirmarBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  if (!body.pedido_id || typeof body.pedido_id !== "string") {
    return NextResponse.json({ error: "pedido_id obrigatório." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  const { data, error } = await admin.rpc("fn_confirmar_venda_lote", {
    p_lote_id: loteId,
    p_reserva_id: reservaId,
    p_pedido_id: body.pedido_id,
    p_actor_id: body.actor_id ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as { ok: boolean; error?: string; status?: string; idempotent?: boolean };

  if (!result.ok) {
    const statusMap: Record<string, number> = {
      reserva_not_found: 404,
      reserva_not_active: 409,
    };
    const httpStatus = statusMap[result.error ?? ""] ?? 422;
    return NextResponse.json({ error: result.error, detail: result }, { status: httpStatus });
  }

  return NextResponse.json({ ok: true, idempotent: result.idempotent ?? false });
}
