import { NextResponse } from "next/server";

import { hasPermission, isRoleAllowed, type SellerPermissionKey } from "@/lib/rbac/sellerPolicy";
import { isMissingTableError, resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type AdjustmentStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "applied"
  | "cancelled";

export type ApprovalDecision = "approved" | "rejected";

export const FINANCE_ADJUSTMENTS_MIGRATION =
  "20260303_0500_enterprise_audit_and_adjustments.sql";
export const FINANCE_LEDGER_MIGRATION = "20260303_0600_finance_ledger_workflow.sql";

export const isAdjustmentStatus = (value: unknown): value is AdjustmentStatus => {
  return (
    value === "draft" ||
    value === "pending_approval" ||
    value === "approved" ||
    value === "rejected" ||
    value === "applied" ||
    value === "cancelled"
  );
};

export const isApprovalDecision = (value: unknown): value is ApprovalDecision => {
  return value === "approved" || value === "rejected";
};

export const asAdjustmentResponse = <T extends Record<string, unknown>>(row: T) => {
  const sellerId = (row.seller_id as string | null | undefined) ?? null;
  const storeId = (row.store_id as string | null | undefined) ?? sellerId;
  return {
    ...row,
    seller_id: sellerId,
    store_id: storeId
  };
};

export const parsePagination = (
  searchParams: URLSearchParams,
  defaults: { pageSize: number; maxPageSize: number }
) => {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const requestedPageSize = Number(searchParams.get("page_size") ?? String(defaults.pageSize));
  const pageSize = Math.min(defaults.maxPageSize, Math.max(1, requestedPageSize || defaults.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
};

export const computeNextStatus = (
  currentStatus: AdjustmentStatus,
  requiresDualApproval: boolean,
  approvals: Array<{ decision: string }>
): AdjustmentStatus => {
  if (currentStatus === "cancelled" || currentStatus === "applied") return currentStatus;
  if (approvals.some((row) => row.decision === "rejected")) return "rejected";

  const approved = approvals.filter((row) => row.decision === "approved").length;
  const required = requiresDualApproval ? 2 : 1;
  if (approved >= required) return "approved";
  return "pending_approval";
};

export const adjustmentApprovalsMeta = (
  approvals: Array<{ decision: string }>,
  requiresDualApproval: boolean
) => {
  const approvalsReceived = approvals.filter((item) => item.decision === "approved").length;
  return {
    approvals_required: requiresDualApproval ? 2 : 1,
    approvals_received: approvalsReceived
  };
};

export const missingMigrationResponse = (
  error: { code?: string | null; message?: string | null } | null,
  tableName: string,
  migrationFile: string
) => {
  if (!isMissingTableError(error)) return null;
  return NextResponse.json(
    {
      error: `Tabela ${tableName} nao encontrada. Rode a migration ${migrationFile}.`
    },
    { status: 400 }
  );
};

export const requireFinanceScope = async (requiredPermission: SellerPermissionKey) => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 })
    };
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope || !isRoleAllowed(scope.rbac, ["FINANCEIRO"])) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Acesso restrito ao financeiro." }, { status: 403 })
    };
  }

  if (!hasPermission(scope.rbac, requiredPermission)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: `Permissao ${requiredPermission} obrigatoria.` },
        { status: 403 }
      )
    };
  }

  return { ok: true as const, user, scope };
};

export const assertScopedStore = (requestedStoreId: string | null, scopedStoreId: string) => {
  if (!requestedStoreId) {
    return { ok: true as const };
  }
  if (requestedStoreId !== scopedStoreId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "store_id nao pertence ao escopo autenticado." },
        { status: 403 }
      )
    };
  }
  return { ok: true as const };
};
