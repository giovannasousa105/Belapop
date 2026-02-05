import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity, total_cents");

  const { data: products } = await supabase
    .from("products")
    .select("id, name");
  const nameById = new Map((products ?? []).map((p) => [p.id, p.name ?? "Produto"]));

  const agg: Record<string, { qty: number; revenue: number }> = {};
  (items ?? []).forEach((it) => {
    const key = it.product_id;
    const qty = (it as any).quantity ?? 0;
    const rev = (it as any).total_cents ?? 0;
    agg[key] = { qty: (agg[key]?.qty ?? 0) + qty, revenue: (agg[key]?.revenue ?? 0) + rev };
  });

  const topProducts = Object.entries(agg)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id, v]) => ({ id, name: nameById.get(id) ?? id, qty: v.qty, revenue: v.revenue }));

  // Top sellers via products->sellers not joined; placeholder revenue sum
  const { data: sellers } = await supabase.from("sellers").select("id, store_name");
  const sellerAgg: Record<string, number> = {};
  (items ?? []).forEach((it) => {
    const sellerId = (it as any).seller_id;
    if (!sellerId) return;
    sellerAgg[sellerId] = (sellerAgg[sellerId] ?? 0) + ((it as any).total_cents ?? 0);
  });

  const topSellers = Object.entries(sellerAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, revenue]) => ({ id, name: sellers?.find((s) => s.id === id)?.store_name ?? id, revenue }));

  return NextResponse.json({ topProducts, topSellers });
}
