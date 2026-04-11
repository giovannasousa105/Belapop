import type { NextResponse } from "next/server";

export const ACTIVE_SELLER_COOKIE = "bp_active_seller";
const ACTIVE_SELLER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const normalizeActiveSellerId = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(normalized)) return null;
  return normalized;
};

const buildActiveSellerCookieOptions = (maxAge: number) => ({
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge
});

export const setActiveSellerCookie = (response: NextResponse, sellerId: string) => {
  response.cookies.set(
    ACTIVE_SELLER_COOKIE,
    sellerId,
    buildActiveSellerCookieOptions(ACTIVE_SELLER_COOKIE_MAX_AGE_SECONDS)
  );
  return response;
};

export const clearActiveSellerCookie = (response: NextResponse) => {
  response.cookies.set(ACTIVE_SELLER_COOKIE, "", buildActiveSellerCookieOptions(0));
  return response;
};
