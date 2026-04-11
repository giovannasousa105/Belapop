import Link from "next/link";

import { CatalogProductCard } from "@/components/catalog/ProductCard";
import { Section } from "@/components/ui/Section";

type BestSellerProduct = Parameters<typeof CatalogProductCard>[0]["product"];

type HomeBestSellersSectionProps = {
  products: BestSellerProduct[];
};

export function HomeBestSellersSection({ products }: HomeBestSellersSectionProps) {
  return (
    <Section id="produtos" className="bg-bpOffWhite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-bpBlackSoft">Best sellers</p>
          <h2 className="mt-3 font-display text-3xl text-bpBlack md:text-5xl">
            Vitrine premium com desejo real de compra.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-bpGraphite/82 md:text-base">
            Produtos em destaque com leitura limpa, preco visivel, assinatura editorial e CTA
            claro em desktop e mobile.
          </p>
        </div>
        <Link
          href="/catalogo"
          className="inline-flex w-full items-center justify-center rounded-full border border-bpPink/22 bg-white/78 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-bpBlack transition hover:border-bpPink/34 hover:bg-bpPinkLux/54 sm:w-auto"
        >
          Ver todos os produtos
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <CatalogProductCard key={product.id} product={product} />
        ))}
      </div>
    </Section>
  );
}
