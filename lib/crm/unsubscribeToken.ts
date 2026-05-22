import type { GrupoEnum } from "./crmTypes";

const SECRET = process.env.CRM_UNSUBSCRIBE_SECRET ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://belapopoficial.com.br";

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function criarUnsubscribeToken(
  user_id: string,
  email: string,
  grupo?: GrupoEnum
): Promise<string> {
  if (!SECRET) return `${BASE_URL}/conta/preferencias`;

  const encoder = new TextEncoder();
  const header  = b64url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })).buffer as ArrayBuffer);
  const payload = b64url(encoder.encode(JSON.stringify({
    sub: user_id, email, grupo: grupo ?? null, iat: Math.floor(Date.now() / 1000),
  })).buffer as ArrayBuffer);

  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = b64url(await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${payload}`)));
  const token = `${header}.${payload}.${sig}`;

  return `${BASE_URL}/api/crm/unsubscribe?token=${token}`;
}
