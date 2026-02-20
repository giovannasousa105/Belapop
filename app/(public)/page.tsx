import type { Metadata } from "next";
import Link from "next/link";

import { CatalogProductCard } from "@/components/catalog/ProductCard";
import { ArticleCard } from "@/components/diary/ArticleCard";
import { HeroEditorial } from "@/components/home/HeroEditorial";
import { RitualCard } from "@/components/home/RitualCard";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { getPublishedArticles } from "@/lib/queries/articles";
import { getPublicProducts } from "@/lib/queries/products";
import { getPublicRituals } from "@/lib/queries/rituals";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "BelaPop | Curadoria editorial de beleza",
  description:
    "Curadoria editorial de beleza e autocuidado para quem escolhe presença, textura e ritual."
};

export default async function HomePage() {
  const [rituals, products, articles] = await Promise.all([
    getPublicRituals(),
    getPublicProducts(8),
    getPublishedArticles()
  ]);

  return (
    <div className="bg-bpOffWhite text-bpGraphite">
      <HeroEditorial />

      <Section className="bg-bpOffWhite">
        <div className="rounded-bpLg border border-bpPink/20 bg-white p-8 text-center shadow-bpMicro md:p-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-bpPink">Manifesto</p>
          <h2 className="mx-auto mt-4 max-w-4xl font-display text-3xl leading-tight text-bpBlack md:text-5xl">
            Beleza editorial, concierge e curadoria premium.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-bpGraphite md:text-lg">
            Selecoes autorais para transformar cuidado em presenca. Cada formula entra na BelaPop
            por criterio, sensacao e consistencia.
          </p>
        </div>
      </Section>

      <Section className="bg-bpOffWhite" id="rituais">
        <div className="rounded-bpLg border border-bpPink/20 bg-white p-6 shadow-bpMicro md:p-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-bpPink">Rituais</p>
              <h2 className="mt-2 font-display text-3xl text-bpBlack md:text-4xl">Rituais de curadoria</h2>
            </div>
            <Link href="/catalogo" className="text-xs uppercase tracking-[0.24em] text-bpPink">
              Ver catalogo
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {rituals.map((ritual) => (
              <RitualCard key={ritual.slug} ritual={ritual} />
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-bpOffWhite">
        <div className="rounded-bpLg border border-bpPink/20 bg-white p-6 shadow-bpMicro md:p-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-bpPink">Selecao da Editora</p>
              <h2 className="mt-2 font-display text-3xl text-bpBlack md:text-4xl">Curadoria da semana</h2>
            </div>
            <Link href="/catalogo" className="text-xs uppercase tracking-[0.24em] text-bpPink">
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.slice(0, 8).map((product) => (
              <CatalogProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-bpOffWhite">
        <div className="rounded-bpLg border border-bpPink/20 bg-white p-6 shadow-bpMicro md:p-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-bpPink">Diario BelaPop</p>
              <h2 className="mt-2 font-display text-3xl text-bpBlack md:text-4xl">Leitura editorial</h2>
            </div>
            <Link href="/diario" className="text-xs uppercase tracking-[0.24em] text-bpPink">
              Ir para o diario
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {articles.slice(0, 3).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </Section>

      <Section className="bg-bpBlack text-bpOffWhite">
        <div className="rounded-bpLg border border-bpPink/25 bg-bpBlackSoft p-8 text-center shadow-bpSoft md:p-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-bpPinkSoft">Comunidade BelaPop</p>
          <h3 className="mt-3 font-display text-4xl leading-tight md:text-6xl">Siga a @belapop.oficial</h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-bpOffWhite/75 md:text-base">
            Conteudo editorial, bastidores de curadoria e rituais reais da nossa comunidade.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/belapop.oficial"}
              className="bg-bpOffWhite text-bpBlack"
            >
              Acompanhar no Instagram
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}


