"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";

import type { SkinScanSnapshot } from "@/app/api/v1/me/skin-scan-snapshot/route";

const METRIC_BARS = [
  { key: "skinTexture", label: "Textura" },
  { key: "visiblePores", label: "Poros" },
  { key: "toneUniformity", label: "Uniformidade" }
] as const;

function MetricBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-medium text-[#444748]">{label}</span>
        <span className="font-semibold text-[#1c1b1b]">{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-[#1c1b1b] transition-all duration-700"
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function SkinScanSummaryCard() {
  const [snapshot, setSnapshot] = useState<SkinScanSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/me/skin-scan-snapshot")
      .then((r) => r.json())
      .then((data: { lastPopScan: SkinScanSnapshot | null }) => {
        setSnapshot(data.lastPopScan ?? null);
      })
      .catch(() => setSnapshot(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  if (!snapshot) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ScanLine className="h-5 w-5 text-black/40" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
            Skin Intelligence
          </h2>
        </div>
        <p className="mt-4 text-sm leading-7 text-black/60">
          Você ainda não fez um Skin Scan. Faça sua primeira análise para ver os resultados aqui.
        </p>
        <Link
          href="/skin-scan"
          className="mt-5 inline-flex min-h-11 items-center justify-center border border-black px-5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
        >
          Fazer Skin Scan
        </Link>
      </section>
    );
  }

  const metrics = {
    skinTexture: snapshot.skinTexture,
    visiblePores: snapshot.visiblePores,
    toneUniformity: snapshot.toneUniformity
  } as Record<string, { score: number; label: string }>;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ScanLine className="h-5 w-5 text-black/40" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
            Skin Intelligence
          </h2>
        </div>
        <time
          dateTime={snapshot.generatedAt}
          className="text-[11px] text-black/40"
        >
          {formatDate(snapshot.generatedAt)}
        </time>
      </div>

      <p className="mt-5 text-sm leading-7 text-[#444748]">{snapshot.summary}</p>

      <div className="mt-6 space-y-3">
        {METRIC_BARS.map(({ key, label }) => {
          const m = metrics[key];
          return m ? <MetricBar key={key} label={label} score={m.score} /> : null;
        })}
      </div>

      {snapshot.topConcerns.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">
            Preocupações identificadas
          </p>
          <div className="flex flex-wrap gap-2">
            {snapshot.topConcerns.map((concern) => (
              <span
                key={concern}
                className="border border-black/10 px-3 py-1 text-[11px] font-medium capitalize text-[#444748]"
              >
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-black/8 pt-5">
        <Link
          href="/skin-scan"
          className="text-[11px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4"
        >
          Fazer nova análise
        </Link>
      </div>
    </section>
  );
}
