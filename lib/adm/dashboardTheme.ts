import type { CSSProperties } from "react";

export type AdmChromeVariant = "default" | "workspace";

export const executiveWorkspaceChromeVars = {
  "--adm-bg": "#f3f6fc",
  "--adm-sidebar": "#f8fafc",
  "--adm-surface": "#ffffff",
  "--adm-surface-soft": "#eef2ff",
  "--adm-surface-muted": "#f8fbff",
  "--adm-border": "rgba(148, 163, 184, 0.22)",
  "--adm-border-strong": "rgba(99, 102, 241, 0.22)",
  "--adm-text": "#0f172a",
  "--adm-text-muted": "#475569",
  "--adm-text-soft": "#64748b",
  "--adm-primary": "#4f46e5",
  "--adm-secondary": "#2563eb",
  "--adm-tertiary": "#7c3aed",
  "--adm-success": "#0f766e",
  "--adm-warning": "#ca8a04",
  "--adm-info": "#2563eb",
  "--adm-radius": "16px",
  "--adm-radius-lg": "24px",
  "--adm-shadow-soft": "0 24px 48px rgba(15, 23, 42, 0.08)",
  "--adm-shadow-micro": "0 10px 24px rgba(15, 23, 42, 0.05)",
  "--adm-header-height": "72px",
  "--adm-sidebar-width": "280px"
} as CSSProperties;

export const executiveWorkspaceMaxWidthClass = "max-w-[1280px]";
