import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

type HistoryRow = {
  id: string;
  status: string;
  created_at: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: orderId } = await params;
  const { data: order } = await supabase
    .from("orders")
    .select("id,customer_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.customer_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data } = await supabase
    .from("order_status_history")
    .select("id,status,created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ history: (data ?? []) as HistoryRow[] });
}
