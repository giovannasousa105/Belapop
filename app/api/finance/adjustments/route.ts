import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  FINANCE_ADJUSTMENTS_MIGRATION,
  asAdjustmentResponse,
  assertScopedStore,
  isAdjustmentStatus,
  missingMigrationResponse,
  parsePagination,
  requireFinanceScope,
  type AdjustmentStatus
} from "./_shared";

type CreateAdjustmentBody = {
  store_id?: string;
  payout_id?: string | null;
  order_id?: string | null;
  amount?: number;
  currency?: string;
  reason?: string;
  evidence?: Record<string, unknown>;
  requires_dual_approval?: boolean;
  submit?: boolean;
  status?: AdjustmentStatus;
  risk_level?: "low" | "medium" | "high";
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

export async function GET(request: NextRequest) {
  const auth = await requireFinanceScope("finance.view_details");
  if (!auth.ok) return auth.response;

  const { scope } = auth;
  const storeId = request.nextUrl.searchParams.get("store_id");
  const storeCheck = assertScopedStore(storeId, scope.sellerId);
  if (!storeCheck.ok) return storeCheck.response;

  const statusParam = request.nextUrl.searchParams.get("status");
  const payoutId = request.nextUrl.searchParams.get("payout_id");
  const orderId = request.nextUrl.searchParams.get("order_id");
  const { page, pageSize, from, to } = parsePagination(request.nextUrl.searchParams, {
    pageSize: 25,
    maxPageSize: 200
  });

  const admin = getSupabaseAdminClient();

  let query = admin
    .from("finance_adjustments")
    .select("*", { count: "exact" })
    .eq("seller_id", scope.sellerId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (isAdjustmentStatus(statusParam)) {
    query = query.eq("status", statusParam);
  }
  if (payoutId) {
    query = query.eq("payout_id", payoutId);
  }
  if (orderId) {
    query = query.eq("order_id", orderId);
  }

  const adjustments = await query;
  if (adjustments.error) {
    const missing = missingMigrationResponse(
      adjustments.error,
      "finance_adjustments",
      FINANCE_ADJUSTMENTS_MIGRATION
    );
    if (missing) return missing;
    return NextResponse.json({ error: adjustments.error.message }, { status: 500 });
  }

  const rows = adjustments.data ?? [];
  const ids = rows.map((row) => row.id).filter(Boolean);

  const approvalsByAdjustment = new Map<string, Array<{ decision: string }>>();
  if (ids.length > 0) {
    const approvals = await admin
      .from("finance_adjustment_approvals")
      .select("adjustment_id,decision")
      .in("adjustment_id", ids);

    if (approvals.error) {
      const missing = missingMigrationResponse(
        approvals.error,
        "finance_adjustment_approvals",
        FINANCE_ADJUSTMENTS_MIGRATION
      );
      if (missing) return missing;
      return NextResponse.json({ error: approvals.error.message }, { status: 500 });
    }

    for (const row of approvals.data ?? []) {
      const list = approvalsByAdjustment.get(row.adjustment_id) ?? [];
      list.push({ decision: row.decision });
      approvalsByAdjustment.set(row.adjustment_id, list);
    }
  }

  const items = rows.map((row) => {
    const approvals = approvalsByAdjustment.get(row.id) ?? [];
    return {
      ...asAdjustmentResponse(row),
      approvals_count: approvals.length,
      approved_count: approvals.filter((entry) => entry.decision === "approved").length,
      rejected_count: approvals.filter((entry) => entry.decision === "rejected").length
    };
  });

  return NextResponse.json({
    page,
    page_size: pageSize,
    total: adjustments.count ?? items.length,
    items
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireFinanceScope("finance.approve_adjustment");
  if (!auth.ok) return auth.response;

  const { user, scope } = auth;
  const body = (await request.json()) as CreateAdjustmentBody;

  const requestedStoreId = String(body.store_id ?? "").trim();
  if (!requestedStoreId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 });
  }
  const storeCheck = assertScopedStore(requestedStoreId, scope.sellerId);
  if (!storeCheck.ok) return storeCheck.response;

  const reason = String(body.reason ?? "").trim();
  const amount = Number(body.amount);
  if (!reason) {
    return NextResponse.json({ error: "reason e obrigatorio." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: "amount invalido." }, { status: 400 });
  }

  const evidence = body.evidence ?? {};
  const riskLevel = isRiskLevel(body.risk_level) ? body.risk_level : getRiskLevel(amount, evidence);

  let requiresDualApproval =
    typeof body.requires_dual_approval === "boolean" ? body.requires_dual_approval : true;

  if (Math.abs(amount) >= 500 || evidence.chargeback === true) {
    requiresDualApproval = true;
  }

  const desiredStatus = isAdjustmentStatus(body.status)
    ? body.status
    : body.submit
      ? "pending_approval"
      : "draft";

  if (desiredStatus !== "draft" && desiredStatus !== "pending_approval") {
    return NextResponse.json(
      { error: "status invalido para criacao. Use draft ou pending_approval." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const admin = getSupabaseAdminClient();

  const insert = await admin
    .from("finance_adjustments")
    .insert({
      seller_id: scope.sellerId,
      payout_id: body.payout_id ?? null,
      order_id: body.order_id ?? null,
      amount,
      currency: String(body.currency ?? "BRL").toUpperCase(),
      reason,
      evidence,
      status: desiredStatus,
      created_by: user.id,
      submitted_at: desiredStatus === "pending_approval" ? now : null,
      requires_dual_approval: requiresDualApproval,
      risk_level: riskLevel,
      request_id: request.headers.get("x-request-id")
    })
    .select("*")
    .single();

  if (insert.error) {
    const missing = missingMigrationResponse(
      insert.error,
      "finance_adjustments",
      FINANCE_ADJUSTMENTS_MIGRATION
    );
    if (missing) return missing;
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    sellerId: scope.sellerId,
    role: scope.rbac.role,
    permissionUsed: "finance.approve_adjustment",
    action: "create_finance_adjustment",
    entityType: "finance_adjustment",
    entityId: insert.data.id,
    beforeState: null,
    afterState: insert.data,
    requestId: request.headers.get("x-request-id"),
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json(asAdjustmentResponse(insert.data), { status: 201 });
}
