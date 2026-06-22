"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useEffect, useState } from "react";

const CONSENT_STORAGE_NAME = "bp_cookie_consent";

type CookieConsentState = {
  performance?: boolean;
  analytics?: boolean;
};

function readPerformanceConsent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_NAME);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as CookieConsentState;
    return Boolean(parsed?.performance ?? parsed?.analytics);
  } catch {
    return false;
  }
}

export function VercelInsightsConsent() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readPerformanceConsent());

    const handleConsentChange = (event: Event) => {
      const detail = (event as CustomEvent<CookieConsentState>).detail;
      setEnabled(Boolean(detail?.performance ?? detail?.analytics ?? readPerformanceConsent()));
    };

    window.addEventListener("belapop:cookie-consent-changed", handleConsentChange);
    return () => {
      window.removeEventListener("belapop:cookie-consent-changed", handleConsentChange);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
