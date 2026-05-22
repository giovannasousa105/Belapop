import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Params = { lote_id: string; reserva_id: string };

// DELETE /api/lotes/:lote_id/reservas/:reserva_id — cancela reserva ativa
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { lote_id: loteId, reserva_id: reservaId } = await context.params;

  const admin = getSupabaseAdminClient();

  const { data: reserva, error: fetchError } = await admin
    .from("lote_reservas")
    .select("id,lote_id,quantidade,status,user_id")
    .eq("id", reservaId)
    .eq("lote_id", loteId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!reserva) {
    return NextResponse.json({ error: "reserva_not_found" }, { status: 404 });
  }
  if (reserva.status !== "ATIVA") {
    return NextResponse.json(
      { error: "reserva_not_active", status: reserva.status },
      { status: 409 }
    );
  }

  // Optimistic cancel: only succeeds if still ATIVA (guards against concurrent requests)
  const { data: cancelled } = await admin
    .from("lote_reservas")
    .update({ status: "CANCELADA" })
    .eq("id", reservaId)
    .eq("status", "ATIVA")
    .select("id")
    .maybeSingle();

  if (!cancelled) {
    return NextResponse.json({ error: "reserva_already_processed" }, { status: 409 });
  }

  // Restore qty atomically (SELECT FOR UPDATE inside the function)
  const { error: restoreError } = await admin.rpc("fn_restaurar_qtd_lote", {
    p_lote_id: loteId,
    p_quantidade: reserva.quantidade,
    p_actor_id: (reserva as { user_id?: string | null }).user_id ?? null,
    p_reserva_id: reservaId,
    p_motivo: "cancelamento_manual",
  });

  if (restoreError) {
    console.error("[lote-reservas] restore qty failed", {
      loteId,
      reservaId,
      error: restoreError.message,
    });
  }

  return NextResponse.json({ ok: true });
}
