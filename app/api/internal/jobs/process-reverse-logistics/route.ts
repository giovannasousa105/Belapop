import { NextRequest, NextResponse } from "next/server";

import {
  isInternalJobAuthorized,
  notifyFinanceOpsAlerts,
  parseJobLimit,
  type FinanceOpsAlertRow
} from "@/lib/internal/jobs";
import { getLogisticsPlaybook } from "@/lib/support/logisticsPlaybooks";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function POST(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado para job interno." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const limit = parseJobLimit(request.nextUrl.searchParams.get("limit"), 300, 3000);

  const refresh = await admin.rpc("refresh_logistics_exceptions", { p_limit: limit });
  if (refresh.error) {
    return NextResponse.json(
      {
        error: refresh.error.message,
        detail:
          "Funcao refresh_logistics_exceptions nao encontrada. Rode a migration 20260306_1500_ops_reverse_sre_ranking_ab.sql."
      },
      { status: 500 }
    );
  }

  const escalate = await admin.rpc("escalate_logistics_exceptions", { p_limit: limit });
  if (escalate.error) {
    return NextResponse.json(
      {
        error: escalate.error.message,
        detail:
          "Funcao escalate_logistics_exceptions nao encontrada. Rode a migration 20260306_1500_ops_reverse_sre_ranking_ab.sql."
      },
      { status: 500 }
    );
  }

  const upsertAlerts = await admin.rpc("create_finance_ops_alerts_from_logistics_exceptions", {
    p_limit: limit
  });
  if (upsertAlerts.error) {
    return NextResponse.json(
      {
        error: upsertAlerts.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_logistics_exceptions nao encontrada. Rode a migration 20260306_1500_ops_reverse_sre_ranking_ab.sql."
      },
      { status: 500 }
    );
  }

  const alertsLookup = await admin
    .from("finance_ops_alerts")
    .select("id,alert_type,severity,seller_id,provider,recon_date,title,body,payload")
    .eq("status", "open")
    .is("notified_at", null)
    .eq("alert_type", "logistics_exception_sla")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (alertsLookup.error) {
    return NextResponse.json({ error: alertsLookup.error.message }, { status: 500 });
  }

  const alerts = (alertsLookup.data ?? []) as FinanceOpsAlertRow[];
  const notification = await notifyFinanceOpsAlerts(admin, alerts);

  const exceptionsLookup = await admin
    .from("logistics_exceptions")
    .select("id,order_id,sub_order_id,seller_id,exception_code,severity,status,sla_due_at,escalated_at,updated_at")
    .in("status", ["open", "escalated"])
    .order("sla_due_at", { ascending: true })
    .limit(Math.min(25, limit));

  if (exceptionsLookup.error) {
    return NextResponse.json({ error: exceptionsLookup.error.message }, { status: 500 });
  }

  const nextActions = (exceptionsLookup.data ?? []).map((row) => {
    const playbook = getLogisticsPlaybook(row.exception_code);
    return {
      logistics_exception_id: row.id,
      order_id: row.order_id,
      sub_order_id: row.sub_order_id,
      seller_id: row.seller_id,
      exception_code: row.exception_code,
      severity: row.severity,
      status: row.status,
      sla_due_at: row.sla_due_at,
      escalated_at: row.escalated_at,
      updated_at: row.updated_at,
      playbook
    };
  });

  return NextResponse.json({
    ok: true,
    limit,
    exceptions_refreshed: toNumber(refresh.data),
    escalations_created: toNumber(escalate.data),
    alerts_upserted: toNumber(upsertAlerts.data),
    alerts_notified: notification.alertsNotified,
    admin_recipients: notification.adminRecipients,
    queued_notifications: notification.queued,
    next_actions: nextActions
  });
}
