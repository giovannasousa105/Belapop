import type { SellerQualityStandard } from "@/lib/catalog-standards";

type SellerQualityScoreProps = {
  className?: string;
  seller: SellerQualityStandard;
};

export function SellerQualityScore({ className = "", seller }: SellerQualityScoreProps) {
  const entries = [
    ["Dados", seller.scoreBreakdown.completeness ?? seller.scoreBreakdown.catalogQuality],
    ["Envio", seller.scoreBreakdown.shipment],
    ["Devolucao", seller.scoreBreakdown.returnRate],
    ["Embalagem", seller.scoreBreakdown.packaging ?? seller.scoreBreakdown.visualStandardization],
    ["Autenticidade", seller.scoreBreakdown.authenticity ?? seller.scoreBreakdown.reliability],
    ["Resposta", seller.scoreBreakdown.responseTime],
    ["Problemas", seller.scoreBreakdown.problemRate ?? seller.scoreBreakdown.complaints],
    ["Reputacao", seller.scoreBreakdown.reviews]
  ] as const;

  return (
    <section className={`rounded-[8px] border border-black/10 bg-white p-4 ${className}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/52">Score do seller</p>
          <h3 className="mt-1 text-sm font-semibold text-black/84">{seller.brandName}</h3>
        </div>
        <p className="font-editorial text-4xl leading-none text-black">{seller.qualityScore}</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {entries.map(([label, value]) => (
          <div key={label}>
            <div className="flex items-center justify-between gap-3 text-xs text-black/60">
              <span>{label}</span>
              <span className="font-semibold text-black/80">{value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/8">
              <div className="h-full rounded-full bg-black" style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
