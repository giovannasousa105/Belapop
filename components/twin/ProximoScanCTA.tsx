"use client";

import Link from "next/link";

interface Props {
  proximoScanRecomendadoEm: string | null;
  diasDesdeUltimoScan: number | null;
  totalScans: number;
}

export function ProximoScanCTA({ proximoScanRecomendadoEm, diasDesdeUltimoScan, totalScans }: Props) {
  const isFirstScan = totalScans === 0;

  // Calcular dias até o próximo scan recomendado
  const diasRestantes =
    proximoScanRecomendadoEm
      ? Math.max(
          0,
          Math.ceil(
            (new Date(proximoScanRecomendadoEm).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null;

  const isNow = diasRestantes !== null && diasRestantes <= 3;

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        isNow || isFirstScan
          ? "border-violet-300 bg-violet-50"
          : "border-stone-200 bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-900">
            {isFirstScan
              ? "Faça seu primeiro Skin Scan"
              : isNow
                ? "Hora do próximo scan"
                : "Próximo scan recomendado"}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            {isFirstScan
              ? "Capture sua linha de base e comece a acompanhar a evolução da sua pele."
              : diasRestantes !== null && diasRestantes > 0
                ? `Em ${diasRestantes} dias (${new Date(proximoScanRecomendadoEm!).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })})`
                : diasDesdeUltimoScan !== null
                  ? `Seu último scan foi há ${diasDesdeUltimoScan} dias.`
                  : "Atualize seu perfil para melhores recomendações."}
          </p>
        </div>

        <Link
          href="/skin-scan"
          className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
            isNow || isFirstScan
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
          }`}
        >
          {isFirstScan ? "Iniciar scan" : "Novo scan"}
        </Link>
      </div>
    </div>
  );
}
