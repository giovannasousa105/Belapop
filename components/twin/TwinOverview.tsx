"use client";

import type { SkinTwinRow, TwinSnapshotRow } from "@/lib/digitalTwin/twinTypes";

interface Props {
  twin: SkinTwinRow;
  ultimoSnapshot: TwinSnapshotRow | null;
  melhoraGlobal: { delta_global: number; melhora_percentual: number } | null;
  diasDesdeUltimoScan: number | null;
}

const TIPO_LABEL: Record<string, string> = {
  OLEOSA: "Pele Oleosa",
  SECA: "Pele Seca",
  MISTA: "Pele Mista",
  SENSIVEL: "Pele Sensível",
  NORMAL: "Pele Normal",
};

export function TwinOverview({ twin, ultimoSnapshot, melhoraGlobal, diasDesdeUltimoScan }: Props) {
  const tipoPele = ultimoSnapshot?.tipo_pele ?? twin.tipo_pele_atual;
  const nivelSens = ultimoSnapshot?.nivel_sensibilidade ?? twin.nivel_sensibilidade_atual;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
            Skin Digital Twin
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-stone-900">
            {tipoPele ? TIPO_LABEL[tipoPele] ?? tipoPele : "Perfil em construção"}
          </h2>
          {nivelSens && (
            <p className="mt-0.5 text-sm text-stone-500">
              Sensibilidade nível {nivelSens}/5 · {twin.total_scans}{" "}
              {twin.total_scans === 1 ? "scan" : "scans"}
            </p>
          )}
        </div>

        {melhoraGlobal && (
          <MelhoraChip deltaGlobal={melhoraGlobal.delta_global} />
        )}
      </div>

      {melhoraGlobal && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Melhora geral"
            value={`${melhoraGlobal.melhora_percentual}%`}
            sub="marcadores"
          />
          <Stat
            label="Delta global"
            value={formatDelta(melhoraGlobal.delta_global)}
            sub="vs. baseline"
            positive={melhoraGlobal.delta_global < 0}
          />
          {diasDesdeUltimoScan !== null && (
            <Stat
              label="Último scan"
              value={`${diasDesdeUltimoScan}d`}
              sub="atrás"
            />
          )}
          {twin.total_scans >= 2 && (
            <Stat
              label="Scans totais"
              value={String(twin.total_scans)}
              sub="realizados"
            />
          )}
        </div>
      )}
    </div>
  );
}

function MelhoraChip({ deltaGlobal }: { deltaGlobal: number }) {
  const isMelhora = deltaGlobal < -5;
  const isPiora = deltaGlobal > 5;

  if (!isMelhora && !isPiora) {
    return (
      <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
        → Estável
      </span>
    );
  }

  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
        isMelhora
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {isMelhora ? `↓ ${Math.abs(deltaGlobal).toFixed(1)} pts` : `↑ ${Math.abs(deltaGlobal).toFixed(1)} pts`}
    </span>
  );
}

function Stat({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl bg-stone-50 p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p
        className={`mt-0.5 text-lg font-semibold ${
          positive === true
            ? "text-emerald-600"
            : positive === false
              ? "text-amber-600"
              : "text-stone-900"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-stone-400">{sub}</p>
    </div>
  );
}

function formatDelta(delta: number): string {
  const abs = Math.abs(delta).toFixed(1);
  if (delta < -5) return `↓ ${abs}`;
  if (delta > 5) return `↑ ${abs}`;
  return `→ ${abs}`;
}
