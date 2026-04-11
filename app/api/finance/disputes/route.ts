import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { hasPermission, isRoleAllowed } from "@/lib/rbac/sellerPolicy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type DisputeBody = {
  order_id?: string;
  period_start?: string;
  period_end?: string;
  reason?: string;
  evidence?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope || !isRoleAllowed(scope.rbac, ["FINANCEIRO"])) {
    return NextResponse.json({ error: "Acesso restrito ao financeiro." }, { status: 403 });
  }
  if (!hasPermission(scope.rbac, "finance.open_dispute")) {
    return NextResponse.json({ error: "Permissao finance.open_dispute obrigatoria." }, { status: 403 });
  }

  const body = (await request.json()) as DisputeBody;
  const reason = String(body.reason ?? "").trim();
  if (!reason) {
    return NextResponse.json({ error: "reason e obrigatorio." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (body.order_id) {
    const orderScopeLookup = await admin
      .from("sub_orders")
      .select("id")
      .eq("order_id", body.order_id)
      .eq("seller_id", scope.sellerId)
      .limit(1)
      .maybeSingle();

    if (orderScopeLookup.error) {
      return NextResponse.json({ error: orderScopeLookup.error.message }, { status: 500 });
    }

    if (!orderScopeLookup.data) {
      return NextResponse.json({ error: "Pedido fora do escopo autenticado." }, { status: 404 });
    }
  }

  const ticketInsert = await admin.from("support_tickets").insert({
    id: randomUUID(),
    order_id: body.order_id ?? null,
    status: "open",
    priority: "high"
  }).select("*").single();

  if (ticketInsert.error) {
    return NextResponse.json({ error: ticketInsert.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    role: scope.rbac.role,
    permissionUsed: "finance.open_dispute",
    action: "open_finance_dispute",
    sellerId: scope.sellerId,
    entityType: "finance_dispute",
    entityId: ticketInsert.data.id,
    beforeState: null,
    afterState: {
      ticket_id: ticketInsert.data.id,
      order_id: body.order_id ?? null,
      period_start: body.period_start ?? null,
      period_end: body.period_end ?? null,
      reason,
      evidence: body.evidence ?? {}
    },
    requestId: request.headers.get("x-request-id"),
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json(
    {
      dispute_id: ticketInsert.data.id,
      status: "open"
    },
    { status: 201 }
  );
}
