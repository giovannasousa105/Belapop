import "server-only";

const PRODUCTION_ORIGIN = "https://belapopoficial.com.br";

const sanitizeOrigin = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
};

const isLocalOrigin = (origin: string) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
};

export function resolveRequestOrigin(request: Request) {
  const requestOrigin = sanitizeOrigin(request.url) ?? PRODUCTION_ORIGIN;
  if (isLocalOrigin(requestOrigin)) return requestOrigin;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const forwardedOrigin = forwardedHost ? sanitizeOrigin(`${forwardedProto}://${forwardedHost}`) : null;
  if (forwardedOrigin && !isLocalOrigin(forwardedOrigin)) return forwardedOrigin;

  const configuredOrigin =
    sanitizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    sanitizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    sanitizeOrigin(process.env.APP_URL);

  return configuredOrigin ?? requestOrigin;
}

export function withOrigin(origin: string, path: string) {
  return new URL(path, origin).toString();
}
