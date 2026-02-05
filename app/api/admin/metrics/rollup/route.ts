import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function POST(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const start = new Date(dateStr);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const { data: orders, error } = await supabase
    .from("orders")
    .select("total_cents, status, created_at")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const gmv = orders?.reduce((sum, o) => sum + (o.total_cents ?? 0), 0) ?? 0;
  const count = orders?.length ?? 0;
  const aov = count ? Math.round(gmv / count) : 0;
  const cancel = orders?.filter((o) => o.status === "cancelled").length ?? 0;
  const cancelRate = count ? cancel / count : 0;

  await supabase.from("metrics_daily").upsert({
    date: dateStr,
    gmv_cents: gmv,
    orders: count,
    aov_cents: aov,
    cancel_rate: cancelRate,
    sla_compliance: null
  });

  return NextResponse.json({ ok: true, date: dateStr, gmv, orders: count, aov, cancelRate });
}
