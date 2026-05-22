"use client";

import type { TwinInsightRow } from "@/lib/digitalTwin/twinTypes";

// Borda âmbar para REGRESSAO_DETECTADA — nunca vermelha (linguagem positiva).
// Borda verde para progresso positivo.
// Borda neutra para demais tipos.

interface Props {
  insight: TwinInsightRow;
  copilotSeed?: {
    marcadorFoco: string;
    diasDesdeUltimoScan: number;
    proximoScanRecomendadoEm: string;
    alertaAtivo: boolean;
    rotinaPrecisaRevisao: boolean;
  } | null;
}

const TIPO_CONFIG: Record<
  string,
  { label: string; borderClass: string; iconClass: string; icon: string }
> = {
  PRIMEIRO_SCAN: {
    label: "Primeira análise",
    borderClass: "border-violet-200",
    iconClass: "text-violet-600 bg-violet-50",
    icon: "✦",
  },
  PROGRESSO_POSITIVO: {
    label: "Progresso detectado",
    borderClass: "border-emerald-200",
    iconClass: "text-emerald-600 bg-emerald-50",
    icon: "↓",
  },
  ESTAVEL: {
    label: "Pele estável",
    borderClass: "border-stone-200",
    iconClass: "text-stone-600 bg-stone-50",
    icon: "→",
  },
  REGRESSAO_DETECTADA: {
    label: "Variação detectada",
    borderClass: "border-amber-300",  // âmbar, nunca vermelho
    iconClass: "text-amber-600 bg-amber-50",
    icon: "↑",
  },
  MARCO_ALCANCADO: {
    label: "Marco alcançado",
    borderClass: "border-emerald-300",
    iconClass: "text-emerald-700 bg-emerald-50",
    icon: "★",
  },
  AJUSTE_ROTINA: {
    label: "Rotina precisa de revisão",
    borderClass: "border-amber-200",
    iconClass: "text-amber-600 bg-amber-50",
    icon: "⟳",
  },
  RETORNO_APOS_PAUSA: {
    label: "Bem-vinda de volta",
    borderClass: "border-violet-200",
    iconClass: "text-violet-600 bg-violet-50",
    icon: "◎",
  },
};

const MARCADOR_LABEL: Record<string, string> = {
  acne: "Acne",
  poros: "Poros",
  textura: "Textura",
  oleosidade: "Oleosidade",
  pigmentacao: "Pigmentação",
  vermelhidao: "Vermelhidão",
  ressecamento: "Ressecamento",
};

export function TwinInsightCard({ insight, copilotSeed }: Props) {
  const config = TIPO_CONFIG[insight.tipo] ?? TIPO_CONFIG.ESTAVEL;

  return (
    <div
      className={`rounded-2xl border-2 ${config.borderClass} bg-white p-6 shadow-sm`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base ${config.iconClass}`}
        >
          {config.icon}
        </span>

        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
            {config.label}
          </p>
          <p className="mt-1 text-sm font-medium text-stone-800">{insight.conteudo}</p>

          {copilotSeed && (
            <div className="mt-3 flex flex-wrap gap-3 border-t border-stone-100 pt-3">
              {copilotSeed.marcadorFoco && (
                <Info
                  label="Foco"
                  value={MARCADOR_LABEL[copilotSeed.marcadorFoco] ?? copilotSeed.marcadorFoco}
                />
              )}
              <Info
                label="Próximo scan"
                value={new Date(copilotSeed.proximoScanRecomendadoEm).toLocaleDateString(
                  "pt-BR",
                  { day: "2-digit", month: "short" }
                )}
              />
              {copilotSeed.rotinaPrecisaRevisao && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  Revisar rotina
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-stone-400">{label}</p>
      <p className="text-xs font-medium text-stone-700">{value}</p>
    </div>
  );
}
