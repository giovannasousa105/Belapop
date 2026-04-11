import { NextRequest, NextResponse } from "next/server";

import {
  isInternalJobAuthorized,
  notifyFinanceOpsAlerts,
  parseJobLimit,
  type FinanceOpsAlertRow
} from "@/lib/internal/jobs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseWindow = (value: string | null) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return 60;
  return Math.max(5, Math.min(1440, Math.round(parsed)));
};

const parseDrMaxAge = (value: string | null) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(7, Math.min(365, Math.round(parsed)));
};

const parseAckSla = (value: string | null) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(240, Math.round(parsed)));
};

export async function POST(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado para job interno." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const limit = parseJobLimit(request.nextUrl.searchParams.get("limit"), 250, 2000);
  const windowMinutes = parseWindow(request.nextUrl.searchParams.get("window_minutes"));
  const drMaxAgeDays = parseDrMaxAge(request.nextUrl.searchParams.get("dr_max_age_days"));
  const incidentAckMinutes = parseAckSla(request.nextUrl.searchParams.get("incident_ack_minutes"));

  const evaluate = await admin.rpc("evaluate_slo_breaches", { p_window_minutes: windowMinutes });
  if (evaluate.error) {
    return NextResponse.json(
      {
        error: evaluate.error.message,
        detail:
          "Funcao evaluate_slo_breaches nao encontrada. Rode a migration 20260306_1500_ops_reverse_sre_ranking_ab.sql."
      },
      { status: 500 }
    );
  }

  const drFreshness = await admin.rpc("check_dr_test_freshness", { p_max_age_days: drMaxAgeDays });
  if (drFreshness.error) {
    return NextResponse.json(
      {
        error: drFreshness.error.message,
        detail:
          "Funcao check_dr_test_freshness nao encontrada. Rode a migration 20260306_1500_ops_reverse_sre_ranking_ab.sql."
      },
      { status: 500 }
    );
  }

  const assignIncidents = await admin.rpc("assign_sre_incidents_to_current_oncall", {
    p_limit: limit
  });
  if (assignIncidents.error) {
    return NextResponse.json(
      {
        error: assignIncidents.error.message,
        detail:
          "Funcao assign_sre_incidents_to_current_oncall nao encontrada. Rode a migration 20260307_0200_sre_maturity_oncall_error_budget_dr_calendar.sql."
      },
      { status: 500 }
    );
  }

  const escalateIncidents = await admin.rpc("escalate_unacknowledged_sre_incidents", {
    p_limit: limit,
    p_ack_sla_minutes: incidentAckMinutes
  });
  if (escalateIncidents.error) {
    return NextResponse.json(
      {
        error: escalateIncidents.error.message,
        detail:
          "Funcao escalate_unacknowledged_sre_incidents nao encontrada. Rode a migration 20260307_0300_sre_oncall_24x7_dr_gameday_recurring.sql."
      },
      { status: 500 }
    );
  }

  const oncallCoverageAlerts = await admin.rpc("create_finance_ops_alerts_from_oncall_coverage", {
    p_days_ahead: 1,
    p_limit: limit
  });
  if (oncallCoverageAlerts.error) {
    return NextResponse.json(
      {
        error: oncallCoverageAlerts.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_oncall_coverage nao encontrada. Rode a migration 20260307_0300_sre_oncall_24x7_dr_gameday_recurring.sql."
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
      "sre_slo_breach",
      "dr_test_overdue",
      "sre_incident_escalation",
      "sre_oncall_uncovered",
      "sre_oncall_unacknowledged"
    ])
    .order("created_at", { ascending: true })
    .limit(limit);

  if (alertsLookup.error) {
    return NextResponse.json({ error: alertsLookup.error.message }, { status: 500 });
  }

  const alerts = (alertsLookup.data ?? []) as FinanceOpsAlertRow[];
  const notification = await notifyFinanceOpsAlerts(admin, alerts);

  return NextResponse.json({
    ok: true,
    window_minutes: windowMinutes,
    dr_max_age_days: drMaxAgeDays,
    incident_ack_minutes: incidentAckMinutes,
    slo_alerts_upserted: toNumber(evaluate.data),
    dr_alerts_upserted: toNumber(drFreshness.data),
    incidents_assigned: toNumber(assignIncidents.data),
    incidents_escalated: toNumber(escalateIncidents.data),
    oncall_coverage_alerts_upserted: toNumber(oncallCoverageAlerts.data),
    alerts_notified: notification.alertsNotified,
    admin_recipients: notification.adminRecipients,
    queued_notifications: notification.queued
  });
}
