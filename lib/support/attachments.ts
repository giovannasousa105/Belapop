import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeAttachmentType,
  type TicketAttachment
} from "@/lib/api/v1/customer-contract";

type SupportAttachmentRow = {
  id: string;
  user_id: string;
  ticket_id: string | null;
  bucket: string;
  storage_path: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  status: "pending" | "uploaded" | "failed" | "deleted";
  uploaded_at: string | null;
  created_at: string;
};

const ATTACHMENT_COLUMNS = [
  "id",
  "user_id",
  "ticket_id",
  "bucket",
  "storage_path",
  "filename",
  "content_type",
  "size_bytes",
  "status",
  "uploaded_at",
  "created_at"
].join(",");

export const isMissingRelationOrColumn = (
  error: { code?: string | null; message?: string | null } | null
) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "42703" || error.code === "PGRST204") {
    return true;
  }
  const message = String(error.message ?? "").toLowerCase();
  return (
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("column") && message.includes("does not exist"))
  );
};

const toTicketAttachment = (row: SupportAttachmentRow): TicketAttachment => ({
  attachment_id: row.id,
  type: normalizeAttachmentType(row.content_type),
  filename: row.filename,
  url: `/api/v1/support/attachments/${row.id}?download=1`,
  uploaded_at: row.uploaded_at ?? row.created_at ?? new Date().toISOString()
});

export const loadTicketAttachmentsForUser = async (
  admin: SupabaseClient,
  ticketId: string,
  userId: string
): Promise<TicketAttachment[]> => {
  const lookup = await admin
    .from("support_attachments")
    .select(ATTACHMENT_COLUMNS)
    .eq("ticket_id", ticketId)
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("created_at", { ascending: true });

  if (lookup.error) {
    if (isMissingRelationOrColumn(lookup.error)) return [];
    throw new Error(lookup.error.message);
  }

  return ((lookup.data ?? []) as unknown as SupportAttachmentRow[]).map(toTicketAttachment);
};

export const loadAttachmentForUser = async (
  admin: SupabaseClient,
  attachmentId: string,
  userId: string
) => {
  const lookup = await admin
    .from("support_attachments")
    .select(ATTACHMENT_COLUMNS)
    .eq("id", attachmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (lookup.error) {
    if (isMissingRelationOrColumn(lookup.error)) return null;
    throw new Error(lookup.error.message);
  }
  return (lookup.data as SupportAttachmentRow | null) ?? null;
};

export const claimCustomerAttachmentsForTicket = async (
  admin: SupabaseClient,
  args: {
    userId: string;
    ticketId: string;
    attachmentIds: string[];
  }
) => {
  const uniqueAttachmentIds = Array.from(
    new Set(args.attachmentIds.map((value) => String(value).trim()).filter(Boolean))
  );
  if (!uniqueAttachmentIds.length) return [] as TicketAttachment[];

  const lookup = await admin
    .from("support_attachments")
    .select(ATTACHMENT_COLUMNS)
    .eq("user_id", args.userId)
    .in("id", uniqueAttachmentIds)
    .neq("status", "deleted");

  if (lookup.error) {
    if (isMissingRelationOrColumn(lookup.error)) return [];
    throw new Error(lookup.error.message);
  }

  const rows = (lookup.data ?? []) as unknown as SupportAttachmentRow[];
  const foundIds = new Set(rows.map((row) => row.id));
  const missing = uniqueAttachmentIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new Error(`attachments_invalid_or_not_owned:${missing.join(",")}`);
  }

  const nowIso = new Date().toISOString();
  const patch = await admin
    .from("support_attachments")
    .update({
      ticket_id: args.ticketId,
      status: "uploaded",
      uploaded_at: nowIso
    })
    .eq("user_id", args.userId)
    .in("id", uniqueAttachmentIds);

  if (patch.error) {
    if (isMissingRelationOrColumn(patch.error)) return [];
    throw new Error(patch.error.message);
  }

  const refreshed = await admin
    .from("support_attachments")
    .select(ATTACHMENT_COLUMNS)
    .eq("user_id", args.userId)
    .eq("ticket_id", args.ticketId)
    .in("id", uniqueAttachmentIds)
    .order("created_at", { ascending: true });

  if (refreshed.error) {
    if (isMissingRelationOrColumn(refreshed.error)) return [];
    throw new Error(refreshed.error.message);
  }

  return ((refreshed.data ?? []) as unknown as SupportAttachmentRow[]).map(toTicketAttachment);
};
