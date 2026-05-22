import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// Health check usado por uptime monitoring e load balancers.
// NUNCA expor dados sensiveis, versoes de dependencia ou stack traces.

export const dynamic = "force-dynamic";

type HealthStatus = "ok" | "degraded" | "down";

function isLocalRedisUrl(value: string): boolean {
  return /(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(value);
}

async function checkRedis(warnings: string[]): Promise<boolean> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisUrl = process.env.REDIS_URL;

  if (upstashUrl && upstashToken) {
    try {
      const response = await fetch(new URL("/ping", upstashUrl), {
        headers: { Authorization: `Bearer ${upstashToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(1_500),
      });

      if (response.ok) return true;
      warnings.push("redis_upstash_ping_failed");
      return false;
    } catch {
      warnings.push("redis_upstash_unreachable");
      return false;
    }
  }

  if (redisUrl) {
    if (isLocalRedisUrl(redisUrl)) {
      warnings.push("redis_url_localhost_ignored_in_production");
      return false;
    }

    return true;
  }

  warnings.push("redis_not_configured");
  return false;
}

export async function GET() {
  const checks: Record<string, boolean> = {};
  const warnings: string[] = [];

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("products").select("id").limit(1);
    checks.database = !error;
  } catch {
    checks.database = false;
  }

  // Redis/BullMQ e importante para jobs, mas nao deve derrubar a vitrine.
  checks.redis = await checkRedis(warnings);

  const status: HealthStatus = !checks.database
    ? "down"
    : checks.redis
      ? "ok"
      : "degraded";

  return Response.json(
    {
      status,
      timestamp: new Date().toISOString(),
      checks,
      warnings,
    },
    {
      status: status === "down" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
