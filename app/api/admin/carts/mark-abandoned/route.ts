import { NextRequest, NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const admin = await ensureAdminRequest(request);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const supabase = await getSupabaseServerClient();
  const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("carts")
    .update({ status: "abandoned" })
    .eq("status", "active")
    .lt("updated_at", threshold)
    .select("id");

  if (error) {
    console.error("[cart/mark-abandoned]", error);
    return NextResponse.json({ error: "Falha ao marcar abandonados" }, { status: 500 });
  }

  return NextResponse.json({ updated: data?.length ?? 0 });
}
