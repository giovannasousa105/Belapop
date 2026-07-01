import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { RecommendationProduct } from "@/lib/lifecycle/postPurchase";

type ComplementaryProductCardProps = {
  product: RecommendationProduct;
  className?: string;
};

const formatPrice = (priceCents: number) =>
  new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(priceCents / 100);

export function ComplementaryProductCard({ product, className = "" }: ComplementaryProductCardProps) {
  return (
    <article className={`grid grid-cols-[92px_1fr] gap-4 rounded-[8px] border border-black/10 bg-white p-4 ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-[#f7f1ea]">
        <Image
          src={product.image ?? "/catalog/premium-product-placeholder.svg"}
          alt={product.name}
          fill
          sizes="92px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">Combina com sua rotina</p>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-[#211c18]">{product.name}</h3>
        <p className="mt-2 text-xs leading-relaxed text-black/62">{product.reason}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#211c18]">{formatPrice(product.priceCents)}</span>
          <Link
            href={product.href}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-black/15 px-3 text-[10px] font-semibold uppercase tracking-[0.16em]"
          >
            Ver
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
