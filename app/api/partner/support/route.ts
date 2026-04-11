import { NextRequest, NextResponse } from "next/server";

import { ensurePartnerApiContext } from "@/lib/partner/auth";
import { listPartnerSellerOrders, parseRangeToDateFrom } from "@/lib/partner/sellerOrders";
import { isMissingTableError } from "@/lib/rbac/sellerAccessScope";

type RangePreset = "today" | "7d" | "30d" | "90d";

type TicketRow = {
  id: string;
  order_id: string | null;
  status: string;
  priority: string;
  sla_deadline: string | null;
  created_at: string | null;
  assigned_to: string | null;
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

const toText = (value: unknown) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
};

const mapTicket = (row: Record<string, unknown>): TicketRow => ({
  id: String(row.id ?? ""),
  order_id: toText(row.order_id),
  status: String(row.status ?? "open"),
  priority: String(row.priority ?? "normal"),
  sla_deadline: toText(row.sla_deadline),
  created_at: toText(row.created_at),
  assigned_to: toText(row.assigned_to)
});

const isResolvedStatus = (statusRaw: string) => {
  const status = statusRaw.toLowerCase();
  return status.includes("resolved") || status.includes("closed");
};

const isCancelledStatus = (statusRaw: string) => statusRaw.toLowerCase().includes("cancel");

const chunk = <T,>(rows: T[], size: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    batches.push(rows.slice(i, i + size));
  }
  return batches;
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
  const status = params.get("status");
  const page = parsePage(params.get("page"));
  const pageSize = parsePageSize(params.get("page_size"));

  try {
    const orders = await listPartnerSellerOrders(auth.ctx.admin, {
      sellerId: auth.ctx.scope.sellerId,
      status: null,
      dateFrom,
      dateTo,
      page: 1,
      pageSize: 5000
    });

    const orderIds = Array.from(new Set(orders.items.map((row) => row.order_id).filter(Boolean)));
    if (orderIds.length === 0) {
      return NextResponse.json({
        seller_id: auth.ctx.scope.sellerId,
        range,
        page,
        page_size: pageSize,
        total: 0,
        summary: {
          open: 0,
          waiting: 0,
          in_review: 0,
          resolved: 0,
          overdue: 0
        },
        items: []
      });
    }

    const batches = chunk(orderIds, 120);
    const loaded: TicketRow[] = [];

    for (const batch of batches) {
      let query = auth.ctx.admin
        .from("support_tickets")
        .select("*")
        .in("order_id", batch)
        .gte("created_at", dateFrom)
        .order("created_at", { ascending: false })
        .limit(2000);

      if (dateTo) query = query.lte("created_at", dateTo);
      if (status && status !== "all") query = query.eq("status", status);

      const response = await query;
      if (response.error) {
        if (isMissingTableError(response.error)) {
          return NextResponse.json({
            seller_id: auth.ctx.scope.sellerId,
            range,
            page,
            page_size: pageSize,
            total: 0,
            summary: {
              open: 0,
              waiting: 0,
              in_review: 0,
              resolved: 0,
              overdue: 0
            },
            items: []
          });
        }
        throw new Error(response.error.message ?? "Falha ao carregar suporte.");
      }

      loaded.push(...(response.data ?? []).map((row) => mapTicket(row as Record<string, unknown>)));
    }

    const dedup = Array.from(new Map(loaded.map((row) => [row.id, row])).values()).sort((a, b) => {
      const ta = new Date(a.created_at ?? "").getTime();
      const tb = new Date(b.created_at ?? "").getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });

    const now = Date.now();
    const summary = dedup.reduce(
      (acc, row) => {
        const normalized = row.status.toLowerCase();
        if (normalized.includes("open")) acc.open += 1;
        if (normalized.includes("waiting")) acc.waiting += 1;
        if (normalized.includes("review")) acc.in_review += 1;
        if (isResolvedStatus(row.status)) acc.resolved += 1;
        const deadlineMs = row.sla_deadline ? new Date(row.sla_deadline).getTime() : NaN;
        if (
          Number.isFinite(deadlineMs) &&
          deadlineMs < now &&
          !isResolvedStatus(row.status) &&
          !isCancelledStatus(row.status)
        ) {
          acc.overdue += 1;
        }
        return acc;
      },
      {
        open: 0,
        waiting: 0,
        in_review: 0,
        resolved: 0,
        overdue: 0
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
        status
      },
      page,
      page_size: pageSize,
      total: dedup.length,
      summary,
      items: dedup.slice(from, to)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar suporte.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
