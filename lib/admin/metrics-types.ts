export type Range = "today" | "7d" | "30d" | "90d";
export type RealtimeWindow = "3h" | "6h";
export type MetricMode = "gmv" | "orders";

export type RealtimeResp = {
  window: "3h" | "6h";
  bucket: "1m" | "2m" | "5m";
  series: Array<{
    ts: string;
    gmv_cents: number;
    orders_paid: number;
    cancels: number;
    cancel_rate_bps: number;
  }>;
  updated_at: string;
};

export type RangeResp = {
  range: "7d" | "30d" | "90d";
  granularity: "hour" | "day";
  series: Array<{
    ts: string;
    gmv_cents: number;
    orders_paid: number;
    cancels: number;
    cancel_rate_bps: number;
  }>;
  updated_at: string;
};

export type PerfPoint = {
  ts: number;
  label: string;
  gmv: number;
  orders: number;
  cancelRate: number;
};
