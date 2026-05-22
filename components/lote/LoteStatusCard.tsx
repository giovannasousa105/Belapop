"use client";

import { useLoteStatus } from "@/lib/hooks/useLoteStatus";

interface LoteStatusCardProps {
  produto_id: string;
  /** Threshold para mostrar no modo card. Padrão: 30 */
  mostrarAbaixoDe?: number;
}

/**
 * Versão compacta para cards de kit e listagens.
 * Só renderiza quando urgencia_level != 'none' e qty <= mostrarAbaixoDe.
 * Máximo 1 linha, sem botão de waitlist.
 */
export function LoteStatusCard({ produto_id, mostrarAbaixoDe = 30 }: LoteStatusCardProps) {
  const { config, isLoading } = useLoteStatus(produto_id);

  if (isLoading || !config) return null;

  const { urgencia_level, qtd_disponivel, status, texto_esgotado } = config;

  if (status === "ABERTO" || status === "SUSPENSO") return null;

  if (status === "ENCERRADO" || status === "REPOSICAO_PREVISTA") {
    return (
      <span className="text-[11px] font-light text-[#B06060]">
        · {texto_esgotado ?? "Esgotado"}
      </span>
    );
  }

  if (urgencia_level === "none") return null;

  // EM_ESGOTAMENTO — card only shows when qty <= threshold
  if (urgencia_level === "low" && (qtd_disponivel ?? Infinity) > mostrarAbaixoDe) return null;

  const cor =
    urgencia_level === "high"
      ? "text-amber-700"
      : "text-[color:var(--color-text-secondary,#B8B8B8)]";

  return (
    <span className={`text-[11px] font-light ${cor}`}>
      · {qtd_disponivel} restantes
    </span>
  );
}
