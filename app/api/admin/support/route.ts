import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  try {
    const { data } = await supabase
      .from("support_tickets")
      .select("id, status, priority, customer_id, order_id, sla_deadline, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ tickets: data ?? [] });
  } catch (e) {
    return NextResponse.json({ tickets: [] });
  }
}
