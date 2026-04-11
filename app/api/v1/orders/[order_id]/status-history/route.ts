import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

type HistoryRow = {
  id: string;
  status: string;
  created_at: string;
};

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

const isMissingRelation = (error: SupabaseErrorLike | null | undefined) =>
  error?.code === "42P01" || String(error?.message ?? "").toLowerCase().includes("order_status_history");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { order_id: orderId } = await params;
  const { admin, userId } = auth.ctx;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id,customer_id,status,created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order || order.customer_id !== userId) {
    return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });
  }

  const { data, error } = await admin
    .from("order_status_history")
    .select("id,status,created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error && !isMissingRelation(error as SupabaseErrorLike)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const history = (data ?? []) as HistoryRow[];
  if (history.length > 0) {
    return NextResponse.json({ history });
  }

  return NextResponse.json({
    history: [
      {
        id: `${order.id}-snapshot`,
        status: order.status ?? "created",
        created_at: order.created_at
      }
    ]
  });
}
