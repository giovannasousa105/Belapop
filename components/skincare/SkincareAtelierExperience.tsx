/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  Mail,
  ScanFace,
  Search,
  Sparkles,
  SunMedium,
  Video,
  Waves
} from "lucide-react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";

type ProductCard = {
  badge?: string;
  name: string;
  subtitle: string;
  price: string;
  image: string;
};

type CollectionProduct = {
  name: string;
  price: string;
  image: string;
};

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBNFRqFmSxF-LiL0_W_2fIwuymOiSnxO6akSIgQ2325O8jkQVoNNyHGgjDdK_QWsyisynuhJneqokGiGw0x3zxtQA_a7O4hzmqxw1Uo5lGrnpXmvqEC4znUasqovLLJw-7VkUadU8y3OoGLRvnmFVR0qBDCPbnugBbhslljRqWhWTedVh5V4DRVCdgeMU4h-a616YiMFZre2J9VIKkEyWgmSQJLM9eb60tr6Mzpa4g110tx1EEZH2fzvAILSfJuOirv3-1WEBmTXCgR";

const hotProducts: ProductCard[] = [
  {
    badge: "Limited Edition",
    name: "Serum Radiance",
    subtitle: "Glow Instantâneo 30ml",
    price: "R$ 245",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTJeJby-t_D_GXJKtNaeyWH7_42dJFnOG8RIFgjicKOBQlZV-qWY0QD5jYzbYbEzI-LM8bwrHfrGn9xeW25_IGSInFS5w8dADSicAKYvzVZl1Vog_-v7oatKHA7Opv80hLNBgfc04S6YvHgbOv0u_fiRU2U4koJtTb8lAcghVZY32oOr_3yI9I0Mog7VblTbmavAwPACTcAhJ5CLlbaoIW2pmYMpMTQGIbbcvK1SxM4y26Iu-Bs6JWAuK-QpXgJSwsxU4tnMlBRK0J"
  },
  {
    badge: "Mais Vendido",
    name: "Velvet Hydra",
    subtitle: "Creme Hidratante Profundo",
    price: "R$ 210",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8NiFm3kWPCIVDaN4xf7TZ8IYpHvqVC_I-US9KYBTusMthaZ6V0M36OSdbXwWtq22Sb7i8N4OZBGWpDeed8__stBCOUHgO68JmSma7y0S1e8NeaRVbZuwvt6BSTVkEA9umVafMUV9RQx5arfT2ia9h0AkAWiKuAHVATlMYyRIil8V640fQUKgZhoJVQ5yYcpLgWG4d3eP-1_1KhERyWhvslOg-9jcZbiNtys4Lfe0EvumVV25oeGet_DqiygLu4beZVMb9pjaQnPVt"
  }
];

const collectionProducts: CollectionProduct[] = [
  {
    name: "Óleo Nutritivo",
    price: "R$ 189",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTS8uDcBF-9_pkPNYtamnQVOcVuSKrPkW5EK4jqFrfHofjiaqMA8d0dhm6RACcVvfXLj80eCqDKFNblRt01rglAvkugnCJ2s-8sQD-Z2axb3Lps7z1esAJUzOOde4bCxKr9QLRSOxxK5UjiV6QUixs6UUrc6I9aLbif4s3L_eraf33q5GCihjIedDbcwZQsMeCvGxdjAXjxy9FUkDT39Gp8527M-13YZ7jEdPnlR3MZSygIeJI4A_M1Oe8J0KWckWWVlDsFrsTirja"
  },
  {
    name: "Cleanser Suave",
    price: "R$ 124",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNsxwhzTeuvOefInN-p1vGfEuF4u6mHdRFyAOJBPOK7x3FdmMWr6U5C113fzZTVhOMzewSPhnGaP8CViSmGfiNoh7kPeee4SxO6GJC57KGPgHxqbZzKeb0rL8PloKgV-MCkbRpiej4uEk_n4Mq2V5-ldDoKFKMG78cyeU7dbW7e3Jb1oDt5mubMb_DZJ93WV6QyPXt6tWT7ESTjK9vH6sRvPIAm3pTTUnlp36zOP7PwvPBnTwKkQShkliqM_56BUO_y2Moxssrwebn"
  },
  {
    name: "Tônico Botânico",
    price: "R$ 142",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCOG4wWR_Uy_M5VygSAGTPk1qmvmBUUn5Uk_UEYCJ3p3_hSE284USWjq1Gi3aHcxOCA15AdSjbnDv-oFnDdAaJlR1kwQvGb58DvzfvAC3SyRDlLUqVZSG6FUFfxE9NQtBbaVMFrXw66xxV_TGyD2Tcemr3_2JkcxI2kmiBdopc6qQaWGmXcymySXyMbuO967l1TSfDl_xVSb8QLiZYSpjdvilma34vMdxPBnvggPYkfvYrPc2X4N7bMVHpOa1klLGDwe2ugIyhmeMzW"
  },
  {
    name: "Eye Lift Cream",
    price: "R$ 210",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC-q18K637N9YalZPH0g_K0zGnickhNAzcdZmcx-1wje88PFQSErgwTQIqTte2O77nxDNP_lgfhc1bx7AcYP173kKCAuTAEyx3uQNs8Gl5axJIzWYz8IF3GjjLPjksdNdZcPI5v67hjsg-wKV-DtOLV_hkCs4TyzhCssCihymDqt2IA24qkMiywJFRR7aBkLgqg37bNgw7KngW5Uy9Vfy-Xe9sQl_-2_7tDdRy9aR2xj3_Rd9mNEZJ8YCyjLm4Sq4Bx8XG9R3jKhFuS"
  },
  {
    name: "Kit Viagem",
    price: "R$ 299",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBUTLmt3PWDbnC4gLvUpuCYRBQ4zK_bkO7jaqFWqi4P4Pt1mRmYChJ6ZPluaGvGR5NWkFuahYJt5SagzTJFzERkHdJAMZHBsVWwhoC-Lt54FZsEXmCP-IM5pfOIT3MiMWLzl9llzLTYMI4Rtl3dKysRq5dYj8pTV1t5-2LDxmUVC5C7AP3IlpJ7XmVV-cDdPLeq-HQJcUzt3krRxcA6LTQe8vFLbe1v-NplliKQhFc2etSbG76Lv9C1usdoKczHrVWQDrrVGr9HHF72"
  },
  {
    name: "Vitamin C Booster",
    price: "R$ 245",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBms5nCxLp5dwUWlR6k_nzph55uOBicgKTeDyIydFmDYmkT5FI3-j72ZCR-dbFkM1mSAq9NXKlEnbQzv6yCEpm9C5ZE1jHyrS1WQJZBCqHnmwn70t7XPNUUvIZbPr718o8FM1vRLIABlba7LmCjUqIzy3K_AqSUqCgepJXLKDgKRSMIGvFW5wbMSrt3KU-8qi0ksYeEqlk8jgbI367p2znmNvgwyzjZC6k_x5ACLr34Zea3DZyuHfNI47NzVJuxdqE_dgXlQJsuMTbs"
  },
  {
    name: "Balm Hidratante",
    price: "R$ 89",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC1tCQKVjesKK7cpxRbiimRTskwY8T-ht8SisViJvrzMp6bgTX99C8d3B0EmKjQaWzzYzE1WIzdvzz-GHmbJNWtb9tO4SXxffq6ztBB_832JnBntCJuvbjFWx4WsFMqVnv9gn1rx1NAT0H7LBsh7y18R7xwyzCL9lLT4jAi3kMgolIcqxNv1qnNx5MWIxqi8NuD6J6UADVjNuE8w6Yzfpuljt7yzbzb_IXldwaJO-gpB7Os7EZ2DMqUI0Dumqgm9SN7FWuXrmQ5Ui4S"
  },
  {
    name: "Detox Mask",
    price: "R$ 168",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZovp7TBVVPOYC72ZHk1MvcYoznU6xdnuV_TovBldZhONR4UzNqDYS2s8g0fCz55TFMzQJuFeINJNeTYRitBBqR2A2OVw50-jbqtMw9moMThwsPtzdSQiO0potDkFiXjRniaqGvAg8cIFoOi8Qe-dWPjQjQDuWYCyZnLSTSUC16QGnz0QzWIuN5R0WMro8f-uhlVYUeKbSh7JThulI_IWiOlSPeYh_QffsGq8cx2q5PFxK3kphTiCDL1Fsu0Sm1BGbo-Zn8jOIQ3gS"
  },
  {
    name: "Mist Refrescante",
    price: "R$ 115",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNOwSvhEHm46vmDuOsNfmhjNCzPCa1Q6HK7K54tYTFATmY4EiM1HBf-_XxPrDKjEtqWU7decS8cYLqV-N9XhSwXQb9Lt8gpmfjw6Uf4vVpF5_Chv_IaTS0-2obLJ81p9tbc7fArr6H6pRBgXHYQq7u4bkBWHRC-ZK-aTrCo8pcRLttVWvQIqpfrTAvzW818HaHWqnsxaarowEwhHtlygw8DomKOBsji5-0eudnl8mbpwe1oISa_dvhOdoiuZ3pdqXwYf9wiRDzmBRB"
  },
  {
    name: "Esfoliante Seda",
    price: "R$ 138",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAAy85njfu9L5bp0VqAZUK7FgrpAMOqJ-N4hbzjXG65vkQE8GhMnrGOMxT7PHPMatctfzpJbEpsYN3MQQeQYraAbt_Wj0sIMGvuKO0ujayvTIxMIfrBGWiGTU6uSExXLNAq3jtu7f6gu4MCBR1RhaTOMTRlXJaB3PkLmwGH9Fp-vdR-6Cygm4dqstIVZlqVSJ9Q_vNC9mmkQJwezLOI4ZioyGtvkCiY1Tqw_5xo0mnMeIcTSk6KRxNLadx8I24XbV9SLgYqEqsaLxx3"
  },
  {
    name: "Protetor Solar FPS 50",
    price: "R$ 156",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCzFdUr_rGh1IqTu9xL67ebP9PiYpJbmFWEULCut6I6vJGWPXicXjJ3AC7yuAbOO8QkGbXLfGx8Sii8fvIphyCvy-aDG8_cXqWurmIherz3U5BrvicbrKh91k95_m-xOarTjSSMTjPuLj7iYpCiys8_xCpdKn6sL29jiNf-6UkwE_GkkqxLB5XzBk4c3wjZbOrfwqaa46rabdnFCHjv2OfgUzsqwIo9a8iGAWL3Ycs_E3NQhKYh1Mm9435Lw6hI8YQdU5oFovqwGmnc"
  },
  {
    name: "Recovery Hair Mask",
    price: "R$ 195",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCJfCRfm-DtmSHekGSSkydO65LOwQZPwnKSqMCB1NKMCQCOiR-c6H13CZTOR2ui11_Qgxt6Av6wuGBB15ENqzgBFrJ1XbiqcudDHpFy822cgfe4RwaaYHPvOzKe_TaMQCvkA3WC0DkDXk3ZWA1uWZ-TkB8NpetxKSpoJHB-aCTBlCDS-THNENAJCJi-tARKRnO5u2K5hJHfu66aYYcNjxlOJjnP6NC83pt46bxNFggXbQnXgHQsPsXTLmw15Fq4qhhbM69LEl0RIT6"
  },
  {
    name: "Essence N°1",
    price: "R$ 450",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAuCkGbOKyCE-YIiLbjbohs9yg9Bor6j5nHnH7OJrx_zq55W9IT31wc9dbUhvorHaF6-md4_F4_DSnWXpl7SD4aM3GC4vc5ZcSPSeKYVTBrPpuE2m1Aiw3Qa-v2Va_zm3dV8BNUp9oxJZziAziyh8LDfKwHCJGgjN-vx6kQbO53ynkyQqGLtGwEbEdTBBPpgXJedgnCFR5yWaNjzc21nCpzaGqbpNFHRPhoTHbOkIXqEEn2i8SQBgxvyq8DDF1gG9OA7KmHI1IFidwv"
  },
  {
    name: "Sabonete Artesanal",
    price: "R$ 58",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBtqtWLy98u_LpvQx8s9NekyBLHUYlb9B9MEhvQRjfQiaWZTMT_ndAxpcYM96azJ4uiyrnF_PM-z9OC0uRHwep1TkQZ-yQPkIKve36Un7WG2J5s1h-x8oyEsmK8FPsEUTTlQGYQhYZiOybA4JEVhf70CW2boMpxk4bfkm4FG21VDTwbQTn967HSm0Daknl2DGSeMY548qJlwdKDMApTYdSZoKGBdgmpQ4y1SvYyajX9OlzCLV1w1wuW0sFSklXG2gbDJ_WYv_MTSMYj"
  },
  {
    name: "Base Matte Silk",
    price: "R$ 215",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgBVRbCLgieCEki3zvSfp7yJQn75HhhqpiEh2-JhwA8-3diuE87WTvYUihkKfvibgBg28UR20ndf6Jl9HwNVI0sxT0SVUr9qkIdpN89sKl3n_tKJg0HKmvf2Qked08U_dKAwTO-zs31bka86q-67Tbe3DfoD_riOQyoCA1s5ekslNY-HOEwlerQKET0lCpiXunVPjuwaD1XxDe8p4IW3pBNK6ogpRJn1PqN4LqorGCc8bIQlTO9z2v2IKEy1TY0i9gU9wjMZqY7lUu"
  }
];

const ritualSteps = [
  {
    icon: Waves,
    title: "1. Limpar",
    description:
      "Remova impurezas preservando a barreira lipídica, ideal após incômodos ou depois do impacto."
  },
  {
    icon: Sparkles,
    title: "2. Tratar",
    description:
      "Séruns concentrados com Vitaminas C e Retinol para renovação celular profunda."
  },
  {
    icon: ScanFace,
    title: "3. Hidratar",
    description:
      "Sele a umidade com cremes luxuosos que restauram elasticidade e viço natural."
  },
  {
    icon: SunMedium,
    title: "4. Proteger",
    description:
      "Escudo inabalável. Proteção UV de amplo espectro com acabamento invisível."
  }
];

const footerGroups = [
  {
    title: "Institucional",
    links: ["Sobre a Bela", "Nossa Curadoria", "Carreiras", "Sustentabilidade"]
  },
  {
    title: "Atendimento ao Cliente",
    links: ["Minha Conta", "Rastrear Pedido", "Trocas e Devoluções", "Fale Conosco"]
  }
];

const SKINCARE_PRODUCT_SLUGS = [
  "serum-radiance-01",
  "creme-barrier-celeste",
  "gel-limpeza-veludo",
  "patch-olhos-aurora"
] as const;

const resolveSkincareProductHref = (index: number) =>
  `/produto/${SKINCARE_PRODUCT_SLUGS[index % SKINCARE_PRODUCT_SLUGS.length]}`;

const editorialQuoteImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAEMQ9E7_N7cApn9JcuOjKGV8mhsfHqj-w4EVS_e82JcpQnA-rRSQ-Re35KyRV3n4EQ3vHWcooidtRAhBbf1E2AqDkuzRVGLpOAas4VM8KhtidLFcw1Xk5M31NQ3T5MX24thF7Ccd3d0bSOJtWIyQltYNYzCuAbWn1nhUdOMEu1C5hIHHoy2aXrsunzdPFuc6egd1FiWN_2wx1NXKYhg5k0QyXIpm4-oOP64FMbz9Cxnu1W5_mF5pOgtW01NjoXgGQArbqD83ov7hbo";

export function SkincareAtelierExperience() {
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
    <div className="bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="skincare-public">
      <BelaPopValidatedHeader />

      <main className="pb-28 pt-16 md:pb-0">
        <section className="px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          <Link
            href="/skin-scan"
            className="group relative block min-h-[16rem] overflow-hidden bg-[#f6f3f2] sm:min-h-[20rem] lg:min-h-[26rem]"
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#f6f3f2] via-[#f6f3f2]/90 via-48% to-transparent to-76%" />
            <div className="absolute inset-y-0 right-[-2%] w-[72%] sm:right-[-1%] sm:w-[64%] lg:right-0 lg:w-[58%]">
              <img
                alt="Skin Scan Bela"
                className="h-full w-full object-cover object-[70%_28%] grayscale transition duration-700 group-hover:scale-[1.02] group-hover:grayscale-0 sm:object-[72%_30%] lg:object-[66%_34%]"
                src={heroImage}
              />
            </div>
            <div className="absolute inset-y-0 left-0 z-20 flex w-full max-w-[18rem] flex-col justify-center p-6 sm:max-w-sm sm:p-8 lg:max-w-md lg:p-10">
              <span className="mb-2 text-xs font-bold uppercase tracking-[0.32em] text-[#ed93d5]">
                Skincare BelaPop
              </span>
              <h1 className="font-editorial text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Entenda sua pele com mais clareza
              </h1>
              <p className="mt-3 max-w-[17rem] text-sm leading-7 text-[#444748] sm:text-base">
                Selecao baseada em criterios de uso e formulacao para ajustar sua rotina.
              </p>
              <span className="mt-6 inline-flex min-h-12 w-fit items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] underline decoration-[#ed93d5] underline-offset-4">
                Entender minha pele
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </section>

        <section className="bg-[#f6f3f2] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[#444748]">
                  Selecao da categoria
                </span>
                <h2 className="font-editorial text-3xl font-bold sm:text-4xl">
                  Produtos organizados para facilitar sua escolha
                </h2>
                <p className="mt-3 text-xs text-[#444748] sm:text-sm">
                  Produtos vendidos por parceiros verificados. Prazo e envio definidos por cada
                  seller.
                </p>
                <p className="mt-1 text-xs text-[#444748] sm:text-sm">
                  Cada produto pode ter condicoes de envio e prazo diferentes.
                </p>
                <p className="mt-1 text-xs text-[#444748] sm:text-sm">
                  Selecao inicial. Novos produtos estao sendo adicionados continuamente.
                </p>
              </div>
              <div className="hidden items-center gap-4 md:flex">
                <div className="mr-2 flex gap-2">
                  <button
                    aria-label="Produtos anteriores"
                    className="flex h-11 w-11 items-center justify-center border border-black/20 bg-transparent transition-colors hover:bg-white"
                    onClick={() => scrollHotProducts("left")}
                    type="button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Próximos produtos"
                    className="flex h-11 w-11 items-center justify-center border border-black/20 bg-transparent transition-colors hover:bg-white"
                    onClick={() => scrollHotProducts("right")}
                    type="button"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <a className="text-xs font-semibold uppercase tracking-[0.24em] text-black underline underline-offset-4" href="#colecao">
                  Ver selecao
                </a>
              </div>
            </div>

            <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 hide-scrollbar md:gap-6" ref={hotProductsRef}>
              {hotProducts.map((product, index) => (
                <article key={product.name} className="min-w-[78%] snap-start bg-white sm:min-w-[320px] lg:min-w-[360px]">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img alt={product.name} className="h-full w-full object-cover" src={product.image} />
                  </div>
                  <div className="p-4 sm:p-5">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.24em] ${product.badge === "Limited Edition" ? "text-[#ed93d5]" : "text-[#444748]"}`}>
                      {product.badge}
                    </span>
                    <h3 className="mt-2 font-editorial text-xl font-bold">{product.name}</h3>
                    <p className="mt-1 text-sm text-[#444748]">{product.subtitle}</p>
                    <p className="mt-3 text-sm font-semibold text-[#1c1b1b]">{product.price}</p>
                    <Link
                      className="mt-5 inline-flex min-h-14 w-full items-center justify-center bg-black px-5 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-black/90"
                      href={resolveSkincareProductHref(index)}
                    >
                      Adicionar à sacola
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between md:hidden">
              <div className="flex gap-2">
                <button
                  aria-label="Produtos anteriores"
                  className="flex h-11 w-11 items-center justify-center border border-black/20 bg-transparent transition-colors hover:bg-white"
                  onClick={() => scrollHotProducts("left")}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  aria-label="Próximos produtos"
                  className="flex h-11 w-11 items-center justify-center border border-black/20 bg-transparent transition-colors hover:bg-white"
                  onClick={() => scrollHotProducts("right")}
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <a className="text-xs font-semibold uppercase tracking-[0.24em] text-black underline underline-offset-4" href="#colecao">
                Ver selecao
              </a>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24" id="colecao">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-12 text-center font-editorial text-3xl font-bold sm:text-4xl">
              Selecao completa
            </h2>

            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 sm:gap-y-16 lg:grid-cols-3 xl:grid-cols-4">
              {collectionProducts.slice(0, 10).map((product, index) => (
                <article key={product.name} className="flex flex-col">
                  <Link href={resolveSkincareProductHref(index + 1)} className="block">
                    <div className="mb-4 aspect-[4/5] overflow-hidden bg-[#f6f3f2]">
                      <img alt={product.name} className="h-full w-full object-cover" src={product.image} />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#444748]">BELA ATELIER</p>
                    <h3 className="mt-1 font-editorial text-lg font-bold leading-tight">{product.name}</h3>
                    <p className="mt-1 text-sm text-[#444748]">{product.price}</p>
                  </Link>
                </article>
              ))}

              <div className="relative col-span-2 my-2 overflow-hidden sm:my-4 lg:col-span-3 xl:col-span-2">
                <img
                  alt="Editorial BelaPop"
                  className="h-44 w-full object-cover sm:h-52 lg:h-56"
                  src={editorialQuoteImage}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-8 text-center">
                  <p className="font-editorial text-xl italic text-white sm:text-2xl">
                    &quot;A beleza é um ritual de autocuidado diário.&quot;
                  </p>
                </div>
              </div>

              {collectionProducts.slice(10).map((product, index) => (
                <article key={product.name} className="flex flex-col">
                  <Link href={resolveSkincareProductHref(index + 2)} className="block">
                    <div className="mb-4 aspect-[4/5] overflow-hidden bg-[#f6f3f2]">
                      <img alt={product.name} className="h-full w-full object-cover" src={product.image} />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#444748]">BELA ATELIER</p>
                    <h3 className="mt-1 font-editorial text-lg font-bold leading-tight">{product.name}</h3>
                    <p className="mt-1 text-sm text-[#444748]">{product.price}</p>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-black/10 bg-[#fcf9f8] px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 block text-[9px] uppercase tracking-[0.5em] text-[#444748]/70">
              The Routine
            </span>
            <h2 className="font-editorial text-3xl font-medium tracking-tight sm:text-4xl">
              O Seu Ritual BelaPop
            </h2>
            <div className="mx-auto mt-6 h-px w-10 bg-[#ed93d5]" />
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-x-8 gap-y-14 lg:mt-16 lg:gap-x-12">
            {ritualSteps.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="text-center">
                  <Icon className="mx-auto mb-4 h-6 w-6 text-[#444748]" />
                  <h3 className="font-editorial text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-[11px] font-light leading-6 text-[#444748] sm:text-xs sm:leading-7">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <div className="mx-auto mb-2 h-px w-24 bg-black/10" />
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#444748]/50">
              Dermatologicamente testado
            </span>
          </div>
        </section>
      </main>

      <footer className="bg-black px-8 py-16 text-left text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="font-editorial text-2xl font-bold tracking-widest">BelaPop</h2>
            <p className="mt-4 max-w-xs text-[11px] font-light leading-relaxed text-white/60">
              Elevando o conceito de beleza através de curadoria seletiva e rituais digitais para a sua pele.
            </p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">{group.title}</h3>
              <nav className="flex flex-col gap-3">
                {group.links.map((label) => (
                  <Link key={label} className="text-[11px] text-white/60 transition-colors hover:text-white" href="/conta">
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Social</h3>
            <div className="flex gap-4">
              <a className="text-white/60 transition hover:text-white" href="#" aria-label="Instagram">
                <Camera className="h-5 w-5" />
              </a>
              <a className="text-white/60 transition hover:text-white" href="#" aria-label="Vídeo">
                <Video className="h-5 w-5" />
              </a>
              <a className="text-white/60 transition hover:text-white" href="#" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            </div>

            <div className="pt-4">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em]">Formas de Pagamento</h3>
              <div className="flex flex-wrap gap-2">
                {["VISA", "MC", "PIX", "AMEX", "APPLE"].map((payment) => (
                  <div key={payment} className="flex h-6 w-10 items-center justify-center border border-white/20 text-[8px] font-bold">
                    {payment}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-8">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">
            © 2026 BelaPop. TODOS OS DIREITOS RESERVADOS.
          </p>
          <div className="mt-4 flex gap-4">
            <a className="text-[9px] uppercase tracking-[0.1em] text-white/40 transition hover:text-white" href="#">
              Privacy Policy
            </a>
            <a className="text-[9px] uppercase tracking-[0.1em] text-white/40 transition hover:text-white" href="#">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around border-t border-black/5 bg-[#fcf9f8]/90 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <Link className="flex flex-col items-center gap-1 pt-2 text-[#444748] transition hover:text-[#ed93d5]" href="/">
          <Home className="h-5 w-5" />
          <span className="text-[10px] uppercase tracking-tight">Início</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 border-t-2 border-[#1a1a1a] pt-2 text-[#1a1a1a]" href="/skincare">
          <Search className="h-5 w-5" />
          <span className="text-[10px] uppercase tracking-tight">Explorar</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 pt-2 text-[#444748] transition hover:text-[#ed93d5]" href="/skin-scan">
          <ScanFace className="h-5 w-5 text-[#ed93d5]" />
          <span className="text-[10px] uppercase tracking-tight">Skin Scan</span>
        </Link>
        <Link className="flex flex-col items-center gap-1 pt-2 text-[#444748] transition hover:text-[#ed93d5]" href="/conta/favoritos">
          <Heart className="h-5 w-5" />
          <span className="text-[10px] uppercase tracking-tight">Favoritos</span>
        </Link>
      </nav>
    </div>
  );
}
