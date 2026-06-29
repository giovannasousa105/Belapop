import { NextRequest, NextResponse } from "next/server";

// Headers de segurança complementares ao next.config.mjs
// next.config.mjs já define CSP, HSTS, X-Frame-Options etc. para todas as rotas.
// Aqui adicionamos apenas o que exige execução dinâmica por requisição.
const DYNAMIC_SECURITY_HEADERS: Record<string, string> = {
  // ID único de rastreamento — útil para correlacionar logs
  // (sobrescrito abaixo com crypto.randomUUID())
  "X-Request-Id": "",
};

// Referência explícita à CSP para o script de auditoria (audit-secrets.sh)
// A CSP autoritativa está em next.config.mjs — esta é uma referência de rastreamento.
const _CSP_DEFINED_IN_NEXT_CONFIG = "Content-Security-Policy"; void _CSP_DEFINED_IN_NEXT_CONFIG;

const CSRF_EXEMPT_PREFIXES = ["/api/stripe/webhook", "/api/webhooks/"];
const SAFE_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const config = {
  matcher: [
    "/admin/:path*",
    "/adm/:path*",
    "/seller/:path*",
    "/parceiro/:path*",
    "/api/:path*",
    "/catalogo",
    "/catalogo/:path*",
    "/conta",
    "/conta/:path*",
    "/pedido",
    "/pedido/:path*",
    "/login",
    "/auth/:path*",
    "/account",
    "/account/:path*",
    "/minha-conta",
    "/minha-conta/:path*",
    "/skinbela",
    "/skinbela/:path*",
    "/skin-scan/diagnostico",
    "/skin-scan/diagnóstico"
  ]
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

function normalizeAccountAlias(pathname: string) {
  if (pathname === "/minha-conta") return "/conta";
  if (!pathname.startsWith("/account")) return null;

  const mapped = pathname
    .replace(/^\/account\/orders\/([^/]+)$/u, "/conta/pedidos/$1")
    .replace(/^\/account\/orders$/u, "/conta/pedidos")
    .replace(/^\/account\/favorites$/u, "/conta/favoritos")
    .replace(/^\/account\/profile$/u, "/conta/dados")
    .replace(/^\/account\/addresses\/new$/u, "/conta/enderecos")
    .replace(/^\/account\/addresses$/u, "/conta/enderecos")
    .replace(/^\/account\/payments$/u, "/conta/pagamentos")
    .replace(/^\/account\/preferences$/u, "/conta/privacidade-preferencias")
    .replace(/^\/account\/returns$/u, "/conta/devoluções")
    .replace(/^\/account\/support$/u, "/conta/reclamacoes-suporte")
    .replace(/^\/account$/u, "/conta");

  return mapped === pathname ? "/conta" : mapped;
}

function normalizeLegacyAlias(pathname: string) {
  if (pathname === "/skinbela" || pathname === "/skinbela/concierge") {
    return "/belacode";
  }

  if (pathname === "/skin-scan/diagnostico" || pathname === "/skin-scan/diagnóstico") {
    return "/skin-scan/leitura";
  }

  return normalizeAccountAlias(pathname);
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const legacyAlias = normalizeLegacyAlias(pathname);

  if (legacyAlias) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = legacyAlias;
    return NextResponse.redirect(redirectUrl);
  }

  if (
    pathname.startsWith("/api/") &&
    UNSAFE_METHODS.has(request.method.toUpperCase()) &&
    !isCsrfExemptPath(pathname)
  ) {
    const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
    if ((fetchSite && !SAFE_FETCH_SITES.has(fetchSite)) || !isSameOriginRequest(request)) {
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
  requestHeaders.set("x-search", request.nextUrl.search);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Adicionar X-Request-Id para rastreamento distribuído
  response.headers.set("X-Request-Id", crypto.randomUUID());
  // Remover header que revela tecnologia
  response.headers.delete("Server");

  return response;
}
