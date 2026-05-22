/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type {
  BelaPopUniverse,
  UniverseCollection
} from "@/lib/discovery/universes";

type UniverseCollectionBlockProps = {
  universe: BelaPopUniverse;
  collections: UniverseCollection[];
};

export function UniverseCollectionBlock({
  universe,
  collections
}: UniverseCollectionBlockProps) {
  if (!collections.length) return null;

  return (
    <section id="colecoes" className="bg-[#111111] px-5 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-9 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.45fr)] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#DAC769]">
              Colecoes vinculadas
            </p>
            <h2 className="mt-4 font-headline text-4xl leading-tight tracking-normal sm:text-5xl">
              Prateleiras editoriais para continuar explorando.
            </h2>
          </div>
          <p className="text-sm leading-7 text-white/70">
            Colecoes conectam SKUs, guias e kits para a cliente descobrir por intencao, nao por filtro frio.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={collection.href}
              className="group relative min-h-[360px] overflow-hidden border border-white/10 bg-black"
            >
              <img
                src={collection.image}
                alt={collection.imageAlt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover opacity-82 transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <span
                  className="inline-flex px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em]"
                  style={{ backgroundColor: universe.theme.accentSoft, color: universe.theme.ink }}
                >
                  {collection.badge}
                </span>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#DAC769]">
                  {collection.subtitle}
                </p>
                <h3 className="mt-2 font-headline text-4xl leading-none tracking-normal">
                  {collection.name}
                </h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/74">
                  {collection.description}
                </p>
                <span className="mt-6 inline-flex min-h-12 items-center gap-3 border border-white/24 px-5 text-[10px] font-bold uppercase tracking-[0.22em] transition group-hover:bg-white group-hover:text-black">
                  Explorar colecao
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
