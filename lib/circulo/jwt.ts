import "server-only";

// JWT HMAC simples para links de unsubscribe LGPD.
// Usa Web Crypto API (disponível em Node 18+/Edge) — sem dependências externas.

const secret = process.env.CIRCULO_JWT_SECRET ?? "belapop-circulo-local-dev-secret-change-in-prod";
const enc = new TextEncoder();
const dec = new TextDecoder();

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const ab = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(ab);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Gera token de unsubscribe para um membro do Círculo. TTL padrão: 365 dias. */
export async function signUnsubscribeToken(memberId: string, ttlSeconds = 365 * 24 * 3600): Promise<string> {
  const key = await getKey();
  const payload = { sub: memberId, exp: Math.floor(Date.now() / 1000) + ttlSeconds, aud: "circulo_unsub" };
  const header = base64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body   = base64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(sig)}`;
}

/** Verifica e retorna o memberId do token. Lança erro se inválido ou expirado. */
export async function verifyUnsubscribeToken(token: string): Promise<string> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("INVALID_TOKEN");
  const [header, body, sig] = parts as [string, string, string];

  const key = await getKey();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64url(sig),
    enc.encode(`${header}.${body}`)
  );
  if (!valid) throw new Error("INVALID_SIGNATURE");

  const payload = JSON.parse(dec.decode(fromBase64url(body))) as {
    sub?: string;
    exp?: number;
    aud?: string;
  };

  if (payload.aud !== "circulo_unsub") throw new Error("INVALID_AUDIENCE");
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error("TOKEN_EXPIRED");
  if (!payload.sub) throw new Error("MISSING_SUBJECT");

  return payload.sub;
}

/** Constrói URL de unsubscribe completa. */
export function buildUnsubscribeUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br").replace(/\/+$/, "");
  return `${base}/api/círculo/unsubscribe?token=${encodeURIComponent(token)}`;
}
