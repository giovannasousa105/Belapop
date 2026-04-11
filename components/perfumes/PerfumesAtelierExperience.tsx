/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Mail,
  ShoppingBag,
  Wind
} from "lucide-react";
import { useRef } from "react";

import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";

type PerfumeCard = {
  brand: string;
  image: string;
  name: string;
  price: string;
};

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAKt3FohQEuEPihRjlpxqLDdWyuuiwAQK1NC_xYpM-39P0dMe-SmowgrKgz7MDtROYrYEwFSz4tT-Oj4ukcztniH142co_ojDDUGP86j44DapWcsuSSr-5JLwhEG9ag-k3F4d2XbQARSS_R25_MOmoNqr7tXuT5NhDtyIuq8GOxmPIq-dL0HhEK-22pERF9NIeYdu8dnnD96iXwOSGUaqU1DrF0Dc9rvIzf-0-m5aUgzAgGwOpMvbT_fDcT3b7lMHn7OQyMuClys53B";

const highlights = [
  {
    brand: "Byredo",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBPKVnp4flAUo8zuFLIN4K29X9s919424vgJilsgRd0QL4PhevsuX3Wc7ImElUi1_JSppJgQ9gHgzF4q9DXPfwD3mGesUq-gnD-nfYv0obkri6P-vG5M6-YdnREPp1kfcMeYB74gaBlTvdrm2YdCPDYi9Mo632sKROinn_1PCwf-fcUbqOkLmsu0uLpktkQ-cts0ou_BEaSMv6EGLW8tvREFHO86ycu1oym9pJUuHkDb96vF3y-r0ylEB2UsYCzVxp12f2w73QOzoU1",
    name: "Gypsy Water",
    price: "R$ 1.850"
  },
  {
    brand: "Le Labo",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0crJDtYFz35aKLoggmfESbPGYKzatgxGzppCFPyj1vTBbMF9CK_C_bC4Xdl-a5tXvvHjlKh_usln-QjLwVuxxySUxpH6o2ONRlQ8HV0JOxLJ3eN2azmtBVXe4IMeGGbczMyZ9dvOpCM1n2J3gs-OIsE2KtLkke0Kt0-LiEHkn5sOHnVhJFo9RiHSfaY_bs7h2ZAs14NgM6-79VyZWh2qrTp1gKpc-6fkI8Tmn0rkSQ8ZjLlzD5Bucd_gdBWCUTQKs6yi7FRg1P3-V",
    name: "Santal 33",
    price: "R$ 2.100"
  },
  {
    brand: "Creed",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAEZ-N5juSTLEEoawcg4fKUg_BLf4f_FK6tNfAO4Fm7IUDVOOEoS7P6TsX2NW7L205btp-GCYJf2lIDhhgPx7j04JKnQYx3PYeY3vWHn-TnR3FEWnXDxtY8BODIreRXADf0E9EMe28XLv4QY4G4kJhlU36ecBJsBwAhdh8BXxmL08q8aggGSCdLwrMFg1dbltTnFg83YYpraI5fsoDhBehKmnNXXGRwbx-FojAOMxG7QOdjUKD3JfkeVOwzxDzmey45Bo4cFW1atygQ",
    name: "Aventus",
    price: "R$ 2.950"
  }
] as const;

const curationProducts: PerfumeCard[] = [
  {
    brand: "Chanel",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBw3OMvSq08rW6Hsayhf2aX8tvpf28vOq5WTVHN0ZiUxYZIUT1SlwyjWLfquxHK3kADq6Qe4Izmq2ZJ3Tl0L-MwBTOPU98oHsYhVXsuIKg8rpymGtUfFCNFAwKF-I1f2OvXhXSX9kkKPwFI-SmpzpbdVKrcEPOLZpw86g8P7ifnx9O0Cp1vI9xb5957s5RE6nRodLR23ianSitCFmYypqnpBc_58tQP7nOSF-0sEshvHfm7BqdU_RaAHJV-CXVAer5GKBGr8f_vPTGF",
    name: "No 5 L'Eau",
    price: "R$ 1.250"
  },
  {
    brand: "Dior",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCAZlkjUBHpH_R1ThUMKoltvDQvyPAS1uEwbbH9miY4LLf6nxqgWCvo7joYFMTeuX3iCrWRKD7XyGc4ZyN8zW6iPHPqY2jKv5HVI9f9GuHruwnvwVbeN60vaTdamWnuNUph7TmYlEMwFhrTFwjtHqLk6QYZSMv0tPDXmJRX64Jz3onwSaf68tPDuJQa8CRh9f0n8PQ5r1TAaFLjMHIsMEIP6vwgrU8JUokUP5lgfPG_Y0Wv8-wPd5qL9HrzmGk8M9ml3dQktsYO_b7",
    name: "Sauvage Elixir",
    price: "R$ 980"
  },
  {
    brand: "Tom Ford",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDIfJHoAkSdl5FrqjIu24WUpUqcYaiSj8erWmE1A65fpiPge0Cl3GJTyXRrp2-H-gvxGSI7anjqczUH61ksWP4cZ7CKkFax0ALjpN8vG9jhJqTAp5pRLSD0ZLo0HaUS8XLJZFnE_z27efLE7as44YO5p2u3gNjSA9bC63EnMCKXbvt7o6_04QIj80IK9JZRkrKnAutNmdM6qluyd255wx2ooiqfyVrM5Zl4HQilF51YjBwn4TB4lzWmkyxoj3E0lG30_XTpJxXlXggR",
    name: "Tobacco Vanille",
    price: "R$ 2.450"
  },
  {
    brand: "Maison FK",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBkbNNn-YjYb5oEnxy23Lv_6ndmjv-BhPOrFYisrl5K5tS6eIaZJwowtWvvMWn-UDwdGxY9g0JRUeZNS8xDkSDbxkn8bnpp832J48QId_1wm3ykPnGq2hdInO5XQuAGZU_7NyU8TBn6GenPqBRKoFXro0KOtBHPgx8AhDFEhoRfpYIKk55daCjAQLVGuzr19hFuHQTh4s8eAEyKGzgB3WQNk7JURgWakaIogNcqTqC13fjvmiUKgbbgKFRonIYdXYvXcxokKhcwFGDt",
    name: "Baccarat Rouge",
    price: "R$ 3.800"
  },
  {
    brand: "Jo Malone",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbumfKwIDMYZxF8PFKTHLdbv9TcPjBZI4FqRvUOz1BCxnUS5h7Y5LNAzjDttnEXGMjtpvLT48S4gVXhNv7CqC_VpDIPiG3NDAg-Y5fh_hu-eoHdG7LZs0eM2VJkkmzyG-6pcq_OPWqGrJPSIlBfxy_n1f4In2TZCjFwUrSeOPpcRLdhYXWTgfGWfkuIowFV5ONYzKsXGSUbQvJroha5jndMfOXaKkKTjHAeq4xFNdGXHHCAiWgjssdXsFTwwQBtJAyM7T-YGOFNDpW",
    name: "English Pear",
    price: "R$ 950"
  },
  {
    brand: "Diptyque",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOQt1EMrrNvRT5AFfxeVsXfRClDlg5PSyICTQG4uqk6C3N8Tdf8qf7DrF_WrP1GbUr7AhPxSAgYNSTglW5F8MUlTRH3VQSOAPk8QcNZh9oPcXBhtckkzkz-cNb_E4x8ASVe9uraCEy0m3expQcHtp87ZxVY-yjWI5aZjESQCt7lihtFy4kPMCmnDGWnXRCX3J9n5Jr3j__g2Vb2gMdsq_b0e7iO02_X2PsOxZJ5efFB6goiJiTforroLn8uJfX0SfsXru3EXljXRDT",
    name: "Philosykos",
    price: "R$ 1.650"
  },
  {
    brand: "Byredo",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBPKVnp4flAUo8zuFLIN4K29X9s919424vgJilsgRd0QL4PhevsuX3Wc7ImElUi1_JSppJgQ9gHgzF4q9DXPfwD3mGesUq-gnD-nfYv0obkri6P-vG5M6-YdnREPp1kfcMeYB74gaBlTvdrm2YdCPDYi9Mo632sKROinn_1PCwf-fcUbqOkLmsu0uLpktkQ-cts0ou_BEaSMv6EGLW8tvREFHO86ycu1oym9pJUuHkDb96vF3y-r0ylEB2UsYCzVxp12f2w73QOzoU1",
    name: "Bal d'Afrique",
    price: "R$ 1.850"
  },
  {
    brand: "Tom Ford",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDIfJHoAkSdl5FrqjIu24WUpUqcYaiSj8erWmE1A65fpiPge0Cl3GJTyXRrp2-H-gvxGSI7anjqczUH61ksWP4cZ7CKkFax0ALjpN8vG9jhJqTAp5pRLSD0ZLo0HaUS8XLJZFnE_z27efLE7as44YO5p2u3gNjSA9bC63EnMCKXbvt7o6_04QIj80IK9JZRkrKnAutNmdM6qluyd255wx2ooiqfyVrM5Zl4HQilF51YjBwn4TB4lzWmkyxoj3E0lG30_XTpJxXlXggR",
    name: "Lost Cherry",
    price: "R$ 2.800"
  },
  {
    brand: "Le Labo",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0crJDtYFz35aKLoggmfESbPGYKzatgxGzppCFPyj1vTBbMF9CK_C_bC4Xdl-a5tXvvHjlKh_usln-QjLwVuxxySUxpH6o2ONRlQ8HV0JOxLJ3eN2azmtBVXe4IMeGGbczMyZ9dvOpCM1n2J3gs-OIsE2KtLkke0Kt0-LiEHkn5sOHnVhJFo9RiHSfaY_bs7h2ZAs14NgM6-79VyZWh2qrTp1gKpc-6fkI8Tmn0rkSQ8ZjLlzD5Bucd_gdBWCUTQKs6yi7FRg1P3-V",
    name: "Another 13",
    price: "R$ 2.100"
  },
  {
    brand: "Creed",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAEZ-N5juSTLEEoawcg4fKUg_BLf4f_FK6tNfAO4Fm7IUDVOOEoS7P6TsX2NW7L205btp-GCYJf2lIDhhgPx7j04JKnQYx3PYeY3vWHn-TnR3FEWnXDxtY8BODIreRXADf0E9EMe28XLv4QY4G4kJhlU36ecBJsBwAhdh8BXxmL08q8aggGSCdLwrMFg1dbltTnFg83YYpraI5fsoDhBehKmnNXXGRwbx-FojAOMxG7QOdjUKD3JfkeVOwzxDzmey45Bo4cFW1atygQ",
    name: "Silver Mountain",
    price: "R$ 2.950"
  }
];

const ritualSteps = [
  {
    title: "Preparacao",
    description:
      "A pele hidratada retem as moleculas olfativas por mais tempo. Use uma locao neutra antes de aplicar.",
    icon: Mail
  },
  {
    title: "Pulsacao",
    description:
      "Aplique nos pontos de pulso: pulsos, pescoco e atras das orelhas, onde o calor difunde a essencia.",
    icon: Heart
  },
  {
    title: "Leveza",
    description:
      "Nunca esfregue a fragrancia apos aplicar. Deixe as notas de topo evaporarem naturalmente no ar.",
    icon: Wind
  }
] as const;

const PERFUME_PRODUCT_SLUGS = [
  "serum-radiance-01",
  "creme-barrier-celeste",
  "mascara-lumiere",
  "oleo-capilar-nuit"
] as const;

const resolvePerfumeProductHref = (index: number) =>
  `/produto/${PERFUME_PRODUCT_SLUGS[index % PERFUME_PRODUCT_SLUGS.length]}`;

export function PerfumesAtelierExperience() {
  const highlightsRef = useRef<HTMLDivElement | null>(null);

  const scrollHighlights = (direction: "left" | "right") => {
    if (!highlightsRef.current) {
      return;
    }

    highlightsRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth"
    });
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="perfumes-public">
      <BelaPopValidatedHeader activeSection="perfumes" />

      <main className="pb-24 pt-16 lg:pb-0">
        <section className="relative flex h-[44rem] w-full flex-col justify-end overflow-hidden lg:h-[48rem]">
          <img alt="Luxury perfume" className="absolute inset-0 h-full w-full object-cover" src={heroImage} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 sm:px-8 lg:px-10">
            <span className="mb-4 block text-[10px] uppercase tracking-[0.3em] text-white/70">
              Perfumes BelaPop
            </span>
            <h1 className="font-editorial text-5xl italic leading-[0.94] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Escolha fragrancias
              <br />
              com mais clareza
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
              Selecao baseada em notas, concentracao e ocasiao de uso.
            </p>
            <a
              href="#curadoria"
              className="mt-8 inline-flex min-h-14 items-center justify-center bg-white px-8 text-xs font-semibold uppercase tracking-[0.24em] text-black transition hover:bg-[#f7e382]"
            >
              Ver selecao
            </a>
          </div>
        </section>

        <section className="bg-[#fcf9f8] py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <h2 className="font-editorial text-3xl">Selecao inicial</h2>
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

              <div className="hidden gap-2 md:flex">
                <button
                  type="button"
                  aria-label="Destaques anteriores"
                  className="flex h-10 w-10 items-center justify-center border border-black/10 bg-white"
                  onClick={() => scrollHighlights("left")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Proximos destaques"
                  className="flex h-10 w-10 items-center justify-center border border-black bg-black text-white"
                  onClick={() => scrollHighlights("right")}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={highlightsRef}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {highlights.map((product, index) => (
                <article key={product.name} className="min-w-[280px] snap-start">
                  <Link href={resolvePerfumeProductHref(index)} className="block">
                    <div className="mb-4 aspect-[3/4] overflow-hidden bg-[#f6f3f2]">
                      <img
                        alt={product.name}
                        className="h-full w-full object-cover grayscale transition duration-700 hover:grayscale-0"
                        src={product.image}
                      />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#444748]">{product.brand}</p>
                    <h3 className="mt-1 text-sm font-bold uppercase tracking-tight">{product.name}</h3>
                    <p className="mt-1 text-sm">{product.price}</p>
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-6 flex gap-2 md:hidden">
              <button
                type="button"
                aria-label="Destaques anteriores"
                className="flex h-10 w-10 items-center justify-center border border-black/10 bg-white"
                onClick={() => scrollHighlights("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Proximos destaques"
                className="flex h-10 w-10 items-center justify-center border border-black bg-black text-white"
                onClick={() => scrollHighlights("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section id="curadoria" className="bg-[#f6f3f2] px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-12 text-center font-editorial text-4xl italic">
              Selecao da categoria
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {curationProducts.map((product, index) => (
                <article
                  key={`${product.brand}-${product.name}`}
                  className={index % 2 === 1 ? "mt-8 lg:mt-0" : undefined}
                >
                  <Link href={resolvePerfumeProductHref(index + 1)} className="block">
                    <div className="mb-4 aspect-square overflow-hidden bg-white">
                      <img alt={product.name} className="h-full w-full object-cover" src={product.image} />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#444748]">{product.brand}</p>
                    <h3 className="mt-1 text-xs font-bold uppercase">{product.name}</h3>
                    <p className="mt-1 text-[10px] text-[#1c1b1b]">{product.price}</p>
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Link
                href="/catalogo?categoria=perfumes"
                className="inline-flex min-h-12 items-center justify-center border-b border-black px-1 text-xs uppercase tracking-[0.2em]"
              >
                Ver todos os designers
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-16 text-center font-editorial text-4xl">Ritual do Aroma</h2>
            <div className="space-y-16">
              {ritualSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="flex flex-col items-center text-center">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center text-[#ed93d5]">
                      <Icon className="h-9 w-9" />
                    </div>
                    <h3 className="font-editorial text-2xl italic">{step.title}</h3>
                    <p className="mt-4 max-w-xs text-sm leading-7 text-[#444748]">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <BelaPopValidatedFooter />

      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around bg-white/85 px-4 pb-6 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-xl lg:hidden">
        <Link href="/perfumes" className="flex flex-col items-center justify-center border-t-2 border-pink-500 pt-2 text-stone-900">
          <ShoppingBag className="h-5 w-5" />
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em]">Shop</span>
        </Link>
        <Link href="/diario" className="flex flex-col items-center justify-center pt-2 text-stone-400 transition hover:text-pink-400">
          <Mail className="h-5 w-5" />
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em]">Journal</span>
        </Link>
        <Link href="/skin-scan" className="flex flex-col items-center justify-center pt-2 text-stone-400 transition hover:text-pink-400">
          <Wind className="h-5 w-5" />
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em]">AI Scan</span>
        </Link>
        <Link href="/conta" className="flex flex-col items-center justify-center pt-2 text-stone-400 transition hover:text-pink-400">
          <Heart className="h-5 w-5" />
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em]">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
