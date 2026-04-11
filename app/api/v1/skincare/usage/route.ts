import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { skincareUsageStartSchema } from "@/lib/skincare/contracts";
import { refreshProductEffectivenessForUser } from "@/lib/skincare/server";

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = await request.json().catch(() => ({}));
  const parsed = skincareUsageStartSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalido.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { data: cartId, error } = await admin.rpc("begin_skincare_usage", {
      p_user_id: userId,
      p_cart_id: parsed.data.cart_id ?? null,
      p_start_date: parsed.data.start_date ?? new Date().toISOString().slice(0, 10)
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const [{ data: usageRows, error: usageError }, { data: cartItems, error: cartItemsError }] = await Promise.all([
      admin
        .from("skincare_usage")
        .select("id,user_id,product_id,routine_cart_id,start_date,end_date,adherence_score,metadata,created_at")
        .eq("routine_cart_id", cartId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      admin.from("routine_cart_items").select("product_id").eq("cart_id", cartId)
    ]);

    if (usageError ?? cartItemsError) {
      return NextResponse.json({ error: (usageError ?? cartItemsError)?.message }, { status: 500 });
    }

    const productIds = (cartItems ?? []).map((item) => item.product_id);
    const { data: products, error: productsError } = productIds.length
      ? await admin.from("products").select("id,name,hero_image_url,images").in("id", productIds)
      : { data: [], error: null };

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    await refreshProductEffectivenessForUser(admin, userId);

    return NextResponse.json({
      ok: true,
      cart_id: cartId,
      start_date: parsed.data.start_date ?? new Date().toISOString().slice(0, 10),
      total_products: (usageRows ?? []).length,
      items: (products ?? []).map((item) => ({
        product_id: item.id,
        name: item.name,
        hero_image_url: item.hero_image_url ?? null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao iniciar acompanhamento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
