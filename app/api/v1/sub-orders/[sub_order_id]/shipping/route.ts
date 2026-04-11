import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { buildSubOrderPayload } from "@/lib/api/v1/customer-contract";
import { extractProductIdsFromSubOrders, loadProductsMap, type SubOrderRow } from "@/lib/api/v1/orders";
import { loadLatestShipmentsForSubOrders } from "@/lib/tracking/shipmentLookup";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sub_order_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { sub_order_id: subOrderId } = await params;
  const { admin, userId } = auth.ctx;

  const { data: subOrder, error } = await admin
    .from("sub_orders")
    .select(
      "id,order_id,seller_id,items,product_total_cents,shipping_total_cents,platform_fee_cents,seller_net_cents,shipping_service,shipping_days,status,payment_status,created_at"
    )
    .eq("id", subOrderId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subOrder) return NextResponse.json({ error: "Subpedido nao encontrado." }, { status: 404 });

  const [{ data: order }, { data: seller }] = await Promise.all([
    admin
      .from("orders")
      .select("id,customer_id,created_at")
      .eq("id", subOrder.order_id)
      .maybeSingle(),
    admin.from("sellers").select("id,store_name").eq("id", subOrder.seller_id).maybeSingle()
  ]);

  if (!order || order.customer_id !== userId) {
    return NextResponse.json({ error: "Subpedido nao encontrado." }, { status: 404 });
  }

  const productMap = await loadProductsMap(
    admin,
    extractProductIdsFromSubOrders([subOrder as SubOrderRow])
  );
  const { bridge, shipmentsBySubOrderId } = await loadLatestShipmentsForSubOrders(admin, [
    {
      id: subOrder.id,
      order_id: subOrder.order_id,
      seller_id: subOrder.seller_id
    }
  ]);
  const shipment = shipmentsBySubOrderId[subOrder.id];
  const payload = buildSubOrderPayload({
    subOrder: subOrder as SubOrderRow,
    order: { id: order.id, created_at: order.created_at },
    storeName: bridge.sellerNames[subOrder.seller_id] ?? seller?.store_name ?? "Lojista",
    productNames: productMap,
    carrier: shipment?.carrier ?? null,
    trackingCode: shipment?.tracking_code ?? null,
    postedAt: shipment?.created_at ?? null,
    estimatedDeliveryDate: null
  });

  return NextResponse.json({
    sub_order_id: payload.sub_order_id,
    order_id: payload.order_id,
    order_number: payload.order_number,
    seller_id: payload.seller.seller_id,
    seller_name: payload.seller.seller_name,
    store_id: payload.store.store_id,
    store_name: payload.store.store_name,
    status: payload.status,
    shipping: payload.shipping
  });
}
