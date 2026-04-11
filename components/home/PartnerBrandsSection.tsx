import Link from "next/link";

type PartnerBrand = {
  name: string;
  count: number;
};

type PartnerBrandsSectionProps = {
  brands: PartnerBrand[];
};

export function PartnerBrandsSection({ brands }: PartnerBrandsSectionProps) {
  if (!brands.length) return null;

  return (
    <section className="bg-bpOffWhite">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-bpBlackSoft">
              Marcas parceiras
            </p>
            <h2 className="mt-2 font-display text-3xl text-bpBlack md:text-4xl">
              Assinaturas que sustentam a curadoria.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bpGraphite/78">
              Marcas, laboratorios e selecoes que entram na BelaPop por criterio de formula,
              sensorial e consistencia editorial.
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-bpGraphite/55 md:hidden">
              Deslize para ver mais
            </p>
          </div>
          <Link href="/catalogo" className="hidden text-xs uppercase tracking-[0.24em] text-bpBlackSoft md:inline-flex">
            Ver catalogo
          </Link>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:hidden">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/catalogo?brand=${encodeURIComponent(brand.name)}`}
              className="relative w-[72vw] max-w-[264px] shrink-0 snap-start overflow-hidden rounded-[28px] border border-bpPink/18 bg-white/78 p-5 shadow-[0_18px_46px_rgba(91,49,56,0.08)]"
            >
              <span className="pointer-events-none absolute right-3 top-1 font-display text-[4.8rem] leading-none text-bpPink/10">
                B
              </span>
              <p className="text-[10px] uppercase tracking-[0.26em] text-bpRoseGold">Marca parceira</p>
              <h3 className="mt-5 font-display text-[1.9rem] leading-[0.95] text-bpBlack">
                {brand.name}
              </h3>
              <p className="mt-3 text-sm leading-6 text-bpGraphite/78">
                {brand.count} produto{brand.count === 1 ? "" : "s"} na curadoria ativa.
              </p>
            </Link>
          ))}
        </div>

        <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/catalogo?brand=${encodeURIComponent(brand.name)}`}
              className="group relative overflow-hidden rounded-[32px] border border-bpPink/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(246,232,234,0.72))] p-6 shadow-[0_22px_56px_rgba(91,49,56,0.08)] transition hover:-translate-y-[2px] hover:border-bpPink/28"
            >
              <span className="pointer-events-none absolute right-4 top-1 font-display text-[6.5rem] leading-none text-bpPink/10 transition group-hover:text-bpPink/14">
                B
              </span>
              <p className="text-[10px] uppercase tracking-[0.26em] text-bpRoseGold">Marca parceira</p>
              <h3 className="mt-8 font-display text-[2.2rem] leading-[0.92] text-bpBlack">
                {brand.name}
              </h3>
              <div className="mt-8 flex items-end justify-between gap-4">
                <p className="text-sm leading-6 text-bpGraphite/78">
                  {brand.count} produto{brand.count === 1 ? "" : "s"} na curadoria.
                </p>
                <span className="text-[10px] uppercase tracking-[0.22em] text-bpBlackSoft">
                  Ver marca
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
