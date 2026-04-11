import { NextResponse } from "next/server";

import { calculateShippingForSeller } from "@/lib/shipping/calculateShippingForSeller";
import { buildShippingItems } from "@/lib/shipping/prepareItems";
import { loadCartItemsForCheckout } from "@/lib/cart/serverCart";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { Product, ShippingCartItem } from "@/lib/types";

const sanitizeCep = (value: string) => value.replace(/\D/g, "");

const PRODUCT_SELECT =
  "id,name,price_cents,currency,category,description,images,status,created_at,updated_at,seller_id,weight_kg,width_cm,height_cm,length_cm,highlights,image_tone,is_featured,stock_quantity";

const toAmount = (value: number) => Number((value / 100).toFixed(2));

const mapProductRow = (row: Record<string, unknown>): Product => ({
  id: String(row.id ?? ""),
  name: String(row.name ?? ""),
  price: toAmount(Number(row.price_cents ?? 0)),
  category: String(row.category ?? "Skincare") as Product["category"],
  description: String(row.description ?? ""),
  images: Array.isArray(row.images) ? (row.images as string[]) : [],
  status: String(row.status ?? "draft") as Product["status"],
  createdAt: String(row.created_at ?? new Date().toISOString()),
  updatedAt: String(row.updated_at ?? ""),
  sellerId: String(row.seller_id ?? ""),
  weightKg:
    typeof row.weight_kg === "number" ? row.weight_kg : Number(row.weight_kg ?? NaN),
  widthCm:
    typeof row.width_cm === "number" ? row.width_cm : Number(row.width_cm ?? NaN),
  heightCm:
    typeof row.height_cm === "number" ? row.height_cm : Number(row.height_cm ?? NaN),
  lengthCm:
    typeof row.length_cm === "number" ? row.length_cm : Number(row.length_cm ?? NaN),
  highlights: Array.isArray(row.highlights) ? (row.highlights as string[]) : [],
  imageTone: (row.image_tone ?? undefined) as Product["imageTone"],
  featured: Boolean(row.is_featured),
  stockQuantity:
    row.stock_quantity === null || row.stock_quantity === undefined
      ? undefined
      : Number(row.stock_quantity)
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      destinationCep?: string;
      cartId?: string | null;
      anonId?: string | null;
    };

    const destinationCep = sanitizeCep(body?.destinationCep ?? "");
    if (destinationCep.length !== 8) {
      return NextResponse.json(
        { error: "CEP inválido. Use 8 dígitos." },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    let cart: Awaited<ReturnType<typeof loadCartItemsForCheckout>>;
    try {
      cart = await loadCartItemsForCheckout({
        userId: user?.id ?? null,
        cartId: body?.cartId ?? null,
        anonId: body?.anonId ?? null
      });
    } catch (error) {
      const cartError = error as Error & { code?: string };
      if (cartError.code === "CART_ACCESS_DENIED" && user?.id && body?.cartId) {
        cart = await loadCartItemsForCheckout({ userId: user.id });
      } else {
        throw error;
      }
    }

    const admin = getSupabaseAdminClient();
    const productIds = cart.items.map((item) => item.productId);
    const productLookup = await admin
      .from("products")
      .select(PRODUCT_SELECT)
      .in("id", productIds);

    if (productLookup.error) {
      return NextResponse.json(
        { error: `Falha ao carregar produtos: ${productLookup.error.message}` },
        { status: 500 }
      );
    }

    const productMap = new Map(
      (productLookup.data ?? []).map((row) => {
        const product = mapProductRow(row as Record<string, unknown>);
        return [product.id, product] as const;
      })
    );

    const missingProducts = cart.items.filter((item) => !productMap.has(item.productId));
    if (missingProducts.length > 0) {
      return NextResponse.json(
        { error: "Um ou mais produtos nao foram encontrados no catalogo." },
        { status: 400 }
      );
    }

    const shippingItems = buildShippingItems(
      cart.items.map((item) => ({
        product: productMap.get(item.productId)!,
        quantity: item.quantity
      }))
    );

    if (shippingItems.length === 0) {
      return NextResponse.json(
        { error: "Itens inválidos para cálculo de frete." },
        { status: 400 }
      );
    }

    const grouped: Record<string, ShippingCartItem[]> = {};
    shippingItems.forEach((item) => {
      if (!grouped[item.sellerId]) {
        grouped[item.sellerId] = [];
      }
      grouped[item.sellerId].push(item);
    });

    const results = await Promise.all(
      Object.entries(grouped).map(async ([sellerId, items]) => {
        try {
          const result = await calculateShippingForSeller(
            sellerId,
            items,
            destinationCep
          );
          return { sellerId, ...result };
        } catch (error) {
          console.error("[shipping/quote]", error);
          return {
            sellerId,
            error: "Nao foi possivel calcular o envio desta loja.",
            errorCode: "SHIPPING_QUOTE_FAILED"
          };
        }
      })
    );

    const shipments = results.map((result) => result.shipment).filter(Boolean);

    const errors = results
      .filter((result) => result.error)
      .map((result) => ({
        sellerId: result.sellerId,
        sellerName: result.sellerName ?? "Loja parceira",
        message: result.error,
        code: result.errorCode
      }));

    const totalShipping = shipments.reduce(
      (total, shipment) => total + (shipment?.price ?? 0),
      0
    );

    const hasConfigError = errors.some(
      (error) => error.code === "SHIPPING_PROVIDER_NOT_CONFIGURED"
    );

    return NextResponse.json(
      { shipments, totalShipping, errors },
      { status: hasConfigError ? 503 : 200 }
    );
  } catch (error) {
    const typed = error as Error & { code?: string };
    if (typed.code === "CART_NOT_FOUND") {
      return NextResponse.json({ error: typed.message }, { status: 404 });
    }
    if (typed.code === "CART_EMPTY") {
      return NextResponse.json({ error: typed.message }, { status: 400 });
    }
    if (typed.code === "CART_ACCESS_DENIED") {
      return NextResponse.json({ error: typed.message }, { status: 403 });
    }
    if (typed.code === "CART_INACTIVE") {
      return NextResponse.json({ error: typed.message }, { status: 409 });
    }

    console.error("[shipping/quote]", error);
    return NextResponse.json(
      { error: "Nao foi possivel calcular o frete agora." },
      { status: 500 }
    );
  }
}
