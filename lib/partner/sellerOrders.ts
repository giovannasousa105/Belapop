import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type PartnerSellerOrder = {
  id: string;
  order_id: string;
  seller_id: string;
  status: string;
  items_total_cents: number;
  shipping_cents: number;
  discount_allocated_cents: number;
  fee_cents: number;
  seller_payout_cents: number;
  tracking_code: string | null;
  shipping_method: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

type ListArgs = {
  sellerId: string;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  page: number;
  pageSize: number;
};

type MaybePgError = { code?: string | null; message?: string | null } | null;

const asNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isMissingRelation = (error: MaybePgError) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("relation") && message.includes("does not exist");
};

const normalizeStatus = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const mapSubOrderToSellerOrder = (row: Record<string, unknown>): PartnerSellerOrder => {
  const itemsTotal = asNumber(row.product_total_cents ?? row.items_total_cents);
  const shipping = asNumber(row.shipping_total_cents ?? row.shipping_cents);
  const fee = asNumber(row.platform_fee_cents ?? row.fee_cents);
  const payout = asNumber(row.seller_net_cents ?? row.seller_payout_cents);
  const discount = Math.max(0, itemsTotal + shipping - fee - payout);

  return {
    id: String(row.id ?? ""),
    order_id: String(row.order_id ?? ""),
    seller_id: String(row.seller_id ?? row.store_id ?? ""),
    status: String(row.status ?? "pending"),
    items_total_cents: itemsTotal,
    shipping_cents: shipping,
    discount_allocated_cents: discount,
    fee_cents: fee,
    seller_payout_cents: payout,
    tracking_code: (row.tracking_code as string | null | undefined) ?? null,
    shipping_method:
      (row.shipping_method as string | null | undefined) ??
      (row.shipping_service as string | null | undefined) ??
      null,
    shipped_at: (row.shipped_at as string | null | undefined) ?? null,
    delivered_at: (row.delivered_at as string | null | undefined) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString())
  };
};

const applyDateRange = <T extends { gte: (...args: any[]) => T; lte: (...args: any[]) => T }>(
  query: T,
  args: { dateFrom?: string | null; dateTo?: string | null }
) => {
  let q = query;
  if (args.dateFrom) q = q.gte("created_at", args.dateFrom);
  if (args.dateTo) q = q.lte("created_at", args.dateTo);
  return q;
};

const listFromSellerOrders = async (admin: SupabaseClient, args: ListArgs) => {
  const from = (args.page - 1) * args.pageSize;
  const to = from + args.pageSize - 1;

  let query = admin
    .from("seller_orders")
    .select(
      "id,order_id,seller_id,status,items_total_cents,shipping_cents,discount_allocated_cents,fee_cents,seller_payout_cents,tracking_code,shipping_method,shipped_at,delivered_at,created_at",
      { count: "exact" }
    )
    .eq("seller_id", args.sellerId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (args.status) query = query.eq("status", args.status);
  query = applyDateRange(query, args);

  const result = await query;
  if (result.error) return { error: result.error, items: [] as PartnerSellerOrder[], total: 0 };

  return {
    error: null,
    items: ((result.data ?? []) as unknown as PartnerSellerOrder[]).map((row) =>
      mapSubOrderToSellerOrder(row as unknown as Record<string, unknown>)
    ),
    total: Number(result.count ?? 0)
  };
};

const listFromSubOrders = async (admin: SupabaseClient, args: ListArgs) => {
  const from = (args.page - 1) * args.pageSize;
  const to = from + args.pageSize - 1;

  let query = admin
    .from("sub_orders")
    .select(
      "id,order_id,seller_id,status,product_total_cents,shipping_total_cents,platform_fee_cents,seller_net_cents,shipping_service,created_at",
      { count: "exact" }
    )
    .eq("seller_id", args.sellerId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (args.status) query = query.eq("status", args.status);
  query = applyDateRange(query, args);

  const result = await query;
  if (result.error) throw new Error(result.error.message);

  return {
    items: ((result.data ?? []) as Array<Record<string, unknown>>).map(mapSubOrderToSellerOrder),
    total: Number(result.count ?? 0)
  };
};

export const listPartnerSellerOrders = async (admin: SupabaseClient, args: ListArgs) => {
  const fromSellerOrders = await listFromSellerOrders(admin, args);
  if (!fromSellerOrders.error) {
    return { items: fromSellerOrders.items, total: fromSellerOrders.total, source: "seller_orders" as const };
  }
  if (!isMissingRelation(fromSellerOrders.error)) {
    throw new Error(fromSellerOrders.error.message);
  }
  const fallback = await listFromSubOrders(admin, args);
  return { ...fallback, source: "sub_orders" as const };
};

export const getPartnerSellerOrderById = async (
  admin: SupabaseClient,
  args: { sellerId: string; sellerOrderId: string }
) => {
  const primary = await admin
    .from("seller_orders")
    .select(
      "id,order_id,seller_id,status,items_total_cents,shipping_cents,discount_allocated_cents,fee_cents,seller_payout_cents,tracking_code,shipping_method,shipped_at,delivered_at,created_at"
    )
    .eq("id", args.sellerOrderId)
    .eq("seller_id", args.sellerId)
    .maybeSingle();

  if (!primary.error && primary.data) {
    return {
      row: mapSubOrderToSellerOrder(primary.data as unknown as Record<string, unknown>),
      source: "seller_orders" as const
    };
  }

  if (primary.error && !isMissingRelation(primary.error)) {
    throw new Error(primary.error.message);
  }

  const fallback = await admin
    .from("sub_orders")
    .select(
      "id,order_id,seller_id,status,product_total_cents,shipping_total_cents,platform_fee_cents,seller_net_cents,shipping_service,created_at"
    )
    .eq("id", args.sellerOrderId)
    .eq("seller_id", args.sellerId)
    .maybeSingle();

  if (fallback.error) throw new Error(fallback.error.message);
  if (!fallback.data) return null;

  return {
    row: mapSubOrderToSellerOrder(fallback.data as unknown as Record<string, unknown>),
    source: "sub_orders" as const
  };
};

export const parseRangeToDateFrom = (range: string | null, now = new Date()) => {
  const normalized = normalizeStatus(range);
  const base = new Date(now);
  if (normalized === "today") {
    base.setHours(0, 0, 0, 0);
    return base.toISOString();
  }
  if (normalized === "7d") {
    base.setDate(base.getDate() - 7);
    return base.toISOString();
  }
  if (normalized === "90d") {
    base.setDate(base.getDate() - 90);
    return base.toISOString();
  }
  base.setDate(base.getDate() - 30);
  return base.toISOString();
};
