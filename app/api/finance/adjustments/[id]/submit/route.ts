import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  FINANCE_ADJUSTMENTS_MIGRATION,
  asAdjustmentResponse,
  isAdjustmentStatus,
  missingMigrationResponse,
  requireFinanceScope
} from "../../_shared";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireFinanceScope("finance.approve_adjustment");
  if (!auth.ok) return auth.response;

  const { user, scope } = auth;
  const { id } = await context.params;
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

  if (!isAdjustmentStatus(lookup.data.status) || lookup.data.status !== "draft") {
    return NextResponse.json(
      { error: "Somente ajustes em draft podem ser enviados para aprovacao." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const update = await admin
    .from("finance_adjustments")
    .update({ status: "pending_approval", submitted_at: now })
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
    action: "submit_finance_adjustment",
    entityType: "finance_adjustment",
    entityId: id,
    beforeState: lookup.data,
    afterState: update.data,
    requestId: request.headers.get("x-request-id"),
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json(asAdjustmentResponse(update.data));
}
