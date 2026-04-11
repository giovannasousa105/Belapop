"use client";

import { useMemo, useState } from "react";
import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionFrame } from "@/components/SectionFrame";
import type {
  ShippingMonitor,
  ShippingQueuePoint
} from "@/lib/admin/dashboardMetrics";
import { formatPrice } from "@/lib/utils";

type Props = {
  monitor: ShippingMonitor;
};

type DelayBand = "all" | "24" | "48" | "72";
type ExportRow = {
  pedido_id: string;
  status_frete: string;
  transportadora: string;
  valor_pedido_brl: string;
  idade_horas: number;
  atrasado: "sim" | "nao";
  criado_em: string;
};

const DELAY_OPTIONS: Array<{ value: DelayBand; label: string }> = [
  { value: "all", label: "Todas as faixas" },
  { value: "24", label: "> 24h" },
  { value: "48", label: "> 48h" },
  { value: "72", label: "> 72h" }
];

const STATUS_LABEL: Record<ShippingQueuePoint["shippingStatus"], string> = {
  awaiting_shipment: "Aguardando postagem",
  in_transit: "Em transito",
  delivered: "Entregue",
  other: "Outro"
};

const STATUS_TONE: Record<string, string> = {
  awaiting_shipment: "border-amber-200 bg-amber-50 text-amber-700",
  in_transit: "border-sky-200 bg-sky-50 text-sky-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  delayed: "border-rose-200 bg-rose-50 text-rose-700",
  other: "border-black/10 bg-bpOffWhite text-bpGraphite/80"
};

const formatCarrier = (carrier: string | null) =>
  carrier && carrier.trim() ? carrier.trim() : "Nao informado";

const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const toCsv = (rows: string[][]) =>
  rows.map((row) => row.map((cell) => escapeCsv(cell)).join(";")).join("\n");

const buildExportRows = (queue: ShippingQueuePoint[]): ExportRow[] =>
  queue.map((order) => ({
    pedido_id: order.id,
    status_frete: order.isDelayed ? "Atrasado" : STATUS_LABEL[order.shippingStatus],
    transportadora: formatCarrier(order.carrier),
    valor_pedido_brl: (order.amountCents / 100).toFixed(2),
    idade_horas: order.ageHours,
    atrasado: order.isDelayed ? "sim" : "nao",
    criado_em: order.createdAt ? new Date(order.createdAt).toISOString() : ""
  }));

export function ShippingMonitorSection({ monitor }: Props) {
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [delayBand, setDelayBand] = useState<DelayBand>("all");
  const [exportingXlsx, setExportingXlsx] = useState(false);

  const carriers = useMemo(
    () =>
      Array.from(new Set(monitor.queue.map((order) => formatCarrier(order.carrier)))).sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      ),
    [monitor.queue]
  );

  const minimumHours = delayBand === "all" ? null : Number(delayBand);

  const filteredQueue = useMemo(
    () =>
      monitor.queue.filter((order) => {
        const orderCarrier = formatCarrier(order.carrier);
        if (carrierFilter !== "all" && orderCarrier !== carrierFilter) {
          return false;
        }

        if (minimumHours !== null && order.ageHours <= minimumHours) {
          return false;
        }

        return true;
      }),
    [monitor.queue, carrierFilter, minimumHours]
  );

  const exportRows = useMemo(() => buildExportRows(filteredQueue), [filteredQueue]);

  const buildFilePrefix = () => {
    const dateToken = new Date().toISOString().slice(0, 10);
    const carrierToken =
      carrierFilter === "all"
        ? "todas"
        : carrierFilter.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const delayToken = delayBand === "all" ? "all" : `${delayBand}h`;

    return `frete_admin_${dateToken}_${carrierToken}_${delayToken}`;
  };

  const handleExportCsv = () => {
    if (!exportRows.length || typeof window === "undefined") return;

    const rows: string[][] = [
      [
        "pedido_id",
        "status_frete",
        "transportadora",
        "valor_pedido_brl",
        "idade_horas",
        "atrasado",
        "criado_em"
      ],
      ...exportRows.map((row) => [
        row.pedido_id,
        row.status_frete,
        row.transportadora,
        row.valor_pedido_brl,
        String(row.idade_horas),
        row.atrasado,
        row.criado_em
      ])
    ];

    const csv = toCsv(rows);
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${buildFilePrefix()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportXlsx = async () => {
    if (!exportRows.length || typeof window === "undefined") return;

    try {
      setExportingXlsx(true);
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(exportRows, {
        header: [
          "pedido_id",
          "status_frete",
          "transportadora",
          "valor_pedido_brl",
          "idade_horas",
          "atrasado",
          "criado_em"
        ]
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "frete");
      XLSX.writeFile(workbook, `${buildFilePrefix()}.xlsx`, { compression: true });
    } catch (error) {
      console.error("[shipping-monitor] xlsx export failed", error);
    } finally {
      setExportingXlsx(false);
    }
  };

  return (
    <SectionFrame>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
            Acompanhar frete
          </p>
          <h2 className="font-display text-xl text-bpBlack">
            Operacao logistica em tempo real
          </h2>
        </div>
        <LuxuryButton tone="retail" size="sm" href="/admin/orders">
          Abrir pedidos
        </LuxuryButton>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-700">
            Aguardando postagem
          </p>
          <p className="mt-1 font-display text-2xl text-amber-900">
            {monitor.awaitingShipment}
          </p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-sky-700">
            Em transito
          </p>
          <p className="mt-1 font-display text-2xl text-sky-900">
            {monitor.inTransit}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-700">
            Entregues (30d)
          </p>
          <p className="mt-1 font-display text-2xl text-emerald-900">
            {monitor.delivered}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-rose-700">
            Atrasados
          </p>
          <p className="mt-1 font-display text-2xl text-rose-900">
            {monitor.delayed}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <label className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
          Transportadora
          <select
            value={carrierFilter}
            onChange={(event) => setCarrierFilter(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm normal-case tracking-normal text-bpBlackSoft"
          >
            <option value="all">Todas</option>
            {carriers.map((carrier) => (
              <option key={carrier} value={carrier}>
                {carrier}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
          Faixa de atraso
          <select
            value={delayBand}
            onChange={(event) => setDelayBand(event.target.value as DelayBand)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm normal-case tracking-normal text-bpBlackSoft"
          >
            {DELAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="self-end flex flex-wrap items-center justify-end gap-2">
          <div className="rounded-xl border border-black/10 bg-bpOffWhite px-3 py-2 text-xs uppercase tracking-[0.2em] text-bpGraphite/80">
            Mostrando {filteredQueue.length} de {monitor.queue.length}
          </div>
          <LuxuryButton
            tone="retail"
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={filteredQueue.length === 0}
          >
            Exportar CSV
          </LuxuryButton>
          <LuxuryButton
            tone="retail"
            size="sm"
            variant="outline"
            onClick={() => {
              void handleExportXlsx();
            }}
            disabled={filteredQueue.length === 0 || exportingXlsx}
          >
            {exportingXlsx ? "Gerando XLSX..." : "Exportar XLSX"}
          </LuxuryButton>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {filteredQueue.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">
                  Pedido {order.id.slice(0, 8)}
                </p>
                <p className="text-sm font-semibold text-bpBlackSoft">
                  {formatPrice(order.amountCents / 100)}
                </p>
                <p className="text-xs text-bpGraphite/70">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString("pt-BR")
                    : "Sem data"}{" "}
                  | {order.ageHours}h em fluxo
                </p>
                <p className="text-xs text-bpGraphite/70">
                  Transportadora: {formatCarrier(order.carrier)}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
                  STATUS_TONE[order.isDelayed ? "delayed" : order.shippingStatus]
                }`}
              >
                {order.isDelayed ? "Atrasado" : STATUS_LABEL[order.shippingStatus]}
              </span>
            </div>
          </div>
        ))}
        {filteredQueue.length === 0 && (
          <p className="text-sm text-bpGraphite/70">
            Nenhum pedido com os filtros selecionados.
          </p>
        )}
      </div>
    </SectionFrame>
  );
}
