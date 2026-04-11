import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductPdpPremiumMobile } from "@/components/product/ProductPdpPremiumMobile";
import { getPublicProductBySlug, getPublicProducts } from "@/lib/queries/products";

export const revalidate = 300;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveProduct(value: string) {
  const bySlug = await getPublicProductBySlug(value);
  if (bySlug) return bySlug;

  const products = await getPublicProducts(80);
  const byId = products.find((product) => product.id === value);
  if (byId) return byId;

  const normalizedValue = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const byTitle = products.find((product) =>
    product.title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .includes(normalizedValue)
  );
  if (byTitle) return byTitle;

  return products[0] ?? null;
}

function resolveProductMetadataDescription(
  description: string | undefined,
  editorialReason: string,
  category: string
) {
  const baseCopy =
    description?.trim() ||
    editorialReason.trim() ||
    `Produto da categoria ${category}.`;

  return `${baseCopy} Caracteristicas do produto, modo de uso e condicoes de compra transparentes.`;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    return {
      title: "Produto | BelaPop",
      description: "Curadoria confiavel para decisao em skincare."
    };
  }

  return {
    title: `${product.title} | ${product.brand} | BelaPop`,
    description: resolveProductMetadataDescription(
      product.description,
      product.editorialReason,
      product.category
    )
  };
}

export default async function ProdutoPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductPdpPremiumMobile product={product} />;
}
