import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  FINANCE_ADJUSTMENTS_MIGRATION,
  FINANCE_LEDGER_MIGRATION,
  asAdjustmentResponse,
  isAdjustmentStatus,
  missingMigrationResponse,
  requireFinanceScope
} from "../../_shared";

const isMissingFunctionError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42883" || error.code === "PGRST202") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("function") && message.includes("does not exist");
};

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

  if (!isAdjustmentStatus(lookup.data.status) || lookup.data.status !== "approved") {
    return NextResponse.json(
      { error: "Apenas ajustes aprovados podem ser aplicados." },
      { status: 400 }
    );
  }

  const applyResult = await admin.rpc("post_finance_adjustment_ledger", {
    p_adjustment_id: id,
    p_actor_user_id: user.id,
    p_request_id: request.headers.get("x-request-id")
  });

  if (applyResult.error) {
    if (isMissingFunctionError(applyResult.error)) {
      return NextResponse.json(
        {
          error:
            "Funcao post_finance_adjustment_ledger nao encontrada. Rode a migration " +
            FINANCE_LEDGER_MIGRATION +
            "."
        },
        { status: 400 }
      );
    }

    const missingLedger = missingMigrationResponse(
      applyResult.error,
      "ledger_journals/ledger_entries",
      FINANCE_LEDGER_MIGRATION
    );
    if (missingLedger) return missingLedger;

    return NextResponse.json({ error: applyResult.error.message }, { status: 500 });
  }

  const journalId = String(applyResult.data ?? "").trim();
  if (!journalId) {
    return NextResponse.json({ error: "Nao foi possivel identificar o journal aplicado." }, { status: 500 });
  }

  const [updatedAdjustment, entriesLookup] = await Promise.all([
    admin.from("finance_adjustments").select("*").eq("id", id).single(),
    admin
      .from("ledger_entries")
      .select("id,store_id,payout_id,order_id,account_code,direction,amount,currency,occurred_at")
      .eq("journal_id", journalId)
      .order("occurred_at", { ascending: true })
  ]);

  if (updatedAdjustment.error) {
    return NextResponse.json({ error: updatedAdjustment.error.message }, { status: 500 });
  }

  if (entriesLookup.error) {
    const missing = missingMigrationResponse(
      entriesLookup.error,
      "ledger_entries",
      FINANCE_LEDGER_MIGRATION
    );
    if (missing) return missing;
    return NextResponse.json({ error: entriesLookup.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    sellerId: scope.sellerId,
    role: scope.rbac.role,
    permissionUsed: "finance.approve_adjustment",
    action: "apply_finance_adjustment",
    entityType: "finance_adjustment",
    entityId: id,
    beforeState: lookup.data,
    afterState: updatedAdjustment.data,
    requestId: request.headers.get("x-request-id"),
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json({
    adjustment: asAdjustmentResponse(updatedAdjustment.data),
    ledger_posting: {
      journal_id: journalId,
      entries: (entriesLookup.data ?? []).map((entry) => ({
        entry_id: entry.id,
        store_id: entry.store_id,
        payout_id: entry.payout_id,
        order_id: entry.order_id,
        account: entry.account_code,
        direction: entry.direction,
        amount: entry.amount,
        currency: entry.currency,
        occurred_at: entry.occurred_at,
        reference_type: "finance_adjustment",
        reference_id: id
      }))
    }
  });
}
