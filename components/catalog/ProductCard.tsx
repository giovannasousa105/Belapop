import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { EditorialProduct } from "@/lib/queries/products";
import { formatPrice } from "@/lib/utils";

type ProductCardProps = {
  product: EditorialProduct;
};

export function CatalogProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex h-full flex-col rounded-bpLg border border-bpPink/15 bg-white p-5 shadow-bpMicro transition hover:-translate-y-0.5 hover:shadow-bpSoft"
    >
      <div className="h-56 rounded-bpMd bg-gradient-to-br from-bpOffWhite to-bpPinkSoft/25" />
      <div className="mt-4">
        <Badge>{product.badge}</Badge>
      </div>
      <h3 className="mt-3 line-clamp-2 font-display text-2xl text-bpBlack">{product.title}</h3>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/70">{product.brand}</p>
      <p className="mt-4 text-lg font-semibold text-bpBlack">{formatPrice(product.price)}</p>
    </Link>
  );
}
