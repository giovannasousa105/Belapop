type TrackingStep = {
  key: string;
  label: string;
  done: boolean;
};

const normalize = (value: string | null | undefined) => (value ?? "").toLowerCase();

export const statusLabel = (status: string | null | undefined) => {
  const value = normalize(status);
  if (value.includes("paid") || value.includes("pag")) return "Pago";
  if (value.includes("separ") || value.includes("picking") || value.includes("awaiting_shipment")) {
    return "Em separacao";
  }
  if (value.includes("ship") || value.includes("enviado") || value.includes("transit")) return "Enviado";
  if (value.includes("entreg") || value.includes("deliver") || value.includes("fulfilled")) return "Entregue";
  if (value.includes("cancel")) return "Cancelado";
  if (value.includes("refund")) return "Reembolsado";
  return status ?? "Em atualizacao";
};

const statusIndex = (status: string | null | undefined) => {
  const label = statusLabel(status);
  if (label === "Pago") return 0;
  if (label === "Em separacao") return 1;
  if (label === "Enviado") return 3;
  if (label === "Entregue") return 4;
  if (label === "Cancelado" || label === "Reembolsado") return -1;
  return 0;
};

export const buildTrackingTimeline = (status: string | null | undefined): TrackingStep[] => {
  const steps = ["Pago", "Em separacao", "Postado", "Em rota", "Entregue"];
  const index = statusIndex(status);
  return steps.map((label, current) => ({
    key: label.toLowerCase().replace(/\s+/g, "_"),
    label,
    done: index >= current
  }));
};
