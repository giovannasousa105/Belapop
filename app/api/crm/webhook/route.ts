import { NextRequest, NextResponse } from "next/server";
import { processarResendEvent, type ResendEventType } from "@/lib/crm/trackingWebhook";
import { redis } from "@/lib/crm/deliveryQueue";

export const runtime = "nodejs";

// Resend webhook — verificar assinatura via svix-signature header
// https://resend.com/docs/dashboard/webhooks/introduction
export async function POST(req: NextRequest): Promise<NextResponse> {
  const svixId        = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (!secret || !svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing signature headers" }, { status: 400 });
  }

  // Leitura do body raw (necessária para verificação de assinatura)
  const rawBody = await req.text();

  // Verificação HMAC-SHA256 (Resend usa o formato svix)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  // svix-signature pode ter múltiplas assinaturas separadas por espaço
  const signatures = svixSignature.split(" ").map((s) => s.replace(/^v1,/, ""));
  let valid = false;
  for (const sig of signatures) {
    const sigBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(signedContent));
    if (ok) { valid = true; break; }
  }

  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let payload: { type: string; data: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const TRACKED_EVENTS: ResendEventType[] = [
    "email.delivered", "email.opened", "email.clicked",
    "email.bounced", "email.spam_complained",
  ];

  if (TRACKED_EVENTS.includes(payload.type as ResendEventType)) {
    try {
      await processarResendEvent(payload as Parameters<typeof processarResendEvent>[0], redis ?? undefined);
    } catch (err) {
      console.error("[crm/webhook] processarResendEvent error:", err);
      // Retornar 200 mesmo em erro interno — Resend não vai retentar eventos processados
    }
  }

  return NextResponse.json({ ok: true });
}
