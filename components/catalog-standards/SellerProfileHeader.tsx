import Image from "next/image";
import { FileText, MapPin, PackageCheck } from "lucide-react";

import { SellerQualityBadge } from "@/components/catalog-standards/SellerQualityBadge";
import type { SellerStandardRecord } from "@/lib/catalog-standards";

type SellerProfileHeaderProps = {
  className?: string;
  seller: SellerStandardRecord;
};

export function SellerProfileHeader({ className = "", seller }: SellerProfileHeaderProps) {
  return (
    <section className={`overflow-hidden rounded-[8px] border border-black/10 bg-white ${className}`}>
      <div
        className="h-28 border-b border-black/10 bg-[#f3ece4]"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(247,241,234,0.92), rgba(247,241,234,0.52)), url(${seller.bannerUrl})` }}
      />
      <div className="grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-end">
        <div className="relative -mt-14 h-24 w-24 overflow-hidden rounded-[8px] border border-black/10 bg-white">
          <Image src={seller.logoUrl} alt={`Logo ${seller.brandName}`} fill sizes="96px" className="object-cover" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/48">{seller.mainCategory}</p>
          <h2 className="mt-1 font-editorial text-3xl leading-tight text-black">{seller.brandName}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/64">{seller.institutionalDescription}</p>
        </div>

        <SellerQualityBadge score={seller.qualityScore} status={seller.status} />
      </div>

      <div className="grid gap-3 border-t border-black/10 p-5 text-xs text-black/64 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-black/55" aria-hidden="true" />
          CNPJ validado: {seller.cnpj}
        </div>
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-black/55" aria-hidden="true" />
          SLA {seller.shippingPolicy.postingSlaHours}h
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-black/55" aria-hidden="true" />
          {seller.region}
        </div>
      </div>
    </section>
  );
}
