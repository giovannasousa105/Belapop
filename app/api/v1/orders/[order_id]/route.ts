import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { buildCustomerBlock, buildOrderPayload } from "@/lib/api/v1/customer-contract";
import { loadSubOrdersWithSellers, type OrderRow } from "@/lib/api/v1/orders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { order_id: orderId } = await params;
  const { admin, userId } = auth.ctx;

  const [{ data, error }, { data: profile }] = await Promise.all([
    admin
      .from("orders")
      .select(
        "id,customer_id,total_order_cents,total_products_cents,total_shipping_cents,status,payment_status,payment_provider,payment_intent_id,address,created_at"
      )
      .eq("id", orderId)
      .eq("customer_id", userId)
      .maybeSingle(),
    admin.from("profiles").select("id,email,full_name").eq("id", userId).maybeSingle()
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });

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
