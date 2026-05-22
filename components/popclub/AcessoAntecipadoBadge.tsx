"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

interface AcessoAntecipadoBadgeProps {
  lote_id: string;
  abertura_geral: Date;
}

interface AcessoResponse {
  ok: boolean;
  tem_acesso: boolean;
  tier: string;
  abertura_em: string;
  tempo_restante_ms: number;
}

// Atualiza a cada minuto — não a cada segundo (evita re-renders excessivos)
function useContagem(tempoInicialMs: number, aberturaEm: string) {
  const [tempoRestante, setTempoRestante] = useState(tempoInicialMs);

  useEffect(() => {
    if (tempoInicialMs <= 0) return;

    const calcular = () => {
      const agora = Date.now();
      const abertura = new Date(aberturaEm).getTime();
      setTempoRestante(Math.max(0, abertura - agora));
    };

    calcular();
    const interval = setInterval(calcular, 60_000);
    return () => clearInterval(interval);
  }, [aberturaEm, tempoInicialMs]);

  return tempoRestante;
}

function formatarContagem(ms: number): string {
  const totalMinutos = Math.floor(ms / 60000);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  if (horas > 0) return `${horas}h ${minutos}min`;
  return `${minutos}min`;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function AcessoAntecipadoBadge({ lote_id, abertura_geral }: AcessoAntecipadoBadgeProps) {
  const { data, isLoading } = useSWR<AcessoResponse>(
    `/api/popclub/acesso/${lote_id}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const tempoRestante = useContagem(
    data?.tempo_restante_ms ?? 0,
    data?.abertura_em ?? abertura_geral.toISOString()
  );

  // Sem skeleton enquanto carrega — evita layout shift na PDP
  if (isLoading || !data) return null;

  const { tem_acesso, tier } = data;
  const tierLabel = tier === "PUBLICO" ? "" : tier.charAt(0) + tier.slice(1).toLowerCase();

  // Acesso público na hora 0 — sem badge
  if (tier === "PUBLICO" && tem_acesso) return null;

  // Membro com acesso agora
  if (tem_acesso && tier !== "PUBLICO") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          borderRadius: 8,
          background: "rgba(52, 199, 89, 0.07)",
          border: "0.5px solid rgba(52, 199, 89, 0.25)",
          marginBottom: 8,
        }}
        aria-label={`Acesso antecipado ${tierLabel} disponível agora`}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#34c759",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#1a7a35", letterSpacing: "0.06em" }}>
          Acesso {tierLabel} · disponível agora
        </span>
      </div>
    );
  }

  // Membro sem acesso ainda
  if (tier !== "PUBLICO" && !tem_acesso) {
    return (
      <p
        style={{
          fontSize: 12,
          color: "rgba(0,0,0,0.55)",
          marginBottom: 8,
        }}
      >
        Disponível para membros{" "}
        <strong style={{ color: "rgba(0,0,0,0.72)" }}>{tierLabel}</strong> em{" "}
        {formatarContagem(tempoRestante)}
      </p>
    );
  }

  // Não membro — public countdown ou CTA
  if (tier === "PUBLICO" && !tem_acesso) {
    return (
      <p style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", marginBottom: 8 }}>
        Membros PopClub acessam 24–72h antes.{" "}
        <a
          href="/popclub"
          style={{ color: "rgba(0,0,0,0.65)", fontWeight: 500, textDecoration: "underline" }}
        >
          Saiba mais
        </a>
      </p>
    );
  }

  return null;
}
