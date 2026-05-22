import { redirect } from "next/navigation";
import Link from "next/link";

import { getStripe } from "@/lib/stripe/stripeClient";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ConfirmadoPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

type ReservaRow = {
  lote_id: string;
  quantidade: number;
  pedido_id: string | null;
};

type ProdutoRow = {
  title: string;
  hero_image_url: string | null;
  price_cents: number;
  slug: string;
};

function shortRef(sessionId: string): string {
  return sessionId.replace(/^cs_(?:test|live)_/, "").slice(0, 12).toUpperCase();
}

export default async function PedidoConfirmadoPage({ searchParams }: ConfirmadoPageProps) {
  const { session_id } = await searchParams;

  if (!session_id || !session_id.startsWith("cs_")) {
    redirect("/conta/pedidos");
  }

  // 1. Fetch and validate Stripe session server-side
  let session: Awaited<ReturnType<ReturnType<typeof getStripe>["checkout"]["sessions"]["retrieve"]>>;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });
  } catch {
    redirect("/conta/pedidos");
  }

  if (session.payment_status !== "paid") {
    const slug = session.metadata?.produto_id ?? "";
    redirect(`/produto/${slug}?checkout=falhou`);
  }

  // 2. Extract metadata
  const produtoId = session.metadata?.produto_id ?? null;
  const loteId = session.metadata?.lote_id ?? null;

  // 3. Look up reservation for order reference
  const admin = getSupabaseAdminClient();
  let reserva: ReservaRow | null = null;

  if (session_id) {
    const { data } = await admin
      .from("lote_reservas")
      .select("lote_id, quantidade, pedido_id")
      .eq("stripe_session_id", session_id)
      .limit(1)
      .maybeSingle();
    reserva = data as ReservaRow | null;
  }

  // 4. Fetch product info for display
  let produto: ProdutoRow | null = null;
  if (produtoId) {
    const { data } = await admin
      .from("products")
      .select("title, hero_image_url, price_cents, slug")
      .eq("id", produtoId)
      .maybeSingle();
    produto = data as ProdutoRow | null;
  }

  const pedidoRef = shortRef(session_id);
  const quantidade = reserva?.quantidade ?? 1;
  const total = produto?.price_cents ? formatPrice((produto.price_cents * quantidade) / 100) : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fcf9f8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        fontFamily: "var(--font-inter, sans-serif)",
        color: "#1c1b1b",
      }}
    >
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "rgba(28,27,27,0.5)",
            marginBottom: 24,
          }}
        >
          Pedido confirmado
        </p>

        <h1
          style={{
            fontFamily: "var(--font-playfair, serif)",
            fontSize: "2.4rem",
            fontWeight: 500,
            lineHeight: 1.05,
            letterSpacing: "-0.018em",
            marginBottom: 12,
          }}
        >
          {produto?.title ?? "Produto BelaPop"}
        </h1>

        {total && (
          <p
            style={{
              fontSize: "1.1rem",
              fontWeight: 500,
              color: "rgba(28,27,27,0.7)",
              marginBottom: 8,
            }}
          >
            {total}
            {quantidade > 1 ? ` × ${quantidade}` : ""}
          </p>
        )}

        <p
          style={{
            fontSize: 12,
            color: "rgba(28,27,27,0.45)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          Ref. {pedidoRef}
        </p>

        <div
          style={{
            borderTop: "1px solid rgba(28,27,27,0.1)",
            paddingTop: 32,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Link
            href="/conta/pedidos"
            style={{
              display: "block",
              padding: "14px 24px",
              backgroundColor: "#1c1b1b",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Acompanhar pedido
          </Link>

          <Link
            href="/skin-scan"
            style={{
              display: "block",
              padding: "14px 24px",
              border: "1px solid rgba(28,27,27,0.2)",
              color: "#1c1b1b",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Ver minha rotina
          </Link>

          {produto?.slug && (
            <Link
              href={`/produto/${produto.slug}`}
              style={{
                fontSize: 12,
                color: "rgba(28,27,27,0.5)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                textAlign: "center",
              }}
            >
              Voltar ao produto
            </Link>
          )}

          {loteId && !reserva?.pedido_id && (
            <p
              style={{
                fontSize: 11,
                color: "rgba(28,27,27,0.4)",
                marginTop: 8,
              }}
            >
              Processando confirmação do pedido. Você receberá um e-mail em breve.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
