"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import { posthogConsentidoNoClient } from "@/lib/analytics/consent";

type CookieConsentDetail = {
  analytics?: boolean;
  performance?: boolean;
};

type CookieConsentEvent = CustomEvent<CookieConsentDetail>;

function safeConsent(): boolean {
  try {
    return posthogConsentidoNoClient();
  } catch {
    return false;
  }
}

export function PosthogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    const analytics = safeConsent();

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      opt_out_capturing_by_default: !analytics,
      ip: false,
      person_profiles: "identified_only",
      loaded: (client) => {
        if (process.env.NODE_ENV === "development") client.debug();
      }
    });

    const optIn = () => {
      posthog.opt_in_capturing();
    };

    const handleConsentChange = (event: Event) => {
      const detail = (event as CookieConsentEvent).detail;
      const consented = Boolean(detail?.analytics ?? detail?.performance ?? safeConsent());
      if (consented) {
        posthog.opt_in_capturing();
      } else {
        posthog.opt_out_capturing();
      }
    };

    window.addEventListener("analytics_consent_given", optIn);
    window.addEventListener("belapop:cookie-consent-changed", handleConsentChange);

    return () => {
      window.removeEventListener("analytics_consent_given", optIn);
      window.removeEventListener("belapop:cookie-consent-changed", handleConsentChange);
    };
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
