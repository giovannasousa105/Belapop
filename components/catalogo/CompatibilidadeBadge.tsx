"use client";

import { deveExibirBadge, formatarScoreParaExibicao, toCompatScore } from "@/lib/catalogo/invariants";

interface Props {
  score: number | null | undefined;
  className?: string;
}

export function CompatibilidadeBadge({ score, className = "" }: Props) {
  if (score == null) return null;

  const compatScore = toCompatScore(score);
  if (!deveExibirBadge(compatScore)) return null;

  const label = formatarScoreParaExibicao(compatScore);

  const cor =
    score >= 80 ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
    score >= 60 ? "bg-lime-100 text-lime-800 border-lime-200" :
                  "bg-yellow-100 text-yellow-800 border-yellow-200";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cor} ${className}`}
    >
      <span aria-hidden>✦</span>
      {label}
    </span>
  );
}
