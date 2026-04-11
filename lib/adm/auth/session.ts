import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ADM_AUTH_COOKIE_NAME,
  ADM_AUTH_COOKIE_TTL_SECONDS,
  ADM_AUTH_SECRET
} from "@/lib/adm/auth/config";
import type { AdmSessionPayload } from "@/types/adm/auth";

type AdmCookieReadResult = {
  payload: AdmSessionPayload | null;
  reason: "valid" | "missing" | "expired" | "invalid";
};

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const decode = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const sign = (value: string) =>
  createHmac("sha256", ADM_AUTH_SECRET).update(value).digest("base64url");

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
};

const buildCookieOptions = (expires: Date) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  expires,
  path: "/"
});

export function issueAdmSession(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdmSessionPayload = {
    sub: userId,
    iat: now,
    exp: now + ADM_AUTH_COOKIE_TTL_SECONDS
  };
  const serializedPayload = encode(JSON.stringify(payload));
  const signature = sign(serializedPayload);
  const token = `${serializedPayload}.${signature}`;

  return {
    token,
    expiresAt: new Date(payload.exp * 1000),
    payload
  };
}

export async function readAdmSessionCookie(): Promise<AdmCookieReadResult> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADM_AUTH_COOKIE_NAME)?.value;

  if (!rawToken) {
    return { payload: null, reason: "missing" };
  }

  const [serializedPayload, providedSignature] = rawToken.split(".");
  if (!serializedPayload || !providedSignature) {
    return { payload: null, reason: "invalid" };
  }

  const expectedSignature = sign(serializedPayload);
  if (!safeEqual(providedSignature, expectedSignature)) {
    return { payload: null, reason: "invalid" };
  }

  try {
    const payload = JSON.parse(decode(serializedPayload)) as AdmSessionPayload;
    if (!payload.sub || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return { payload: null, reason: "expired" };
    }

    return { payload, reason: "valid" };
  } catch {
    return { payload: null, reason: "invalid" };
  }
}

export function attachAdmSessionCookie(response: NextResponse, userId: string) {
  const { token, expiresAt } = issueAdmSession(userId);
  response.cookies.set(ADM_AUTH_COOKIE_NAME, token, buildCookieOptions(expiresAt));
  return response;
}

export function clearAdmSessionCookie(response: NextResponse) {
  response.cookies.set(ADM_AUTH_COOKIE_NAME, "", {
    ...buildCookieOptions(new Date(0)),
    maxAge: 0
  });
  return response;
}
