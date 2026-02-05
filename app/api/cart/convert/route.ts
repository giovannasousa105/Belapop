import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

type ConvertPayload = {
  cartId?: string | null;
  anonId?: string | null;
  orderId?: string;
  userId?: string | null;
};

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();

  const payload: ConvertPayload = await request.json();
  const resolvedUserId =
    (await supabase.auth.getUser()).data.user?.id ?? payload.userId ?? null;
  if (!payload.cartId && !payload.anonId) {
    return NextResponse.json({ error: "Cart identifier is required." }, { status: 400 });
  }

  const query = supabase.from("carts").update({
    status: "converted",
    metadata: { orderId: payload.orderId }
  });

  if (payload.cartId) {
    query.eq("id", payload.cartId);
  } else if (resolvedUserId) {
    query.eq("user_id", resolvedUserId);
  } else if (payload.anonId) {
    query.eq("anon_id", payload.anonId);
  }

  const result = await query;
  if (result.error) {
    console.error("[cart/convert]", result.error);
    return NextResponse.json(
      { error: "Não foi possível marcar como convertido." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
