import { NextRequest, NextResponse } from "next/server";

import {
  computeBenchmark,
  computeSellerScore,
  type SellerProductMetricRow,
  type SellerReviewMetricRow,
  type SellerSubOrderMetricRow,
  type SellerSupportTicketMetricRow
} from "@/lib/seller/enterpriseMetrics";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type PersistedScoreRow = {
  score: number | null;
  components: Record<string, unknown> | null;
  computed_at: string | null;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isMissingRelationError = (error: { code?: string | null; message?: string | null } | null) =>
  error?.code === "42P01" || String(error?.message ?? "").toLowerCase().includes("does not exist");

const parseWindowDays = (value: string | null) => {
  if (value === "7d") return 7;
  if (value === "90d") return 90;
  return 30;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ store_id: string }> }
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

  const { store_id: storeId } = await context.params;
  if (scope.sellerId !== storeId) {
    return NextResponse.json({ error: "Store fora do escopo autenticado." }, { status: 403 });
  }

  const windowDays = parseWindowDays(request.nextUrl.searchParams.get("window"));
  const fromIso = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const admin = getSupabaseAdminClient();

  const persistedLookup = await admin
    .from("store_logistics_scores")
    .select("score,components,computed_at")
    .eq("store_id", storeId)
    .maybeSingle();

  const subOrdersLookup = await admin
    .from("sub_orders")
    .select(
      "id,order_id,status,payment_status,created_at,product_total_cents,shipping_total_cents,platform_fee_cents,seller_net_cents"
    )
    .eq("seller_id", storeId)
    .gte("created_at", fromIso)
    .limit(5000);

  if (subOrdersLookup.error) {
    return NextResponse.json({ error: subOrdersLookup.error.message }, { status: 500 });
  }

  const subOrders = (subOrdersLookup.data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    order_id: row.order_id ? String(row.order_id) : null,
    status: row.status ? String(row.status) : null,
    payment_status: row.payment_status ? String(row.payment_status) : null,
    created_at: row.created_at ? String(row.created_at) : null,
    product_total_cents: toNumber(
      row.product_total_cents ?? row.product_total ?? row.total_products_cents
    ),
    shipping_total_cents: toNumber(
      row.shipping_total_cents ?? row.shipping_total ?? row.total_shipping_cents
    ),
    platform_fee_cents: toNumber(row.platform_fee_cents ?? row.platform_fee),
    seller_net_cents: toNumber(row.seller_net_cents ?? row.seller_net_amount)
  })) satisfies SellerSubOrderMetricRow[];

  const productsLookup = await admin
    .from("products")
    .select("id,status,stock_quantity")
    .eq("seller_id", storeId)
    .limit(5000);

  if (productsLookup.error) {
    return NextResponse.json({ error: productsLookup.error.message }, { status: 500 });
  }

  const products = (productsLookup.data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    status: row.status ? String(row.status) : null,
    stock_quantity: toNumber(row.stock_quantity)
  })) satisfies SellerProductMetricRow[];

  const productIds = products.map((product) => product.id).filter(Boolean);
  const reviewsLookup =
    productIds.length > 0
      ? await admin.from("reviews").select("rating").in("product_id", productIds)
      : { data: [], error: null };

  if (reviewsLookup.error) {
    return NextResponse.json({ error: reviewsLookup.error.message }, { status: 500 });
  }

  const reviews = (reviewsLookup.data ?? []).map((row: Record<string, unknown>) => ({
    rating: toNumber(row.rating)
  })) satisfies SellerReviewMetricRow[];

  const orderIds = Array.from(
    new Set(subOrders.map((subOrder) => subOrder.order_id).filter((value): value is string => Boolean(value)))
  );
  const ticketsLookup =
    orderIds.length > 0
      ? await admin
          .from("support_tickets")
          .select("id,status,created_at,sla_deadline,order_id")
          .in("order_id", orderIds.slice(0, 1000))
          .limit(2000)
      : { data: [], error: null };

  if (ticketsLookup.error && !isMissingRelationError(ticketsLookup.error)) {
    return NextResponse.json({ error: ticketsLookup.error.message }, { status: 500 });
  }

  const supportTickets = ((ticketsLookup.data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id ?? ""),
    status: row.status ? String(row.status) : null,
    created_at: row.created_at ? String(row.created_at) : null,
    sla_deadline: row.sla_deadline ? String(row.sla_deadline) : null
  })) satisfies SellerSupportTicketMetricRow[];

  const computed = computeSellerScore({
    subOrders,
    products,
    supportTickets,
    reviews
  });

  const peersLookup = await admin
    .from("store_logistics_scores")
    .select("score")
    .neq("store_id", storeId)
    .limit(500);

  const peerScores =
    peersLookup.error || !peersLookup.data
      ? []
      : peersLookup.data.map((row: { score: number | null }) => Number(row.score ?? 0));
  const benchmark = computeBenchmark(computed.score, peerScores);

  const persisted = (!persistedLookup.error && persistedLookup.data
    ? (persistedLookup.data as PersistedScoreRow)
    : null);

  // Persist latest score when score table exists; keep request resilient when table is absent.
  if (!isMissingRelationError(persistedLookup.error)) {
    await admin
      .from("store_logistics_scores")
      .upsert({
        store_id: storeId,
        score: computed.score,
        components: computed.components,
        computed_at: new Date().toISOString()
      })
      .select("store_id")
      .maybeSingle();
  }

  const hasComputedData =
    computed.metrics.orders_total > 0 ||
    computed.metrics.skus_published > 0 ||
    computed.metrics.support_tickets > 0 ||
    computed.metrics.rating_count > 0;

  const score = hasComputedData ? computed.score : toNumber(persisted?.score);
  const components = hasComputedData
    ? computed.components
    : {
        sla: toNumber((persisted?.components ?? {}).sla),
        cancel: toNumber((persisted?.components ?? {}).cancel),
        returns: toNumber((persisted?.components ?? {}).returns),
        rating: toNumber((persisted?.components ?? {}).rating),
        stockout: toNumber((persisted?.components ?? {}).stockout),
        response: toNumber((persisted?.components ?? {}).response)
      };

  return NextResponse.json({
    store_id: storeId,
    window: `${windowDays}d`,
    score,
    grade: hasComputedData ? computed.grade : "C",
    components,
    metrics: computed.metrics,
    formula: {
      weights: computed.weights,
      summary:
        "score = SLA*0.28 + Cancel*0.20 + Devolucao*0.16 + Avaliacao*0.14 + Ruptura*0.12 + Resposta*0.10"
    },
    benchmark,
    impacts: computed.impacts,
    recommendations: computed.recommendations,
    computed_at: hasComputedData
      ? new Date().toISOString()
      : persisted?.computed_at ?? new Date().toISOString(),
    source: hasComputedData ? "computed_live" : persisted ? "persisted_fallback" : "empty"
  });
}
