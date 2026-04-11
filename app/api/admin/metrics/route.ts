import { NextRequest, NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";

type RangePreset = "7d" | "30d" | "90d";
type Granularity = "hour" | "day";

type MetricRow = {
  bucket_ts?: string | null;
  bucket_date?: string | null;
  gmv_cents?: number | null;
  orders?: number | null;
  orders_paid?: number | null;
  cancels?: number | null;
  cancel_rate_bps?: number | null;
  updated_at?: string | null;
};

type SeriesPoint = {
  ts: string;
  gmv_cents: number;
  orders_paid: number;
  cancels: number;
  cancel_rate_bps: number;
};

const RANGE_DAYS: Record<RangePreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90
};

const buildEmptySeries = (
  range: RangePreset,
  granularity: Granularity
): { series: SeriesPoint[]; updatedAt: string } => {
  const now = new Date();
  const stepMs = granularity === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const steps = granularity === "hour" ? RANGE_DAYS[range] * 24 : RANGE_DAYS[range];
  const alignedNow = new Date(now);

  if (granularity === "hour") {
    alignedNow.setMinutes(0, 0, 0);
  } else {
    alignedNow.setHours(0, 0, 0, 0);
  }

  const end = alignedNow.getTime();
  const start = end - (steps - 1) * stepMs;
  const series: SeriesPoint[] = [];

  for (let idx = 0; idx < steps; idx += 1) {
    const ts = start + idx * stepMs;
    series.push({
      ts: new Date(ts).toISOString(),
      gmv_cents: 0,
      orders_paid: 0,
      cancels: 0,
      cancel_rate_bps: 0
    });
  }

  return {
    series,
    updatedAt: new Date().toISOString()
  };
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseRange = (value: string | null): RangePreset | null => {
  if (value === "7d" || value === "30d" || value === "90d") return value;
  return null;
};

const dateToIsoStart = (dateValue: string) => new Date(`${dateValue}T00:00:00.000Z`).toISOString();

const normalizeTs = (row: MetricRow) => {
  if (row.bucket_ts) return row.bucket_ts;
  if (row.bucket_date) return dateToIsoStart(row.bucket_date);
  return new Date().toISOString();
};

const aggregateSeries = (rows: MetricRow[]): { series: SeriesPoint[]; updatedAt: string | null } => {
  const grouped = new Map<
    string,
    {
      gmv: number;
      ordersPaid: number;
      cancels: number;
      updatedAtMs: number;
    }
  >();

  for (const row of rows) {
    const ts = normalizeTs(row);
    const current = grouped.get(ts) ?? {
      gmv: 0,
      ordersPaid: 0,
      cancels: 0,
      updatedAtMs: 0
    };

    current.gmv += toNumber(row.gmv_cents);
    current.ordersPaid += toNumber(row.orders_paid ?? row.orders);
    current.cancels += toNumber(row.cancels);

    const updatedMs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    if (updatedMs > current.updatedAtMs) current.updatedAtMs = updatedMs;

    grouped.set(ts, current);
  }

  const series = Array.from(grouped.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([ts, value]) => ({
      ts,
      gmv_cents: Math.round(value.gmv),
      orders_paid: Math.round(value.ordersPaid),
      cancels: Math.round(value.cancels),
      cancel_rate_bps:
        value.ordersPaid > 0
          ? Math.max(0, Math.min(10_000, Math.round((value.cancels * 10_000) / value.ordersPaid)))
          : 0
    }));

  const updatedAtMax = rows.reduce((max, row) => {
    const parsed = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    return parsed > max ? parsed : max;
  }, 0);

  return {
    series,
    updatedAt: updatedAtMax > 0 ? new Date(updatedAtMax).toISOString() : null
  };
};

const normalizeLegacyCurrencyScale = (rows: MetricRow[]): MetricRow[] => {
  const gmvValues = rows
    .map((row) => toNumber(row.gmv_cents))
    .filter((value) => value > 0);

  if (!gmvValues.length) return rows;

  const maxGmv = Math.max(...gmvValues);
  const totalGmv = gmvValues.reduce((sum, value) => sum + value, 0);
  const totalOrders = rows.reduce((sum, row) => sum + toNumber(row.orders_paid ?? row.orders), 0);
  const avgPerOrder = totalOrders > 0 ? totalGmv / totalOrders : 0;

  const looksLikeBrlInCentsColumn =
    maxGmv <= 500 && avgPerOrder > 0 && avgPerOrder <= 20;

  if (!looksLikeBrlInCentsColumn) return rows;

  return rows.map((row) => ({
    ...row,
    gmv_cents: toNumber(row.gmv_cents) * 100
  }));
};

const extractPermissionClaims = (user: any): string[] =>
  Array.isArray(user?.app_metadata?.permissions) ? (user.app_metadata.permissions as string[]) : [];

const resolveScopedStore = (user: any) =>
  (typeof user?.app_metadata?.store_id === "string" && user.app_metadata.store_id) ||
  (typeof user?.user_metadata?.store_id === "string" && user.user_metadata.store_id) ||
  null;

export async function GET(request: NextRequest) {
  const admin = await ensureAdminRequest(request);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const {
    data: { user }
  } = await admin.supabase.auth.getUser();

  const permissionClaims = extractPermissionClaims(user);
  const hasPermissionAll = permissionClaims.includes("admin.metrics.read:all");
  const hasPermissionStore = permissionClaims.includes("admin.metrics.read:store");
  const hasPermissionBase = permissionClaims.includes("admin.metrics.read");

  if (permissionClaims.length > 0 && !hasPermissionAll && !hasPermissionStore && !hasPermissionBase) {
    return NextResponse.json({ error: "Sem permissao para admin.metrics.read." }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const range = parseRange(params.get("range"));
  if (!range) {
    return NextResponse.json({ error: "Parametro range invalido. Use 7d, 30d ou 90d." }, { status: 400 });
  }

  const channel = params.get("channel")?.trim() || null;
  const requestedStoreId = params.get("store_id")?.trim() || null;
  const timezone = params.get("timezone")?.trim() || "America/Sao_Paulo";

  let effectiveStoreId = requestedStoreId;
  if (permissionClaims.length > 0 && !hasPermissionAll && hasPermissionStore) {
    const scopedStoreId = resolveScopedStore(user);
    if (!scopedStoreId) {
      return NextResponse.json({ error: "Escopo de loja nao definido para leitura de metricas." }, { status: 403 });
    }
    if (requestedStoreId && requestedStoreId !== scopedStoreId) {
      return NextResponse.json({ error: "Sem permissao para loja solicitada." }, { status: 403 });
    }
    effectiveStoreId = scopedStoreId;
  }

  const granularity: Granularity = range === "7d" ? "hour" : "day";
  const days = RANGE_DAYS[range];
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const fromIso = fromDate.toISOString();
  const fromDateStr = fromIso.slice(0, 10);

  const tableName = granularity === "hour" ? "metrics_marketplace_hour" : "metrics_marketplace_day";

  let query = admin.supabase
    .from(tableName)
    .select("bucket_ts,bucket_date,gmv_cents,orders,orders_paid,cancels,cancel_rate_bps,updated_at");

  if (granularity === "hour") {
    query = query.gte("bucket_ts", fromIso);
  } else {
    query = query.gte("bucket_date", fromDateStr);
  }

  query = query.order(granularity === "hour" ? "bucket_ts" : "bucket_date", { ascending: true });

  if (channel) {
    query = query.eq("channel", channel);
  }
  if (effectiveStoreId) {
    query = query.eq("store_id", effectiveStoreId);
  }

  const firstResult = await query;
  let queryError = firstResult.error;
  let rows = (firstResult.data ?? []) as MetricRow[];

  // Legacy compatibility: metrics_marketplace_day may not have bucket_date in old schemas.
  if (queryError?.code === "42703" && granularity === "day") {
    let legacyQuery = admin.supabase
      .from(tableName)
      .select("bucket_ts,gmv_cents,orders,orders_paid,cancels,cancel_rate_bps,updated_at")
      .gte("bucket_ts", fromIso)
      .order("bucket_ts", { ascending: true });

    if (channel) legacyQuery = legacyQuery.eq("channel", channel);
    if (effectiveStoreId) legacyQuery = legacyQuery.eq("store_id", effectiveStoreId);

    const legacyResult = await legacyQuery;
    queryError = legacyResult.error;
    rows = (legacyResult.data ?? []) as MetricRow[];
  }

  if (queryError) {
    const empty = buildEmptySeries(range, granularity);
    return NextResponse.json({
      range,
      granularity,
      series: empty.series,
      updated_at: empty.updatedAt,
      timezone,
      source: "empty_fallback"
    });
  }

  const aggregate = aggregateSeries(normalizeLegacyCurrencyScale(rows));

  return NextResponse.json({
    range,
    granularity,
    series: aggregate.series,
    updated_at: aggregate.updatedAt ?? new Date().toISOString(),
    timezone
  });
}
