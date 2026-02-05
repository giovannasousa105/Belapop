import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const anonId = searchParams.get("anonId");
  const limit = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);

  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from("carts")
    .select(
      "id,status,subtotal_cents,items,updated_at,anon_id,metadata,profiles(id,email)"
    )
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (anonId) {
    query = query.ilike("anon_id", `%${anonId}%`);
  }

  const result = await query;
  if (result.error) {
    console.error("[admin/carts/list]", result.error);
    return NextResponse.json({ error: "Erro ao buscar os carrinhos." }, { status: 500 });
  }

  return NextResponse.json({
    data: result.data ?? [],
    count: result.count ?? 0
  });
}
