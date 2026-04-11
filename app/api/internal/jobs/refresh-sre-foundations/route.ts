import { NextRequest, NextResponse } from "next/server";

import {
  isInternalJobAuthorized,
  notifyFinanceOpsAlerts,
  parseJobLimit,
  type FinanceOpsAlertRow
} from "@/lib/internal/jobs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const parseIntInRange = (
  value: string | null,
  fallback: number,
  min: number,
  max: number
) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function POST(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado para job interno." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  const limit = parseJobLimit(request.nextUrl.searchParams.get("limit"), 200, 2000);
  const oncallDaysAhead = parseIntInRange(
    request.nextUrl.searchParams.get("oncall_days_ahead"),
    21,
    1,
    90
  );
  const incidentAckMinutes = parseIntInRange(
    request.nextUrl.searchParams.get("incident_ack_minutes"),
    10,
    1,
    240
  );
  const oncallCoverageDaysAhead = parseIntInRange(
    request.nextUrl.searchParams.get("oncall_coverage_days_ahead"),
    2,
    0,
    14
  );
  const budgetWindowDays = parseIntInRange(
    request.nextUrl.searchParams.get("budget_window_days"),
    30,
    7,
    90
  );
  const drMonthsAhead = parseIntInRange(
    request.nextUrl.searchParams.get("dr_months_ahead"),
    6,
    1,
    24
  );
  const drDayOfMonth = parseIntInRange(
    request.nextUrl.searchParams.get("dr_day_of_month"),
    10,
    1,
    28
  );
  const drGraceDays = parseIntInRange(request.nextUrl.searchParams.get("dr_grace_days"), 3, 1, 31);
  const drReminderDaysAhead = parseIntInRange(
    request.nextUrl.searchParams.get("dr_reminder_days_ahead"),
    7,
    1,
    45
  );
  const drFailureLookbackDays = parseIntInRange(
    request.nextUrl.searchParams.get("dr_failure_lookback_days"),
    14,
    1,
    180
  );

  const refreshOncall = await admin.rpc("refresh_sre_oncall_shifts", {
    p_days_ahead: oncallDaysAhead
  });
  if (refreshOncall.error) {
    return NextResponse.json(
      {
        error: refreshOncall.error.message,
        detail:
          "Funcao refresh_sre_oncall_shifts nao encontrada. Rode a migration 20260307_0200_sre_maturity_oncall_error_budget_dr_calendar.sql."
      },
      { status: 500 }
    );
  }

  const refreshShiftStates = await admin.rpc("refresh_sre_oncall_shift_states");
  if (refreshShiftStates.error) {
    return NextResponse.json(
      {
        error: refreshShiftStates.error.message,
        detail:
          "Funcao refresh_sre_oncall_shift_states nao encontrada. Rode a migration 20260307_0300_sre_oncall_24x7_dr_gameday_recurring.sql."
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

  const alertOncallCoverage = await admin.rpc("create_finance_ops_alerts_from_oncall_coverage", {
    p_days_ahead: oncallCoverageDaysAhead,
    p_limit: limit
  });
  if (alertOncallCoverage.error) {
    return NextResponse.json(
      {
        error: alertOncallCoverage.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_oncall_coverage nao encontrada. Rode a migration 20260307_0300_sre_oncall_24x7_dr_gameday_recurring.sql."
      },
      { status: 500 }
    );
  }

  const refreshBudget = await admin.rpc("refresh_sre_error_budget_rollups", {
    p_window_days: budgetWindowDays
  });
  if (refreshBudget.error) {
    return NextResponse.json(
      {
        error: refreshBudget.error.message,
        detail:
          "Funcao refresh_sre_error_budget_rollups nao encontrada. Rode a migration 20260307_0200_sre_maturity_oncall_error_budget_dr_calendar.sql."
      },
      { status: 500 }
    );
  }

  const alertBudget = await admin.rpc("create_finance_ops_alerts_from_error_budget", {
    p_limit: limit
  });
  if (alertBudget.error) {
    return NextResponse.json(
      {
        error: alertBudget.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_error_budget nao encontrada. Rode a migration 20260307_0200_sre_maturity_oncall_error_budget_dr_calendar.sql."
      },
      { status: 500 }
    );
  }

  const ensureDr = await admin.rpc("ensure_dr_drill_calendar", {
    p_months_ahead: drMonthsAhead,
    p_day_of_month: drDayOfMonth,
    p_scenario_key: "regional_failover"
  });
  if (ensureDr.error) {
    return NextResponse.json(
      {
        error: ensureDr.error.message,
        detail:
          "Funcao ensure_dr_drill_calendar nao encontrada. Rode a migration 20260307_0200_sre_maturity_oncall_error_budget_dr_calendar.sql."
      },
      { status: 500 }
    );
  }

  const ensureDrGameDay = await admin.rpc("ensure_dr_game_day_calendar", {
    p_months_ahead: drMonthsAhead
  });
  if (ensureDrGameDay.error) {
    return NextResponse.json(
      {
        error: ensureDrGameDay.error.message,
        detail:
          "Funcao ensure_dr_game_day_calendar nao encontrada. Rode a migration 20260307_0300_sre_oncall_24x7_dr_gameday_recurring.sql."
      },
      { status: 500 }
    );
  }

  const syncDr = await admin.rpc("sync_dr_calendar_from_runs", {
    p_limit: limit
  });
  if (syncDr.error) {
    return NextResponse.json(
      {
        error: syncDr.error.message,
        detail:
          "Funcao sync_dr_calendar_from_runs nao encontrada. Rode a migration 20260307_0200_sre_maturity_oncall_error_budget_dr_calendar.sql."
      },
      { status: 500 }
    );
  }

  const alertDr = await admin.rpc("create_finance_ops_alerts_from_dr_calendar", {
    p_grace_days: drGraceDays,
    p_limit: limit
  });
  if (alertDr.error) {
    return NextResponse.json(
      {
        error: alertDr.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_dr_calendar nao encontrada. Rode a migration 20260307_0200_sre_maturity_oncall_error_budget_dr_calendar.sql."
      },
      { status: 500 }
    );
  }

  const alertDrUpcoming = await admin.rpc("create_finance_ops_alerts_from_dr_upcoming", {
    p_days_ahead: drReminderDaysAhead,
    p_limit: limit
  });
  if (alertDrUpcoming.error) {
    return NextResponse.json(
      {
        error: alertDrUpcoming.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_dr_upcoming nao encontrada. Rode a migration 20260307_0300_sre_oncall_24x7_dr_gameday_recurring.sql."
      },
      { status: 500 }
    );
  }

  const alertDrFailed = await admin.rpc("create_finance_ops_alerts_from_dr_failures", {
    p_lookback_days: drFailureLookbackDays,
    p_limit: limit
  });
  if (alertDrFailed.error) {
    return NextResponse.json(
      {
        error: alertDrFailed.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_dr_failures nao encontrada. Rode a migration 20260307_0300_sre_oncall_24x7_dr_gameday_recurring.sql."
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
      "sre_error_budget_burn",
      "dr_drill_missed",
      "sre_oncall_uncovered",
      "sre_oncall_unacknowledged",
      "sre_incident_escalation",
      "dr_drill_upcoming",
      "dr_drill_failed"
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
    limit,
    oncall_days_ahead: oncallDaysAhead,
    incident_ack_minutes: incidentAckMinutes,
    oncall_coverage_days_ahead: oncallCoverageDaysAhead,
    budget_window_days: budgetWindowDays,
    dr_months_ahead: drMonthsAhead,
    dr_day_of_month: drDayOfMonth,
    dr_grace_days: drGraceDays,
    dr_reminder_days_ahead: drReminderDaysAhead,
    dr_failure_lookback_days: drFailureLookbackDays,
    oncall_refreshed: toNumber(refreshOncall.data),
    oncall_shift_states_refreshed: toNumber(refreshShiftStates.data),
    incidents_assigned: toNumber(assignIncidents.data),
    incidents_escalated: toNumber(escalateIncidents.data),
    oncall_coverage_alerts_upserted: toNumber(alertOncallCoverage.data),
    budget_rollups_refreshed: toNumber(refreshBudget.data),
    error_budget_alerts_upserted: toNumber(alertBudget.data),
    dr_calendar_upserted: toNumber(ensureDr.data),
    dr_game_day_calendar_upserted: toNumber(ensureDrGameDay.data),
    dr_calendar_synced: toNumber(syncDr.data),
    dr_calendar_alerts_upserted: toNumber(alertDr.data),
    dr_upcoming_alerts_upserted: toNumber(alertDrUpcoming.data),
    dr_failed_alerts_upserted: toNumber(alertDrFailed.data),
    alerts_notified: notification.alertsNotified,
    admin_recipients: notification.adminRecipients,
    queued_notifications: notification.queued
  });
}
