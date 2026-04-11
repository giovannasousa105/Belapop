import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type SignatureVerificationResult =
  | { ok: true }
  | { ok: false; reason: string };

type VerifyInput = {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string | undefined;
  nowMs?: number;
  toleranceSeconds?: number;
};

const DEFAULT_TOLERANCE_SECONDS = 5 * 60;

const parseTimestampMs = (timestampHeader: string | null): number | null => {
  if (!timestampHeader) return null;

  const numeric = Number(timestampHeader);
  if (Number.isFinite(numeric)) {
    if (numeric > 1_000_000_000_000) return numeric;
    if (numeric > 1_000_000_000) return numeric * 1000;
  }

  const parsed = Date.parse(timestampHeader);
  if (Number.isFinite(parsed)) return parsed;
  return null;
};

const normalizeSignature = (signatureHeader: string | null) => {
  if (!signatureHeader) return "";
  return signatureHeader.replace(/^sha256=/i, "").trim().toLowerCase();
};

const safeCompareHex = (expectedHex: string, providedHex: string) => {
  const expectedBuffer = Buffer.from(expectedHex, "hex");
  const providedBuffer = Buffer.from(providedHex, "hex");
  if (expectedBuffer.length === 0 || providedBuffer.length === 0) return false;
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
};

export const verifyWebhookSignature = ({
  rawBody,
  signatureHeader,
  timestampHeader,
  secret,
  nowMs = Date.now(),
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS
}: VerifyInput): SignatureVerificationResult => {
  if (!secret) return { ok: false, reason: "missing_secret" };

  const timestampMs = parseTimestampMs(timestampHeader);
  if (!timestampMs) return { ok: false, reason: "invalid_timestamp" };

  const ageMs = Math.abs(nowMs - timestampMs);
  if (ageMs > toleranceSeconds * 1000) {
    return { ok: false, reason: "timestamp_outside_tolerance" };
  }

  const providedSignature = normalizeSignature(signatureHeader);
  if (!providedSignature) return { ok: false, reason: "missing_signature" };

  const signedPayload = `${timestampHeader}.${rawBody}`;
  const expectedSignature = createHmac("sha256", secret).update(signedPayload).digest("hex");

  if (!safeCompareHex(expectedSignature, providedSignature)) {
    return { ok: false, reason: "signature_mismatch" };
  }

  return { ok: true };
};
