import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,created_at");

  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, quantity, total_cents");

  const totalOrders = orders?.length ?? 0;
  const paid = orders?.filter((o) => ["paid", "processing", "shipped", "delivered"].includes(o.status)).length ?? 0;
  const funnel = [
    { label: "Visitas", value: 0 }, // sem eventos, fica zero
    { label: "Add ao carrinho", value: 0 },
    { label: "Checkout", value: totalOrders },
    { label: "Pago", value: paid }
  ];

  const revenueByOrder: Record<string, number> = {};
  (items ?? []).forEach((it) => {
    const key = it.order_id;
    revenueByOrder[key] = (revenueByOrder[key] ?? 0) + (it.total_cents ?? 0);
  });

  const topOrders = Object.entries(revenueByOrder)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([order_id, value]) => ({ order_id, value }));

  return NextResponse.json({ funnel, topOrders });
}
