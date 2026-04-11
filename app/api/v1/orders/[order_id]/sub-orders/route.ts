import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { buildSubOrderPayload } from "@/lib/api/v1/customer-contract";
import {
  extractProductIdsFromSubOrders,
  loadProductsMap,
  loadSubOrdersWithSellers
} from "@/lib/api/v1/orders";
import { loadLatestShipmentsForSubOrders } from "@/lib/tracking/shipmentLookup";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { order_id: orderId } = await params;
  const { admin, userId } = auth.ctx;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,created_at")
    .eq("id", orderId)
    .eq("customer_id", userId)
    .maybeSingle();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });

  const { subOrders, sellers } = await loadSubOrdersWithSellers(admin, [orderId]);
  const productMap = await loadProductsMap(admin, extractProductIdsFromSubOrders(subOrders));
  const { bridge, shipmentsBySubOrderId } = await loadLatestShipmentsForSubOrders(admin, subOrders);

  return NextResponse.json({
    order_id: orderId,
    items: subOrders.map((subOrder) =>
      buildSubOrderPayload({
        subOrder,
        order,
        storeName: bridge.sellerNames[subOrder.seller_id] ?? sellers[subOrder.seller_id] ?? "Lojista",
        productNames: productMap,
        carrier: shipmentsBySubOrderId[subOrder.id]?.carrier ?? null,
        trackingCode: shipmentsBySubOrderId[subOrder.id]?.tracking_code ?? null,
        postedAt: shipmentsBySubOrderId[subOrder.id]?.created_at ?? null,
        estimatedDeliveryDate: null
      })
    )
  });
}
