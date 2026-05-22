"use client";

import { CheckoutError } from "./CheckoutError";
import { useCheckout } from "@/lib/hooks/useCheckout";

// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}
    >
      <circle
        cx="7"
        cy="7"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="22 8"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 7 7"
          to="360 7 7"
          dur="0.75s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

// ---------------------------------------------------------------------------

type BuyButtonProps = {
  lote_id: string;
  produto_id: string;
  quantidade: number;
  disabled?: boolean;
  className?: string;
};

const LABEL: Record<string, string> = {
  idle: "Comprar agora",
  reservando: "Verificando estoque...",
  criando_session: "Preparando pagamento...",
  redirecionando: "Redirecionando...",
  erro: "Tentar novamente",
};

export function BuyButton({
  lote_id,
  produto_id,
  quantidade,
  disabled = false,
  className,
}: BuyButtonProps) {
  const { state, erro, iniciar, resetar } = useCheckout({ lote_id, produto_id, quantidade });

  const isLoading =
    state === "reservando" || state === "criando_session" || state === "redirecionando";
  const isDisabled = disabled || isLoading;

  const handleClick = () => {
    if (state === "erro") {
      resetar();
      return;
    }
    void iniciar();
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={className}
      >
        {isLoading && <Spinner />}
        {LABEL[state] ?? "Comprar agora"}
      </button>

      <CheckoutError erro={erro} onDismiss={resetar} />
    </div>
  );
}
