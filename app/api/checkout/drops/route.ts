import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { expirarReservasVencidas } from "@/lib/lote/loteService";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/stripeClient";

export const runtime = "nodejs";

function resolveBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;
  return "https://belapopoficial.com.br";
}

const BodySchema = z.object({
  drop_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  // 1. Verificar autenticação
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // 2. Verificar se é membro ativo do Círculo
  const admin = getSupabaseAdminClient();
  const { data: member } = await admin
    .from("circulo_members")
    .select("id")
    .eq("email", user.email!)
    .is("unsubscribed_at", null)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "not_circulo_member" }, { status: 403 });
  }

  // 3. Validar payload
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 422 });
  }

  const { drop_id } = parsed.data;

  // 4. Buscar drop
  const { data: drop } = await admin
    .from("drops")
    .select("id, title, slug, status, opens_at, closes_at")
    .eq("id", drop_id)
    .maybeSingle();

  if (!drop) {
    return NextResponse.json({ error: "Drop não encontrado." }, { status: 404 });
  }

  if (drop.status !== "live") {
    const code = drop.status === "sold_out" ? "sold_out" : "drop_unavailable";
    return NextResponse.json({ error: code }, { status: 409 });
  }

  const now = new Date();
  if (drop.opens_at  && new Date(drop.opens_at)  > now) return NextResponse.json({ error: "drop_not_open_yet" },  { status: 409 });
  if (drop.closes_at && new Date(drop.closes_at) < now) return NextResponse.json({ error: "drop_closed" },        { status: 409 });

  // 5. Buscar item do drop
  const { data: item } = await admin
    .from("drop_items")
    .select("id, lote_id, drop_price_cents, max_quantity, sold_quantity, products(name, images)")
    .eq("drop_id", drop_id)
    .maybeSingle();

  if (!item || !item.lote_id) {
    return NextResponse.json({ error: "Produto do drop não configurado." }, { status: 409 });
  }

  if (item.sold_quantity >= item.max_quantity) {
    return NextResponse.json({ error: "sold_out" }, { status: 409 });
  }

  // 6. Criar reserva de lote
  await expirarReservasVencidas(20).catch(() => {});

  const { data: reservaData, error: reservaError } = await admin.rpc("fn_reservar_lote", {
    p_lote_id:        item.lote_id,
    p_session_id:     user.id,
    p_quantidade:     1,
    p_user_id:        user.id,
    p_expira_minutos: 60,
  });

  if (reservaError) {
    return NextResponse.json({ error: "Erro ao reservar estoque." }, { status: 500 });
  }

  const reserva = reservaData as { ok: boolean; error?: string; reserva_id?: string; expira_em?: string };

  if (!reserva.ok) {
    const statusMap: Record<string, number> = {
      lote_not_found: 404, lote_not_available: 409, quantidade_insuficiente: 409,
    };
    return NextResponse.json({ error: reserva.error ?? "estoque_indisponivel" }, { status: statusMap[reserva.error ?? ""] ?? 409 });
  }

  // 7. Criar Stripe Checkout Session
  let stripe;
  try { stripe = getStripe(); } catch {
    return NextResponse.json({ error: "Configuração de pagamento indisponível." }, { status: 503 });
  }

  const BASE_URL = resolveBaseUrl();
  const product = item.products as { name?: string; images?: string[] | null } | null;
  const productName = product?.name ?? drop.title;
  const heroImage   = product?.images?.[0] ?? undefined;

  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency:     "brl",
          unit_amount:  item.drop_price_cents,
          product_data: {
            name:   productName,
            images: heroImage ? [heroImage] : [],
          },
        },
        quantity: 1,
      }],
      payment_intent_data: {
        metadata: {
          drop_id:          drop.id,
          drop_item_id:     item.id,
          drop_price_cents: String(item.drop_price_cents),
          drop_slug:        drop.slug ?? "",
          lote_id:          item.lote_id,
          user_id:          user.id,
          reserva_id:       reserva.reserva_id!,
          source:           "drop_checkout_session",
        },
      },
      metadata: {
        drop_id:      drop.id,
        drop_item_id: item.id,
        user_id:      user.id,
        source:       "drop_checkout_session",
      },
      success_url: `${BASE_URL}/conta/circulo?drop_pago=${drop.slug}`,
      cancel_url:  `${BASE_URL}/drops/${drop.slug}`,
      expires_at:  expiresAt,
      customer_email: user.email ?? undefined,
      locale: "pt-BR",
    });
  } catch (stripeErr) {
    // Reverter reserva em caso de falha do Stripe
    await admin
      .from("lote_reservas")
      .update({ status: "CANCELADA" })
      .eq("id", reserva.reserva_id!)
      .eq("status", "ATIVA");

    try { await admin.rpc("fn_restaurar_qtd_lote", { p_lote_id: item.lote_id, p_quantidade: 1 }); } catch { /* best effort */ }

    const errMsg = stripeErr instanceof Error ? stripeErr.message : "Erro no pagamento.";
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }

  // Linkar session à reserva
  if (session.payment_intent) {
    const piId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent.id;
    try {
      await admin
        .from("lote_reservas")
        .update({ payment_intent_id: piId, stripe_session_id: session.id })
        .eq("id", reserva.reserva_id!);
    } catch {
      // stripe_session_id pode não existir na coluna ainda — best effort
      await admin
        .from("lote_reservas")
        .update({ payment_intent_id: piId })
        .eq("id", reserva.reserva_id!);
    }
  }

  return NextResponse.json({ url: session.url });
}
