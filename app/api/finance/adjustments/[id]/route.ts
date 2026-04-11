import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  FINANCE_ADJUSTMENTS_MIGRATION,
  adjustmentApprovalsMeta,
  asAdjustmentResponse,
  isAdjustmentStatus,
  missingMigrationResponse,
  requireFinanceScope
} from "../_shared";

type UpdateAdjustmentBody = {
  amount?: number;
  currency?: string;
  reason?: string;
  evidence?: Record<string, unknown>;
  requires_dual_approval?: boolean;
  risk_level?: "low" | "medium" | "high";
  payout_id?: string | null;
  order_id?: string | null;
};

const isRiskLevel = (value: unknown): value is "low" | "medium" | "high" => {
  return value === "low" || value === "medium" || value === "high";
};

const getRiskLevel = (amount: number, evidence: Record<string, unknown> | undefined) => {
  const abs = Math.abs(amount);
  const chargeback = Boolean(evidence?.chargeback === true);
  if (chargeback || abs >= 500) return "high" as const;
  if (abs >= 200) return "medium" as const;
  return "low" as const;
};

const loadAdjustment = async (id: string, sellerId: string) => {
  const admin = getSupabaseAdminClient();
  const lookup = await admin
    .from("finance_adjustments")
    .select("*")
    .eq("id", id)
    .eq("seller_id", sellerId)
    .maybeSingle();

  return { admin, lookup };
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireFinanceScope("finance.view_details");
  if (!auth.ok) return auth.response;

  const { scope } = auth;
  const { id } = await context.params;

  const { admin, lookup } = await loadAdjustment(id, scope.sellerId);
  if (lookup.error) {
    const missing = missingMigrationResponse(
      lookup.error,
      "finance_adjustments",
      FINANCE_ADJUSTMENTS_MIGRATION
    );
    if (missing) return missing;
    return NextResponse.json({ error: lookup.error.message }, { status: 500 });
  }
  if (!lookup.data) {
    return NextResponse.json({ error: "Ajuste nao encontrado." }, { status: 404 });
  }

  const approvalsLookup = await admin
    .from("finance_adjustment_approvals")
    .select("approver_user_id,decision,comment,decided_at")
    .eq("adjustment_id", id)
    .order("decided_at", { ascending: true });

  if (approvalsLookup.error) {
    const missing = missingMigrationResponse(
      approvalsLookup.error,
      "finance_adjustment_approvals",
      FINANCE_ADJUSTMENTS_MIGRATION
    );
    if (missing) return missing;
    return NextResponse.json({ error: approvalsLookup.error.message }, { status: 500 });
  }

  const approvals = approvalsLookup.data ?? [];
  const meta = adjustmentApprovalsMeta(approvals, Boolean(lookup.data.requires_dual_approval));

  return NextResponse.json({
    ...asAdjustmentResponse(lookup.data),
    approvals,
    ...meta
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireFinanceScope("finance.approve_adjustment");
  if (!auth.ok) return auth.response;

  const { user, scope } = auth;
  const { id } = await context.params;

  const { admin, lookup } = await loadAdjustment(id, scope.sellerId);
  if (lookup.error) {
    const missing = missingMigrationResponse(
      lookup.error,
      "finance_adjustments",
      FINANCE_ADJUSTMENTS_MIGRATION
    );
    if (missing) return missing;
    return NextResponse.json({ error: lookup.error.message }, { status: 500 });
  }
  if (!lookup.data) {
    return NextResponse.json({ error: "Ajuste nao encontrado." }, { status: 404 });
  }
  if (!isAdjustmentStatus(lookup.data.status) || lookup.data.status !== "draft") {
    return NextResponse.json(
      { error: "Somente ajustes em draft podem ser alterados." },
      { status: 400 }
    );
  }

  const body = (await request.json()) as UpdateAdjustmentBody;
  const beforeState = lookup.data;
  const patch: Record<string, unknown> = {};

  if (body.amount !== undefined) {
    const parsedAmount = Number(body.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json({ error: "amount invalido." }, { status: 400 });
    }
    patch.amount = parsedAmount;
  }

  if (body.currency !== undefined) {
    const currency = String(body.currency ?? "").trim().toUpperCase();
    if (!currency) {
      return NextResponse.json({ error: "currency invalido." }, { status: 400 });
    }
    patch.currency = currency;
  }

  if (body.reason !== undefined) {
    const reason = String(body.reason ?? "").trim();
    if (!reason) {
      return NextResponse.json({ error: "reason invalido." }, { status: 400 });
    }
    patch.reason = reason;
  }

  if (body.evidence !== undefined) {
    patch.evidence = body.evidence ?? {};
  }

  if (body.payout_id !== undefined) {
    patch.payout_id = body.payout_id ?? null;
  }

  if (body.order_id !== undefined) {
    patch.order_id = body.order_id ?? null;
  }

  const nextAmount = Number(patch.amount ?? beforeState.amount);
  const nextEvidence = (patch.evidence ?? beforeState.evidence ?? {}) as Record<string, unknown>;

  if (body.requires_dual_approval !== undefined) {
    patch.requires_dual_approval = Boolean(body.requires_dual_approval);
  }

  if (Math.abs(nextAmount) >= 500 || nextEvidence.chargeback === true) {
    patch.requires_dual_approval = true;
  }

  if (body.risk_level !== undefined) {
    if (!isRiskLevel(body.risk_level)) {
      return NextResponse.json({ error: "risk_level invalido." }, { status: 400 });
    }
    patch.risk_level = body.risk_level;
  } else if (body.amount !== undefined || body.evidence !== undefined) {
    patch.risk_level = getRiskLevel(nextAmount, nextEvidence);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  patch.updated_at = new Date().toISOString();

  const update = await admin
    .from("finance_adjustments")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (update.error) {
    return NextResponse.json({ error: update.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    sellerId: scope.sellerId,
    role: scope.rbac.role,
    permissionUsed: "finance.approve_adjustment",
    action: "update_finance_adjustment",
    entityType: "finance_adjustment",
    entityId: id,
    beforeState,
    afterState: update.data,
    requestId: request.headers.get("x-request-id"),
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json(asAdjustmentResponse(update.data));
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireFinanceScope("finance.approve_adjustment");
  if (!auth.ok) return auth.response;

  const { user, scope } = auth;
  const { id } = await context.params;

  const { admin, lookup } = await loadAdjustment(id, scope.sellerId);
  if (lookup.error) {
    const missing = missingMigrationResponse(
      lookup.error,
      "finance_adjustments",
      FINANCE_ADJUSTMENTS_MIGRATION
    );
    if (missing) return missing;
    return NextResponse.json({ error: lookup.error.message }, { status: 500 });
  }
  if (!lookup.data) {
    return NextResponse.json({ error: "Ajuste nao encontrado." }, { status: 404 });
  }
  if (!isAdjustmentStatus(lookup.data.status) || lookup.data.status !== "draft") {
    return NextResponse.json(
      { error: "Somente ajustes em draft podem ser cancelados." },
      { status: 400 }
    );
  }

  const cancel = await admin
    .from("finance_adjustments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select("*")
    .single();

  if (cancel.error) {
    return NextResponse.json({ error: cancel.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    sellerId: scope.sellerId,
    role: scope.rbac.role,
    permissionUsed: "finance.approve_adjustment",
    action: "cancel_finance_adjustment",
    entityType: "finance_adjustment",
    entityId: id,
    beforeState: lookup.data,
    afterState: cancel.data,
    requestId: request.headers.get("x-request-id"),
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return new NextResponse(null, { status: 204 });
}
