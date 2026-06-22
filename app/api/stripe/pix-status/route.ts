import { NextRequest, NextResponse } from "next/server";

import { buildShortOrderCode } from "@/lib/orders/orderReference";
import { finalizePaymentIntentOrder } from "@/lib/stripe/finalizePaymentIntentOrder";
import { getStripe } from "@/lib/stripe/stripeClient";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

type OrderStatusRow = {
  id: string;
  customer_id: string;
};

const loadOrderForPaymentIntent = async (paymentIntentId: string, metadataOrderId?: string | null) => {
  const admin = getSupabaseAdminClient();

  if (metadataOrderId) {
    const { data, error } = await admin
      .from("orders")
      .select("id,customer_id")
      .eq("id", metadataOrderId)
      .maybeSingle<OrderStatusRow>();

    if (error) throw error;
    if (data) return data;
  }

  const { data, error } = await admin
    .from("orders")
    .select("id,customer_id")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle<OrderStatusRow>();

  if (error) throw error;
  return data ?? null;
};

export async function GET(request: NextRequest) {
  try {
    const paymentIntentId = request.nextUrl.searchParams.get("pi");
    if (!paymentIntentId) {
      return NextResponse.json({ error: "Missing pi" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const existingOrder = await loadOrderForPaymentIntent(
      paymentIntent.id,
      paymentIntent.metadata?.orderId ?? null
    );

    if (existingOrder && existingOrder.customer_id !== user.id) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    if (paymentIntent.status === "succeeded") {
      const result = await finalizePaymentIntentOrder(paymentIntent);
      const order = result.order ?? existingOrder;
      return NextResponse.json({
        status: "succeeded",
        orderId: order?.id ?? null,
        orderCode: order ? result.orderCode ?? buildShortOrderCode(order.id) : null
      });
    }

    return NextResponse.json({
      status: paymentIntent.status,
      orderId: existingOrder?.id ?? null,
      orderCode: existingOrder ? buildShortOrderCode(existingOrder.id) : null
    });
  } catch (error) {
    console.error("[stripe/pix-status] failed", error);
    return NextResponse.json({ error: "Falha ao consultar Pix." }, { status: 500 });
  }
}
