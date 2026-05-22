import "server-only";

import type Stripe from "stripe";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "./stripeClient";

// ---------------------------------------------------------------------------

function resolveBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;
  return "https://belapopoficial.com.br";
}

function calcularTaxaBelaPop(
  precoCentavos: number,
  quantidade: number,
  taxaPct: number
): number {
  return Math.round(precoCentavos * quantidade * (taxaPct / 100));
}

// ---------------------------------------------------------------------------

export type CreateCheckoutSessionInput = {
  lote_id: string;
  produto_id: string;
  quantidade: number;
  reserva_id: string;
  user_id: string | null;
  customer_email: string | null;
  session_bp: string;
};

export type CreateCheckoutSessionResult =
  | { ok: true; url: string; session_id: string; expira_em: string; valor_cents: number }
  | {
      ok: false;
      erro: string;
      code: "LOTE_ENCERRADO" | "RESERVA_INVALIDA" | "ESTOQUE_ESGOTADO" | "ERRO";
    };

type LoteRow = { id: string; produto_id: string; seller_id: string; status: string };
type ReservaRow = { id: string; lote_id: string; expira_em: string; status: string; quantidade: number };
type ProdutoRow = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  hero_image_url: string | null;
  slug: string;
  seller_id: string;
};
type SellerRow = { stripe_account_id: string | null; commission_rate: number | null };

// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionResult> {
  const { lote_id, produto_id, quantidade, reserva_id, user_id, customer_email, session_bp } =
    input;

  const admin = getSupabaseAdminClient();
  const BASE_URL = resolveBaseUrl();

  // ── 1. Verify lote ─────────────────────────────────────────────────────────
  const { data: loteRaw, error: loteError } = await admin
    .from("lotes")
    .select("id, produto_id, seller_id, status")
    .eq("id", lote_id)
    .maybeSingle();

  if (loteError || !loteRaw) {
    return { ok: false, erro: "Lote não encontrado.", code: "LOTE_ENCERRADO" };
  }

  const lote = loteRaw as LoteRow;

  if (lote.status === "ENCERRADO" || lote.status === "SUSPENSO") {
    return { ok: false, erro: "Este lote não está mais disponível.", code: "LOTE_ENCERRADO" };
  }

  // ── 2. Verify reservation ──────────────────────────────────────────────────
  const { data: reservaRaw, error: reservaError } = await admin
    .from("lote_reservas")
    .select("id, lote_id, expira_em, status, quantidade")
    .eq("id", reserva_id)
    .maybeSingle();

  if (reservaError || !reservaRaw) {
    return { ok: false, erro: "Reserva não encontrada.", code: "RESERVA_INVALIDA" };
  }

  const reserva = reservaRaw as ReservaRow;

  if (reserva.status !== "ATIVA") {
    return { ok: false, erro: "Reserva expirada ou cancelada.", code: "RESERVA_INVALIDA" };
  }

  if (String(reserva.lote_id) !== String(lote_id)) {
    return { ok: false, erro: "Reserva não pertence a este lote.", code: "RESERVA_INVALIDA" };
  }

  // 60s margin: refuse to create session if reservation expires too soon
  const expiraEm = new Date(reserva.expira_em);
  if (expiraEm <= new Date(Date.now() + 60_000)) {
    return {
      ok: false,
      erro: "Reserva expira em menos de 1 minuto. Tente novamente.",
      code: "RESERVA_INVALIDA",
    };
  }

  // ── 3. Fetch product (server-authoritative price — never trust client) ─────
  const { data: produtoRaw, error: produtoError } = await admin
    .from("products")
    .select("id, title, description, price_cents, hero_image_url, slug, seller_id")
    .eq("id", produto_id)
    .eq("status", "published")
    .maybeSingle();

  if (produtoError || !produtoRaw) {
    return { ok: false, erro: "Produto não encontrado ou indisponível.", code: "ERRO" };
  }

  const produto = produtoRaw as ProdutoRow;
  const precoCentavos = Math.floor(Number(produto.price_cents ?? 0));

  if (!Number.isInteger(precoCentavos) || precoCentavos <= 0) {
    return { ok: false, erro: "Preço do produto inválido.", code: "ERRO" };
  }

  // ── 4. Fetch seller for Stripe Connect split ───────────────────────────────
  const sellerId = String(lote.seller_id || produto.seller_id || "");
  const { data: sellerRaw } = await admin
    .from("sellers")
    .select("stripe_account_id, commission_rate")
    .eq("id", sellerId)
    .maybeSingle();

  const seller = sellerRaw as SellerRow | null;
  const stripeAccountId = seller?.stripe_account_id ?? null;
  const commissionRate = Number(seller?.commission_rate ?? 15);

  // ── 5. Build Stripe Checkout Session ──────────────────────────────────────
  const stripe = getStripe();

  const sharedMetadata: Record<string, string> = {
    reserva_id,
    lote_id,
    produto_id,
    user_id: user_id ?? "anonimo",
    session_bp,
  };

  const paymentIntentData: Stripe.Checkout.SessionCreateParams["payment_intent_data"] = {
    metadata: sharedMetadata,
  };

  if (stripeAccountId) {
    const fee = calcularTaxaBelaPop(precoCentavos, quantidade, commissionRate);
    paymentIntentData.application_fee_amount = fee;
    paymentIntentData.transfer_data = { destination: stripeAccountId };
  }

  const heroImageUrl =
    typeof produto.hero_image_url === "string" && produto.hero_image_url.trim().length > 0
      ? produto.hero_image_url.trim()
      : undefined;

  const productSlug = typeof produto.slug === "string" ? produto.slug : produto_id;

  // Stripe minimum expires_at is 30 minutes; reservation TTL is 15min.
  // Webhook race-condition handling (handleCheckoutCompleted) covers the gap.
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: String(produto.title ?? "Produto BelaPop"),
            description:
              typeof produto.description === "string" && produto.description.trim().length > 0
                ? produto.description.trim().slice(0, 300)
                : undefined,
            images: heroImageUrl ? [heroImageUrl] : [],
            metadata: { produto_id, lote_id },
          },
          unit_amount: precoCentavos,
        },
        quantity: quantidade,
      },
    ],
    payment_intent_data: paymentIntentData,
    metadata: sharedMetadata,
    success_url: `${BASE_URL}/pedido/confirmado?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/produto/${productSlug}?checkout=cancelado&reserva_id=${reserva_id}&lote_id=${lote_id}`,
    expires_at: expiresAt,
    customer_email: customer_email ?? undefined,
    locale: "pt-BR",
    allow_promotion_codes: false,
  });

  // ── 6. Link Checkout Session back to the reservation ──────────────────────
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  if (paymentIntentId || session.id) {
    try {
      await admin
        .from("lote_reservas")
        .update({
          payment_intent_id: paymentIntentId,
          stripe_session_id: session.id,
        })
        .eq("id", reserva_id);
    } catch {
      // stripe_session_id column may not be migrated yet — best effort
      if (paymentIntentId) {
        await admin
          .from("lote_reservas")
          .update({ payment_intent_id: paymentIntentId })
          .eq("id", reserva_id);
      }
    }
  }

  return {
    ok: true,
    url: session.url ?? "",
    session_id: session.id,
    expira_em: reserva.expira_em,
    valor_cents: precoCentavos * quantidade,
  };
}
