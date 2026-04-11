/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Landmark, Plus, QrCode, ShoppingBag } from "lucide-react";
import { useRef } from "react";

import { AtelierCategoryBottomNav } from "@/components/atelier/AtelierCategoryBottomNav";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";

type HairProduct = {
  image: string;
  name: string;
  price: string;
  subtitle?: string;
};

type FeaturedHairProduct = {
  badge?: string;
  image: string;
  name: string;
  price: string;
  subtitle: string;
};

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA4wO2YJsbEVy5nWmxD3d0pNMLHEoDT6Pp7wPzN7y8ofTCZtWjswVRwK4jy26kF-VaF0NS-wPslYDP1B0g7OkQjjEjCMlL5oOFtR1xuDDh_AeDW4zeSgLpui3T1rSsJl1kN1mt2GgmyTmnxq0ZQTRfsECd5Pv_YGWbn1STX_A0xYWe8vgq0nUarSf_fuHzbdYqknJM3tZ2gjhkImuY5fFn2nyWmVO6e9v7Cz8ztf7N8-QDIL7FZAOQC6nPDchV70knSZiUVYIAu8PYk";

const featuredProducts: FeaturedHairProduct[] = [
  {
    badge: "Editor's Pick",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuARukt0fzJQqNBWljSOgLl49yb2pPItDmIW3C9sMskYIu4JYl4GKq3ci2HbgZqquE5LIrlnZ0oCs9a6KriOgvdf4SIB_WLwmt57HvcTSymMr2hgAiLI9NveG88eRvdSuOxcv7o0mQgYaPFu2Iput-5r569Twk1DKnO7ECU8YfmKz92KS4nFfFu-dZVdDrnKgI7GwbBRh_apJC8DgMaZaQrA-MauGzTC6KtHe9_rboNquq25hdfvQp8jQ7Vt7kYBo9iCpe50dlj-FG9n",
    name: "Silk Infusion N 4",
    price: "R$ 289,00",
    subtitle: "Restauracao intensiva"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgWds2F9sFBoVQcoK8XbbSBZwX-Djr6iy0pp3AKCqrO9fBpitZRSaQSvCt-CLCbHuhx794cKNeXOXJcYaBB7GCnX_AKNr_kb_RACKMMIPgWzVj0MWfaIggoxCNnZ7Fi91JSjYrAgkPuo4xuZcwZbxRvfVEyTnK1IGNYv4esJ2JoXzuvQ4kWy1e52anL4pKily6_FVD0cRDhWJ3UFRJXiRJqMNHZWQu1h6QPxc2lWWUZkur85V1_ONvV4PUV_frZ5WUCmDbnfJ0qpda",
    name: "L'Huile Precieuse",
    price: "R$ 412,00",
    subtitle: "Nutricao profunda"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB0NVc_rQ5L_GGkwdd83DbRsBVsdCfxE4J6zdqhe7xqbYTnzp7ecS4QdfKGOVBC-Fu6NtzjuE_NWZnlA1GrTZ14uTWTCg8_q-ninW0SlCLe_8HdytahNTeUrvYv_wofbkZeLigDhMEivSEJdOM7NovsTey5DPgoymTE0YOG0spbL_uubrgQevNf6e7U7no-EYVx1IezyBEaW-S2LCNglsmI5rNNEWPg1-pxe-Qdg9KN4BCJlMdr7lYZM2kNFdSRwuZf1tXqJgdYN7DR",
    name: "Masque de Nuit",
    price: "R$ 356,00",
    subtitle: "Tratamento noturno"
  }
];

const hairProducts: HairProduct[] = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDxYEdBgLxvWHfQiUTwW2JA-7SSilo_0x9Eeh_bDOeiNTlhVhYPEE6H1fUTtzyJKBo6XqSSz0hzySUA5cPe5fbLV6VhOX_QelGNaKE2Trr5Jbpu_DwgUFTy4z6zLQ-4g9sh0Dn7ZgXhonnceS0PgBWZU6wbrvlRxcRfkVZaCc94LM64sLSKqNy56ORXDLZzQ5Xo-pScKYP6IBed8JF4u3QAtbLFcc3d30uoWhd_m1_7CLE6NncK5Znqs6wz_CgviKUDCbKrV_LuPPQ-",
    name: "BelaPop Pure",
    price: "R$ 145,00",
    subtitle: "Condicionador revitalizante"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDAEQGXo8OSUAMqCm-BfYm-y2LDvOVlDW5OcS0-BnkIK40aG3K5jJZLxKoDxcjCQ0opvZGbcSKjQCKH_e8WeL70r_4VrCNbb6xQ6wRwR80Q5a8MLEZTC8Jcejs_MCLd7xLD1m00Nd7KGYi6cpMs0qKdPe0HxvE09VM7ChJj7HZeTickKKgKf--jMTCy9FVBwz4RGpWMEG42kgNEx2Qj21hWAmFHRKULze_fjFwF7PmJmQUmfTe6GxHfcIBImvyUV8FML-wbphvfJBQm",
    name: "BelaPop Mist",
    price: "R$ 189,00",
    subtitle: "Spray termoativado"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCu5FMfU8sDBZzcn9415yRwz2nzJfIDOvp7AW6QIyVeZI7pYAb7ylkApo2ZQn8TNaPJeFP-ztY4ktLY3569yUIBhFA5YRN3GNlBgAs39JdtPDww4fEDlv4NyfFHhyw_JdbQe1bftpHVmzMd6GhpTnQGDCNCcJwB6EU3zj4w__w8hbRxeQMlxy49XmCAS8tAwGTe0ZS4dtCawh0NTE7Q8nzxwZuCOCadcVaBm0EBJVvQDLluun6GGgCewpM-aXECmj7Mmf7rBUeOYIPr",
    name: "BelaPop Elixir",
    price: "R$ 295,00",
    subtitle: "Serum finalizador"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTrdLw2814eJkaYvBDWCMO8pgm8chahQmM1e_NIgazO52KrpbLSTUvudExXB3Zzrkv2TcQYfg9UKgrTeeakQkGvqigFiyhmD-dVCtidgSbDhBgO8DDqx03gXjANSqtH_6uJLtCwZVpTQGG1kdVC-27dq6G0-A7WfhL6vNAIWoCLRTcFbmQcj9qjBVv_zkQKYVgWNPx3g0nyiubTvysqGkG4H2p0RGB36I7Io5wCXUaDpPieJAvjN4PW4I575JSNXFpBs4hfvb7mHS3",
    name: "BelaPop Mask",
    price: "R$ 210,00",
    subtitle: "Mascara fortalecedora"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeTd3FoQvvK_kNqy8BRwQcJBZZREFAtJw_zZXxY-BGAOjUR4oCQS3o98YPTDfaUT5kJIp5sigQrR8bVw7uiGagN0D037vX83r5lif2sbQOiebim8sB_Ab5hbYEkPMM0tKE_6xGqqor4YSDyhPE0KJk_3_jxx84fjgimTsXneRq3FUPw9ugjzJlF_9qDMzVV-MNlQ1m-DJvvGnG7t-kybwWKmPH7nlW6W9ONR2dGWj3p42-8z0zHcSbOlNMTifPMsRf6FI4Wm-G4uuB",
    name: "Silver Luxe",
    price: "R$ 178,00"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDasFfbCHiVczQrGKpGJ35mOr35TfB-nM-TGXOe2a5sCXMmM8lwY1JIkRSNl2oIct9FVcV9HCLoh7PKEYH6dU9TDMaSvCb_cL1hE6YncavgzQ37Swecev6BZq3146PDnbVu9xZ_UJ2PA_XCfJMiDwxxLijzCga1SbdSAp3RvwNnbzK8A9rXJt2A__SFcH4CRJRologNM2Pmq_JghB_qukDaEB2ibIklLkoDqa8pRGpS4y3UQGAKHp4rkZpq8bGE1vqhVFz1sXUq9K1U",
    name: "Scalp Therapy",
    price: "R$ 242,00"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAOGyChGDY4L30Gj3Zoe0M6KlNbC6cqBKX8SxyUHQAFP-3YTXHyuP1BOxlhXCXbWrlw0ZCAxw_jjAMxGFPLWC8IUXoV2RAX9fJl5yvFUPXERH-x7YA7w8d9fSS250aNHepcOa3nJsSCrK4DBZHVFBSLwEpfx3-srRY8zfUHaCrBkX-NQ1I6U-irFnMtUpgxzybPFUTb16oT8muo4i_N0pw8wzs0jWCSXX-f99rXSS-3rfhC8Y7F9IXTyb8T8OuUTFVEFTNVU3BKVqxc",
    name: "Volume Up",
    price: "R$ 135,00"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuALhLIi00kRrWx6Jhdw-dDPx14sXgCR1NWykpP0WPCjPw4OY-Gq4ofR8oICO3C_Zkf0bXMSoxIDSE2rMtW9h3SIU0G5S3Ga99Hd1QOfykUmX8w61lYlmAxAQpSMXvoYTx3sGkyErPOtEWaZT1bSJ52kHOPceZmrjEVV9ZSV2jIRaxjDnW5U79qeBpIkgaCy_c5hz-YZp6UgoZOX3FxDc9S83rasu9bO2bL_CXtsQjoRTpg5llT44XDesQJglek4bWjN5fbRSQbytQZj",
    name: "Fresh Day",
    price: "R$ 98,00"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAPb8UVOufST28XwxL49jJ1Bev6zmfAqxYpa82mlzzvPv8idmBoEVtgdzNJRyvbyMnNCvvYTkCr9g1G-K61V1SazHgEzlq4n9WAsB8afgo0P_tcv1XLGlAPz5wWU4KRtipjQbH7J-wnIJ9bwg4-yN4kM7xZjlKZK6WLTsxgLXv49WfxRLkE4h2DeYkAyzDswkS3iKMKfc5rD691fhZUio3DlXva3S2oOBo6NCzuf3pGMfgDCNpufAu7HYwObjLa-9ArztXU5VP8NoSU",
    name: "Leave-In Silk",
    price: "R$ 112,00"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDKB5VRJV1k4jt20y3W4e-3BQ7zqak0N2mP3c0drdhJUUkgrKQPvVKK1ufv7ToqtFm6FNSYKwKbQ2pNMrVjq8ARRgev8T2Lt5Am6ly-87fTsRVnwz4iHLUfVlTQG9fbCvg7BM3jn9gxSJvvTIPS_8auOHoodOe4MfV2MI24oYN3Vkbd-Yt0ifktC_CHHJQ-RnfdsT24ARa1ox8NFDwLhb0P54fu7yBLw8Hzqx2ygDBX-BfB8HODUKn-Unh1Id-B3OZggu9QFyVMMruj",
    name: "Botanique Mask",
    price: "R$ 320,00"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnUK3RP3rGVnP12mJwC0Xjf1cUtNtTAG1wNtFzJzryTqYZEbBySyidd-RLG5RIurbLvGK8wSJJvlxSaot0dR_3X8xPiecUx0b7MF4AVRVXlOYCBXpuXa7stTgVrXf0tGnKYnoERMsHlmpY8t19VoMfY7qd8CtyfJJddT6PzxwmACH9qATVAR4kam4NnXsfPSFu6niW0AGeE_-k3q6C3DUGGxWjrOh0S_RZczYufcqLmm_kaG3u6BLdgFutwYc6rEOA2yfamZcz_b6u",
    name: "Ampola Fix",
    price: "R$ 65,00"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCQ1jDJqQo0172OGDZvO0fZ4AQYTOvYvEIpu23JdXKm-lfCCVV3Q7Zih782RQuh7Gehsp1JawTI1NtvPeWV8XCrbMfwJ4gYrQ2NCTRxYWGhhPX07pltbnPQxT_UmebY1lr7dI2CMSrEq7QRqAp2rRYRCTWV-diVJeCgw59Rcqu3cKDFdVQ3NkCE3ROAJ-wMTe50bZw1a7CcioKh074bbPs_wT0e7E_4-VFavQQz3vkyzHD3j34Z2DGgv5na6pSmsSn8W3Y84xiWEIbQ",
    name: "Escova Gold",
    price: "R$ 195,00"
  }
];

const filterChips = ["TODOS", "QUEDA", "HIDRATACAO", "BRILHO", "POS-QUIMICA"] as const;

const ritualSteps = [
  {
    description:
      "Prepare o couro cabeludo eliminando impurezas e residuos sem agredir a barreira lipidica.",
    step: "01",
    title: "Purificacao"
  },
  {
    description:
      "Deposite aminoacidos e proteinas essenciais para restaurar a estrutura interna do fio.",
    step: "02",
    title: "Reconstrucao"
  },
  {
    description:
      "Feche as cuticulas para reter a hidratacao e garantir o brilho espelhado caracteristico.",
    step: "03",
    title: "Selamento"
  },
  {
    description:
      "Crie uma barreira invisivel contra agressores termicos e raios UV para um acabamento duradouro.",
    step: "04",
    title: "Protecao"
  }
] as const;

const HAIR_PRODUCT_SLUGS = [
  "oleo-capilar-nuit",
  "escova-ritual-zen",
  "serum-radiance-01",
  "creme-barrier-celeste"
] as const;

const resolveHairProductHref = (index: number) =>
  `/produto/${HAIR_PRODUCT_SLUGS[index % HAIR_PRODUCT_SLUGS.length]}`;

export function HairAtelierExperience() {
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) {
      return;
    }

    carouselRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth"
    });
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="hair-public">
      <BelaPopValidatedHeader activeSection="cabelos" />

      <main className="pb-24 pt-16 lg:pb-0">
        <section className="relative flex h-[38.5rem] flex-col justify-end overflow-hidden bg-black p-8 lg:h-[44rem]">
          <img
            alt="Hair science editorial"
            className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale"
            src={heroImage}
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative z-10 space-y-4">
            <span className="text-xs uppercase tracking-[0.3em] text-[#ed93d5]">Cabelos BelaPop</span>
            <h1 className="font-editorial text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Cuidado capilar com
              <br />
              criterios claros
            </h1>
            <p className="max-w-[280px] text-sm leading-7 text-[#e5e2e1]">
              Produtos organizados por necessidade de uso e formulacao.
            </p>
            <div className="pt-4">
              <a
                href="#ritual"
                className="inline-flex min-h-12 items-center justify-center bg-white px-8 text-xs font-extrabold uppercase tracking-[0.24em] text-black transition hover:bg-[#ed93d5] hover:text-white"
              >
                Ver selecao
              </a>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <h2 className="font-editorial text-3xl font-bold tracking-tight">Selecao inicial</h2>
                <div className="mt-2 h-0.5 w-12 bg-[#ed93d5]" />
                <p className="mt-3 text-sm text-[#444748]">
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
              <div className="hidden gap-4 md:flex">
                <button
                  type="button"
                  aria-label="Produtos anteriores"
                  className="text-[#747878]"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Proximos produtos"
                  className="text-black"
                  onClick={() => scrollCarousel("right")}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {featuredProducts.map((product, index) => (
                <article key={product.name} className="min-w-[72%] snap-start group sm:min-w-[320px]">
                  <Link href={resolveHairProductHref(index)} className="block">
                    <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-[#f6f3f2]">
                      <img
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        src={product.image}
                      />
                      {product.badge ? (
                        <span className="absolute left-4 top-4 bg-[#ed93d5] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                          {product.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#444748]">{product.subtitle}</p>
                    <h3 className="mt-1 font-editorial text-xl font-bold">{product.name}</h3>
                    <p className="mt-1 text-sm text-[#444748]">{product.price}</p>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sticky top-16 z-30 bg-[#f6f3f2] px-6 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.24em]">Filtrar por necessidade</span>
              <Plus className="h-5 w-5" />
            </div>
            <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filterChips.map((chip, index) => (
                <button
                  key={chip}
                  type="button"
                  className={`whitespace-nowrap px-6 py-2 text-[10px] font-bold uppercase tracking-[0.24em] ${
                    index === 0
                      ? "bg-black text-white"
                      : "border border-black/10 bg-white text-black transition hover:bg-[#e5e2e1]"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-12 p-6 lg:grid-cols-4 lg:gap-x-6">
          {hairProducts.map((product, index) => (
            <article key={product.name} className="space-y-3">
              <Link href={resolveHairProductHref(index + 1)} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f6f3f2]">
                  <img alt={product.name} className="h-full w-full object-cover" src={product.image} />
                  <span className="absolute bottom-4 right-4 bg-white/85 p-2 backdrop-blur-sm">
                    <Plus className="h-4 w-4" />
                  </span>
                </div>
                <div className="px-1">
                  <h3 className="truncate font-editorial text-sm font-bold uppercase tracking-tight">{product.name}</h3>
                  {product.subtitle ? (
                    <p className="text-[11px] leading-tight text-[#444748]">{product.subtitle}</p>
                  ) : null}
                  <p className="mt-1 text-xs font-bold">{product.price}</p>
                </div>
              </Link>
            </article>
          ))}
        </section>

        <section id="ritual" className="bg-[#f6f3f2] px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center font-editorial text-4xl font-bold uppercase tracking-tight">
              O Ritual BelaPop
            </h2>
            <div className="space-y-16">
              {ritualSteps.map((step) => (
                <article key={step.step} className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center bg-white shadow-sm">
                    <span className="font-editorial text-2xl font-bold text-[#ed93d5]">{step.step}</span>
                  </div>
                  <h3 className="font-editorial text-xl font-bold uppercase">{step.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-7 text-[#444748]">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BelaPopValidatedFooter />
      <AtelierCategoryBottomNav shopHref="/cabelos" />
    </div>
  );
}
