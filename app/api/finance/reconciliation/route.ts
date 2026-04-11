import { NextRequest, NextResponse } from "next/server";

import { hasPermission, isRoleAllowed } from "@/lib/rbac/sellerPolicy";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toCentsFromBrl = (value: unknown) => Math.round(toNumber(value) * 100);

export async function GET(request: NextRequest) {
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
  if (!hasPermission(scope.rbac, "finance.view_details")) {
    return NextResponse.json({ error: "Permissao finance.view_details obrigatoria." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  const periodStart = request.nextUrl.searchParams.get("start");
  const periodEnd = request.nextUrl.searchParams.get("end");

  let subOrdersQuery = admin
    .from("sub_orders")
    .select(
      "id,order_id,status,payment_status,created_at,product_total_cents,shipping_total_cents,platform_fee_cents,seller_net_cents"
    )
    .eq("seller_id", scope.sellerId)
    .order("created_at", { ascending: false })
    .limit(2500);

  if (periodStart) {
    subOrdersQuery = subOrdersQuery.gte("created_at", periodStart);
  }
  if (periodEnd) {
    subOrdersQuery = subOrdersQuery.lte("created_at", periodEnd);
  }

  const subOrdersResult = await subOrdersQuery;
  if (subOrdersResult.error) {
    return NextResponse.json({ error: subOrdersResult.error.message }, { status: 500 });
  }

  const subOrders = (subOrdersResult.data ?? []) as Array<Record<string, unknown>>;
  const orderIds = Array.from(
    new Set(
      subOrders
        .map((subOrder) => (subOrder.order_id ? String(subOrder.order_id) : null))
        .filter((value): value is string => Boolean(value))
    )
  );

  const ordersResult =
    orderIds.length > 0
      ? await admin
          .from("orders")
          .select("id,total_cents,total_order_cents,status,payment_status,created_at")
          .in("id", orderIds.slice(0, 1000))
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (ordersResult.error) {
    return NextResponse.json({ error: ordersResult.error.message }, { status: 500 });
  }

  let payoutsQuery = admin
    .from("payouts")
    .select(
      "id,seller_id,partner_id,amount_cents,status,scheduled_for,paid_at,created_at,period_start,period_end"
    )
    .or(`seller_id.eq.${scope.sellerId},partner_id.eq.${scope.sellerId}`)
    .order("created_at", { ascending: false })
    .limit(250);

  if (periodStart) {
    payoutsQuery = payoutsQuery.gte("created_at", periodStart);
  }
  if (periodEnd) {
    payoutsQuery = payoutsQuery.lte("created_at", periodEnd);
  }

  let payoutsRows: Array<Record<string, unknown>> = [];
  const payoutsResultPrimary = await payoutsQuery;

  if (payoutsResultPrimary.error && payoutsResultPrimary.error.code === "42703") {
    let legacyPayoutsQuery = admin
      .from("payouts")
      .select("id,seller_id,amount_cents,status,scheduled_for,paid_at,created_at,period_start,period_end")
      .eq("seller_id", scope.sellerId)
      .order("created_at", { ascending: false })
      .limit(250);
    if (periodStart) legacyPayoutsQuery = legacyPayoutsQuery.gte("created_at", periodStart);
    if (periodEnd) legacyPayoutsQuery = legacyPayoutsQuery.lte("created_at", periodEnd);
    const payoutsResultLegacy = await legacyPayoutsQuery;
    if (payoutsResultLegacy.error) {
      return NextResponse.json({ error: payoutsResultLegacy.error.message }, { status: 500 });
    }
    payoutsRows = (payoutsResultLegacy.data ?? []) as Array<Record<string, unknown>>;
  } else if (payoutsResultPrimary.error) {
    return NextResponse.json({ error: payoutsResultPrimary.error.message }, { status: 500 });
  } else {
    payoutsRows = (payoutsResultPrimary.data ?? []) as Array<Record<string, unknown>>;
  }

  let ledgerQuery = admin
    .from("ledger_entries")
    .select("account_code,direction,amount,occurred_at")
    .eq("store_id", scope.sellerId)
    .order("occurred_at", { ascending: false })
    .limit(5000);

  if (periodStart) ledgerQuery = ledgerQuery.gte("occurred_at", periodStart);
  if (periodEnd) ledgerQuery = ledgerQuery.lte("occurred_at", periodEnd);

  const ledgerResult = await ledgerQuery;
  const ledgerRows: Array<Record<string, unknown>> =
    ledgerResult.error && ledgerResult.error.code === "42P01"
      ? []
      : ((ledgerResult.data ?? []) as Array<Record<string, unknown>>);

  let snapshotQuery = admin
    .from("order_financial_snapshot")
    .select("gmv,fee,coupon_marketplace,gateway_fee,marketplace_margin,seller_payout_amount,computed_at")
    .eq("store_id", scope.sellerId)
    .limit(5000);

  if (periodStart) snapshotQuery = snapshotQuery.gte("computed_at", periodStart);
  if (periodEnd) snapshotQuery = snapshotQuery.lte("computed_at", periodEnd);

  const snapshotResult = await snapshotQuery;
  const snapshotRows: Array<Record<string, unknown>> =
    snapshotResult.error && snapshotResult.error.code === "42P01"
      ? []
      : ((snapshotResult.data ?? []) as Array<Record<string, unknown>>);

  const grossFromSubOrdersCents = subOrders.reduce(
    (sum, row) =>
      sum +
      toNumber(row.product_total_cents ?? row.product_total ?? row.total_products_cents) +
      toNumber(row.shipping_total_cents ?? row.shipping_total ?? row.total_shipping_cents),
    0
  );
  const sellerNetFromSubOrdersCents = subOrders.reduce(
    (sum, row) => sum + toNumber(row.seller_net_cents ?? row.seller_net_amount),
    0
  );

  const payoutsPaidCents = payoutsRows
    .filter((row) => String(row.status ?? "").toLowerCase() === "paid")
    .reduce((sum, row) => sum + toNumber(row.amount_cents), 0);
  const payoutsPendingCents = payoutsRows
    .filter((row) => String(row.status ?? "").toLowerCase() !== "paid")
    .reduce((sum, row) => sum + toNumber(row.amount_cents), 0);

  const ledgerTotals = ledgerRows.reduce<{
    sellerPayableCreditsCents: number;
    sellerPayableDebitsCents: number;
    cashClearingDebitsCents: number;
    cashClearingCreditsCents: number;
    marketplaceFeeRevenueCents: number;
    couponExpenseCents: number;
    customerRefundPayableCreditsCents: number;
    customerRefundPayableDebitsCents: number;
  }>(
    (acc, row) => {
      const account = String(row.account_code ?? "");
      const direction = String(row.direction ?? "").toLowerCase();
      const amount = toNumber(row.amount);

      if (account === "seller_payable") {
        if (direction === "credit") acc.sellerPayableCreditsCents += toCentsFromBrl(amount);
        if (direction === "debit") acc.sellerPayableDebitsCents += toCentsFromBrl(amount);
      }
      if (account === "cash_clearing") {
        if (direction === "debit") acc.cashClearingDebitsCents += toCentsFromBrl(amount);
        if (direction === "credit") acc.cashClearingCreditsCents += toCentsFromBrl(amount);
      }
      if (account === "marketplace_fee_revenue") {
        if (direction === "credit") acc.marketplaceFeeRevenueCents += toCentsFromBrl(amount);
        if (direction === "debit") acc.marketplaceFeeRevenueCents -= toCentsFromBrl(amount);
      }
      if (account === "promo_discount_expense" && direction === "debit") {
        acc.couponExpenseCents += toCentsFromBrl(amount);
      }
      if (account === "customer_refund_payable") {
        if (direction === "credit") acc.customerRefundPayableCreditsCents += toCentsFromBrl(amount);
        if (direction === "debit") acc.customerRefundPayableDebitsCents += toCentsFromBrl(amount);
      }
      return acc;
    },
    {
      sellerPayableCreditsCents: 0,
      sellerPayableDebitsCents: 0,
      cashClearingDebitsCents: 0,
      cashClearingCreditsCents: 0,
      marketplaceFeeRevenueCents: 0,
      couponExpenseCents: 0,
      customerRefundPayableCreditsCents: 0,
      customerRefundPayableDebitsCents: 0
    }
  );

  const snapshotTotals = snapshotRows.reduce<{
    gmvCents: number;
    feeCents: number;
    couponCents: number;
    gatewayFeeCents: number;
    marginCents: number;
    sellerPayoutCents: number;
  }>(
    (acc, row) => {
      acc.gmvCents += toCentsFromBrl(row.gmv);
      acc.feeCents += toCentsFromBrl(row.fee);
      acc.couponCents += toCentsFromBrl(row.coupon_marketplace);
      acc.gatewayFeeCents += toCentsFromBrl(row.gateway_fee);
      acc.marginCents += toCentsFromBrl(row.marketplace_margin);
      acc.sellerPayoutCents += toCentsFromBrl(row.seller_payout_amount);
      return acc;
    },
    {
      gmvCents: 0,
      feeCents: 0,
      couponCents: 0,
      gatewayFeeCents: 0,
      marginCents: 0,
      sellerPayoutCents: 0
    }
  );

  const sellerPayableOpenFromLedgerCents =
    ledgerTotals.sellerPayableCreditsCents - ledgerTotals.sellerPayableDebitsCents;
  const customerRefundPayableOpenFromLedgerCents =
    ledgerTotals.customerRefundPayableCreditsCents - ledgerTotals.customerRefundPayableDebitsCents;
  const cashClearingNetFromLedgerCents =
    ledgerTotals.cashClearingDebitsCents - ledgerTotals.cashClearingCreditsCents;

  const paidBatches = payoutsRows.filter((row) => String(row.status ?? "").toLowerCase() === "paid");
  const nextPayout = payoutsRows
    .filter((row) => String(row.status ?? "").toLowerCase() !== "paid")
    .sort((a, b) => {
      const aTs = new Date(String(a.scheduled_for ?? a.created_at ?? 0)).getTime();
      const bTs = new Date(String(b.scheduled_for ?? b.created_at ?? 0)).getTime();
      return aTs - bTs;
    })[0];

  const sellerPayableOpenCents =
    sellerPayableOpenFromLedgerCents !== 0
      ? sellerPayableOpenFromLedgerCents
      : snapshotTotals.sellerPayoutCents - payoutsPaidCents;

  const payoutCoverageDeltaCents = sellerPayableOpenCents - payoutsPendingCents;
  const cashVsSalesDeltaCents = cashClearingNetFromLedgerCents - grossFromSubOrdersCents;

  return NextResponse.json({
    seller_id: scope.sellerId,
    period_window: { start: periodStart, end: periodEnd },
    period: { start: periodStart, end: periodEnd },
    orders: ordersResult.data ?? [],
    payouts: payoutsRows,
    summary: {
      source: {
        sub_orders: subOrders.length,
        ledger_entries: ledgerRows.length,
        snapshots: snapshotRows.length
      },
      sales: {
        gross_sub_orders_cents: Math.round(grossFromSubOrdersCents),
        seller_net_sub_orders_cents: Math.round(sellerNetFromSubOrdersCents),
        snapshot_gmv_cents: snapshotTotals.gmvCents,
        snapshot_margin_cents: snapshotTotals.marginCents
      },
      payout: {
        paid_cents: payoutsPaidCents,
        pending_cents: payoutsPendingCents,
        immutable_paid_batches: paidBatches.length,
        next_payout_at: nextPayout?.scheduled_for ?? null
      },
      ledger: {
        seller_payable_open_cents: sellerPayableOpenCents,
        customer_refund_payable_open_cents: customerRefundPayableOpenFromLedgerCents,
        cash_clearing_net_cents: cashClearingNetFromLedgerCents,
        marketplace_fee_revenue_cents: ledgerTotals.marketplaceFeeRevenueCents,
        coupon_expense_cents: ledgerTotals.couponExpenseCents
      },
      reconciliation: {
        payout_coverage_delta_cents: payoutCoverageDeltaCents,
        cash_vs_sales_delta_cents: cashVsSalesDeltaCents
      }
    }
  });
}
