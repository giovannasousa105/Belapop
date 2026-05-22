"use client";

import { formatDeltaParaUsuario, calcularSkinDelta, toSkinScore } from "@/lib/digitalTwin/invariants";
import type { TwinSnapshotRow, SkinTwinRow } from "@/lib/digitalTwin/twinTypes";

// ↓ verde = score caiu = pele MELHOROU
// ↑ âmbar = score subiu = pele PIOROU
// (nunca vermelho — linguagem positiva)

interface Props {
  twin: SkinTwinRow;
  ultimoSnapshot: TwinSnapshotRow;
}

const MARKER_LABELS: Record<string, string> = {
  acne: "Acne",
  poros: "Poros",
  textura: "Textura",
  oleosidade: "Oleosidade",
  pigmentacao: "Pigmentação",
  vermelhidao: "Vermelhidão",
  ressecamento: "Ressecamento",
};

const MARKERS = Object.keys(MARKER_LABELS);

export function BeforeAfterScores({ twin, ultimoSnapshot }: Props) {
  const baseline = twin.scores_baseline;
  const atual = ultimoSnapshot.scores_normalizados;

  // Ordenar por magnitude de melhora (maior melhora no topo).
  // melhora = baseline - atual (score caiu = melhora): maior valor positivo primeiro.
  const marcadoresOrdenados = [...MARKERS].sort((a, b) => {
    const melhoraA = (baseline[a] ?? 0) - (atual[a] ?? 0);
    const melhoraB = (baseline[b] ?? 0) - (atual[b] ?? 0);
    return melhoraB - melhoraA;
  });

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-stone-900">
        Baseline vs. atual
      </h3>

      <div className="space-y-3">
        {marcadoresOrdenados.map((m) => {
          const vBase = Math.round(baseline[m] ?? 0);
          const vAtual = Math.round(atual[m] ?? 0);
          const delta = calcularSkinDelta(toSkinScore(vBase), toSkinScore(vAtual), m as never);
          const formatted = formatDeltaParaUsuario(delta);
          const isMelhora = delta.direcao === "MELHORA";
          const isPiora = delta.direcao === "PIORA";

          return (
            <div key={m} className="flex items-center gap-3">
              <span className="w-28 text-sm text-stone-600">{MARKER_LABELS[m]}</span>

              {/* barra de progresso — baseline */}
              <div className="relative flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-stone-300"
                    style={{ width: `${vBase}%` }}
                  />
                </div>
                {/* barra atual sobreposta */}
                <div className="absolute inset-0 h-2 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isMelhora
                        ? "bg-emerald-400"
                        : isPiora
                          ? "bg-amber-400"
                          : "bg-stone-400"
                    }`}
                    style={{ width: `${vAtual}%` }}
                  />
                </div>
              </div>

              <div className="flex w-28 items-center justify-end gap-2">
                <span className="text-xs text-stone-400">{vBase} → {vAtual}</span>
                <span
                  className={`text-xs font-semibold ${
                    isMelhora
                      ? "text-emerald-600"
                      : isPiora
                        ? "text-amber-600"
                        : "text-stone-500"
                  }`}
                >
                  {formatted}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-stone-400">
        Cinza = baseline (1º scan) · Colorido = atual · ↓ verde = melhora
      </p>
    </div>
  );
}
