import Link from "next/link";

import { ScoreDots } from "@/components/admin/sellers/ScoreDots";
import { SellerAvatar } from "@/components/admin/sellers/SellerAvatar";
import { SellerMetricsGrid, type SellerMetric } from "@/components/admin/sellers/SellerMetricsGrid";
import { TierBadge, type SellerTier } from "@/components/admin/sellers/TierBadge";

export type SellerCardData = {
  id: string;
  name: string;
  tier: SellerTier;
  status: "ativo" | "em-revisao" | "suspenso" | "pendente" | "bloqueado";
  qualityScore: number;
  metrics: SellerMetric[];
  internal?: boolean;
};

const statusConfig = {
  ativo: { color: "#065F46", bg: "#D1FAE5", label: "Ativo" },
  "em-revisao": { color: "#92400E", bg: "#FEF3C7", label: "Em Revisao" },
  suspenso: { color: "#7F1D1D", bg: "#FEE2E2", label: "Suspenso" },
  pendente: { color: "#1E3A8A", bg: "#DBEAFE", label: "Pendente" },
  bloqueado: { color: "#374151", bg: "#F3F4F6", label: "Bloqueado" }
};

export function SellerCard({ seller }: { seller: SellerCardData }) {
  const status = statusConfig[seller.status] ?? statusConfig.pendente;
  const atRisk = seller.status === "em-revisao" && seller.qualityScore < 60;

  return (
    <article
      id={`seller-${seller.id}`}
      className={`flex flex-col gap-4 rounded-2xl border border-[rgba(139,94,60,0.07)] bg-white p-[22px] transition-all hover:-translate-y-0.5 hover:border-[rgba(139,94,60,0.30)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.07)] ${
        atRisk ? "border-l-[3px] border-l-[#F59E0B]" : ""
      }`}
    >
      <div className="flex items-center gap-3.5">
        <SellerAvatar name={seller.name} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-semibold text-[#1A1714]">{seller.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <TierBadge tier={seller.tier} />
            {seller.internal ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                Interno
              </span>
            ) : null}
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ color: status.color, background: status.bg }}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <SellerMetricsGrid metrics={seller.metrics} />

      <div className="flex items-center gap-2.5 border-t border-[rgba(139,94,60,0.07)] py-3">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9E9589]">
          Score de Qualidade
        </span>
        <ScoreDots score={seller.qualityScore} />
        <span className="min-w-6 text-right text-[13px] font-bold text-[#1A1714] [font-variant-numeric:tabular-nums]">
          {seller.qualityScore}
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <Link
          href={`/adm/operacao/parceiros?seller=${seller.id}`}
          className="flex-1 rounded-[9px] bg-[#8B5E3C] py-2.5 text-center text-[13px] font-semibold text-white transition hover:bg-[#7A5234] hover:shadow-[0_4px_12px_rgba(139,94,60,0.30)]"
        >
          Ver Detalhe
        </Link>
        <Link
          href={`/adm/curadoria/documentos?seller=${seller.id}`}
          className="rounded-[9px] border border-[rgba(139,94,60,0.14)] px-3.5 py-2.5 text-[13px] font-medium text-[#6B5E54] transition hover:border-[#8B5E3C] hover:text-[#8B5E3C]"
        >
          Documentos
        </Link>
      </div>
    </article>
  );
}
