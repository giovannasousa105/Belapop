const DEFAULT_LOGIN_TAB = "customer";

export type AuthAudience = "customer" | "partner";

export function normalizeReturnTo(value: string | null | undefined, fallback = "/conta") {
  const normalized = (value ?? "").trim();
  if (!normalized.startsWith("/")) return fallback;
  if (normalized.startsWith("//")) return fallback;
  if (normalized.startsWith("/api/")) return fallback;
  if (normalized.startsWith("/auth/")) return fallback;
  return normalized;
}

export function normalizeAuthAudience(value: string | null | undefined): AuthAudience {
  return value === "partner" ? "partner" : "customer";
}

export function getAuthAudienceFallbackPath(audience: AuthAudience) {
  return audience === "partner" ? "/parceiro" : "/conta";
}

export function buildLoginHref(returnTo: string, tab = DEFAULT_LOGIN_TAB) {
  const params = new URLSearchParams({
    tab,
    returnTo: normalizeReturnTo(returnTo)
  });
  return `/login?${params.toString()}`;
}

export function buildAuthCallbackPath(audience: AuthAudience, returnTo: string) {
  const params = new URLSearchParams({
    audience,
    returnTo: normalizeReturnTo(returnTo, getAuthAudienceFallbackPath(audience))
  });
  return `/auth/callback?${params.toString()}`;
}

export function buildAuthRedirectPath(audience: AuthAudience, returnTo: string) {
  const params = new URLSearchParams({
    audience,
    returnTo: normalizeReturnTo(returnTo, getAuthAudienceFallbackPath(audience))
  });
  return `/auth/redirect?${params.toString()}`;
}

export function normalizeAuthFailureReason(value: string | null | undefined) {
  const reason = (value ?? "").trim().toLowerCase();
  if (!reason) return "oauth_failed";
  if (reason.includes("access_denied") || reason.includes("cancel")) return "oauth_cancelled";
  if (reason.includes("session_exchange")) return "oauth_session_exchange_failed";
  if (reason.includes("session_missing")) return "oauth_session_missing";
  if (reason.includes("otp")) return reason.replace(/[^a-z0-9_-]/g, "_").slice(0, 80);
  return reason.replace(/[^a-z0-9_-]/g, "_").slice(0, 80) || "oauth_failed";
}

export function buildLoginErrorHref({
  audience,
  reason,
  returnTo
}: {
  audience: AuthAudience;
  reason: string;
  returnTo: string;
}) {
  const params = new URLSearchParams({
    tab: audience,
    returnTo: normalizeReturnTo(returnTo, getAuthAudienceFallbackPath(audience)),
    oauth_error: normalizeAuthFailureReason(reason)
  });
  return `/login?${params.toString()}`;
}
