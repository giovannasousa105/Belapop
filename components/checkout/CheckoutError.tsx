"use client";

type CheckoutErrorProps = {
  erro: string | null;
  onDismiss: () => void;
};

export function CheckoutError({ erro, onDismiss }: CheckoutErrorProps) {
  if (!erro) return null;

  return (
    <div role="alert" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--color-text-danger, #b91c1c)",
        }}
      >
        {erro}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          fontSize: 12,
          color: "var(--color-text-secondary, #6b7280)",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 2,
          flexShrink: 0,
        }}
      >
        Fechar
      </button>
    </div>
  );
}
