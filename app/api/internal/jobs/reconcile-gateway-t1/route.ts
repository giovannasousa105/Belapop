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

const normalizeProvider = (value: string | null) => {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseCriticalDelta = (value: string | null) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return 10000;
  return Math.max(1, Math.round(parsed));
};

export async function POST(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado para job interno." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const limit = parseJobLimit(request.nextUrl.searchParams.get("limit"), 200, 2000);
  const reconDate = normalizeDate(request.nextUrl.searchParams.get("date"));
  const provider = normalizeProvider(request.nextUrl.searchParams.get("provider"));
  const criticalDeltaCents = parseCriticalDelta(
    request.nextUrl.searchParams.get("critical_delta_cents")
  );

  if (!reconDate) {
    return NextResponse.json({ error: "Parametro date invalido (use YYYY-MM-DD)." }, { status: 400 });
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

  const createAlerts = await admin.rpc("create_finance_ops_alerts_from_reconciliation", {
    p_recon_date: reconDate
  });
  if (createAlerts.error) {
    return NextResponse.json(
      {
        error: createAlerts.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_reconciliation nao encontrada. Rode a migration 20260306_1400_risk_reconciliation_t1.sql."
      },
      { status: 500 }
    );
  }

  const createCriticalProviderAlerts = await admin.rpc(
    "create_finance_ops_alerts_critical_provider_delta",
    {
      p_recon_date: reconDate,
      p_threshold_cents: criticalDeltaCents
    }
  );
  if (createCriticalProviderAlerts.error) {
    return NextResponse.json(
      {
        error: createCriticalProviderAlerts.error.message,
        detail:
          "Funcao create_finance_ops_alerts_critical_provider_delta nao encontrada. Rode a migration 20260308_1500_risk_device_velocity_payout_release_recon_alerts.sql."
      },
      { status: 500 }
    );
  }

  const runsLookup = await admin
    .from("gateway_reconciliation_runs")
    .select(
      "provider,recon_date,status,delta_cash_in_vs_gateway_gross_cents,delta_ledger_net_vs_gateway_net_cents,delta_payout_vs_ledger_cash_out_cents,computed_at"
    )
    .eq("recon_date", reconDate)
    .order("provider", { ascending: true });

  if (runsLookup.error) {
    return NextResponse.json({ error: runsLookup.error.message }, { status: 500 });
  }

  const alertsLookup = await admin
    .from("finance_ops_alerts")
    .select("id,alert_type,severity,seller_id,provider,recon_date,title,body,payload")
    .eq("status", "open")
    .is("notified_at", null)
    .in("alert_type", ["gateway_reconciliation", "gateway_provider_delta_critical"])
    .eq("recon_date", reconDate)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (alertsLookup.error) {
    return NextResponse.json({ error: alertsLookup.error.message }, { status: 500 });
  }

  const alerts = (alertsLookup.data ?? []) as FinanceOpsAlertRow[];
  const notification = await notifyFinanceOpsAlerts(admin, alerts);

  const criticalProviderAlerts = alerts
    .filter((row) => row.alert_type === "gateway_provider_delta_critical")
    .map((row) => ({
      id: row.id,
      provider: row.provider,
      severity: row.severity,
      recon_date: row.recon_date,
      title: row.title
    }));

  const runs = (runsLookup.data ?? []).map((row) => ({
    provider: row.provider,
    recon_date: row.recon_date,
    status: row.status,
    delta_cash_in_vs_gateway_gross_cents: toNumber(row.delta_cash_in_vs_gateway_gross_cents),
    delta_ledger_net_vs_gateway_net_cents: toNumber(row.delta_ledger_net_vs_gateway_net_cents),
    delta_payout_vs_ledger_cash_out_cents: toNumber(row.delta_payout_vs_ledger_cash_out_cents),
    computed_at: row.computed_at
  }));

  return NextResponse.json({
    ok: true,
    date: reconDate,
    provider,
    critical_delta_cents: criticalDeltaCents,
    reconciled_rows: toNumber(runRecon.data),
    alerts_upserted: toNumber(createAlerts.data),
    critical_provider_alerts_upserted: toNumber(createCriticalProviderAlerts.data),
    alerts_notified: notification.alertsNotified,
    admin_recipients: notification.adminRecipients,
    queued_notifications: notification.queued,
    critical_provider_alerts_open: criticalProviderAlerts.length,
    critical_provider_alerts: criticalProviderAlerts.slice(0, 10),
    runs
  });
}
