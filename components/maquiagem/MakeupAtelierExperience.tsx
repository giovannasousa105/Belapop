/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useRef } from "react";

import { AtelierCategoryBottomNav } from "@/components/atelier/AtelierCategoryBottomNav";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";

type MakeupProduct = {
  aiBadge?: boolean;
  brand: string;
  image: string;
  name: string;
  price: string;
};

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD2oPSoGSmN4z0Goc-C_HuVIkis1MNeaOX1BDv4COV4DUpl_3LyInPUDuHq_ULlI2Mf5HqjocJLouFv-fTqyxa0wQG0JCYORGuC7JarduV1WkgpjWsa7Bz-996CnJyAyAUeQqzUFJ33SLBA6z-TH3Wnafd6Q-iZjyJgxcn3Orp8OWux-G3DIFqyGpJLU8zINesa_fyfqqgF2O2lg4CTlEQUNuNZrxIIRHwfz54Zufv-jjlVDRR-mB0keDzkUU7_87BXb_0U4ybagWLq";

const hotProducts = [
  {
    badge: "Edicao Limitada",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCL1FedBM7-ANqBOvlQZtLUC8pb4EmG4iVvnkFfKOgi2FE67SJLXNyjX-brn2HnWxXymxhL3Q5qXOI7CmAwDNi8GMcaWmhq0OjknhrnnYfQ8JhZ9gw_Y2jE74LmPCPu3vsS5WbhBDMZ0FROomTcrJDmzPxC8UGmqC_d1phWp5zBsLLBO3cVzQEo37yHD7ZPlJje4pMdIgiJml6Cotbs_wi42gcNgJtFgQIch9F7YC-McbSFM6O8IUcQfR2hLBiJsz32-NCphE6Dynr1",
    name: "Velvet Noir Lipstick",
    price: "R$ 189,00"
  },
  {
    badge: "Skin Care",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDo4IRYFuOzKTsPhkAWSRjFOcqzm1vbFNlZ0bXgAKYaGCQtl_Bckj7lzhaLehSbDze6_v3RklkS2gfA8mkkll_GriDYirXfDLznk55KAAr-30_-fxdqK4a2XZoT8e1Yr1ORTqEhub6UXRy60a68RhPsqu8rnUQWrQrebdPbvkSyqvph8U8AMS7SLFWAm4cuJq2BmIjug7BfZzliooJauzo6spiYbTuheppaD0tWf5_FDcDS5aBWw94ge121-nQHvL4-STVomxFo6JOj",
    name: "Glow Serum Foundation",
    price: "R$ 245,00"
  }
] as const;

const makeupProducts: MakeupProduct[] = [
  {
    aiBadge: true,
    brand: "Chanel",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYkTccH7wD4sBH9OX6e7bnPqbAtAv7TY-jiASVlRcfNQdHCNC2gxHQSvcrDHUoEwLGGplSXEiZnHDyTVsnQjcShXcWA3bVxH6auuiAptjvnr-hqPT-Bxb3P9i17xuITETgaGVGS8jZK2691Ddoroyir2lw9S7d6P6yEafnkw2mcfgNwyCFRKyLUnL9AXgXASDW0NPcj6BsOf78VRXsEvhy3I5-89DPxF2VWEYirvipdB_gX7e0qxeiUBCOX-iheIOfE3DGCvXdTrLk",
    name: "Les 4 Ombres Palette",
    price: "R$ 545,00"
  },
  {
    brand: "Dior",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBMqfe76L3BaS6cE-zL6-qsqbSrBS7ETJ5e1Wq-2vsDSNZDRw379y-k7ExFQuupSnoWZyh96BadM9cm_Ge3I88hR-Z98Cimg_L-xW5CdrcujO8MeDHkzESlWJXc_eU19vcjXWJADqNpW2oMaLFZpTN-ClAT93G33Idrml70z96xIL6jpNEY06Ff6O5OCsyrs7DAZlVE3fxn9A6apbRHpKUCBTWBZ4CFVcw1rUj8yLfxQhjZj8Pm7yLJOVuDZ42wwWCBlb38-p9YBrz3",
    name: "Diorshow Iconic Overcurl",
    price: "R$ 295,00"
  },
  {
    aiBadge: true,
    brand: "YSL Beauty",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuABp5_0iHapI3arCdC4QOxB7wyeze2iY5ITxYYAKuW-IeZ0CfgdxTyNyuOpQheXG5B7TBpTzF5BPj3u7XSU70nrEmvCKxxwRnJVdOM3cvBIQmVSXMYJIvDEF4oogz_ShGoM5yRh754Cps_SpmDPh3W2GRoDM8L6oL0eDnxsK90je6dRt9oS-dHqBF2LvUw5g1FAYddKBbVSao9San8SSBMvqhFD-ViU1Dm77U1heXBkqhMTShNXJ9zXuVBk6rnnfKvB_3L6bpEUuLdy",
    name: "Touche Eclat Blur Primer",
    price: "R$ 380,00"
  },
  {
    brand: "Armani Beauty",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBEwQEP3WrhQ8HceCRAceLUwPJljN7fOKwIRORKWnIBadC_mLsNjLy4qOKxgqVBM2ZdKfXonPbJeehkMO7OsmJI1lt0OMKcFi_gcoMSvkKovuIdZj0j7xURSnVutOg6Mf0-9wrIOrKGEBY-rx2VyzPnBhS3Y2bPQga5upicDlzuaUX3hRytA3wmnA-mX82OJu77c7zI8Qg4gGWRxsPa3QeCj9aRIReFKfNenhHlWs0mhSiuLk7P0M33mjPuaoClheUFWzarcg98FzCA",
    name: "Luminous Silk Powder",
    price: "R$ 420,00"
  },
  {
    aiBadge: true,
    brand: "Chanel",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCL1FedBM7-ANqBOvlQZtLUC8pb4EmG4iVvnkFfKOgi2FE67SJLXNyjX-brn2HnWxXymxhL3Q5qXOI7CmAwDNi8GMcaWmhq0OjknhrnnYfQ8JhZ9gw_Y2jE74LmPCPu3vsS5WbhBDMZ0FROomTcrJDmzPxC8UGmqC_d1phWp5zBsLLBO3cVzQEo37yHD7ZPlJje4pMdIgiJml6Cotbs_wi42gcNgJtFgQIch9F7YC-McbSFM6O8IUcQfR2hLBiJsz32-NCphE6Dynr1",
    name: "Rouge Allure Velvet",
    price: "R$ 315,00"
  },
  {
    brand: "Dior",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDo4IRYFuOzKTsPhkAWSRjFOcqzm1vbFNlZ0bXgAKYaGCQtl_Bckj7lzhaLehSbDze6_v3RklkS2gfA8mkkll_GriDYirXfDLznk55KAAr-30_-fxdqK4a2XZoT8e1Yr1ORTqEhub6UXRy60a68RhPsqu8rnUQWrQrebdPbvkSyqvph8U8AMS7SLFWAm4cuJq2BmIjug7BfZzliooJauzo6spiYbTuheppaD0tWf5_FDcDS5aBWw94ge121-nQHvL4-STVomxFo6JOj",
    name: "Dior Forever Skin Glow",
    price: "R$ 450,00"
  },
  {
    brand: "Armani Beauty",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCL1FedBM7-ANqBOvlQZtLUC8pb4EmG4iVvnkFfKOgi2FE67SJLXNyjX-brn2HnWxXymxhL3Q5qXOI7CmAwDNi8GMcaWmhq0OjknhrnnYfQ8JhZ9gw_Y2jE74LmPCPu3vsS5WbhBDMZ0FROomTcrJDmzPxC8UGmqC_d1phWp5zBsLLBO3cVzQEo37yHD7ZPlJje4pMdIgiJml6Cotbs_wi42gcNgJtFgQIch9F7YC-McbSFM6O8IUcQfR2hLBiJsz32-NCphE6Dynr1",
    name: "Luminous Silk Foundation",
    price: "R$ 510,00"
  },
  {
    aiBadge: true,
    brand: "YSL Beauty",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCL1FedBM7-ANqBOvlQZtLUC8pb4EmG4iVvnkFfKOgi2FE67SJLXNyjX-brn2HnWxXymxhL3Q5qXOI7CmAwDNi8GMcaWmhq0OjknhrnnYfQ8JhZ9gw_Y2jE74LmPCPu3vsS5WbhBDMZ0FROomTcrJDmzPxC8UGmqC_d1phWp5zBsLLBO3cVzQEo37yHD7ZPlJje4pMdIgiJml6Cotbs_wi42gcNgJtFgQIch9F7YC-McbSFM6O8IUcQfR2hLBiJsz32-NCphE6Dynr1",
    name: "Rouge Volupte Shine",
    price: "R$ 285,00"
  },
  {
    brand: "Chanel",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBEwQEP3WrhQ8HceCRAceLUwPJljN7fOKwIRORKWnIBadC_mLsNjLy4qOKxgqVBM2ZdKfXonPbJeehkMO7OsmJI1lt0OMKcFi_gcoMSvkKovuIdZj0j7xURSnVutOg6Mf0-9wrIOrKGEBY-rx2VyzPnBhS3Y2bPQga5upicDlzuaUX3hRytA3wmnA-mX82OJu77c7zI8Qg4gGWRxsPa3QeCj9aRIReFKfNenhHlWs0mhSiuLk7P0M33mjPuaoClheUFWzarcg98FzCA",
    name: "Les Beiges Bronzing Cream",
    price: "R$ 480,00"
  },
  {
    aiBadge: true,
    brand: "Dior",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYkTccH7wD4sBH9OX6e7bnPqbAtAv7TY-jiASVlRcfNQdHCNC2gxHQSvcrDHUoEwLGGplSXEiZnHDyTVsnQjcShXcWA3bVxH6auuiAptjvnr-hqPT-Bxb3P9i17xuITETgaGVGS8jZK2691Ddoroyir2lw9S7d6P6yEafnkw2mcfgNwyCFRKyLUnL9AXgXASDW0NPcj6BsOf78VRXsEvhy3I5-89DPxF2VWEYirvipdB_gX7e0qxeiUBCOX-iheIOfE3DGCvXdTrLk",
    name: "Backstage Eye Palette",
    price: "R$ 410,00"
  },
  {
    brand: "Armani Beauty",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDo4IRYFuOzKTsPhkAWSRjFOcqzm1vbFNlZ0bXgAKYaGCQtl_Bckj7lzhaLehSbDze6_v3RklkS2gfA8mkkll_GriDYirXfDLznk55KAAr-30_-fxdqK4a2XZoT8e1Yr1ORTqEhub6UXRy60a68RhPsqu8rnUQWrQrebdPbvkSyqvph8U8AMS7SLFWAm4cuJq2BmIjug7BfZzliooJauzo6spiYbTuheppaD0tWf5_FDcDS5aBWw94ge121-nQHvL4-STVomxFo6JOj",
    name: "Power Fabric Concealer",
    price: "R$ 290,00"
  },
  {
    aiBadge: true,
    brand: "YSL Beauty",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBMqfe76L3BaS6cE-zL6-qsqbSrBS7ETJ5e1Wq-2vsDSNZDRw379y-k7ExFQuupSnoWZyh96BadM9cm_Ge3I88hR-Z98Cimg_L-xW5CdrcujO8MeDHkzESlWJXc_eU19vcjXWJADqNpW2oMaLFZpTN-ClAT93G33Idrml70z96xIL6jpNEY06Ff6O5OCsyrs7DAZlVE3fxn9A6apbRHpKUCBTWBZ4CFVcw1rUj8yLfxQhjZj8Pm7yLJOVuDZ42wwWCBlb38-p9YBrz3",
    name: "Mascara Volume Effet Faux",
    price: "R$ 310,00"
  }
];

const filterChips = ["Tudo", "Labios", "Pele", "Olhos"] as const;

const MAKEUP_PRODUCT_SLUGS = [
  "mascara-lumiere",
  "blush-veu-rose",
  "lip-tint-atelier",
  "serum-radiance-01"
] as const;

const resolveMakeupProductHref = (index: number) =>
  `/produto/${MAKEUP_PRODUCT_SLUGS[index % MAKEUP_PRODUCT_SLUGS.length]}`;

export function MakeupAtelierExperience() {
  const hotProductsRef = useRef<HTMLDivElement | null>(null);

  const scrollHotProducts = (direction: "left" | "right") => {
    if (!hotProductsRef.current) {
      return;
    }

    hotProductsRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth"
    });
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="makeup-public">
      <BelaPopValidatedHeader activeSection="maquiagem" />

      <main className="pb-24 pt-16 lg:pb-0">
        <section className="relative flex h-[44rem] w-full flex-col justify-end overflow-hidden bg-[#f6f3f2] lg:h-[52rem]">
          <img
            alt="Editorial de maquiagem"
            className="absolute inset-0 h-full w-full object-cover"
            src={heroImage}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 sm:px-8 lg:px-10 lg:pb-20">
            <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.3em] text-white">
              Maquiagem BelaPop
            </span>
            <h1 className="max-w-2xl font-editorial text-5xl font-bold leading-none tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Produtos organizados para facilitar sua escolha
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
              Selecao baseada em criterios de uso, acabamento e formulacao.
            </p>
            <div className="mt-8">
              <a
                href="#curadoria"
                className="inline-flex min-h-14 items-center justify-center bg-white px-8 text-sm font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white"
              >
                Ver selecao
              </a>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <h2 className="font-editorial text-3xl font-bold">Selecao inicial</h2>
                <p className="mt-2 text-sm text-[#444748]">
                  Produtos vendidos por parceiros verificados. Prazo e envio definidos por cada
                  seller.
                </p>
                <p className="mt-1 text-sm text-[#444748]">
                  Cada produto pode ter condicoes de envio e prazo diferentes.
                </p>
                <p className="mt-1 text-sm text-[#444748]">
                  Selecao inicial. Novos produtos estao sendo adicionados continuamente.
                </p>
              </div>
              <div className="hidden gap-2 sm:flex">
                <button
                  type="button"
                  aria-label="Produtos anteriores"
                  className="flex h-10 w-10 items-center justify-center bg-[#e5e2e1]"
                  onClick={() => scrollHotProducts("left")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Proximos produtos"
                  className="flex h-10 w-10 items-center justify-center bg-black text-white"
                  onClick={() => scrollHotProducts("right")}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={hotProductsRef}
              className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {hotProducts.map((product, index) => (
                <article key={product.name} className="min-w-[72%] bg-white p-4 sm:min-w-[320px]">
                  <div className="mb-4 aspect-[3/4] overflow-hidden">
                    <img alt={product.name} className="h-full w-full object-cover" src={product.image} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ed93d5]">
                    {product.badge}
                  </span>
                  <h3 className="mt-2 font-editorial text-xl font-bold">{product.name}</h3>
                  <p className="mt-1 text-sm text-[#444748]">{product.price}</p>
                  <Link
                    href={resolveMakeupProductHref(index)}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center bg-black px-5 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#ed93d5]"
                  >
                    Adicionar a sacola
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-6 flex gap-2 sm:hidden">
              <button
                type="button"
                aria-label="Produtos anteriores"
                className="flex h-10 w-10 items-center justify-center bg-[#e5e2e1]"
                onClick={() => scrollHotProducts("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Proximos produtos"
                className="flex h-10 w-10 items-center justify-center bg-black text-white"
                onClick={() => scrollHotProducts("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="sticky top-16 z-30 border-y border-black/10 bg-[#f6f3f2] px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filterChips.map((chip, index) => (
                <button
                  key={chip}
                  type="button"
                  className={`whitespace-nowrap px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                    index === 0
                      ? "bg-black text-white"
                      : "border border-black/15 bg-white text-black"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <button type="button" aria-label="Filtros" className="shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section id="curadoria" className="px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
              {makeupProducts.map((product, index) => (
                <article key={`${product.brand}-${product.name}`} className="flex flex-col">
                  <Link href={resolveMakeupProductHref(index + 2)} className="block">
                    <div className="relative mb-3 aspect-square overflow-hidden bg-[#f6f3f2]">
                      <img alt={product.name} className="h-full w-full object-cover" src={product.image} />
                      {product.aiBadge ? (
                        <span className="absolute left-2 top-2 bg-[#ed93d5] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-white">
                          Selecao por criterios
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#444748]">
                      {product.brand}
                    </p>
                    <h3 className="mt-1 truncate font-editorial text-sm font-bold uppercase">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium">{product.price}</p>
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/catalogo?categoria=maquiagem"
                className="inline-flex min-h-12 items-center justify-center border border-black px-8 text-xs font-bold uppercase tracking-[0.24em] transition hover:bg-black hover:text-white"
              >
                Carregar Mais
              </Link>
            </div>
          </div>
        </section>
      </main>

      <BelaPopValidatedFooter />
      <AtelierCategoryBottomNav shopHref="/maquiagem" />
    </div>
  );
}
