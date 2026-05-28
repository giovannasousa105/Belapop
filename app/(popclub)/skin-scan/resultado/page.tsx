"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { BELAPOP_SCAN_KEY } from "@/types/skin-scan";
import type { SkinScanResult } from "@/types/skin-scan";

const TIPO_PELE_LABELS: Record<string, string> = {
  oleosa: "Oleosa",
  seca: "Seca",
  mista: "Mista",
  normal: "Normal",
  sensivel: "Sensivel",
};

const FOCUS_LABELS: Record<string, string> = {
  acne: "Acne e cravos",
  oleosidade: "Oleosidade",
  manchas: "Manchas",
  linhas: "Linhas finas",
  linhas_finas: "Linhas finas",
  sensibilidade: "Sensibilidade",
  poros: "Poros",
  brilho: "Luminosidade",
  hidratacao: "Hidratacao",
  textura: "Textura",
  olheiras: "Olheiras",
};

const SCORE_LABELS: Record<string, string> = {
  hidratacao: "Hidratacao",
  oleosidade: "Oleosidade",
  uniformidade: "Uniformidade",
  textura: "Textura",
  luminosidade: "Luminosidade",
  sensibilidade: "Sensibilidade",
};

const ACHADO_LABELS: Record<string, string> = {
  zonaT: "Zona T",
  bochechas: "Bochechas",
  poros: "Poros",
  eritema: "Vermelhidao",
  manchas: "Manchas",
  descamacao: "Descamacao",
  linhasFinas: "Linhas finas",
  acne: "Acne",
};

function normalizeLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function SkinScanResultadoPage() {
  const router = useRouter();
  const [result, setResult] = useState<SkinScanResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(BELAPOP_SCAN_KEY);
    if (!raw) {
      router.replace("/skin-scan/foco");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SkinScanResult;
      if (!parsed.analise || !parsed.rotina) {
        throw new Error("Resultado antigo ou invalido.");
      }
      setResult(parsed);
    } catch {
      router.replace("/skin-scan/foco");
    }
  }, [router]);

  const topAtivos = useMemo(() => {
    if (!result) return [];
    const steps = [
      ...result.rotina.manha,
      ...result.rotina.noite,
      ...result.rotina.semanal,
      ...(result.rotina.semana1 ?? []),
    ];
    return [...new Set(steps.flatMap((step) => step.ativosChave))].slice(0, 6);
  }, [result]);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  const { analise } = result;
  const scoreEntries = Object.entries(analise.scores);
  const achadosEntries = Object.entries(analise.achados).filter(([, value]) => Boolean(value));

  return (
    <main className="mx-auto max-w-2xl space-y-10 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Etapa 3 - Resultado</p>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)" }} className="text-3xl">
          Sua analise de pele
        </h1>
        <p className="text-sm text-neutral-500">
          Protocolo belapop_scan_v2 · Confianca {analise.confianca}%
        </p>
      </div>

      {analise.alertas.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
          {analise.alertas.join(" ")}
        </section>
      )}

      <section className="space-y-3 rounded-2xl bg-neutral-50 p-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Tipo de pele identificado</p>
        <h2 style={{ fontFamily: "var(--font-playfair, serif)" }} className="text-4xl capitalize">
          {TIPO_PELE_LABELS[analise.tipoPele] ?? analise.tipoPele}
        </h2>
        {analise.subtipo && <p className="text-sm leading-relaxed text-neutral-600">{analise.subtipo}</p>}
        <p className="text-sm leading-relaxed text-neutral-600">{analise.observacao}</p>
        {analise.fototipo && (
          <p className="text-xs uppercase tracking-widest text-neutral-400">
            Fototipo Fitzpatrick {analise.fototipo}
          </p>
        )}
      </section>

      {scoreEntries.length > 0 && (
        <section className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Scores visuais</p>
          <div className="space-y-3">
            {scoreEntries.map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{SCORE_LABELS[key] ?? key}</span>
                  <span className="text-neutral-500">{value}/10</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{ width: `${(Number(value) / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {result.focos.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Focos considerados</p>
          <div className="flex flex-wrap gap-2">
            {result.focos.map((focus) => (
              <span key={focus} className="rounded-full bg-black px-3 py-1.5 text-xs tracking-wider text-white">
                {FOCUS_LABELS[focus] ?? normalizeLabel(focus)}
              </span>
            ))}
          </div>
        </section>
      )}

      {achadosEntries.length > 0 && (
        <section className="space-y-3 rounded-xl border border-neutral-200 p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Achados visuais</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {achadosEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg bg-neutral-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                  {ACHADO_LABELS[key] ?? key}
                </p>
                <p className="mt-1 text-sm text-neutral-700">{normalizeLabel(String(value))}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {topAtivos.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Ativos prioritarios - base cientifica
          </p>
          <div className="space-y-2">
            {topAtivos.map((ativo, index) => (
              <div key={ativo} className="flex items-start gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-neutral-700">{ativo}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-3">
        <Link
          href="/skin-scan/rotina"
          className="block w-full rounded-xl bg-black py-4 text-center text-sm tracking-widest text-white transition-colors hover:bg-neutral-800"
        >
          VER MINHA ROTINA PERSONALIZADA →
        </Link>
        <button
          type="button"
          onClick={() => router.push("/skin-scan/foco")}
          className="block w-full py-3 text-center text-sm text-neutral-500 transition-colors hover:text-black"
        >
          Refazer analise
        </button>
      </div>

      <p className="text-center text-xs text-neutral-400">
        A imagem foi processada e deletada imediatamente apos a analise.
        <br />
        Esta analise e orientativa e nao substitui avaliacao dermatologica.
      </p>
    </main>
  );
}
