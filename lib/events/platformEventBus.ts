import "server-only";

import { createHash } from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type NotificationChannel = "in_app" | "email" | "whatsapp";

type EmitPlatformEventInput = {
  eventName: string;
  aggregateType: "order" | "sub_order" | "ticket" | "profile" | "system";
  aggregateId?: string | null;
  orderId?: string | null;
  subOrderId?: string | null;
  ticketId?: string | null;
  customerUserId?: string | null;
  sellerId?: string | null;
  actorUserId?: string | null;
  occurredAt?: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string | null;
};

type QueueNotificationInput = {
  eventId?: string | null;
  recipientUserId: string;
  recipientSellerId?: string | null;
  channel: NotificationChannel;
  templateKey: string;
  title: string;
  body: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  metadata?: Record<string, unknown>;
  scheduledAt?: string;
  dedupeKey?: string | null;
};

type OrderActors = {
  customerUserId: string | null;
  sellerIds: string[];
  sellerUserIds: string[];
};

const isDuplicateError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "23505") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("duplicate key") || message.includes("already exists");
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

export const buildDeterministicKey = (parts: Array<string | null | undefined>) =>
  createHash("sha256")
    .update(
      parts
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(":")
    )
    .digest("hex");

const ensureIso = (value?: string) => {
  if (!value) return new Date().toISOString();
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
};

export const emitPlatformEvent = async (input: EmitPlatformEventInput): Promise<string | null> => {
  const admin = getSupabaseAdminClient();
  const row = {
    event_name: input.eventName,
    aggregate_type: input.aggregateType,
    aggregate_id: input.aggregateId ?? null,
    order_id: input.orderId ?? null,
    sub_order_id: input.subOrderId ?? null,
    ticket_id: input.ticketId ?? null,
    customer_user_id: input.customerUserId ?? null,
    seller_id: input.sellerId ?? null,
    actor_user_id: input.actorUserId ?? null,
    idempotency_key: input.idempotencyKey ?? null,
    payload: input.payload ?? {},
    occurred_at: ensureIso(input.occurredAt)
  };

  const insert = await admin.from("platform_events").insert(row).select("id").maybeSingle();
  if (!insert.error) return (insert.data?.id as string | undefined) ?? null;

  if (isDuplicateError(insert.error) && input.idempotencyKey) {
    const existing = await admin
      .from("platform_events")
      .select("id")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (!existing.error) return (existing.data?.id as string | undefined) ?? null;
  }

  if (isMissingRelationOrColumn(insert.error)) {
    console.warn("[platform-events] table unavailable, skipping event persist", {
      eventName: input.eventName
    });
    return null;
  }

  throw new Error(insert.error.message);
};

export const queueNotificationOutbox = async (input: QueueNotificationInput) => {
  const admin = getSupabaseAdminClient();
  const payload = {
    title: input.title,
    body: input.body,
    cta_label: input.ctaLabel ?? null,
    cta_href: input.ctaHref ?? null,
    metadata: input.metadata ?? {}
  };
  const dedupeKey =
    input.dedupeKey ??
    buildDeterministicKey([
      input.eventId,
      input.recipientUserId,
      input.channel,
      input.templateKey,
      input.title,
      input.body
    ]);

  const insert = await admin.from("notification_outbox").insert({
    event_id: input.eventId ?? null,
    recipient_user_id: input.recipientUserId,
    recipient_seller_id: input.recipientSellerId ?? null,
    channel: input.channel,
    template_key: input.templateKey,
    dedupe_key: dedupeKey,
    payload,
    scheduled_at: ensureIso(input.scheduledAt)
  });

  if (!insert.error) return { queued: true as const, dedupeKey };
  if (isDuplicateError(insert.error)) return { queued: false as const, dedupeKey };

  if (isMissingRelationOrColumn(insert.error)) {
    // Compatibility fallback for environments that still do not have outbox table:
    // keep in-app notifications functional.
    if (input.channel === "in_app") {
      const fallback = await admin.from("notifications").insert({
        recipient_user_id: input.recipientUserId,
        seller_id: input.recipientSellerId ?? null,
        type: input.templateKey,
        title: input.title,
        body: input.body,
        cta_label: input.ctaLabel ?? null,
        cta_href: input.ctaHref ?? null,
        metadata: input.metadata ?? {},
        is_read: false
      });
      if (fallback.error) throw new Error(fallback.error.message);
      return { queued: true as const, dedupeKey };
    }
    return { queued: false as const, dedupeKey };
  }

  throw new Error(insert.error.message);
};

export const queueNotificationChannels = async (args: {
  eventId?: string | null;
  recipientUserId: string;
  recipientSellerId?: string | null;
  channels: NotificationChannel[];
  templateKey: string;
  title: string;
  body: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  metadata?: Record<string, unknown>;
  dedupeSeed?: string;
}) => {
  const dedupeSeed =
    args.dedupeSeed ??
    buildDeterministicKey([
      args.eventId,
      args.recipientUserId,
      args.templateKey,
      args.title,
      args.body
    ]);

  for (const channel of args.channels) {
    await queueNotificationOutbox({
      eventId: args.eventId ?? null,
      recipientUserId: args.recipientUserId,
      recipientSellerId: args.recipientSellerId ?? null,
      channel,
      templateKey: args.templateKey,
      title: args.title,
      body: args.body,
      ctaLabel: args.ctaLabel ?? null,
      ctaHref: args.ctaHref ?? null,
      metadata: args.metadata,
      dedupeKey: buildDeterministicKey([dedupeSeed, channel])
    });
  }
};

export const resolveOrderActors = async (orderId: string): Promise<OrderActors> => {
  const admin = getSupabaseAdminClient();
  const orderLookup = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (orderLookup.error && !isMissingRelationOrColumn(orderLookup.error)) {
    throw new Error(orderLookup.error.message);
  }

  const order = (orderLookup.data ?? {}) as Record<string, unknown>;
  const customerUserId = (order.customer_id as string | undefined) ?? null;

  const sellerIdCandidates = [
    (order.seller_id as string | undefined) ?? null,
    (order.store_id as string | undefined) ?? null
  ].filter((value): value is string => Boolean(value));

  const subOrderLookup = await admin
    .from("sub_orders")
    .select("seller_id")
    .eq("order_id", orderId)
    .limit(200);
  if (subOrderLookup.error && !isMissingRelationOrColumn(subOrderLookup.error)) {
    throw new Error(subOrderLookup.error.message);
  }
  for (const row of (subOrderLookup.data ?? []) as Array<{ seller_id?: string | null }>) {
    if (row.seller_id) sellerIdCandidates.push(row.seller_id);
  }

  const sellerIds = Array.from(new Set(sellerIdCandidates));
  if (sellerIds.length === 0) {
    return { customerUserId, sellerIds: [], sellerUserIds: [] };
  }

  const sellersLookup = await admin.from("sellers").select("id,user_id").in("id", sellerIds);
  if (sellersLookup.error && !isMissingRelationOrColumn(sellersLookup.error)) {
    throw new Error(sellersLookup.error.message);
  }

  const sellerUserIds = Array.from(
    new Set(
      ((sellersLookup.data ?? []) as Array<{ user_id?: string | null }>)
        .map((row) => row.user_id ?? null)
        .filter((value): value is string => Boolean(value))
    )
  );

  return { customerUserId, sellerIds, sellerUserIds };
};

