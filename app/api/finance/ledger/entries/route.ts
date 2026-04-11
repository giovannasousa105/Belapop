import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  FINANCE_LEDGER_MIGRATION,
  assertScopedStore,
  missingMigrationResponse,
  parsePagination,
  requireFinanceScope
} from "../../adjustments/_shared";

export async function GET(request: NextRequest) {
  const auth = await requireFinanceScope("finance.view_details");
  if (!auth.ok) return auth.response;

  const { scope } = auth;
  const storeId = request.nextUrl.searchParams.get("store_id");
  const scopeCheck = assertScopedStore(storeId, scope.sellerId);
  if (!scopeCheck.ok) return scopeCheck.response;

  const payoutId = request.nextUrl.searchParams.get("payout_id");
  const orderId = request.nextUrl.searchParams.get("order_id");
  const account = request.nextUrl.searchParams.get("account");
  const fromDate = request.nextUrl.searchParams.get("from");
  const toDate = request.nextUrl.searchParams.get("to");
  const { page, pageSize, from, to } = parsePagination(request.nextUrl.searchParams, {
    pageSize: 50,
    maxPageSize: 200
  });

  const admin = getSupabaseAdminClient();
  let query = admin
    .from("ledger_entries")
    .select(
      "id,store_id,payout_id,order_id,account_code,direction,amount,currency,occurred_at,journal_id,ledger_journals:journal_id(reference_type,reference_id)",
      {
        count: "exact"
      }
    )
    .eq("store_id", scope.sellerId)
    .order("occurred_at", { ascending: false })
    .range(from, to);

  if (payoutId) {
    query = query.eq("payout_id", payoutId);
  }
  if (orderId) {
    query = query.eq("order_id", orderId);
  }
  if (account) {
    query = query.eq("account_code", account);
  }
  if (fromDate) {
    query = query.gte("occurred_at", `${fromDate}T00:00:00.000Z`);
  }
  if (toDate) {
    query = query.lte("occurred_at", `${toDate}T23:59:59.999Z`);
  }

  const result = await query;
  if (result.error) {
    const missing = missingMigrationResponse(
      result.error,
      "ledger_entries",
      FINANCE_LEDGER_MIGRATION
    );
    if (missing) return missing;

    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const items = (result.data ?? []).map((entry) => {
    const reference =
      Array.isArray(entry.ledger_journals) && entry.ledger_journals.length > 0
        ? entry.ledger_journals[0]
        : !Array.isArray(entry.ledger_journals)
          ? entry.ledger_journals
          : null;

    return {
      entry_id: entry.id,
      store_id: entry.store_id,
      payout_id: entry.payout_id,
      order_id: entry.order_id,
      account: entry.account_code,
      direction: entry.direction,
      amount: entry.amount,
      currency: entry.currency,
      occurred_at: entry.occurred_at,
      reference_type: reference?.reference_type ?? null,
      reference_id: reference?.reference_id ?? null
    };
  });

  return NextResponse.json({
    page,
    page_size: pageSize,
    total: result.count ?? items.length,
    items
  });
}
