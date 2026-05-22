import type { Metadata } from "next";
import Link from "next/link";

import { WeeklyCurationCard } from "@/components/pop-guide/PopGuideCards";
import { ConciergeCTA, SkinScanCTA } from "@/components/pop-guide/PopGuideActions";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { weeklyCurationItems } from "@/lib/content/popGuide";

export const metadata: Metadata = {
  title: "Curadoria da semana | BelaPop",
  description:
    "Produto da semana, kit da semana, ativo em destaque e recomendações comerciais da curadora BelaPop."
};

export default function WeeklyCurationPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Curadoria da semana BelaPop",
    itemListElement: weeklyCurationItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: item.href
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BelaPopValidatedHeader activeSection="diario" />
      <main className="bg-[#fcf9f8] pb-20 pt-20 text-[#1c1b1b] lg:pt-28">
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-[1180px]">
            <nav className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8a8179]">
              <Link href="/guias">Guias</Link> / Curadoria da semana
            </nav>
            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.36em] text-[#6c5e06]">
              Curadoria da semana
            </p>
            <h1 className="mt-4 max-w-4xl font-headline text-5xl leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              O que vale olhar agora, com contexto de compra.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f5a55]">
              Destaques editoriais conectados a produto, kit, colecao e Skin
              Scan quando fizer sentido. Menos vitrine solta, mais curadoria.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <SkinScanCTA label="Fazer Skin Scan" />
              <ConciergeCTA origin="weekly_curation_hero" />
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1180px] gap-4 md:grid-cols-2 xl:grid-cols-3">
            {weeklyCurationItems.map((item) => (
              <WeeklyCurationCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </main>
      <BelaPopValidatedFooter />
    </>
  );
}
