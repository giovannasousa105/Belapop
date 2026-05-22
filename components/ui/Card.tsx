import type { CSSProperties, ElementType, ReactNode } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CardVariant =
  | "product"    // card de produto — borda 0.5px, ZERO sombra
  | "editorial"  // card editorial — reto (radius 0)
  | "data"       // card de dados — fundo secundário
  | "flat";      // sem fundo, sem borda

type CardProps = {
  variant?:   CardVariant;
  as?:        ElementType;
  children:   ReactNode;
  className?: string;
  style?:     CSSProperties;
  hoverable?: boolean;
  onClick?:   () => void;
  id?:        string;
  role?:      string;
  "aria-label"?: string;
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const CARD_STYLES: Record<CardVariant, CSSProperties> = {
  product: {
    background:   "var(--color-background-primary)",
    border:       "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--radius-sm, 4px)",
    overflow:     "hidden",
    // ZERO box-shadow — borda 0.5px é o único separador visual
  },
  editorial: {
    background:   "var(--color-background-primary)",
    border:       "0.5px solid var(--color-border-secondary)",
    borderRadius: "var(--radius-none, 0px)",  // editorial é reto
    overflow:     "hidden",
  },
  data: {
    background:   "var(--color-background-secondary)",
    borderRadius: "var(--radius-sm, 4px)",
    // sem borda — fundo diferente já separa
  },
  flat: {
    background: "transparent",
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function Card({
  variant = "product",
  as: Tag = "div",
  children,
  className,
  style,
  hoverable = false,
  onClick,
  id,
  role,
  "aria-label": ariaLabel,
}: CardProps) {
  const hoverStyle: CSSProperties = hoverable && variant === "product"
    ? { transition: "border-color 200ms ease" }
    : {};

  return (
    <Tag
      id={id}
      role={role}
      aria-label={ariaLabel}
      onClick={onClick}
      className={className}
      style={{ ...CARD_STYLES[variant], ...hoverStyle, ...style }}
    >
      {children}
    </Tag>
  );
}
