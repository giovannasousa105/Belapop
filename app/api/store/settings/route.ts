import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { hasPermission } from "@/lib/rbac/sellerPolicy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { resolveStoreIdForSeller } from "@/lib/tracking/shipmentLookup";

type StoreSettingsBody = {
  store_id?: string;
  post_time_limit_hours?: number;
  cutoff_hour?: number;
  business_days_only?: boolean;
  timezone?: string;
};

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope || !hasPermission(scope.rbac, "settings.edit_store")) {
    return NextResponse.json({ error: "Acao restrita. Solicite ao Admin." }, { status: 403 });
  }

  const body = (await request.json()) as StoreSettingsBody;
  const admin = getSupabaseAdminClient();
  const resolvedStoreId = await resolveStoreIdForSeller(admin, scope.sellerId);
  const requestedStoreId = String(body.store_id ?? "").trim();
  if (requestedStoreId && requestedStoreId !== resolvedStoreId && requestedStoreId !== scope.sellerId) {
    return NextResponse.json({ error: "Store fora do escopo autenticado." }, { status: 403 });
  }
  const storeId = resolvedStoreId;

  const patch: Record<string, unknown> = {};
  if (Number.isFinite(body.post_time_limit_hours)) {
    patch.post_time_limit_hours = body.post_time_limit_hours;
  }
  if (Number.isFinite(body.cutoff_hour)) {
    patch.cutoff_hour = body.cutoff_hour;
  }
  if (typeof body.business_days_only === "boolean") {
    patch.business_days_only = body.business_days_only;
  }
  if (body.timezone) {
    patch.timezone = String(body.timezone);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteracao enviada." }, { status: 400 });
  }

  const before = await admin.from("store_settings").select("*").eq("store_id", storeId).maybeSingle();

  const result = await admin
    .from("store_settings")
    .upsert(
      {
        store_id: storeId,
        ...patch,
        updated_at: new Date().toISOString()
      },
      { onConflict: "store_id" }
    )
    .select("*")
    .single();

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    role: scope.rbac.role,
    permissionUsed: "settings.edit_store",
    action: "edit_store_settings",
    sellerId: scope.sellerId,
    beforeState: before.data ?? null,
    afterState: result.data,
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json(result.data);
}
