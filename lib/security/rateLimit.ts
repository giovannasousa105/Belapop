import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ConsumeRateLimitInput = {
  scope: string;
  actorKey: string | null | undefined;
  windowSeconds: number;
  limit: number;
  blockSeconds?: number;
};

export type RateLimitResult = {
  allowed: boolean;
  attempts: number;
  remaining: number;
  resetAt: string;
  blockedUntil: string | null;
  durable: boolean;
};

type MemoryRateLimitEntry = {
  attempts: number;
  resetAtMs: number;
  blockedUntilMs: number | null;
};

const MISSING_RATE_LIMIT_CODES = new Set(["42883", "PGRST202", "PGRST204"]);

const normalizeActorKey = (value: string | null | undefined) =>
  String(value ?? "").trim().toLowerCase();

const toIso = (value: number) => new Date(value).toISOString();

const isMissingRateLimitRpcError = (
  error: { code?: string | null; message?: string | null } | null
) => {
  if (!error) return false;
  if (error.code && MISSING_RATE_LIMIT_CODES.has(error.code)) return true;
  const message = String(error.message ?? "").toLowerCase();
  return (
    message.includes("security_consume_rate_limit") &&
    (message.includes("does not exist") || message.includes("not found"))
  );
};

const getMemoryStore = () => {
  const globalStore = globalThis as typeof globalThis & {
    __belapopRateLimitStore?: Map<string, MemoryRateLimitEntry>;
  };

  if (!globalStore.__belapopRateLimitStore) {
    globalStore.__belapopRateLimitStore = new Map<string, MemoryRateLimitEntry>();
  }

  return globalStore.__belapopRateLimitStore;
};

const consumeInMemoryRateLimit = (input: ConsumeRateLimitInput): RateLimitResult => {
  const actorKey = normalizeActorKey(input.actorKey);
  const now = Date.now();
  const windowMs = Math.max(1, input.windowSeconds) * 1000;
  const blockMs = Math.max(0, input.blockSeconds ?? 0) * 1000;

  if (!actorKey) {
    return {
      allowed: true,
      attempts: 0,
      remaining: input.limit,
      resetAt: toIso(now + windowMs),
      blockedUntil: null,
      durable: false
    };
  }

  const key = `${input.scope}:${actorKey}`;
  const store = getMemoryStore();
  const existing = store.get(key);

  let entry = existing;
  if (!entry || entry.resetAtMs <= now) {
    entry = {
      attempts: 0,
      resetAtMs: now + windowMs,
      blockedUntilMs: null
    };
  }

  if (entry.blockedUntilMs && entry.blockedUntilMs > now) {
    store.set(key, entry);
    return {
      allowed: false,
      attempts: entry.attempts,
      remaining: 0,
      resetAt: toIso(entry.resetAtMs),
      blockedUntil: toIso(entry.blockedUntilMs),
      durable: false
    };
  }

  entry.attempts += 1;

  if (entry.attempts > input.limit && blockMs > 0) {
    entry.blockedUntilMs = now + blockMs;
  }

  store.set(key, entry);

  return {
    allowed: entry.attempts <= input.limit,
    attempts: entry.attempts,
    remaining: Math.max(0, input.limit - entry.attempts),
    resetAt: toIso(entry.resetAtMs),
    blockedUntil: entry.blockedUntilMs ? toIso(entry.blockedUntilMs) : null,
    durable: false
  };
};

export async function consumeRateLimit(
  input: ConsumeRateLimitInput
): Promise<RateLimitResult> {
  const actorKey = normalizeActorKey(input.actorKey);

  if (!actorKey) {
    const now = Date.now();
    return {
      allowed: true,
      attempts: 0,
      remaining: input.limit,
      resetAt: toIso(now + Math.max(1, input.windowSeconds) * 1000),
      blockedUntil: null,
      durable: false
    };
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.rpc("security_consume_rate_limit", {
      p_scope: input.scope,
      p_actor_key: actorKey,
      p_window_seconds: input.windowSeconds,
      p_limit: input.limit,
      p_block_seconds: input.blockSeconds ?? 0
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    const attempts = Number(row?.attempts ?? 0);
    const remaining = Math.max(
      0,
      Number(row?.remaining ?? input.limit - attempts)
    );

    return {
      allowed: Boolean(row?.allowed ?? true),
      attempts,
      remaining,
      resetAt:
        typeof row?.reset_at === "string"
          ? row.reset_at
          : toIso(Date.now() + Math.max(1, input.windowSeconds) * 1000),
      blockedUntil: row?.blocked_until ? String(row.blocked_until) : null,
      durable: true
    };
  } catch (error) {
    if (!isMissingRateLimitRpcError(error as { code?: string; message?: string })) {
      throw error;
    }

    return consumeInMemoryRateLimit({
      ...input,
      actorKey
    });
  }
}

export const getRetryAfterSeconds = (
  result: Pick<RateLimitResult, "blockedUntil" | "resetAt">
) => {
  const deadline = result.blockedUntil ?? result.resetAt;
  const parsed = Date.parse(deadline);

  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(1, Math.ceil((parsed - Date.now()) / 1000));
};
