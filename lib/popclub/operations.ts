import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { buildDeterministicKey } from "@/lib/events/platformEventBus";

type PopClubPriorityBand = "standard" | "priority" | "vip";

type PopClubPrioritySnapshotRow = {
  current_tier?: unknown;
  support_priority_score?: unknown;
  concierge_priority_score?: unknown;
  reorder_priority_score?: unknown;
  priority_band?: unknown;
};

type SupportSlaLike = {
  reason: string;
  firstResponseHours: number;
  resolutionHours: number;
  escalateAfterHours: number;
};

type ConciergeSource = "manual" | "skin_scan" | "account" | "checkout";

type CreateConciergeRequestInput = {
  userId: string;
  orderId?: string | null;
  source?: ConciergeSource;
  summary?: string | null;
  payload?: Record<string, unknown>;
  sourceIdempotencyKey?: string | null;
  snapshot?: PopClubOperationalPrioritySnapshot | null;
};

type CreateReorderRequestInput = {
  userId: string;
  orderId: string;
  subOrderId?: string | null;
  sellerId?: string | null;
  availableItems: unknown[];
  unavailableItems: unknown[];
  summary: Record<string, unknown>;
  sourceIdempotencyKey?: string | null;
  snapshot?: PopClubOperationalPrioritySnapshot | null;
};

type QueueInsertRow = {
  id?: unknown;
  status?: unknown;
  current_tier?: unknown;
  priority_score?: unknown;
  priority_band?: unknown;
  created_at?: unknown;
};

type SampleFulfillmentRpcResult = {
  reservation_id?: unknown;
  status?: unknown;
  fulfilled_slots?: unknown;
};

export type PopClubOperationalPrioritySnapshot = {
  currentTier: "essencial" | "premium" | "luxo";
  supportPriorityScore: number;
  conciergePriorityScore: number;
  reorderPriorityScore: number;
  priorityBand: PopClubPriorityBand;
};

export type PopClubQueueRequestResult = {
  id: string | null;
  status: string;
  currentTier: "essencial" | "premium" | "luxo";
  priorityScore: number;
  priorityBand: PopClubPriorityBand;
  createdAt: string | null;
};

const DEFAULT_PRIORITY_SNAPSHOT: PopClubOperationalPrioritySnapshot = {
  currentTier: "essencial",
  supportPriorityScore: 10,
  conciergePriorityScore: 10,
  reorderPriorityScore: 10,
  priorityBand: "standard"
};

const toPositiveInteger = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed));
};

const normalizeTier = (value: unknown): PopClubOperationalPrioritySnapshot["currentTier"] => {
  if (value === "premium" || value === "luxo") return value;
  return "essencial";
};

export const resolvePopClubPriorityBandFromScore = (score: number): PopClubPriorityBand => {
  if (score >= 90) return "vip";
  if (score >= 50) return "priority";
  return "standard";
};

const getSupportPriorityFactorBps = (score: number) => {
  if (score >= 90) return 5000;
  if (score >= 50) return 7500;
  return 10000;
};

const getResolutionPriorityFactorBps = (score: number) => {
  if (score >= 90) return 6500;
  if (score >= 50) return 8500;
  return 10000;
};

const scaleHours = (hours: number, factorBps: number) =>
  Math.max(1, Math.ceil((Math.max(1, Math.round(hours)) * factorBps) / 10000));

export const isMissingPopClubOperationalContract = (
  error: { code?: string | null; message?: string | null } | null
) => {
  if (!error) return false;
  const message = String(error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    error.code === "42P01" ||
    error.code === "42703" ||
    message.includes("popclub_resolve_priority_snapshot") ||
    message.includes("popclub_fulfill_sample_reservation") ||
    message.includes("popclub_concierge_requests") ||
    message.includes("popclub_reorder_requests") ||
    message.includes("popclub_sample_reservations") ||
    message.includes("popclub_sample_inventory") ||
    message.includes("queue_priority_score") ||
    message.includes("priority_band") ||
    message.includes("popclub_current_tier")
  );
};

const normalizeQueueRequest = (
  row: QueueInsertRow | null | undefined,
  fallback: {
    currentTier: PopClubOperationalPrioritySnapshot["currentTier"];
    priorityScore: number;
    priorityBand: PopClubPriorityBand;
  }
): PopClubQueueRequestResult => ({
  id: row?.id ? String(row.id) : null,
  status: row?.status ? String(row.status) : "open",
  currentTier: normalizeTier(row?.current_tier ?? fallback.currentTier),
  priorityScore: toPositiveInteger(row?.priority_score, fallback.priorityScore),
  priorityBand:
    row?.priority_band === "vip" || row?.priority_band === "priority"
      ? row.priority_band
      : fallback.priorityBand,
  createdAt: row?.created_at ? String(row.created_at) : null
});

export const loadPopClubOperationalPrioritySnapshot = async (
  admin: SupabaseClient,
  userId: string
): Promise<PopClubOperationalPrioritySnapshot> => {
  if (!userId) return DEFAULT_PRIORITY_SNAPSHOT;

  const { data, error } = await admin.rpc("popclub_resolve_priority_snapshot", {
    p_user_id: userId
  });

  if (error) {
    if (isMissingPopClubOperationalContract(error)) {
      console.warn(
        "[popclub/operations] Contract de prioridade operacional indisponivel. Rode a migration 20260420_0300_popclub_samples_and_priority_queues.sql."
      );
      return DEFAULT_PRIORITY_SNAPSHOT;
    }

    throw new Error(`popclub_resolve_priority_snapshot failed: ${error.message}`);
  }

  const payload = Array.isArray(data) ? (data[0] as PopClubPrioritySnapshotRow | undefined) : (data as PopClubPrioritySnapshotRow | null);
  if (!payload) return DEFAULT_PRIORITY_SNAPSHOT;

  const supportPriorityScore = toPositiveInteger(payload.support_priority_score, 10);
  const conciergePriorityScore = toPositiveInteger(
    payload.concierge_priority_score,
    supportPriorityScore
  );
  const reorderPriorityScore = toPositiveInteger(
    payload.reorder_priority_score,
    supportPriorityScore
  );

  return {
    currentTier: normalizeTier(payload.current_tier),
    supportPriorityScore,
    conciergePriorityScore,
    reorderPriorityScore,
    priorityBand:
      payload.priority_band === "vip" || payload.priority_band === "priority"
        ? payload.priority_band
        : resolvePopClubPriorityBandFromScore(conciergePriorityScore)
  };
};

export const mapPopClubPriorityToLegacySupportPriority = (
  snapshotOrScore: PopClubOperationalPrioritySnapshot | number
) => {
  const score =
    typeof snapshotOrScore === "number"
      ? Math.max(0, Math.round(snapshotOrScore))
      : Math.max(0, Math.round(snapshotOrScore.supportPriorityScore));

  if (score >= 90) return "urgent";
  if (score >= 50) return "high";
  return "normal";
};

export const applyPopClubPriorityToSupportPolicy = <T extends SupportSlaLike>(
  policy: T,
  snapshotOrScore: PopClubOperationalPrioritySnapshot | number
): T => {
  const score =
    typeof snapshotOrScore === "number"
      ? Math.max(0, Math.round(snapshotOrScore))
      : Math.max(0, Math.round(snapshotOrScore.supportPriorityScore));

  return {
    ...policy,
    firstResponseHours: scaleHours(policy.firstResponseHours, getSupportPriorityFactorBps(score)),
    resolutionHours: scaleHours(policy.resolutionHours, getResolutionPriorityFactorBps(score)),
    escalateAfterHours: scaleHours(policy.escalateAfterHours, getSupportPriorityFactorBps(score))
  };
};

export const createPopClubConciergeRequest = async (
  admin: SupabaseClient,
  input: CreateConciergeRequestInput
) => {
  const snapshot =
    input.snapshot ?? (await loadPopClubOperationalPrioritySnapshot(admin, input.userId));
  const priorityScore = snapshot.conciergePriorityScore;
  const priorityBand = resolvePopClubPriorityBandFromScore(priorityScore);

  const sourceIdempotencyKey =
    input.sourceIdempotencyKey ??
    buildDeterministicKey([
      "popclub_concierge_request",
      input.userId,
      input.orderId ?? null,
      input.source ?? "manual",
      input.summary ?? null
    ]);

  const { data, error } = await admin
    .from("popclub_concierge_requests")
    .upsert(
      {
        user_id: input.userId,
        order_id: input.orderId ?? null,
        source: input.source ?? "manual",
        status: "open",
        current_tier: snapshot.currentTier,
        priority_score: priorityScore,
        priority_band: priorityBand,
        summary: input.summary ?? null,
        payload: input.payload ?? {},
        source_idempotency_key: sourceIdempotencyKey
      },
      {
        onConflict: "source_idempotency_key"
      }
    )
    .select("id,status,current_tier,priority_score,priority_band,created_at")
    .maybeSingle();

  if (error) {
    if (isMissingPopClubOperationalContract(error)) {
      return normalizeQueueRequest(null, {
        currentTier: snapshot.currentTier,
        priorityScore,
        priorityBand
      });
    }

    throw new Error(`popclub_concierge_requests upsert failed: ${error.message}`);
  }

  return normalizeQueueRequest(data as QueueInsertRow | null, {
    currentTier: snapshot.currentTier,
    priorityScore,
    priorityBand
  });
};

export const createPopClubReorderRequest = async (
  admin: SupabaseClient,
  input: CreateReorderRequestInput
) => {
  const snapshot =
    input.snapshot ?? (await loadPopClubOperationalPrioritySnapshot(admin, input.userId));
  const priorityScore = snapshot.reorderPriorityScore;
  const priorityBand = resolvePopClubPriorityBandFromScore(priorityScore);

  const sourceIdempotencyKey =
    input.sourceIdempotencyKey ??
    buildDeterministicKey([
      "popclub_reorder_request",
      input.userId,
      input.orderId,
      input.subOrderId ?? null,
      JSON.stringify(input.summary ?? {})
    ]);

  const { data, error } = await admin
    .from("popclub_reorder_requests")
    .upsert(
      {
        user_id: input.userId,
        order_id: input.orderId,
        sub_order_id: input.subOrderId ?? null,
        seller_id: input.sellerId ?? null,
        status: "open",
        current_tier: snapshot.currentTier,
        priority_score: priorityScore,
        priority_band: priorityBand,
        available_items: input.availableItems,
        unavailable_items: input.unavailableItems,
        summary: input.summary,
        source_idempotency_key: sourceIdempotencyKey
      },
      {
        onConflict: "source_idempotency_key"
      }
    )
    .select("id,status,current_tier,priority_score,priority_band,created_at")
    .maybeSingle();

  if (error) {
    if (isMissingPopClubOperationalContract(error)) {
      return normalizeQueueRequest(null, {
        currentTier: snapshot.currentTier,
        priorityScore,
        priorityBand
      });
    }

    throw new Error(`popclub_reorder_requests upsert failed: ${error.message}`);
  }

  return normalizeQueueRequest(data as QueueInsertRow | null, {
    currentTier: snapshot.currentTier,
    priorityScore,
    priorityBand
  });
};

export const fulfillPopClubSampleReservation = async (args: {
  admin: SupabaseClient;
  orderId: string;
  fulfilledSlots?: number | null;
  sourceEventAt?: string | null;
  source?: string | null;
}) => {
  const { data, error } = await args.admin.rpc("popclub_fulfill_sample_reservation", {
    p_order_id: args.orderId,
    p_fulfilled_slots:
      typeof args.fulfilledSlots === "number" && Number.isFinite(args.fulfilledSlots)
        ? Math.max(0, Math.round(args.fulfilledSlots))
        : null,
    p_source_event_at: args.sourceEventAt ?? null,
    p_source: args.source ?? "operations"
  });

  if (error) {
    if (isMissingPopClubOperationalContract(error)) {
      return {
        reservationId: null,
        status: "unavailable",
        fulfilledSlots: 0
      };
    }

    throw new Error(`popclub_fulfill_sample_reservation failed: ${error.message}`);
  }

  const payload = (data ?? {}) as SampleFulfillmentRpcResult;
  return {
    reservationId: payload.reservation_id ? String(payload.reservation_id) : null,
    status: payload.status ? String(payload.status) : "unavailable",
    fulfilledSlots: toPositiveInteger(payload.fulfilled_slots, 0)
  };
};
