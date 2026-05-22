type ConsentPayload = {
  analytics?: boolean;
  performance?: boolean;
};

function hasAnalyticsConsent(payload: ConsentPayload | null): boolean {
  return Boolean(payload?.analytics ?? payload?.performance);
}

function parseConsent(raw: string | null): ConsentPayload | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ConsentPayload;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function posthogConsentidoNoClient(): boolean {
  if (typeof window === "undefined") return false;
  return hasAnalyticsConsent(parseConsent(window.localStorage.getItem("bp_cookie_consent")));
}
