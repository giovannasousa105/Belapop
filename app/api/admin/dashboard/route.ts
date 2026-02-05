import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

type TrendRow = { date: string; gmv_cents: number; orders: number };

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const supabase = admin.supabase;

  // Trend (últimos 30 dias)
  const { data: trend } = await supabase
    .from("analytics_daily")
    .select("date,gmv_cents,orders")
    .order("date", { ascending: true })
    .limit(30);

  // KPIs básicos
  const { data: orders } = await supabase
    .from("orders")
    .select("total_cents,shipping_status,payment_status");
  const totalOrders = orders?.length ?? 0;
  const gmv = orders?.reduce((sum, o) => sum + (o.total_cents ?? 0), 0) ?? 0;
  const aov = totalOrders ? gmv / totalOrders : 0;

  const { data: sellers } = await supabase
    .from("sellers")
    .select("id,status");
  const activeSellers =
    sellers?.filter((s) => s.status === "active" || s.status === null).length ??
    0;

  // SLA frete (mock simples: % shipped/delivered vs total)
  const shipped =
    orders?.filter(
      (o) => o.shipping_status === "shipped" || o.shipping_status === "delivered"
    ).length ?? 0;
  const sla = totalOrders ? (shipped / totalOrders) * 100 : 0;

  // Pendências
  const { data: pendingProducts } = await supabase
    .from("products")
    .select("id")
    .eq("status", "review");
  const { data: pendingSellers } = await supabase
    .from("sellers")
    .select("id")
    .eq("status", "pending");

  // Vendas por categoria (agrupa no app)
  const { data: productRows } = await supabase
    .from("products")
    .select("category, price_cents, status");
  const byCategory: Record<string, number> = {};
  (productRows ?? []).forEach((row) => {
    const cat = row.category ?? "Indefinido";
    byCategory[cat] = (byCategory[cat] ?? 0) + (row.price_cents ?? 0);
  });

  // Funil (mock se não houver eventos)
  const funnel = [
    { label: "Visitas", value: 1200 },
    { label: "Add ao carrinho", value: 450 },
    { label: "Checkout", value: 220 },
    { label: "Pago", value: totalOrders || 110 }
  ];

  return NextResponse.json({
    kpis: {
      gmv_cents: gmv,
      total_orders: totalOrders,
      aov_cents: aov,
      active_sellers: activeSellers,
      sla_shipping: sla
    },
    trend: (trend ?? []) as TrendRow[],
    byCategory,
    funnel,
    pendings: {
      products: pendingProducts?.length ?? 0,
      sellers: pendingSellers?.length ?? 0
    }
  });
}
