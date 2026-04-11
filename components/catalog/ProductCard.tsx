import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { EditorialCoverHeader } from "@/components/ui/EditorialCoverHeader";
import { getProductDisplayImage } from "@/lib/product/productCovers";
import { formatPrice } from "@/lib/utils";

type ProductCardProduct = {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
  category?: string | null;
  price?: number;
  price_cents?: number;
  badge?: string;
  badges?: string[] | null;
  tags?: string[] | null;
  hero_image_url?: string | null;
  coverImage?: string | null;
};

type ProductCardProps = {
  product: ProductCardProduct;
};

export function CatalogProductCard({ product }: ProductCardProps) {
  const badge = product.badge ?? product.badges?.[0] ?? "Curadoria";
  const visualTagMap: Record<string, string> = {
    skin_tone_deep: "Pele Negra",
    hair_crespo: "Cabelo Crespo",
    high_pigment: "Alta pigmentacao",
    hair_cacheado: "Cabelo Cacheado",
    no_white_cast: "Sem esbranquicar",
    no_gray_cast: "Nao acinzenta"
  };
  const visualTags = Array.from(
    new Set(
      (product.tags ?? [])
        .map((tag) => visualTagMap[tag])
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 3);
  const price =
    typeof product.price === "number"
      ? product.price
      : Math.round((product.price_cents ?? 0)) / 100;
  const imageUrl = getProductDisplayImage({
    category: product.category,
    heroImageUrl: product.hero_image_url,
    coverImage: product.coverImage
  });
  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,238,240,0.82)_100%)] shadow-[0_18px_48px_rgba(91,49,56,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(91,49,56,0.1)]"
    >
      <EditorialCoverHeader
        imageUrl={imageUrl}
        imageAlt={product.title}
        sizes="(max-width: 767px) 72vw, (max-width: 1279px) 33vw, 25vw"
        heightClassName="h-36 sm:h-44"
        leftLabel="BelaPop"
        rightLabel={badge}
        title={(product.category ?? "curadoria premium").replaceAll("_", " ")}
        subtitle={product.brand ?? "Assinatura BelaPop"}
      />
      <div className="flex h-full flex-col p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Badge>{badge}</Badge>
          <p className="text-[10px] uppercase tracking-[0.22em] text-bpGraphite/74 sm:text-xs sm:tracking-[0.24em]">
            {product.brand ?? "BelaPop"}
          </p>
        </div>
        <h3 className="mt-3 line-clamp-2 font-display text-[1.22rem] font-normal leading-[1.06] tracking-[-0.022em] text-bpBlack sm:mt-4 sm:text-[1.68rem]">
          {product.title}
        </h3>
        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-bpGraphite/78 sm:text-xs sm:tracking-[0.18em]">
          {(product.category ?? "curadoria premium").replaceAll("_", " ")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
          {(visualTags.length > 0 ? visualTags : ["Curadoria BelaPop"]).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[rgba(216,160,172,0.22)] bg-bpPinkLux/88 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-bpBlackSoft sm:px-3 sm:text-[10px] sm:tracking-[0.2em]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-4 sm:pt-5">
          <p className="text-[1.04rem] font-semibold tracking-[-0.015em] text-bpBlack sm:text-xl">{formatPrice(price)}</p>
          <span className="text-[10px] uppercase tracking-[0.22em] text-bpBlackSoft/88">
            Beleza guiada
          </span>
        </div>
      </div>
    </Link>
  );
}
