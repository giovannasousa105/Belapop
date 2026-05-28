"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BELAPOP_SCAN_KEY, LEGACY_SKIN_SCAN_KEYS, SKIN_SCAN_FOCOS_KEY } from "@/types/skin-scan";
import {
  Blend,
  Droplets,
  Eye,
  Flame,
  ScanLine,
  Shield,
  Sparkles,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

// ─── Dados dos focos (label e descrição CORRETOS — bug anterior tinha invertidos) ──

type FocoKey =
  | "acne"
  | "oleosidade"
  | "manchas"
  | "linhas"
  | "sensibilidade"
  | "poros"
  | "brilho"
  | "hidratação"
  | "textura"
  | "olheiras";

interface Foco {
  key: FocoKey;
  label: string;      // nome do foco — exibido em destaque
  descricao: string;  // o que representa — exibido menor, abaixo
  icon: LucideIcon;
}

const FOCOS: Foco[] = [
  { key: "acne",         label: "Acne",         descricao: "Acne e cravos",                 icon: Sparkles },
  { key: "oleosidade",   label: "Oleosidade",   descricao: "Oleosidade excessiva",          icon: Droplets },
  { key: "manchas",      label: "Manchas",      descricao: "Manchas e hiperpigmentação",    icon: Blend },
  { key: "linhas",       label: "Linhas finas", descricao: "Linhas finas e firmeza",        icon: Waves },
  { key: "sensibilidade",label: "Sensibilidade",descricao: "Barreira sensibilizada",        icon: Shield },
  { key: "poros",        label: "Poros",        descricao: "Poros aparentes e textura",     icon: ScanLine },
  { key: "brilho",       label: "Luminosidade", descricao: "Falta de luminosidade",         icon: Flame },
  { key: "hidratação",   label: "Hidratação",   descricao: "Desidratação e ressecamento",   icon: Droplets },
  { key: "textura",      label: "Textura",      descricao: "Textura irregular",             icon: Wind },
  { key: "olheiras",     label: "Olheiras",     descricao: "Olheiras e área dos olhos",     icon: Eye },
];

// ─── Componente ───────────────────────────────────────────────────────────────

interface FocoSelectorProps {
  inicial?: FocoKey[];
  onAvancar?: (focos: FocoKey[]) => void;
  labelBotao?: string;
  href?: string; // redirecionar se não passar onAvancar
}

export function FocoSelector({
  inicial = ["oleosidade"],
  onAvancar,
  labelBotao = "Iniciar leitura",
  href = "/skin-scan/captura",
}: FocoSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<FocoKey[]>(inicial);

  const toggle = (key: FocoKey) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleAvancar = () => {
    if (selected.length === 0) return;
    // Persistir focos para a próxima etapa
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(BELAPOP_SCAN_KEY);
      for (const key of LEGACY_SKIN_SCAN_KEYS) {
        sessionStorage.removeItem(key);
      }
      sessionStorage.setItem(SKIN_SCAN_FOCOS_KEY, JSON.stringify(selected));
    }
    if (onAvancar) {
      onAvancar(selected);
    } else {
      router.push(href);
    }
  };

  return (
    <div
      style={{
        "--scan-fg": "var(--bp-black, #1e1e1e)",
        "--scan-bg": "var(--bp-offwhite, #fbf7f4)",
        "--scan-border": "rgba(30,30,30,0.1)",
        "--scan-muted": "rgba(30,30,30,0.45)",
        "--scan-selected-border": "var(--bp-black, #1e1e1e)",
      } as React.CSSProperties}
    >
      {/* Grade de chips */}
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        role="group"
        aria-label="Selecione seus focos de cuidado"
      >
        {FOCOS.map((foco) => {
          const ativo = selected.includes(foco.key);
          const Icon = foco.icon;

          return (
            <li key={foco.key}>
              <button
                type="button"
                role="checkbox"
                aria-checked={ativo}
                onClick={() => toggle(foco.key)}
                style={{
                  border: `1px solid ${ativo ? "var(--scan-fg)" : "var(--scan-border)"}`,
                  background: ativo ? "var(--scan-fg)" : "transparent",
                  color: ativo ? "var(--scan-bg)" : "var(--scan-fg)",
                  transition: "background 200ms, border-color 200ms, color 200ms",
                }}
                className="group relative flex w-full flex-col items-start gap-2 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Icon
                  size={16}
                  style={{ opacity: ativo ? 0.8 : 0.5 }}
                  aria-hidden
                />

                {/* label — nome do foco (destaque) */}
                <span
                  style={{
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  {foco.label}
                </span>

                {/* descrição — o que representa (menor, muted) */}
                <span
                  style={{
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: 11,
                    opacity: ativo ? 0.7 : 0.45,
                    lineHeight: 1.4,
                  }}
                >
                  {foco.descricao}
                </span>

                {/* indicador de seleção */}
                {ativo && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "var(--scan-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path
                        d="M1 3l2 2 4-4"
                        stroke="var(--scan-fg)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Contador e botão */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <p
          style={{
            fontSize: 11,
            fontFamily: "var(--font-inter, sans-serif)",
            color: "var(--scan-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {selected.length === 0
            ? "Selecione ao menos 1 foco"
            : `${selected.length} foco${selected.length > 1 ? "s" : ""} selecionado${selected.length > 1 ? "s" : ""}`}
        </p>

        <button
          type="button"
          onClick={handleAvancar}
          disabled={selected.length === 0}
          title={selected.length === 0 ? "Selecione pelo menos 1 foco para continuar" : undefined}
          aria-disabled={selected.length === 0}
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            padding: "14px 36px",
            background: selected.length > 0 ? "var(--scan-fg)" : "var(--scan-border)",
            color: selected.length > 0 ? "var(--scan-bg)" : "var(--scan-muted)",
            border: "none",
            cursor: selected.length > 0 ? "pointer" : "not-allowed",
            opacity: selected.length > 0 ? 1 : 0.5,
            transition: "background 200ms, color 200ms, opacity 200ms",
          }}
        >
          {labelBotao}
        </button>
      </div>
    </div>
  );
}
