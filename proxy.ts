import { NextRequest, NextResponse } from "next/server";

const CSRF_EXEMPT_PREFIXES = ["/api/stripe/webhook", "/api/webhooks/"];
const SAFE_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const config = {
  matcher: ["/admin/:path*", "/adm/:path*", "/seller/:path*", "/parceiro/:path*", "/api/:path*", "/catalogo"]
};

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) return true;

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

function isCsrfExemptPath(pathname: string) {
  return CSRF_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/api/") &&
    UNSAFE_METHODS.has(request.method.toUpperCase()) &&
    !isCsrfExemptPath(pathname)
  ) {
    const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
    if (
      (fetchSite && !SAFE_FETCH_SITES.has(fetchSite)) ||
      !isSameOriginRequest(request)
    ) {
      return NextResponse.json(
        { error: "Cross-site requests are not allowed." },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders }
  });
}
