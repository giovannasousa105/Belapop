import type { CSSProperties, ReactNode } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | "default"   // status neutro — fundo off-white, texto secundário
  | "success"   // confirmado, entregue, aprovado
  | "warning"   // atenção editorial — nunca alarme
  | "danger"    // erro de sistema, reprovado
  | "info"      // informativo neutro
  | "accent"    // PopClub tier, destaque especial
  | "outline";  // sem fundo — apenas borda

type BadgeProps = {
  variant?:   BadgeVariant;
  children:   ReactNode;
  className?: string;
  style?:     CSSProperties;
};

// ─── Estilos por variante ─────────────────────────────────────────────────────

const BADGE_STYLES: Record<BadgeVariant, CSSProperties> = {
  default: {
    background: "var(--color-background-secondary)",
    color:      "var(--color-text-secondary)",
    border:     "0.5px solid var(--color-border-primary)",
  },
  success: {
    background: "var(--color-background-success)",
    color:      "var(--color-text-success)",
    border:     "0.5px solid var(--color-border-success)",
  },
  warning: {
    background: "var(--color-background-warning)",
    color:      "var(--color-text-warning)",
    border:     "0.5px solid var(--color-border-warning)",
  },
  danger: {
    background: "var(--color-background-danger)",
    color:      "var(--color-text-danger)",
    border:     "0.5px solid var(--color-border-danger)",
  },
  info: {
    background: "var(--color-background-info)",
    color:      "var(--color-text-info)",
    border:     "0.5px solid var(--color-border-info)",
  },
  accent: {
    background: "var(--color-accent-subtle)",
    color:      "var(--color-accent-text)",
    border:     "0.5px solid var(--accent-200)",
  },
  outline: {
    background: "transparent",
    color:      "var(--color-text-secondary)",
    border:     "0.5px solid var(--color-border-primary)",
  },
};

const BASE_STYLE: CSSProperties = {
  display:       "inline-flex",
  alignItems:    "center",
  padding:       "2px 8px",
  borderRadius:  "var(--radius-xs, 2px)",  // quase reto — editorial, não pill
  fontSize:      "11px",
  fontWeight:    500,
  letterSpacing: "var(--tracking-label, 0.06em)",
  textTransform: "uppercase",
  lineHeight:    1.4,
  whiteSpace:    "nowrap",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function Badge({ variant = "default", children, className, style }: BadgeProps) {
  return (
    <span
      style={{ ...BASE_STYLE, ...BADGE_STYLES[variant], ...style }}
      className={className}
    >
      {children}
    </span>
  );
}
