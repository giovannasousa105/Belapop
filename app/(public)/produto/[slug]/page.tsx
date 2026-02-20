import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogProductCard } from "@/components/catalog/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getPublicProductBySlug, getPublicProducts } from "@/lib/queries/products";
import { formatPrice } from "@/lib/utils";

export const revalidate = 300;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveProduct(value: string) {
  const bySlug = await getPublicProductBySlug(value);
  if (bySlug) return bySlug;

  const products = await getPublicProducts(80);
  return products.find((product) => product.id === value) ?? null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    return {
      title: "Produto | BelaPop",
      description: "Curadoria editorial de beleza e autocuidado."
    };
  }

  return {
    title: `${product.title} | ${product.brand} | BelaPop`,
    description: `${product.editorialReason} Sensacao: ${product.sensation.join(", ")}.`
  };
}

export default async function ProdutoPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getPublicProducts(10);
  const combineWith = allProducts
    .filter((item) => item.id !== product.id)
    .slice(0, 2);

  return (
    <div className="bg-bpOffWhite text-bpGraphite">
      <Section className="bg-white">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="h-[520px] rounded-bpLg border border-bpPink/15 bg-gradient-to-br from-bpOffWhite to-bpPinkSoft/25" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {product.gallery.slice(0, 3).map((image, index) => (
                <div
                  key={`${image.url}-${index}`}
                  className="h-28 rounded-bpMd border border-bpPink/15 bg-bpOffWhite"
                  aria-label={image.alt}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Badge>{product.badge}</Badge>
              <h1 className="mt-3 font-display text-4xl leading-tight text-bpBlack md:text-5xl">
                {product.title}
              </h1>
              <p className="mt-2 text-sm uppercase tracking-[0.22em] text-bpGraphite/70">
                {product.brand}
              </p>
              <p className="mt-4 text-3xl font-semibold text-bpBlack">{formatPrice(product.price)}</p>
            </div>

            <div className="rounded-bpLg border border-bpPink/20 bg-bpOffWhite p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-bpPink">Por que entrou na curadoria</p>
              <p className="mt-2 text-sm leading-relaxed text-bpGraphite">{product.editorialReason}</p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-bpPink">Textura & sensacao</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-bpPink/30 px-3 py-1 text-xs text-bpPink">
                  {product.texture}
                </span>
                {product.sensation.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-bpPink/20 bg-bpPink/5 px-3 py-1 text-xs text-bpGraphite"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-bpPink">Como usar no ritual</p>
              <ol className="mt-3 space-y-2 text-sm text-bpGraphite">
                {product.howToUse.slice(0, 3).map((step, index) => (
                  <li key={step} className="rounded-bpMd border border-bpPink/15 bg-white px-4 py-3">
                    <span className="mr-2 font-semibold text-bpPink">{index + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="sticky bottom-4 z-10 rounded-bpLg border border-bpPink/20 bg-white p-4 shadow-bpSoft">
              <div className="flex flex-wrap gap-3">
                <Button href="/carrinho" className="flex-1 min-w-[180px]">
                  Adicionar ao carrinho
                </Button>
                <Button href="/checkout" variant="secondary" className="flex-1 min-w-[180px]">
                  Comprar agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-bpOffWhite">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-bpBlack">Combine com</h2>
          <Link href="/catalogo" className="text-xs uppercase tracking-[0.24em] text-bpPink">
            Ver catalogo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
          {combineWith.map((item) => (
            <CatalogProductCard key={item.id} product={item} />
          ))}
        </div>
      </Section>
    </div>
  );
}


