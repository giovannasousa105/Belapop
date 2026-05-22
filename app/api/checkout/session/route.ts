import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { posthogServer } from "@/lib/analytics/posthog";
import { captureError } from "@/lib/analytics/sentry";
import { createCheckoutSession } from "@/lib/stripe/createCheckoutSession";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SessionRequestBody = {
  lote_id: string;
  produto_id: string;
  quantidade: number;
  reserva_id: string;
};

export async function POST(request: NextRequest) {
  // Get optional authenticated user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Require belapop_anon_id — set by CartProvider on first load
  const cookieStore = await cookies();
  const sessionBp = cookieStore.get("belapop_anon_id")?.value ?? "";

  if (!sessionBp) {
    return NextResponse.json(
      { error: "Sessão anônima ausente. Recarregue a página e tente novamente." },
      { status: 400 }
    );
  }

  let body: SessionRequestBody;
  try {
    body = (await request.json()) as SessionRequestBody;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const { lote_id, produto_id, quantidade, reserva_id } = body;

  if (!lote_id || typeof lote_id !== "string") {
    return NextResponse.json({ error: "lote_id obrigatório." }, { status: 400 });
  }
  if (!produto_id || typeof produto_id !== "string") {
    return NextResponse.json({ error: "produto_id obrigatório." }, { status: 400 });
  }
  if (!reserva_id || typeof reserva_id !== "string") {
    return NextResponse.json({ error: "reserva_id obrigatório." }, { status: 400 });
  }

  const qty = Number(quantidade);
  if (!Number.isInteger(qty) || qty < 1) {
    return NextResponse.json({ error: "quantidade deve ser inteiro positivo." }, { status: 400 });
  }

  const result = await createCheckoutSession({
    lote_id,
    produto_id,
    quantidade: qty,
    reserva_id,
    user_id: user?.id ?? null,
    customer_email: user?.email ?? null,
    session_bp: sessionBp,
  });

  if (!result.ok) {
    const statusMap: Record<string, number> = {
      LOTE_ENCERRADO: 409,
      RESERVA_INVALIDA: 409,
      ESTOQUE_ESGOTADO: 409,
      ERRO: 500,
    };
    return NextResponse.json(
      { error: result.erro },
      { status: statusMap[result.code] ?? 500 }
    );
  }

  try {
    await posthogServer.capture({
      distinctId: user?.id ?? `anon_${sessionBp}`,
      event: "checkout_aberto",
      properties: {
        produto_id,
        valor_cents: result.valor_cents,
        tem_credito: false,
        desconto_pct: 0
      }
    });
  } catch (error) {
    captureError(error, {
      route: "/api/checkout/session",
      etapa: "posthog_checkout_aberto",
      produto_id
    });
  } finally {
    await posthogServer.shutdown();
  }

  return NextResponse.json({
    url: result.url,
    session_id: result.session_id,
    expira_em: result.expira_em,
  });
}
