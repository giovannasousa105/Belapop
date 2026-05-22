"use client";

import type { TwinSnapshotRow, TwinDeltaRow } from "@/lib/digitalTwin/twinTypes";

interface Props {
  snapshots: TwinSnapshotRow[];
  deltas: TwinDeltaRow[];
}

const TIPO_SHORT: Record<string, string> = {
  OLEOSA: "Oleosa",
  SECA: "Seca",
  MISTA: "Mista",
  SENSIVEL: "Sensível",
  NORMAL: "Normal",
};

export function SnapshotTimeline({ snapshots, deltas }: Props) {
  const sorted = [...snapshots].sort((a, b) => b.numero_sequencia - a.numero_sequencia);

  const deltaMap = new Map(deltas.map((d) => [d.snapshot_atual_id, d]));

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-500">Nenhum scan registrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-stone-900">Histórico de scans</h3>

      <ol className="relative border-l border-stone-200">
        {sorted.map((s) => {
          const delta = deltaMap.get(s.id);
          const date = new Date(s.criado_em);

          return (
            <li key={s.id} className="mb-6 ml-4 last:mb-0">
              <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-stone-400" />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-stone-900">
                  Scan #{s.numero_sequencia}
                </span>
                <span className="text-xs text-stone-400">
                  {date.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                  {TIPO_SHORT[s.tipo_pele] ?? s.tipo_pele}
                </span>

                {delta && (
                  <DeltaChip delta={delta.delta_global} />
                )}
              </div>

              {s.focos_selecionados.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.focos_selecionados.map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-600"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DeltaChip({ delta }: { delta: number }) {
  if (Math.abs(delta) <= 5) {
    return (
      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
        → estável
      </span>
    );
  }

  const isMelhora = delta < 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isMelhora ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {isMelhora ? `↓ ${Math.abs(delta).toFixed(1)} pts` : `↑ ${Math.abs(delta).toFixed(1)} pts`}
    </span>
  );
}
