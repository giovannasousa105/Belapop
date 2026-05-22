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

function tagCriticalStripeErrors(event: ErrorEvent): ErrorEvent | null {
  const isStripeError = event.exception?.values?.some((exception) => {
    const value = exception.value ?? "";
    return value.includes("Stripe") || value.includes("webhook");
  });

  if (isStripeError) {
    event.level = "fatal";
    event.tags = { ...event.tags, critical: "stripe" };
  }

  if (event.request?.headers) {
    delete event.request.headers.authorization;
    delete event.request.headers.Authorization;
    delete event.request.headers.cookie;
    delete event.request.headers.Cookie;
  }

  if (event.request?.cookies) {
    delete event.request.cookies;
  }

  if (event.user?.email) {
    event.user.email = "[filtered]";
  }

  if (event.request?.url) {
    event.request.url = scrubUrl(event.request.url);
  }

  return event;
}

export function initSentryServer(): void {
  Sentry.init({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    enabled:
      process.env.NODE_ENV === "production" &&
      Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
    beforeSend: tagCriticalStripeErrors
  });
}
