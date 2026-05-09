import { NextRequest, NextResponse } from "next/server";

import { buildAuthCallbackPath, normalizeReturnTo } from "@/lib/auth/redirects";
import { resolveRequestOrigin, withOrigin } from "@/lib/auth/serverRedirects";
import { consumeRateLimit, getRetryAfterSeconds } from "@/lib/security/rateLimit";
import { getRequestIp } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

type Payload = {
  email?: string;
  name?: string;
  password?: string;
  returnTo?: string;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store"
};

export const dynamic = "force-dynamic";

const json = (
  body: Record<string, unknown>,
  init?: {
    headers?: Record<string, string>;
    status?: number;
  }
) =>
  NextResponse.json(body, {
    status: init?.status,
    headers: {
      ...NO_STORE_HEADERS,
      ...(init?.headers ?? {})
    }
  });

function mapSignupMessage(message: string | undefined) {
  const normalized = (message ?? "").toLowerCase();
  if (normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists")) {
    return "Este e-mail ja possui cadastro. Entre com sua senha ou recupere o acesso.";
  }
  if (normalized.includes("password")) {
    return "Use uma senha mais segura, com pelo menos 6 caracteres.";
  }
  return "Nao foi possivel criar sua conta agora. Tente novamente em instantes.";
}

export async function POST(request: NextRequest) {
  let payload: Payload;

  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json({ error: "invalid_payload", message: "Dados invalidos para criar a conta." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  const name = payload.name?.trim() ?? "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const returnTo = normalizeReturnTo(payload.returnTo, "/conta");

  if (!name || !email || !password) {
    return json(
      { error: "missing_fields", message: "Preencha nome, e-mail e senha para criar sua conta." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return json(
      { error: "weak_password", message: "Use uma senha com pelo menos 6 caracteres." },
      { status: 400 }
    );
  }

  const ipAddress = getRequestIp(request);
  const [emailRateLimit, ipRateLimit] = await Promise.all([
    consumeRateLimit({
      scope: "auth.signup.email",
      actorKey: email,
      windowSeconds: 10 * 60,
      limit: 5,
      blockSeconds: 15 * 60
    }),
    consumeRateLimit({
      scope: "auth.signup.ip",
      actorKey: ipAddress,
      windowSeconds: 10 * 60,
      limit: 10,
      blockSeconds: 15 * 60
    })
  ]);

  const blockedRateLimit = [emailRateLimit, ipRateLimit].find((result) => !result.allowed);
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
  const emailRedirectTo = withOrigin(
    resolveRequestOrigin(request),
    buildAuthCallbackPath("customer", returnTo)
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, role: "customer" },
      emailRedirectTo
    }
  });

  if (error || !data.user) {
    return json(
      {
        error: "signup_failed",
        message: mapSignupMessage(error?.message)
      },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();
  const { error: profileError } = await admin.from("profiles").upsert({
    email,
    full_name: name,
    id: data.user.id,
    role: "customer"
  });

  if (profileError) {
    return json(
      {
        error: "profile_sync_failed",
        message: "Sua conta foi criada, mas nao conseguimos preparar o perfil agora. Tente entrar novamente."
      },
      { status: 400 }
    );
  }

  if (!data.session?.access_token || !data.session.refresh_token) {
    return json(
      {
        error: "email_confirmation_required",
        message: "Enviamos um link para confirmar seu e-mail antes do primeiro acesso."
      },
      { status: 202 }
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
