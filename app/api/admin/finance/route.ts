import { NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AnyRow = Record<string, unknown>;

const DEDICATED_LEDGER_ENTRY_FILTERS = new Set(["commission_reversal", "chargeback_fee"]);

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toStatus = (value: unknown) => String(value ?? "").trim().toLowerCase();

const isMissingRelationError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "42703" || error.code === "PGRST204") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("does not exist") || message.includes("could not find");
};

const loadOptionalRows = async (query: any) => {
  const { data, error } = await query;
  if (error) {
    if (isMissingRelationError(error)) {
      return { rows: [] as AnyRow[], missing: true };
    }
    throw new Error(error.message ?? "Falha ao consultar dados financeiros.");
  }
  return { rows: (data ?? []) as AnyRow[], missing: false };
};

const loadPayoutRows = async (supabase: any) => {
  const modern = await loadOptionalRows(
    supabase
      .from("seller_payouts")
      .select(
        "id,seller_id,status,risk_tier,gross_payout_cents,adjustments_cents,net_payout_cents,holdback_cents,net_after_holdback_cents,scheduled_at,paid_at,created_at,updated_at,period_start,period_end"
      )
      .order("created_at", { ascending: false })
      .limit(1000)
  );

  if (!modern.missing) {
    const rows = modern.rows.map((row) => {
      const netAfterHoldbackCents = toNumber(row.net_after_holdback_cents);
      const netPayoutCents = toNumber(row.net_payout_cents);
      return {
        id: String(row.id ?? ""),
        seller_id: row.seller_id ? String(row.seller_id) : null,
        status: toStatus(row.status),
        amount_cents:
          netAfterHoldbackCents > 0 ? netAfterHoldbackCents : Math.max(0, netPayoutCents),
        gross_payout_cents: Math.max(0, toNumber(row.gross_payout_cents)),
        adjustments_cents: toNumber(row.adjustments_cents),
        holdback_cents: Math.max(0, toNumber(row.holdback_cents)),
        net_after_holdback_cents: Math.max(0, netAfterHoldbackCents),
        risk_tier: row.risk_tier ? String(row.risk_tier) : null,
        scheduled_at: row.scheduled_at ? String(row.scheduled_at) : null,
        paid_at: row.paid_at ? String(row.paid_at) : null,
        created_at: row.created_at ? String(row.created_at) : null,
        updated_at: row.updated_at ? String(row.updated_at) : null,
        period_start: row.period_start ? String(row.period_start) : null,
        period_end: row.period_end ? String(row.period_end) : null,
        source: "seller_payouts"
      };
    });
    return { rows, source: "seller_payouts" as const };
  }

  const legacy = await loadOptionalRows(
    supabase
      .from("payouts")
      .select("id,seller_id,partner_id,amount_cents,status,scheduled_for,paid_at,created_at,period_start,period_end")
      .order("created_at", { ascending: false })
      .limit(1000)
  );

  const rows = legacy.rows.map((row) => ({
    id: String(row.id ?? ""),
    seller_id: row.seller_id ? String(row.seller_id) : row.partner_id ? String(row.partner_id) : null,
    status: toStatus(row.status),
    amount_cents: Math.max(0, toNumber(row.amount_cents)),
    gross_payout_cents: Math.max(0, toNumber(row.amount_cents)),
    adjustments_cents: 0,
    holdback_cents: 0,
    net_after_holdback_cents: Math.max(0, toNumber(row.amount_cents)),
    risk_tier: null,
    scheduled_at: row.scheduled_for ? String(row.scheduled_for) : null,
    paid_at: row.paid_at ? String(row.paid_at) : null,
    created_at: row.created_at ? String(row.created_at) : null,
    updated_at: row.created_at ? String(row.created_at) : null,
    period_start: row.period_start ? String(row.period_start) : null,
    period_end: row.period_end ? String(row.period_end) : null,
    source: "payouts"
  }));

  return { rows, source: "payouts" as const };
};

const nextScheduledPayoutAt = (
  payouts: Array<{ status: string; scheduled_at: string | null; created_at: string | null }>
) => {
  const scheduledLike = payouts
    .filter((row) => ["scheduled", "pending", "processing", "blocked"].includes(row.status))
    .map((row) => row.scheduled_at ?? row.created_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return scheduledLike[0] ?? null;
};

export async function GET(req: Request) {
  const adminContext = await ensureAdminRequest(req as any);
  if ("error" in adminContext) {
    return NextResponse.json({ error: adminContext.error }, { status: adminContext.status });
  }

  const url = new URL(req.url);
  const requestedEntryType = String(url.searchParams.get("entryType") ?? "")
    .trim()
    .toLowerCase();
  const activeEntryTypeFilter = DEDICATED_LEDGER_ENTRY_FILTERS.has(requestedEntryType)
    ? requestedEntryType
    : null;

  const supabase = adminContext.supabase;
  const serviceSupabase = getSupabaseAdminClient();
  const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    ordersResult,
    payoutsResult,
    riskProfilesResult,
    holdbacksResult,
    releasedHoldbacksResult,
    reconciliationRunsResult,
    financeAlertsResult,
    ledgerEntriesResult,
    ledgerTransactionsResult,
    reconciliationReportsResult,
    reconciliationIssuesResult
  ] = await Promise.all([
    loadOptionalRows(
      supabase
        .from("orders")
        .select("total_cents,total_order_cents,status")
        .in("status", ["paid", "processing", "shipped", "delivered", "fulfilled"])
    ),
    loadPayoutRows(supabase),
    loadOptionalRows(
      supabase
        .from("seller_risk_profiles")
        .select(
          "seller_id,risk_score,risk_tier,payouts_blocked,holdback_bps,device_risk_30d,velocity_risk_30d,orders_30d,computed_at"
        )
        .order("computed_at", { ascending: false })
        .limit(5000)
    ),
    loadOptionalRows(
      supabase
        .from("seller_holdbacks")
        .select("id,seller_id,status,holdback_cents,release_after,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5000)
    ),
    loadOptionalRows(
      supabase
        .from("seller_holdbacks")
        .select("id,seller_id,seller_payout_id,status,reason,holdback_cents,released_at,updated_at,created_at")
        .eq("status", "released")
        .gte("released_at", weekAgoIso)
        .order("released_at", { ascending: false })
        .limit(1000)
    ),
    loadOptionalRows(
      supabase
        .from("gateway_reconciliation_runs")
        .select(
          "provider,recon_date,status,delta_cash_in_vs_gateway_gross_cents,delta_ledger_net_vs_gateway_net_cents,delta_payout_vs_ledger_cash_out_cents,computed_at"
        )
        .order("recon_date", { ascending: false })
        .order("provider", { ascending: true })
        .limit(90)
    ),
    loadOptionalRows(
      supabase
        .from("finance_ops_alerts")
        .select("id,alert_type,severity,status,created_at,seller_id,provider,recon_date,title,body,payload")
        .eq("status", "open")
        .gte("created_at", weekAgoIso)
        .order("created_at", { ascending: false })
        .limit(5000)
    ),
    loadOptionalRows(
      serviceSupabase
        .from("marketplace_ledger_entries")
        .select("id,order_id,seller_id,user_id,entry_type,amount,currency,reference_id,reference_type,account_code,direction,description,created_at")
        .order("created_at", { ascending: false })
        .limit(200)
    ),
    loadOptionalRows(
      serviceSupabase
        .from("ledger_transactions")
        .select("id,transaction_type,seller_id,order_id,user_id,payout_id,reference_type,reference_id,created_by,status,created_at,lines_count,total_debit_cents,total_credit_cents")
        .order("created_at", { ascending: false })
        .limit(100)
    ),
    loadOptionalRows(
      serviceSupabase
        .from("reconciliation_reports")
        .select("id,provider,report_date,status,discrepancies,total_orders,total_payments,total_payouts,details,created_at,updated_at")
        .order("report_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30)
    ),
    loadOptionalRows(
      serviceSupabase
        .from("reconciliation_issues")
        .select("id,report_id,provider,order_id,seller_id,seller_order_id,payment_intent_id,issue_type,expected_amount,actual_amount,status,details,created_at,resolved_at")
        .order("created_at", { ascending: false })
        .limit(200)
    )
  ]);

  const receivableCents = ordersResult.rows.reduce(
    (sum, row) => sum + Math.max(0, toNumber(row.total_cents ?? row.total_order_cents)),
    0
  );

  const payoutsRows = payoutsResult.rows;
  const payoutPaidCents = payoutsRows
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + toNumber(row.amount_cents), 0);
  const payoutScheduledCents = payoutsRows
    .filter((row) => ["scheduled", "pending", "processing"].includes(row.status))
    .reduce((sum, row) => sum + toNumber(row.amount_cents), 0);
  const payoutBlockedCents = payoutsRows
    .filter((row) => row.status === "blocked")
    .reduce((sum, row) => sum + toNumber(row.amount_cents), 0);

  const riskProfiles = riskProfilesResult.rows;
  const highRiskSellers = riskProfiles.filter((row) => {
    const tier = toStatus(row.risk_tier);
    return tier === "high" || tier === "restricted";
  }).length;
  const restrictedSellers = riskProfiles.filter((row) => toStatus(row.risk_tier) === "restricted").length;
  const blockedPayoutSellers = riskProfiles.filter((row) => Boolean(row.payouts_blocked)).length;
  const avgRiskScore =
    riskProfiles.length > 0
      ? riskProfiles.reduce((sum, row) => sum + toNumber(row.risk_score), 0) / riskProfiles.length
      : 0;

  const activeHoldbacks = holdbacksResult.rows;
  const activeHoldbackCents = activeHoldbacks.reduce(
    (sum, row) => sum + Math.max(0, toNumber(row.holdback_cents)),
    0
  );

  const reconciliationRuns = reconciliationRunsResult.rows;
  const latestReconDate = reconciliationRuns[0]?.recon_date ? String(reconciliationRuns[0].recon_date) : null;
  const latestReconRuns = latestReconDate
    ? reconciliationRuns.filter((row) => String(row.recon_date ?? "") === latestReconDate)
    : [];

  const reconStatusCountsLatest = latestReconRuns.reduce<{
    ok: number;
    warn: number;
    critical: number;
  }>(
    (acc, row) => {
      const status = toStatus(row.status);
      if (status === "critical") acc.critical += 1;
      else if (status === "warn") acc.warn += 1;
      else acc.ok += 1;
      return acc;
    },
    { ok: 0, warn: 0, critical: 0 }
  );

  const reconDeltaAbsLatestCents = latestReconRuns.reduce((sum, row) => {
    const d1 = Math.abs(toNumber(row.delta_cash_in_vs_gateway_gross_cents));
    const d2 = Math.abs(toNumber(row.delta_ledger_net_vs_gateway_net_cents));
    const d3 = Math.abs(toNumber(row.delta_payout_vs_ledger_cash_out_cents));
    return sum + d1 + d2 + d3;
  }, 0);

  const reconWarnRuns7d = reconciliationRuns.filter((row) => toStatus(row.status) === "warn").length;
  const reconCriticalRuns7d = reconciliationRuns.filter((row) => toStatus(row.status) === "critical").length;

  const openAlerts = financeAlertsResult.rows;
  const openCriticalAlerts7d = openAlerts.filter((row) => toStatus(row.severity) === "critical").length;
  const alertsByTypeMap = new Map<string, number>();
  openAlerts.forEach((row) => {
    const key = String(row.alert_type ?? "unknown");
    alertsByTypeMap.set(key, (alertsByTypeMap.get(key) ?? 0) + 1);
  });
  const alertsByType = Array.from(alertsByTypeMap.entries())
    .map(([alert_type, count]) => ({ alert_type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topRiskSellers = [...riskProfiles]
    .sort((a, b) => toNumber(b.risk_score) - toNumber(a.risk_score))
    .slice(0, 20)
    .map((row) => ({
      seller_id: row.seller_id ? String(row.seller_id) : null,
      risk_score: Number(toNumber(row.risk_score).toFixed(2)),
      risk_tier: toStatus(row.risk_tier),
      payouts_blocked: Boolean(row.payouts_blocked),
      holdback_bps: toNumber(row.holdback_bps),
      device_risk_30d: Number(toNumber(row.device_risk_30d).toFixed(4)),
      velocity_risk_30d: Number(toNumber(row.velocity_risk_30d).toFixed(4)),
      orders_30d: toNumber(row.orders_30d),
      computed_at: row.computed_at ? String(row.computed_at) : null
    }));

  const blockedPayoutBatches = payoutsRows
    .filter((row) => row.status === "blocked")
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, 20)
    .map((row) => ({
      payout_id: row.id,
      seller_id: row.seller_id ?? null,
      risk_tier: row.risk_tier ? String(row.risk_tier) : null,
      holdback_bps: toNumber(row.holdback_cents) > 0 && toNumber(row.gross_payout_cents) > 0
        ? Math.round((toNumber(row.holdback_cents) * 10000) / Math.max(toNumber(row.gross_payout_cents), 1))
        : 0,
      gross_payout_cents: toNumber(row.gross_payout_cents),
      holdback_cents: toNumber(row.holdback_cents),
      net_after_holdback_cents: toNumber(row.net_after_holdback_cents),
      updated_at: row.updated_at ?? row.created_at ?? null
    }));

  const releasedHoldbacks = releasedHoldbacksResult.rows
    .slice(0, 20)
    .map((row) => ({
      holdback_id: row.id ? String(row.id) : null,
      seller_id: row.seller_id ? String(row.seller_id) : null,
      seller_payout_id: row.seller_payout_id ? String(row.seller_payout_id) : null,
      reason: row.reason ? String(row.reason) : null,
      holdback_cents: toNumber(row.holdback_cents),
      released_at: row.released_at ? String(row.released_at) : null
    }));

  const providerDrilldownLatest = latestReconRuns
    .map((row) => {
      const cashDelta = toNumber(row.delta_cash_in_vs_gateway_gross_cents);
      const netDelta = toNumber(row.delta_ledger_net_vs_gateway_net_cents);
      const payoutDelta = toNumber(row.delta_payout_vs_ledger_cash_out_cents);
      const maxAbsDelta = Math.max(Math.abs(cashDelta), Math.abs(netDelta), Math.abs(payoutDelta));
      return {
        provider: row.provider ? String(row.provider) : "unknown",
        status: toStatus(row.status),
        cash_delta_cents: cashDelta,
        ledger_net_delta_cents: netDelta,
        payout_delta_cents: payoutDelta,
        max_abs_delta_cents: maxAbsDelta,
        computed_at: row.computed_at ? String(row.computed_at) : null
      };
    })
    .sort((a, b) => b.max_abs_delta_cents - a.max_abs_delta_cents);

  const criticalProviderAlerts = openAlerts
    .filter((row) => String(row.alert_type ?? "") === "gateway_provider_delta_critical")
    .slice(0, 20)
    .map((row) => ({
      id: row.id ? String(row.id) : null,
      provider: row.provider ? String(row.provider) : null,
      recon_date: row.recon_date ? String(row.recon_date) : null,
      title: row.title ? String(row.title) : null,
      body: row.body ? String(row.body) : null,
      severity: toStatus(row.severity),
      created_at: row.created_at ? String(row.created_at) : null
    }));

  const reconciliationReports = reconciliationReportsResult.rows.slice(0, 20).map((row) => ({
    id: row.id ? String(row.id) : null,
    provider: row.provider ? String(row.provider) : "stripe",
    report_date: row.report_date ? String(row.report_date) : null,
    status: toStatus(row.status),
    discrepancies: toNumber(row.discrepancies),
    total_orders: Number(toNumber(row.total_orders).toFixed(2)),
    total_payments: Number(toNumber(row.total_payments).toFixed(2)),
    total_payouts: Number(toNumber(row.total_payouts).toFixed(2)),
    details: (row.details ?? {}) as Record<string, unknown>,
    created_at: row.created_at ? String(row.created_at) : null,
    updated_at: row.updated_at ? String(row.updated_at) : null
  }));

  const reconciliationIssues = reconciliationIssuesResult.rows.slice(0, 50).map((row) => ({
    id: row.id ? String(row.id) : null,
    report_id: row.report_id ? String(row.report_id) : null,
    provider: row.provider ? String(row.provider) : "stripe",
    order_id: row.order_id ? String(row.order_id) : null,
    seller_id: row.seller_id ? String(row.seller_id) : null,
    seller_order_id: row.seller_order_id ? String(row.seller_order_id) : null,
    payment_intent_id: row.payment_intent_id ? String(row.payment_intent_id) : null,
    issue_type: row.issue_type ? String(row.issue_type) : null,
    expected_amount: Number(toNumber(row.expected_amount).toFixed(2)),
    actual_amount: Number(toNumber(row.actual_amount).toFixed(2)),
    status: toStatus(row.status),
    details: (row.details ?? {}) as Record<string, unknown>,
    created_at: row.created_at ? String(row.created_at) : null,
    resolved_at: row.resolved_at ? String(row.resolved_at) : null
  }));
  const reconciliationOpenIssues = reconciliationIssues.filter((row) => row.status === "open").length;
  const latestReconciliationReport = reconciliationReports[0] ?? null;

  const recentLedgerEntries = ledgerEntriesResult.rows.slice(0, 40).map((row) => ({
    id: row.id ? String(row.id) : null,
    order_id: row.order_id ? String(row.order_id) : null,
    seller_id: row.seller_id ? String(row.seller_id) : null,
    user_id: row.user_id ? String(row.user_id) : null,
    entry_type: row.entry_type ? String(row.entry_type) : null,
    amount: Number(toNumber(row.amount).toFixed(2)),
    currency: row.currency ? String(row.currency) : "BRL",
    reference_id: row.reference_id ? String(row.reference_id) : null,
    reference_type: row.reference_type ? String(row.reference_type) : null,
    account_code: row.account_code ? String(row.account_code) : null,
    direction: row.direction ? String(row.direction) : null,
    description: row.description ? String(row.description) : null,
    created_at: row.created_at ? String(row.created_at) : null
  }));

  const recentLedgerTransactions = ledgerTransactionsResult.rows.slice(0, 40).map((row) => ({
    id: row.id ? String(row.id) : null,
    transaction_type: row.transaction_type ? String(row.transaction_type) : null,
    seller_id: row.seller_id ? String(row.seller_id) : null,
    order_id: row.order_id ? String(row.order_id) : null,
    user_id: row.user_id ? String(row.user_id) : null,
    payout_id: row.payout_id ? String(row.payout_id) : null,
    reference_type: row.reference_type ? String(row.reference_type) : null,
    reference_id: row.reference_id ? String(row.reference_id) : null,
    created_by: row.created_by ? String(row.created_by) : null,
    status: toStatus(row.status),
    created_at: row.created_at ? String(row.created_at) : null,
    lines_count: toNumber(row.lines_count),
    total_debit_cents: toNumber(row.total_debit_cents),
    total_credit_cents: toNumber(row.total_credit_cents)
  }));

  const dedicatedLedgerFilters = Array.from(DEDICATED_LEDGER_ENTRY_FILTERS).map((entryType) => ({
    entry_type: entryType,
    count: recentLedgerEntries.filter((row) => row.entry_type === entryType).length
  }));

  const filteredLedgerEntries = activeEntryTypeFilter
    ? recentLedgerEntries.filter((row) => row.entry_type === activeEntryTypeFilter)
    : recentLedgerEntries;

  const relatedOrderIds = new Set(
    filteredLedgerEntries.map((row) => row.order_id).filter((value): value is string => Boolean(value))
  );
  const relatedReferenceIds = new Set(
    filteredLedgerEntries
      .map((row) => row.reference_id)
      .filter((value): value is string => Boolean(value))
  );

  const filteredLedgerTransactions = activeEntryTypeFilter
    ? recentLedgerTransactions.filter((row) => {
        if (activeEntryTypeFilter === "chargeback_fee" && row.transaction_type === "chargeback_fee") {
          return true;
        }
        if (
          activeEntryTypeFilter === "commission_reversal" &&
          row.transaction_type === "commission_reversal"
        ) {
          return true;
        }
        if (row.order_id && relatedOrderIds.has(row.order_id)) return true;
        if (row.reference_id && relatedReferenceIds.has(row.reference_id)) return true;
        return false;
      })
    : recentLedgerTransactions;

  const ledgerIntegrityMismatches = recentLedgerTransactions.filter(
    (row) => row.total_debit_cents !== row.total_credit_cents
  ).length;
  const ledgerEntryTypeMap = new Map<string, number>();
  recentLedgerEntries.forEach((row) => {
    const key = row.entry_type ?? "unknown";
    ledgerEntryTypeMap.set(key, (ledgerEntryTypeMap.get(key) ?? 0) + 1);
  });
  const ledgerEntryTypes = Array.from(ledgerEntryTypeMap.entries())
    .map(([entry_type, count]) => ({ entry_type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const nextPayout = nextScheduledPayoutAt(payoutsRows);
  const feesEstimatedCents = Math.round(receivableCents * 0.1);

  return NextResponse.json({
    // backward-compatible keys
    receivable: receivableCents,
    nextPayout,
    fees: feesEstimatedCents,
    payouts: payoutsRows.slice(0, 100),
    // richer operational payload
    summary: {
      receivable_cents: receivableCents,
      payout: {
        source: payoutsResult.source,
        batches: payoutsRows.length,
        paid_cents: payoutPaidCents,
        scheduled_cents: payoutScheduledCents,
        blocked_cents: payoutBlockedCents,
        next_payout_at: nextPayout
      },
      risk: {
        sellers_total: riskProfiles.length,
        avg_risk_score: Number(avgRiskScore.toFixed(2)),
        high_risk_sellers: highRiskSellers,
        restricted_sellers: restrictedSellers,
        blocked_payout_sellers: blockedPayoutSellers,
        active_holdbacks: activeHoldbacks.length,
        active_holdback_cents: activeHoldbackCents
      },
      reconciliation: {
        latest_recon_date: latestReconDate,
        latest_providers: latestReconRuns.length,
        latest_status_counts: reconStatusCountsLatest,
        latest_delta_abs_total_cents: reconDeltaAbsLatestCents,
        warn_runs_lookback: reconWarnRuns7d,
        critical_runs_lookback: reconCriticalRuns7d,
        reports_recent: reconciliationReports.length,
        issues_open_recent: reconciliationOpenIssues,
        latest_report: latestReconciliationReport
      },
      ops_alerts: {
        open_total_7d: openAlerts.length,
        critical_open_7d: openCriticalAlerts7d,
        top_types: alertsByType
      },
      ledger: {
        recent_entries: recentLedgerEntries.length,
        recent_transactions: recentLedgerTransactions.length,
        integrity_mismatches_recent: ledgerIntegrityMismatches,
        top_entry_types: ledgerEntryTypes,
        dedicated_filters: dedicatedLedgerFilters,
        active_entry_type_filter: activeEntryTypeFilter
      },
      drilldown: {
        risk: {
          top_sellers: topRiskSellers,
          blocked_sellers: blockedPayoutSellers
        },
        payouts: {
          blocked_batches: blockedPayoutBatches,
          released_holdbacks_7d: releasedHoldbacks
        },
        reconciliation: {
          providers_latest: providerDrilldownLatest,
          critical_providers_latest: providerDrilldownLatest.filter((row) => row.status === "critical"),
          critical_provider_alerts_open: criticalProviderAlerts,
          reports: reconciliationReports,
          issues: reconciliationIssues
        },
        ledger: {
          recent_entries: filteredLedgerEntries,
          recent_transactions: filteredLedgerTransactions
        }
      }
    }
  });
}
