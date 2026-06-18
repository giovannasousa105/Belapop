import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { expirarReservasVencidas } from "@/lib/lote/loteService";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/stripeClient";

export const runtime = "nodejs";

const BodySchema = z.object({
  session_id: z.string().min(1).max(128),
  user_id:    z.string().uuid().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 422 });
  }

  const { session_id, user_id } = parsed.data;
  const supabase = getSupabaseAdminClient();

  // 1. Buscar drop + item pelo slug
  const { data: drop, error: dropError } = await supabase
    .from("drops")
    .select("id, title, status, opens_at, closes_at, canal")
    .eq("slug", slug)
    .maybeSingle();

  if (dropError || !drop) {
    return NextResponse.json({ error: "Drop não encontrado." }, { status: 404 });
  }

  if (drop.status !== "live") {
    const msg = drop.status === "sold_out" ? "sold_out" : "drop_unavailable";
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  const now = new Date();
  if (drop.opens_at && new Date(drop.opens_at) > now) {
    return NextResponse.json({ error: "drop_not_open_yet" }, { status: 409 });
  }
  if (drop.closes_at && new Date(drop.closes_at) < now) {
    return NextResponse.json({ error: "drop_closed" }, { status: 409 });
  }

  const { data: item, error: itemError } = await supabase
    .from("drop_items")
    .select("id, lote_id, drop_price_cents, max_quantity, sold_quantity")
    .eq("drop_id", drop.id)
    .maybeSingle();

  if (itemError || !item || !item.lote_id) {
    return NextResponse.json({ error: "Produto do drop não configurado." }, { status: 409 });
  }

  if (item.sold_quantity >= item.max_quantity) {
    return NextResponse.json({ error: "sold_out" }, { status: 409 });
  }

  // Libera reservas expiradas antes de verificar disponibilidade.
  // Substitui cron horário (bloqueado no Hobby) — cada checkout aciona a limpeza.
  await expirarReservasVencidas(20).catch(() => {});

  // TTL de 60min: limitado pelo plano Hobby do Vercel (cron mínimo = 1h)
  // Para TTL de 30min, fazer upgrade para Pro e restaurar p_expira_minutos: 30
  const { data: reservaData, error: reservaError } = await supabase.rpc("fn_reservar_lote", {
    p_lote_id:       item.lote_id,
    p_session_id:    session_id,
    p_quantidade:    1,
    p_user_id:       user_id ?? null,
    p_expira_minutos: 60,
  });

  if (reservaError) {
    return NextResponse.json({ error: "Erro ao reservar estoque." }, { status: 500 });
  }

  const reserva = reservaData as {
    ok: boolean;
    error?: string;
    reserva_id?: string;
    expira_em?: string;
  };

  if (!reserva.ok) {
    const statusMap: Record<string, number> = {
      lote_not_found:         404,
      lote_not_available:     409,
      quantidade_insuficiente: 409,
    };
    return NextResponse.json(
      { error: reserva.error ?? "estoque_indisponivel" },
      { status: statusMap[reserva.error ?? ""] ?? 409 }
    );
  }

  // 3. Criar Payment Intent no Stripe
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Configuração de pagamento indisponível." }, { status: 503 });
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.create({
      amount:   item.drop_price_cents,
      currency: "brl",
      metadata: {
        drop_id:         drop.id,
        drop_item_id:    item.id,
        lote_id:         item.lote_id,
        drop_price_cents: String(item.drop_price_cents),
        drop_slug:       slug,
        source:          "drop_checkout",
      },
    });
  } catch (stripeErr) {
    // Reverter reserva em caso de falha do Stripe
    await supabase
      .from("lote_reservas")
      .update({ status: "CANCELADA" })
      .eq("id", reserva.reserva_id!)
      .eq("status", "ATIVA");

    await supabase.rpc("fn_restaurar_qtd_lote", {
      p_lote_id:   item.lote_id,
      p_quantidade: 1,
    });

    const errMsg = stripeErr instanceof Error ? stripeErr.message : "Erro no pagamento.";
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }

  // 4. Linkar o Payment Intent à reserva
  await supabase
    .from("lote_reservas")
    .update({ payment_intent_id: pi.id })
    .eq("id", reserva.reserva_id!);

  return NextResponse.json({
    client_secret: pi.client_secret,
    price_cents:   item.drop_price_cents,
    expira_em:     reserva.expira_em,
    reserva_id:    reserva.reserva_id,
  });
}
