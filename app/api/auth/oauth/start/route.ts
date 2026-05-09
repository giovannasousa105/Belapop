import { NextRequest, NextResponse } from "next/server";

import {
  buildAuthCallbackPath,
  buildLoginErrorHref,
  getAuthAudienceFallbackPath,
  normalizeAuthAudience,
  normalizeReturnTo
} from "@/lib/auth/redirects";
import { resolveRequestOrigin, withOrigin } from "@/lib/auth/serverRedirects";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

type OAuthProvider = "google" | "facebook";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store"
};

function normalizeProvider(value: string | null): OAuthProvider | null {
  if (value === "google" || value === "facebook") return value;
  return null;
}

const redirectWithNoStore = (url: string) =>
  NextResponse.redirect(url, {
    status: 302,
    headers: NO_STORE_HEADERS
  });

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const audience = normalizeAuthAudience(requestUrl.searchParams.get("audience"));
  const provider = normalizeProvider(requestUrl.searchParams.get("provider"));
  const returnTo = normalizeReturnTo(
    requestUrl.searchParams.get("returnTo"),
    getAuthAudienceFallbackPath(audience)
  );
  const origin = resolveRequestOrigin(request);

  if (!provider) {
    return redirectWithNoStore(
      withOrigin(origin, buildLoginErrorHref({ audience, reason: "oauth_provider_invalid", returnTo }))
    );
  }

  try {
    const { applyCookies, supabase } = createSupabaseRouteClient(request);
    const redirectTo = withOrigin(origin, buildAuthCallbackPath(audience, returnTo));
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true
      }
    });

    if (error || !data.url) {
      return redirectWithNoStore(
        withOrigin(origin, buildLoginErrorHref({ audience, reason: "oauth_start_failed", returnTo }))
      );
    }

    return applyCookies(redirectWithNoStore(data.url));
  } catch {
    return redirectWithNoStore(
      withOrigin(origin, buildLoginErrorHref({ audience, reason: "oauth_env_missing", returnTo }))
    );
  }
}
