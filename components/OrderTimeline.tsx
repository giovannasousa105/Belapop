"use client";

import { useMemo } from "react";

import { TRACKING_STEPS, resolveOrderUiStatus } from "@/lib/customer/portal";

type HistoryEntry = {
  status: string;
  created_at: string;
};

type StepKey =
  | "payment_approved"
  | "separating"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

type OrderTimelineProps = {
  history?: HistoryEntry[];
  currentStatus?: string | null;
};

const steps: Array<{ key: StepKey; label: string }> = [
  { key: "payment_approved", label: TRACKING_STEPS[0] },
  { key: "separating", label: TRACKING_STEPS[1] },
  { key: "shipped", label: TRACKING_STEPS[2] },
  { key: "in_transit", label: TRACKING_STEPS[3] },
  { key: "out_for_delivery", label: TRACKING_STEPS[4] },
  { key: "delivered", label: TRACKING_STEPS[5] }
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const mapStatus = (status?: string | null): StepKey | null => {
  if (!status) return null;
  const value = normalize(status);

  if (value.includes("out_for_delivery") || value.includes("saiu_para_entrega")) {
    return "out_for_delivery";
  }
  if (value.includes("in_transit") || value.includes("transito") || value.includes("em_rota")) {
    return "in_transit";
  }
  if (value.includes("delivered") || value.includes("entregue")) {
    return "delivered";
  }
  if (value.includes("shipped") || value.includes("postado") || value.includes("enviado")) {
    return "shipped";
  }
  if (
    value.includes("processing") ||
    value.includes("separando") ||
    value.includes("separacao") ||
    value.includes("ready_to_ship")
  ) {
    return "separating";
  }
  if (value.includes("paid") || value.includes("pagamento") || value.includes("aprovado")) {
    return "payment_approved";
  }
  return null;
};

const mapOrderStatusToStep = (status?: string | null): StepKey | null => {
  const resolved = resolveOrderUiStatus(status);
  if (resolved === "ORDER_DELIVERED") return "delivered";
  if (resolved === "ORDER_PARTIALLY_DELIVERED") return "out_for_delivery";
  if (resolved === "ORDER_SHIPPED" || resolved === "ORDER_PARTIALLY_SHIPPED") return "shipped";
  if (resolved === "ORDER_PROCESSING" || resolved === "ORDER_PARTIALLY_PROCESSING") return "separating";
  if (resolved === "ORDER_PAID") return "payment_approved";
  return null;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  });

export const OrderTimeline = ({ history = [], currentStatus }: OrderTimelineProps) => {
  const { stageDates, currentIndex } = useMemo(() => {
    const dates = new Map<StepKey, string>();
    history.forEach((entry) => {
      const key = mapStatus(entry.status);
      if (key && !dates.has(key)) {
        dates.set(key, entry.created_at);
      }
    });

    const historyIndex = history.reduce((acc, entry) => {
      const key = mapStatus(entry.status);
      if (!key) return acc;
      const idx = steps.findIndex((step) => step.key === key);
      return Math.max(acc, idx);
    }, 0);

    const currentKey = mapOrderStatusToStep(currentStatus) ?? null;
    const currentIdx = currentKey ? steps.findIndex((step) => step.key === currentKey) : 0;

    return {
      stageDates: dates,
      currentIndex: Math.max(historyIndex, currentIdx)
    };
  }, [history, currentStatus]);

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Linha do tempo</p>
      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:gap-4">
        {steps.map((step, index) => {
          const isComplete = index <= currentIndex;
          const date = stageDates.get(step.key);
          return (
            <div
              key={step.key}
              className="relative flex flex-1 items-start gap-3 md:flex-col md:items-start"
            >
              <div
                className={`mt-1 h-3 w-3 rounded-full border ${
                  isComplete ? "border-bpPink bg-bpPink" : "border-black/20 bg-white"
                }`}
              />
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/80">{step.label}</p>
                <p className="text-xs text-bpGraphite/70">{date ? formatDate(date) : "Em atualizacao"}</p>
              </div>
              {index < steps.length - 1 ? (
                <span className="absolute left-1.5 top-4 hidden h-px w-full bg-black/10 md:block" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
