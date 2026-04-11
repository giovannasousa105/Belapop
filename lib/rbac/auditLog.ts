import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SellerPermissionKey, SellerRbacRole } from "@/lib/rbac/sellerPolicy";

type AuditLogInput = {
  actorUserId: string;
  role: SellerRbacRole;
  action: string;
  permissionUsed?: SellerPermissionKey;
  sellerId?: string | null;
  entityType?: string;
  entityId?: string;
  beforeState?: unknown;
  afterState?: unknown;
  requestId?: string | null;
  requestIp?: string | null;
  userAgent?: string | null;
  notes?: string | null;
};

const isMissingColumnError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("column") && message.includes("does not exist");
};

const isMissingTableError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("relation") && message.includes("does not exist");
};

const normalizeIp = (ip: string | null | undefined) => {
  const first = (ip ?? "").split(",")[0]?.trim() ?? "";
  if (!first) return null;
  const ipv4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  if (ipv4.test(first) || ipv6.test(first)) return first;
  return null;
};

const asPlainObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const computeDiff = (beforeState: unknown, afterState: unknown) => {
  const before = asPlainObject(beforeState);
  const after = asPlainObject(afterState);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of keys) {
    if (before[key] !== after[key]) {
      diff[key] = { before: before[key], after: after[key] };
    }
  }
  return diff;
};

export const logSellerAuditEvent = async (input: AuditLogInput) => {
  const admin = getSupabaseAdminClient();
  const normalizedIp = normalizeIp(input.requestIp);
  const entityType = input.entityType ?? "seller_event";
  const entityId =
    input.entityId ??
    String(
      (asPlainObject(input.afterState).id ??
        asPlainObject(input.beforeState).id ??
        `${input.action}:${Date.now()}`) as string
    );

  const auditLogInsert = await admin.from("audit_log").insert({
    actor_user_id: input.actorUserId,
    actor_role: input.role,
    actor_ip: normalizedIp,
    actor_user_agent: input.userAgent ?? null,
    store_id: input.sellerId ?? null,
    entity_type: entityType,
    entity_id: entityId,
    action: input.action,
    permission_used: input.permissionUsed ?? null,
    before_data: (input.beforeState as any) ?? null,
    after_data: (input.afterState as any) ?? null,
    diff_data: computeDiff(input.beforeState, input.afterState),
    request_id: input.requestId ?? null,
    notes: input.notes ?? null
  });

  if (auditLogInsert.error && !isMissingTableError(auditLogInsert.error)) {
    console.error("[audit] audit_log insert failed", auditLogInsert.error);
  }

  const richRow = {
    seller_id: input.sellerId ?? null,
    actor_id: input.actorUserId,
    action: input.action,
    role: input.role,
    permission_used: input.permissionUsed ?? null,
    before_state: (input.beforeState as any) ?? null,
    after_state: (input.afterState as any) ?? null,
    ip_address: normalizedIp ?? null,
    user_agent: input.userAgent ?? null,
    notes:
      input.notes ??
      JSON.stringify({
        action: input.action,
        permission: input.permissionUsed ?? null
      })
  };

  const richInsert = await admin.from("seller_audit_logs").insert(richRow);
  if (!richInsert.error) return;

  if (!isMissingColumnError(richInsert.error)) {
    console.error("[audit] insert failed", richInsert.error);
    return;
  }

  const fallbackRow = {
    seller_id: input.sellerId ?? null,
    actor_id: input.actorUserId,
    action: input.action,
    notes:
      input.notes ??
      JSON.stringify({
        role: input.role,
        permission_used: input.permissionUsed ?? null,
        before_state: input.beforeState ?? null,
        after_state: input.afterState ?? null,
        ip: input.requestIp ?? null,
        user_agent: input.userAgent ?? null
      })
  };

  const fallbackInsert = await admin.from("seller_audit_logs").insert(fallbackRow);
  if (fallbackInsert.error) {
    console.error("[audit] fallback insert failed", fallbackInsert.error);
  }
};
