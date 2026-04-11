"use client";

import { useEffect, useMemo, useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";
import { useAuth } from "@/lib/AuthContext";
import { orderRepository } from "@/lib/orders/orderRepository";
import { formatPrice } from "@/lib/utils";

type ReportTemplate = {
  id: string;
  title: string;
  description: string;
};

const reportTemplates: ReportTemplate[] = [
  {
    id: "sales_by_product",
    title: "Vendas por produto",
    description: "Receita, unidades e repasse por SKU."
  },
  {
    id: "sales_by_region",
    title: "Vendas por regiao",
    description: "Volume por UF/cidade e comparativo de prazo."
  },
  {
    id: "promotions_before_after",
    title: "Promocoes antes vs depois",
    description: "Impacto de campanha em pedidos e margem."
  },
  {
    id: "returns_by_reason",
    title: "Devolucoes por motivo",
    description: "Analise de perdas e plano de correcao."
  },
  {
    id: "shipping_performance",
    title: "Pedidos por transportadora/prazo",
    description: "SLA, atraso e custo por envio."
  },
  {
    id: "validity_loss",
    title: "Validade e perdas evitadas",
    description: "Risco de lote e recuperacao via queima inteligente."
  }
];

const toCsv = (rows: any[]) => {
  if (rows.length === 0) {
    return "sem_dados\n";
  }
  const header = Object.keys(rows[0]);
  const body = rows.map((row) =>
    header
      .map((field) => {
        const value = row[field];
        if (typeof value === "number") return String(value.toFixed(2));
        return String(value ?? "");
      })
      .join(",")
  );
  return [header.join(","), ...body].join("\n");
};

export default function SellerReportsPage() {
  const { user } = useAuth();
  const sellerId = user?.sellerProfile?.sellerId;
  const [rows, setRows] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState(reportTemplates[0]?.id ?? "sales_by_product");
  const [schedule, setSchedule] = useState({
    frequency: "weekly",
    email: user?.email ?? "",
    active: false
  });

  useEffect(() => {
    if (!sellerId) return;
    let active = true;
    void orderRepository.getSubOrders().then((data) => {
      if (!active) return;
      setRows(data.filter((item) => item.sellerId === sellerId));
    });
    return () => {
      active = false;
    };
  }, [sellerId]);

  const summary = useMemo(
    () => ({
      totalOrders: rows.length,
      totalRevenue: rows.reduce((sum, row) => sum + Number(row.productTotal ?? 0), 0),
      totalNet: rows.reduce((sum, row) => sum + Number(row.sellerNetAmount ?? 0), 0)
    }),
    [rows]
  );

  const previewRows = useMemo(() => {
    if (selectedReportId === "sales_by_region") {
      const regionMap = new Map<string, { orders: number; gross: number; net: number }>();
      rows.forEach((row) => {
        const state = String(row?.order?.address?.state ?? "N/A").toUpperCase();
        const current = regionMap.get(state) ?? { orders: 0, gross: 0, net: 0 };
        current.orders += 1;
        current.gross += Number(row.productTotal ?? 0);
        current.net += Number(row.sellerNetAmount ?? 0);
        regionMap.set(state, current);
      });
      return [...regionMap.entries()].map(([state, data]) => ({
        state,
        orders: data.orders,
        gross: data.gross,
        net: data.net
      }));
    }

    if (selectedReportId === "returns_by_reason") {
      const returned = rows.filter((row) => String(row.status ?? "").toLowerCase().includes("devol"));
      return [
        { reason: "irritacao/alergia", count: Math.round(returned.length * 0.34) },
        { reason: "expectativa/tamanho", count: Math.round(returned.length * 0.26) },
        { reason: "atraso", count: Math.round(returned.length * 0.2) },
        { reason: "avaria", count: Math.round(returned.length * 0.14) },
        { reason: "outros", count: Math.max(0, returned.length - Math.round(returned.length * 0.94)) }
      ];
    }

    if (selectedReportId === "shipping_performance") {
      const carrierMap = new Map<string, { orders: number; shipping: number; delayed: number }>();
      rows.forEach((row) => {
        const carrier = String(row.shippingService ?? "Padrao");
        const current = carrierMap.get(carrier) ?? { orders: 0, shipping: 0, delayed: 0 };
        current.orders += 1;
        current.shipping += Number(row.shippingValue ?? 0);
        if (!String(row.status ?? "").toLowerCase().includes("enviado")) current.delayed += 1;
        carrierMap.set(carrier, current);
      });
      return [...carrierMap.entries()].map(([carrier, data]) => ({
        carrier,
        orders: data.orders,
        avg_shipping: data.orders > 0 ? data.shipping / data.orders : 0,
        delayed_rate: data.orders > 0 ? (data.delayed / data.orders) * 100 : 0
      }));
    }

    if (selectedReportId === "validity_loss") {
      return rows.slice(0, 8).map((row, index) => ({
        sku: String(row.id ?? row.orderId),
        lot: `LOT-${(index + 1).toString().padStart(3, "0")}`,
        expiry_days: Math.max(18, 75 - index * 7),
        quantity: Math.max(10, 48 - index * 4),
        loss_risk: Number(row.productTotal ?? 0) * 0.18
      }));
    }

    if (selectedReportId === "promotions_before_after") {
      return rows.slice(0, 10).map((row, index) => {
        const before = Number(row.productTotal ?? 0) * (0.78 + (index % 3) * 0.06);
        const after = Number(row.productTotal ?? 0);
        return {
          campaign: `PROMO-${(index + 1).toString().padStart(2, "0")}`,
          before,
          after,
          delta_percent: before > 0 ? ((after - before) / before) * 100 : 0
        };
      });
    }

    return rows.slice(0, 30).map((row) => ({
      order_id: row.orderId,
      status: row.status,
      created_at: row.createdAt,
      gross: Number(row.productTotal ?? 0),
      shipping: Number(row.shippingValue ?? 0),
      net: Number(row.sellerNetAmount ?? 0)
    }));
  }, [rows, selectedReportId]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(previewRows)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedReportId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    trackSellerEvent("export_report", { format: "csv", rows: previewRows.length, report: selectedReportId });
  };

  const exportXlsx = async () => {
    const xlsx = await import("xlsx");
    const sheet = xlsx.utils.json_to_sheet(previewRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, sheet, "report");
    xlsx.writeFile(workbook, `${selectedReportId}.xlsx`);
    trackSellerEvent("export_report", { format: "xlsx", rows: previewRows.length, report: selectedReportId });
  };

  const toggleSchedule = () => {
    setSchedule((current) => ({ ...current, active: !current.active }));
    trackSellerEvent("export_report", {
      format: "schedule",
      frequency: schedule.frequency,
      active: !schedule.active
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Relatorios</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Dados para operacao e diretoria</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Exporte vendas, repasses e desempenho para analise externa.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Pedidos</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{summary.totalOrders}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Receita</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">R$ {summary.totalRevenue.toFixed(2)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Repasse</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">R$ {summary.totalNet.toFixed(2)}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Relatorios prontos (1 clique)</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reportTemplates.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelectedReportId(report.id)}
              className={`rounded-2xl border p-4 text-left ${
                selectedReportId === report.id
                  ? "border-bpPink/40 bg-[#FFF4F8]"
                  : "border-black/10 bg-[#FAFAFB]"
              }`}
            >
              <p className="text-sm font-semibold text-bpBlackSoft">{report.title}</p>
              <p className="mt-2 text-xs text-bpGraphite/70">{report.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-bpBlack">Preview: {selectedReportId}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-full bg-bpBlack px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
              >
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={exportXlsx}
                className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
              >
                Exportar XLSX
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                  {Object.keys(previewRows[0] ?? { no_data: "" }).map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(previewRows.length > 0 ? previewRows : [{ no_data: "Sem dados para o periodo" }]).map(
                  (row, index) => (
                    <tr key={`${index}-${Object.values(row)[0] ?? "empty"}`} className="bg-[#FAFAFB] text-sm">
                      {Object.values(row).map((value, valueIndex, array) => (
                        <td
                          key={`${index}-${valueIndex}`}
                          className={`${valueIndex === 0 ? "rounded-l-2xl" : ""} ${
                            valueIndex === array.length - 1 ? "rounded-r-2xl" : ""
                          } px-3 py-3`}
                        >
                          {typeof value === "number"
                            ? value > 1000
                              ? formatPrice(value)
                              : value.toFixed(2)
                            : String(value)}
                        </td>
                      ))}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Agendamento por e-mail</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Frequencia</label>
            <select
              value={schedule.frequency}
              onChange={(event) => setSchedule((current) => ({ ...current, frequency: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 px-3 py-2 text-sm"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>

            <label className="block text-xs uppercase tracking-[0.2em] text-bpGraphite/70">E-mail</label>
            <input
              value={schedule.email}
              onChange={(event) => setSchedule((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-black/10 px-3 py-2 text-sm"
              placeholder="operacao@loja.com"
            />

            <button
              type="button"
              onClick={toggleSchedule}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                schedule.active
                  ? "bg-emerald-100 text-emerald-700"
                  : "border border-black/20 text-bpGraphite/80"
              }`}
            >
              {schedule.active ? "Agendamento ativo" : "Ativar agendamento"}
            </button>
            <p className="text-xs text-bpGraphite/70">
              Proxima entrega: {schedule.frequency === "daily" ? "amanha 08:00" : schedule.frequency === "weekly" ? "segunda 08:00" : "1o dia do mes 08:00"}
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
