import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { buildCustomerBlock, buildOrderPayload } from "@/lib/api/v1/customer-contract";
import { loadSubOrdersWithSellers, type OrderRow } from "@/lib/api/v1/orders";
import { isOrderUuid, matchesOrderReference } from "@/lib/orders/orderReference";

const buildOrderNumber = (orderId: string, createdAt: string | null | undefined) => {
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  const suffix = orderId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `BP-${year}-${suffix}`;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { order_id: orderId } = await params;
  const { admin, userId } = auth.ctx;
  let resolvedOrderId = orderId;

  if (!isOrderUuid(orderId)) {
    const { data: candidateRows, error: candidateError } = await admin
      .from("orders")
      .select("id,created_at")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (candidateError) {
      return NextResponse.json({ error: candidateError.message }, { status: 500 });
    }

    const match = (candidateRows ?? []).find((row) =>
      matchesOrderReference({
        id: String(row.id ?? ""),
        orderNumber: buildOrderNumber(String(row.id ?? ""), String(row.created_at ?? "")),
        reference: orderId
      })
    );

    if (!match?.id) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    resolvedOrderId = String(match.id);
  }

  const [{ data, error }, { data: profile }] = await Promise.all([
    admin
      .from("orders")
      .select(
        "id,customer_id,total_order_cents,total_products_cents,total_shipping_cents,status,payment_status,payment_provider,payment_intent_id,address,created_at"
      )
      .eq("id", resolvedOrderId)
      .eq("customer_id", userId)
      .maybeSingle(),
    admin.from("profiles").select("id,email,full_name").eq("id", userId).maybeSingle()
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

  const order = data as OrderRow;
  const { subOrders, sellers } = await loadSubOrdersWithSellers(admin, [order.id]);
  const customer = buildCustomerBlock({
    user: auth.ctx.user,
    profile: profile ? (profile as Record<string, unknown>) : null
  });

  return NextResponse.json(
    buildOrderPayload({
      order,
      subOrders,
      sellerNames: sellers,
      customer
    })
  );
}
