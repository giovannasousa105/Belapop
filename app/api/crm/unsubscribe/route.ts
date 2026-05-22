import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FluxoEnum, GrupoEnum } from "@/lib/crm/crmTypes";

export const runtime = "nodejs";

// JWT mínimo para unsubscribe — sem dependência externa
// Token = base64url(header).base64url(payload).base64url(sig)
// payload: { sub: user_id, email, fluxo?: FluxoEnum, grupo?: GrupoEnum, iat: number }

const SECRET = process.env.CRM_UNSUBSCRIBE_SECRET ?? "";

async function verifyToken(token: string): Promise<{
  sub: string; email: string; fluxo?: FluxoEnum; grupo?: GrupoEnum
} | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
  );
  const sigBytes = Uint8Array.from(
    atob(sigB64!.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );
  const valid = await crypto.subtle.verify(
    "HMAC", key, sigBytes,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  if (!valid) return null;
  try {
    const payload = JSON.parse(atob(payloadB64!.replace(/-/g, "+").replace(/_/g, "/")));
    // Token válido por 30 dias
    if (Date.now() / 1000 - (payload.iat ?? 0) > 86400 * 30) return null;
    return payload;
  } catch {
    return null;
  }
}

// GET /api/crm/unsubscribe?token=... → página de confirmação (redirect para página client)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/conta/preferencias?erro=token_invalido", req.url));

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.redirect(new URL("/conta/preferencias?erro=token_expirado", req.url));

  // Redirecionar para página de confirmação com dados no query
  const url = new URL("/conta/preferencias", req.url);
  url.searchParams.set("unsub", "1");
  url.searchParams.set("email", payload.email);
  if (payload.fluxo)  url.searchParams.set("fluxo",  payload.fluxo);
  if (payload.grupo)  url.searchParams.set("grupo",  payload.grupo);
  url.searchParams.set("token", token);
  return NextResponse.redirect(url);
}

// POST /api/crm/unsubscribe — confirmar descadastro
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { token: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const payload = await verifyToken(body.token);
  if (!payload) return NextResponse.json({ error: "token_invalido" }, { status: 401 });

  const admin = getSupabaseAdminClient();

  // Inserir supressão — fluxo null = descadastro geral
  await admin.from("crm_supressoes").upsert({
    email: payload.email,
    user_id: payload.sub ?? null,
    motivo: "UNSUBSCRIBE",
    fluxo: payload.fluxo ?? null,
    ativo: true,
  }, { onConflict: "email, motivo, COALESCE(fluxo::text, '')", ignoreDuplicates: false });

  // Atualizar preferências se for descadastro por grupo
  if (payload.grupo && payload.sub) {
    const campoMap: Record<GrupoEnum, string> = {
      TRANSACIONAL: "aceita_transacional",
      LIFECYCLE:    "aceita_lifecycle",
      PELE:         "aceita_pele",
      EDITORIAL:    "aceita_editorial",
    };
    const campo = campoMap[payload.grupo];
    if (campo) {
      await admin.from("crm_preferencias").upsert({
        user_id: payload.sub,
        [campo]: false,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
  }

  return NextResponse.json({ ok: true, email: payload.email, fluxo: payload.fluxo ?? null });
}
