import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";

import { UniverseBundleRail } from "@/components/universes/UniverseBundleRail";
import { UniverseCollectionBlock } from "@/components/universes/UniverseCollectionBlock";
import { UniverseCTASection } from "@/components/universes/UniverseCTASection";
import { UniverseHero } from "@/components/universes/UniverseHero";
import { UniverseNavigationTabs } from "@/components/universes/UniverseNavigationTabs";
import { UniverseProductRail } from "@/components/universes/UniverseProductRail";
import { UniverseRoutineBlock } from "@/components/universes/UniverseRoutineBlock";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  belaPopUniverses,
  getRelatedUniverses,
  getUniverseBundles,
  getUniverseBySlug,
  getUniverseCollections,
  getUniverseRoutines,
  type BelaPopUniverse
} from "@/lib/discovery/universes";
import { getPublicProductsByIds } from "@/lib/queries/products";

type UniversePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return belaPopUniverses.map((universe) => ({ slug: universe.slug }));
}

export async function generateMetadata({ params }: UniversePageProps): Promise<Metadata> {
  const { slug } = await params;
  const universe = getUniverseBySlug(slug);

  if (!universe) {
    return {
      title: "Universo não encontrado | BelaPop"
    };
  }

  return {
    title: `${universe.name} | Universos BelaPop`,
    description: universe.description,
    openGraph: {
      title: `${universe.name} | BelaPop`,
      description: universe.description,
      url: `/universos/${universe.slug}`,
      siteName: "BelaPop",
      images: [{ url: universe.heroImage, alt: universe.heroImageAlt }],
      type: "website"
    }
  };
}

function JsonLd({
  universe,
  products
}: {
  universe: BelaPopUniverse;
  products: Awaited<ReturnType<typeof getPublicProductsByIds>>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${universe.name} | BelaPop`,
    description: universe.description,
    url: `/universos/${universe.slug}`,
    about: universe.tags,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.title,
        url: `/produto/${product.slug}`
      }))
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function UniverseDetailPage({ params }: UniversePageProps) {
  const { slug } = await params;
  const universe = getUniverseBySlug(slug);

  if (!universe) notFound();

  if (slug !== universe.slug) {
    redirect(`/universos/${universe.slug}`);
  }

  const [products] = await Promise.all([getPublicProductsByIds(universe.productIds)]);
  const bundles = getUniverseBundles(universe);
  const collections = getUniverseCollections(universe);
  const routines = getUniverseRoutines(universe);
  const relatedUniverses = getRelatedUniverses(universe.relatedSlugs);
  const primaryBundle = bundles.find((bundle) => bundle.id === universe.weeklyCuration.bundleId) ?? bundles[0];

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <JsonLd universe={universe} products={products} />
      <BelaPopValidatedHeader activeSection="universos" />
      <main className="pb-24 pt-20 lg:pb-0 lg:pt-28">
        <div className="px-5 pt-3 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: "Início", href: "/" },
              { label: "Universos", href: "/universos" },
              { label: universe.name }
            ]}
          />
        </div>
        <UniverseHero universe={universe} />
        <UniverseNavigationTabs universe={universe} relatedUniverses={relatedUniverses} />

        <section id="narrativa" className="bg-[#fcf9f8] px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[minmax(0,0.68fr)_minmax(360px,0.32fr)]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
                Narrativa editorial
              </p>
              <h2 className="mt-4 max-w-4xl font-headline text-4xl leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                {universe.description}
              </h2>
              <p className="mt-8 max-w-3xl text-base leading-8 text-[#4c4744]">
                {universe.editorialText}
              </p>

              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {universe.editorialTrails.map((trail) => (
                  <Link
                    key={trail.id}
                    href={trail.href}
                    className="group border border-[#ded8d2] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(28,27,27,0.07)]"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6c5e06]">
                      {trail.label}
                    </p>
                    <h3 className="mt-3 font-headline text-3xl leading-tight tracking-normal">
                      {trail.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#5f5a55]">
                      {trail.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.20em] text-[#1c1b1b]">
                      {trail.cta}
                      <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <aside className="h-fit border border-[#ded8d2] bg-white p-6 shadow-[0_24px_80px_rgba(28,27,27,0.06)]">
              <div className="mb-5 inline-flex items-center gap-2 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em]" style={{ backgroundColor: universe.theme.accentSoft, color: universe.theme.ink }}>
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Curadoria da semana
              </div>
              <h3 className="font-headline text-4xl leading-none tracking-normal">
                {universe.weeklyCuration.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#5f5a55]">
                {universe.weeklyCuration.description}
              </p>
              <Link
                href={universe.weeklyCuration.href}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 border border-[#1c1b1b] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
              >
                Ver curadoria
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <div className="mt-8 border-t border-[#ece6e0] pt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6f6862]">
                  Tags do universo
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {universe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-[#e5ddd5] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#6f6862]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <UniverseCTASection
          universe={universe}
          bundle={primaryBundle}
          sectionId="cta-narrativa"
        />

        <UniverseProductRail universe={universe} products={products} />
        <UniverseBundleRail universe={universe} bundles={bundles} />
        <UniverseCollectionBlock universe={universe} collections={collections} />
        <UniverseRoutineBlock universe={universe} routines={routines} />

        {relatedUniverses.length > 0 ? (
          <section className="bg-[#111111] px-5 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-[1440px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#DAC769]">
                Navegue entre universos relacionados
              </p>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {relatedUniverses.map((related) => (
                  <Link
                    key={related.id}
                    href={`/universos/${related.slug}`}
                    className="group border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#DAC769]">
                      Combina com
                    </p>
                    <h3 className="mt-3 font-headline text-4xl leading-none tracking-normal">
                      {related.name}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-white/72">{related.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.20em] text-white">
                      Explorar universo
                      <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-[#fcf9f8] px-5 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 border-t border-[#ded8d2] pt-8 text-xs leading-6 text-[#6f6862] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {universe.collectionIds.map((id) => (
                <span key={id} className="border border-[#ded8d2] px-3 py-1 uppercase tracking-[0.16em]">
                  {id}
                </span>
              ))}
            </div>
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4 text-[#6c5e06]" aria-hidden="true" />
              Universo conectado a produtos, colecoes, kits, rotinas e guias.
            </p>
          </div>
        </section>

        <UniverseCTASection
          universe={universe}
          bundle={primaryBundle}
          variant="dark"
          mobileSticky
          sectionId="concierge"
        />
      </main>
      <BelaPopValidatedFooter />
    </div>
  );
}
