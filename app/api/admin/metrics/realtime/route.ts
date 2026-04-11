import { NextRequest, NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";

type WindowPreset = "3h" | "6h" | "7d" | "30d" | "90d";
type BucketPreset = "1m" | "2m" | "5m" | "1h" | "1d";

type MetricRow = {
  bucket_ts: string;
  gmv_cents: number | null;
  orders: number | null;
  orders_paid: number | null;
  cancels: number | null;
  refunds_cents: number | null;
  refunds_count: number | null;
  chargeback_cents: number | null;
  chargeback_count: number | null;
  cancel_rate_bps: number | null;
  updated_at: string | null;
};

type EventRow = {
  occurred_at: string;
  event_type: string;
  event_name?: string | null;
  amount_cents: number | null;
  created_at: string | null;
};

type ApiSeriesPoint = {
  ts: string;
  gmv_cents: number;
  orders_paid: number;
  cancels: number;
  refunds_cents: number;
  refunds_count: number;
  chargeback_cents: number;
  chargeback_count: number;
  cancel_rate_bps: number;
};

const WINDOW_MINUTES: Record<WindowPreset, number> = {
  "3h": 180,
  "6h": 360,
  "7d": 10_080,
  "30d": 43_200,
  "90d": 129_600
};

const DEFAULT_BUCKET: Record<WindowPreset, BucketPreset> = {
  "3h": "1m",
  "6h": "2m",
  "7d": "1h",
  "30d": "1d",
  "90d": "1d"
};

const BUCKET_MINUTES: Record<BucketPreset, number> = {
  "1m": 1,
  "2m": 2,
  "5m": 5,
  "1h": 60,
  "1d": 1_440
};

const buildEmptySeries = (
  windowPreset: WindowPreset,
  bucket: BucketPreset
): { series: ApiSeriesPoint[]; updatedAt: string } => {
  const windowMinutes = WINDOW_MINUTES[windowPreset];
  const bucketMinutes = BUCKET_MINUTES[bucket];
  const bucketMs = bucketMinutes * 60_000;
  const now = Date.now();
  const alignedNow = Math.floor(now / bucketMs) * bucketMs;
  const steps = Math.max(1, Math.floor(windowMinutes / bucketMinutes));
  const start = alignedNow - (steps - 1) * bucketMs;

  const series: ApiSeriesPoint[] = [];
  for (let idx = 0; idx < steps; idx += 1) {
    const ts = start + idx * bucketMs;
    series.push({
      ts: new Date(ts).toISOString(),
      gmv_cents: 0,
      orders_paid: 0,
      cancels: 0,
      refunds_cents: 0,
      refunds_count: 0,
      chargeback_cents: 0,
      chargeback_count: 0,
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

const parseWindow = (value: string | null): WindowPreset => {
  if (value === "6h" || value === "7d" || value === "30d" || value === "90d") {
    return value;
  }
  return "3h";
};

const parseBucket = (value: string | null, windowPreset: WindowPreset): BucketPreset => {
  if (value === "1m" || value === "2m" || value === "5m" || value === "1h" || value === "1d") {
    return value;
  }
  return DEFAULT_BUCKET[windowPreset];
};

const toIso = (value: Date | number) => {
  const date = typeof value === "number" ? new Date(value) : value;
  return date.toISOString();
};

const tableForBucket = (bucket: BucketPreset) => {
  if (bucket === "1h") return "metrics_marketplace_hour";
  if (bucket === "1d") return "metrics_marketplace_day";
  return "metrics_marketplace_minute";
};

const aggregateByBucket = (
  rows: MetricRow[],
  bucketMinutes: number
): { series: ApiSeriesPoint[]; updatedAt: string | null } => {
  const bucketMs = bucketMinutes * 60_000;
  const groups = new Map<
    number,
    {
      gmvCents: number;
      ordersPaid: number;
      cancels: number;
      refundsCents: number;
      refundsCount: number;
      chargebackCents: number;
      chargebackCount: number;
      updatedAtMs: number;
    }
  >();

  rows.forEach((row) => {
    const ts = new Date(row.bucket_ts).getTime();
    if (!Number.isFinite(ts)) return;

    const key = Math.floor(ts / bucketMs) * bucketMs;
    const current = groups.get(key) ?? {
      gmvCents: 0,
      ordersPaid: 0,
      cancels: 0,
      refundsCents: 0,
      refundsCount: 0,
      chargebackCents: 0,
      chargebackCount: 0,
      updatedAtMs: 0
    };

    current.gmvCents += toNumber(row.gmv_cents);
    current.ordersPaid += toNumber(row.orders_paid ?? row.orders);
    current.cancels += toNumber(row.cancels);
    current.refundsCents += toNumber(row.refunds_cents);
    current.refundsCount += toNumber(row.refunds_count);
    current.chargebackCents += toNumber(row.chargeback_cents);
    current.chargebackCount += toNumber(row.chargeback_count);

    const updatedAtMs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    if (updatedAtMs > current.updatedAtMs) current.updatedAtMs = updatedAtMs;

    groups.set(key, current);
  });

  const series = Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ts, value]) => ({
      ts: toIso(ts),
      gmv_cents: Math.round(value.gmvCents),
      orders_paid: Math.round(value.ordersPaid),
      cancels: Math.round(value.cancels),
      refunds_cents: Math.round(value.refundsCents),
      refunds_count: Math.round(value.refundsCount),
      chargeback_cents: Math.round(value.chargebackCents),
      chargeback_count: Math.round(value.chargebackCount),
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
    updatedAt: updatedAtMax > 0 ? toIso(updatedAtMax) : null
  };
};

const normalizeLegacyMetricRows = (rows: Array<Record<string, unknown>>): MetricRow[] =>
  rows.map((row) => ({
    bucket_ts: String(row.bucket_ts ?? new Date().toISOString()),
    gmv_cents: toNumber(row.gmv_cents),
    orders: toNumber(row.orders),
    orders_paid: toNumber(row.orders_paid ?? row.orders),
    cancels: toNumber(row.cancels),
    refunds_cents: toNumber(row.refunds_cents),
    refunds_count: toNumber(row.refunds_count),
    chargeback_cents: toNumber(row.chargeback_cents),
    chargeback_count: toNumber(row.chargeback_count),
    cancel_rate_bps: toNumber(row.cancel_rate_bps),
    updated_at: String(row.updated_at ?? row.bucket_ts ?? new Date().toISOString())
  }));

const normalizeLegacyCurrencyScale = (rows: MetricRow[]): MetricRow[] => {
  const gmvValues = rows
    .map((row) => toNumber(row.gmv_cents))
    .filter((value) => value > 0);

  if (!gmvValues.length) return rows;

  const maxGmv = Math.max(...gmvValues);
  const totalGmv = gmvValues.reduce((sum, value) => sum + value, 0);
  const totalOrders = rows.reduce(
    (sum, row) => sum + toNumber(row.orders_paid ?? row.orders),
    0
  );
  const avgPerOrder = totalOrders > 0 ? totalGmv / totalOrders : 0;

  // Some legacy pipelines persisted BRL values into *_cents columns.
  // When values are unrealistically low, normalize back to cents.
  const looksLikeBrlInCentsColumn =
    maxGmv <= 500 && avgPerOrder > 0 && avgPerOrder <= 20;

  if (!looksLikeBrlInCentsColumn) return rows;

  return rows.map((row) => ({
    ...row,
    gmv_cents: toNumber(row.gmv_cents) * 100,
    refunds_cents: toNumber(row.refunds_cents) * 100,
    chargeback_cents: toNumber(row.chargeback_cents) * 100
  }));
};

const fallbackFromEvents = async (
  supabase: any,
  fromIso: string,
  bucket: BucketPreset,
  channel: string | null,
  storeId: string | null
) => {
  let query = supabase
    .from("marketplace_events")
    .select("occurred_at,event_type,event_name,amount_cents,created_at")
    .gte("occurred_at", fromIso)
    .order("occurred_at", { ascending: true });

  if (channel) query = query.eq("channel", channel);
  if (storeId) query = query.eq("store_id", storeId);

  let eventResult = await query;
  if (eventResult.error?.code === "42703") {
    let legacyQuery = supabase
      .from("marketplace_events")
      .select("occurred_at,event_type,amount_cents,created_at")
      .gte("occurred_at", fromIso)
      .order("occurred_at", { ascending: true });

    if (channel) legacyQuery = legacyQuery.eq("channel", channel);
    if (storeId) legacyQuery = legacyQuery.eq("store_id", storeId);

    eventResult = await legacyQuery;
  }

  if (eventResult.error) {
    throw new Error(eventResult.error.message ?? "Falha ao montar fallback de eventos.");
  }

  const rows = ((eventResult.data ?? []) as EventRow[]).map((event) => {
    const eventName = String(event.event_name ?? event.event_type ?? "").toLowerCase();

    const isPaid = eventName === "order_paid";
    const isCanceled = eventName === "order_canceled";
    const isRefund = eventName === "refund_settled";
    const isChargeback = eventName === "chargeback_opened";

    return {
      bucket_ts: event.occurred_at,
      gmv_cents: isPaid ? toNumber(event.amount_cents) : 0,
      orders_paid: isPaid ? 1 : 0,
      orders: isPaid ? 1 : 0,
      cancels: isCanceled ? 1 : 0,
      refunds_cents: isRefund ? toNumber(event.amount_cents) : 0,
      refunds_count: isRefund ? 1 : 0,
      chargeback_cents: isChargeback ? toNumber(event.amount_cents) : 0,
      chargeback_count: isChargeback ? 1 : 0,
      cancel_rate_bps: 0,
      updated_at: event.created_at ?? event.occurred_at
    } as MetricRow;
  });

  return aggregateByBucket(rows, BUCKET_MINUTES[bucket]);
};

const fallbackFromLegacyOrders = async (supabase: any, fromIso: string, bucket: BucketPreset) => {
  const { data, error } = await supabase
    .from("orders")
    .select("created_at,status,total_cents,total_order_cents")
    .gte("created_at", fromIso)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message ?? "Falha ao montar fallback de pedidos.");
  }

  const rows = (data ?? []).map((order: any) => {
    const status = String(order.status ?? "").toLowerCase();
    const isPaid = ["paid", "processing", "shipped", "delivered", "fulfilled"].includes(status);
    const isCanceled = ["canceled", "cancelled", "refunded"].includes(status);

    return {
      bucket_ts: order.created_at,
      gmv_cents: isPaid ? toNumber(order.total_cents ?? order.total_order_cents) : 0,
      orders_paid: isPaid ? 1 : 0,
      orders: isPaid ? 1 : 0,
      cancels: isCanceled ? 1 : 0,
      refunds_cents: 0,
      refunds_count: 0,
      chargeback_cents: 0,
      chargeback_count: 0,
      cancel_rate_bps: 0,
      updated_at: order.created_at
    } as MetricRow;
  });

  return aggregateByBucket(rows, BUCKET_MINUTES[bucket]);
};

export async function GET(request: NextRequest) {
  const admin = await ensureAdminRequest(request);
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const {
    data: { user }
  } = await admin.supabase.auth.getUser();

  const permissionClaims = Array.isArray(user?.app_metadata?.permissions)
    ? (user?.app_metadata?.permissions as string[])
    : [];

  const hasPermissionAll = permissionClaims.includes("admin.metrics.read:all");
  const hasPermissionStore = permissionClaims.includes("admin.metrics.read:store");
  const hasPermissionBase = permissionClaims.includes("admin.metrics.read");

  if (permissionClaims.length > 0 && !hasPermissionAll && !hasPermissionStore && !hasPermissionBase) {
    return NextResponse.json({ error: "Sem permissao para admin.metrics.read." }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const windowPreset = parseWindow(params.get("window"));
  const bucket = parseBucket(params.get("bucket"), windowPreset);
  const channel = params.get("channel")?.trim() || null;
  const requestedStoreId = params.get("store_id")?.trim() || null;
  const timezone = params.get("timezone")?.trim() || "America/Sao_Paulo";

  let effectiveStoreId = requestedStoreId;
  if (permissionClaims.length > 0 && !hasPermissionAll && hasPermissionStore) {
    const scopedStoreId =
      (typeof user?.app_metadata?.store_id === "string" && user.app_metadata.store_id) ||
      (typeof user?.user_metadata?.store_id === "string" && user.user_metadata.store_id) ||
      null;

    if (!scopedStoreId) {
      return NextResponse.json({ error: "Escopo de loja nao definido para leitura de metricas." }, { status: 403 });
    }

    if (requestedStoreId && requestedStoreId !== scopedStoreId) {
      return NextResponse.json({ error: "Sem permissao para loja solicitada." }, { status: 403 });
    }

    effectiveStoreId = scopedStoreId;
  }

  const sourceTable = tableForBucket(bucket);
  const windowMinutes = WINDOW_MINUTES[windowPreset];
  const fromDate = new Date(Date.now() - windowMinutes * 60_000);
  const fromIso = fromDate.toISOString();

  let query = admin.supabase
    .from(sourceTable)
    .select(
      "bucket_ts,gmv_cents,orders,orders_paid,cancels,refunds_cents,refunds_count,chargeback_cents,chargeback_count,cancel_rate_bps,updated_at"
    )
    .gte("bucket_ts", fromIso)
    .order("bucket_ts", { ascending: true });

  if (channel) query = query.eq("channel", channel);
  if (effectiveStoreId) query = query.eq("store_id", effectiveStoreId);

  const primaryResult = await query;
  let queryError = primaryResult.error;
  let rawRows = (primaryResult.data ?? []) as Array<Record<string, unknown>>;

  if (queryError?.code === "42703") {
    let legacyQuery = admin.supabase
      .from(sourceTable)
      .select("bucket_ts,gmv_cents,orders,cancels,cancel_rate_bps,updated_at")
      .gte("bucket_ts", fromIso)
      .order("bucket_ts", { ascending: true });

    if (channel) legacyQuery = legacyQuery.eq("channel", channel);
    if (effectiveStoreId) legacyQuery = legacyQuery.eq("store_id", effectiveStoreId);

    const legacyResult = await legacyQuery;
    queryError = legacyResult.error;
    rawRows = (legacyResult.data ?? []) as Array<Record<string, unknown>>;
  }

  let aggregate: { series: ApiSeriesPoint[]; updatedAt: string | null };
  let source = sourceTable;

  if (queryError) {
    if (queryError.code === "42P01") {
      try {
        aggregate = await fallbackFromEvents(admin.supabase, fromIso, bucket, channel, effectiveStoreId);
        source = "events_fallback";
      } catch {
        try {
          aggregate = await fallbackFromLegacyOrders(admin.supabase, fromIso, bucket);
          source = "legacy_orders_fallback";
        } catch {
          aggregate = buildEmptySeries(windowPreset, bucket);
          source = "empty_fallback";
        }
      }
    } else {
      try {
        aggregate = await fallbackFromEvents(admin.supabase, fromIso, bucket, channel, effectiveStoreId);
        source = "events_fallback";
      } catch {
        try {
          aggregate = await fallbackFromLegacyOrders(admin.supabase, fromIso, bucket);
          source = "legacy_orders_fallback";
        } catch {
          aggregate = buildEmptySeries(windowPreset, bucket);
          source = "empty_fallback";
        }
      }
    }
  } else {
    const rows = normalizeLegacyCurrencyScale(normalizeLegacyMetricRows(rawRows));

    if (rows.length === 0) {
      try {
        aggregate = await fallbackFromEvents(admin.supabase, fromIso, bucket, channel, effectiveStoreId);
        source = "events_fallback";
      } catch {
        aggregate = await fallbackFromLegacyOrders(admin.supabase, fromIso, bucket);
        source = "legacy_orders_fallback";
      }
    } else {
      aggregate = aggregateByBucket(rows, BUCKET_MINUTES[bucket]);
    }
  }

  const nowMs = Date.now();
  const updatedAtMs = aggregate.updatedAt ? new Date(aggregate.updatedAt).getTime() : nowMs;
  const lagSeconds = Math.max(0, Math.floor((nowMs - updatedAtMs) / 1000));

  return NextResponse.json({
    window: windowPreset,
    bucket,
    series: aggregate.series,
    updated_at: aggregate.updatedAt ?? new Date().toISOString(),
    timezone,
    source,
    lag_seconds: lagSeconds,
    status: lagSeconds > 300 ? "partial" : lagSeconds > 60 ? "delayed" : "online"
  });
}
