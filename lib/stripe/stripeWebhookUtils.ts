import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// ─── Idempotency ──────────────────────────────────────────────────────────────

/**
 * Atomically marks a Stripe event as processed.
 * Returns { skip: true } if the event was already processed.
 * Returns { skip: false } if this is the first time — proceed with handling.
 *
 * Uses INSERT … ON CONFLICT DO NOTHING; if count == 0 the row already existed.
 */
export async function checkAndMarkIdempotency(
  eventId: string,
  eventType: string,
  resultado: Record<string, unknown> = {}
): Promise<{ skip: boolean }> {
  const admin = getSupabaseAdminClient();

  const { count, error } = await admin
    .from("stripe_eventos_processados")
    .insert({ stripe_event_id: eventId, event_type: eventType, resultado })
    .select("stripe_event_id");

  if (error) {
    // Unique violation (23505) = already processed
    if (error.code === "23505") return { skip: true };
    // Table missing = migration not applied yet, skip gracefully
    if (error.code === "42P01") {
      console.warn("[stripe-webhook] stripe_eventos_processados missing — idempotency disabled");
      return { skip: false };
    }
    throw new Error(`stripe_eventos_processados insert failed: ${error.message}`);
  }

  return { skip: (count ?? 0) === 0 };
}

// ─── Lote reservation helpers ────────────────────────────────────────────────

type LoteReservaRow = {
  id: string;
  lote_id: string;
  quantidade: number;
  status: string;
  user_id: string | null;
  produto_id?: string | null;
};

/**
 * Looks up the active lote_reserva linked to a PaymentIntent.
 * Returns null if not found or already processed.
 */
export async function findReservaPorPaymentIntent(
  paymentIntentId: string
): Promise<LoteReservaRow | null> {
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from("lote_reservas")
    .select("id,lote_id,quantidade,status,user_id")
    .eq("payment_intent_id", paymentIntentId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "42703") return null; // column not yet migrated
    throw new Error(`lote_reservas lookup failed: ${error.message}`);
  }

  return data as LoteReservaRow | null;
}

/**
 * Confirms a lote reservation as a completed sale.
 * Delegates to fn_confirmar_venda_lote (SELECT FOR UPDATE inside PL/pgSQL).
 * Idempotent: returns ok=true if already CONFIRMADA.
 */
export async function confirmarLoteReserva(args: {
  loteId: string;
  reservaId: string;
  pedidoId: string;
  actorId?: string | null;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin.rpc("fn_confirmar_venda_lote", {
    p_lote_id: args.loteId,
    p_reserva_id: args.reservaId,
    p_pedido_id: args.pedidoId,
    p_actor_id: args.actorId ?? null,
  });

  if (error) {
    throw new Error(`fn_confirmar_venda_lote failed: ${error.message}`);
  }

  const result = data as { ok: boolean; error?: string; idempotent?: boolean };

  if (!result.ok && result.error === "reserva_not_found") {
    // Reservation may have been deleted — not a critical error
    return { ok: false, skipped: true };
  }

  return { ok: result.ok, skipped: result.idempotent };
}

/**
 * Releases a lote reservation back to available stock.
 * Safe to call even if the reserva is already EXPIRADA or CANCELADA.
 */
export async function liberarLoteReserva(args: {
  paymentIntentId: string;
  motivo: string;
  eventId: string;
}): Promise<{ ok: boolean; skipped: boolean }> {
  const reserva = await findReservaPorPaymentIntent(args.paymentIntentId);

  if (!reserva) return { ok: true, skipped: true };
  if (reserva.status !== "ATIVA") return { ok: true, skipped: true };

  const admin = getSupabaseAdminClient();

  // Optimistic cancel — only proceeds if status is still ATIVA
  const { data: cancelled } = await admin
    .from("lote_reservas")
    .update({ status: "CANCELADA" })
    .eq("id", reserva.id)
    .eq("status", "ATIVA")
    .select("id")
    .maybeSingle();

  if (!cancelled) return { ok: true, skipped: true }; // race: already changed

  // Restore qty atomically
  const { error: restoreError } = await admin.rpc("fn_restaurar_qtd_lote", {
    p_lote_id: reserva.lote_id,
    p_quantidade: reserva.quantidade,
    p_actor_id: reserva.user_id ?? null,
    p_reserva_id: reserva.id,
    p_motivo: args.motivo,
  });

  if (restoreError) {
    console.error("[stripe-webhook] fn_restaurar_qtd_lote failed", {
      reservaId: reserva.id,
      motivo: args.motivo,
      error: restoreError.message,
    });
  }

  return { ok: true, skipped: false };
}

/**
 * Records a lote event without touching quantities.
 * Used for refund audit trail.
 */
export async function registrarEventoLote(args: {
  loteId: string;
  tipo: "VENDA" | "RESERVA" | "LIBERACAO" | "TRANSICAO";
  deltaQtd?: number;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = getSupabaseAdminClient();

  const { error } = await admin.from("lote_eventos").insert({
    lote_id: args.loteId,
    tipo: args.tipo,
    status_anterior: null,
    status_novo: null,
    delta_qtd: args.deltaQtd ?? 0,
    actor_id: args.actorId ?? null,
    metadata: args.metadata ?? {},
  });

  if (error && error.code !== "42P01") {
    console.warn("[stripe-webhook] lote_eventos insert failed", error.message);
  }
}

// ─── Structured logging ───────────────────────────────────────────────────────

export function logWebhookEvent(
  level: "info" | "warn" | "error",
  stripeEventId: string,
  eventType: string,
  message: string,
  extra?: Record<string, unknown>
) {
  const entry = {
    ts: new Date().toISOString(),
    stripe_event_id: stripeEventId,
    event_type: eventType,
    message,
    ...extra,
  };
  if (level === "error") console.error(JSON.stringify(entry));
  else if (level === "warn") console.warn(JSON.stringify(entry));
  else console.info(JSON.stringify(entry));
}
