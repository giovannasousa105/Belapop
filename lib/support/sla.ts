import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type SupportSlaPolicy = {
  reason: string;
  firstResponseHours: number;
  resolutionHours: number;
  escalateAfterHours: number;
};

const DEFAULT_POLICIES: Record<string, SupportSlaPolicy> = {
  NOT_RECEIVED: {
    reason: "NOT_RECEIVED",
    firstResponseHours: 12,
    resolutionHours: 72,
    escalateAfterHours: 24
  },
  DAMAGED_ITEM: {
    reason: "DAMAGED_ITEM",
    firstResponseHours: 8,
    resolutionHours: 48,
    escalateAfterHours: 16
  },
  WRONG_ITEM: {
    reason: "WRONG_ITEM",
    firstResponseHours: 8,
    resolutionHours: 48,
    escalateAfterHours: 16
  },
  QUALITY_ISSUE: {
    reason: "QUALITY_ISSUE",
    firstResponseHours: 12,
    resolutionHours: 72,
    escalateAfterHours: 24
  },
  SERVICE_ISSUE: {
    reason: "SERVICE_ISSUE",
    firstResponseHours: 12,
    resolutionHours: 72,
    escalateAfterHours: 24
  },
  OTHER: {
    reason: "OTHER",
    firstResponseHours: 12,
    resolutionHours: 72,
    escalateAfterHours: 24
  }
};

const isMissingRelationOrColumn = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "42703" || error.code === "PGRST204") return true;
  const message = String(error.message ?? "").toLowerCase();
  return (
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("column") && message.includes("does not exist"))
  );
};

export const normalizeTicketReasonForPolicy = (reason: string | null | undefined) => {
  const key = String(reason ?? "OTHER").trim().toUpperCase();
  return DEFAULT_POLICIES[key] ? key : "OTHER";
};

export const computeSupportSlaDeadlines = (
  createdAtIso: string,
  policy: SupportSlaPolicy
) => {
  const created = new Date(createdAtIso);
  const firstResponseDueAt = new Date(
    created.getTime() + policy.firstResponseHours * 60 * 60 * 1000
  );
  const resolutionDueAt = new Date(
    created.getTime() + policy.resolutionHours * 60 * 60 * 1000
  );
  const escalateAfterAt = new Date(
    created.getTime() + policy.escalateAfterHours * 60 * 60 * 1000
  );

  return {
    firstResponseDueAt: firstResponseDueAt.toISOString(),
    resolutionDueAt: resolutionDueAt.toISOString(),
    escalateAfterAt: escalateAfterAt.toISOString()
  };
};

export const loadSupportSlaPolicy = async (
  admin: SupabaseClient,
  reason: string | null | undefined
): Promise<SupportSlaPolicy> => {
  const normalizedReason = normalizeTicketReasonForPolicy(reason);
  const fallback = DEFAULT_POLICIES[normalizedReason] ?? DEFAULT_POLICIES.OTHER;

  const lookup = await admin
    .from("support_sla_policies")
    .select("reason,first_response_hours,resolution_hours,escalate_after_hours,active")
    .eq("reason", normalizedReason)
    .eq("active", true)
    .maybeSingle();

  if (lookup.error) {
    if (isMissingRelationOrColumn(lookup.error)) return fallback;
    throw new Error(lookup.error.message);
  }
  if (!lookup.data) return fallback;

  return {
    reason: String(lookup.data.reason ?? normalizedReason),
    firstResponseHours: Number(lookup.data.first_response_hours ?? fallback.firstResponseHours),
    resolutionHours: Number(lookup.data.resolution_hours ?? fallback.resolutionHours),
    escalateAfterHours: Number(lookup.data.escalate_after_hours ?? fallback.escalateAfterHours)
  };
};

