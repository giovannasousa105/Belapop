import { getSupabaseClient } from "@/lib/supabase/client";
import { CartItem, Order, SubOrder } from "@/lib/types";

const mapOrder = (row: any): Order => ({
  id: row.id,
  customerId: row.customer_id ?? "guest",
  totalProducts: Number(row.total_products ?? 0),
  totalShipping: Number(row.total_shipping ?? 0),
  totalOrder: Number(row.total_order ?? 0),
  status: row.status ?? "Confirmado",
  createdAt: row.created_at ?? new Date().toISOString(),
  paymentMethod: row.payment_method ?? "cartao",
  address: row.address ?? {},
  destinationCep: row.destination_cep ?? "",
  paymentIntentId: row.payment_intent_id ?? undefined,
  totalAmount: row.total_amount ?? undefined,
  paymentStatus: row.payment_status ?? undefined
});

const mapSubOrder = (row: any): SubOrder => ({
  id: row.id,
  orderId: row.order_id,
  sellerId: row.seller_id,
  items: Array.isArray(row.items)
    ? (row.items as CartItem[])
    : [],
  shippingValue: Number(row.shipping_value ?? 0),
  shippingService: row.shipping_service ?? "",
  status: row.status ?? "Confirmado",
  createdAt: row.created_at ?? new Date().toISOString(),
  productTotal: row.product_total ?? undefined,
  shippingTotal: row.shipping_total ?? undefined,
  platformFee: row.platform_fee ?? undefined,
  sellerNetAmount: row.seller_net_amount ?? undefined,
  paymentStatus: row.payment_status ?? undefined
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
    return (data ?? []).map(mapOrder);
  },
  save: async (order: Order) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("orders").insert({
      id: order.id,
      customer_id: order.customerId,
      total_products: order.totalProducts,
      total_shipping: order.totalShipping,
      total_order: order.totalOrder,
      status: order.status,
      created_at: order.createdAt ?? new Date().toISOString(),
      payment_method: order.paymentMethod,
      address: order.address,
      destination_cep: order.destinationCep,
      payment_intent_id: order.paymentIntentId ?? null,
      total_amount: order.totalAmount ?? null,
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
    return (data ?? []).map(mapSubOrder);
  },
  saveSubOrders: async (subOrders: SubOrder[]) => {
    const supabase = getSupabaseClient();
    const payload = subOrders.map((subOrder) => ({
      id: subOrder.id,
      order_id: subOrder.orderId,
      seller_id: subOrder.sellerId,
      items: subOrder.items ?? [],
      shipping_value: subOrder.shippingValue,
      shipping_service: subOrder.shippingService,
      status: subOrder.status,
      created_at: subOrder.createdAt ?? new Date().toISOString(),
      product_total: subOrder.productTotal ?? null,
      shipping_total: subOrder.shippingTotal ?? null,
      platform_fee: subOrder.platformFee ?? null,
      seller_net_amount: subOrder.sellerNetAmount ?? null,
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

