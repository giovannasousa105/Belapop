import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, WalletCards } from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { RefundCard, type RefundCardData } from "@/components/admin/financeiro/RefundCard";
import { SummaryStrip } from "@/components/admin/financeiro/SummaryStrip";
import { formatCurrency } from "@/lib/adm/format";
import { financeRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { buildHref, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

type RefundsPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

function daysBetween(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function shortDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export async function RefundsPage({ filters, searchParamsSource = filters }: RefundsPageProps) {
  const [refundsResult, dataSource] = await Promise.all([
    financeRepository.listRefunds({
      page: 1,
      pageSize: 24,
      sortBy: "requestedAt",
      sortDir: "desc",
      status: filters.status,
      seller: filters.seller,
      order: filters.order,
      refund: filters.refund,
      q: filters.q
    }),
    getAdmDataSource()
  ]);

  const customerMap = Object.fromEntries(dataSource.customers.map((customer) => [customer.id, customer]));
  const rows: RefundCardData[] = refundsResult.data.items.map((refund) => ({
    id: refund.id,
    orderId: refund.orderId,
    requestedAt: shortDate(refund.requestedAt),
    reason: refund.reason,
    customerName: customerMap[refund.customerId]?.name ?? "Cliente BelaPop",
    sellerName: refund.sellerName,
    daysOpen: daysBetween(refund.requestedAt),
    amount: formatCurrency(refund.amount)
  }));

  const pending = refundsResult.data.items.filter((refund) => refund.status === "pendente" || refund.status === "em-revisao");
  const autoApprovedToday = refundsResult.data.items.filter((refund) => {
    const requested = new Date(refund.requestedAt).toDateString();
    return refund.status === "resolvido" && requested === new Date().toDateString();
  });
  const pendingValue = pending.reduce((sum, refund) => sum + refund.amount, 0);
  const overdue = rows.filter((refund) => refund.daysOpen > 7);

  const filtersNav = [
    { label: "Todos", value: undefined },
    { label: "Pendentes", value: "pendente" },
    { label: "Em Revisao", value: "em-revisao" },
    { label: "Pagos", value: "resolvido" }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <FinanceSidebar activeHref="/adm/financeiro/reembolsos" />

      <main className="pl-[220px]">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/95 px-8 py-5 backdrop-blur-md">
          <h1 className={`${cormorant.className} text-[32px] font-semibold tracking-[-0.02em]`}>
            Reembolsos
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {filtersNav.map((item) => {
              const active = (filters.status ?? "") === (item.value ?? "");
              return (
                <Link
                  key={item.label}
                  href={buildHref("/adm/financeiro/reembolsos", searchParamsSource, { status: item.value, page: undefined })}
                  className={`rounded-xl border px-3.5 py-2 text-[12px] font-semibold transition ${
                    active
                      ? "border-[rgba(139,94,60,0.30)] bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]"
                      : "border-[rgba(139,94,60,0.14)] bg-white text-[#6B5E54] hover:border-[rgba(139,94,60,0.30)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              className="rounded-xl bg-[#8B5E3C] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#7A5234]"
            >
              Aprovar Selecionados
            </button>
          </div>
        </header>

        <div className="space-y-6 px-8 py-7">
          <SummaryStrip
            cells={[
              { icon: <Clock className="h-4 w-4" strokeWidth={1.8} />, label: "Pendentes de Aprovacao", value: String(pending.length) },
              { icon: <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />, label: "Auto-aprovados Hoje", value: String(autoApprovedToday.length) },
              { icon: <WalletCards className="h-4 w-4" strokeWidth={1.8} />, label: "Valor Total Pendente", value: formatCurrency(pendingValue) },
              { icon: <AlertTriangle className="h-4 w-4" strokeWidth={1.8} />, label: "Fora do Prazo", value: String(overdue.length) }
            ]}
          />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9E9589]">
                Fila de Reembolsos
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#9E9589]">
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                {rows.length} solicitacoes
              </span>
            </div>
            {rows.map((refund) => (
              <RefundCard key={refund.id} refund={refund} />
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
