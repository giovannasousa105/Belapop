import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { CheckCircle2, Clock, Download, Landmark, LockKeyhole, Wallet } from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { RepassesTable, type RepasseRow } from "@/components/admin/financeiro/RepassesTable";
import { SummaryStrip } from "@/components/admin/financeiro/SummaryStrip";
import { formatCurrency } from "@/lib/adm/format";
import { financeRepository } from "@/lib/adm/repositories";
import { buildHref, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

type PayoutsPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

const statusMap: Record<string, RepasseRow["status"]> = {
  pendente: "pendente",
  aprovado: "agendado",
  resolvido: "pago",
  bloqueado: "bloqueado",
  alerta: "bloqueado",
  "em-revisao": "processando"
};

function formatPeriod(period: string) {
  const upper = period.toUpperCase();
  if (upper === "7D") return "Ultimos 7 dias";
  if (upper === "30D") return "Ultimos 30 dias";
  if (upper === "90D") return "Ultimos 90 dias";
  return upper;
}

export async function PayoutsPage({ filters, searchParamsSource = filters }: PayoutsPageProps) {
  const payoutsResult = await financeRepository.listPayouts({
    page: 1,
    pageSize: 24,
    sortBy: "scheduledAt",
    sortDir: "desc",
    status: filters.status,
    seller: filters.seller,
    payout: filters.payout,
    q: filters.q
  });

  const rows: RepasseRow[] = payoutsResult.data.items.map((payout) => {
    const takeRate = payout.grossAmount > 0 ? ((payout.grossAmount - payout.netAmount) / payout.grossAmount) * 100 : 0;

    return {
      id: payout.id,
      seller: payout.sellerName,
      period: formatPeriod(payout.period),
      gmv: formatCurrency(payout.grossAmount),
      takeRate: `${takeRate.toFixed(1)}%`,
      netAmount: formatCurrency(payout.netAmount),
      status: statusMap[payout.status] ?? "pendente",
      href: `/adm/financeiro/repasses?payout=${payout.id}`
    };
  });

  const totalNet = payoutsResult.data.items.reduce((sum, payout) => sum + payout.netAmount, 0);
  const pending = payoutsResult.data.items.filter((payout) => payout.status === "pendente");
  const processedToday = payoutsResult.data.items.filter((payout) => {
    const scheduled = new Date(payout.scheduledAt).toDateString();
    return payout.status === "resolvido" && scheduled === new Date().toDateString();
  });
  const blocked = payoutsResult.data.items.filter((payout) => payout.status === "bloqueado" || payout.status === "alerta");

  const statusLinks = [
    { label: "Todos", value: undefined },
    { label: "Pendentes", value: "pendente" },
    { label: "Pagos", value: "resolvido" },
    { label: "Bloqueados", value: "bloqueado" }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <FinanceSidebar activeHref="/adm/financeiro/repasses" />

      <main className="pl-[220px]">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/95 px-8 py-5 backdrop-blur-md">
          <h1 className={`${cormorant.className} text-[32px] font-semibold tracking-[-0.02em]`}>
            Repasses
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {statusLinks.map((item) => {
              const active = (filters.status ?? "") === (item.value ?? "");
              return (
                <Link
                  key={item.label}
                  href={buildHref("/adm/financeiro/repasses", searchParamsSource, { status: item.value, page: undefined })}
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
            <button className="rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#6B5E54]">
              Periodo
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#8B5E3C] px-4 py-2 text-[12px] font-semibold text-white">
              <Download className="h-4 w-4" strokeWidth={1.8} />
              Exportar
            </button>
          </div>
        </header>

        <div className="space-y-6 px-8 py-7">
          <SummaryStrip
            cells={[
              { icon: <Wallet className="h-4 w-4" strokeWidth={1.8} />, label: "Total a Repassar", value: formatCurrency(totalNet) },
              { icon: <Clock className="h-4 w-4" strokeWidth={1.8} />, label: "Repasses Pendentes", value: String(pending.length) },
              { icon: <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />, label: "Processados Hoje", value: String(processedToday.length) },
              { icon: <LockKeyhole className="h-4 w-4" strokeWidth={1.8} />, label: "Bloqueados", value: String(blocked.length) }
            ]}
          />

          <RepassesTable rows={rows} totalNetAmount={formatCurrency(totalNet)} />

          <div className="flex items-center justify-between text-[12px] text-[#9E9589]">
            <span>Mostrando {rows.length} de {payoutsResult.data.meta.total} repasses</span>
            <span className="inline-flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5" strokeWidth={1.8} />
              Dados financeiros preservados
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
