import { NextResponse } from "next/server";

import { consumeRateLimit, getRetryAfterSeconds } from "@/lib/security/rateLimit";
import { getRequestIp } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Payload = {
  email?: string;
  password?: string;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store"
};

const json = (
  body: Record<string, unknown>,
  init?: {
    status?: number;
    headers?: Record<string, string>;
  }
) =>
  NextResponse.json(body, {
    status: init?.status,
    headers: {
      ...NO_STORE_HEADERS,
      ...(init?.headers ?? {})
    }
  });

export async function POST(request: Request) {
  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json({ error: "Payload invalido." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password) {
    return json({ error: "Email e senha obrigatorios." }, { status: 400 });
  }

  const ipAddress = getRequestIp(request);
  const [emailRateLimit, ipRateLimit] = await Promise.all([
    consumeRateLimit({
      scope: "auth.login.email",
      actorKey: email,
      windowSeconds: 10 * 60,
      limit: 5,
      blockSeconds: 15 * 60
    }),
    consumeRateLimit({
      scope: "auth.login.ip",
      actorKey: ipAddress,
      windowSeconds: 10 * 60,
      limit: 10,
      blockSeconds: 15 * 60
    })
  ]);

  const blockedRateLimit = [emailRateLimit, ipRateLimit].find(
    (result) => !result.allowed
  );
  if (blockedRateLimit) {
    const retryAfter = getRetryAfterSeconds(blockedRateLimit);
    return json(
      {
        error: "Rate limit exceeded. Too many login attempts."
      },
      {
        status: 429,
        headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined
      }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (
    error ||
    !data.user ||
    !data.session?.access_token ||
    !data.session?.refresh_token
  ) {
    return json(
      {
        error: error?.message ?? "Credenciais invalidas."
      },
      { status: 401 }
    );
  }

  return json({
    ok: true,
    userId: data.user.id,
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    }
  });
}
