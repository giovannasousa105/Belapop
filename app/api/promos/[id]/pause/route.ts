import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { hasPermission } from "@/lib/rbac/sellerPolicy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { resolveStoreIdForSeller } from "@/lib/tracking/shipmentLookup";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope || !hasPermission(scope.rbac, "promo.pause")) {
    return NextResponse.json({ error: "Acao restrita. Solicite ao Admin." }, { status: 403 });
  }

  const { id } = await context.params;
  const admin = getSupabaseAdminClient();
  const scopedStoreId = await resolveStoreIdForSeller(admin, scope.sellerId);
  const before = await admin.from("promotions").select("*").eq("id", id).maybeSingle();
  if (before.error) {
    return NextResponse.json({ error: before.error.message }, { status: 500 });
  }
  if (!before.data) {
    return NextResponse.json({ error: "Promocao nao encontrada." }, { status: 404 });
  }
  const promoSellerId = String((before.data as Record<string, unknown>).seller_id ?? "").trim();
  const promoStoreId = String((before.data as Record<string, unknown>).store_id ?? "").trim();
  if (
    (promoSellerId || promoStoreId) &&
    promoSellerId !== scope.sellerId &&
    promoStoreId !== scopedStoreId &&
    promoStoreId !== scope.sellerId
  ) {
    return NextResponse.json({ error: "Promocao fora do escopo autenticado." }, { status: 404 });
  }

  const updated = await admin
    .from("promotions")
    .update({ is_active: false, ends_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (updated.error) {
    return NextResponse.json({ error: updated.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    role: scope.rbac.role,
    permissionUsed: "promo.pause",
    action: "pause_promo",
    sellerId: scope.sellerId,
    beforeState: before.data,
    afterState: updated.data,
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json(updated.data);
}
