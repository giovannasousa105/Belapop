"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

interface Step {
  label: string;
  path: string;
}

const STEPS: Step[] = [
  { label: "Seus focos", path: "/skin-scan/foco" },
  { label: "Sua foto",   path: "/skin-scan/captura" },
  { label: "Resultado",  path: "/skin-scan/resultado" },
];

function resolveCurrentStep(pathname: string | null): number {
  if (!pathname) return 0;
  const idx = STEPS.findIndex((s) => pathname.startsWith(s.path));
  return idx >= 0 ? idx : 0;
}

interface SkinScanProgressProps {
  steps?: Step[];
  currentStep?: number;
}

export function SkinScanProgress({ steps = STEPS, currentStep }: SkinScanProgressProps) {
  const pathname = usePathname();
  const active = currentStep ?? resolveCurrentStep(pathname);

  return (
    <nav
      aria-label={`Progresso do Skin Scan, etapa ${active + 1} de ${steps.length}`}
      style={{ width: "100%", padding: "0 24px" }}
    >
      <ol
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {steps.map((step, idx) => {
          const done    = idx < active;
          const current = idx === active;
          const future  = idx > active;

          return (
            <li
              key={step.path}
              style={{
                display: "flex",
                alignItems: "center",
                flex: idx < steps.length - 1 ? 1 : "none",
              }}
            >
              {/* Pill */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  opacity: future ? 0.35 : 1,
                  transition: "opacity 300ms",
                  animation: current ? "scanStepIn 250ms ease-out" : undefined,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: done
                      ? "var(--bp-success, #1D9E75)"
                      : current
                      ? "var(--bp-black, #1e1e1e)"
                      : "transparent",
                    border: done || current
                      ? "none"
                      : "1.5px solid rgba(30,30,30,0.25)",
                    transition: "background 250ms, border 250ms",
                  }}
                >
                  {done ? (
                    <Check size={13} color="white" strokeWidth={2.5} />
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: current ? "white" : "rgba(30,30,30,0.5)",
                        fontFamily: "var(--font-inter, sans-serif)",
                      }}
                    >
                      {idx + 1}
                    </span>
                  )}
                </span>

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: current ? 600 : 400,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: current
                      ? "var(--bp-black, #1e1e1e)"
                      : done
                      ? "var(--bp-success, #1D9E75)"
                      : "rgba(30,30,30,0.4)",
                    fontFamily: "var(--font-inter, sans-serif)",
                    whiteSpace: "nowrap",
                    transition: "color 250ms",
                  }}
                >
                  {step.label}
                </span>
              </div>

              {/* Linha conectora */}
              {idx < steps.length - 1 && (
                <div
                  aria-hidden
                  style={{
                    flex: 1,
                    height: 1,
                    margin: "0 8px",
                    marginBottom: 16,
                    background: done
                      ? "var(--bp-success, #1D9E75)"
                      : "rgba(30,30,30,0.12)",
                    transition: "background 300ms",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes scanStepIn {
            from { opacity: 0; transform: translateY(4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes scanStepIn { from { opacity: 1; } to { opacity: 1; } }
        }
      `}</style>
    </nav>
  );
}
