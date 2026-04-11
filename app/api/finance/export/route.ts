import { NextResponse } from "next/server";

import { hasPermission, isRoleAllowed } from "@/lib/rbac/sellerPolicy";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope || !isRoleAllowed(scope.rbac, ["FINANCEIRO"])) {
    return NextResponse.json({ error: "Acesso restrito ao financeiro." }, { status: 403 });
  }
  if (!hasPermission(scope.rbac, "finance.export")) {
    return NextResponse.json({ error: "Permissao finance.export obrigatoria." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  let payoutsQuery = admin
    .from("payouts")
    .select("id,seller_id,partner_id,amount_cents,status,scheduled_for,paid_at,created_at")
    .or(`seller_id.eq.${scope.sellerId},partner_id.eq.${scope.sellerId}`)
    .order("created_at", { ascending: false })
    .limit(500);

  let payouts: Array<Record<string, unknown>> = [];
  const primaryResult = await payoutsQuery;
  if (primaryResult.error && primaryResult.error.code === "42703") {
    const legacyResult = await admin
      .from("payouts")
      .select("id,seller_id,amount_cents,status,scheduled_for,paid_at,created_at")
      .eq("seller_id", scope.sellerId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (legacyResult.error) {
      return NextResponse.json({ error: legacyResult.error.message }, { status: 500 });
    }
    payouts = (legacyResult.data ?? []) as Array<Record<string, unknown>>;
  } else if (primaryResult.error) {
    return NextResponse.json({ error: primaryResult.error.message }, { status: 500 });
  } else {
    payouts = (primaryResult.data ?? []) as Array<Record<string, unknown>>;
  }

  const header = [
    "id",
    "seller_id",
    "amount_cents",
    "status",
    "scheduled_for",
    "paid_at",
    "created_at"
  ];

  const rows = payouts.map((row) =>
    [
      row.id,
      row.seller_id,
      row.amount_cents,
      row.status,
      row.scheduled_for,
      row.paid_at,
      row.created_at
    ]
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=\"finance-export.csv\""
    }
  });
}
