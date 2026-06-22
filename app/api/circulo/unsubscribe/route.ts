import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/circulo/jwt";

export const runtime = "nodejs";

/**
 * GET /api/circulo/unsubscribe?token=<jwt>
 *
 * Link de opt-out LGPD enviado no e-mail de boas-vindas.
 * Redireciona para página de confirmação após processar.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br").replace(/\/+$/, "");

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/círculo/cancelar?status=invalid`);
  }

  let memberId: string;
  try {
    memberId = await verifyUnsubscribeToken(token);
  } catch (err) {
    console.warn("[círculo/unsubscribe] Token inválido:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(`${baseUrl}/círculo/cancelar?status=invalid`);
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from("circulo_members")
    .update({
      consent_marketing: false,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) {
    console.error("[círculo/unsubscribe] Erro ao desinscrever:", error.message);
    return NextResponse.redirect(`${baseUrl}/círculo/cancelar?status=error`);
  }

  return NextResponse.redirect(`${baseUrl}/círculo/cancelar?status=success`);
}
