"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { DropPublic, CheckoutDropResult } from "@/types/drops";

// ─── Stripe Elements (lazy) ──────────────────────────────────────────────────

let stripePromise: ReturnType<typeof import("@stripe/stripe-js").loadStripe> | null = null;

async function getStripe() {
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js");
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(target: string | null) {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    if (!target) return;
    const update = () => setDiff(new Date(target).getTime() - Date.now());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (diff === null || diff <= 0) return null;

  const s = Math.floor(diff / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return { h, m, s: sec, total: diff };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ─── Payment form ─────────────────────────────────────────────────────────────

interface PaymentFormProps {
  clientSecret: string;
  priceCents: number;
  expiraEm: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ clientSecret, priceCents, expiraEm, onSuccess, onCancel }: PaymentFormProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<import("@stripe/stripe-js").StripeElements | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expiry = useCountdown(expiraEm);

  useEffect(() => {
    let stripe: import("@stripe/stripe-js").Stripe | null = null;

    async function mount() {
      stripe = await getStripe() ?? null;
      if (!stripe || !mountRef.current) return;

      const elements = stripe.elements({ clientSecret });
      elementsRef.current = elements;

      const pe = elements.create("payment");
      pe.mount(mountRef.current);
    }

    mount();
  }, [clientSecret]);

  const handlePay = async () => {
    const stripe = await getStripe();
    if (!stripe || !elementsRef.current) return;

    setPaying(true);
    setError(null);

    const { error: submitErr } = await elementsRef.current.submit();
    if (submitErr) { setError(submitErr.message ?? "Erro ao processar."); setPaying(false); return; }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements: elementsRef.current,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/pedido/confirmado`,
      },
      redirect: "if_required",
    });

    if (confirmErr) {
      setError(confirmErr.message ?? "Pagamento recusado.");
      setPaying(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="space-y-5">
      {expiry && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
          <span>Reserva expira em</span>
          <span className="font-mono font-bold">{pad(expiry.h)}:{pad(expiry.m)}:{pad(expiry.s)}</span>
        </div>
      )}

      <div ref={mountRef} className="min-h-[200px]" />

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-700">{error}</p>
      )}

      <div className="text-center text-xs text-neutral-400">
        Total:{" "}
        <span className="font-semibold text-neutral-900">
          {(priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </div>

      <button
        onClick={handlePay}
        disabled={paying}
        className="w-full rounded-xl bg-black py-4 text-sm font-semibold tracking-widest text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
      >
        {paying ? "Processando..." : "Confirmar pagamento"}
      </button>

      <button
        onClick={onCancel}
        className="w-full rounded-xl border border-neutral-200 py-3 text-xs text-neutral-500 transition-colors hover:border-neutral-400"
      >
        Cancelar
      </button>
    </div>
  );
}

// ─── Main PDP ─────────────────────────────────────────────────────────────────

type Phase = "idle" | "loading" | "payment" | "success" | "error";

interface Props {
  drop: DropPublic;
}

export function DropPdpClient({ drop }: Props) {
  const item = drop.items[0] ?? null;
  const firstImage = drop.cover_image_url ?? item?.product?.images?.[0] ?? null;
  const isSoldOut = drop.status === "sold_out" || (item ? item.sold_quantity >= item.max_quantity : false);
  const isLive = drop.status === "live";

  const opensCountdown = useCountdown(drop.opens_at && !isLive ? drop.opens_at : null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [checkout, setCheckout] = useState<CheckoutDropResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleBuy = useCallback(async () => {
    setPhase("loading");
    setApiError(null);

    const sessionId = crypto.randomUUID();

    try {
      const res = await fetch(`/api/drops/${drop.slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await res.json() as Partial<CheckoutDropResult> & { error?: string };

      if (!res.ok) {
        const msgMap: Record<string, string> = {
          sold_out:          "Este drop esgotou. Não haverá reposição.",
          drop_unavailable:  "Este drop não está disponível no momento.",
          drop_not_open_yet: "Este drop ainda não abriu.",
          drop_closed:       "Este drop já foi encerrado.",
          estoque_indisponivel: "Estoque insuficiente.",
        };
        setApiError(msgMap[data.error ?? ""] ?? "Não foi possível processar. Tente novamente.");
        setPhase("error");
        return;
      }

      setCheckout(data as CheckoutDropResult);
      setPhase("payment");
    } catch {
      setApiError("Erro de conexão. Verifique sua internet e tente novamente.");
      setPhase("error");
    }
  }, [drop.slug]);

  const soldPct = item ? Math.min(100, Math.round((item.sold_quantity / item.max_quantity) * 100)) : 0;
  const remaining = item ? item.max_quantity - item.sold_quantity : 0;

  const priceFormatted = item
    ? (item.drop_price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null;

  // ── Success screen ───────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Pedido confirmado!</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Você receberá um e-mail com os detalhes. Prazo estimado: {item?.fulfillment_eta_days ?? 7} dias úteis.
          </p>
        </div>
        <Link
          href="/pedido/confirmado"
          className="rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white"
        >
          Ver pedido
        </Link>
      </div>
    );
  }

  // ── Payment screen ───────────────────────────────────────────────────────────
  if (phase === "payment" && checkout) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <button
          onClick={() => setPhase("idle")}
          className="mb-6 text-xs text-neutral-400 hover:text-neutral-700"
        >
          ← Voltar
        </button>
        <h1 className="mb-1 text-lg font-semibold text-neutral-900">{drop.title}</h1>
        <p className="mb-8 text-xs text-neutral-500">Finalize o pagamento para garantir sua unidade.</p>
        <PaymentForm
          clientSecret={checkout.client_secret}
          priceCents={checkout.price_cents}
          expiraEm={checkout.expira_em}
          onSuccess={() => setPhase("success")}
          onCancel={() => setPhase("idle")}
        />
      </div>
    );
  }

  // ── Main PDP ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[11px] text-neutral-400">
        <Link href="/" className="hover:text-neutral-700">Início</Link>
        <span>/</span>
        <span className="text-neutral-600">Drop</span>
      </nav>

      {/* Badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
          Drop exclusivo
        </span>
        {drop.sem_reposicao && (
          <span className="rounded-full border border-neutral-200 px-3 py-1 text-[10px] text-neutral-500">
            Sem reposição
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
        {drop.title}
      </h1>
      {drop.subtitle && (
        <p className="mt-2 text-sm text-neutral-500">{drop.subtitle}</p>
      )}

      {/* Product image */}
      {firstImage && (
        <div className="relative mt-8 aspect-square overflow-hidden rounded-2xl bg-neutral-100 sm:aspect-[4/3]">
          <Image
            src={firstImage}
            alt={drop.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 672px"
            priority
          />
        </div>
      )}

      {/* Stock bar */}
      {item && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{item.sold_quantity} de {item.max_quantity} unidades reservadas</span>
            {remaining > 0 && remaining <= 10 && (
              <span className="font-semibold text-amber-600">Apenas {remaining} restante{remaining > 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-black transition-all duration-500"
              style={{ width: `${soldPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Price + CTA */}
      <div className="mt-8 flex items-center justify-between gap-4">
        {priceFormatted && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400">Valor</p>
            <p className="text-2xl font-semibold text-neutral-900">{priceFormatted}</p>
          </div>
        )}

        {isSoldOut ? (
          <div className="flex-1 rounded-xl bg-neutral-100 py-4 text-center text-sm font-semibold text-neutral-400">
            Esgotado
          </div>
        ) : !isLive ? (
          <div className="flex-1 space-y-1 rounded-xl bg-neutral-100 px-4 py-3 text-center">
            <p className="text-[10px] text-neutral-400">Abertura em</p>
            {opensCountdown ? (
              <p className="font-mono text-lg font-semibold text-neutral-900">
                {pad(opensCountdown.h)}:{pad(opensCountdown.m)}:{pad(opensCountdown.s)}
              </p>
            ) : (
              <p className="text-sm text-neutral-500">Em breve</p>
            )}
          </div>
        ) : (
          <button
            onClick={handleBuy}
            disabled={phase === "loading"}
            className="flex-1 rounded-xl bg-black py-4 text-sm font-semibold tracking-widest text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
          >
            {phase === "loading" ? "Reservando..." : "Comprar agora"}
          </button>
        )}
      </div>

      {/* Error */}
      {phase === "error" && apiError && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">
          {apiError}
        </div>
      )}

      {/* Description */}
      {drop.description && (
        <div className="mt-10 border-t border-neutral-100 pt-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">Sobre este drop</h2>
          <div className="prose prose-sm prose-neutral max-w-none text-neutral-700">
            {drop.description.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Fulfillment info */}
      {item && (
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-neutral-50 px-4 py-3">
          <span className="mt-0.5 text-base">📦</span>
          <div>
            <p className="text-xs font-medium text-neutral-700">Prazo estimado</p>
            <p className="text-xs text-neutral-500">{item.fulfillment_eta_days} dias úteis após encerramento do drop.</p>
          </div>
        </div>
      )}
    </div>
  );
}
