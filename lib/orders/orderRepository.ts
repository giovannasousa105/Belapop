import { getSupabaseClient } from "@/lib/supabase/client";
import { CartItem, Order, SubOrder } from "@/lib/types";

const toAmount = (
  centsValue: unknown,
  fallbackValue: unknown = 0
) => {
  if (centsValue !== null && centsValue !== undefined) {
    const cents = Number(centsValue);
    if (Number.isFinite(cents)) return cents / 100;
  }

  const amount = Number(fallbackValue);
  return Number.isFinite(amount) ? amount : 0;
};

const toCents = (amount: number | undefined) => {
  const value = Number(amount ?? 0);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
};

const mapOrder = (row: Record<string, unknown>): Order => ({
  id: String(row.id ?? ""),
  customerId: String(row.customer_id ?? "guest"),
  totalProducts: toAmount(row.total_products_cents, row.total_products),
  totalShipping: toAmount(row.total_shipping_cents, row.total_shipping),
  totalOrder: toAmount(
    row.total_order_cents,
    row.total_amount ?? row.total_order
  ),
  status: (row.status ?? "created") as Order["status"],
  createdAt: String(row.created_at ?? new Date().toISOString()),
  paymentMethod: (row.payment_method ?? "cartao") as Order["paymentMethod"],
  address:
    typeof row.address === "object" && row.address !== null
      ? (row.address as Order["address"])
      : ({} as Order["address"]),
  destinationCep: String(row.destination_cep ?? ""),
  paymentIntentId:
    typeof row.payment_intent_id === "string" && row.payment_intent_id.trim()
      ? row.payment_intent_id
      : undefined,
  totalAmount: toAmount(
    row.total_order_cents,
    row.total_amount ?? row.total_order
  ),
  paymentStatus: (row.payment_status ?? undefined) as Order["paymentStatus"]
});

const mapSubOrder = (row: Record<string, unknown>): SubOrder => ({
  id: String(row.id ?? ""),
  orderId: String(row.order_id ?? ""),
  sellerId: String(row.seller_id ?? ""),
  items: Array.isArray(row.items) ? (row.items as CartItem[]) : [],
  shippingValue: toAmount(row.shipping_total_cents, row.shipping_value),
  shippingService: String(row.shipping_service ?? ""),
  status: (row.status ?? "created") as SubOrder["status"],
  createdAt: String(row.created_at ?? new Date().toISOString()),
  productTotal: toAmount(row.product_total_cents, row.product_total),
  shippingTotal: toAmount(row.shipping_total_cents, row.shipping_total),
  platformFee: toAmount(row.platform_fee_cents, row.platform_fee),
  sellerNetAmount: toAmount(row.seller_net_cents, row.seller_net_amount),
  paymentStatus: (row.payment_status ?? undefined) as SubOrder["paymentStatus"]
});

export const orderRepository = {
  getAll: async (): Promise<Order[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[orders] getAll failed:", error);
      return [];
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapOrder);
  },

  save: async (order: Order) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("orders").insert({
      id: order.id,
      customer_id: order.customerId,
      total_products_cents: toCents(order.totalProducts),
      total_shipping_cents: toCents(order.totalShipping),
      total_order_cents: toCents(order.totalAmount ?? order.totalOrder),
      status: order.status,
      created_at: order.createdAt ?? new Date().toISOString(),
      address: order.address,
      destination_cep: order.destinationCep,
      payment_intent_id: order.paymentIntentId ?? null,
      payment_status: order.paymentStatus ?? null
    });

    if (error) {
      console.error("[orders] save failed:", error);
      return { ok: false, message: error.message };
    }

    return { ok: true };
  },

  getSubOrders: async (): Promise<SubOrder[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("sub_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[orders] getSubOrders failed:", error);
      return [];
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapSubOrder);
  },

  saveSubOrders: async (subOrders: SubOrder[]) => {
    const supabase = getSupabaseClient();
    const payload = subOrders.map((subOrder) => ({
      id: subOrder.id,
      order_id: subOrder.orderId,
      seller_id: subOrder.sellerId,
      items: subOrder.items ?? [],
      shipping_total_cents: toCents(
        subOrder.shippingTotal ?? subOrder.shippingValue
      ),
      shipping_service: subOrder.shippingService,
      status: subOrder.status,
      created_at: subOrder.createdAt ?? new Date().toISOString(),
      product_total_cents: toCents(subOrder.productTotal),
      platform_fee_cents: toCents(subOrder.platformFee),
      seller_net_cents: toCents(subOrder.sellerNetAmount),
      payment_status: subOrder.paymentStatus ?? null
    }));

    const { error } = await supabase.from("sub_orders").insert(payload);
    if (error) {
      console.error("[orders] saveSubOrders failed:", error);
      return { ok: false, message: error.message };
    }

    return { ok: true };
  }
};
