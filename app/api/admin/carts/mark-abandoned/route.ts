import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
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
