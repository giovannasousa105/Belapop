import type { PerfPoint } from "@/components/admin/charts/performance-chart";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatHHMM(timestamp: number) {
  const date = new Date(timestamp);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

type Args = {
  preset: "3h" | "6h";
  now?: number;
  highVolume?: boolean;
};

export function buildRealtimeSeries({ preset, now, highVolume = false }: Args): PerfPoint[] {
  const end = now ?? Date.now();

  const windowMinutes = preset === "3h" ? 180 : 360;
  const bucketMinutes =
    preset === "3h"
      ? highVolume
        ? 2
        : 1
      : highVolume
        ? 5
        : 2;
  const buckets = Math.floor(windowMinutes / bucketMinutes);
  const start = end - windowMinutes * 60_000;

  const points: PerfPoint[] = [];
  let baseGMV = 0;
  let baseOrders = 0;

  for (let index = 0; index <= buckets; index += 1) {
    const ts = start + index * bucketMinutes * 60_000;

    const noise = Math.random() - 0.5;
    const pulse = Math.random() < 0.07 ? Math.random() * 5 : 0;

    baseOrders = Math.max(0, baseOrders + Math.round(noise * 2 + pulse));
    baseGMV = Math.max(0, baseGMV + (noise * 25 + pulse * 40));

    const cancelRate = Math.max(0, Math.min(6, 0.8 + noise * 1.2));

    points.push({
      ts,
      label: formatHHMM(ts),
      gmv: Number(baseGMV.toFixed(2)),
      orders: baseOrders,
      cancelRate: Number(cancelRate.toFixed(2))
    });
  }

  return points;
}
