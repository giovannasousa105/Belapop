import { NextResponse } from "next/server";
import { adminDbError, ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const supabase = admin.supabase;
  const { data, error } = await supabase
    .from("sellers")
    .select("id, store_name, status, category, postal_code, commission_rate, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return adminDbError(error, "sellers list");
  return NextResponse.json({ sellers: data });
}
