import { NextRequest, NextResponse } from "next/server";

import { ensurePartnerApiContext } from "@/lib/partner/auth";
import { listPartnerSellerOrders, parseRangeToDateFrom } from "@/lib/partner/sellerOrders";
import { isMissingTableError } from "@/lib/rbac/sellerAccessScope";

type RangePreset = "today" | "7d" | "30d" | "90d";

const DEFAULT_RANGE: RangePreset = "30d";
const SLA_TARGET_HOURS = 48;
const SLA_TARGET_MS = SLA_TARGET_HOURS * 60 * 60 * 1000;

const parseRange = (value: string | null): RangePreset => {
  if (value === "today" || value === "7d" || value === "30d" || value === "90d") {
    return value;
  }
  return DEFAULT_RANGE;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatus = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isShippedLike = (status: string) =>
  status.includes("shipped") ||
  status.includes("in_transit") ||
  status.includes("out_for_delivery") ||
  status.includes("delivered");

const isCanceledLike = (status: string) => status.includes("cancel");

type SellerScoreRow = {
  final_score: number | null;
  base_score: number | null;
  penalty_score: number | null;
  exposure_tier: string | null;
  eligible_featured: boolean | null;
  sla_score: number | null;
  cancel_score: number | null;
  return_score: number | null;
  rating_score: number | null;
  stock_health_score: number | null;
  compliance_score: number | null;
  shipped_on_time_rate: number | null;
  cancel_rate: number | null;
  return_rate: number | null;
  avg_rating: number | null;
  low_stock_rate: number | null;
  computed_at: string | null;
};

type ProductScoreRow = {
  product_id: string;
  final_score: number | null;
  eligible_featured: boolean | null;
  eligible_search: boolean | null;
  conversion_rate: number | null;
  ctr: number | null;
  avg_rating: number | null;
  return_rate: number | null;
  in_stock: boolean | null;
  computed_at: string | null;
};

type ProductInfoRow = {
  id: string;
  name: string | null;
  slug: string | null;
  price_cents: number | null;
  stock_quantity: number | null;
  status: string | null;
};

export async function GET(request: NextRequest) {
  const auth = await ensurePartnerApiContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const range = parseRange(request.nextUrl.searchParams.get("range"));
  const dateFrom = request.nextUrl.searchParams.get("date_from") ?? parseRangeToDateFrom(range);
  const dateTo = request.nextUrl.searchParams.get("date_to");

  try {
    const ordersResult = await listPartnerSellerOrders(auth.ctx.admin, {
      sellerId: auth.ctx.scope.sellerId,
      status: null,
      dateFrom,
      dateTo,
      page: 1,
      pageSize: 5000
    });

    const rows = ordersResult.items;
    const now = Date.now();

    let gmvCents = 0;
    let sellerPayoutCents = 0;
    let feeCents = 0;
    let shippingCents = 0;
    let discountCents = 0;

    let eligibleForSla = 0;
    let onTime = 0;

    rows.forEach((row) => {
      const itemsTotal = toNumber(row.items_total_cents);
      const shipping = toNumber(row.shipping_cents);
      const discount = toNumber(row.discount_allocated_cents);
      const fee = toNumber(row.fee_cents);
      const payout = toNumber(row.seller_payout_cents);

      gmvCents += Math.max(0, itemsTotal + shipping - discount);
      sellerPayoutCents += Math.max(0, payout);
      feeCents += Math.max(0, fee);
      shippingCents += Math.max(0, shipping);
      discountCents += Math.max(0, discount);

      const status = normalizeStatus(row.status);
      if (isCanceledLike(status)) return;

      const createdAtMs = new Date(row.created_at).getTime();
      if (!Number.isFinite(createdAtMs)) return;

      eligibleForSla += 1;

      if (isShippedLike(status)) {
        const shippedAtMs = row.shipped_at ? new Date(row.shipped_at).getTime() : NaN;
        if (Number.isFinite(shippedAtMs)) {
          if (shippedAtMs - createdAtMs <= SLA_TARGET_MS) onTime += 1;
          return;
        }
      }

      if (now - createdAtMs <= SLA_TARGET_MS) onTime += 1;
    });

    const productsPublished = await auth.ctx.admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", auth.ctx.scope.sellerId)
      .eq("status", "published");

    let itemsActive = 0;
    if (!productsPublished.error) {
      itemsActive = Number(productsPublished.count ?? 0);
    } else if (productsPublished.error.code === "42703") {
      const productsAnyStatus = await auth.ctx.admin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", auth.ctx.scope.sellerId);

      if (productsAnyStatus.error && !isMissingTableError(productsAnyStatus.error)) {
        throw new Error(productsAnyStatus.error.message ?? "Falha ao consultar produtos.");
      }
      itemsActive = Number(productsAnyStatus.count ?? 0);
    } else if (!isMissingTableError(productsPublished.error)) {
      throw new Error(productsPublished.error.message ?? "Falha ao consultar produtos.");
    }

    const slaPercent = eligibleForSla > 0 ? Number(((onTime / eligibleForSla) * 100).toFixed(2)) : 100;

    let score: Record<string, unknown> | null = null;
    const sellerScoreLookup = await auth.ctx.admin
      .from("seller_scores")
      .select(
        [
          "final_score",
          "base_score",
          "penalty_score",
          "exposure_tier",
          "eligible_featured",
          "sla_score",
          "cancel_score",
          "return_score",
          "rating_score",
          "stock_health_score",
          "compliance_score",
          "shipped_on_time_rate",
          "cancel_rate",
          "return_rate",
          "avg_rating",
          "low_stock_rate",
          "computed_at"
        ].join(",")
      )
      .eq("seller_id", auth.ctx.scope.sellerId)
      .maybeSingle<SellerScoreRow>();

    if (sellerScoreLookup.error && !isMissingTableError(sellerScoreLookup.error)) {
      throw new Error(sellerScoreLookup.error.message ?? "Falha ao consultar score do seller.");
    }

    if (sellerScoreLookup.data) {
      const row = sellerScoreLookup.data;
      score = {
        final_score: toNumber(row.final_score),
        base_score: toNumber(row.base_score),
        penalty_score: toNumber(row.penalty_score),
        exposure_tier: row.exposure_tier ?? "standard",
        eligible_featured: Boolean(row.eligible_featured),
        components: {
          sla_score: toNumber(row.sla_score),
          cancel_score: toNumber(row.cancel_score),
          return_score: toNumber(row.return_score),
          rating_score: toNumber(row.rating_score),
          stock_health_score: toNumber(row.stock_health_score),
          compliance_score: toNumber(row.compliance_score)
        },
        metrics: {
          shipped_on_time_rate: toNumber(row.shipped_on_time_rate),
          cancel_rate: toNumber(row.cancel_rate),
          return_rate: toNumber(row.return_rate),
          avg_rating: toNumber(row.avg_rating),
          low_stock_rate: toNumber(row.low_stock_rate)
        },
        computed_at: row.computed_at
      };
    }

    let topProducts: Array<Record<string, unknown>> = [];
    const productScoresLookup = await auth.ctx.admin
      .from("product_scores")
      .select(
        [
          "product_id",
          "final_score",
          "eligible_featured",
          "eligible_search",
          "conversion_rate",
          "ctr",
          "avg_rating",
          "return_rate",
          "in_stock",
          "computed_at"
        ].join(",")
      )
      .eq("seller_id", auth.ctx.scope.sellerId)
      .order("final_score", { ascending: false })
      .limit(5);

    if (productScoresLookup.error && !isMissingTableError(productScoresLookup.error)) {
      throw new Error(productScoresLookup.error.message ?? "Falha ao consultar score de produtos.");
    }

    const productScoreRows = Array.isArray(productScoresLookup.data)
      ? (productScoresLookup.data as unknown as ProductScoreRow[])
      : [];
    if (productScoreRows.length > 0) {
      const productIds = Array.from(new Set(productScoreRows.map((row) => row.product_id)));
      const productsLookup = await auth.ctx.admin
        .from("products")
        .select("id,name,slug,price_cents,stock_quantity,status")
        .in("id", productIds);

      if (productsLookup.error && !isMissingTableError(productsLookup.error)) {
        throw new Error(productsLookup.error.message ?? "Falha ao consultar detalhes de produtos.");
      }

      const productsMap = new Map<string, ProductInfoRow>();
      ((productsLookup.data ?? []) as ProductInfoRow[]).forEach((row) => {
        productsMap.set(row.id, row);
      });

      topProducts = productScoreRows.map((row) => {
        const product = productsMap.get(row.product_id);
        return {
          product_id: row.product_id,
          name: product?.name ?? "Produto",
          slug: product?.slug ?? null,
          status: product?.status ?? null,
          price_cents: toNumber(product?.price_cents),
          stock_quantity: toNumber(product?.stock_quantity),
          final_score: toNumber(row.final_score),
          eligible_featured: Boolean(row.eligible_featured),
          eligible_search: Boolean(row.eligible_search),
          conversion_rate: toNumber(row.conversion_rate),
          ctr: toNumber(row.ctr),
          avg_rating: toNumber(row.avg_rating),
          return_rate: toNumber(row.return_rate),
          in_stock: Boolean(row.in_stock),
          computed_at: row.computed_at
        };
      });
    }

    return NextResponse.json({
      seller_id: auth.ctx.scope.sellerId,
      range,
      date_from: dateFrom,
      date_to: dateTo,
      source: ordersResult.source,
      generated_at: new Date().toISOString(),
      kpis: {
        gmv_cents: gmvCents,
        orders: rows.length,
        items_active: itemsActive,
        sla_percent: slaPercent,
        seller_payout_cents: sellerPayoutCents,
        fee_cents: feeCents,
        shipping_cents: shippingCents,
        discount_allocated_cents: discountCents
      },
      scoring: {
        seller: score,
        top_products: topProducts
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
