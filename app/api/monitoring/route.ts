import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckStatus = "ok" | "degraded" | "down";

type TimedCheck = {
  ok: boolean;
  latency_ms: number;
};

type MonitoringResponse = {
  timestamp: string;
  status: CheckStatus;
  checks: {
    database: TimedCheck;
    redis: TimedCheck;
    stripe: { ok: boolean; latency_ms: number; configured: boolean };
    cv_service: { ok: boolean; latency_ms: number; fallback: boolean };
    jobs: {
      reservas_pendentes: number;
      scans_pendentes: number;
      insights_pendentes: number;
    };
  };
  warnings: string[];
};

function elapsed(startedAt: number): number {
  return Date.now() - startedAt;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label}_timeout`)), timeoutMs);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function checkDatabase(): Promise<TimedCheck> {
  const startedAt = Date.now();

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await withTimeout(
      Promise.resolve(supabase.from("products").select("id").limit(1)),
      1_500,
      "database"
    );

    return { ok: !error, latency_ms: elapsed(startedAt) };
  } catch (error) {
    logger.error({
      route: "/api/monitoring",
      check: "database",
      error: error instanceof Error ? error.message : String(error)
    });
    return { ok: false, latency_ms: elapsed(startedAt) };
  }
}

async function checkRedis(): Promise<TimedCheck> {
  const startedAt = Date.now();
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisUrl = process.env.REDIS_URL;

  if (upstashUrl && upstashToken) {
    try {
      const response = await withTimeout(
        fetch(new URL("/ping", upstashUrl), {
          headers: { Authorization: `Bearer ${upstashToken}` },
          cache: "no-store"
        }),
        1_500,
        "redis"
      );

      return { ok: response.ok, latency_ms: elapsed(startedAt) };
    } catch (error) {
      logger.warn({
        route: "/api/monitoring",
        check: "redis",
        provider: "upstash",
        error: error instanceof Error ? error.message : String(error)
      });
      return { ok: false, latency_ms: elapsed(startedAt) };
    }
  }

  if (!redisUrl) {
    return { ok: false, latency_ms: elapsed(startedAt) };
  }

  if (/(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(redisUrl)) {
    return { ok: false, latency_ms: elapsed(startedAt) };
  }

  const { Redis } = await import("ioredis");
  const redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 0,
    enableReadyCheck: false,
    connectTimeout: 1_000
  });

  try {
    const pong = await withTimeout(redis.ping(), 1_500, "redis");
    return { ok: pong === "PONG", latency_ms: elapsed(startedAt) };
  } catch (error) {
    logger.warn({
      route: "/api/monitoring",
      check: "redis",
      error: error instanceof Error ? error.message : String(error)
    });
    return { ok: false, latency_ms: elapsed(startedAt) };
  } finally {
    redis.disconnect();
  }
}

async function checkStripe(): Promise<{ ok: boolean; latency_ms: number; configured: boolean }> {
  const startedAt = Date.now();
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    return { ok: false, latency_ms: elapsed(startedAt), configured: false };
  }

  try {
    const response = await withTimeout(
      fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${secret}` },
        cache: "no-store"
      }),
      2_000,
      "stripe"
    );

    return { ok: response.ok, latency_ms: elapsed(startedAt), configured: true };
  } catch (error) {
    logger.warn({
      route: "/api/monitoring",
      check: "stripe",
      error: error instanceof Error ? error.message : String(error)
    });
    return { ok: false, latency_ms: elapsed(startedAt), configured: true };
  }
}

async function checkCvService(): Promise<{ ok: boolean; latency_ms: number; fallback: boolean }> {
  const startedAt = Date.now();
  const cvUrl = process.env.CV_SERVICE_URL;

  if (!cvUrl) {
    return { ok: true, latency_ms: elapsed(startedAt), fallback: true };
  }

  try {
    const response = await withTimeout(
      fetch(new URL("/health", cvUrl), { cache: "no-store" }),
      1_500,
      "cv_service"
    );
    return { ok: response.ok, latency_ms: elapsed(startedAt), fallback: false };
  } catch (error) {
    logger.warn({
      route: "/api/monitoring",
      check: "cv_service",
      error: error instanceof Error ? error.message : String(error)
    });
    return { ok: false, latency_ms: elapsed(startedAt), fallback: false };
  }
}

async function countExpiredReservations(warnings: string[]): Promise<number> {
  try {
    const supabase = getSupabaseAdminClient();
    const { count, error } = await supabase
      .from("lote_reservas")
      .select("id", { count: "exact", head: true })
      .eq("status", "ATIVA")
      .lt("expira_em", new Date().toISOString());

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    warnings.push("reservas_pendentes_unavailable");
    logger.warn({
      route: "/api/monitoring",
      check: "reservas_pendentes",
      error: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}

async function countPendingScans(warnings: string[]): Promise<number> {
  const threshold = new Date(Date.now() - 5 * 60_000).toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { count, error } = await supabase
      .from("skin_scans")
      .select("id", { count: "exact", head: true })
      .in("status", ["CRIADO", "PENDENTE", "PROCESSANDO_CV", "SCORING", "RECOMENDANDO"])
      .lt("atualizado_em", threshold);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    warnings.push("scans_pendentes_unavailable");
    logger.warn({
      route: "/api/monitoring",
      check: "scans_pendentes",
      error: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}

async function countPendingInsights(warnings: string[]): Promise<number> {
  const threshold = new Date(Date.now() - 5 * 60_000).toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { count, error } = await supabase
      .from("twin_insights")
      .select("id", { count: "exact", head: true })
      .eq("rotina_precisa_revisao", true)
      .lt("criado_em", threshold);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    warnings.push("insights_pendentes_unavailable");
    logger.warn({
      route: "/api/monitoring",
      check: "insights_pendentes",
      error: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}

function resolveStatus(response: MonitoringResponse): CheckStatus {
  if (!response.checks.database.ok) return "down";

  if (
    !response.checks.redis.ok ||
    !response.checks.stripe.ok ||
    !response.checks.cv_service.ok ||
    response.checks.jobs.reservas_pendentes > 50 ||
    response.checks.jobs.scans_pendentes > 10
  ) {
    return "degraded";
  }

  return "ok";
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const warnings: string[] = [];

  const [database, redis, stripe, cvService] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStripe(),
    checkCvService()
  ]);

  const [reservasPendentes, scansPendentes, insightsPendentes] = await Promise.all([
    countExpiredReservations(warnings),
    countPendingScans(warnings),
    countPendingInsights(warnings)
  ]);

  const response: MonitoringResponse = {
    timestamp: new Date().toISOString(),
    status: "ok",
    checks: {
      database,
      redis,
      stripe,
      cv_service: cvService,
      jobs: {
        reservas_pendentes: reservasPendentes,
        scans_pendentes: scansPendentes,
        insights_pendentes: insightsPendentes
      }
    },
    warnings
  };

  response.status = resolveStatus(response);

  logger.info({
    route: "/api/monitoring",
    status: response.status,
    checks: response.checks,
    warnings
  });

  return NextResponse.json(response, {
    status: response.status === "down" ? 503 : 200,
    headers: { "Cache-Control": "no-store" }
  });
}
