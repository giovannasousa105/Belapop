"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/lib/AuthContext";
import { getBeneficio } from "@/lib/skin-scan/ativos-map";
import { findLocalEvidence } from "@/lib/evidence/evidence-database";
import { BELAPOP_SCAN_KEY } from "@/types/skin-scan";
import type { SkinScanResult } from "@/types/skin-scan";

const LAST_SCAN_DATE_KEY = "belapop_last_scan_date";

// ── Tipos para comparação com scan anterior (Melhoria 2.4) ───────────────────

type PreviousScan = {
  scanDate: string;          // ISO
  overallScore: number;      // 0-100
  skinType: string | null;
};

// ── Melhoria 5 — SkinGPT ─────────────────────────────────────────────────────

const MAX_QUESTIONS = 3;

type GptEntry = { question: string; answer: string | null; loading: boolean };

/** Chips de perguntas sugeridas de acordo com os focos selecionados */
function suggestedQuestions(focos: string[]): string[] {
  const chips: string[] = [];
  if (focos.includes("oleosidade")) chips.push("Por que minha pele fica oleosa?");
  if (focos.includes("manchas")) chips.push("Como clarear manchas de forma segura?");
  if (focos.includes("acne")) chips.push("O que piora a acne?");
  if (focos.some((f) => f === "linhas_finas" || f === "linhas")) chips.push("Quando começar a usar retinol?");
  if (focos.includes("sensibilidade")) chips.push("Como fortalecer a barreira da pele?");
  if (focos.includes("poros")) chips.push("Como reduzir a aparência dos poros?");
  chips.push("Posso usar maquiagem com essa rotina?");
  return chips.slice(0, 5); // máximo de 5 chips
}

/** Widget de perguntas ao SkinGPT — inline, sem modal */
function SkinGptWidget({
  focos,
  analise,
  isLoggedIn,
}: {
  focos: string[];
  analise: SkinScanResult["analise"];
  isLoggedIn: boolean;
}) {
  const [entries, setEntries] = useState<GptEntry[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(() => suggestedQuestions(focos), [focos]);
  const remaining = MAX_QUESTIONS - entries.length;

  const ask = async (question: string) => {
    if (!question.trim() || remaining <= 0) return;
    const trimmed = question.trim();

    // Enriquecer a pergunta com contexto para o SkinGPT dar resposta mais específica
    const contextualQuestion = `${trimmed} (Contexto da usuária: pele ${analise.tipoPele}, focos: ${focos.join(", ")})`;

    setInput("");
    setError(null);
    setEntries((prev) => [...prev, { question: trimmed, answer: null, loading: true }]);

    try {
      const res = await fetch("/api/v1/skingpt/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: contextualQuestion }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Erro ${res.status}`);
      }

      const data = (await res.json()) as { answer?: string };
      setEntries((prev) =>
        prev.map((e) => (e.question === trimmed && e.loading ? { ...e, answer: data.answer ?? "—", loading: false } : e))
      );
    } catch (err) {
      setEntries((prev) =>
        prev.map((e) => (e.question === trimmed && e.loading ? { ...e, answer: null, loading: false } : e))
      );
      setError(err instanceof Error ? err.message : "Não foi possível obter resposta. Tente novamente.");
    }

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-neutral-200 p-5 text-center">
        <p className="text-sm text-neutral-600">Faça login para perguntar sobre sua pele ao SkinGPT.</p>
        <Link
          href="/conta/login?returnTo=/skin-scan/resultado"
          className="mt-3 inline-block rounded-lg bg-black px-5 py-2.5 text-xs tracking-wider text-white transition-colors hover:bg-neutral-800"
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chips de perguntas sugeridas */}
      {remaining > 0 && entries.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] tracking-wide text-neutral-700 transition-colors hover:border-black hover:bg-white"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Histórico de Q&A */}
      {entries.map((entry, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-end">
            <span className="max-w-[85%] rounded-2xl rounded-tr-sm bg-black px-4 py-2.5 text-xs leading-relaxed text-white">
              {entry.question}
            </span>
          </div>
          <div className="flex justify-start">
            {entry.loading ? (
              <span className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-neutral-100 px-4 py-2.5 text-xs text-neutral-500">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-neutral-400 border-t-transparent" />
                Consultando SkinGPT...
              </span>
            ) : entry.answer ? (
              <span className="max-w-[90%] rounded-2xl rounded-tl-sm bg-neutral-100 px-4 py-2.5 text-xs leading-relaxed text-neutral-700">
                {entry.answer}
              </span>
            ) : null}
          </div>
        </div>
      ))}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-xs text-red-600">{error}</p>
      )}

      {/* Campo de texto livre */}
      {remaining > 0 ? (
        <form
          onSubmit={(e) => { e.preventDefault(); ask(input); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Faça uma pergunta sobre sua pele..."
            maxLength={400}
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs outline-none transition-colors focus:border-black"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-xl bg-black px-4 py-2.5 text-xs tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
          >
            →
          </button>
        </form>
      ) : (
        <p className="text-center text-xs text-neutral-400">
          Limite de {MAX_QUESTIONS} perguntas por sessão atingido.
        </p>
      )}

      {remaining > 0 && remaining < MAX_QUESTIONS && (
        <p className="text-right text-[10px] text-neutral-400">
          {remaining} pergunta{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}
        </p>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

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
  hidratação: "Hidratação",
  textura: "Textura",
  olheiras: "Olheiras",
};

const SCORE_LABELS: Record<string, string> = {
  hidratação: "Hidratação",
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

// ── Fontes científicas ────────────────────────────────────────────────────────

const GRADE_CHIP_STYLES: Record<"A" | "B" | "C", { bg: string; text: string }> = {
  A: { bg: "bg-green-100",   text: "text-green-800" },
  B: { bg: "bg-blue-100",    text: "text-blue-800" },
  C: { bg: "bg-neutral-100", text: "text-neutral-600" },
};

function FontesCientificas({ ativosChave }: { ativosChave: string[] }) {
  const sources = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{
      ativo: string;
      grade: "A" | "B" | "C";
      fonte: string;
      summary: string;
      pubmedUrl: string | null;
      doiUrl: string | null;
      cochraneUrl: string | null;
    }> = [];

    for (const ativo of ativosChave) {
      const ev = findLocalEvidence(ativo);
      if (!ev || seen.has(ev.ativo)) continue;
      seen.add(ev.ativo);
      items.push({
        ativo: ev.ativo,
        grade: ev.grade,
        fonte: ev.fonte,
        summary: ev.summary,
        pubmedUrl: ev.pubmedIds?.[0]
          ? `https://pubmed.ncbi.nlm.nih.gov/${ev.pubmedIds[0]}/`
          : null,
        doiUrl: ev.doi ? `https://doi.org/${ev.doi}` : null,
        cochraneUrl: ev.cochrane ?? null,
      });
    }

    // Ordenar: Grau A primeiro, depois B, depois C
    return items.sort((a, b) =>
      a.grade.charCodeAt(0) - b.grade.charCodeAt(0)
    );
  }, [ativosChave]);

  if (sources.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          Fontes científicas desta análise
        </p>
        <p className="text-xs text-neutral-400">
          Ativos recomendados com base em estudos clínicos revisados por pares.
        </p>
      </div>

      <div className="space-y-2">
        {sources.map((src) => {
          const chip = GRADE_CHIP_STYLES[src.grade] ?? GRADE_CHIP_STYLES.C;
          return (
            <div
              key={src.ativo}
              className="rounded-xl border border-neutral-100 bg-neutral-50 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip.bg} ${chip.text}`}>
                  Grau {src.grade}
                </span>
                <span className="text-[10px] text-neutral-500">{src.fonte}</span>
                <span className="flex-1" />
                {src.pubmedUrl && (
                  <a
                    href={src.pubmedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                  >
                    PubMed ↗
                  </a>
                )}
                {src.doiUrl && (
                  <a
                    href={src.doiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-neutral-500 transition-colors hover:text-black hover:underline"
                  >
                    DOI ↗
                  </a>
                )}
                {src.cochraneUrl && (
                  <a
                    href={src.cochraneUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-green-700 transition-colors hover:text-green-900 hover:underline"
                  >
                    Cochrane ↗
                  </a>
                )}
              </div>
              <p className="mt-1.5 text-[11px] capitalize font-medium text-neutral-700">
                {src.ativo}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
                {src.summary}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SkinScanResultadoPage() {
  const router = useRouter();
  const { user, ready: authReady } = useAuth();
  const [result, setResult] = useState<SkinScanResult | null>(null);
  const [previousScan, setPreviousScan] = useState<PreviousScan | null | "loading">("loading");

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

      // Melhoria 4.3 — salvar data do último scan em localStorage para mostrar na landing
      try {
        localStorage.setItem(LAST_SCAN_DATE_KEY, new Date().toISOString());
      } catch { /* localStorage pode estar indisponível em alguns ambientes */ }
    } catch {
      router.replace("/skin-scan/foco");
    }
  }, [router]);

  // Melhoria 2.4 — buscar scan anterior (somente se logada)
  useEffect(() => {
    if (!authReady) return;
    if (!user) { setPreviousScan(null); return; }

    fetch("/api/v1/faceshield/scans")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: Array<{ created_at: string; score?: { overall_score: number; skin_type: string | null } | null }> } | null) => {
        const items = data?.items ?? [];
        // Ordenar do mais recente para o mais antigo e pegar o segundo (o atual será persistido depois)
        const sorted = [...items].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        // O primeiro item é o scan mais recente salvo — usar como referência "anterior"
        const prev = sorted[0];
        if (!prev?.score) { setPreviousScan(null); return; }
        setPreviousScan({
          scanDate: prev.created_at,
          overallScore: prev.score.overall_score,
          skinType: prev.score.skin_type,
        });
      })
      .catch(() => setPreviousScan(null));
  }, [authReady, user]);

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

  // Score medio atual em escala 0-100 (para comparar com overall_score anterior)
  const currentAvgScore = useMemo(() => {
    const vals = Object.values(result?.analise.scores ?? {});
    if (!vals.length) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10);
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

      {/* ── Melhoria 4.2 — Banner de login para não-logadas ── */}
      {authReady && !user && (
        <section className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-neutral-600">
            💾 Faça login para salvar sua análise e acompanhar a evolução da sua pele ao longo do tempo.
          </p>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/conta/login?returnTo=/skin-scan/resultado`}
              className="rounded-lg bg-black px-4 py-2 text-[11px] font-semibold tracking-wider text-white transition-colors hover:bg-neutral-800"
            >
              Entrar
            </Link>
            <Link
              href={`/conta/cadastro?returnTo=/skin-scan/resultado`}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-[11px] font-semibold tracking-wider text-neutral-700 transition-colors hover:border-black"
            >
              Criar conta
            </Link>
          </div>
        </section>
      )}

      {/* ── Cabeçalho + badge de confiança (Melhoria 2.2) ── */}
      <div className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Etapa 3 — Resultado</p>
        <h1 style={{ fontFamily: "var(--font-playfair, serif)" }} className="text-3xl">
          Sua análise de pele
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {analise.modoFallback ? (
            <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800">
              Leitura parcial · baseada nos seus focos
            </span>
          ) : (
            <>
              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                ✓ Análise visual completa · {analise.confianca}%
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] text-neutral-500">
                {badge.label}
              </span>
            </>
          )}
        </div>
        {/* Botão "Refazer" apenas quando análise foi completa — em fallback a ação está no card */}
        {needsImprovement && !analise.modoFallback && (
          <Link
            href="/skin-scan/captura"
            className="inline-block rounded-xl border border-neutral-300 px-4 py-2 text-xs tracking-wider transition-colors hover:border-black hover:text-black"
          >
            📸 Refazer análise
          </Link>
        )}
      </div>

      {analise.modoFallback ? (
        <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg leading-none">💡</span>
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                Rotina personalizada pelos seus focos
              </p>
              <p className="text-sm leading-6 text-amber-900/80">
                A leitura visual não ficou conclusiva desta vez — iluminação ou ângulo da foto
                podem afetar a precisão. Sua rotina foi montada diretamente com base nas suas
                preocupações e segue os mesmos critérios clínicos de sempre.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/skin-scan/captura"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-800 transition-colors hover:bg-amber-100"
            >
              📸 Tentar com outra foto
            </Link>
            <Link
              href="/skin-scan/foco"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700 transition-colors hover:border-amber-300"
            >
              Ajustar focos →
            </Link>
          </div>
        </section>
      ) : analise.alertas.length > 0 && (
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
        {/* Subtipo e observação: só quando não é fallback — em fallback já estão no card acima */}
        {!analise.modoFallback && analise.subtipo && (
          <p className="text-sm leading-relaxed text-neutral-600">{analise.subtipo}</p>
        )}
        {!analise.modoFallback && (
          <p className="text-sm leading-relaxed text-neutral-600">{analise.observacao}</p>
        )}

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

      {/* ── Melhoria 2.4 — Evolução da pele ── */}
      {user && previousScan !== "loading" && (
        <section className="space-y-3 rounded-xl border border-neutral-200 p-5">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Evolução da sua pele</p>

          {previousScan === null ? (
            <div className="space-y-1">
              <p className="text-sm text-neutral-700">Este é seu primeiro scan registrado.</p>
              <p className="text-xs text-neutral-400">
                Faça um novo scan em 30 dias para acompanhar como sua pele evolui com a rotina.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">
                Comparado ao scan de{" "}
                {new Date(previousScan.scanDate).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <div className="flex items-center gap-4 rounded-lg bg-neutral-50 p-3">
                <div className="flex-1 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400">Anterior</p>
                  <p className="mt-0.5 text-2xl font-medium">{previousScan.overallScore}</p>
                </div>
                <div className="flex flex-col items-center">
                  {currentAvgScore > previousScan.overallScore ? (
                    <span className="text-lg text-green-600">↑</span>
                  ) : currentAvgScore < previousScan.overallScore ? (
                    <span className="text-lg text-red-500">↓</span>
                  ) : (
                    <span className="text-lg text-neutral-400">→</span>
                  )}
                  <span className={`text-xs font-semibold ${
                    currentAvgScore > previousScan.overallScore ? "text-green-600"
                    : currentAvgScore < previousScan.overallScore ? "text-red-500"
                    : "text-neutral-400"
                  }`}>
                    {currentAvgScore > previousScan.overallScore ? "+" : ""}
                    {currentAvgScore - previousScan.overallScore} pts
                  </span>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400">Agora</p>
                  <p className="mt-0.5 text-2xl font-medium">{currentAvgScore}</p>
                </div>
              </div>
              <Link
                href="/popclub"
                className="block text-center text-xs tracking-wider text-neutral-400 transition-colors hover:text-black"
              >
                Ver histórico completo →
              </Link>
            </div>
          )}
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

      {/* ── Melhoria 5 — SkinGPT integrado ── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-neutral-500">Tem dúvidas sobre seu resultado?</p>
          <p className="text-sm text-neutral-600">
            Pergunte ao SkinGPT — responde com base na sua análise e em evidências científicas.
          </p>
        </div>
        <SkinGptWidget
          focos={result.focos}
          analise={analise}
          isLoggedIn={authReady && !!user}
        />
      </section>

      {/* ── Fontes científicas desta análise ── */}
      {topAtivos.length > 0 && (
        <FontesCientificas ativosChave={topAtivos} />
      )}

      <p className="text-center text-xs text-neutral-400">
        A imagem foi processada e deletada imediatamente após a análise.
        <br />
        Esta análise é orientativa e não substitui avaliação dermatológica.
      </p>
    </main>
  );
}
