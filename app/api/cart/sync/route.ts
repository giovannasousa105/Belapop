import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

type CartSyncPayload = {
  items: unknown[];
  subtotalCents: number;
  anonId?: string | null;
  cartId?: string | null;
  userId?: string | null;
};

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const body: CartSyncPayload = await request.json();
  const resolvedUserId =
    (await supabase.auth.getUser()).data.user?.id ?? body.userId ?? null;
  if (!resolvedUserId && !body.anonId) {
    return NextResponse.json({ error: "Anon ID or user must be provided." }, { status: 400 });
  }

  const payload = {
    user_id: resolvedUserId,
    anon_id: body.anonId ?? null,
    items: body.items,
    subtotal_cents: body.subtotalCents ?? 0,
    status: "active"
  };

  const query = body.cartId
    ? supabase.from("carts").update(payload).eq("id", body.cartId)
    : supabase
        .from("carts")
        .upsert(payload, {
          onConflict: resolvedUserId ? "user_id" : "anon_id"
        });

  const result = await query.select("id").maybeSingle();
  if (result.error) {
    console.error("[cart/sync]", result.error);
    return NextResponse.json(
      { error: "Não foi possível sincronizar o carrinho." },
      { status: 500 }
    );
  }
  const id = result.data?.id ?? body.cartId ?? null;
  return NextResponse.json({ cartId: id });
}
