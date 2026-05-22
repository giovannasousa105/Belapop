import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BundleRecommendationCard,
  ProductRecommendationCard,
  WorthInvestmentBlock
} from "@/components/pop-guide/PopGuideCards";
import {
  AddRoutineToCartCTA,
  ConciergeCTA,
  MobileGuideBar,
  SkinScanCTA
} from "@/components/pop-guide/PopGuideActions";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import {
  getProductRecommendations,
  getWorthInvestmentGuide,
  worthInvestmentGuides
} from "@/lib/content/popGuide";

type WorthPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return worthInvestmentGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: WorthPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getWorthInvestmentGuide(slug);

  if (!guide) {
    return {
      title: "Vale o investimento? | BelaPop",
      description: "Análise comercial BelaPop para comprar com mais critério."
    };
  }

  return {
    title: guide.metaTitle,
    description: guide.metaDescription
  };
}

export default async function WorthInvestmentPage({ params }: WorthPageProps) {
  const { slug } = await params;
  const guide = getWorthInvestmentGuide(slug);

  if (!guide) notFound();

  const products = getProductRecommendations(guide.productIds);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Product",
      name: guide.productName
    },
    author: { "@type": "Organization", name: "BelaPop" },
    reviewBody: guide.promise
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BelaPopValidatedHeader activeSection="diario" />
      <main className="bg-[#fcf9f8] pb-28 pt-20 text-[#1c1b1b] lg:pb-20 lg:pt-28">
        <article>
          <header className="px-4 py-12 sm:px-6 lg:px-8 lg:py-18">
            <div className="mx-auto max-w-[1180px]">
              <nav className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a8179]">
                <Link href="/guias">Guias</Link> / Vale o investimento? / {guide.productName}
              </nav>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.36em] text-[#6c5e06]">
                Vale o investimento?
              </p>
              <h1 className="mt-4 max-w-4xl font-headline text-5xl leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                {guide.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f5a55]">
                {guide.promise}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <SkinScanCTA label="Ver se combina com minha pele" />
                <AddRoutineToCartCTA
                  label="Adicionar a minha rotina"
                  productIds={products}
                  bundleId={guide.bundleIds[0]}
                  origin={`worth_${guide.slug}_intro`}
                />
              </div>
            </div>
          </header>

          <section className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1180px]">
              <WorthInvestmentBlock guide={guide} />
            </div>
          </section>

          <section className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <h2 className="font-headline text-4xl leading-[0.95] tracking-[-0.04em]">
                  Produtos relacionados
                </h2>
                <div className="mt-6 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2">
                  {products.map((product) => (
                    <ProductRecommendationCard key={product.productId} product={product} />
                  ))}
                </div>
                <div className="mt-5 border border-[#ded8d2] bg-white p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
                    Alternativa mais acessivel
                  </p>
                  <ProductRecommendationCard product={guide.affordableAlternative} />
                </div>
              </div>
              <div className="grid gap-5">
                {guide.bundleIds.map((bundleId) => (
                  <BundleRecommendationCard
                    key={bundleId}
                    bundleId={bundleId}
                    reason="O kit ajuda a transformar a análise em rotina completa, sem depender de produto isolado."
                  />
                ))}
                <ConciergeCTA origin={`worth_${guide.slug}_footer`} />
              </div>
            </div>
          </section>
        </article>
      </main>
      <MobileGuideBar
        bundleId={guide.bundleIds[0]}
        products={products}
        label="Adicionar a rotina"
      />
      <BelaPopValidatedFooter />
    </>
  );
}
