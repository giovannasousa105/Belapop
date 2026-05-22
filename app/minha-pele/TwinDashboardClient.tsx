"use client";

import { TwinOverview } from "@/components/twin/TwinOverview";
import { MarkerEvolutionChart } from "@/components/twin/MarkerEvolutionChart";
import { BeforeAfterScores } from "@/components/twin/BeforeAfterScores";
import { SnapshotTimeline } from "@/components/twin/SnapshotTimeline";
import { TwinInsightCard } from "@/components/twin/TwinInsightCard";
import { ProximoScanCTA } from "@/components/twin/ProximoScanCTA";
import type {
  SkinTwinRow,
  TwinSnapshotRow,
  TwinDeltaRow,
  TwinTrendRow,
  TwinInsightRow,
} from "@/lib/digitalTwin/twinTypes";
import type { CopilotSeed } from "@/lib/digitalTwin/invariants";

interface DashboardData {
  twin: SkinTwinRow;
  ultimoSnapshot: TwinSnapshotRow | null;
  ultimoInsight: TwinInsightRow | null;
  copilotSeed: CopilotSeed | null;
  diasDesdeUltimoScan: number | null;
  melhoraGlobal: { delta_global: number; melhora_percentual: number } | null;
  snapshots: TwinSnapshotRow[];
  deltas: TwinDeltaRow[];
  trends: TwinTrendRow[];
}

interface Props {
  initialData: DashboardData | null;
}

export function TwinDashboardClient({ initialData }: Props) {
  if (!initialData) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-stone-900">Minha Pele</h1>
        <p className="mt-2 text-stone-500">
          Faça seu primeiro Skin Scan para começar a acompanhar a evolução da sua pele.
        </p>
        <div className="mt-6">
          <ProximoScanCTA
            proximoScanRecomendadoEm={null}
            diasDesdeUltimoScan={null}
            totalScans={0}
          />
        </div>
      </main>
    );
  }

  const {
    twin,
    ultimoSnapshot,
    ultimoInsight,
    copilotSeed,
    diasDesdeUltimoScan,
    melhoraGlobal,
    snapshots,
    deltas,
  } = initialData;

  const proximoScanEm = copilotSeed?.proximoScanRecomendadoEm ?? null;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Minha Pele</h1>
      </div>

      {/* Próximo scan — CTA no topo se for urgente */}
      <ProximoScanCTA
        proximoScanRecomendadoEm={proximoScanEm}
        diasDesdeUltimoScan={diasDesdeUltimoScan}
        totalScans={twin.total_scans}
      />

      {/* Overview: tipo, sensibilidade, melhora global */}
      <TwinOverview
        twin={twin}
        ultimoSnapshot={ultimoSnapshot}
        melhoraGlobal={melhoraGlobal}
        diasDesdeUltimoScan={diasDesdeUltimoScan}
      />

      {/* Último insight */}
      {ultimoInsight && (
        <TwinInsightCard
          insight={ultimoInsight}
          copilotSeed={copilotSeed}
        />
      )}

      {/* Evolução por marcador — Recharts, YAxis invertido */}
      {snapshots.length >= 2 && (
        <MarkerEvolutionChart snapshots={snapshots} />
      )}

      {/* Baseline vs atual */}
      {ultimoSnapshot && twin.total_scans >= 2 && (
        <BeforeAfterScores twin={twin} ultimoSnapshot={ultimoSnapshot} />
      )}

      {/* Timeline de scans */}
      <SnapshotTimeline snapshots={snapshots} deltas={deltas} />
    </main>
  );
}
