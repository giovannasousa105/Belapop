import { NextResponse } from "next/server";
import { adminDbError, ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const supabase = admin.supabase;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  let q = supabase.from("products").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return adminDbError(error, "products list");
  return NextResponse.json({ products: data });
}
