import type { SellerQualityStandard } from "@/lib/catalog-standards";

type SellerPackagingGuidelinesProps = {
  className?: string;
  seller: SellerQualityStandard;
};

export function SellerPackagingGuidelines({ className = "", seller }: SellerPackagingGuidelinesProps) {
  return (
    <section className={`rounded-[8px] border border-black/10 bg-white p-4 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/52">Guia de embalagem do seller</p>
      <h3 className="mt-1 text-sm font-semibold text-black/84">{seller.brandName}</h3>
      <p className="mt-3 text-sm leading-relaxed text-black/68">{seller.packagingPolicy}</p>
    </section>
  );
}
