import type { CSSProperties, ElementType, ReactNode } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TextVariant =
  | "display"    // hero, editorial — serif, peso 300
  | "h1"         // título de página — sans, peso 500
  | "h2"         // título de seção — sans, peso 500
  | "h3"         // título de card — sans, peso 500
  | "body"       // corpo principal — sans, peso 400
  | "small"      // labels, meta — sans, peso 400
  | "caption"    // badges, timestamps — sans, peso 400
  | "label"      // uppercase com tracking alto — sans, peso 500
  | "narrative"  // editorial longo — serif, peso 400
  | "mono"       // Skin IDs, códigos — mono
  | "price";     // preço — nunca bold, peso 400

type TextProps = {
  variant:    TextVariant;
  as?:        ElementType;
  children:   ReactNode;
  className?: string;
  muted?:     boolean;
  style?:     CSSProperties;
};

// ─── Estilos por variante ─────────────────────────────────────────────────────

const VARIANT_STYLES: Record<TextVariant, CSSProperties> = {
  display: {
    fontFamily:    "var(--font-serif, var(--font-playfair), serif)",
    fontSize:      "var(--text-display)",
    fontWeight:    300,
    letterSpacing: "var(--tracking-display)",
    lineHeight:    "var(--leading-tight)",
  },
  h1: {
    fontFamily:    "var(--font-sans, var(--font-manrope), sans-serif)",
    fontSize:      "var(--text-h1)",
    fontWeight:    500,
    letterSpacing: "var(--tracking-heading)",
    lineHeight:    "var(--leading-snug)",
  },
  h2: {
    fontFamily:    "var(--font-sans, var(--font-manrope), sans-serif)",
    fontSize:      "var(--text-h2)",
    fontWeight:    500,
    letterSpacing: "var(--tracking-heading)",
    lineHeight:    "var(--leading-snug)",
  },
  h3: {
    fontFamily:    "var(--font-sans, var(--font-manrope), sans-serif)",
    fontSize:      "var(--text-h3)",
    fontWeight:    500,
    letterSpacing: "var(--tracking-subhead)",
    lineHeight:    "var(--leading-snug)",
  },
  body: {
    fontFamily:    "var(--font-sans, var(--font-manrope), sans-serif)",
    fontSize:      "var(--text-body)",
    fontWeight:    400,
    letterSpacing: "var(--tracking-body)",
    lineHeight:    "var(--leading-normal)",
  },
  small: {
    fontFamily:    "var(--font-sans, var(--font-manrope), sans-serif)",
    fontSize:      "var(--text-sm)",
    fontWeight:    400,
    letterSpacing: "var(--tracking-body)",
    lineHeight:    "var(--leading-normal)",
  },
  caption: {
    fontFamily:    "var(--font-sans, var(--font-manrope), sans-serif)",
    fontSize:      "var(--text-xs)",
    fontWeight:    400,
    letterSpacing: "var(--tracking-body)",
    lineHeight:    "var(--leading-normal)",
  },
  label: {
    fontFamily:     "var(--font-sans, var(--font-manrope), sans-serif)",
    fontSize:       "var(--text-xs)",
    fontWeight:     500,
    letterSpacing:  "var(--tracking-label)",
    textTransform:  "uppercase",
    lineHeight:     "var(--leading-normal)",
  },
  narrative: {
    fontFamily:    "var(--font-serif, var(--font-playfair), serif)",
    fontSize:      "var(--text-body)",
    fontWeight:    400,
    letterSpacing: "var(--tracking-body)",
    lineHeight:    "var(--leading-relaxed)",
  },
  mono: {
    fontFamily:    "var(--font-mono, monospace)",
    fontSize:      "var(--text-sm)",
    fontWeight:    400,
    letterSpacing: "var(--tracking-mono)",
    lineHeight:    "var(--leading-normal)",
  },
  price: {
    fontFamily:    "var(--font-sans, var(--font-manrope), sans-serif)",
    fontWeight:    400,    // NUNCA bold em preço — editorial, não promoção
    letterSpacing: "var(--tracking-body)",
    lineHeight:    1,
  },
};

// ─── Tag HTML padrão por variante ────────────────────────────────────────────

const DEFAULT_TAG: Record<TextVariant, ElementType> = {
  display:   "h1",
  h1:        "h1",
  h2:        "h2",
  h3:        "h3",
  body:      "p",
  small:     "p",
  caption:   "span",
  label:     "span",
  narrative: "p",
  mono:      "span",
  price:     "span",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function Text({ variant, as, children, className, muted, style }: TextProps) {
  const Tag = as ?? DEFAULT_TAG[variant];

  return (
    <Tag
      style={{
        ...VARIANT_STYLES[variant],
        color: muted ? "var(--color-text-secondary)" : undefined,
        ...style,
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}
