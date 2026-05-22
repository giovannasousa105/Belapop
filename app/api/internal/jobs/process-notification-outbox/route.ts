import { NextRequest, NextResponse } from "next/server";

import {
  deliverEmailNotification,
  deliverWhatsAppNotification
} from "@/lib/notifications/providers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isInternalJobAuthorized, parseJobLimit } from "@/lib/internal/jobs";

export const runtime = "nodejs";

type OutboxStatus = "pending" | "processing" | "sent" | "failed" | "skipped";

type OutboxRow = {
  id: string;
  automation_run_id?: string | null;
  recipient_user_id: string | null;
  recipient_seller_id?: string | null;
  channel: "in_app" | "email" | "whatsapp";
  template_key?: string | null;
  type?: string | null;
  communication_type?: "transactional" | "marketing" | null;
  payload: {
    title?: string;
    body?: string;
    subject?: string | null;
    html?: string | null;
    cta_label?: string | null;
    cta_href?: string | null;
    metadata?: Record<string, unknown>;
  } | null;
  status: OutboxStatus;
  attempts: number | null;
  max_attempts?: number | null;
};

type RecipientContact = {
  email: string | null;
  phoneE164: string | null;
  marketingOptIn: boolean;
};

const recipientCache = new Map<string, RecipientContact>();

const FULL_OUTBOX_SELECT =
  "id,automation_run_id,recipient_user_id,recipient_seller_id,channel,template_key,type,communication_type,payload,status,attempts,max_attempts";

const LEGACY_OUTBOX_SELECT =
  "id,recipient_user_id,recipient_seller_id,channel,template_key,payload,status,attempts";

const TERMINAL_STATUSES = ["sent", "skipped", "failed"];

const isMissingSchema = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (["42P01", "42703", "PGRST200", "PGRST204"].includes(String(error.code ?? ""))) {
    return true;
  }
  const message = String(error.message ?? "").toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("could not find") ||
    (message.includes("column") && message.includes("schema cache"))
  );
};

const sanitizeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "unknown_error");
  return message
    .replace(/(Bearer\s+)[^\s]+/gi, "$1[redacted]")
    .replace(/(service_role|SUPABASE_SERVICE_ROLE_KEY|INTERNAL_JOB_SECRET|CRON_SECRET)[^,\s]*/gi, "$1[redacted]")
    .slice(0, 700);
};

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

const templateKeyFor = (row: OutboxRow) =>
  String(row.template_key ?? row.type ?? "notification").trim() || "notification";

const communicationTypeFor = (row: OutboxRow) =>
  row.communication_type === "marketing" ? "marketing" : "transactional";

const safePatchOutbox = async (
  rowId: string,
  patch: Record<string, unknown>,
  fallbackPatch?: Record<string, unknown>
) => {
  const admin = getSupabaseAdminClient();
  const update = await admin.from("notification_outbox").update(patch).eq("id", rowId);
  if (!update.error) return;

  if (fallbackPatch && isMissingSchema(update.error)) {
    const fallback = await admin.from("notification_outbox").update(fallbackPatch).eq("id", rowId);
    if (!fallback.error) return;
    throw new Error(fallback.error.message);
  }

  throw new Error(update.error.message);
};

const markOutboxStatus = async (
  row: OutboxRow,
  status: "sent" | "failed" | "skipped",
  errorMessage?: string | null
) => {
  const nowIso = new Date().toISOString();
  const safeMessage = errorMessage ? sanitizeError(errorMessage) : null;
  await safePatchOutbox(
    row.id,
    {
      status,
      last_error: safeMessage,
      processed_at: status === "sent" || status === "skipped" ? nowIso : null,
      sent_at: status === "sent" || status === "skipped" ? nowIso : null,
      locked_at: null,
      updated_at: nowIso
    },
    {
      status,
      last_error: safeMessage,
      sent_at: status === "sent" || status === "skipped" ? nowIso : null
    }
  );

  if (!row.automation_run_id) return;

  const admin = getSupabaseAdminClient();
  const aggregate = await admin
    .from("notification_outbox")
    .select("status")
    .eq("automation_run_id", row.automation_run_id);

  if (aggregate.error) {
    if (!isMissingSchema(aggregate.error)) {
      console.warn("[notification-outbox] automation aggregate failed", {
        automationRunId: row.automation_run_id,
        error: sanitizeError(aggregate.error.message)
      });
    }
    return;
  }

  const statuses = (aggregate.data ?? []).map((item) => String(item.status ?? ""));
  const allTerminal = statuses.length > 0 && statuses.every((value) => TERMINAL_STATUSES.includes(value));
  if (!allTerminal) return;

  const finalStatus = statuses.includes("sent")
    ? "sent"
    : statuses.includes("skipped")
      ? "skipped"
      : "failed";
  const runUpdate = await admin
    .from("customer_lifecycle_automation_runs")
    .update({
      status: finalStatus,
      finalized_at: nowIso,
      updated_at: nowIso
    })
    .eq("id", row.automation_run_id);

  if (runUpdate.error && !isMissingSchema(runUpdate.error)) {
    console.warn("[notification-outbox] automation finalize failed", {
      automationRunId: row.automation_run_id,
      error: sanitizeError(runUpdate.error.message)
    });
  }
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
    phoneE164: normalizePhoneE164(metadataPhone),
    marketingOptIn: Boolean(authUser?.user_metadata?.marketing_opt_in)
  };

  recipientCache.set(userId, contact);
  return contact;
};

const shouldSendChannel = async (row: OutboxRow) => {
  const userId = row.recipient_user_id;
  if (!userId) return false;
  if (row.channel === "in_app") return communicationTypeFor(row) !== "marketing";

  const admin = getSupabaseAdminClient();
  const [lookup, authLookup] = await Promise.all([
    admin
      .from("notification_preferences")
      .select("email_opt_in,whatsapp_opt_in")
      .eq("user_id", userId)
      .maybeSingle(),
    admin.auth.admin.getUserById(userId)
  ]);

  const marketingOptIn = Boolean(authLookup.data.user?.user_metadata?.marketing_opt_in);
  if (lookup.error) {
    return communicationTypeFor(row) === "marketing" ? false : row.channel === "email";
  }

  const transactionalWhatsappOptIn = lookup.data?.whatsapp_opt_in ?? false;
  if (communicationTypeFor(row) === "marketing") {
    return row.channel === "email" ? marketingOptIn : marketingOptIn && transactionalWhatsappOptIn;
  }

  return row.channel === "email" ? true : transactionalWhatsappOptIn;
};

const insertInAppNotification = async (row: OutboxRow, title: string, body: string) => {
  const admin = getSupabaseAdminClient();
  const metadata = {
    ...(row.payload?.metadata ?? {}),
    outbox_id: row.id
  };

  const existing = await admin
    .from("notifications")
    .select("id")
    .eq("recipient_user_id", row.recipient_user_id)
    .eq("type", templateKeyFor(row))
    .contains("metadata", { outbox_id: row.id })
    .maybeSingle();

  if (!existing.error && existing.data?.id) return;

  const insert = await admin.from("notifications").insert({
    recipient_user_id: row.recipient_user_id,
    seller_id: row.recipient_seller_id ?? null,
    type: templateKeyFor(row),
    title,
    body,
    cta_label: row.payload?.cta_label ?? null,
    cta_href: row.payload?.cta_href ?? null,
    metadata,
    is_read: false
  });

  if (insert.error) throw new Error(insert.error.message);
};

const dispatchOutboxItem = async (row: OutboxRow) => {
  if (!row.recipient_user_id) return markOutboxStatus(row, "failed", "missing_recipient_user_id").then(() => "failed" as const);

  const title = String(row.payload?.title ?? "").trim();
  const body = String(row.payload?.body ?? "").trim();
  const subject = String(row.payload?.subject ?? title).trim() || title;
  const html = typeof row.payload?.html === "string" ? row.payload.html : null;
  if (!title || !body) {
    await markOutboxStatus(row, "failed", "payload_invalid:title_body_required");
    return "failed" as const;
  }

  const canSend = await shouldSendChannel(row);
  if (!canSend) {
    await markOutboxStatus(row, "skipped", "opt_out");
    return "skipped" as const;
  }

  if (row.channel === "in_app") {
    await insertInAppNotification(row, title, body);
  }

  if (row.channel === "email") {
    const recipient = await loadRecipientContact(row.recipient_user_id);
    const metadataEmail =
      typeof row.payload?.metadata?.email === "string"
        ? row.payload.metadata.email.trim().toLowerCase()
        : null;
    const emailTo = recipient.email ?? metadataEmail;
    if (!emailTo) {
      await markOutboxStatus(row, "skipped", "missing_email");
      return "skipped" as const;
    }

    const result = await deliverEmailNotification({ to: emailTo, subject, body, html });
    if (!result.ok) {
      await markOutboxStatus(row, "failed", result.error ?? "email_dispatch_failed");
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
      await markOutboxStatus(row, "skipped", "missing_whatsapp_phone");
      return "skipped" as const;
    }

    const result = await deliverWhatsAppNotification({ to: whatsappTo, body });
    if (!result.ok) {
      await markOutboxStatus(row, "failed", result.error ?? "whatsapp_dispatch_failed");
      return "failed" as const;
    }
  }

  await markOutboxStatus(row, "sent", null);
  return "sent" as const;
};

const loadPendingRows = async (limit: number) => {
  const admin = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const query = (select: string) =>
    admin
      .from("notification_outbox")
      .select(select)
      .eq("status", "pending")
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(limit);

  const full = await query(FULL_OUTBOX_SELECT);
  if (!full.error) {
    return { rows: ((full.data ?? []) as unknown) as OutboxRow[], schemaWarning: null as string | null };
  }

  if (!isMissingSchema(full.error)) throw new Error(full.error.message);
  const legacy = await query(LEGACY_OUTBOX_SELECT);
  if (!legacy.error) {
    return {
      rows: ((legacy.data ?? []) as unknown) as OutboxRow[],
      schemaWarning: "notification_outbox_hardening_migration_pending"
    };
  }
  if (isMissingSchema(legacy.error)) {
    return {
      rows: [] as OutboxRow[],
      schemaWarning: "notification_outbox_table_or_columns_missing"
    };
  }
  throw new Error(legacy.error.message);
};

async function handle(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized", message: "Invalid internal job secret." },
      { status: 401 }
    );
  }

  if (request.nextUrl.searchParams.get("auth_check") === "1") {
    return NextResponse.json({
      ok: true,
      processed: 0,
      message: "Internal job authentication verified"
    });
  }

  const limit = parseJobLimit(request.nextUrl.searchParams.get("limit"), 100, 500);
  const admin = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { rows, schemaWarning } = await loadPendingRows(limit);

  if (rows.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      message: "No pending notifications",
      ...(schemaWarning ? { warning: schemaWarning } : {})
    });
  }

  let claimed = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const attempts = Number(row.attempts ?? 0);
    const maxAttempts = Number(row.max_attempts ?? 3);
    if (attempts >= maxAttempts) {
      await markOutboxStatus(row, "failed", "max_attempts_reached");
      failed += 1;
      continue;
    }

    const nextAttempts = attempts + 1;
    const claimPatch = {
      status: "processing",
      processing_started_at: nowIso,
      locked_at: nowIso,
      attempts: nextAttempts,
      last_error: null,
      updated_at: nowIso
    };
    const claim = await admin
      .from("notification_outbox")
      .update(claimPatch)
      .eq("id", row.id)
      .eq("status", "pending")
      .eq("attempts", attempts)
      .select("id")
      .maybeSingle();

    if (claim.error && isMissingSchema(claim.error)) {
      const legacyClaim = await admin
        .from("notification_outbox")
        .update({
          status: "processing",
          processing_started_at: nowIso,
          attempts: nextAttempts,
          last_error: null
        })
        .eq("id", row.id)
        .eq("status", "pending")
        .eq("attempts", attempts)
        .select("id")
        .maybeSingle();
      if (legacyClaim.error || !legacyClaim.data) continue;
    } else if (claim.error || !claim.data) {
      continue;
    }

    claimed += 1;
    try {
      const result = await dispatchOutboxItem({ ...row, attempts: nextAttempts });
      if (result === "sent") sent += 1;
      if (result === "skipped") skipped += 1;
      if (result === "failed") failed += 1;
    } catch (error) {
      const message = sanitizeError(error);
      await markOutboxStatus({ ...row, attempts: nextAttempts }, "failed", message);
      failed += 1;
    }
  }

  const response = {
    ok: true,
    processed: claimed,
    looked_up: rows.length,
    sent,
    skipped,
    failed,
    ...(schemaWarning ? { warning: schemaWarning } : {})
  };

  console.log("[notification-outbox] processed", response);
  return NextResponse.json(response);
}

const safeHandle = async (request: NextRequest) => {
  try {
    return await handle(request);
  } catch (error) {
    const message = sanitizeError(error);
    console.error("[notification-outbox] job failed", { error: message });
    return NextResponse.json(
      {
        ok: false,
        error: "process_notification_outbox_failed",
        message
      },
      { status: 500 }
    );
  }
};

export async function POST(request: NextRequest) {
  return safeHandle(request);
}

export async function GET(request: NextRequest) {
  return safeHandle(request);
}
