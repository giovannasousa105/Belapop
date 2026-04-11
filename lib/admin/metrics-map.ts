import type { PerfPoint, RangeResp, RealtimeResp } from "@/lib/admin/metrics-types";

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function labelFor(date: Date, granularity: "minute" | "hour" | "day") {
  if (granularity === "day") {
    return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
  }
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function mapRealtime(response: RealtimeResp): PerfPoint[] {
  return response.series.map((point) => {
    const date = new Date(point.ts);
    return {
      ts: date.getTime(),
      label: labelFor(date, "minute"),
      gmv: point.gmv_cents / 100,
      orders: point.orders_paid,
      cancelRate: point.cancel_rate_bps / 100
    };
  });
}

export function mapRange(response: RangeResp): { points: PerfPoint[]; granularity: "hour" | "day" } {
  const granularity = response.granularity;
  return {
    granularity,
    points: response.series.map((point) => {
      const date = new Date(point.ts);
      return {
        ts: date.getTime(),
        label: labelFor(date, granularity === "hour" ? "hour" : "day"),
        gmv: point.gmv_cents / 100,
        orders: point.orders_paid,
        cancelRate: point.cancel_rate_bps / 100
      };
    })
  };
}
