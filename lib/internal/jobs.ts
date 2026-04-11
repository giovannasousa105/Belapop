import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildDeterministicKey,
  emitPlatformEvent,
  queueNotificationChannels
} from "@/lib/events/platformEventBus";

export type FinanceOpsAlertRow = {
  id: string;
  alert_type: string;
  severity: "info" | "warn" | "critical";
  seller_id: string | null;
  provider: string | null;
  recon_date: string | null;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
};

export const parseJobLimit = (value: string | null, fallback = 250, max = 2000) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(max, Math.round(parsed)));
};

export const isInternalJobAuthorized = (request: NextRequest) => {
  const headerSecretRaw =
    request.headers.get("x-job-secret") ??
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  const headerSecret = headerSecretRaw.trim();
  const expectedRaw = process.env.INTERNAL_JOB_SECRET ?? process.env.CRON_JOB_SECRET ?? "";
  const expected = expectedRaw.trim();
  return Boolean(expected) && headerSecret === expected;
};

const isMissingRelation = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "42703" || error.code === "PGRST204") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("does not exist") || message.includes("could not find");
};

export const loadAdminUserIds = async (admin: SupabaseClient) => {
  const membership = await admin
    .from("user_role_memberships")
    .select("user_id")
    .eq("role", "admin")
    .limit(2000);

  if (membership.error && !isMissingRelation(membership.error)) {
    throw new Error(membership.error.message ?? "Falha ao consultar user_role_memberships.");
  }

  const membershipIds = ((membership.data ?? []) as Array<{ user_id?: string | null }>)
    .map((row) => row.user_id ?? null)
    .filter((value): value is string => Boolean(value));

  if (membershipIds.length > 0) {
    return Array.from(new Set(membershipIds));
  }

  const fallback = await admin.from("user_roles").select("user_id").eq("role", "admin").limit(2000);
  if (fallback.error && !isMissingRelation(fallback.error)) {
    throw new Error(fallback.error.message ?? "Falha ao consultar user_roles.");
  }

  return Array.from(
    new Set(
      ((fallback.data ?? []) as Array<{ user_id?: string | null }>)
        .map((row) => row.user_id ?? null)
        .filter((value): value is string => Boolean(value))
    )
  );
};

export const notifyFinanceOpsAlerts = async (
  admin: SupabaseClient,
  alerts: FinanceOpsAlertRow[]
) => {
  if (alerts.length === 0) {
    return { adminRecipients: 0, alertsNotified: 0, queued: 0 };
  }

  const adminUserIds = await loadAdminUserIds(admin);
  if (adminUserIds.length === 0) {
    return { adminRecipients: 0, alertsNotified: 0, queued: 0 };
  }

  let queued = 0;
  for (const alert of alerts) {
    const eventId = await emitPlatformEvent({
      eventName: `finance.alert.${alert.alert_type}`,
      aggregateType: "system",
      aggregateId: alert.id,
      sellerId: alert.seller_id,
      payload: {
        alert_id: alert.id,
        alert_type: alert.alert_type,
        severity: alert.severity,
        provider: alert.provider,
        recon_date: alert.recon_date,
        payload: alert.payload ?? {}
      },
      idempotencyKey: buildDeterministicKey([
        "finance.ops.alert",
        alert.id,
        alert.alert_type,
        alert.recon_date
      ])
    });

    for (const userId of adminUserIds) {
      await queueNotificationChannels({
        eventId,
        recipientUserId: userId,
        channels: ["in_app", "email"],
        templateKey: "finance.ops.alert",
        title: alert.title,
        body: alert.body,
        ctaHref: "/admin/finance",
        ctaLabel: "Abrir financeiro",
        metadata: {
          alert_id: alert.id,
          alert_type: alert.alert_type,
          severity: alert.severity,
          seller_id: alert.seller_id,
          provider: alert.provider,
          recon_date: alert.recon_date
        },
        dedupeSeed: buildDeterministicKey(["finance.ops.alert", alert.id, userId])
      });
      queued += 1;
    }
  }

  const alertIds = alerts.map((alert) => alert.id);
  if (alertIds.length > 0) {
    await admin
      .from("finance_ops_alerts")
      .update({ notified_at: new Date().toISOString() })
      .in("id", alertIds);
  }

  return {
    adminRecipients: adminUserIds.length,
    alertsNotified: alerts.length,
    queued
  };
};
