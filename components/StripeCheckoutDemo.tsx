"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Props = {
  clientSecret: string;
  amountCents: number;
  currency: string;
  onSuccess?: () => void;
};

export function StripeCheckoutDemo(props: Props) {
  const { clientSecret, amountCents, currency, onSuccess } = props;

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: { theme: "stripe" },
    }),
    [clientSecret]
  );

  if (!stripePromise) {
    return (
      <p className="text-sm text-red-600">
        Defina NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY para usar o checkout Stripe.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm amountCents={amountCents} currency={currency} onSuccess={onSuccess} />
    </Elements>
  );
}

function PaymentForm({
  amountCents,
  currency,
  onSuccess,
}: {
  amountCents: number;
  currency: string;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Erro ao processar pagamento");
    } else {
      onSuccess?.();
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-noir-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
        Pagamento Stripe
      </p>
      <p className="text-sm text-noir-700">
        Total {(amountCents / 100).toFixed(2)} {currency.toUpperCase()}
      </p>
      <PaymentElement />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handlePay}
        disabled={loading || !stripe || !elements}
        className="w-full rounded-full bg-[#635bff] px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
      >
        {loading ? "Processando..." : "Pagar agora"}
      </button>
    </div>
  );
}
