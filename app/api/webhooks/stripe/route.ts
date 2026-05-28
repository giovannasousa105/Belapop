import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { posthogServer } from "@/lib/analytics/posthog";
import { captureError } from "@/lib/analytics/sentry";
import { getStripe } from "@/lib/stripe/stripeClient";
import { checkAndMarkIdempotency, liberarLoteReserva, logWebhookEvent } from "@/lib/stripe/stripeWebhookUtils";
import { finalizePaymentIntentOrder } from "@/lib/stripe/finalizePaymentIntentOrder";
import { handleCheckoutCompleted } from "@/lib/stripe/handleCheckoutCompleted";
import { handlePaymentFailed } from "@/lib/stripe/handlePaymentFailed";
import { handleRefundCompleted } from "@/lib/stripe/handleRefundCompleted";
import { liberarReserva } from "@/lib/lote/loteService";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const toMetadataString = (
  metadata: Stripe.Metadata | null | undefined,
  key: string
) => {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

async function captureCheckoutCompletedServer(
  session: Stripe.Checkout.Session
): Promise<void> {
  try {
    const userId = toMetadataString(session.metadata, "user_id");
    const sessionBp = toMetadataString(session.metadata, "session_bp");
    const produtoId = toMetadataString(session.metadata, "produto_id");

    await posthogServer.capture({
      distinctId: userId && userId !== "anonimo" ? userId : `anon_${sessionBp ?? "stripe"}`,
      event: "pedido_confirmado_server",
      properties: {
        valor_cents: Number(session.amount_total ?? 0),
        produto_id: produtoId,
        entrou_popclub: false,
        canal: "stripe_webhook_legacy"
      }
    });
  } catch (error) {
    captureError(error, {
      route: "/api/webhooks/stripe",
      etapa: "posthog_pedido_confirmado_server"
    });
  } finally {
    await posthogServer.shutdown();
  }
}

// REGRA CRÍTICA: raw body lido como Buffer ANTES de qualquer parse —
// Stripe exige body não-modificado para validar assinatura.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const sig     = req.headers.get("stripe-signature");
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ erro: "configuração_incompleta" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch {
    return NextResponse.json({ erro: "assinatura_invalida" }, { status: 400 });
  }

  // Idempotência — mesmo evento nunca processado duas vezes
  const { skip } = await checkAndMarkIdempotency(event.id, event.type);
  if (skip) {
    logWebhookEvent("info", event.id, event.type, "evento já processado — skip");
    return NextResponse.json({ ok: true, skip: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session, event.id);
          await captureCheckoutCompletedServer(session);
        }
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, event.id, event.type);
        break;

      case "payment_intent.succeeded":
        await finalizePaymentIntentOrder(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleRefundCompleted(event.data.object as Stripe.Charge, event.id, event.type);
        break;

      case "checkout.session.expired":
        await liberarPorSession(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        // Ignorar silenciosamente — nunca retornar 4xx para evento válido desconhecido
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    captureError(new Error(`Stripe webhook ${event.type} failed: ${message}`), {
      route: "/api/webhooks/stripe",
      event_id: event.id,
      event_type: event.type
    });
    logWebhookEvent("error", event.id, event.type, "erro ao processar evento", {
      erro: message,
    });
    // Retornar 200 mesmo em erro interno — Stripe retenta por 3 dias se receber 5xx
    // Optamos por logar e seguir em frente para evitar retentativas infinitas
  }

  return NextResponse.json({ ok: true });
}

// ─── Helpers locais ────────────────────────────────────────────────────────────

async function liberarPorSession(session: Stripe.Checkout.Session): Promise<void> {
  if (!session.id) return;

  const admin = getSupabaseAdminClient();
  const { data: reserva } = await admin
    .from("lote_reservas")
    .select("id, status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (!reserva || (reserva.status as string) !== "ATIVA") return;

  await liberarReserva(reserva.id as string, "cancelamento");
  logWebhookEvent("info", session.id, "checkout.session.expired", "reserva liberada por expiração de session");
}
