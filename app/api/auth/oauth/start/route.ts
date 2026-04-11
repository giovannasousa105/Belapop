import { NextResponse } from "next/server";

import { getPublicEnvServer } from "@/lib/env.server";

type Audience = "customer" | "partner";
type OAuthProvider = "google" | "facebook";

function normalizeAudience(value: string | null): Audience {
  return value === "partner" ? "partner" : "customer";
}

function normalizeProvider(value: string | null): OAuthProvider | null {
  if (value === "google" || value === "facebook") return value;
  return null;
}

function buildLoginFallback(origin: string, audience: Audience, reason: string) {
  const params = new URLSearchParams({
    tab: audience,
    oauth_fallback: "1",
    oauth_error: reason
  });
  return `${origin}/login?${params.toString()}`;
}

function isNumeric(value: string | null | undefined) {
  return /^\d+$/.test((value ?? "").trim());
}

async function resolveFacebookAuthUrl(authorizeUrl: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(authorizeUrl.toString(), {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal
    });

    return {
      status: response.status,
      location: response.headers.get("location")
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const audience = normalizeAudience(requestUrl.searchParams.get("audience"));
  const provider = normalizeProvider(requestUrl.searchParams.get("provider"));
  const origin = requestUrl.origin;

  if (!provider) {
    return NextResponse.redirect(
      buildLoginFallback(origin, audience, "oauth_provider_invalid"),
      { status: 302 }
    );
  }

  let supabaseUrl: string;
  try {
    ({ NEXT_PUBLIC_SUPABASE_URL: supabaseUrl } = getPublicEnvServer());
  } catch {
    return NextResponse.redirect(
      buildLoginFallback(origin, audience, "oauth_env_missing"),
      { status: 302 }
    );
  }

  const authorizeUrl = new URL("/auth/v1/authorize", supabaseUrl);
  authorizeUrl.searchParams.set("provider", provider);
  authorizeUrl.searchParams.set(
    "redirect_to",
    `${origin}/auth/callback?audience=${audience}`
  );

  if (provider === "facebook") {
    try {
      const result = await resolveFacebookAuthUrl(authorizeUrl);
      if (!result.location) {
        return NextResponse.redirect(
          buildLoginFallback(origin, audience, "facebook_start_failed"),
          { status: 302 }
        );
      }

      try {
        const locationUrl = new URL(result.location);
        const isFacebookDialog = locationUrl.hostname.includes("facebook.com");
        const clientId = locationUrl.searchParams.get("client_id");

        if (isFacebookDialog && !isNumeric(clientId)) {
          return NextResponse.redirect(
            buildLoginFallback(origin, audience, "facebook_provider_misconfigured"),
            { status: 302 }
          );
        }
      } catch {
        return NextResponse.redirect(
          buildLoginFallback(origin, audience, "facebook_start_failed"),
          { status: 302 }
        );
      }

      return NextResponse.redirect(result.location, { status: 302 });
    } catch {
      return NextResponse.redirect(
        buildLoginFallback(origin, audience, "facebook_start_failed"),
        { status: 302 }
      );
    }
  }

  return NextResponse.redirect(authorizeUrl.toString(), { status: 302 });
}
