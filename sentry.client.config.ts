import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent } from "@sentry/core";

const sensitiveSearchParams = ["scan_id", "reserva_id", "token"];

function scrubUrl(value: string | undefined): string | undefined {
  if (!value) return value;

  try {
    const url = new URL(value);
    sensitiveSearchParams.forEach((key) => url.searchParams.delete(key));
    return url.toString();
  } catch {
    return value;
  }
}

function scrubEvent(event: ErrorEvent): ErrorEvent | null {
  if (event.request?.cookies) {
    delete event.request.cookies;
  }

  if (event.request?.headers) {
    delete event.request.headers.authorization;
    delete event.request.headers.Authorization;
    delete event.request.headers.cookie;
    delete event.request.headers.Cookie;
  }

  if (event.user?.email) {
    event.user.email = "[filtered]";
  }

  if (event.request?.url) {
    event.request.url = scrubUrl(event.request.url);
  }

  return event;
}

export function initSentryClient(): void {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    release:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      "local",
    enabled: process.env.NODE_ENV === "production" && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      /^Network request failed/,
      /^Failed to fetch/,
      /^Load failed/,
      "AbortError"
    ],
    beforeSend: scrubEvent,
    integrations: [
      Sentry.replayIntegration({
        maskAllInputs: true,
        maskAllText: false,
        blockAllMedia: false
      })
    ]
  });
}
