import { NextRequest, NextResponse } from "next/server";

import { ensurePartnerApiContext } from "@/lib/partner/auth";
import { listPartnerSellerOrders, parseRangeToDateFrom } from "@/lib/partner/sellerOrders";

type RangePreset = "today" | "7d" | "30d" | "90d";

type LogisticsItem = {
  seller_order_id: string;
  order_id: string;
  status: string;
  tracking_code: string | null;
  shipping_method: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  sla_hours_elapsed: number;
  sla_state: "ok" | "risk" | "delayed";
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

const normalizeStatus = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isAwaitingShipment = (statusRaw: string) => {
  const status = normalizeStatus(statusRaw);
  return (
    status.includes("pending") ||
    status.includes("created") ||
    status.includes("process") ||
    status.includes("ready_to_ship") ||
    status.includes("awaiting_shipment")
  );
};

const isInTransit = (statusRaw: string) => {
  const status = normalizeStatus(statusRaw);
  return status.includes("shipped") || status.includes("in_transit") || status.includes("out_for_delivery");
};

const isDelivered = (statusRaw: string) => normalizeStatus(statusRaw).includes("delivered");
const isCanceled = (statusRaw: string) => normalizeStatus(statusRaw).includes("cancel");

const toText = (value: unknown) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
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
  const statusFilter = params.get("status");
  const page = parsePage(params.get("page"));
  const pageSize = parsePageSize(params.get("page_size"));

  try {
    const result = await listPartnerSellerOrders(auth.ctx.admin, {
      sellerId: auth.ctx.scope.sellerId,
      status: statusFilter && statusFilter !== "all" ? statusFilter : null,
      dateFrom,
      dateTo,
      page: 1,
      pageSize: 5000
    });

    const now = Date.now();
    const rows: LogisticsItem[] = result.items.map((row) => {
      const createdAtMs = new Date(row.created_at).getTime();
      const elapsedHours = Number.isFinite(createdAtMs) ? Math.max(0, (now - createdAtMs) / (1000 * 60 * 60)) : 0;
      let slaState: LogisticsItem["sla_state"] = "ok";
      if (!isDelivered(row.status) && !isCanceled(row.status)) {
        if (elapsedHours > 48) slaState = "delayed";
        else if (elapsedHours > 42) slaState = "risk";
      }
      return {
        seller_order_id: row.id,
        order_id: row.order_id,
        status: row.status,
        tracking_code: toText(row.tracking_code),
        shipping_method: toText(row.shipping_method),
        shipped_at: toText(row.shipped_at),
        delivered_at: toText(row.delivered_at),
        created_at: row.created_at,
        sla_hours_elapsed: Number(elapsedHours.toFixed(2)),
        sla_state: slaState
      };
    });

    const summary = rows.reduce(
      (acc, row) => {
        acc.total += 1;
        if (isAwaitingShipment(row.status)) acc.awaiting_shipment += 1;
        if (isInTransit(row.status)) acc.in_transit += 1;
        if (isDelivered(row.status)) acc.delivered += 1;
        if (isCanceled(row.status)) acc.canceled += 1;
        if (row.sla_state === "risk") acc.sla_risk += 1;
        if (row.sla_state === "delayed") acc.delayed += 1;
        return acc;
      },
      {
        total: 0,
        awaiting_shipment: 0,
        in_transit: 0,
        delivered: 0,
        canceled: 0,
        sla_risk: 0,
        delayed: 0
      }
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize;

    return NextResponse.json({
      seller_id: auth.ctx.scope.sellerId,
      range,
      filters: {
        date_from: dateFrom,
        date_to: dateTo,
        status: statusFilter
      },
      source: result.source,
      page,
      page_size: pageSize,
      total: rows.length,
      summary,
      items: rows.slice(from, to)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar logistica.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
