import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ApplyCreditRedemptionInput = {
  userId: string;
  orderId: string;
  checkoutSessionId?: string | null;
  requestedAmountCents?: number | null;
  sourceIdempotencyKey?: string | null;
  sourceEventAt?: string | null;
  source?: string | null;
};

type ReverseCreditRedemptionInput = {
  orderId: string;
  eventName: "order_canceled" | "refund_settled" | "chargeback_opened";
  reversalAmountCents?: number | null;
  sourceIdempotencyKey?: string | null;
  sourceEventAt?: string | null;
  source?: string | null;
};

type CreditRedemptionRpcResult = {
  redemption_id?: string | null;
  applied_amount_cents?: number | null;
  requested_amount_cents?: number | null;
  available_balance_cents?: number | null;
  order_total_cents?: number | null;
  source_idempotency_key?: string | null;
  status?: string | null;
};

const isMissingPopClubRedemptionContract = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;
  const message = String(error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    error.code === "42P01" ||
    error.code === "42703" ||
    message.includes("popclub_apply_credit_redemption") ||
    message.includes("popclub_reverse_credit_redemption") ||
    message.includes("popclub_credit_redemptions")
  );
};

const normalizeResult = (value: unknown) => {
  const payload = (value ?? {}) as CreditRedemptionRpcResult;
  return {
    redemptionId: String(payload.redemption_id ?? ""),
    appliedAmountCents: Math.max(0, Number(payload.applied_amount_cents ?? 0)),
    requestedAmountCents: Math.max(0, Number(payload.requested_amount_cents ?? 0)),
    availableBalanceCents: Math.max(0, Number(payload.available_balance_cents ?? 0)),
    orderTotalCents: Math.max(0, Number(payload.order_total_cents ?? 0)),
    sourceIdempotencyKey: String(payload.source_idempotency_key ?? ""),
    status: String(payload.status ?? "")
  };
};

export const applyPopClubCreditRedemption = async (input: ApplyCreditRedemptionInput) => {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("popclub_apply_credit_redemption", {
    p_user_id: input.userId,
    p_order_id: input.orderId,
    p_checkout_session_id: input.checkoutSessionId ?? null,
    p_requested_amount_cents:
      typeof input.requestedAmountCents === "number" && Number.isFinite(input.requestedAmountCents)
        ? Math.max(0, Math.round(input.requestedAmountCents))
        : 0,
    p_source_idempotency_key: input.sourceIdempotencyKey ?? null,
    p_source_event_at: input.sourceEventAt ?? null,
    p_source: input.source ?? "server_checkout"
  });

  if (error) {
    if (isMissingPopClubRedemptionContract(error)) {
      console.warn(
        "[popclub/redemption] Contract de credits redemption indisponivel. Rode a migration 20260420_0200_popclub_credits_redemption.sql."
      );
      return normalizeResult(null);
    }

    throw new Error(`popclub_apply_credit_redemption failed: ${error.message}`);
  }

  return normalizeResult(data);
};

export const reversePopClubCreditRedemption = async (input: ReverseCreditRedemptionInput) => {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("popclub_reverse_credit_redemption", {
    p_order_id: input.orderId,
    p_event_name: input.eventName,
    p_reversal_amount_cents:
      typeof input.reversalAmountCents === "number" && Number.isFinite(input.reversalAmountCents)
        ? Math.max(0, Math.round(input.reversalAmountCents))
        : null,
    p_source_idempotency_key: input.sourceIdempotencyKey ?? null,
    p_source_event_at: input.sourceEventAt ?? null,
    p_source: input.source ?? "server_checkout"
  });

  if (error) {
    if (isMissingPopClubRedemptionContract(error)) {
      console.warn(
        "[popclub/redemption] Contract de reversao de credits redemption indisponivel. Rode a migration 20260420_0200_popclub_credits_redemption.sql."
      );
      return normalizeResult(null);
    }

    throw new Error(`popclub_reverse_credit_redemption failed: ${error.message}`);
  }

  return normalizeResult(data);
};
