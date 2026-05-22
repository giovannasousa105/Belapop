import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { resgatar } from "@/lib/popclub/creditsEngine";

export const runtime = "nodejs";

const resgatarSchema = z.object({
  pontos: z
    .number()
    .int("Pontos devem ser um número inteiro.")
    .min(100, "Mínimo de 100 pontos para resgate.")
    .refine((n) => n % 100 === 0, "Pontos devem ser múltiplos de 100."),
  pedido_id: z.string().uuid().optional(),
});

// ─── POST /api/popclub/resgatar ───────────────────────────────────────────────
//
// Converte pontos em crédito BRL com Stripe Coupon.
// Stripe coupon criado antes de gravar no banco — sem coupon preso sem crédito.

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticada." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = resgatarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  try {
    const resultado = await resgatar({
      user_id: user.id,
      pontos: parsed.data.pontos,
      pedido_id: parsed.data.pedido_id,
    });

    return NextResponse.json({
      ok: true,
      credito_id: resultado.credito_id,
      valor_brl: resultado.valor_brl,
      stripe_coupon_id: resultado.stripe_coupon_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao resgatar pontos.";
    const status = message.includes("insuficiente") || message.includes("Mínimo") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
