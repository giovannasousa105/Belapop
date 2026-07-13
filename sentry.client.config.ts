import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent } from "@sentry/core";

const sensitiveSearchParams = ["scan_id", "reserva_id", "token"];

// Campos de imagem, landmarks e features brutas — nunca devem chegar ao Sentry
const BIOMETRIC_FIELDS = new Set([
  "image", "imageData", "image_base64", "imageBase64",
  "image_url", "imageUrl", "pixels", "rawPixels",
  "bitmap", "canvas", "frame", "videoFrame",
  "landmarks", "keypoints", "faceLandmarks", "faceKeypoints",
  "faceGeometry", "faceBox", "faceBoundingBox",
  "biometricTemplate", "faceDescriptor", "faceEmbedding", "embedding",
  "feature_vector", "scores",
]);

function scrubBiometric(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(scrubBiometric);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = BIOMETRIC_FIELDS.has(k) ? "[biometric-filtered]" : scrubBiometric(v);
  }
  return out;
}

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

  // Scrub biometric/image data from request body and extra context
  if (event.request?.data) {
    event.request.data = scrubBiometric(event.request.data) as typeof event.request.data;
  }
  if (event.extra) {
    event.extra = scrubBiometric(event.extra) as typeof event.extra;
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
