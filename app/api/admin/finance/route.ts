import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  // Recebíveis: pedidos pagos ou entregues
  const { data: orders } = await supabase
    .from("orders")
    .select("total_cents, status, created_at")
    .in("status", ["paid", "processing", "shipped", "delivered"]);
  const receivable = orders?.reduce((s, o) => s + (o.total_cents ?? 0), 0) ?? 0;

  // Payouts agendados (se tabela não existir, ignora)
  let payouts: any[] = [];
  try {
    const { data } = await supabase.from("payouts").select("id, seller_id, amount_cents, status, scheduled_for");
    payouts = data ?? [];
  } catch (e) {
    payouts = [];
  }

  const nextPayout = payouts.find((p) => p.status === "scheduled")?.scheduled_for ?? null;

  // Taxas simples: 10% do receivable
  const fees = Math.round(receivable * 0.1);

  return NextResponse.json({ receivable, nextPayout, fees, payouts });
}
