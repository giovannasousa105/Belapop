"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MARKER_CHART_CONFIG } from "@/lib/digitalTwin/invariants";
import type { TwinSnapshotRow } from "@/lib/digitalTwin/twinTypes";

// MARKER_CHART_CONFIG.yAxisInverted === true  ← NUNCA remover
// YAxis reversed={true}                       ← OBRIGATÓRIO
// score menor aparece mais alto na tela = pele melhor

interface Props {
  snapshots: TwinSnapshotRow[];
  marcadores?: string[];
}

const MARKER_CORES: Record<string, string> = {
  acne: "#ef4444",
  poros: "#f97316",
  textura: "#eab308",
  oleosidade: "#84cc16",
  pigmentacao: "#6366f1",
  vermelhidao: "#ec4899",
  ressecamento: "#06b6d4",
};

const MARKER_LABELS: Record<string, string> = {
  acne: "Acne",
  poros: "Poros",
  textura: "Textura",
  oleosidade: "Oleosidade",
  pigmentacao: "Pigmentação",
  vermelhidao: "Vermelhidão",
  ressecamento: "Ressecamento",
};

const DEFAULT_MARKERS = ["acne", "oleosidade", "vermelhidao", "ressecamento"];

export function MarkerEvolutionChart({ snapshots, marcadores = DEFAULT_MARKERS }: Props) {
  if (snapshots.length < 2) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-500">
          Você precisa de pelo menos 2 scans para ver a evolução.
        </p>
      </div>
    );
  }

  // Montar dados na ordem cronológica correta
  const data = [...snapshots]
    .sort((a, b) => a.numero_sequencia - b.numero_sequencia)
    .map((s, idx) => {
      const point: Record<string, number | string> = {
        name: `Scan ${s.numero_sequencia}`,
        idx,
      };
      for (const m of marcadores) {
        point[m] = Math.round(s.scores_normalizados[m] ?? 0);
      }
      return point;
    });

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-stone-900">Evolução por marcador</h3>
        <span className="text-xs text-stone-400">← melhor (score menor = pele melhor)</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          {/*
           * YAxis reversed={true} — OBRIGATÓRIO
           * MARKER_CHART_CONFIG.yAxisInverted === true
           * score menor = pele melhor = aparece mais alto
           */}
          <YAxis
            reversed={true}
            domain={[...MARKER_CHART_CONFIG.yDomain]}
            tick={{ fontSize: 12 }}
            label={{
              value: MARKER_CHART_CONFIG.yAxisLabel,
              angle: -90,
              position: "insideLeft",
              offset: 10,
              style: { fontSize: 11, fill: "#78716c" },
            }}
          />
          <Tooltip
            formatter={(value, name) => {
              const numericValue = typeof value === "number" ? value : Number(value ?? 0);
              const markerName = typeof name === "string" ? name : String(name ?? "");

              return [
                `${Number.isFinite(numericValue) ? numericValue : 0} pts`,
                MARKER_LABELS[markerName] ?? markerName,
              ];
            }}
          />
          <Legend
            formatter={(value) => MARKER_LABELS[value] ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {marcadores.map((m) => (
            <Line
              key={m}
              type="monotone"
              dataKey={m}
              stroke={MARKER_CORES[m] ?? "#a8a29e"}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
