"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getBeneficio } from "@/lib/skin-scan/ativos-map";
import { BELAPOP_SCAN_KEY } from "@/types/skin-scan";
import type { SkinScanResult } from "@/types/skin-scan";

// ── Labels ────────────────────────────────────────────────────────────────────

const TIPO_PELE_LABELS: Record<string, string> = {
  oleosa: "Oleosa",
  seca: "Seca",
  mista: "Mista",
  normal: "Normal",
  sensivel: "Sensível",
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
  hidratacao: "Hidratação",
  textura: "Textura",
  olheiras: "Olheiras",
};

const SCORE_LABELS: Record<string, string> = {
  hidratacao: "Hidratação",
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
  eritema: "Vermelhidão",
  manchas: "Manchas",
  descamacao: "Descamação",
  linhasFinas: "Linhas finas",
  acne: "Acne",
};

// Melhoria 2.1 — descrições Fitzpatrick completas
const FOTOTIPO_LABELS: Record<number, string> = {
  1: "Pele muito clara — sempre queima, nunca bronzeia. SPF 50+ obrigatório.",
  2: "Pele clara — quase sempre queima, bronzeia pouco. SPF 50+ recomendado.",
  3: "Pele média — às vezes queima, bronzeia gradualmente. SPF 30+ diário.",
  4: "Pele morena clara — raramente queima, bronzeia com facilidade. SPF 30+ diário.",
  5: "Pele morena escura — muito raramente queima, bronzeia facilmente. SPF 30+ diário.",
  6: "Pele negra — nunca queima. SPF 30+ diário para prevenir fotodano cumulativo.",
};

// Melhoria 2.2 — badge de confiança
type ConfidenceBadge = { label: string; bg: string; text: string };

function getConfidenceBadge(confianca: number): ConfidenceBadge {
  if (confianca >= 85) return { label: "Alta precisão", bg: "bg-green-100", text: "text-green-800" };
  if (confianca >= 60) return { label: "Boa leitura", bg: "bg-yellow-100", text: "text-yellow-800" };
  if (confianca >= 40) return { label: "Leitura parcial", bg: "bg-orange-100", text: "text-orange-800" };
  return { label: "Imagem difícil", bg: "bg-red-100", text: "text-red-700" };
}

function normalizeLabel(value: string) {
  return value.replace(/_/g, " ");
}

// ── Componente de ativo expandível (Melhoria 2.3) ────────────────────────────

function AtivoItem({ ativo, index }: { ativo: string; index: number }) {
  const [open, setOpen] = useState(false);
  const beneficio = getBeneficio(ativo);

  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-neutral-100"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-medium shadow-sm">
          {index + 1}
        </span>
        <span className="flex-1 text-sm text-neutral-700">{ativo}</span>
        <span className="text-[10px] text-neutral-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-neutral-100 px-3 pb-3 pt-2 text-xs leading-relaxed text-neutral-500">
          {beneficio ?? "Ativo cosmético incluído com base nos achados visuais e focos selecionados."}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SkinScanResultadoPage() {
  const router = useRouter();
  const [result, setResult] = useState<SkinScanResult | null>(null);

  useEffect(() => {
    // Aceita a chave pelo valor da constante OU pelo nome literal (fallback de compatibilidade)
    const raw =
      sessionStorage.getItem(BELAPOP_SCAN_KEY) ??
      sessionStorage.getItem("BELAPOP_SCAN_KEY");

    if (!raw) {
      router.replace("/skin-scan/foco");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SkinScanResult;

      // Compatibilidade com resultados de sessões anteriores sem o campo semanal
      if (parsed.rotina) {
        parsed.rotina.semanal = parsed.rotina.semanal ?? [];
        parsed.rotina.manha   = parsed.rotina.manha   ?? [];
        parsed.rotina.noite   = parsed.rotina.noite   ?? [];
      }

      setResult(parsed);
    } catch {
      router.replace("/skin-scan/foco");
    }
  }, [router]);

  const topAtivos = useMemo(() => {
    if (!result) return [];
    const steps = [
      ...(result.rotina.manha   ?? []),
      ...(result.rotina.noite   ?? []),
      ...(result.rotina.semanal ?? []),
      ...(result.rotina.semana1 ?? []),
    ];
    return [...new Set(steps.flatMap((step) => step.ativosChave ?? []))].slice(0, 6);
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
  const badge = getConfidenceBadge(analise.confianca);
  const needsImprovement = analise.confianca < 60;

  return (
    <main className="mx-auto max-w-2xl space-y-10 px-4 py-10">

      {/* ── Cabeçalho + badge de confiança (Melhoria 2.2) ── */}
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Etapa 3 — Resultado</p>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)" }} className="text-3xl">
          Sua análise de pele
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
            {badge.label} · {analise.confianca}%
          </span>
          {analise.modoFallback && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] text-neutral-500">
              Baseado nos focos selecionados
            </span>
          )}
        </div>
        {needsImprovement && (
          <Link
            href="/skin-scan/captura"
            className="inline-block rounded-xl border border-neutral-300 px-4 py-2 text-xs tracking-wider transition-colors hover:border-black hover:text-black"
          >
            📸 Melhorar minha análise
          </Link>
        )}
      </div>

      {analise.alertas.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
          {analise.alertas.join(" ")}
        </section>
      )}

      {/* ── Tipo de pele ── */}
      <section className="space-y-3 rounded-2xl bg-neutral-50 p-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Tipo de pele identificado</p>
        <h2 style={{ fontFamily: "var(--font-playfair, serif)" }} className="text-4xl capitalize">
          {TIPO_PELE_LABELS[analise.tipoPele] ?? analise.tipoPele}
        </h2>
        {analise.subtipo && <p className="text-sm leading-relaxed text-neutral-600">{analise.subtipo}</p>}
        <p className="text-sm leading-relaxed text-neutral-600">{analise.observacao}</p>

        {/* Melhoria 2.1 — fototipo com descrição Fitzpatrick completa */}
        {analise.fototipo && (
          <div className="rounded-xl border border-neutral-200 bg-white p-3">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400">
              Fototipo Fitzpatrick {analise.fototipo}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              {FOTOTIPO_LABELS[analise.fototipo] ?? `Fototipo ${analise.fototipo} identificado.`}
            </p>
          </div>
        )}
      </section>

      {/* ── Scores visuais ── */}
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

      {/* ── Focos considerados ── */}
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

      {/* ── Achados visuais ── */}
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

      {/* ── Ativos prioritários expandíveis (Melhoria 2.3) ── */}
      {topAtivos.length > 0 && (
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            Ativos prioritários — base científica
          </p>
          <p className="text-xs text-neutral-400">Toque em cada ativo para ver o que ele faz.</p>
          <div className="space-y-2">
            {topAtivos.map((ativo, index) => (
              <AtivoItem key={ativo} ativo={ativo} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* ── CTAs ── */}
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
          Refazer análise
        </button>
      </div>

      <p className="text-center text-xs text-neutral-400">
        A imagem foi processada e deletada imediatamente após a análise.
        <br />
        Esta análise é orientativa e não substitui avaliação dermatológica.
      </p>
    </main>
  );
}
