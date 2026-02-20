"use client";

import { useMemo } from "react";

type HistoryEntry = {
  status: string;
  created_at: string;
};

type StepKey =
  | "confirmed"
  | "payment_approved"
  | "picking"
  | "shipped"
  | "delivered";

type OrderTimelineProps = {
  history?: HistoryEntry[];
  currentStatus?: string | null;
};

const steps: Array<{ key: StepKey; label: string }> = [
  { key: "confirmed", label: "Confirmado" },
  { key: "payment_approved", label: "Pagamento aprovado" },
  { key: "picking", label: "Em separação" },
  { key: "shipped", label: "Enviado" },
  { key: "delivered", label: "Entregue" }
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const mapStatus = (status?: string | null): StepKey | null => {
  if (!status) return null;
  const value = normalize(status);

  if (value.includes("confirm")) return "confirmed";
  if (value.includes("pagamento") || value.includes("payment") || value.includes("paid") || value.includes("processing")) {
    return "payment_approved";
  }
  if (value.includes("separacao") || value.includes("picking") || value.includes("fulfillment") || value.includes("preparando")) {
    return "picking";
  }
  if (value.includes("enviado") || value.includes("shipped") || value.includes("transit") || value.includes("despach")) {
    return "shipped";
  }
  if (value.includes("entregue") || value.includes("delivered") || value.includes("finalizado") || value.includes("completed")) {
    return "delivered";
  }
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

    const currentKey = mapStatus(currentStatus) ?? null;
    const currentIdx = currentKey
      ? steps.findIndex((step) => step.key === currentKey)
      : 0;

    return {
      stageDates: dates,
      currentIndex: Math.max(historyIndex, currentIdx)
    };
  }, [history, currentStatus]);

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
        Linha do tempo
      </p>
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
                  isComplete
                    ? "border-bpPink bg-bpPink"
                    : "border-black/20 bg-white"
                }`}
              />
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/80">
                  {step.label}
                </p>
                <p className="text-xs text-bpGraphite/70">
                  {date ? formatDate(date) : "Em atualização"}
                </p>
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
