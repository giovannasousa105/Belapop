import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type PaymentMachineState =
  | "created"
  | "requires_payment_method"
  | "requires_confirmation"
  | "requires_action"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "chargeback";

type RecordPaymentStateInput = {
  orderId: string;
  state: PaymentMachineState;
  paymentIntentId?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  provider?: string | null;
  event?: string | null;
  metadata?: Record<string, unknown> | null;
  providerEventId?: string | null;
};

const isMissingStateMachineError = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;
  const message = String(error.message ?? "");
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    error.code === "42P01" ||
    error.code === "42703" ||
    /update_payment_state/i.test(message) ||
    /payment_states/i.test(message) ||
    /payment_state/i.test(message)
  );
};

export const recordPaymentState = async (input: RecordPaymentStateInput) => {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("update_payment_state", {
    p_order_id: input.orderId,
    p_state: input.state,
    p_payment_intent_id: input.paymentIntentId ?? null,
    p_amount_cents:
      typeof input.amountCents === "number" && Number.isFinite(input.amountCents)
        ? Math.round(input.amountCents)
        : null,
    p_currency: input.currency ?? "BRL",
    p_provider: input.provider ?? "stripe",
    p_event: input.event ?? null,
    p_metadata: input.metadata ?? {},
    p_provider_event_id: input.providerEventId ?? null
  });

  if (error) {
    if (isMissingStateMachineError(error)) {
      console.warn(
        "[payments/stateMachine] Payment State Machine indisponivel. Rode a migration 20260310_1900_payment_state_machine.sql."
      );
      return null;
    }

    throw new Error(`update_payment_state failed: ${error.message}`);
  }

  return data ?? null;
};

export const mapStripePaymentIntentState = (
  status: string | null | undefined
): PaymentMachineState => {
  switch (String(status ?? "").trim()) {
    case "requires_payment_method":
      return "requires_payment_method";
    case "requires_confirmation":
      return "requires_confirmation";
    case "requires_action":
      return "requires_action";
    case "processing":
      return "processing";
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "canceled";
    default:
      return "created";
  }
};
