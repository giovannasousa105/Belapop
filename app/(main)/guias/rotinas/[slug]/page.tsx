import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BundleRecommendationCard,
  ProductRecommendationCard,
  RoutineStepCard
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
  getRoutineGuide,
  routineGuides
} from "@/lib/content/popGuide";
import { formatBundleCurrency } from "@/lib/skincare/skincareBundles";

type RoutinePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return routineGuides.map((routine) => ({ slug: routine.slug }));
}

export async function generateMetadata({ params }: RoutinePageProps): Promise<Metadata> {
  const { slug } = await params;
  const routine = getRoutineGuide(slug);

  if (!routine) {
    return {
      title: "Rotina BelaPop",
      description: "Rotina de skincare compravel por necessidade."
    };
  }

  return {
    title: routine.metaTitle,
    description: routine.metaDescription
  };
}

export default async function RoutineGuidePage({ params }: RoutinePageProps) {
  const { slug } = await params;
  const routine = getRoutineGuide(slug);

  if (!routine) notFound();

  const products = getProductRecommendations(routine.productIds);
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: routine.title,
    description: routine.metaDescription,
    step: [...routine.morningSteps, ...routine.nightSteps].map((step) => ({
      "@type": "HowToStep",
      name: step.title,
      text: step.description
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BelaPopValidatedHeader activeSection="skincare" />
      <main className="bg-[#fcf9f8] pb-28 pt-20 text-[#1c1b1b] lg:pb-20 lg:pt-28">
        <header className="px-4 py-12 sm:px-6 lg:px-8 lg:py-18">
          <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[minmax(0,0.9fr)_320px] lg:items-end">
            <div>
              <nav className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a8179]">
                <Link href="/guias">Guias</Link> / <Link href="/guias#rotinas">Rotinas</Link> / {routine.title}
              </nav>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.36em] text-[#6c5e06]">
                Rotina por necessidade
              </p>
              <h1 className="mt-4 max-w-4xl font-headline text-5xl leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                {routine.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f5a55]">
                {routine.diagnosis}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <AddRoutineToCartCTA
                  label="Comprar rotina completa"
                  productIds={products}
                  bundleId={routine.recommendedBundleId}
                  origin={`routine_${routine.slug}_intro`}
                />
                <ConciergeCTA origin={`routine_${routine.slug}_intro`} />
              </div>
            </div>
            <aside className="border border-[#ded8d2] bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a8179]">
                Ticket estimado
              </p>
              <p className="mt-2 font-headline text-4xl">
                {formatBundleCurrency(routine.estimatedTicket)}
              </p>
              <p className="mt-4 text-sm leading-6 text-[#5f5a55]">{routine.promise}</p>
            </aside>
          </div>
        </header>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-2">
            <div>
              <h2 className="font-headline text-4xl leading-[0.95] tracking-[-0.04em]">
                Ordem da manha
              </h2>
              <ol className="mt-5 grid gap-3">
                {routine.morningSteps.map((step) => (
                  <RoutineStepCard key={`${step.period}-${step.order}`} step={step} />
                ))}
              </ol>
            </div>
            <div>
              <h2 className="font-headline text-4xl leading-[0.95] tracking-[-0.04em]">
                Ordem da noite
              </h2>
              <ol className="mt-5 grid gap-3">
                {routine.nightSteps.map((step) => (
                  <RoutineStepCard key={`${step.period}-${step.order}`} step={step} />
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <h2 className="font-headline text-4xl leading-[0.95] tracking-[-0.04em]">
                Produtos sugeridos
              </h2>
              <div className="mt-6 flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-3">
                {products.map((product) => (
                  <ProductRecommendationCard key={product.productId} product={product} />
                ))}
              </div>
            </div>
            <BundleRecommendationCard
              bundleId={routine.recommendedBundleId}
              reason="A compra em kit reduz indecisão e mantem a ordem de uso coerente."
            />
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-3 border-y border-[#ded8d2] py-8 sm:flex-row">
            <SkinScanCTA label="Fazer Skin Scan" />
            <ConciergeCTA origin={`routine_${routine.slug}_footer`} />
          </div>
        </section>
      </main>
      <MobileGuideBar
        bundleId={routine.recommendedBundleId}
        products={products}
        label="Comprar rotina completa"
      />
      <BelaPopValidatedFooter />
    </>
  );
}
