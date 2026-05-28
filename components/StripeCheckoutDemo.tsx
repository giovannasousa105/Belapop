"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

import { PixQrCode } from "@/components/checkout/PixQrCode";

const normalizeEnvValue = (value?: string | null) =>
  value
    ? (() => {
        const trimmed = value.trim();
        return trimmed.startsWith("\"") && trimmed.endsWith("\"")
          ? trimmed.slice(1, -1).trim()
          : trimmed;
      })()
    : "";

const publishableKey = normalizeEnvValue(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type CheckoutSuccessPayload = {
  orderId?: string;
  orderCode?: string;
  paymentIntentId?: string;
  status?: string;
};

type PixDisplayQrCode = {
  data?: string | null;
  image_url?: string | null;
  expires_at?: number | null;
};

const getPixDisplayQrCode = (paymentIntent: unknown): PixDisplayQrCode | null => {
  const nextAction = (paymentIntent as { next_action?: unknown } | null)?.next_action;
  if (!nextAction || typeof nextAction !== "object") return null;
  const typedNextAction = nextAction as { type?: string; pix_display_qr_code?: PixDisplayQrCode };
  if (typedNextAction.type !== "pix_display_qr_code") return null;
  return typedNextAction.pix_display_qr_code ?? null;
};

type Props = {
  clientSecret: string;
  amountCents: number;
  currency: string;
  onSuccess?: (payload?: CheckoutSuccessPayload) => void;
  orderId?: string;
  orderCode?: string;
  paymentIntentId?: string;
  returnUrl?: string;
  ctaLabel?: string;
};

export function StripeCheckoutDemo(props: Props) {
  const { clientSecret, amountCents, currency, onSuccess, orderId, orderCode, paymentIntentId, returnUrl, ctaLabel } = props;

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "flat",
        variables: {
          colorPrimary: "#c2185b",
          colorBackground: "#ffffff",
          colorText: "#141416",
          colorTextSecondary: "#5f5960",
          colorDanger: "#b42318",
          colorSuccess: "#0f766e",
          borderRadius: "16px",
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          spacingUnit: "4px"
        },
        rules: {
          ".Block": {
            backgroundColor: "#fcfafb",
            border: "1px solid rgba(15, 15, 16, 0.08)",
            boxShadow: "none"
          },
          ".Input": {
            backgroundColor: "#ffffff",
            border: "1px solid rgba(15, 15, 16, 0.1)",
            boxShadow: "none"
          },
          ".Input:focus": {
            border: "1px solid rgba(194, 24, 91, 0.45)",
            boxShadow: "0 0 0 1px rgba(194, 24, 91, 0.15)"
          },
          ".Label": {
            color: "#2b2b2e",
            fontWeight: "500"
          },
          ".Tab": {
            border: "1px solid rgba(15, 15, 16, 0.1)",
            backgroundColor: "#fcfafb"
          },
          ".Tab:hover": {
            color: "#141416"
          },
          ".Tab--selected": {
            borderColor: "rgba(194, 24, 91, 0.35)",
            backgroundColor: "rgba(194, 24, 91, 0.06)",
            color: "#141416"
          }
        }
      }
    }),
    [clientSecret]
  );

  if (!stripePromise) {
    return (
      <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        Pagamento temporariamente indisponível. Tente novamente em instantes ou fale com o concierge.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        amountCents={amountCents}
        currency={currency}
        onSuccess={onSuccess}
        orderCode={orderCode}
        orderId={orderId}
        paymentIntentId={paymentIntentId}
        returnUrl={returnUrl}
        ctaLabel={ctaLabel}
      />
    </Elements>
  );
}

function PaymentForm({
  amountCents,
  currency,
  onSuccess,
  orderId,
  orderCode,
  paymentIntentId,
  returnUrl,
  ctaLabel
}: {
  amountCents: number;
  currency: string;
  onSuccess?: (payload?: CheckoutSuccessPayload) => void;
  orderId?: string;
  orderCode?: string;
  paymentIntentId?: string;
  returnUrl?: string;
  ctaLabel?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{
    paymentIntentId: string;
    qrCodeUrl: string;
    qrCodeData: string;
    expiresAt: number;
  } | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    setPixData(null);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl ?? `${window.location.origin}/pedido/sucesso`,
      },
      redirect: "if_required",
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Erro ao processar pagamento");
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess?.({
        orderCode,
        orderId,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      });
    } else {
      const pixDisplay = getPixDisplayQrCode(paymentIntent);
      if (pixDisplay?.data && pixDisplay?.image_url && pixDisplay?.expires_at) {
        setPixData({
          paymentIntentId: paymentIntent.id,
          qrCodeData: pixDisplay.data,
          qrCodeUrl: pixDisplay.image_url,
          expiresAt: pixDisplay.expires_at
        });
        return;
      }

      if (paymentIntent?.status === "processing" || paymentIntent?.status === "requires_action") {
        setError("Pagamento iniciado. Siga as instruções exibidas pelo Stripe para concluir.");
        return;
      }

      onSuccess?.({
        orderCode,
        orderId,
        paymentIntentId: paymentIntent?.id ?? paymentIntentId,
        status: paymentIntent?.status
      });
    }
  };

  if (pixData) {
    return (
      <PixQrCode
        amountCents={amountCents}
        expiresAt={pixData.expiresAt}
        orderCode={orderCode}
        orderId={orderId ?? ""}
        paymentIntentId={pixData.paymentIntentId}
        qrCodeData={pixData.qrCodeData}
        qrCodeUrl={pixData.qrCodeUrl}
        onPaid={(payload) =>
          onSuccess?.({
            orderCode: payload?.orderCode ?? orderCode,
            orderId: payload?.orderId ?? orderId,
            paymentIntentId: payload?.paymentIntentId ?? pixData.paymentIntentId,
            status: payload?.status ?? "succeeded"
          })
        }
      />
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-black/10 bg-[#fcfafb] p-5 shadow-[0_10px_24px_rgba(15,15,16,0.05)]">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">
          Pagamento Stripe
        </p>
        <p className="text-sm text-bpGraphite/80">
          Total {(amountCents / 100).toFixed(2)} {currency.toUpperCase()}
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <PaymentElement />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <button
        onClick={handlePay}
        disabled={loading || !stripe || !elements}
        className="w-full bg-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90 disabled:opacity-60"
      >
        {loading ? "Processando..." : ctaLabel ?? "Pagar agora"}
      </button>
    </div>
  );
}
