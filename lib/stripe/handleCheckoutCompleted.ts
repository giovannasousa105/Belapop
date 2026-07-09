import type Stripe from "stripe";

import { buildShortOrderCode } from "@/lib/orders/orderReference";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { enviarPedidoConfirmado } from "@/lib/crm/flows/transacionais";
import { getStripe } from "./stripeClient";
import {
  checkAndMarkIdempotency,
  confirmarLoteReserva,
  logWebhookEvent,
} from "./stripeWebhookUtils";

const REEMBOLSO_AUTOMATICO_ENABLED =
  process.env.REEMBOLSO_AUTOMATICO_ENABLED !== "false";

// ─── Criar pedido + email após venda de lote confirmada ──────────────────────

async function criarPedidoLote(args: {
  session: Stripe.Checkout.Session;
  userId: string;
  produtoId: string | undefined;
  quantidade: number;
  stripeEventId: string;
}): Promise<void> {
  const { session, userId, produtoId, quantidade, stripeEventId } = args;
  try {
    const admin = getSupabaseAdminClient();

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

    const totalCents = session.amount_total ?? 0;

    // Busca info do produto para itens do email
    const productResult = produtoId
      ? await admin
          .from("products")
          .select("title, hero_image_url, seller_id")
          .eq("id", produtoId)
          .maybeSingle()
      : { data: null };
    const product = productResult.data;

    // Cria registro de pedido
    const { data: newOrder, error: orderError } = await admin
      .from("orders")
      .insert({
        customer_id: userId,
        total_products_cents: totalCents,
        total_shipping_cents: 0,
        total_order_cents: totalCents,
        total_cents: totalCents,
        status: "paid",
        payment_status: "paid",
        payment_provider: "stripe",
        payment_intent_id: paymentIntentId,
      })
      .select("id")
      .single();

    if (orderError || !newOrder) {
      logWebhookEvent("warn", stripeEventId, "checkout.session.completed",
        "criarPedidoLote: order insert failed", { error: orderError?.message });
      return;
    }

    // Cria item do pedido
    if (produtoId) {
      await admin.from("order_items").insert({
        order_id: newOrder.id,
        product_id: produtoId,
        seller_id: product?.seller_id ?? null,
        quantity: quantidade,
        price_cents: totalCents,
        total_cents: totalCents,
      });
    }

    // Busca email do cliente (prefere session, fallback para profiles)
    const customerEmail =
      session.customer_email ??
      (await admin.from("profiles").select("email").eq("id", userId).maybeSingle()).data?.email;

    if (!customerEmail) return;

    const numeroPedido = buildShortOrderCode(newOrder.id);

    void enviarPedidoConfirmado({
      user_id: userId,
      email: customerEmail,
      pedido_id: newOrder.id,
      numero_pedido: numeroPedido,
      itens: produtoId
        ? [{ nome: product?.title ?? "Produto", foto: (product?.hero_image_url ?? null) as string | null, slug: produtoId, preco_brl: totalCents / 100, quantidade }]
        : [],
      subtotal_brl: totalCents / 100,
      frete_brl: 0,
      total_brl: totalCents / 100,
    }).catch((err: unknown) => {
      logWebhookEvent("warn", stripeEventId, "checkout.session.completed",
        "criarPedidoLote: email dispatch failed",
        { error: err instanceof Error ? err.message : String(err) });
    });
  } catch (err) {
    logWebhookEvent("warn", stripeEventId, "checkout.session.completed",
      "criarPedidoLote: unexpected error",
      { error: err instanceof Error ? err.message : String(err) });
  }
}

// ─── Metadata guard ───────────────────────────────────────────────────────────

type CheckoutMeta = {
  reserva_id: string;
  lote_id: string;
  user_id: string;
  produto_id?: string;
};

function extractMeta(session: Stripe.Checkout.Session): CheckoutMeta | null {
  const m = session.metadata ?? {};
  if (!m.reserva_id || !m.lote_id || !m.user_id) return null;
  return {
    reserva_id: m.reserva_id,
    lote_id: m.lote_id,
    user_id: m.user_id,
    produto_id: m.produto_id ?? undefined,
  };
}

// ─── Automatic refund on sold-out race ───────────────────────────────────────

async function emitirReembolsoAutomatico(args: {
  session: Stripe.Checkout.Session;
  loteId: string;
  produtoId: string | undefined;
  userId: string;
  stripeEventId: string;
}) {
  if (!REEMBOLSO_AUTOMATICO_ENABLED) {
    logWebhookEvent("warn", args.stripeEventId, "checkout.session.completed",
      "reembolso_automatico_disabled — action required manually",
      { lote_id: args.loteId });
    return;
  }

  const stripe = getStripe();
  const paymentIntentId =
    typeof args.session.payment_intent === "string"
      ? args.session.payment_intent
      : (args.session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  if (!paymentIntentId) {
    logWebhookEvent("error", args.stripeEventId, "checkout.session.completed",
      "reembolso_automatico_skipped: no payment_intent_id", { lote_id: args.loteId });
    return;
  }

  try {
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: "duplicate",
      metadata: {
        motivo: "lote_esgotado_durante_checkout",
        lote_id: args.loteId,
        stripe_event_id: args.stripeEventId,
      },
    });
  } catch (err) {
    logWebhookEvent("error", args.stripeEventId, "checkout.session.completed",
      "reembolso_automatico stripe.refunds.create failed",
      { error: err instanceof Error ? err.message : String(err), lote_id: args.loteId });
    return;
  }

  // Add to waitlist automatically
  const admin = getSupabaseAdminClient();
  if (args.produtoId) {
    try {
      await admin.from("lote_lista_espera").upsert(
        {
          lote_id: args.loteId,
          produto_id: args.produtoId,
          email: args.session.customer_email ?? "",
          user_id: args.userId,
          origem: "reembolso_automatico",
          criado_em: new Date().toISOString(),
        },
        { onConflict: "email,produto_id", ignoreDuplicates: false }
      );
    } catch {
      // best-effort: don't block refund on waitlist failure
    }
  }

  logWebhookEvent("info", args.stripeEventId, "checkout.session.completed",
    "reembolso_automatico_emitido", {
      lote_id: args.loteId,
      payment_intent_id: paymentIntentId,
    });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * Handles checkout.session.completed:
 * — Confirms the lote reservation as a completed sale.
 * — If reservation expired but stock still exists: sells directly.
 * — If reservation expired and no stock: triggers automatic refund.
 *
 * NOTE: The existing project uses PaymentIntents directly, so this handler
 * fires only when the frontend uses Stripe Checkout Sessions. Both paths
 * (session.completed + payment_intent.succeeded) are guarded by idempotency.
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripeEventId: string
): Promise<void> {
  const meta = extractMeta(session);
  if (!meta) {
    logWebhookEvent("warn", stripeEventId, "checkout.session.completed",
      "metadata_incompleto — reserva_id, lote_id ou user_id ausente",
      { session_id: session.id });
    return; // can't fix metadata — log and move on
  }

  const { reserva_id, lote_id, user_id, produto_id } = meta;

  // Idempotency: prevent double-sale on retry
  const { skip } = await checkAndMarkIdempotency(stripeEventId, "checkout.session.completed");
  if (skip) {
    logWebhookEvent("info", stripeEventId, "checkout.session.completed",
      "evento_ja_processado", { reserva_id });
    return;
  }

  const admin = getSupabaseAdminClient();

  // Read current reservation state
  const { data: reserva, error: reservaError } = await admin
    .from("lote_reservas")
    .select("id,lote_id,quantidade,status,user_id")
    .eq("id", reserva_id)
    .maybeSingle();

  if (reservaError) {
    logWebhookEvent("error", stripeEventId, "checkout.session.completed",
      "lote_reservas lookup failed", { error: reservaError.message, reserva_id });
    return;
  }

  const pedidoId = session.id; // use session id as pedido anchor

  // ── Happy path: reservation is still ATIVA ───────────────────────────────
  if (reserva?.status === "ATIVA") {
    const result = await confirmarLoteReserva({
      loteId: lote_id,
      reservaId: reserva_id,
      pedidoId,
      actorId: user_id,
    });

    logWebhookEvent("info", stripeEventId, "checkout.session.completed",
      result.ok ? "venda_confirmada" : "confirmar_falhou",
      { reserva_id, lote_id, skipped: result.skipped });

    // Cria pedido no banco e dispara email de confirmação (não bloqueia o webhook)
    if (result.ok && !result.skipped) {
      await criarPedidoLote({
        session,
        userId: user_id,
        produtoId: produto_id,
        quantidade: reserva.quantidade ?? 1,
        stripeEventId,
      });
    }
    return;
  }

  // ── Race condition: reservation expired, cron ran first ──────────────────
  logWebhookEvent("warn", stripeEventId, "checkout.session.completed",
    "WEBHOOK_RESERVA_EXPIRADA — verificando estoque disponivel",
    { reserva_id, lote_id, status: reserva?.status ?? "not_found" });

  const { data: lote, error: loteError } = await admin
    .from("lotes")
    .select("id,produto_id,qtd_disponivel,status")
    .eq("id", lote_id)
    .maybeSingle();

  if (loteError || !lote) {
    logWebhookEvent("error", stripeEventId, "checkout.session.completed",
      "lote lookup failed after expired reservation",
      { lote_id, error: loteError?.message });
    return;
  }

  const qtdNecessaria = reserva?.quantidade ?? 1;
  const qtdDisponivel = Number(lote.qtd_disponivel ?? 0);

  if (qtdDisponivel >= qtdNecessaria) {
    // Stock still available — create direct sale via confirmar function
    // (calls the existing PL/pgSQL which won't find the reserva, but we
    // record the event manually here since we can't use the expired reserva)
    await admin.from("lote_eventos").insert({
      lote_id,
      tipo: "VENDA",
      status_anterior: lote.status,
      status_novo: lote.status,
      delta_qtd: -qtdNecessaria,
      actor_id: user_id,
      metadata: {
        stripe_session_id: session.id,
        motivo: "venda_direta_pos_expiracao",
        reserva_id_original: reserva_id,
      },
    });

    // Decrement stock directly (best-effort; no SELECT FOR UPDATE available in SDK)
    await admin
      .from("lotes")
      .update({
        qtd_disponivel: Math.max(0, qtdDisponivel - qtdNecessaria),
      })
      .eq("id", lote_id)
      .gte("qtd_disponivel", qtdNecessaria);

    logWebhookEvent("info", stripeEventId, "checkout.session.completed",
      "venda_direta_pos_expiracao",
      { lote_id, reserva_id_original: reserva_id });
  } else {
    // No stock — trigger automatic refund
    await emitirReembolsoAutomatico({
      session,
      loteId: lote_id,
      produtoId: produto_id ?? String(lote.produto_id ?? ""),
      userId: user_id,
      stripeEventId,
    });
  }
}

// ─── Checkout session expired handler ────────────────────────────────────────

/**
 * Handles checkout.session.expired.
 * Releases the lote reservation (redundant safety net on top of the 5-min cron).
 */
export async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
  stripeEventId: string
): Promise<void> {
  const meta = extractMeta(session);
  if (!meta) return;

  const { skip } = await checkAndMarkIdempotency(stripeEventId, "checkout.session.expired");
  if (skip) return;

  const admin = getSupabaseAdminClient();

  const { data: reserva } = await admin
    .from("lote_reservas")
    .select("id,lote_id,quantidade,status,user_id")
    .eq("id", meta.reserva_id)
    .maybeSingle();

  if (!reserva || reserva.status !== "ATIVA") return;

  await admin
    .from("lote_reservas")
    .update({ status: "EXPIRADA" })
    .eq("id", reserva.id)
    .eq("status", "ATIVA");

  const { error: restoreError } = await admin.rpc("fn_restaurar_qtd_lote", {
    p_lote_id: reserva.lote_id,
    p_quantidade: reserva.quantidade,
    p_actor_id: reserva.user_id ?? null,
    p_reserva_id: reserva.id,
    p_motivo: "checkout_session_expirada",
  });

  if (restoreError) {
    logWebhookEvent("warn", stripeEventId, "checkout.session.expired",
      "fn_restaurar_qtd_lote failed",
      { reserva_id: reserva.id, error: restoreError.message });
  }

  logWebhookEvent("info", stripeEventId, "checkout.session.expired",
    "reserva_liberada", { reserva_id: reserva.id, lote_id: reserva.lote_id });
}
