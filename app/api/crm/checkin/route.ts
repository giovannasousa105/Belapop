import { NextRequest, NextResponse } from "next/server";

import { verificarTokenCheckin } from "@/lib/crm/flows/pele";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://belapopoficial.com.br";

/**
 * GET /api/crm/checkin?envio_id=...&resposta=1-5&token=...
 *
 * Acionado por clique no e-mail — registra nota de pele sem abrir o app.
 * token: HMAC-SHA256(envio_id:nota)[0..16] — impede forjamento.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const envio_id    = searchParams.get("envio_id") ?? "";
  const respostaRaw = searchParams.get("resposta");
  const token       = searchParams.get("token") ?? "";

  const resposta = Number(respostaRaw);
  if (!envio_id || !respostaRaw || isNaN(resposta) || resposta < 1 || resposta > 5) {
    return NextResponse.redirect(new URL("/conta?erro=checkin_invalido", req.url));
  }

  // Verificar HMAC — impede forjamento de respostas
  if (token && !verificarTokenCheckin(envio_id, resposta, token)) {
    return NextResponse.redirect(new URL("/conta?erro=checkin_token_invalido", req.url));
  }

  const admin = getSupabaseAdminClient();

  const { data: envio } = await admin
    .from("crm_envios")
    .select("id, user_id, status, fluxo")
    .eq("id", envio_id)
    .maybeSingle();

  if (!envio || envio.fluxo !== "CHECKIN_SEMANAL") {
    return NextResponse.redirect(new URL("/conta?erro=checkin_invalido", req.url));
  }

  // Idempotência — se já clicado, redirecionar sem re-processar
  if (envio.status === "CLICADO") {
    return NextResponse.redirect(new URL("/conta?checkin=ja_respondido", req.url));
  }

  await admin
    .from("crm_envios")
    .update({ status: "CLICADO" })
    .eq("id", envio_id);

  if (envio.user_id) {
    try {
      await admin.from("skin_checkins").insert({
        user_id:   envio.user_id,
        nota:      resposta,
        origem:    "email",
        envio_id,
        criado_em: new Date().toISOString(),
      });
    } catch {
      // graceful — não bloquear redirect
    }
  }

  const labels: Record<number, string> = {
    5: "Ótima", 4: "Boa", 3: "Normal", 2: "Sensível", 1: "Com irritação",
  };
  const label = labels[resposta] ?? "registrada";

  // Nota baixa → sugerir novo scan
  const destino =
    resposta <= 2
      ? `${SITE_URL}/skin-scan?checkin=alerta`
      : `${SITE_URL}/conta/pele?checkin=ok&nota=${resposta}`;

  return new NextResponse(
    `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="2; url=${destino}">
  <title>Check-in registrado</title>
  <style>body{font-family:system-ui,sans-serif;text-align:center;padding:48px 16px;color:#1e1e1e}</style>
</head>
<body>
  <p style="font-size:18px">Resposta <strong>${label}</strong> registrada.</p>
  <p style="color:#888;font-size:14px">Redirecionando…</p>
  <p><a href="${destino}">Clique aqui se não for redirecionada</a></p>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
