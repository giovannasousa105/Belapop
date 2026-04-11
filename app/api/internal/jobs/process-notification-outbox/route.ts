import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  deliverEmailNotification,
  deliverWhatsAppNotification
} from "@/lib/notifications/providers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isInternalJobAuthorized, parseJobLimit } from "@/lib/internal/jobs";

export const runtime = "nodejs";

type OutboxRow = {
  id: string;
  recipient_user_id: string;
  recipient_seller_id: string | null;
  channel: "in_app" | "email" | "whatsapp";
  template_key: string;
  payload: {
    title?: string;
    body?: string;
    cta_label?: string | null;
    cta_href?: string | null;
    metadata?: Record<string, unknown>;
  } | null;
  attempts: number;
};

type RecipientContact = {
  email: string | null;
  phoneE164: string | null;
};

const recipientCache = new Map<string, RecipientContact>();

const normalizePhoneE164 = (value: string | null | undefined) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return null;
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("55")) return `+${cleaned}`;
  return `+55${cleaned}`;
};

const shouldSendChannel = async (
  userId: string,
  channel: OutboxRow["channel"]
) => {
  if (channel === "in_app") return true;
  const admin = getSupabaseAdminClient();
  const lookup = await admin
    .from("notification_preferences")
    .select("email_opt_in,whatsapp_opt_in")
    .eq("user_id", userId)
    .maybeSingle();

  if (lookup.error) {
    return channel === "email";
  }

  const emailOptIn = lookup.data?.email_opt_in ?? true;
  const whatsappOptIn = lookup.data?.whatsapp_opt_in ?? false;
  return channel === "email" ? emailOptIn : whatsappOptIn;
};

const loadRecipientContact = async (userId: string): Promise<RecipientContact> => {
  const cached = recipientCache.get(userId);
  if (cached) return cached;

  const admin = getSupabaseAdminClient();
  const [profileLookup, authLookup] = await Promise.all([
    admin.from("profiles").select("email").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId)
  ]);

  const profileEmail =
    !profileLookup.error && typeof profileLookup.data?.email === "string"
      ? profileLookup.data.email.trim().toLowerCase()
      : null;

  const authUser = authLookup.error ? null : authLookup.data.user;
  const authEmail = authUser?.email?.trim().toLowerCase() ?? null;
  const metadataPhone =
    typeof authUser?.user_metadata?.phone === "string" ? authUser.user_metadata.phone : null;

  const contact: RecipientContact = {
    email: authEmail ?? profileEmail,
    phoneE164: normalizePhoneE164(metadataPhone)
  };

  recipientCache.set(userId, contact);
  return contact;
};

const markOutboxStatus = async (
  outboxId: string,
  status: "sent" | "failed" | "skipped",
  errorMessage?: string | null
) => {
  const admin = getSupabaseAdminClient();
  const patch: Record<string, unknown> = {
    status,
    last_error: errorMessage ?? null
  };
  if (status === "sent" || status === "skipped") {
    patch.sent_at = new Date().toISOString();
  }
  await admin.from("notification_outbox").update(patch).eq("id", outboxId);
};

const dispatchOutboxItem = async (row: OutboxRow) => {
  const title = String(row.payload?.title ?? "").trim();
  const body = String(row.payload?.body ?? "").trim();
  if (!title || !body) {
    await markOutboxStatus(row.id, "failed", "payload_invalido: title/body obrigatorios");
    return "failed" as const;
  }

  const canSend = await shouldSendChannel(row.recipient_user_id, row.channel);
  if (!canSend) {
    await markOutboxStatus(row.id, "skipped", "opt_out");
    return "skipped" as const;
  }

  if (row.channel === "in_app") {
    const admin = getSupabaseAdminClient();
    const insert = await admin.from("notifications").insert({
      recipient_user_id: row.recipient_user_id,
      seller_id: row.recipient_seller_id,
      type: row.template_key,
      title,
      body,
      cta_label: row.payload?.cta_label ?? null,
      cta_href: row.payload?.cta_href ?? null,
      metadata: row.payload?.metadata ?? {},
      is_read: false
    });
    if (insert.error) {
      await markOutboxStatus(row.id, "failed", insert.error.message);
      return "failed" as const;
    }
  }

  if (row.channel === "email") {
    const recipient = await loadRecipientContact(row.recipient_user_id);
    const metadataEmail =
      typeof row.payload?.metadata?.email === "string"
        ? row.payload.metadata.email.trim().toLowerCase()
        : null;
    const emailTo = recipient.email ?? metadataEmail;

    if (!emailTo) {
      await markOutboxStatus(row.id, "skipped", "missing_email");
      return "skipped" as const;
    }

    const result = await deliverEmailNotification({
      to: emailTo,
      title,
      body
    });
    if (!result.ok) {
      await markOutboxStatus(row.id, "failed", result.error ?? "email_dispatch_failed");
      return "failed" as const;
    }
  }

  if (row.channel === "whatsapp") {
    const recipient = await loadRecipientContact(row.recipient_user_id);
    const metadataPhone =
      typeof row.payload?.metadata?.phone_e164 === "string"
        ? normalizePhoneE164(row.payload.metadata.phone_e164)
        : typeof row.payload?.metadata?.phone === "string"
          ? normalizePhoneE164(row.payload.metadata.phone)
          : null;
    const whatsappTo = recipient.phoneE164 ?? metadataPhone;

    if (!whatsappTo) {
      await markOutboxStatus(row.id, "skipped", "missing_whatsapp_phone");
      return "skipped" as const;
    }

    const result = await deliverWhatsAppNotification({
      to: whatsappTo,
      body
    });
    if (!result.ok) {
      await markOutboxStatus(row.id, "failed", result.error ?? "whatsapp_dispatch_failed");
      return "failed" as const;
    }
  }

  await markOutboxStatus(row.id, "sent", null);
  return "sent" as const;
};

export async function POST(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Nao autorizado para job interno." }, { status: 401 });
  }

  const limit = parseJobLimit(request.nextUrl.searchParams.get("limit"), 100, 500);
  const admin = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const token = randomUUID();

  const lookup = await admin
    .from("notification_outbox")
    .select("id,recipient_user_id,recipient_seller_id,channel,template_key,payload,attempts")
    .in("status", ["pending", "failed"])
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (lookup.error) {
    return NextResponse.json({ error: lookup.error.message }, { status: 500 });
  }

  const rows = (lookup.data ?? []) as OutboxRow[];
  let claimed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const claim = await admin
      .from("notification_outbox")
      .update({
        status: "processing",
        processing_started_at: nowIso,
        attempts: Number(row.attempts ?? 0) + 1,
        last_error: null
      })
      .eq("id", row.id)
      .in("status", ["pending", "failed"])
      .select("id")
      .maybeSingle();

    if (claim.error || !claim.data) {
      continue;
    }
    claimed += 1;

    try {
      const result = await dispatchOutboxItem(row);
      if (result === "sent") sent += 1;
      if (result === "skipped") skipped += 1;
      if (result === "failed") failed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "dispatch_unknown_error";
      await markOutboxStatus(row.id, "failed", message);
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    worker_token: token,
    looked_up: rows.length,
    claimed,
    sent,
    skipped,
    failed
  });
}
