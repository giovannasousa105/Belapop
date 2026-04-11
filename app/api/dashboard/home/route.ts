import { NextRequest, NextResponse } from "next/server";

import { hasPermission } from "@/lib/rbac/sellerPolicy";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { buildDashboardHomeMockResponse } from "@/lib/seller/dashboard/homeMockPayload";
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
  if (!scope) {
    return NextResponse.json({ error: "Acesso negado ao dashboard." }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const payload = buildDashboardHomeMockResponse({
    period: params.get("period"),
    compare: params.get("compare"),
    channel: params.get("channel"),
    state: params.get("state"),
    city: params.get("city"),
    category_id: params.get("category_id")
  }) as Record<string, unknown>;

  if (!hasPermission(scope.rbac, "finance.view_details")) {
    const cards = Array.isArray(payload.cards)
      ? (payload.cards as Array<Record<string, unknown>>).filter((card) => card.key !== "net_revenue")
      : payload.cards;
    payload.cards = cards;
    payload.finance = {
      balance_to_receive: null,
      next_payout_date: null,
      has_disputes: null,
      disputes_count: null
    };
  }

  return NextResponse.json(payload);
}
