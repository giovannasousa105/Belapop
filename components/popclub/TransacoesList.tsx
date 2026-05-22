"use client";

import { useState } from "react";
import {
  ShoppingBag,
  ScanLine,
  CheckSquare,
  UserPlus,
  Zap,
  Clock,
  Gift,
  Settings,
  Sparkles,
} from "lucide-react";
import type { TransacaoUI } from "@/hooks/usePopClubStatus";

interface TransacoesListProps {
  transacoes: TransacaoUI[];
}

type Filtro = "TUDO" | "GANHOS" | "RESGATES";

const ICONES: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  COMPRA: ShoppingBag,
  SCAN: ScanLine,
  CHECKIN: CheckSquare,
  INDICACAO: UserPlus,
  STREAK_BONUS: Zap,
  EXPIRACAO: Clock,
  RESGATE_CREDITO: Gift,
  AJUSTE_ADMIN: Settings,
  ENTRADA_CLUBE: Sparkles,
};

const LABELS: Record<string, string> = {
  COMPRA: "Compra",
  SCAN: "Scan realizado",
  CHECKIN: "Check-in de rotina",
  INDICACAO: "Indicação confirmada",
  STREAK_BONUS: "Bônus de consistência",
  EXPIRACAO: "Expiração de pontos",
  RESGATE_CREDITO: "Resgate de crédito",
  AJUSTE_ADMIN: "Ajuste",
  ENTRADA_CLUBE: "Bem-vinda ao PopClub",
};

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const dias = Math.floor(diff / 86400000);
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `há ${meses} ${meses === 1 ? "mês" : "meses"}`;
  return `há ${Math.floor(meses / 12)} anos`;
}

export function TransacoesList({ transacoes }: TransacoesListProps) {
  const [filtro, setFiltro] = useState<Filtro>("TUDO");

  const filtradas = transacoes.filter((t) => {
    if (filtro === "GANHOS") return t.pontos > 0;
    if (filtro === "RESGATES") return t.pontos < 0;
    return true;
  });

  const filtros: { key: Filtro; label: string }[] = [
    { key: "TUDO", label: "Tudo" },
    { key: "GANHOS", label: "Ganhos" },
    { key: "RESGATES", label: "Resgates" },
  ];

  return (
    <section
      style={{
        background: "var(--color-background-primary, #fff)",
        border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
        borderRadius: "var(--border-radius-lg, 16px)",
        overflow: "hidden",
      }}
    >
      {/* Header com filtros */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 1.25rem 0",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(0,0,0,0.38)",
          }}
        >
          Histórico
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          {filtros.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFiltro(key)}
              style={{
                padding: "4px 10px",
                borderRadius: 99,
                border:
                  filtro === key
                    ? "0.5px solid rgba(0,0,0,0.3)"
                    : "0.5px solid rgba(0,0,0,0.1)",
                background: filtro === key ? "rgba(0,0,0,0.06)" : "transparent",
                fontSize: 11,
                fontWeight: filtro === key ? 600 : 400,
                color: filtro === key ? "rgba(0,0,0,0.78)" : "rgba(0,0,0,0.45)",
                cursor: "pointer",
                transition: "all 150ms",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <p
          style={{
            padding: "2rem 1.25rem",
            fontSize: 13,
            color: "rgba(0,0,0,0.38)",
            textAlign: "center",
          }}
        >
          Nenhuma transação encontrada.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {filtradas.map((t, i) => {
            const Icone = ICONES[t.tipo] ?? Settings;
            const isNegativo = t.pontos < 0;
            const sinal = isNegativo ? "−" : "+";
            const pontosAbs = Math.abs(t.pontos);

            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 1.25rem",
                  borderTop: i === 0 ? "none" : "0.5px solid rgba(0,0,0,0.05)",
                  borderBottom: i === 0 ? "0.5px solid rgba(0,0,0,0.05)" : "none",
                }}
              >
                {/* Ícone */}
                <div
                  aria-hidden
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icone size={14} color="rgba(0,0,0,0.5)" />
                </div>

                {/* Descrição + data */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "rgba(0,0,0,0.78)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.descricao ?? LABELS[t.tipo] ?? t.tipo}
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(0,0,0,0.38)", marginTop: 2 }}>
                    {tempoRelativo(t.criado_em)}
                  </p>
                </div>

                {/* Pontos — negativos em warning, nunca vermelho */}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: isNegativo
                      ? "var(--color-text-warning, #8a6400)"
                      : "rgba(0,0,0,0.78)",
                    flexShrink: 0,
                  }}
                  aria-label={`${sinal}${pontosAbs} pontos`}
                >
                  {sinal}{pontosAbs.toLocaleString("pt-BR")}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
