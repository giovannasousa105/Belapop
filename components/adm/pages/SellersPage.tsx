import { Cormorant_Garamond } from "next/font/google";
import { AlertTriangle, Clock, Store, UserCheck } from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { SellerFilters } from "@/components/admin/sellers/SellerFilters";
import { SellerHighlightOnLoad } from "@/components/admin/sellers/SellerHighlightOnLoad";
import type { SellerCardData } from "@/components/admin/sellers/SellerCard";
import { SummaryStrip } from "@/components/admin/financeiro/SummaryStrip";
import { formatCurrency } from "@/lib/adm/format";
import { sellersRepository } from "@/lib/adm/repositories";
import { toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

type SellersPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

function normalizeStatus(status: string, score: number): SellerCardData["status"] {
  if (status === "bloqueado" || status === "blocked") return "bloqueado";
  if (status === "suspenso") return "suspenso";
  if (status === "pendente") return "pendente";
  if (status === "em-revisao" || score < 60) return "em-revisao";
  return "ativo";
}

function normalizeTier(tier: string, score: number): SellerCardData["tier"] {
  if (tier === "premium" || score >= 84) return "elite-curator";
  if (score >= 68) return "rising-star";
  return "newcomer";
}

function isInternalSeller(name: string, id: string) {
  const normalized = `${name} ${id}`.toLowerCase();
  const brandToken = "BelaPop".toLowerCase();
  return normalized.includes(brandToken) || normalized.includes("curadoria") || normalized.includes("interno");
}

export async function SellersPage({ filters, searchParamsSource = filters }: SellersPageProps) {
  const tierFilter = (filters as AdmFilters & { tier?: string }).tier;
  const listResult = await sellersRepository.listSellers(
    toListQueryParams(searchParamsSource, { page: 1, pageSize: 100, sortBy: "gmv30d", sortDir: "desc" })
  );

  const sellers: SellerCardData[] = listResult.data.items.map((seller) => ({
    id: seller.id,
    name: seller.name,
    tier: normalizeTier(seller.tier, seller.qualityScore),
    status: normalizeStatus(seller.status, seller.qualityScore),
    qualityScore: seller.qualityScore,
    internal: isInternalSeller(seller.name, seller.id),
    metrics: [
      { label: "GMV Mensal", value: formatCurrency(seller.gmv30d) },
      { label: "Produtos", value: String(seller.activeProducts) },
      { label: "Aprovação", value: `${Math.min(99, Math.max(0, seller.qualityScore + 8))}%` }
    ]
  }));

  const activeCount = sellers.filter((seller) => seller.status === "ativo").length;
  const reviewCount = sellers.filter((seller) => seller.status === "em-revisao" || seller.status === "pendente").length;
  const riskCount = sellers.filter((seller) => seller.status === "em-revisao" && seller.qualityScore < 60).length;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <SellerHighlightOnLoad />
      <FinanceSidebar activeHref="/adm/operacao/parceiros" />

      <main className="pl-[220px]">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/95 px-10 py-5 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
              Módulo Operação
            </p>
            <h1 className={`${cormorant.className} text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#1A1714]`}>
              Sellers / Parceiros
            </h1>
            <p className="mt-0.5 text-[11px] text-[#9E9589]">
              {sellers.length} seller{sellers.length !== 1 ? "s" : ""} cadastrado{sellers.length !== 1 ? "s" : ""}
            </p>
          </div>
        </header>

        <section className="px-10 py-7">
          <SummaryStrip
            cells={[
              { icon: <Store className="h-4 w-4" strokeWidth={1.8} />, label: "Total de Sellers", value: String(sellers.length) },
              { icon: <UserCheck className="h-4 w-4" strokeWidth={1.8} />, label: "Ativos", value: String(activeCount) },
              { icon: <Clock className="h-4 w-4" strokeWidth={1.8} />, label: "Em Revisão", value: String(reviewCount) },
              { icon: <AlertTriangle className="h-4 w-4" strokeWidth={1.8} />, label: "Em Risco", value: String(riskCount) }
            ]}
          />
        </section>

        <SellerFilters
          sellers={sellers}
          initialQuery={filters.q}
          initialStatus={filters.status}
          initialTier={tierFilter}
        />
      </main>
    </div>
  );
}
