import { NextResponse } from "next/server";

import { analyticsEventTypes } from "@/lib/analytics/types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: string;
      timestamp?: string;
      userId?: string | null;
      sellerId?: string | null;
      productId?: string | null;
      orderId?: string | null;
      metadata?: Record<string, unknown> | null;
    };

    if (!body?.type || !analyticsEventTypes.includes(body.type as any)) {
      return NextResponse.json(
        { error: "Tipo de evento inválido." },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("analytics_events").insert({
      type: body.type,
      timestamp: body.timestamp ? new Date(body.timestamp) : undefined,
      user_id: body.userId ?? null,
      seller_id: body.sellerId ?? null,
      product_id: body.productId ?? null,
      order_id: body.orderId ?? null,
      metadata: body.metadata ?? null
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao registrar evento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
