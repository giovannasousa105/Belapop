import { NextRequest, NextResponse } from "next/server";

import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope || !scope.canViewAudit) {
    return NextResponse.json({ error: "Acao restrita. Solicite ao Admin." }, { status: 403 });
  }

  const limitRaw = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(200, Math.max(1, Number(limitRaw ?? 50)));

  const admin = getSupabaseAdminClient();
  const query = await admin
    .from("seller_audit_logs")
    .select("*")
    .eq("seller_id", scope.sellerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query.error) {
    return NextResponse.json({ error: query.error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: query.data ?? [] });
}
