import { NextRequest, NextResponse } from "next/server";

import { posthogServer } from "@/lib/analytics/posthog";
import { captureError } from "@/lib/analytics/sentry";
import type { ReservarLoteRequest } from "@/lib/lote/types";
import { expirarReservasVencidas } from "@/lib/lote/loteService";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ lote_id: string }> }
) {
  const { lote_id: loteId } = await context.params;

  let body: ReservarLoteRequest;
  try {
    body = (await request.json()) as ReservarLoteRequest;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const { session_id, quantidade, user_id } = body;

  if (!session_id || typeof session_id !== "string" || session_id.trim().length === 0) {
    return NextResponse.json({ error: "session_id obrigatório." }, { status: 400 });
  }

  const qty = Number(quantidade);
  if (!Number.isInteger(qty) || qty < 1) {
    return NextResponse.json({ error: "quantidade deve ser inteiro positivo." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  // Libera reservas expiradas antes de verificar disponibilidade.
  // Substitui cron horário (bloqueado no Hobby) — cada checkout aciona a limpeza.
  await expirarReservasVencidas(20).catch(() => {});

  const { data, error } = await admin.rpc("fn_reservar_lote", {
    p_lote_id: loteId,
    p_session_id: session_id.trim(),
    p_quantidade: qty,
    p_user_id: user_id ?? null,
    // TTL de 60min: limitado pelo plano Hobby do Vercel (cron mínimo = 1h)
    // Para TTL de 15min, fazer upgrade para Pro e restaurar p_expira_minutos: 15
    p_expira_minutos: 60,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as {
    ok: boolean;
    error?: string;
    status?: string;
    disponivel?: number;
    reserva_id?: string;
    expira_em?: string;
    qtd_disponivel?: number;
  };

  if (!result.ok) {
    const statusMap: Record<string, number> = {
      lote_not_found: 404,
      lote_not_available: 409,
      quantidade_insuficiente: 409,
    };
    const httpStatus = statusMap[result.error ?? ""] ?? 422;
    return NextResponse.json({ error: result.error, detail: result }, { status: httpStatus });
  }

  try {
    const { data: lote } = await admin
      .from("lotes")
      .select("produto_id")
      .eq("id", loteId)
      .maybeSingle();

    await posthogServer.capture({
      distinctId: user_id ?? `anon_${session_id.trim()}`,
      event: "reserva_criada",
      properties: {
        lote_id: loteId,
        produto_id:
          lote && typeof lote.produto_id === "string" ? lote.produto_id : null,
        urgencia: "none",
        tem_popclub: false,
        tem_scan: false
      }
    });
  } catch (analyticsError) {
    captureError(analyticsError, {
      route: "/api/lotes/[lote_id]/reservar",
      etapa: "posthog_reserva_criada",
      lote_id: loteId
    });
  } finally {
    await posthogServer.shutdown();
  }

  return NextResponse.json(
    {
      reserva_id: result.reserva_id,
      expira_em: result.expira_em,
      qtd_disponivel: result.qtd_disponivel,
    },
    { status: 201 }
  );
}
