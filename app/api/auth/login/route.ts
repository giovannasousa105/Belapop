import { NextRequest, NextResponse } from "next/server";

import { consumeRateLimit, getRetryAfterSeconds } from "@/lib/security/rateLimit";
import { getRequestIp } from "@/lib/security/request";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

type Payload = {
  email?: string;
  password?: string;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store"
};

export const dynamic = "force-dynamic";

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

function mapPasswordLoginMessage(message: string | undefined) {
  const normalized = (message ?? "").toLowerCase();
  if (
    normalized.includes("invalid login") ||
    normalized.includes("invalid credentials") ||
    normalized.includes("email not confirmed")
  ) {
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  }
  return "Nao foi possivel acessar sua conta agora. Tente novamente em instantes.";
}

export async function POST(request: NextRequest) {
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
        error: "rate_limited",
        message: "Muitas tentativas em sequencia. Aguarde alguns minutos antes de tentar novamente."
      },
      {
        status: 429,
        headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined
      }
    );
  }

  const { applyCookies, supabase } = createSupabaseRouteClient(request);
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
        error: "invalid_credentials",
        message: mapPasswordLoginMessage(error?.message)
      },
      { status: 401 }
    );
  }

  return applyCookies(
    json({
      ok: true,
      userId: data.user.id,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      }
    })
  );
}
