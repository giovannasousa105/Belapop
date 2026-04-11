import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ensurePartnerApiContext } from "@/lib/partner/auth";
import { listPartnerSellerOrders, parseRangeToDateFrom } from "@/lib/partner/sellerOrders";
import { isMissingTableError } from "@/lib/rbac/sellerAccessScope";

type RangePreset = "today" | "7d" | "30d" | "90d";

type SnapshotRow = {
  seller_order_id: string;
  seller_id: string;
  order_id: string;
  items_total_cents: number;
  shipping_cents: number;
  discount_allocated_cents: number;
  fee_cents: number;
  seller_payout_cents: number;
  created_at: string;
  updated_at: string | null;
};

type PayoutBatchRow = {
  id: string;
  status: string | null;
  period_start: string | null;
  period_end: string | null;
  scheduled_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type PayoutItemRow = {
  seller_payout_id: string;
  seller_order_id: string;
  payout_amount_cents: number;
  created_at: string;
};

const parseRange = (value: string | null): RangePreset => {
  if (value === "today" || value === "7d" || value === "30d" || value === "90d") {
    return value;
  }
  return "30d";
};

const parsePage = (value: string | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
};

const parsePageSize = (value: string | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(200, Math.max(1, Math.floor(parsed)));
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapSnapshotRow = (row: Record<string, unknown>): SnapshotRow => ({
  seller_order_id: String(row.seller_order_id ?? row.id ?? ""),
  seller_id: String(row.seller_id ?? ""),
  order_id: String(row.order_id ?? ""),
  items_total_cents: toNumber(row.items_total_cents),
  shipping_cents: toNumber(row.shipping_cents),
  discount_allocated_cents: toNumber(row.discount_allocated_cents),
  fee_cents: toNumber(row.fee_cents),
  seller_payout_cents: toNumber(row.seller_payout_cents),
  created_at: String(row.created_at ?? new Date().toISOString()),
  updated_at: row.updated_at ? String(row.updated_at) : null
});

const mapPayoutBatchRow = (row: Record<string, unknown>): PayoutBatchRow => ({
  id: String(row.id ?? ""),
  status: row.status ? String(row.status) : null,
  period_start: row.period_start ? String(row.period_start) : null,
  period_end: row.period_end ? String(row.period_end) : null,
  scheduled_at: row.scheduled_at ? String(row.scheduled_at) : null,
  paid_at: row.paid_at ? String(row.paid_at) : null,
  created_at: String(row.created_at ?? new Date().toISOString()),
  updated_at: row.updated_at ? String(row.updated_at) : null
});

const mapPayoutItemRow = (row: Record<string, unknown>): PayoutItemRow => ({
  seller_payout_id: String(row.seller_payout_id ?? ""),
  seller_order_id: String(row.seller_order_id ?? ""),
  payout_amount_cents: toNumber(row.payout_amount_cents),
  created_at: String(row.created_at ?? new Date().toISOString())
});

const listRowsFromPayoutBatches = async (args: {
  admin: SupabaseClient;
  sellerId: string;
  dateFrom: string;
  dateTo: string | null;
}) => {
  let payoutsQuery = args.admin
    .from("seller_payouts")
    .select("id,status,period_start,period_end,scheduled_at,paid_at,created_at,updated_at")
    .eq("seller_id", args.sellerId)
    .gte("created_at", args.dateFrom)
    .order("created_at", { ascending: false });

  if (args.dateTo) payoutsQuery = payoutsQuery.lte("created_at", args.dateTo);

  const payoutsResult = await payoutsQuery;
  if (payoutsResult.error) {
    if (isMissingTableError(payoutsResult.error)) return null;
    throw new Error(payoutsResult.error.message ?? "Falha ao consultar lotes de repasse.");
  }

  const payoutBatches = (payoutsResult.data ?? []).map((row) =>
    mapPayoutBatchRow(row as Record<string, unknown>)
  );

  if (payoutBatches.length === 0) {
    return { source: "seller_payouts" as const, rows: [] as SnapshotRow[] };
  }

  const payoutIds = payoutBatches.map((row) => row.id).filter(Boolean);
  const payoutById = new Map(payoutBatches.map((row) => [row.id, row]));

  const payoutItemsResult = await args.admin
    .from("seller_payout_items")
    .select("seller_payout_id,seller_order_id,payout_amount_cents,created_at")
    .in("seller_payout_id", payoutIds)
    .order("created_at", { ascending: false });

  if (payoutItemsResult.error) {
    if (isMissingTableError(payoutItemsResult.error)) return null;
    throw new Error(payoutItemsResult.error.message ?? "Falha ao consultar itens de repasse.");
  }

  const payoutItems = (payoutItemsResult.data ?? []).map((row) =>
    mapPayoutItemRow(row as Record<string, unknown>)
  );

  if (payoutItems.length === 0) {
    return { source: "seller_payouts" as const, rows: [] as SnapshotRow[] };
  }

  const sellerOrderIds = Array.from(
    new Set(payoutItems.map((row) => row.seller_order_id).filter(Boolean))
  );

  const detailBySellerOrderId = new Map<string, SnapshotRow>();

  const snapshotDetailsResult = await args.admin
    .from("seller_order_financial_snapshot")
    .select(
      "seller_order_id,seller_id,order_id,items_total_cents,shipping_cents,discount_allocated_cents,fee_cents,seller_payout_cents,created_at,updated_at"
    )
    .in("seller_order_id", sellerOrderIds);

  if (snapshotDetailsResult.error && !isMissingTableError(snapshotDetailsResult.error)) {
    throw new Error(snapshotDetailsResult.error.message ?? "Falha ao consultar snapshot financeiro.");
  }

  if (!snapshotDetailsResult.error) {
    (snapshotDetailsResult.data ?? []).forEach((row) => {
      const mapped = mapSnapshotRow(row as Record<string, unknown>);
      detailBySellerOrderId.set(mapped.seller_order_id, mapped);
    });
  }

  const missingDetailIds = sellerOrderIds.filter((id) => !detailBySellerOrderId.has(id));
  if (missingDetailIds.length > 0) {
    const sellerOrdersResult = await args.admin
      .from("seller_orders")
      .select(
        "id,seller_id,order_id,items_total_cents,shipping_cents,discount_allocated_cents,fee_cents,seller_payout_cents,created_at,updated_at"
      )
      .in("id", missingDetailIds);

    if (sellerOrdersResult.error && !isMissingTableError(sellerOrdersResult.error)) {
      throw new Error(sellerOrdersResult.error.message ?? "Falha ao consultar seller_orders.");
    }

    if (!sellerOrdersResult.error) {
      (sellerOrdersResult.data ?? []).forEach((row) => {
        const mapped = mapSnapshotRow({
          ...((row ?? {}) as Record<string, unknown>),
          seller_order_id: (row as Record<string, unknown>).id
        });
        detailBySellerOrderId.set(mapped.seller_order_id, mapped);
      });
    }
  }

  const rows: SnapshotRow[] = payoutItems
    .map((item) => {
      const detail = detailBySellerOrderId.get(item.seller_order_id);
      const payout = payoutById.get(item.seller_payout_id);
      const sellerPayoutCentsFromItem = toNumber(item.payout_amount_cents);

      return {
        seller_order_id: item.seller_order_id,
        seller_id: detail?.seller_id ?? args.sellerId,
        order_id: detail?.order_id ?? "",
        items_total_cents: detail?.items_total_cents ?? 0,
        shipping_cents: detail?.shipping_cents ?? 0,
        discount_allocated_cents: detail?.discount_allocated_cents ?? 0,
        fee_cents: detail?.fee_cents ?? 0,
        seller_payout_cents:
          detail && detail.seller_payout_cents > 0
            ? detail.seller_payout_cents
            : sellerPayoutCentsFromItem,
        created_at: detail?.created_at ?? item.created_at ?? payout?.created_at ?? new Date().toISOString(),
        updated_at:
          detail?.updated_at ??
          payout?.paid_at ??
          payout?.updated_at ??
          payout?.scheduled_at ??
          payout?.created_at ??
          null
      };
    })
    .filter((row) => row.seller_id === args.sellerId)
    .sort((left, right) => {
      const leftTs = new Date(left.updated_at ?? left.created_at).getTime();
      const rightTs = new Date(right.updated_at ?? right.created_at).getTime();
      return rightTs - leftTs;
    });

  return { source: "seller_payouts" as const, rows };
};

export async function GET(request: NextRequest) {
  const auth = await ensurePartnerApiContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = request.nextUrl.searchParams;
  const range = parseRange(params.get("range"));
  const dateFrom = params.get("date_from") ?? parseRangeToDateFrom(range);
  const dateTo = params.get("date_to");
  const page = parsePage(params.get("page"));
  const pageSize = parsePageSize(params.get("page_size"));

  try {
    let source:
      | "seller_payouts"
      | "seller_order_financial_snapshot"
      | "seller_orders"
      | "sub_orders" =
      "seller_order_financial_snapshot";

    let rows: SnapshotRow[] = [];

    const payoutBatchResult = await listRowsFromPayoutBatches({
      admin: auth.ctx.admin,
      sellerId: auth.ctx.scope.sellerId,
      dateFrom,
      dateTo
    });

    if (payoutBatchResult) {
      source = payoutBatchResult.source;
      rows = payoutBatchResult.rows;
    } else {
      let snapshotQuery = auth.ctx.admin
        .from("seller_order_financial_snapshot")
        .select(
          "seller_order_id,seller_id,order_id,items_total_cents,shipping_cents,discount_allocated_cents,fee_cents,seller_payout_cents,created_at,updated_at"
        )
        .eq("seller_id", auth.ctx.scope.sellerId)
        .gte("created_at", dateFrom)
        .order("created_at", { ascending: false });

      if (dateTo) snapshotQuery = snapshotQuery.lte("created_at", dateTo);

      const snapshot = await snapshotQuery;

      if (!snapshot.error) {
        rows = (snapshot.data ?? []).map((row) => mapSnapshotRow(row as Record<string, unknown>));
      } else if (!isMissingTableError(snapshot.error)) {
        throw new Error(snapshot.error.message ?? "Falha ao consultar repasses.");
      } else {
        const fallback = await listPartnerSellerOrders(auth.ctx.admin, {
          sellerId: auth.ctx.scope.sellerId,
          status: null,
          dateFrom,
          dateTo,
          page: 1,
          pageSize: 5000
        });

        source = fallback.source;
        rows = fallback.items.map((row) => ({
          seller_order_id: row.id,
          seller_id: row.seller_id,
          order_id: row.order_id,
          items_total_cents: row.items_total_cents,
          shipping_cents: row.shipping_cents,
          discount_allocated_cents: row.discount_allocated_cents,
          fee_cents: row.fee_cents,
          seller_payout_cents: row.seller_payout_cents,
          created_at: row.created_at,
          updated_at: null
        }));
      }
    }

    const total = rows.length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const pagedItems = rows.slice(from, to);

    const summary = rows.reduce(
      (acc, row) => {
        acc.orders += 1;
        acc.items_total_cents += row.items_total_cents;
        acc.shipping_cents += row.shipping_cents;
        acc.discount_allocated_cents += row.discount_allocated_cents;
        acc.fee_cents += row.fee_cents;
        acc.seller_payout_cents += row.seller_payout_cents;
        acc.gmv_cents += Math.max(
          0,
          row.items_total_cents + row.shipping_cents - row.discount_allocated_cents
        );
        return acc;
      },
      {
        orders: 0,
        gmv_cents: 0,
        items_total_cents: 0,
        shipping_cents: 0,
        discount_allocated_cents: 0,
        fee_cents: 0,
        seller_payout_cents: 0
      }
    );

    return NextResponse.json({
      seller_id: auth.ctx.scope.sellerId,
      range,
      filters: {
        date_from: dateFrom,
        date_to: dateTo
      },
      source,
      page,
      page_size: pageSize,
      total,
      summary,
      items: pagedItems
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar repasses.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
