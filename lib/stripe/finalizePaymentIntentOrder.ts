import "server-only";

import type Stripe from "stripe";

import { buildShortOrderCode } from "@/lib/orders/orderReference";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { enviarPedidoConfirmado } from "@/lib/crm/flows/transacionais";

type OrderPaymentRow = {
  id: string;
  customer_id: string;
  payment_intent_id: string | null;
};

type CartRow = {
  id: string;
};

const ORDER_SELECT = "id,customer_id,payment_intent_id";

const findOrderForPaymentIntent = async (paymentIntent: Stripe.PaymentIntent) => {
  const admin = getSupabaseAdminClient();
  const metadataOrderId = paymentIntent.metadata?.orderId;

  if (metadataOrderId) {
    const { data, error } = await admin
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", metadataOrderId)
      .maybeSingle<OrderPaymentRow>();

    if (error) throw error;
    if (data) return data;
  }

  const { data, error } = await admin
    .from("orders")
    .select(ORDER_SELECT)
    .eq("payment_intent_id", paymentIntent.id)
    .maybeSingle<OrderPaymentRow>();

  if (error) throw error;
  return data ?? null;
};

const clearCustomerCart = async (customerId: string, orderId: string) => {
  const admin = getSupabaseAdminClient();
  const convertedAt = new Date().toISOString();

  const { data: carts, error: cartsError } = await admin
    .from("carts")
    .select("id")
    .eq("user_id", customerId);

  if (cartsError) {
    console.warn("[stripe] cart lookup failed after payment", cartsError.message);
    return;
  }

  const cartIds = ((carts ?? []) as CartRow[]).map((cart) => cart.id).filter(Boolean);
  if (cartIds.length) {
    const { error: itemsError } = await admin.from("cart_items").delete().in("cart_id", cartIds);
    if (itemsError) {
      console.warn("[stripe] cart_items cleanup failed after payment", itemsError.message);
    }
  }

  const { error: cartsUpdateError } = await admin
    .from("carts")
    .update({
      items: [],
      metadata: {
        converted_at: convertedAt,
        converted_order_id: orderId
      },
      status: "converted",
      subtotal_cents: 0,
      updated_at: convertedAt
    })
    .eq("user_id", customerId);

  if (cartsUpdateError) {
    console.warn("[stripe] carts cleanup failed after payment", cartsUpdateError.message);
  }
};

const ensureCustomerNotification = async (order: OrderPaymentRow) => {
  const admin = getSupabaseAdminClient();
  const orderCode = buildShortOrderCode(order.id);
  const ctaHref = `/conta/pedidos/${order.id}`;

  const { data: existing, error: lookupError } = await admin
    .from("notifications")
    .select("id")
    .eq("recipient_user_id", order.customer_id)
    .eq("type", "order_confirmed")
    .eq("cta_href", ctaHref)
    .limit(1);

  if (lookupError) {
    console.warn("[stripe] notification lookup failed after payment", lookupError.message);
    return;
  }

  if (existing?.length) return;

  const { error } = await admin.from("notifications").insert({
    recipient_user_id: order.customer_id,
    type: "order_confirmed",
    title: "Pedido confirmado!",
    body: `Seu pedido #${orderCode} foi confirmado e está sendo separado.`,
    cta_label: "Acompanhar pedido",
    cta_href: ctaHref,
    metadata: {
      order_id: order.id,
      order_code: orderCode,
      payment_intent_id: order.payment_intent_id
    },
    is_read: false
  });

  if (error) {
    console.warn("[stripe] notification insert failed after payment", error.message);
  }
};

async function dispararEmailPedidoConfirmado(
  orderId: string,
  customerId: string,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();

    const [{ data: profile }, { data: rawItems }] = await Promise.all([
      admin.from("profiles").select("email,full_name").eq("id", customerId).maybeSingle(),
      admin
        .from("order_items")
        .select("quantity, price_cents, products(title, hero_image_url, slug)")
        .eq("order_id", orderId),
    ]);

    if (!profile?.email) return;

    const totalCents = Number(paymentIntent.amount_received ?? paymentIntent.amount ?? 0);
    const numeroPedido = buildShortOrderCode(orderId);

    const itens = (rawItems ?? []).map((item) => {
      const pRaw = item.products;
      const p = (Array.isArray(pRaw) ? pRaw[0] : pRaw) as { title: string; hero_image_url: string | null; slug: string } | null;
      return {
        nome: p?.title ?? "Produto",
        foto: p?.hero_image_url ?? null,
        slug: p?.slug ?? "",
        preco_brl: (item.price_cents ?? 0) / 100,
        quantidade: item.quantity ?? 1,
      };
    });

    await enviarPedidoConfirmado({
      user_id: customerId,
      email: profile.email as string,
      pedido_id: orderId,
      numero_pedido: numeroPedido,
      itens,
      subtotal_brl: totalCents / 100,
      frete_brl: 0,
      total_brl: totalCents / 100,
    });
  } catch (err) {
    console.warn("[stripe] email pedido confirmado falhou (nao-critico)", String(err));
  }
}

export const finalizePaymentIntentOrder = async (paymentIntent: Stripe.PaymentIntent) => {
  const admin = getSupabaseAdminClient();
  const order = await findOrderForPaymentIntent(paymentIntent);

  if (!order) {
    return {
      order: null,
      orderCode: null
    };
  }

  const { error: orderError } = await admin
    .from("orders")
    .update({
      payment_intent_id: paymentIntent.id,
      payment_provider: "stripe",
      payment_status: "paid",
      status: "paid"
    })
    .eq("id", order.id);

  if (orderError) throw orderError;

  const { error: subOrdersError } = await admin
    .from("sub_orders")
    .update({
      payment_status: "paid",
      status: "awaiting_shipment"
    })
    .eq("order_id", order.id);

  if (subOrdersError) {
    console.warn("[stripe] sub_order update failed after payment", subOrdersError.message);
  }

  await clearCustomerCart(order.customer_id, order.id);
  await ensureCustomerNotification({ ...order, payment_intent_id: paymentIntent.id });

  // Dispara email de confirmação de pedido — não bloqueia a resposta
  void dispararEmailPedidoConfirmado(order.id, order.customer_id, paymentIntent);

  return {
    order: {
      ...order,
      payment_intent_id: paymentIntent.id
    },
    orderCode: buildShortOrderCode(order.id)
  };
};
