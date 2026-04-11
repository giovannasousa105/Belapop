import "server-only";

import { randomUUID } from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type RegisterInput = {
  provider: string;
  eventId: string;
  eventType: string;
  payload: unknown;
};

type RegisterResult = {
  duplicate: boolean;
  error?: string;
};

const isDuplicateError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "23505") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("duplicate key") || message.includes("already exists");
};

const isMissingColumnError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("column") && message.includes("does not exist");
};

export const registerWebhookEvent = async ({
  provider,
  eventId,
  eventType,
  payload
}: RegisterInput): Promise<RegisterResult> => {
  const admin = getSupabaseAdminClient();
  const baseRow = {
    id: randomUUID(),
    provider,
    event_id: eventId,
    event_type: eventType,
    payload
  };

  const withLifecycle = {
    ...baseRow,
    received_at: new Date().toISOString(),
    status: "received"
  };

  const firstInsert = await admin.from("webhook_events").insert(withLifecycle);
  if (!firstInsert.error) {
    return { duplicate: false };
  }
  if (isDuplicateError(firstInsert.error)) {
    return { duplicate: true };
  }
  if (!isMissingColumnError(firstInsert.error)) {
    return { duplicate: false, error: firstInsert.error.message };
  }

  const fallbackInsert = await admin.from("webhook_events").insert(baseRow);
  if (!fallbackInsert.error) {
    return { duplicate: false };
  }
  if (isDuplicateError(fallbackInsert.error)) {
    return { duplicate: true };
  }

  return { duplicate: false, error: fallbackInsert.error.message };
};

export const markWebhookProcessed = async (
  provider: string,
  eventId: string,
  status: "processed" | "ignored" = "processed"
) => {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      status,
      error: null
    })
    .eq("provider", provider)
    .eq("event_id", eventId);

  if (!error || isMissingColumnError(error)) return;
  console.error("[webhooks/idempotency] mark processed failed", { provider, eventId, error });
};

export const markWebhookError = async (provider: string, eventId: string, message: string) => {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("webhook_events")
    .update({
      status: "error",
      error: message
    })
    .eq("provider", provider)
    .eq("event_id", eventId);

  if (!error || isMissingColumnError(error)) return;
  console.error("[webhooks/idempotency] mark error failed", { provider, eventId, error });
};
