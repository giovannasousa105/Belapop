import { Cormorant_Garamond } from "next/font/google";
import { Download, Filter } from "lucide-react";

import { AuditTable, type AuditRow } from "@/components/admin/financeiro/AuditTable";
import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { SeverityTabs } from "@/components/admin/financeiro/SeverityTabs";
import { financeRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { buildHref, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

type AuditPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export async function AuditPage({ filters, searchParamsSource }: AuditPageProps) {
  const [alertsResult, dataSource] = await Promise.all([
    financeRepository.listFinancialAlerts(
      toListQueryParams(searchParamsSource, { page: 1, pageSize: 24, sortBy: "createdAt", sortDir: "desc" })
    ),
    getAdmDataSource()
  ]);

  const rows: AuditRow[] = alertsResult.data.items.map((alert) => ({
    id: alert.id,
    type: alert.type,
    description: alert.summary,
    priority: alert.priority,
    date: formatDate(alert.createdAt),
    href: buildHref("/adm/financeiro/auditoria", searchParamsSource, { alert: alert.id })
  }));

  const counts = dataSource.financialAlerts.reduce<Record<string, number>>(
    (acc, alert) => {
      acc.all += 1;
      acc[alert.priority] = (acc[alert.priority] ?? 0) + 1;
      return acc;
    },
    { all: 0, critica: 0, alta: 0, media: 0, baixa: 0 }
  );

  const activeValue = filters.priority ?? "all";
  const tabs = [
    {
      label: "Todos",
      value: "all",
      href: buildHref("/adm/financeiro/auditoria", searchParamsSource, { priority: undefined, page: undefined }),
      count: counts.all
    },
    {
      label: "Critico",
      value: "critica",
      href: buildHref("/adm/financeiro/auditoria", searchParamsSource, { priority: "critica", page: undefined }),
      count: counts.critica,
      variant: "critical" as const
    },
    {
      label: "Alto",
      value: "alta",
      href: buildHref("/adm/financeiro/auditoria", searchParamsSource, { priority: "alta", page: undefined }),
      count: counts.alta,
      variant: "warning" as const
    },
    {
      label: "Medio",
      value: "media",
      href: buildHref("/adm/financeiro/auditoria", searchParamsSource, { priority: "media", page: undefined }),
      count: counts.media
    },
    {
      label: "Baixo",
      value: "baixa",
      href: buildHref("/adm/financeiro/auditoria", searchParamsSource, { priority: "baixa", page: undefined }),
      count: counts.baixa
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <FinanceSidebar activeHref="/adm/financeiro/auditoria" />

      <main className="pl-[220px]">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/95 px-8 py-5 backdrop-blur-md">
          <h1 className={`${cormorant.className} text-[32px] font-semibold tracking-[-0.02em]`}>
            Auditoria Financeira
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#6B5E54]">
              <Filter className="h-4 w-4" strokeWidth={1.8} />
              Prioridade
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#6B5E54]">
              <Filter className="h-4 w-4" strokeWidth={1.8} />
              Tipo
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#8B5E3C] px-4 py-2 text-[12px] font-semibold text-white">
              <Download className="h-4 w-4" strokeWidth={1.8} />
              Exportar CSV
            </button>
          </div>
        </header>

        <div className="border-b border-[rgba(139,94,60,0.07)] px-8 pt-5">
          <SeverityTabs tabs={tabs} activeValue={activeValue} />
        </div>

        <section className="space-y-4 px-8 py-7">
          <AuditTable rows={rows} />
          <p className="text-[12px] text-[#9E9589]">
            Exibindo {rows.length} de {alertsResult.data.meta.total} alertas financeiros.
          </p>
        </section>
      </main>
    </div>
  );
}
