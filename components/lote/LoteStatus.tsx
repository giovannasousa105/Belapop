"use client";

import { useEffect, useState } from "react";

import { useLoteStatus } from "@/lib/hooks/useLoteStatus";
import { AcessoAntecipadoBadge } from "@/components/popclub/AcessoAntecipadoBadge";
import { WaitlistModal } from "./WaitlistModal";
import type { LoteId } from "@/lib/lote/loteTypes";

interface LoteStatusProps {
  produto_id:       string;
  lote_id?:         LoteId;
  abertura_geral?:  Date | null;
  variante?:        "pdp" | "card";
  onLoteEncerrado?: () => void;
  onWaitlistSuccess?: () => void;
}

export function LoteStatus({
  produto_id,
  lote_id,
  abertura_geral,
  variante = "pdp",
  onLoteEncerrado,
  onWaitlistSuccess,
}: LoteStatusProps) {
  const { config, isLoading } = useLoteStatus(produto_id);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  // Chamar onLoteEncerrado exatamente uma vez — não em cada re-render
  const [encerradoDisparado, setEncerradoDisparado] = useState(false);
  useEffect(() => {
    if (!config) return;
    if (
      (config.status === "ENCERRADO" || config.status === "REPOSICAO_PREVISTA") &&
      !encerradoDisparado
    ) {
      onLoteEncerrado?.();
      setEncerradoDisparado(true);
    }
  }, [config, onLoteEncerrado, encerradoDisparado]);

  // Renderizar null enquanto carrega — sem layout shift
  if (isLoading || !config) return null;

  const {
    status, urgencia_level, texto_estoque, texto_esgotado,
    mostrar_waitlist, acesso_membro,
  } = config;

  // AcessoAntecipadoBadge: só quando membro PopClub, nunca quando encerrado
  const badge =
    acesso_membro && lote_id && abertura_geral &&
    status !== "ENCERRADO" && status !== "REPOSICAO_PREVISTA" ? (
      <AcessoAntecipadoBadge
        lote_id={lote_id}
        abertura_geral={abertura_geral}
      />
    ) : null;

  // ── SUSPENSO ─────────────────────────────────────────────────────────────────
  if (status === "SUSPENSO") return null;

  // ── ABERTO com estoque normal ─────────────────────────────────────────────────
  if (status === "ABERTO" && urgencia_level === "none") {
    return badge ? <>{badge}</> : null;
  }

  // ── EM_ESGOTAMENTO ────────────────────────────────────────────────────────────
  if (status === "EM_ESGOTAMENTO") {
    if (variante === "card") {
      if (urgencia_level === "none") return null;
      const cor = urgencia_level === "high"
        ? "text-[color:var(--color-text-warning,#8a6400)]"
        : "text-[color:var(--color-text-secondary,#888)]";
      return (
        <span className={`text-[11px] font-light ${cor}`}>
          · {texto_estoque}
        </span>
      );
    }

    const cor = urgencia_level === "high"
      ? "text-[color:var(--color-text-warning,#8a6400)]"
      : "text-[color:var(--color-text-secondary,#888)]";

    return (
      <div className="flex flex-col gap-2">
        {badge}
        <p className={`text-[12px] font-light leading-snug ${cor}`} aria-live="polite">
          {texto_estoque}
        </p>
      </div>
    );
  }

  // ── ENCERRADO / REPOSICAO_PREVISTA ────────────────────────────────────────────
  if (status === "ENCERRADO" || status === "REPOSICAO_PREVISTA") {
    if (variante === "card") return null;

    return (
      <div className="flex flex-col gap-3">
        <p className="text-[12px] font-light text-[color:var(--color-text-secondary,#888)]">
          {texto_esgotado ?? "Lote encerrado"}
        </p>

        {mostrar_waitlist && (
          <>
            <button
              type="button"
              onClick={() => setWaitlistOpen((v) => !v)}
              className="w-fit border-b border-[color:var(--color-border-tertiary,#3A3A3A)] pb-px text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-secondary,#B8B8B8)] transition-colors hover:text-[#F8F7F4]"
            >
              {waitlistOpen
                ? "Fechar"
                : status === "REPOSICAO_PREVISTA"
                  ? "Avisar quando chegar"
                  : "Entrar na lista de espera"}
            </button>

            {/* CSS grid-rows trick — sem JavaScript para calcular altura */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: waitlistOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                {config.lote_id && (
                  <WaitlistModal
                    lote_id={config.lote_id}
                    produto_id={produto_id}
                    onSuccess={() => {
                      onWaitlistSuccess?.();
                    }}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}
