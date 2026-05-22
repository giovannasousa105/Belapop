import type { Metadata } from "next";

import { SkincareCatalogExperience } from "@/components/skincare/SkincareCatalogExperience";
import { getProductDisplayImage } from "@/lib/product/productCovers";
import { getPublicProducts } from "@/lib/queries/products";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Skincare | BelaPop",
  description:
    "Skincare BelaPop com curadoria ativa, rotina guiada e experiência viva da categoria.",
  openGraph: {
    title: "Skincare | BelaPop",
    description:
      "Skincare BelaPop com curadoria ativa, rotina guiada e experiência viva da categoria.",
    images: [{ url: "/og-default.jpg", alt: "Skincare BelaPop" }],
    type: "website"
  }
};

function isSkincareProduct(category: string | null | undefined, title: string) {
  const normalized = `${category ?? ""} ${title}`.toLowerCase();
  return (
    normalized.includes("skin") ||
    normalized.includes("pele") ||
    normalized.includes("serum") ||
    normalized.includes("hidrat") ||
    normalized.includes("limpeza") ||
    normalized.includes("solar") ||
    normalized.includes("tonico")
  );
}

export default async function SkincarePage() {
  const products = await getPublicProducts(48);
  const skincareProducts = products
    .filter((product) => isSkincareProduct(product.category, product.title))
    .map((product) => ({
      brand: product.brand,
      category: product.category,
      currency: product.currency,
      heroImageUrl: getProductDisplayImage({
        category: product.category,
        coverImage: product.coverImage,
        heroImageUrl: product.hero_image_url
      }),
      id: product.id,
      priceCents: product.price_cents,
      slug: product.slug,
      title: product.title
    }));

  return <SkincareCatalogExperience products={skincareProducts} />;
}
