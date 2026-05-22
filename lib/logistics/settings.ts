import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  clearEncryptedMandaBemToken,
  maskSecret,
  persistEncryptedMandaBemToken,
  resolveStoredMandaBemToken
} from "@/lib/logistics/credentials";
import type {
  LogisticsConnectionStatus,
  LogisticsProviderId
} from "@/lib/logistics/types";

const SETTINGS_KEYS = {
  activeProvider: "shipping_active_provider",
  mandabemStatus: "mandabem_status",
  mandabemLastCheckedAt: "mandabem_last_checked_at",
  mandabemLastError: "mandabem_last_error",
  mandabemSandboxMode: "mandabem_sandbox_mode",
  mandabemTokenMasked: "mandabem_token_masked",
  mandabemConnectedAt: "mandabem_connected_at"
} as const;

const SETTINGS_KEY_LIST = Object.values(SETTINGS_KEYS);

const tableMissing = (message: string | undefined) => {
  const normalized = String(message ?? "").toLowerCase();
  return (
    normalized.includes("could not find the table") ||
    normalized.includes("schema cache") ||
    normalized.includes("relation") ||
    normalized.includes("does not exist")
  );
};

const parseBoolean = (value: string | null | undefined, fallback = false) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["1", "true", "on", "yes", "sim"].includes(normalized)) return true;
  if (["0", "false", "off", "no", "nao"].includes(normalized)) return false;
  return fallback;
};

const normalizeProvider = (value: string | null | undefined): LogisticsProviderId => {
  if (value === "mandabem" || value === "melhorenvio" || value === "frenet") {
    return value;
  }
  return "mandabem";
};

export type LogisticsRuntimeSettings = {
  available: boolean;
  activeProvider: LogisticsProviderId;
  mandabem: {
    status: LogisticsConnectionStatus;
    sandbox: boolean;
    lastCheckedAt: string | null;
    lastError: string | null;
    tokenMasked: string | null;
    tokenSource: "env" | "encrypted_setting" | "none";
    configured: boolean;
  };
};

export type LogisticsAdminSnapshot = {
  runtime: LogisticsRuntimeSettings;
  metrics: {
    syncedOrders: number;
    labelsGenerated: number;
    trackedShipments: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  recentShipments: Array<{
    id: string;
    orderId: string;
    carrier: string | null;
    trackingCode: string | null;
    status: string | null;
    updatedAt: string | null;
  }>;
};

export async function readLogisticsRuntimeSettings(): Promise<LogisticsRuntimeSettings> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_settings")
    .select("key,value")
    .in("key", SETTINGS_KEY_LIST);

  const token = await resolveStoredMandaBemToken();
  const rows = new Map((data ?? []).map((row) => [row.key, row.value]));

  if (error && !tableMissing(error.message)) {
    throw new Error(error.message);
  }

  const configured = Boolean(token.token);

  return {
    available: !error || tableMissing(error.message),
    activeProvider: normalizeProvider(rows.get(SETTINGS_KEYS.activeProvider)),
    mandabem: {
      status: configured
        ? ((rows.get(SETTINGS_KEYS.mandabemStatus) as LogisticsConnectionStatus | undefined) ??
          "connected")
        : "not_configured",
      sandbox: parseBoolean(
        rows.get(SETTINGS_KEYS.mandabemSandboxMode),
        process.env.MANDABEM_SANDBOX_MODE === "1"
      ),
      lastCheckedAt: rows.get(SETTINGS_KEYS.mandabemLastCheckedAt) ?? null,
      lastError: rows.get(SETTINGS_KEYS.mandabemLastError) ?? null,
      tokenMasked: rows.get(SETTINGS_KEYS.mandabemTokenMasked) ?? token.masked,
      tokenSource: token.source,
      configured
    }
  };
}

async function upsertAdminSettings(entries: Record<string, string>) {
  const admin = getSupabaseAdminClient();
  const payload = Object.entries(entries).map(([key, value]) => ({ key, value }));
  const { error } = await admin.from("admin_settings").upsert(payload, {
    onConflict: "key"
  });

  if (error) {
    return {
      ok: false as const,
      message: tableMissing(error.message)
        ? "Tabela admin_settings ausente. Execute a migration de configuracoes."
        : error.message
    };
  }

  return { ok: true as const };
}

export async function saveMandaBemConfiguration(args: {
  token: string;
  sandbox: boolean;
  status: LogisticsConnectionStatus;
  lastError?: string | null;
}) {
  const persistedSecret = await persistEncryptedMandaBemToken(args.token);
  if (!persistedSecret.ok) return persistedSecret;

  const now = new Date().toISOString();
  return upsertAdminSettings({
    [SETTINGS_KEYS.activeProvider]: "mandabem",
    [SETTINGS_KEYS.mandabemStatus]: args.status,
    [SETTINGS_KEYS.mandabemLastCheckedAt]: now,
    [SETTINGS_KEYS.mandabemLastError]: args.lastError ?? "",
    [SETTINGS_KEYS.mandabemSandboxMode]: args.sandbox ? "true" : "false",
    [SETTINGS_KEYS.mandabemTokenMasked]: maskSecret(args.token) ?? "",
    [SETTINGS_KEYS.mandabemConnectedAt]: now
  });
}

export async function updateMandaBemConnectionStatus(args: {
  status: LogisticsConnectionStatus;
  sandbox: boolean;
  lastError?: string | null;
  token?: string | null;
}) {
  const now = new Date().toISOString();
  return upsertAdminSettings({
    [SETTINGS_KEYS.activeProvider]: "mandabem",
    [SETTINGS_KEYS.mandabemStatus]: args.status,
    [SETTINGS_KEYS.mandabemLastCheckedAt]: now,
    [SETTINGS_KEYS.mandabemLastError]: args.lastError ?? "",
    [SETTINGS_KEYS.mandabemSandboxMode]: args.sandbox ? "true" : "false",
    [SETTINGS_KEYS.mandabemTokenMasked]: maskSecret(args.token) ?? ""
  });
}

export async function clearMandaBemConfiguration() {
  const cleared = await clearEncryptedMandaBemToken();
  if (!cleared.ok) return cleared;

  return upsertAdminSettings({
    [SETTINGS_KEYS.mandabemStatus]: "not_configured",
    [SETTINGS_KEYS.mandabemLastCheckedAt]: new Date().toISOString(),
    [SETTINGS_KEYS.mandabemLastError]: "",
    [SETTINGS_KEYS.mandabemTokenMasked]: ""
  });
}

export async function fetchLogisticsAdminSnapshot(): Promise<LogisticsAdminSnapshot> {
  const admin = getSupabaseAdminClient();
  const runtime = await readLogisticsRuntimeSettings();
  const [
    shipmentsCountResult,
    labelCountResult,
    trackedCountResult,
    recentShipmentsResult
  ] = await Promise.all([
    admin.from("shipments").select("id", { count: "exact", head: true }),
    admin
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .not("tracking_code", "is", null),
    admin
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .not("tracking_code", "is", null),
    admin
      .from("shipments")
      .select("id,order_id,carrier,tracking_code,status,updated_at,created_at")
      .order("updated_at", { ascending: false })
      .limit(60)
  ]);

  const nonMissingErrors = [
    shipmentsCountResult.error,
    labelCountResult.error,
    trackedCountResult.error,
    recentShipmentsResult.error
  ].filter((error) => error && !tableMissing(error.message));

  if (nonMissingErrors.length > 0) {
    throw new Error(nonMissingErrors[0]?.message);
  }

  const shipments = (recentShipmentsResult.data ?? []) as Array<{
    id: string;
    order_id: string;
    carrier: string | null;
    tracking_code: string | null;
    status: string | null;
    updated_at: string | null;
    created_at: string | null;
  }>;

  const statusMap = shipments.reduce<Map<string, number>>((acc, shipment) => {
    const key = shipment.status || "sem_status";
    acc.set(key, (acc.get(key) ?? 0) + 1);
    return acc;
  }, new Map());

  const labelsGenerated = shipments.filter((shipment) => Boolean(shipment.tracking_code)).length;
  const trackedShipments = shipments.filter(
    (shipment) =>
      Boolean(shipment.tracking_code) &&
      !["cancelled", "cancelado", "delivered", "entregue"].includes(
        String(shipment.status ?? "").toLowerCase()
      )
  ).length;

  return {
    runtime,
    metrics: {
      syncedOrders: shipmentsCountResult.count ?? shipments.length,
      labelsGenerated: labelCountResult.count ?? labelsGenerated,
      trackedShipments: trackedCountResult.count ?? trackedShipments
    },
    statusBreakdown: Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((left, right) => right.count - left.count),
    recentShipments: shipments.slice(0, 8).map((shipment) => ({
      id: shipment.id,
      orderId: shipment.order_id,
      carrier: shipment.carrier,
      trackingCode: shipment.tracking_code,
      status: shipment.status,
      updatedAt: shipment.updated_at ?? shipment.created_at
    }))
  };
}
