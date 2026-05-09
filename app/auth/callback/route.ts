import { NextRequest, NextResponse } from "next/server";

import {
  buildAuthRedirectPath,
  buildLoginErrorHref,
  getAuthAudienceFallbackPath,
  normalizeAuthAudience,
  normalizeAuthFailureReason,
  normalizeReturnTo
} from "@/lib/auth/redirects";
import { resolveRequestOrigin, withOrigin } from "@/lib/auth/serverRedirects";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

export const dynamic = "force-dynamic";

const VALID_EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email"
]);

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store"
};

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && VALID_EMAIL_OTP_TYPES.has(value as EmailOtpType));
}

const redirectWithNoStore = (url: string) =>
  NextResponse.redirect(url, {
    status: 302,
    headers: NO_STORE_HEADERS
  });

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const audience = normalizeAuthAudience(requestUrl.searchParams.get("audience"));
  const returnTo = normalizeReturnTo(
    requestUrl.searchParams.get("returnTo") ?? requestUrl.searchParams.get("next"),
    getAuthAudienceFallbackPath(audience)
  );
  const origin = resolveRequestOrigin(request);
  const fail = (reason: string) =>
    redirectWithNoStore(
      withOrigin(origin, buildLoginErrorHref({ audience, reason: normalizeAuthFailureReason(reason), returnTo }))
    );

  const providerError =
    requestUrl.searchParams.get("error_code") ??
    requestUrl.searchParams.get("error") ??
    requestUrl.searchParams.get("error_description");

  if (providerError) {
    return fail(providerError);
  }

  try {
    const { applyCookies, supabase } = createSupabaseRouteClient(request);
    const code = requestUrl.searchParams.get("code");
    const tokenHash = requestUrl.searchParams.get("token_hash");
    const type = requestUrl.searchParams.get("type");

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return fail("oauth_session_exchange_failed");

      return applyCookies(redirectWithNoStore(withOrigin(origin, buildAuthRedirectPath(audience, returnTo))));
    }

    if (tokenHash && type) {
      if (!isEmailOtpType(type)) return fail("otp_type_invalid");

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type
      });
      if (error) return fail("otp_verification_failed");

      return applyCookies(redirectWithNoStore(withOrigin(origin, buildAuthRedirectPath(audience, returnTo))));
    }

    return fail("oauth_session_missing");
  } catch {
    return fail("oauth_session_exchange_failed");
  }
}
