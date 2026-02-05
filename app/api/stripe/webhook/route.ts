import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripe } from "@/lib/stripe/stripeClient";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET não configurado." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura do webhook ausente." },
      { status: 400 }
    );
  }

  const body = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Assinatura invalida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata ?? {};
    const splitsRaw = metadata.sellerSplits ?? "[]";
    const orderId = metadata.orderId ?? paymentIntent.id;

    try {
      const splits = JSON.parse(splitsRaw) as Array<{
        sellerId: string;
        stripeAccountId: string;
        productTotalCents: number;
        shippingTotalCents: number;
        platformFeeCents: number;
        sellerNetCents: number;
      }>;

      await Promise.all(
        splits.map((split) =>
          stripe.transfers.create(
            {
              amount: split.sellerNetCents,
              currency: paymentIntent.currency,
              destination: split.stripeAccountId,
              transfer_group: paymentIntent.transfer_group ?? orderId,
              metadata: {
                orderId,
                sellerId: split.sellerId
              }
            },
            {
              idempotencyKey: `transfer-${paymentIntent.id}-${split.sellerId}`
            }
          )
        )
      );
    } catch (error) {
      console.error("[Stripe webhook] Falha ao criar transfers:", error);
    }
  }

  if (event.type === "transfer.created") {
    console.info("[Stripe webhook] Transfer criado:", event.data.object.id);
  }

  return NextResponse.json({ received: true });
}
