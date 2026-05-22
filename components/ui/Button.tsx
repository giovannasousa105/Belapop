import Link from "next/link";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";
type ButtonSize    = "sm" | "md" | "lg";

type CommonProps = {
  children:   ReactNode;
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  className?: string;
  style?:     CSSProperties;
};

type LinkButtonProps = CommonProps & {
  href: string;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "style"> & {
    href?: never;
  };

type ButtonProps = LinkButtonProps | NativeButtonProps;

// ─── Estilos ──────────────────────────────────────────────────────────────────

const BASE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  fontFamily:     "var(--font-sans, var(--font-manrope), sans-serif)",
  fontWeight:     500,
  letterSpacing:  "var(--tracking-label, 0.08em)",
  textTransform:  "uppercase",
  borderRadius:   "var(--radius-sm, 4px)",
  transition:     "background 200ms ease, border-color 200ms ease, transform 100ms ease",
  cursor:         "pointer",
  border:         "none",
  outline:        "none",
  textDecoration: "none",
};

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "var(--color-action-primary)",
    color:      "var(--color-action-primary-text)",
    border:     "0.5px solid var(--ink-900)",
  },
  secondary: {
    background:  "transparent",
    color:       "var(--color-text-primary)",
    border:      "0.5px solid var(--color-border-primary)",
  },
  accent: {
    background: "var(--color-accent)",
    color:      "var(--nude-50)",
    border:     "0.5px solid var(--accent-400)",
  },
  ghost: {
    background: "transparent",
    color:      "var(--color-text-secondary)",
    border:     "none",
  },
};

const SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { height: "36px", padding: "0 14px", fontSize: "11px" },
  md: { height: "44px", padding: "0 20px", fontSize: "12px" },
  lg: { height: "52px", padding: "0 28px", fontSize: "13px" },
};

function buildStyle(variant: ButtonVariant, size: ButtonSize, extra?: CSSProperties): CSSProperties {
  return { ...BASE, ...VARIANTS[variant], ...SIZES[size], ...extra };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className = "", children, style } = props;
  const computedStyle = buildStyle(variant, size, style);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={className} style={computedStyle}>
        {children}
      </Link>
    );
  }

  const { type = "button", disabled, onClick, ...rest } = props as NativeButtonProps;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        ...computedStyle,
        opacity:        disabled ? 0.5 : 1,
        pointerEvents:  disabled ? "none" : undefined,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
