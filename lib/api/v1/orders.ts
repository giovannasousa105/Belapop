import type { SupabaseClient } from "@supabase/supabase-js";

export type OrderRow = {
  id: string;
  customer_id: string;
  total_order_cents: number;
  total_products_cents: number;
  total_shipping_cents: number;
  status: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  payment_intent_id?: string | null;
  address: Record<string, unknown> | null;
  created_at: string;
};

export type SubOrderRow = {
  id: string;
  order_id: string;
  seller_id: string;
  items: unknown;
  product_total_cents: number;
  shipping_total_cents: number;
  platform_fee_cents: number;
  seller_net_cents: number;
  shipping_service: string | null;
  shipping_days: number | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
};

type SellerRow = { id: string; store_name: string | null };
type ProductRow = { id: string; name: string | null };

export const subOrdersByOrderId = (rows: SubOrderRow[]) => {
  return rows.reduce<Record<string, SubOrderRow[]>>((acc, row) => {
    if (!acc[row.order_id]) acc[row.order_id] = [];
    acc[row.order_id].push(row);
    return acc;
  }, {});
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

export const extractProductIdsFromSubOrders = (subOrders: SubOrderRow[]) => {
  const ids = new Set<string>();
  for (const subOrder of subOrders) {
    const items = Array.isArray(subOrder.items) ? subOrder.items : [];
    for (const item of items) {
      const record = asRecord(item);
      const productId = record.product_id ?? record.productId ?? record.id;
      if (typeof productId === "string" && productId.trim()) ids.add(productId.trim());
    }
  }
  return Array.from(ids);
};

export async function loadProductsMap(admin: SupabaseClient, productIds: string[]) {
  if (!productIds.length) return {};
  const { data } = await admin.from("products").select("id,name").in("id", productIds);
  return ((data ?? []) as ProductRow[]).reduce<Record<string, string>>((acc, row) => {
    acc[row.id] = row.name ?? "Produto";
    return acc;
  }, {});
}

export async function loadSubOrdersWithSellers(
  admin: SupabaseClient,
  orderIds: string[]
): Promise<{ subOrders: SubOrderRow[]; sellers: Record<string, string> }> {
  if (!orderIds.length) {
    return { subOrders: [], sellers: {} };
  }

  const { data: subOrderRows } = await admin
    .from("sub_orders")
    .select(
      "id,order_id,seller_id,items,product_total_cents,shipping_total_cents,platform_fee_cents,seller_net_cents,shipping_service,shipping_days,status,payment_status,created_at"
    )
    .in("order_id", orderIds);

  const subOrders = (subOrderRows ?? []) as SubOrderRow[];
  const sellerIds = Array.from(new Set(subOrders.map((row) => row.seller_id)));
  if (!sellerIds.length) {
    return { subOrders, sellers: {} };
  }

  const { data: sellerRows } = await admin
    .from("sellers")
    .select("id,store_name")
    .in("id", sellerIds);

  const sellers = ((sellerRows ?? []) as SellerRow[]).reduce<Record<string, string>>((acc, row) => {
    acc[row.id] = row.store_name ?? "Lojista";
    return acc;
  }, {});

  return { subOrders, sellers };
}
