import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { BundleAddToCartButton } from "@/components/bundles/BundleAddToCartButton";
import { BundleRecommendationStrip } from "@/components/bundles/BundleRecommendationStrip";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import {
  formatBundleCurrency,
  getSkinBundleBySlug,
  skincareBundles
} from "@/lib/skincare/skincareBundles";
import { getProductDisplayImage } from "@/lib/product/productCovers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function getProductImagesByName(names: string[]): Promise<Record<string, string>> {
  const uniqueNames = Array.from(new Set(names));
  if (uniqueNames.length === 0) return {};

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("name, hero_image_url, category")
      .in("name", uniqueNames);

    if (error || !data) return {};

    return Object.fromEntries(
      data.map((row) => [
        row.name as string,
        getProductDisplayImage({
          heroImageUrl: row.hero_image_url as string | null,
          category: row.category as string | null
        })
      ])
    );
  } catch {
    return {};
  }
}

type KitPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return skincareBundles.map((bundle) => ({ slug: bundle.slug }));
}

export async function generateMetadata({ params }: KitPageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = getSkinBundleBySlug(slug);

  if (!bundle) {
    return {
      title: "Kit não encontrado | BelaPop"
    };
  }

  return {
    title: `${bundle.name} | Kits BelaPop`,
    description: bundle.description,
    openGraph: {
      title: `${bundle.name} | Kits BelaPop`,
      description: bundle.description,
      url: `/kits/${bundle.slug}`,
      siteName: "BelaPop",
      images: [{ url: bundle.image, alt: bundle.imageAlt }],
      type: "website"
    }
  };
}

export default async function KitDetailPage({ params }: KitPageProps) {
  const { slug } = await params;
  const bundle = getSkinBundleBySlug(slug);

  if (!bundle) notFound();

  const productImagesByName = await getProductImagesByName(
    bundle.products.map((product) => product.name)
  );

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <BelaPopValidatedHeader activeSection="skincare" />
      <main className="pt-20 lg:pt-28">
        <section className="px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,0.58fr)] lg:items-center">
            <div className="relative min-h-[420px] overflow-hidden bg-[#111] lg:min-h-[620px]">
              <Image
                src={bundle.image}
                alt={bundle.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/68 via-black/12 to-transparent" />
              <div className="absolute left-5 top-5">
                <Link
                  href="/kits"
                  className="inline-flex min-h-11 items-center gap-2 bg-white/92 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1b1b]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kits
                </Link>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#dac769]">
                  {bundle.badge}
                </p>
                <h1 className="mt-3 max-w-2xl font-headline text-5xl leading-[0.9] tracking-[-0.05em] sm:text-7xl">
                  {bundle.name}
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/84 sm:text-base">
                  {bundle.subtitle}
                </p>
              </div>
            </div>

            <aside className="border border-[#ded8d2] bg-white p-6 shadow-[0_24px_80px_rgba(28,27,27,0.07)] sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#6c5e06]">
                Curadoria compravel
              </p>
              <h2 className="mt-4 font-headline text-3xl leading-tight tracking-[-0.04em]">
                {bundle.promise}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#5f5a55]">{bundle.description}</p>

              <div className="mt-6 grid grid-cols-2 gap-4 border-y border-[#ece6e0] py-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a8179]">
                    Separado
                  </p>
                  <p className="mt-1 text-sm text-[#6f6862] line-through">
                    {formatBundleCurrency(bundle.originalPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a8179]">
                    Kit
                  </p>
                  <p className="mt-1 font-headline text-3xl text-[#1c1b1b]">
                    {formatBundleCurrency(bundle.bundlePrice)}
                  </p>
                </div>
                {bundle.savings > 0 ? (
                  <div className="col-span-2 bg-[#f7f0d3] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6c5e06]">
                    Economia de {formatBundleCurrency(bundle.savings)}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3">
                <BundleAddToCartButton bundle={bundle} label="Adicionar kit ao carrinho" />
                <Link
                  href="/skin-scan"
                  className="inline-flex min-h-12 items-center justify-center border border-[#1c1b1b] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
                >
                  Ver se combina com minha pele
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.8fr_1fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
                Ordem de uso
              </p>
              <h2 className="mt-3 font-headline text-4xl leading-[0.96] tracking-[-0.04em]">
                O que vem no kit, na ordem certa.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[#5f5a55]">
                A BelaPop organiza a compra como rotina: menos indecisao, mais clareza de uso.
              </p>
            </div>
            <ol className="grid gap-4">
              {bundle.products.map((product) => (
                <li key={product.productId} className="grid gap-4 border border-[#ded8d2] bg-white p-5 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                  <div className="relative aspect-square w-full overflow-hidden bg-[#f6f3f2] sm:h-[72px] sm:w-[72px]">
                    <Image
                      src={productImagesByName[product.name] ?? "/editorial/product-hero-signature.svg"}
                      alt={product.name}
                      fill
                      unoptimized
                      sizes="72px"
                      className="object-cover"
                    />
                    <span className="absolute bottom-0.5 right-0.5 bg-white/90 px-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#1c1b1b]">
                      {String(product.step).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline text-2xl tracking-[-0.03em]">{product.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5f5a55]">{product.usage}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8a8179]">
                      {product.benefit}
                    </p>
                  </div>
                  <p className="font-headline text-xl">{formatBundleCurrency(product.price)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-5 md:grid-cols-3">
            <article className="bg-white p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
                Para quem
              </p>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-[#5f5a55]">
                {bundle.recommendedFor.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-1 h-4 w-4 text-[#6c5e06]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="bg-white p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
                Resultado esperado
              </p>
              <p className="mt-5 text-sm leading-7 text-[#5f5a55]">{bundle.expectedResult}</p>
            </article>
            <article className="bg-[#1c1b1b] p-6 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#dac769]">
                Compra assistida
              </p>
              <p className="mt-5 text-sm leading-7 text-white/74">
                Produtos autenticos, sellers verificados e repasse transparente no marketplace.
              </p>
              <div className="mt-5 grid gap-3 text-xs uppercase tracking-[0.18em] text-white/78">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#dac769]" /> Autenticidade
                </span>
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#dac769]" /> Entrega com rastreio
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#dac769]" /> Concierge BelaPop
                </span>
              </div>
            </article>
          </div>
        </section>

        <BundleRecommendationStrip
          title="Você tambem pode gostar"
          subtitle="Outros rituais prontos para comprar por necessidade, momento ou intencao de cuidado."
          limit={3}
        />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#ded8d2] bg-[#fcf9f8]/96 px-4 py-3 backdrop-blur md:hidden">
        <BundleAddToCartButton bundle={bundle} label="Adicionar kit ao carrinho" />
      </div>

      <BelaPopValidatedFooter />
    </div>
  );
}
