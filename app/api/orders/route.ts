import { NextRequest, NextResponse } from "next/server";

import {
  maskAddress,
  hasPermission,
  isRoleAllowed,
  maskEmail,
  maskName,
  maskPhone
} from "@/lib/rbac/sellerPolicy";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type OrderRow = Record<string, unknown> & {
  address?: {
    email?: string;
    phone?: string;
    name?: string;
    recipient_name?: string;
  };
};

type SellerOrderRow = {
  order_id: string;
  status: string | null;
  payment_status: string | null;
  ship_by_at: string | null;
  delivered_by_at: string | null;
  shipped_at: string | null;
  created_at: string | null;
};

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope || !isRoleAllowed(scope.rbac, ["OPERACAO", "FINANCEIRO"])) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const filter = request.nextUrl.searchParams.get("filter") ?? "all";
  const status = request.nextUrl.searchParams.get("status");
  const operationalStatus = request.nextUrl.searchParams.get("operational_status");
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("page_size") ?? "25")));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = getSupabaseAdminClient();
  let query = admin
    .from("seller_orders")
    .select(
      "order_id,status,payment_status,ship_by_at,delivered_by_at,shipped_at,created_at",
      { count: "exact" }
    )
    .eq("seller_id", scope.sellerId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (operationalStatus) query = query.eq("status", operationalStatus);

  const nowIso = new Date().toISOString();
  if (filter === "sla_due") {
    query = query.not("ship_by_at", "is", null).lte("ship_by_at", nowIso);
  }

  const sellerOrdersResult = await query;
  if (sellerOrdersResult.error) {
    return NextResponse.json({ error: sellerOrdersResult.error.message }, { status: 500 });
  }

  const sellerOrders = (sellerOrdersResult.data ?? []) as SellerOrderRow[];
  const orderIds = sellerOrders.map((row) => row.order_id).filter(Boolean);
  const ordersResult =
    orderIds.length > 0
      ? await admin
          .from("orders")
          .select("*")
          .in("id", orderIds)
      : { data: [], error: null };

  if (ordersResult.error) {
    return NextResponse.json({ error: ordersResult.error.message }, { status: 500 });
  }

  const ordersById = new Map(
    ((ordersResult.data ?? []) as OrderRow[]).map((row) => [String(row.id ?? ""), row])
  );
  const canViewFullPii = hasPermission(scope.rbac, "pii.view_full");
  const items = sellerOrders
    .map((sellerOrder) => {
      const baseRow = ordersById.get(sellerOrder.order_id);
      if (!baseRow) return null;
      return {
        ...baseRow,
        seller_id: scope.sellerId,
        status: sellerOrder.status ?? baseRow.status ?? null,
        operational_status: sellerOrder.status ?? null,
        payment_status: sellerOrder.payment_status ?? baseRow.payment_status ?? null,
        sla_due_at: sellerOrder.ship_by_at ?? null,
        ship_by_at: sellerOrder.ship_by_at ?? null,
        delivered_by_at: sellerOrder.delivered_by_at ?? null,
        shipped_at: sellerOrder.shipped_at ?? null
      } as OrderRow;
    })
    .filter((row): row is OrderRow => Boolean(row))
    .map((row) => {
    const mutable = { ...(row as OrderRow) };
    if (mutable.address && typeof mutable.address === "object") {
      const address = { ...(mutable.address as Record<string, unknown>) };
      address.email = maskEmail(String(address.email ?? ""), canViewFullPii);
      address.phone = maskPhone(String(address.phone ?? ""), canViewFullPii);
      address.name = maskName(String(address.name ?? ""), canViewFullPii);
      address.recipient_name = maskName(String(address.recipient_name ?? ""), canViewFullPii);
      mutable.address = maskAddress(address, canViewFullPii) as OrderRow["address"];
    }
    return mutable;
  });

  return NextResponse.json({
    page,
    page_size: pageSize,
    total: sellerOrdersResult.count ?? items.length,
    items
  });
}
