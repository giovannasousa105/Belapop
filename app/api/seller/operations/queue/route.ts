import { NextRequest, NextResponse } from "next/server";

import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import {
  buildOperationalQueue,
  type SellerProductMetricRow,
  type SellerSubOrderMetricRow,
  type SellerSupportTicketMetricRow
} from "@/lib/seller/enterpriseMetrics";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseWindowHours = (value: string | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 72;
  return Math.min(24 * 14, Math.max(24, Math.round(parsed)));
};

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const windowHours = parseWindowHours(request.nextUrl.searchParams.get("window_hours"));
  const fromIso = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
  const admin = getSupabaseAdminClient();

  const subOrdersLookup = await admin
    .from("sub_orders")
    .select(
      "id,order_id,status,payment_status,created_at,product_total_cents,shipping_total_cents,platform_fee_cents,seller_net_cents"
    )
    .eq("seller_id", scope.sellerId)
    .gte("created_at", fromIso)
    .limit(5000);

  if (subOrdersLookup.error) {
    return NextResponse.json({ error: subOrdersLookup.error.message }, { status: 500 });
  }

  const subOrders = (subOrdersLookup.data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    order_id: row.order_id ? String(row.order_id) : null,
    status: row.status ? String(row.status) : null,
    payment_status: row.payment_status ? String(row.payment_status) : null,
    created_at: row.created_at ? String(row.created_at) : null,
    product_total_cents: toNumber(
      row.product_total_cents ?? row.product_total ?? row.total_products_cents
    ),
    shipping_total_cents: toNumber(
      row.shipping_total_cents ?? row.shipping_total ?? row.total_shipping_cents
    ),
    platform_fee_cents: toNumber(row.platform_fee_cents ?? row.platform_fee),
    seller_net_cents: toNumber(row.seller_net_cents ?? row.seller_net_amount)
  })) satisfies SellerSubOrderMetricRow[];

  const productsLookup = await admin
    .from("products")
    .select("id,status,stock_quantity")
    .eq("seller_id", scope.sellerId)
    .limit(5000);

  if (productsLookup.error) {
    return NextResponse.json({ error: productsLookup.error.message }, { status: 500 });
  }

  const products = (productsLookup.data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    status: row.status ? String(row.status) : null,
    stock_quantity: toNumber(row.stock_quantity)
  })) satisfies SellerProductMetricRow[];

  const orderIds = Array.from(
    new Set(
      subOrders
        .map((subOrder) => subOrder.order_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const supportLookup =
    orderIds.length > 0
      ? await admin
          .from("support_tickets")
          .select("id,status,created_at,sla_deadline,order_id")
          .in("order_id", orderIds.slice(0, 1000))
          .limit(2000)
      : { data: [], error: null };

  if (supportLookup.error && supportLookup.error.code !== "42P01") {
    return NextResponse.json({ error: supportLookup.error.message }, { status: 500 });
  }

  const supportTickets = ((supportLookup.data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id ?? ""),
    status: row.status ? String(row.status) : null,
    created_at: row.created_at ? String(row.created_at) : null,
    sla_deadline: row.sla_deadline ? String(row.sla_deadline) : null
  })) satisfies SellerSupportTicketMetricRow[];

  const items = buildOperationalQueue({
    subOrders,
    products,
    supportTickets
  });

  const summary = {
    critical: items.filter((item) => item.severity === "critical").length,
    high: items.filter((item) => item.severity === "high").length,
    medium: items.filter((item) => item.severity === "medium").length,
    estimated_impact_cents: items.reduce((sum, item) => sum + item.estimated_impact_cents, 0)
  };

  return NextResponse.json({
    seller_id: scope.sellerId,
    window_hours: windowHours,
    generated_at: new Date().toISOString(),
    summary,
    items
  });
}
