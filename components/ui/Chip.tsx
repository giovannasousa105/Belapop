"use client";

import type { CSSProperties, ReactNode } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ChipProps = {
  children:    ReactNode;
  selected?:   boolean;
  onClick?:    () => void;
  disabled?:   boolean;
  className?:  string;
};

// ─── Estilos ──────────────────────────────────────────────────────────────────

const BASE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  padding:        "6px 14px",
  borderRadius:   "var(--radius-xs, 2px)",  // quase reto — editorial, nunca pill
  fontSize:       "13px",
  fontWeight:     400,
  letterSpacing:  "var(--tracking-body, 0.01em)",
  lineHeight:     "var(--leading-normal, 1.6)",
  cursor:         "pointer",
  transition:     "all 150ms ease",
  border:         "0.5px solid var(--color-border-primary)",
  outline:        "none",
  userSelect:     "none",
  whiteSpace:     "nowrap",
  background:     "transparent",
  fontFamily:     "var(--font-sans, var(--font-manrope), sans-serif)",
};

const SELECTED: CSSProperties = {
  background:  "var(--ink-900)",
  borderColor: "var(--ink-900)",
  color:       "var(--nude-50)",
  fontWeight:  500,
};

const UNSELECTED: CSSProperties = {
  background: "transparent",
  color:      "var(--color-text-secondary)",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export function Chip({ children, selected = false, onClick, disabled, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={className}
      style={{
        ...BASE,
        ...(selected ? SELECTED : UNSELECTED),
        opacity:       disabled ? 0.4 : 1,
        pointerEvents: disabled ? "none" : undefined,
      }}
    >
      {children}
    </button>
  );
}
