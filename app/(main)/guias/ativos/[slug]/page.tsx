import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BundleRecommendationCard,
  ProductRecommendationCard
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
  getIngredientGuide,
  getProductRecommendations,
  ingredientGuides
} from "@/lib/content/popGuide";

type IngredientPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return ingredientGuides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: IngredientPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getIngredientGuide(slug);

  if (!guide) {
    return {
      title: "Guia de ativo | BelaPop",
      description: "Guia BelaPop para comprar skincare com mais confianca."
    };
  }

  return {
    title: guide.metaTitle,
    description: guide.metaDescription
  };
}

export default async function IngredientGuidePage({ params }: IngredientPageProps) {
  const { slug } = await params;
  const guide = getIngredientGuide(slug);

  if (!guide) notFound();

  const products = getProductRecommendations(guide.productIds);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.headline,
    description: guide.metaDescription,
    author: { "@type": "Organization", name: "BelaPop" },
    about: guide.name
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
                <Link href="/guias">Guias</Link> / <Link href="/guias#ativos">Ativos</Link> / {guide.name}
              </nav>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.36em] text-[#6c5e06]">
                Guia de ativo
              </p>
              <h1 className="mt-4 max-w-4xl font-headline text-5xl leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                {guide.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f5a55]">
                {guide.summary}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <AddRoutineToCartCTA
                  label="Comprar rotina indicada"
                  productIds={products}
                  bundleId={guide.bundleIds[0]}
                  origin={`ingredient_${guide.slug}_intro`}
                />
                <SkinScanCTA label="Ver se combina com minha pele" />
              </div>
            </div>
          </header>

          <section className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-[1180px] gap-4 lg:grid-cols-2">
              {[
                ["Para quem e indicado", guide.indicatedFor],
                ["Para quem não e ideal", guide.notIdealFor],
                ["Como usar", guide.howToUse],
                ["Combina com", guide.combinesWith],
                ["Exige cuidado com", guide.cautionWith]
              ].map(([title, items]) => (
                <section key={title as string} className="border border-[#ded8d2] bg-white p-5">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#6c5e06]">
                    {title as string}
                  </h2>
                  <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#4c4744]">
                    {(items as string[]).map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>

          <section className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1180px]">
              <h2 className="font-headline text-4xl leading-[0.95] tracking-[-0.04em]">
                Produtos recomendados
              </h2>
              <div className="mt-6 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-3">
                {products.map((product) => (
                  <ProductRecommendationCard key={product.productId} product={product} />
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-2">
              {guide.bundleIds.map((bundleId) => (
                <BundleRecommendationCard
                  key={bundleId}
                  bundleId={bundleId}
                  reason={`Kit coerente para encaixar ${guide.name} sem comprar produto solto sem contexto.`}
                />
              ))}
              <ConciergeCTA origin={`ingredient_${guide.slug}_middle`} />
            </div>
          </section>
        </article>
      </main>
      <MobileGuideBar
        bundleId={guide.bundleIds[0]}
        products={products}
        label="Comprar rotina indicada"
      />
      <BelaPopValidatedFooter />
    </>
  );
}
