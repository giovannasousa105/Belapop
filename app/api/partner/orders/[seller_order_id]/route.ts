import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ensurePartnerApiContext } from "@/lib/partner/auth";
import { getPartnerSellerOrderById } from "@/lib/partner/sellerOrders";
import { isMissingTableError } from "@/lib/rbac/sellerAccessScope";
import { loadLatestShipmentsForSubOrders } from "@/lib/tracking/shipmentLookup";

type OrderItemResponse = {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  created_at: string | null;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStringOrNull = (value: unknown) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const mapOrderItemRow = (row: Record<string, unknown>): OrderItemResponse => {
  const quantity = Math.max(1, toNumber(row.quantity ?? row.qty ?? 1));
  const unit = Math.max(0, toNumber(row.unit_price_cents ?? row.price_cents ?? 0));
  const total = Math.max(
    0,
    toNumber(row.total_price_cents ?? row.total_cents ?? row.subtotal_cents ?? unit * quantity)
  );

  return {
    id: String(row.id ?? ""),
    product_id: toStringOrNull(row.product_id),
    quantity,
    unit_price_cents: unit,
    total_price_cents: total,
    created_at: toStringOrNull(row.created_at)
  };
};

const mapSubOrderItems = (itemsRaw: unknown): OrderItemResponse[] => {
  if (!Array.isArray(itemsRaw)) return [];
  return itemsRaw.map((entry, idx) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    const quantity = Math.max(1, toNumber(row.quantity ?? row.qty ?? 1));
    const unit = Math.max(0, toNumber(row.unit_price_cents ?? row.price_cents ?? 0));
    const total = Math.max(
      0,
      toNumber(row.total_price_cents ?? row.total_cents ?? row.subtotal_cents ?? unit * quantity)
    );

    return {
      id: String(row.id ?? `sub-item-${idx + 1}`),
      product_id: toStringOrNull(row.product_id ?? row.productId),
      quantity,
      unit_price_cents: unit,
      total_price_cents: total,
      created_at: null
    };
  });
};

const loadItemsFromOrderItems = async (
  admin: SupabaseClient,
  args: { sellerOrderId: string; orderId: string; sellerId: string }
) => {
  const preferred = await admin
    .from("order_items")
    .select("*")
    .eq("seller_order_id", args.sellerOrderId)
    .order("created_at", { ascending: true });

  if (!preferred.error) {
    return {
      items: (preferred.data ?? []).map((row) => mapOrderItemRow(row as Record<string, unknown>)),
      source: "order_items.seller_order_id" as const
    };
  }

  if (
    preferred.error.code !== "42703" &&
    preferred.error.code !== "PGRST204" &&
    !isMissingTableError(preferred.error)
  ) {
    throw new Error(preferred.error.message ?? "Falha ao consultar itens do pedido.");
  }

  if (isMissingTableError(preferred.error)) {
    return {
      items: [] as OrderItemResponse[],
      source: "order_items.missing" as const
    };
  }

  const fallbackBySeller = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", args.orderId)
    .eq("seller_id", args.sellerId)
    .order("created_at", { ascending: true });

  if (!fallbackBySeller.error) {
    return {
      items: (fallbackBySeller.data ?? []).map((row) => mapOrderItemRow(row as Record<string, unknown>)),
      source: "order_items.order_id_seller_id" as const
    };
  }

  if (
    fallbackBySeller.error.code !== "42703" &&
    fallbackBySeller.error.code !== "PGRST204" &&
    !isMissingTableError(fallbackBySeller.error)
  ) {
    throw new Error(fallbackBySeller.error.message ?? "Falha ao consultar itens do pedido.");
  }

  const fallbackByOrder = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", args.orderId)
    .order("created_at", { ascending: true });

  if (fallbackByOrder.error) {
    if (!isMissingTableError(fallbackByOrder.error)) {
      throw new Error(fallbackByOrder.error.message ?? "Falha ao consultar itens do pedido.");
    }
    return {
      items: [] as OrderItemResponse[],
      source: "order_items.missing" as const
    };
  }

  return {
    items: (fallbackByOrder.data ?? []).map((row) => mapOrderItemRow(row as Record<string, unknown>)),
    source: "order_items.order_id" as const
  };
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ seller_order_id: string }> }
) {
  const auth = await ensurePartnerApiContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const sellerOrderId = params.seller_order_id;

  try {
    const detail = await getPartnerSellerOrderById(auth.ctx.admin, {
      sellerId: auth.ctx.scope.sellerId,
      sellerOrderId
    });

    if (!detail) {
      return NextResponse.json({ error: "Pedido do lojista nao encontrado." }, { status: 404 });
    }

    let orderLookup = await auth.ctx.admin
      .from("orders")
      .select(
        "id,status,payment_status,total_order_cents,total_products_cents,total_shipping_cents,created_at,address"
      )
      .eq("id", detail.row.order_id)
      .maybeSingle();

    if (orderLookup.error?.code === "42703" || orderLookup.error?.code === "PGRST204") {
      orderLookup = await auth.ctx.admin.from("orders").select("*").eq("id", detail.row.order_id).maybeSingle();
    }

    if (orderLookup.error && !isMissingTableError(orderLookup.error)) {
      throw new Error(orderLookup.error.message ?? "Falha ao consultar pedido.");
    }

    const loadedItems = await loadItemsFromOrderItems(auth.ctx.admin, {
      sellerOrderId: detail.row.id,
      orderId: detail.row.order_id,
      sellerId: detail.row.seller_id
    });

    let items = loadedItems.items;
    let itemsSource: string = loadedItems.source;

    const subOrderLookup = await auth.ctx.admin
      .from("sub_orders")
      .select("id,order_id,seller_id,items,shipping_service,shipping_days,status,payment_status,created_at")
      .eq("id", detail.row.id)
      .maybeSingle();

    if (subOrderLookup.error && !isMissingTableError(subOrderLookup.error)) {
      throw new Error(subOrderLookup.error.message ?? "Falha ao consultar subpedido.");
    }

    const subOrderByPair =
      !subOrderLookup.data && !subOrderLookup.error
        ? await auth.ctx.admin
            .from("sub_orders")
            .select(
              "id,order_id,seller_id,items,shipping_service,shipping_days,status,payment_status,created_at"
            )
            .eq("order_id", detail.row.order_id)
            .eq("seller_id", detail.row.seller_id)
            .maybeSingle()
        : null;

    if (subOrderByPair?.error && !isMissingTableError(subOrderByPair.error)) {
      throw new Error(subOrderByPair.error.message ?? "Falha ao consultar subpedido.");
    }

    const subOrderData =
      (subOrderLookup.data as Record<string, unknown> | null) ??
      (subOrderByPair?.data as Record<string, unknown> | null);

    if (items.length === 0 && subOrderData) {
      items = mapSubOrderItems(subOrderData.items);
      itemsSource = "sub_orders.items";
    }

    const { shipmentsBySubOrderId } = await loadLatestShipmentsForSubOrders(auth.ctx.admin, [
      {
        id: detail.row.id,
        order_id: detail.row.order_id,
        seller_id: detail.row.seller_id
      }
    ]);
    const shipment = (shipmentsBySubOrderId[detail.row.id] ?? null) as Record<string, unknown> | null;
    const shippingMethod =
      detail.row.shipping_method ??
      toStringOrNull(shipment?.service_level) ??
      toStringOrNull(shipment?.carrier) ??
      toStringOrNull(subOrderData?.shipping_service);

    const trackingCode = detail.row.tracking_code ?? toStringOrNull(shipment?.tracking_code);

    return NextResponse.json({
      seller_id: auth.ctx.scope.sellerId,
      source: detail.source,
      seller_order: detail.row,
      order: orderLookup.data ?? null,
      items_source: itemsSource,
      items,
      shipping: {
        tracking_code: trackingCode,
        shipping_method: shippingMethod,
        shipped_at: detail.row.shipped_at ?? toStringOrNull(shipment?.updated_at),
        delivered_at: detail.row.delivered_at,
        shipment_status: toStringOrNull(shipment?.status),
        shipment_id: toStringOrNull(shipment?.id)
      },
      legacy_sub_order:
        subOrderData == null
          ? null
          : {
              id: String(subOrderData.id ?? ""),
              status: toStringOrNull(subOrderData.status),
              payment_status: toStringOrNull(subOrderData.payment_status),
              shipping_service: toStringOrNull(subOrderData.shipping_service),
              shipping_days: toNumber(subOrderData.shipping_days),
              created_at: toStringOrNull(subOrderData.created_at)
            }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar pedido do lojista.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
