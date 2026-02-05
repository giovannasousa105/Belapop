import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const supabase = admin.supabase;

  try {
    const { data } = await supabase
      .from("coupons")
      .select("id, code, discount_type, value_cents, percent, starts_at, ends_at, status")
      .order("starts_at", { ascending: false });
    return NextResponse.json({ coupons: data ?? [] });
  } catch (e) {
    return NextResponse.json({ coupons: [] });
  }
}
