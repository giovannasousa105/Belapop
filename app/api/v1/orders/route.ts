import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { buildCustomerBlock, buildOrderPayload } from "@/lib/api/v1/customer-contract";
import { loadSubOrdersWithSellers, subOrdersByOrderId, type OrderRow } from "@/lib/api/v1/orders";

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export async function GET(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const sellerId = params.get("seller_id") ?? params.get("store_id");
  const dateFrom = params.get("date_from");
  const dateTo = params.get("date_to");
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(params.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(params.get("page_size") ?? "20")));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let ordersQuery = admin
    .from("orders")
    .select(
      "id,customer_id,total_order_cents,total_products_cents,total_shipping_cents,status,payment_status,payment_provider,payment_intent_id,address,created_at",
      { count: "exact" }
    )
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (dateFrom) ordersQuery = ordersQuery.gte("created_at", dateFrom);
  if (dateTo) ordersQuery = ordersQuery.lte("created_at", dateTo);

  const [{ data: orderRows, error }, { data: profile }] = await Promise.all([
    ordersQuery,
    admin.from("profiles").select("id,email,full_name").eq("id", userId).maybeSingle()
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let orders = (orderRows ?? []) as OrderRow[];
  const orderIds = orders.map((row) => row.id);
  const { subOrders, sellers } = await loadSubOrdersWithSellers(admin, orderIds);
  const groupedSubOrders = subOrdersByOrderId(subOrders);
  const customer = buildCustomerBlock({
    user: auth.ctx.user,
    profile: profile ? (profile as Record<string, unknown>) : null
  });

  if (sellerId) {
    const allowedIds = new Set(
      subOrders.filter((row) => row.seller_id === sellerId).map((row) => row.order_id)
    );
    orders = orders.filter((row) => allowedIds.has(row.id));
  }

  if (query) {
    orders = orders.filter((order) => {
      if (order.id.toLowerCase().includes(query)) return true;
      const provider = (order.payment_provider ?? "").toLowerCase();
      if (provider.includes(query)) return true;
      const orderNumber = buildOrderPayload({
        order,
        subOrders: groupedSubOrders[order.id] ?? [],
        sellerNames: sellers,
        customer
      }).order_number.toLowerCase();
      if (orderNumber.includes(query)) return true;
      const currentSubOrders = groupedSubOrders[order.id] ?? [];
      return currentSubOrders.some((subOrder) =>
        (sellers[subOrder.seller_id] ?? "").toLowerCase().includes(query)
      );
    });
  }

  const mappedItems = orders.map((order) =>
    buildOrderPayload({
      order,
      subOrders: groupedSubOrders[order.id] ?? [],
      sellerNames: sellers,
      customer
    })
  );

  const normalizedStatus = normalize(status);
  const items = normalizedStatus
    ? mappedItems.filter((order) => normalize(order.status) === normalizedStatus)
    : mappedItems;

  return NextResponse.json({
    page,
    page_size: pageSize,
    total: items.length,
    items
  });
}
