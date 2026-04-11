import { NextRequest, NextResponse } from "next/server";

import {
  isInternalJobAuthorized,
  notifyFinanceOpsAlerts,
  parseJobLimit,
  type FinanceOpsAlertRow
} from "@/lib/internal/jobs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const parseUuid = (value: string | null) => {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
};

const parseMinScore = (value: string | null) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return 55;
  return Math.max(0, Math.min(100, parsed));
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toText = (value: unknown) => String(value ?? "").trim().toLowerCase();

export async function POST(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado para job interno." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const limit = parseJobLimit(request.nextUrl.searchParams.get("limit"), 500, 5000);
  const sellerId = parseUuid(request.nextUrl.searchParams.get("seller_id"));
  const minScore = parseMinScore(request.nextUrl.searchParams.get("min_score"));

  const refreshRisk = await admin.rpc("refresh_seller_risk_profiles", {
    p_seller_id: sellerId,
    p_window_days: 30
  });
  if (refreshRisk.error) {
    return NextResponse.json(
      {
        error: refreshRisk.error.message,
        detail:
          "Funcao refresh_seller_risk_profiles nao encontrada. Rode a migration 20260306_1400_risk_reconciliation_t1.sql."
      },
      { status: 500 }
    );
  }

  const applyHoldback = await admin.rpc("apply_seller_holdback_to_scheduled_payouts", {
    p_limit: limit,
    p_seller_id: sellerId
  });
  if (applyHoldback.error) {
    return NextResponse.json(
      {
        error: applyHoldback.error.message,
        detail:
          "Funcao apply_seller_holdback_to_scheduled_payouts nao encontrada. Rode a migration 20260306_1400_risk_reconciliation_t1.sql."
      },
      { status: 500 }
    );
  }

  const createAlerts = await admin.rpc("create_finance_ops_alerts_from_risk", {
    p_min_score: minScore
  });
  if (createAlerts.error) {
    return NextResponse.json(
      {
        error: createAlerts.error.message,
        detail:
          "Funcao create_finance_ops_alerts_from_risk nao encontrada. Rode a migration 20260306_1400_risk_reconciliation_t1.sql."
      },
      { status: 500 }
    );
  }

  const alertsLookup = await admin
    .from("finance_ops_alerts")
    .select("id,alert_type,severity,seller_id,provider,recon_date,title,body,payload")
    .eq("status", "open")
    .is("notified_at", null)
    .eq("alert_type", "seller_risk_profile")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (alertsLookup.error) {
    return NextResponse.json({ error: alertsLookup.error.message }, { status: 500 });
  }

  const alerts = (alertsLookup.data ?? []) as FinanceOpsAlertRow[];
  const notification = await notifyFinanceOpsAlerts(admin, alerts);

  const [riskProfilesLookup, blockedPayoutsLookup, releasedHoldbacksLookup] = await Promise.all([
    admin
      .from("seller_risk_profiles")
      .select(
        "seller_id,risk_score,risk_tier,holdback_bps,payouts_blocked,device_risk_30d,velocity_risk_30d,orders_30d,computed_at"
      )
      .order("risk_score", { ascending: false })
      .limit(2000),
    admin
      .from("seller_payouts")
      .select(
        "id,seller_id,status,risk_tier,holdback_bps,holdback_cents,gross_payout_cents,net_after_holdback_cents,updated_at"
      )
      .eq("status", "blocked")
      .order("updated_at", { ascending: false })
      .limit(200),
    admin
      .from("seller_holdbacks")
      .select("id,seller_id,seller_payout_id,holdback_cents,released_at,updated_at")
      .eq("status", "released")
      .gte("released_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("released_at", { ascending: false })
      .limit(200)
  ]);

  if (riskProfilesLookup.error) {
    return NextResponse.json({ error: riskProfilesLookup.error.message }, { status: 500 });
  }
  if (blockedPayoutsLookup.error) {
    return NextResponse.json({ error: blockedPayoutsLookup.error.message }, { status: 500 });
  }
  if (releasedHoldbacksLookup.error) {
    return NextResponse.json({ error: releasedHoldbacksLookup.error.message }, { status: 500 });
  }

  const riskProfiles = (riskProfilesLookup.data ?? []) as Array<Record<string, unknown>>;
  const blockedPayouts = (blockedPayoutsLookup.data ?? []) as Array<Record<string, unknown>>;
  const releasedHoldbacks = (releasedHoldbacksLookup.data ?? []) as Array<Record<string, unknown>>;

  const riskTierCounts = riskProfiles.reduce<Record<string, number>>((acc, row) => {
    const tier = toText(row.risk_tier) || "unknown";
    acc[tier] = (acc[tier] ?? 0) + 1;
    return acc;
  }, {});
  const blockedByTier = riskProfiles.reduce<Record<string, number>>((acc, row) => {
    if (!row.payouts_blocked) return acc;
    const tier = toText(row.risk_tier) || "unknown";
    acc[tier] = (acc[tier] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    ok: true,
    seller_id: sellerId,
    limit,
    refreshed_profiles: toNumber(refreshRisk.data),
    holdbacks_applied: toNumber(applyHoldback.data),
    alerts_upserted: toNumber(createAlerts.data),
    alerts_notified: notification.alertsNotified,
    admin_recipients: notification.adminRecipients,
    queued_notifications: notification.queued,
    risk_tier_counts: riskTierCounts,
    blocked_sellers_by_tier: blockedByTier,
    blocked_payout_batches: blockedPayouts.length,
    released_holdbacks_last_24h: releasedHoldbacks.length,
    top_risk_sellers: riskProfiles.slice(0, 10).map((row) => ({
      seller_id: row.seller_id ? String(row.seller_id) : null,
      risk_score: toNumber(row.risk_score),
      risk_tier: toText(row.risk_tier),
      holdback_bps: toNumber(row.holdback_bps),
      payouts_blocked: Boolean(row.payouts_blocked),
      device_risk_30d: toNumber(row.device_risk_30d),
      velocity_risk_30d: toNumber(row.velocity_risk_30d),
      orders_30d: toNumber(row.orders_30d),
      computed_at: row.computed_at ? String(row.computed_at) : null
    }))
  });
}
