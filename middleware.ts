import { type NextRequest, NextResponse } from "next/server";

// Cookie name must match ADM_AUTH_COOKIE_NAME in lib/adm/auth/config.ts
const ADM_COOKIE = "belapop_adm_session";

// Paths that do NOT require an ADM session
const ADM_PUBLIC_PAGES = new Set(["/adm/login"]);
const ADM_PUBLIC_API = new Set(["/api/adm/auth/login"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Protect /adm/** pages ────────────────────────────────────────────────
  if (pathname.startsWith("/adm") && !ADM_PUBLIC_PAGES.has(pathname)) {
    const cookie = request.cookies.get(ADM_COOKIE);
    if (!cookie?.value) {
      const loginUrl = new URL("/adm/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      loginUrl.searchParams.set("reason", "missing");
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Protect /api/adm/** endpoints ───────────────────────────────────────
  if (pathname.startsWith("/api/adm/") && !ADM_PUBLIC_API.has(pathname)) {
    const cookie = request.cookies.get(ADM_COOKIE);
    if (!cookie?.value) {
      return new NextResponse(
        JSON.stringify({ error: "Autenticação necessária." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // ── Security headers for all responses ──────────────────────────────────
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: [
    "/adm/:path*",
    "/api/adm/:path*"
  ]
};
