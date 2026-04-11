import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { hasPermission } from "@/lib/rbac/sellerPolicy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { resolveStoreIdForSeller } from "@/lib/tracking/shipmentLookup";

const isFinancialRuleType = (type: string) => {
  const normalized = type.toLowerCase();
  return (
    normalized.includes("payout") ||
    normalized.includes("dispute") ||
    normalized.includes("finance")
  );
};

const isMissingRelation = (message: string) => {
  const m = message.toLowerCase();
  return m.includes("relation") && m.includes("alert_rules");
};

export async function GET(_request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  const storeId = await resolveStoreIdForSeller(admin, scope.sellerId);
  const query = await admin
    .from("alert_rules")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (query.error) {
    if (isMissingRelation(query.error.message)) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: query.error.message }, { status: 500 });
  }

  return NextResponse.json(query.data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    condition?: Record<string, unknown>;
    action?: Record<string, unknown>;
    is_active?: boolean;
  };

  const name = String(body.name ?? "").trim();
  if (!name || !body.condition || !body.action) {
    return NextResponse.json(
      { error: "name, condition e action sao obrigatorios." },
      { status: 400 }
    );
  }

  const type = String((body.condition as any)?.type ?? "");
  if (isFinancialRuleType(type) && !hasPermission(scope.rbac, "finance.view_details")) {
    return NextResponse.json(
      { error: "Acao restrita para regras financeiras." },
      { status: 403 }
    );
  }

  const admin = getSupabaseAdminClient();
  const storeId = await resolveStoreIdForSeller(admin, scope.sellerId);

  const insert = await admin.from("alert_rules").insert({
    id: randomUUID(),
    store_id: storeId,
    name,
    condition: body.condition,
    action: body.action,
    is_active: body.is_active ?? true
  }).select("*").single();

  if (insert.error) {
    if (isMissingRelation(insert.error.message)) {
      return NextResponse.json(
        { error: "Tabela alert_rules nao encontrada. Rode as migrations enterprise." },
        { status: 501 }
      );
    }
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  return NextResponse.json(insert.data, { status: 201 });
}
