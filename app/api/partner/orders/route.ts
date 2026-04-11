import { NextRequest, NextResponse } from "next/server";

import { ensurePartnerApiContext } from "@/lib/partner/auth";
import { listPartnerSellerOrders, parseRangeToDateFrom } from "@/lib/partner/sellerOrders";

type RangePreset = "today" | "7d" | "30d" | "90d";

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
    const result = await listPartnerSellerOrders(auth.ctx.admin, {
      sellerId: auth.ctx.scope.sellerId,
      status,
      dateFrom,
      dateTo,
      page,
      pageSize
    });

    return NextResponse.json({
      seller_id: auth.ctx.scope.sellerId,
      source: result.source,
      range,
      filters: {
        status,
        date_from: dateFrom,
        date_to: dateTo
      },
      page,
      page_size: pageSize,
      total: result.total,
      items: result.items
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar pedidos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
