import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import {
  getNumericPermission,
  hasPermission
} from "@/lib/rbac/sellerPolicy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { resolveStoreIdForSeller } from "@/lib/tracking/shipmentLookup";

type CreateQueimaRequestBody = {
  discount_percent?: number;
  duration_days?: number;
  placement?: string[];
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ lot_id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  if (!hasPermission(scope.rbac, "promo.create")) {
    return NextResponse.json({ error: "Acao restrita. Solicite ao Admin." }, { status: 403 });
  }

  const body = (await request.json()) as CreateQueimaRequestBody;
  const discountPercent = Number(body.discount_percent ?? 20);
  const durationDays = Number(body.duration_days ?? 5);
  if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
    return NextResponse.json({ error: "discount_percent invalido." }, { status: 400 });
  }
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    return NextResponse.json({ error: "duration_days invalido." }, { status: 400 });
  }

  const maxDiscount = getNumericPermission(scope.rbac, "promo.max_discount_percent", 0);
  if (discountPercent > maxDiscount) {
    return NextResponse.json(
      {
        error: `Seu limite atual e ${maxDiscount}%. Peca aprovacao.`
      },
      { status: 403 }
    );
  }

  const { lot_id: lotId } = await context.params;
  const admin = getSupabaseAdminClient();
  const scopedStoreId = await resolveStoreIdForSeller(admin, scope.sellerId);

  const lotLookup = await admin.from("lots").select("*").eq("id", lotId).maybeSingle();
  if (lotLookup.error) {
    const message = String(lotLookup.error.message ?? "").toLowerCase();
    const missing = message.includes("relation") && message.includes("lots");
    if (!missing) {
      return NextResponse.json({ error: lotLookup.error.message }, { status: 500 });
    }
  }
  const lotSellerId = String((lotLookup.data as Record<string, unknown> | null)?.seller_id ?? "").trim();
  const lotStoreId = String((lotLookup.data as Record<string, unknown> | null)?.store_id ?? "").trim();
  if (
    lotLookup.data &&
    (lotSellerId || lotStoreId) &&
    lotSellerId !== scope.sellerId &&
    lotStoreId !== scopedStoreId &&
    lotStoreId !== scope.sellerId
  ) {
    return NextResponse.json({ error: "Lote fora do escopo autenticado." }, { status: 404 });
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const promoCode = `QUEIMA-${String(Date.now()).slice(-6)}`;
  const promoId = randomUUID();

  const insertPromo = await admin.from("promotions").insert({
    id: promoId,
    code: promoCode,
    percent_off: Math.round(discountPercent),
    is_active: true,
    starts_at: now.toISOString(),
    ends_at: endsAt.toISOString()
  });

  if (insertPromo.error) {
    return NextResponse.json({ error: insertPromo.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    role: scope.rbac.role,
    permissionUsed: "promo.create",
    action: "create_promo",
    sellerId: scope.sellerId,
    beforeState: lotLookup.data ?? null,
    afterState: {
      promo_id: promoId,
      code: promoCode,
      lot_id: lotId,
      placement: body.placement ?? ["search_boost", "vitrine"]
    },
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json(
    {
      promo_id: promoId,
      type: "queima_inteligente",
      discount_percent: Math.round(discountPercent),
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString()
    },
    { status: 201 }
  );
}
