import { NextResponse } from "next/server";

import { consumeRateLimit, getRetryAfterSeconds } from "@/lib/security/rateLimit";
import { getRequestIp } from "@/lib/security/request";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Payload = {
  accessToken?: string;
  refreshToken?: string;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store"
};

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { error: "Payload invalido." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const accessToken = payload.accessToken?.trim();
  const refreshToken = payload.refreshToken?.trim();

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: "Tokens de sessao ausentes." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const rateLimit = await consumeRateLimit({
    scope: "auth.sync_session.ip",
    actorKey: getRequestIp(request),
    windowSeconds: 10 * 60,
    limit: 60,
    blockSeconds: 5 * 60
  });

  if (!rateLimit.allowed) {
    const retryAfter = getRetryAfterSeconds(rateLimit);
    return NextResponse.json(
      { error: "Rate limit exceeded. Too many session sync attempts." },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          ...(retryAfter ? { "Retry-After": String(retryAfter) } : {})
        }
      }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS });
}
