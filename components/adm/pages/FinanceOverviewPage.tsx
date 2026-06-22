import { Cormorant_Garamond } from "next/font/google";
import { Download, Landmark, ReceiptText, RotateCcw, ShieldAlert, TrendingUp } from "lucide-react";

import { FinanceKpiCard } from "@/components/admin/financeiro/FinanceKpiCard";
import { FinanceNavCard } from "@/components/admin/financeiro/FinanceNavCard";
import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";
import { canAccessRoute } from "@/lib/adm/auth/guards";
import { formatCurrency } from "@/lib/adm/format";
import { financeRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { AdmFilters } from "@/lib/adm/url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

export async function FinanceOverviewPage({ filters: _filters }: { filters: AdmFilters }) {
  const [summary, dataSource, currentUser] = await Promise.all([
    financeRepository.getFinanceSummary(),
    getAdmDataSource(),
    getCurrentAdmUser()
  ]);

  const canAudit = currentUser ? canAccessRoute(currentUser, "/adm/financeiro/auditoria").allowed : false;
  const pendingPayouts = dataSource.payouts.filter((payout) => payout.status === "pendente");
  const pendingRefunds = dataSource.refunds.filter((refund) => refund.status !== "resolvido");
  const criticalAlerts = dataSource.financialAlerts.filter((alert) => alert.priority === "critica").length;
  const openAlerts = summary.openAlerts;

  const navCards = [
    {
      href: "/adm/financeiro/repasses",
      label: "Repasses",
      description: "Pagamentos e ciclos sellers",
      icon: <Landmark className="h-5 w-5" strokeWidth={1.8} />,
      badge: pendingPayouts.length ? `${pendingPayouts.length}` : undefined,
      badgeVariant: "warning" as const
    },
    {
      href: "/adm/financeiro/reembolsos",
      label: "Reembolsos",
      description: "Devoluções e aprovacoes",
      icon: <RotateCcw className="h-5 w-5" strokeWidth={1.8} />,
      badge: pendingRefunds.length ? `${pendingRefunds.length}` : undefined,
      badgeVariant: "warning" as const
    },
    {
      href: canAudit ? "/adm/financeiro/auditoria" : "/adm/financeiro",
      label: "Auditoria",
      description: "Alertas e reconciliacao",
      icon: <ReceiptText className="h-5 w-5" strokeWidth={1.8} />,
      badge: openAlerts ? `${openAlerts}` : undefined,
      badgeVariant: criticalAlerts ? ("critical" as const) : ("default" as const)
    },
    {
      href: "/adm/financeiro/risco",
      label: "Antifraude",
      description: "Risco e fraude",
      icon: <ShieldAlert className="h-5 w-5" strokeWidth={1.8} />,
      badge: criticalAlerts ? `${criticalAlerts}` : undefined,
      badgeVariant: "critical" as const
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <FinanceSidebar activeHref="/adm/financeiro" />

      <main className="pl-[220px]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/95 px-8 py-5 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
              Módulo Financeiro
            </p>
            <h1 className={`${cormorant.className} text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#1A1714]`}>
              Financeiro
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#6B5E54] transition hover:border-[rgba(139,94,60,0.30)] hover:text-[#8B5E3C]"
          >
            <Download className="h-4 w-4" strokeWidth={1.8} />
            Exportar
          </button>
        </header>

        <section className="grid grid-cols-1 gap-4 px-8 py-7 md:grid-cols-2 xl:grid-cols-4">
          <FinanceKpiCard
            label="GMV Total"
            value={formatCurrency(summary.grossPayout)}
            subtext="Volume bruto"
            icon={<TrendingUp className="h-4 w-4" strokeWidth={1.8} />}
          />
          <FinanceKpiCard
            label="Repasses Pendentes"
            value={String(pendingPayouts.length)}
            subtext={formatCurrency(pendingPayouts.reduce((sum, item) => sum + item.netAmount, 0))}
            icon={<Landmark className="h-4 w-4" strokeWidth={1.8} />}
            variant="warning"
          />
          <FinanceKpiCard
            label="Reembolsos Pendentes"
            value={String(pendingRefunds.length)}
            subtext={formatCurrency(pendingRefunds.reduce((sum, item) => sum + item.amount, 0))}
            icon={<RotateCcw className="h-4 w-4" strokeWidth={1.8} />}
            variant="warning"
          />
          <FinanceKpiCard
            label="Alertas"
            value={String(openAlerts)}
            subtext={`${criticalAlerts} criticos`}
            icon={<ShieldAlert className="h-4 w-4" strokeWidth={1.8} />}
            variant={criticalAlerts ? "critical" : "default"}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 px-8 pb-8 lg:grid-cols-2">
          {navCards.map((card) => (
            <FinanceNavCard key={card.href} {...card} />
          ))}
        </section>
      </main>
    </div>
  );
}
