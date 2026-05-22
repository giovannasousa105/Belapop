import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type ConvertPayload = {
  cartId?: string | null;
  anonId?: string | null;
  orderId?: string;
};

export async function POST(request: NextRequest) {
  const authSupabase = await getSupabaseServerClient();
  const supabase = getSupabaseAdminClient();

  const payload: ConvertPayload = await request.json();
  const resolvedUserId =
    (await authSupabase.auth.getUser()).data.user?.id ?? null;
  const rawAnonId = typeof payload.anonId === "string" ? payload.anonId.trim() : "";
  const anonId = /^[a-zA-Z0-9._:-]{8,160}$/.test(rawAnonId) ? rawAnonId : null;

  if (!payload.cartId && !payload.anonId) {
    return NextResponse.json({ error: "Cart identifier is required." }, { status: 400 });
  }

  const query = supabase.from("carts").update({
    status: "converted",
    metadata: { orderId: payload.orderId }
  });

  if (payload.cartId) {
    query.eq("id", payload.cartId);
    if (resolvedUserId) {
      query.eq("user_id", resolvedUserId);
    } else if (anonId) {
      query.eq("anon_id", anonId).is("user_id", null);
    } else {
      return NextResponse.json({ error: "Cart owner is required." }, { status: 401 });
    }
  } else if (resolvedUserId) {
    query.eq("user_id", resolvedUserId);
  } else if (anonId) {
    query.eq("anon_id", anonId).is("user_id", null);
  }

  const result = await query.select("id");
  if (result.error) {
    console.error("[cart/convert]", result.error);
    return NextResponse.json(
      { error: "Não foi possível marcar como convertido." },
      { status: 500 }
    );
  }

  if (!result.data?.length) {
    return NextResponse.json({ error: "Carrinho não autorizado." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
