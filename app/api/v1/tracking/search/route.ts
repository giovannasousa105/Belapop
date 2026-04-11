import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { buildCustomerBlock, buildOrderPayload } from "@/lib/api/v1/customer-contract";
import { loadSubOrdersWithSellers, subOrdersByOrderId, type OrderRow } from "@/lib/api/v1/orders";

export async function GET(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const { admin, userId } = auth.ctx;
  const [{ data: orderRows, error }, { data: profile }] = await Promise.all([
    admin
      .from("orders")
      .select(
        "id,customer_id,total_order_cents,total_products_cents,total_shipping_cents,status,payment_status,payment_provider,payment_intent_id,address,created_at"
      )
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(80),
    admin.from("profiles").select("id,email,full_name").eq("id", userId).maybeSingle()
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (orderRows ?? []) as OrderRow[];
  const customer = buildCustomerBlock({
    user: auth.ctx.user,
    profile: profile ? (profile as Record<string, unknown>) : null
  });
  const { subOrders, sellers } = await loadSubOrdersWithSellers(
    admin,
    orders.map((order) => order.id)
  );
  const grouped = subOrdersByOrderId(subOrders);

  const items = orders
    .filter((order) => {
      if (order.id.toLowerCase().includes(q)) return true;
      const provider = (order.payment_provider ?? "").toLowerCase();
      if (provider.includes(q)) return true;
      const orderNumber = buildOrderPayload({
        order,
        subOrders: grouped[order.id] ?? [],
        sellerNames: sellers,
        customer
      }).order_number.toLowerCase();
      if (orderNumber.includes(q)) return true;
      return (grouped[order.id] ?? []).some((subOrder) =>
        (sellers[subOrder.seller_id] ?? "").toLowerCase().includes(q)
      );
    })
    .map((order) =>
      buildOrderPayload({
        order,
        subOrders: grouped[order.id] ?? [],
        sellerNames: sellers,
        customer
      })
    );

  return NextResponse.json({ items });
}
