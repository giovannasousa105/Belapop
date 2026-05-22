"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";

interface CreditoDisponivel {
  id: string;
  valor_brl: number;
  stripe_coupon_id: string | null;
  expira_em: string;
}

interface CreditoPopClubProps {
  total_pedido_cents: number;
  onAplicar: (coupon_id: string, valor_brl: number) => void;
  onRemover: () => void;
}

const TETO_PCT = 0.20;

function formatarBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CreditoPopClub({ total_pedido_cents, onAplicar, onRemover }: CreditoPopClubProps) {
  const [ativo, setAtivo] = useState(false);

  const { data, isLoading } = useSWR<{
    creditos: CreditoDisponivel[];
    pontos_disponiveis: number;
  }>("/api/popclub/creditos-disponiveis", fetcher, {
    revalidateOnFocus: false,
  });

  const creditos = data?.creditos ?? [];
  const pontos = data?.pontos_disponiveis ?? 0;
  const totalCreditoBRL = creditos.reduce((s, c) => s + c.valor_brl, 0);
  const totalPedidoBRL = total_pedido_cents / 100;
  const tetoBRL = totalPedidoBRL * TETO_PCT;
  const descontoAplicavel = Math.min(totalCreditoBRL, tetoBRL);

  // Coupon do crédito disponível (usar o mais próximo de expirar)
  const couponAtivo = creditos[0] ?? null;

  const handleToggle = useCallback(() => {
    if (!couponAtivo?.stripe_coupon_id) return;

    if (!ativo) {
      setAtivo(true);
      onAplicar(couponAtivo.stripe_coupon_id, descontoAplicavel);
    } else {
      setAtivo(false);
      onRemover();
    }
  }, [ativo, couponAtivo, descontoAplicavel, onAplicar, onRemover]);

  if (isLoading) return null;

  // Sem créditos — mostrar CTA para o PopClub
  if (creditos.length === 0) {
    if (pontos === 0) return null;

    return (
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 10,
          background: "rgba(0,0,0,0.02)",
          border: "0.5px solid rgba(0,0,0,0.07)",
          marginBottom: 12,
        }}
      >
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
          Você tem{" "}
          <strong style={{ color: "rgba(0,0,0,0.72)" }}>
            {pontos.toLocaleString("pt-BR")} pts
          </strong>{" "}
          no PopClub.{" "}
          <a
            href="/popclub"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(0,0,0,0.65)", fontWeight: 500, textDecoration: "underline" }}
          >
            Resgatar em créditos
          </a>
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        background: ativo ? "rgba(52,199,89,0.04)" : "rgba(0,0,0,0.02)",
        border: ativo
          ? "0.5px solid rgba(52,199,89,0.25)"
          : "0.5px solid rgba(0,0,0,0.07)",
        marginBottom: 12,
        transition: "background 200ms, border-color 200ms",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(0,0,0,0.78)", marginBottom: 2 }}>
            {formatarBRL(totalCreditoBRL)} em créditos PopClub
          </p>
          {descontoAplicavel < totalCreditoBRL ? (
            <p style={{ fontSize: 11, color: "rgba(0,0,0,0.42)" }}>
              Aplicar {formatarBRL(descontoAplicavel)} neste pedido
              {" "}(teto de 20% = {formatarBRL(tetoBRL)})
            </p>
          ) : (
            <p style={{ fontSize: 11, color: "rgba(0,0,0,0.42)" }}>
              Usar {formatarBRL(descontoAplicavel)} neste pedido
            </p>
          )}
        </div>

        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={ativo}
          onClick={handleToggle}
          style={{
            width: 44,
            height: 26,
            borderRadius: 99,
            border: "none",
            background: ativo ? "#34c759" : "rgba(0,0,0,0.12)",
            cursor: "pointer",
            position: "relative",
            flexShrink: 0,
            transition: "background 200ms",
          }}
          aria-label={ativo ? "Remover crédito PopClub" : "Usar crédito PopClub"}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: ativo ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              transition: "left 200ms",
            }}
          />
        </button>
      </div>

      {/* NOTA IMPORTANTE: coupon deve ser passado na criação da session Stripe,
          não após. onAplicar informa o coupon_id ao parent para incluir em
          session.discounts durante a criação (não modificar session existente) */}
    </div>
  );
}
