import Link from "next/link";

import { DiscoveryEditorialCard } from "@/components/home/DiscoveryEditorialCard";
import { Section } from "@/components/ui/Section";

type HomeCollection = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  href: string;
  eyebrow: string;
  productCount: number;
  supportingLabel?: string;
};

type PartnerBrand = {
  name: string;
  count: number;
};

type HomeCurationSectionProps = {
  collections: HomeCollection[];
  brands: PartnerBrand[];
};

export function HomeCurationSection({ collections, brands }: HomeCurationSectionProps) {
  return (
    <Section id="curadoria" className="bg-bpOffWhite">
      <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[32px] border border-bpPink/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,232,234,0.72))] p-6 shadow-[0_22px_56px_rgba(91,49,56,0.06)] md:p-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-bpRoseGold">Curadoria BelaPop</p>
          <h2 className="mt-4 font-display text-3xl leading-[1.02] text-bpBlack md:text-5xl">
            Menos ruido visual. Mais criterio, marca e desejo.
          </h2>
          <p className="mt-5 text-base leading-8 text-bpGraphite/84 md:text-lg">
            A curadoria entra depois da tecnologia para fechar a narrativa certa: primeiro a
            pele, depois a logica, depois o produto. Isso faz a BelaPop parecer mais madura,
            mais premium e mais confiavel.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/catalogo"
              className="inline-flex rounded-full bg-bpPinkCta px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_16px_34px_rgba(213,30,113,0.18)] transition hover:bg-[#bf165f]"
            >
              Explorar catalogo
            </Link>
          </div>

          {brands.length > 0 ? (
            <div className="mt-10 border-t border-bpPink/16 pt-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-bpBlackSoft">Marcas parceiras</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <Link
                    key={brand.name}
                    href={`/catalogo?brand=${encodeURIComponent(brand.name)}`}
                    className="rounded-full border border-bpPink/20 bg-white/88 px-4 py-2 text-xs uppercase tracking-[0.18em] text-bpGraphite transition hover:border-bpPink/34 hover:text-bpBlack"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {collections.map((item) => (
            <DiscoveryEditorialCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </Section>
  );
}
