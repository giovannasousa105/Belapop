import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { loadSubOrdersWithSellers } from "@/lib/api/v1/orders";

const ReorderPayloadSchema = z
  .object({
    sub_order_id: z.string().uuid().optional(),
    product_id: z.string().uuid().optional()
  })
  .strict();

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const toText = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

const toQuantity = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(1, Math.round(value));
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(1, Math.round(parsed));
  }
  return 1;
};

const parseBody = async (request: NextRequest) => {
  const raw = await request.text();
  if (!raw.trim()) return {};
  return ReorderPayloadSchema.parse(JSON.parse(raw));
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const bodyResult = await parseBody(request).catch((error) => ({ error }));
  if ("error" in bodyResult) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const { order_id: orderId } = await params;
  const { admin, userId } = auth.ctx;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,customer_id")
    .eq("id", orderId)
    .eq("customer_id", userId)
    .maybeSingle();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });

  const { subOrders } = await loadSubOrdersWithSellers(admin, [orderId]);
  const scopedSubOrders = bodyResult.sub_order_id
    ? subOrders.filter((subOrder) => subOrder.id === bodyResult.sub_order_id)
    : subOrders;

  if (bodyResult.sub_order_id && scopedSubOrders.length === 0) {
    return NextResponse.json({ error: "Subpedido nao encontrado." }, { status: 404 });
  }

  const aggregated = new Map<
    string,
    { product_id: string; seller_id: string; quantity: number }
  >();

  for (const subOrder of scopedSubOrders) {
    const items = Array.isArray(subOrder.items) ? subOrder.items : [];
    for (const rawItem of items) {
      const item = asRecord(rawItem);
      const productId = toText(item.product_id ?? item.productId ?? item.id);
      if (!productId) continue;
      if (bodyResult.product_id && productId !== bodyResult.product_id) continue;

      const key = `${subOrder.seller_id}:${productId}`;
      const current = aggregated.get(key);
      aggregated.set(key, {
        product_id: productId,
        seller_id: subOrder.seller_id,
        quantity: (current?.quantity ?? 0) + toQuantity(item.quantity ?? item.qty)
      });
    }
  }

  if (bodyResult.product_id && aggregated.size === 0) {
    return NextResponse.json({ error: "Item nao encontrado nesse pedido." }, { status: 404 });
  }

  const productIds = Array.from(new Set(Array.from(aggregated.values()).map((item) => item.product_id)));
  if (!productIds.length) {
    return NextResponse.json({ error: "Nao ha itens disponiveis para recompra." }, { status: 409 });
  }

  const { data: productRows, error: productsError } = await admin
    .from("products")
    .select("id,name,seller_id,status,stock_quantity")
    .in("id", productIds);

  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });

  const productMap = new Map(
    (productRows ?? []).map((row) => [row.id as string, row as {
      id: string;
      name: string | null;
      seller_id: string | null;
      status: string | null;
      stock_quantity: number | null;
    }])
  );

  const items = Array.from(aggregated.values());
  const available = items
    .map((item) => {
      const product = productMap.get(item.product_id);
      if (!product) return null;
      if (product.status !== "published") return null;
      if (typeof product.stock_quantity === "number" && product.stock_quantity <= 0) return null;

      return {
        product_id: item.product_id,
        product_name: product.name ?? "Produto",
        seller_id: product.seller_id ?? item.seller_id,
        quantity: item.quantity
      };
    })
    .filter(
      (
        item
      ): item is {
        product_id: string;
        product_name: string;
        seller_id: string;
        quantity: number;
      } => Boolean(item)
    );

  const unavailable_items = items
    .filter((item) => !available.some((candidate) => candidate.product_id === item.product_id))
    .map((item) => {
      const product = productMap.get(item.product_id);
      return {
        product_id: item.product_id,
        product_name: product?.name ?? "Produto",
        reason: !product ? "missing" : product.status !== "published" ? "unpublished" : "out_of_stock"
      };
    });

  if (!available.length) {
    return NextResponse.json(
      {
        error: "Os itens desse pedido nao estao disponiveis para recompra agora.",
        unavailable_items
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    order_id: orderId,
    items: available,
    unavailable_items,
    summary: {
      products_count: available.length,
      items_count: available.reduce((sum, item) => sum + item.quantity, 0)
    }
  });
}
