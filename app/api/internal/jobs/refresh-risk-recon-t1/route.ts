import { NextRequest, NextResponse } from "next/server";

import {
  isInternalJobAuthorized,
  notifyFinanceOpsAlerts,
  parseJobLimit,
  type FinanceOpsAlertRow
} from "@/lib/internal/jobs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const normalizeDate = (value: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return now.toISOString().slice(0, 10);
  }
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
};

const normalizeUuid = (value: string | null) => {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeProvider = (value: string | null) => {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseIntParam = (
  value: string | null,
  fallback: number,
  min: number,
  max: number
) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
};

export async function POST(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado para job interno." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  const riskLimit = parseJobLimit(request.nextUrl.searchParams.get("risk_limit"), 500, 5000);
  const reconLimit = parseJobLimit(request.nextUrl.searchParams.get("recon_limit"), 200, 2000);
  const minRiskScore = parseIntParam(request.nextUrl.searchParams.get("min_score"), 55, 0, 100);
  const criticalDeltaCents = parseIntParam(
    request.nextUrl.searchParams.get("critical_delta_cents"),
    10000,
    1,
    1_000_000_000
  );
  const riskWindowDays = parseIntParam(
    request.nextUrl.searchParams.get("risk_window_days"),
    30,
    7,
    180
  );

  const sellerId = normalizeUuid(request.nextUrl.searchParams.get("seller_id"));
  const reconDate = normalizeDate(request.nextUrl.searchParams.get("date"));
  const provider = normalizeProvider(request.nextUrl.searchParams.get("provider"));

  if (!reconDate) {
    return NextResponse.json({ error: "Parametro date invalido (use YYYY-MM-DD)." }, { status: 400 });
  }

  const refreshRisk = await admin.rpc("refresh_seller_risk_profiles", {
    p_seller_id: sellerId,
    p_window_days: riskWindowDays
  });
  if (refreshRisk.error) {
    return NextResponse.json(
      {
        error: refreshRisk.error.message,
        detail:
          "Funcao refresh_seller_risk_profiles nao encontrada. Rode a migration 20260308_1500_risk_device_velocity_payout_release_recon_alerts.sql."
      },
      { status: 500 }
    );
  }

  const applyHoldback = await admin.rpc("apply_seller_holdback_to_scheduled_payouts", {
    p_limit: riskLimit,
    p_seller_id: sellerId
  });
  if (applyHoldback.error) {
    return NextResponse.json(
      {
        error: applyHoldback.error.message,
        detail:
          "Funcao apply_seller_holdback_to_scheduled_payouts nao encontrada. Rode a migration 20260308_1500_risk_device_velocity_payout_release_recon_alerts.sql."
      },
      { status: 500 }
    );
  }

  const createRiskAlerts = await admin.rpc("create_finance_ops_alerts_from_risk", {
    p_min_score: minRiskScore
  });
  if (createRiskAlerts.error) {
    return NextResponse.json(
      {
        error: createRiskAlerts.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_risk nao encontrada. Rode a migration 20260306_1400_risk_reconciliation_t1.sql."
      },
      { status: 500 }
    );
  }

  const runRecon = await admin.rpc("run_gateway_reconciliation_t1", {
    p_recon_date: reconDate,
    p_provider: provider
  });
  if (runRecon.error) {
    return NextResponse.json(
      {
        error: runRecon.error.message,
        detail:
          "Funcao run_gateway_reconciliation_t1 nao encontrada. Rode a migration 20260306_1400_risk_reconciliation_t1.sql."
      },
      { status: 500 }
    );
  }

  const createReconAlerts = await admin.rpc("create_finance_ops_alerts_from_reconciliation", {
    p_recon_date: reconDate
  });
  if (createReconAlerts.error) {
    return NextResponse.json(
      {
        error: createReconAlerts.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_reconciliation nao encontrada. Rode a migration 20260306_1400_risk_reconciliation_t1.sql."
      },
      { status: 500 }
    );
  }

  const createProviderCriticalAlerts = await admin.rpc(
    "create_finance_ops_alerts_critical_provider_delta",
    {
      p_recon_date: reconDate,
      p_threshold_cents: criticalDeltaCents
    }
  );
  if (createProviderCriticalAlerts.error) {
    return NextResponse.json(
      {
        error: createProviderCriticalAlerts.error.message,
        detail:
          "Funcao create_finance_ops_alerts_critical_provider_delta nao encontrada. Rode a migration 20260308_1500_risk_device_velocity_payout_release_recon_alerts.sql."
      },
      { status: 500 }
    );
  }

  const alertsLookup = await admin
    .from("finance_ops_alerts")
    .select("id,alert_type,severity,seller_id,provider,recon_date,title,body,payload")
    .eq("status", "open")
    .is("notified_at", null)
    .in("alert_type", [
      "seller_risk_profile",
      "gateway_reconciliation",
      "gateway_provider_delta_critical"
    ])
    .order("created_at", { ascending: true })
    .limit(Math.max(riskLimit, reconLimit));

  if (alertsLookup.error) {
    return NextResponse.json({ error: alertsLookup.error.message }, { status: 500 });
  }

  const alerts = (alertsLookup.data ?? []) as FinanceOpsAlertRow[];
  const notification = await notifyFinanceOpsAlerts(admin, alerts);

  const [riskProfilesLookup, blockedPayoutsLookup, reconRunsLookup] = await Promise.all([
    admin
      .from("seller_risk_profiles")
      .select(
        "seller_id,risk_score,risk_tier,payouts_blocked,holdback_bps,device_risk_30d,velocity_risk_30d,orders_30d,computed_at"
      )
      .order("risk_score", { ascending: false })
      .limit(10),
    admin
      .from("seller_payouts")
      .select("id,seller_id,status,risk_tier,holdback_cents,updated_at")
      .eq("status", "blocked")
      .order("updated_at", { ascending: false })
      .limit(50),
    admin
      .from("gateway_reconciliation_runs")
      .select(
        "provider,recon_date,status,delta_cash_in_vs_gateway_gross_cents,delta_ledger_net_vs_gateway_net_cents,delta_payout_vs_ledger_cash_out_cents,computed_at"
      )
      .eq("recon_date", reconDate)
      .order("provider", { ascending: true })
      .limit(reconLimit)
  ]);

  if (riskProfilesLookup.error) {
    return NextResponse.json({ error: riskProfilesLookup.error.message }, { status: 500 });
  }
  if (blockedPayoutsLookup.error) {
    return NextResponse.json({ error: blockedPayoutsLookup.error.message }, { status: 500 });
  }
  if (reconRunsLookup.error) {
    return NextResponse.json({ error: reconRunsLookup.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    seller_id: sellerId,
    date: reconDate,
    provider,
    risk_window_days: riskWindowDays,
    min_risk_score: minRiskScore,
    critical_delta_cents: criticalDeltaCents,
    risk: {
      profiles_refreshed: toNumber(refreshRisk.data),
      holdbacks_applied: toNumber(applyHoldback.data),
      alerts_upserted: toNumber(createRiskAlerts.data),
      blocked_payout_batches: (blockedPayoutsLookup.data ?? []).length,
      top_risk_sellers: (riskProfilesLookup.data ?? []).map((row) => ({
        seller_id: row.seller_id ? String(row.seller_id) : null,
        risk_score: toNumber(row.risk_score),
        risk_tier: row.risk_tier ? String(row.risk_tier) : null,
        payouts_blocked: Boolean(row.payouts_blocked),
        holdback_bps: toNumber(row.holdback_bps),
        device_risk_30d: toNumber(row.device_risk_30d),
        velocity_risk_30d: toNumber(row.velocity_risk_30d),
        orders_30d: toNumber(row.orders_30d),
        computed_at: row.computed_at
      }))
    },
    reconciliation: {
      rows_reconciled: toNumber(runRecon.data),
      alerts_upserted: toNumber(createReconAlerts.data),
      provider_critical_alerts_upserted: toNumber(createProviderCriticalAlerts.data),
      runs: (reconRunsLookup.data ?? []).map((row) => ({
        provider: row.provider ? String(row.provider) : null,
        recon_date: row.recon_date ? String(row.recon_date) : null,
        status: row.status ? String(row.status) : null,
        delta_cash_in_vs_gateway_gross_cents: toNumber(
          row.delta_cash_in_vs_gateway_gross_cents
        ),
        delta_ledger_net_vs_gateway_net_cents: toNumber(
          row.delta_ledger_net_vs_gateway_net_cents
        ),
        delta_payout_vs_ledger_cash_out_cents: toNumber(
          row.delta_payout_vs_ledger_cash_out_cents
        ),
        computed_at: row.computed_at
      }))
    },
    notifications: {
      alerts_notified: notification.alertsNotified,
      admin_recipients: notification.adminRecipients,
      queued_notifications: notification.queued
    }
  });
}

