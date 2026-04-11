import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  FINANCE_ADJUSTMENTS_MIGRATION,
  adjustmentApprovalsMeta,
  asAdjustmentResponse,
  isAdjustmentStatus,
  isApprovalDecision,
  missingMigrationResponse,
  requireFinanceScope
} from "../../_shared";

type ApprovalDecisionRequest = {
  decision?: "approved" | "rejected";
  comment?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireFinanceScope("finance.approve_adjustment");
  if (!auth.ok) return auth.response;

  const { user, scope } = auth;
  const { id } = await context.params;
  const body = (await request.json()) as ApprovalDecisionRequest;

  if (!isApprovalDecision(body.decision)) {
    return NextResponse.json({ error: "decision invalida." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  const lookup = await admin
    .from("finance_adjustments")
    .select("*")
    .eq("id", id)
    .eq("seller_id", scope.sellerId)
    .maybeSingle();

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

  if (lookup.data.created_by && lookup.data.created_by === user.id) {
    return NextResponse.json(
      { error: "Criador do ajuste nao pode aprovar/rejeitar o proprio ajuste." },
      { status: 403 }
    );
  }

  if (
    !isAdjustmentStatus(lookup.data.status) ||
    (lookup.data.status !== "pending_approval" && lookup.data.status !== "approved")
  ) {
    return NextResponse.json(
      { error: "Ajuste deve estar em pending_approval para decisao." },
      { status: 400 }
    );
  }

  const insertDecision = await admin
    .from("finance_adjustment_approvals")
    .insert({
      adjustment_id: id,
      approver_user_id: user.id,
      decision: body.decision,
      comment: body.comment ?? null,
      decided_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (insertDecision.error) {
    if (insertDecision.error.code === "23505") {
      return NextResponse.json(
        { error: "Usuario ja registrou decisao para este ajuste." },
        { status: 409 }
      );
    }

    const missing = missingMigrationResponse(
      insertDecision.error,
      "finance_adjustment_approvals",
      FINANCE_ADJUSTMENTS_MIGRATION
    );
    if (missing) return missing;
    return NextResponse.json({ error: insertDecision.error.message }, { status: 500 });
  }

  const [updatedAdjustment, approvalsLookup] = await Promise.all([
    admin.from("finance_adjustments").select("*").eq("id", id).single(),
    admin
      .from("finance_adjustment_approvals")
      .select("approver_user_id,decision,comment,decided_at")
      .eq("adjustment_id", id)
      .order("decided_at", { ascending: true })
  ]);

  if (updatedAdjustment.error) {
    return NextResponse.json({ error: updatedAdjustment.error.message }, { status: 500 });
  }

  if (approvalsLookup.error) {
    return NextResponse.json({ error: approvalsLookup.error.message }, { status: 500 });
  }

  const approvals = approvalsLookup.data ?? [];
  const meta = adjustmentApprovalsMeta(
    approvals,
    Boolean(updatedAdjustment.data.requires_dual_approval)
  );

  await logSellerAuditEvent({
    actorUserId: user.id,
    sellerId: scope.sellerId,
    role: scope.rbac.role,
    permissionUsed: "finance.approve_adjustment",
    action: body.decision === "approved" ? "approve_finance_adjustment" : "reject_finance_adjustment",
    entityType: "finance_adjustment",
    entityId: id,
    beforeState: lookup.data,
    afterState: updatedAdjustment.data,
    requestId: request.headers.get("x-request-id"),
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json(
    {
      ...asAdjustmentResponse(updatedAdjustment.data),
      approvals,
      ...meta
    },
    { status: 201 }
  );
}
