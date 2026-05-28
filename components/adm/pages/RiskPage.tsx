import { Cormorant_Garamond } from "next/font/google";
import { CheckCircle2, Eye, ShieldAlert, SlidersHorizontal } from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { RiskScoreGauge } from "@/components/admin/financeiro/RiskScoreGauge";
import { formatCurrency } from "@/lib/adm/format";
import { financeRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

type RiskPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

const scoreByPriority = { baixa: 92, media: 74, alta: 58, critica: 37 } as const;

const statusBadge: Record<string, string> = {
  Pendente: "bg-amber-50 text-amber-700",
  "Em Analise": "bg-blue-50 text-blue-700",
  Bloqueado: "bg-red-50 text-red-600",
  Liberado: "bg-emerald-50 text-emerald-700"
};

function shortId(value: string) {
  return `${value.replace(/^#/, "").slice(0, 8)}...`;
}

export async function RiskPage({ filters, searchParamsSource = filters }: RiskPageProps) {
  const [alertsResult, dataSource] = await Promise.all([
    financeRepository.listFinancialAlerts(
      toListQueryParams(searchParamsSource, { page: 1, pageSize: 24, sortBy: "createdAt", sortDir: "desc" })
    ),
    getAdmDataSource()
  ]);

  const orderMap = Object.fromEntries(dataSource.orders.map((order) => [order.id, order]));
  const payoutMap = Object.fromEntries(dataSource.payouts.map((payout) => [payout.id, payout]));

  const rows = alertsResult.data.items.map((alert) => {
    const order = alert.orderId ? orderMap[alert.orderId] : undefined;
    const payout = alert.payoutId ? payoutMap[alert.payoutId] : undefined;
    const amount = payout?.grossAmount ?? order?.total ?? 0;
    const score = scoreByPriority[alert.priority as keyof typeof scoreByPriority] ?? 72;

    return {
      id: order?.id ?? alert.id,
      seller: alert.sellerName,
      amount,
      score,
      reason: alert.summary || alert.type,
      status: alert.priority === "critica" ? "Bloqueado" : alert.priority === "alta" ? "Em Analise" : "Pendente"
    };
  });

  const avgScore = rows.reduce((sum, row) => sum + row.score, 0) / Math.max(1, rows.length);
  const inReview = rows.filter((row) => row.status === "Em Analise" || row.status === "Pendente").length;
  const blockedToday = rows.filter((row) => row.status === "Bloqueado").length;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <FinanceSidebar activeHref="/adm/financeiro/risco" />

      <main className="pl-[220px]">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/95 px-8 py-5 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
              Módulo Financeiro
            </p>
            <h1 className={`${cormorant.className} text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#1A1714]`}>
              Antifraude / Risco
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#6B5E54]">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
              Score minimo
            </button>
            <button type="button" className="rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#6B5E54]">
              Periodo
            </button>
          </div>
        </header>

        <div className="space-y-6 px-8 py-7">
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="flex min-h-[170px] items-center justify-between rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9E9589]">
                  Score Médio
                </p>
                <p className="mt-2 text-sm text-[#6B5E54]">Score médio antifraude</p>
              </div>
              <RiskScoreGauge score={avgScore} label="/ 100" size={124} />
            </article>
            <article className="flex min-h-[170px] flex-col justify-between rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-6">
              <ShieldAlert className="h-5 w-5 text-[#F59E0B]" strokeWidth={1.8} />
              <div>
                <p className={`${cormorant.className} text-[46px] font-semibold leading-none text-[#1A1714]`}>
                  {inReview}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9E9589]">
                  Transações em Análise
                </p>
              </div>
            </article>
            <article className="flex min-h-[170px] flex-col justify-between rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-6">
              <CheckCircle2 className="h-5 w-5 text-[#EF4444]" strokeWidth={1.8} />
              <div>
                <p className={`${cormorant.className} text-[46px] font-semibold leading-none text-[#1A1714]`}>
                  {blockedToday}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9E9589]">
                  Bloqueados Hoje
                </p>
              </div>
            </article>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white">
            <table className="w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {["ID Transação", "Seller", "Valor", "Score Risco", "Motivo", "Status", "Ações"].map((heading, index) => (
                    <th
                      key={heading}
                      className={`border-b border-[rgba(139,94,60,0.14)] bg-[#F4F1ED] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9E9589] ${
                        index === 2 || index === 3 ? "text-right" : ""
                      } ${index === 0 ? "rounded-tl-xl" : ""} ${index === 6 ? "rounded-tr-xl text-right" : ""}`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-[rgba(139,94,60,0.08)]">
                    <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 font-mono text-[12px] text-[#1A1714]">
                      {shortId(row.id)}
                    </td>
                    <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-sm font-medium text-[#1A1714]">
                      {row.seller}
                    </td>
                    <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-right text-sm font-semibold text-[#1A1714] [font-variant-numeric:tabular-nums]">
                      {formatCurrency(row.amount)}
                    </td>
                    <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-right">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold [font-variant-numeric:tabular-nums]"
                        style={{
                          color: row.score < 60 ? "#EF4444" : row.score < 80 ? "#92400E" : "#065F46",
                          background: row.score < 60 ? "#FEE2E2" : row.score < 80 ? "#FEF3C7" : "#D1FAE5"
                        }}
                      >
                        {row.score}/100
                      </span>
                    </td>
                    <td className="max-w-[380px] border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-sm text-[#6B5E54]">
                      <span className="line-clamp-2">{row.reason}</span>
                    </td>
                    <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge[row.status] ?? statusBadge.Pendente}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="border-b border-[rgba(139,94,60,0.07)] px-4 py-3.5 text-right">
                      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(139,94,60,0.14)] text-[#9E9589] transition hover:border-[rgba(139,94,60,0.30)] hover:text-[#8B5E3C]">
                        <Eye className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border-t-4 border-double border-[rgba(139,94,60,0.14)] px-4 py-4 text-sm font-bold text-[#1A1714]" colSpan={2}>
                    Total
                  </td>
                  <td className="border-t-4 border-double border-[rgba(139,94,60,0.14)] px-4 py-4 text-right text-sm font-bold text-[#1A1714]">
                    {formatCurrency(rows.reduce((sum, row) => sum + row.amount, 0))}
                  </td>
                  <td className="border-t-4 border-double border-[rgba(139,94,60,0.14)] px-4 py-4" colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}
