"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flower2,
  FlaskConical,
  Heart,
  Home,
  Mail,
  Menu,
  MessageCircle,
  Play,
  ScanFace,
  Search,
  ShoppingBag,
  Sparkles,
  SunMedium,
  User,
  WandSparkles,
  Waves,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { LuxuryTopNav } from "@/components/home/luxury-home/TopNav";
import { previewBodyFont, previewHeadlineFont } from "./luxury-preview-theme";

type ProductCard = {
  name: string;
  subtitle: string;
  label: string;
  image: string;
};

type CollectionProduct = {
  name: string;
  price: string;
  image: string;
};

const hotProducts: ProductCard[] = [
  {
    label: "Limited Edition",
    name: "Serum Radiance",
    subtitle: "Glow Instantaneo 30ml",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTJeJby-t_D_GXJKtNaeyWH7_42dJFnOG8RIFgjicKOBQlZV-qWY0QD5jYzbYbEzI-LM8bwrHfrGn9xeW25_IGSInFS5w8dADSicAKYvzVZl1Vog_-v7oatKHA7Opv80hLNBgfc04S6YvHgbOv0u_fiRU2U4koJtTb8lAcghVZY32oOr_3yI9I0Mog7VblTbmavAwPACTcAhJ5CLlbaoIW2pmYMpMTQGIbbcvK1SxM4y26Iu-Bs6JWAuK-QpXgJSwsxU4tnMlBRK0J"
  },
  {
    label: "Mais Vendido",
    name: "Velvet Hydra",
    subtitle: "Creme Hidratante Profundo",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD8NiFm3kWPCIVDaN4xf7TZ8IYpHvqVC_I-US9KYBTusMthaZ6V0M36OSdbXwWtq22Sb7i8N4OZBGWpDeed8__stBCOUHgO68JmSma7y0S1e8NeaRVbZuwvt6BSTVkEA9umVafMUV9RQx5arfT2ia9h0AkAWiKuAHVATlMYyRIil8V640fQUKgZhoJVQ5yYcpLgWG4d3eP-1_1KhERyWhvslOg-9jcZbiNtys4Lfe0EvumVV25oeGet_DqiygLu4beZVMb9pjaQnPVt"
  }
];

const collectionProducts: CollectionProduct[] = [
  {
    name: "Oleo Nutritivo",
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
    name: "Tonico Botanico",
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
    name: "Essence No. 1",
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
      "Remova impurezas preservando a barreira lipidica, ideal apos impactos e sensibilizacao."
  },
  {
    icon: FlaskConical,
    title: "2. Tratar",
    description:
      "Seruns concentrados com Vitaminas C e Retinol para renovacao celular profunda."
  },
  {
    icon: Flower2,
    title: "3. Hidratar",
    description:
      "Sele a umidade com cremes luxuosos que restauram elasticidade e vico."
  },
  {
    icon: SunMedium,
    title: "4. Proteger",
    description:
      "Protecao UV de amplo espectro com acabamento invisivel para o ritual diario."
  }
] as const;

const skincareFilters = [
  "Todos",
  "Limpeza",
  "Séruns",
  "Hidratação",
  "Proteção",
  "Olhos",
  "Máscaras"
] as const;

const refinementFilters = [
  "Tipo de pele",
  "Necessidade",
  "Textura",
  "Ativos",
  "Marca",
  "Preço",
  "Avaliação"
] as const;

const sortOptions = [
  "Mais desejados",
  "Lançamentos",
  "Menor preço",
  "Maior preço",
  "Melhor avaliados"
] as const;

const drawerItems: Array<{
  label: string;
  icon: typeof ScanFace;
  accent?: boolean;
}> = [
  { label: "Skin Scan Bela", icon: ScanFace, accent: true },
  { label: "Inicio", icon: Home },
  { label: "Skincare", icon: Flower2, accent: true },
  { label: "Maquiagem", icon: WandSparkles },
  { label: "Cabelos", icon: Sparkles }
] as const;

const footerGroups = [
  {
    title: "Institucional",
    items: ["Sobre a Bela", "Nossa Curadoria", "Carreiras", "Sustentabilidade"]
  },
  {
    title: "Atendimento ao Cliente",
    items: ["Minha Conta", "Rastrear Pedido", "Trocas e Devolucoes", "Fale Conosco"]
  }
] as const;

const ITEMS_PER_PAGE = 15;
const TOTAL_SKINCARE_PRODUCTS = 280;

const skincareCatalogProducts: CollectionProduct[] = Array.from(
  { length: TOTAL_SKINCARE_PRODUCTS },
  (_, index) => {
    const baseProduct = collectionProducts[index % collectionProducts.length];

    return {
      ...baseProduct,
      image: baseProduct.image
    };
  }
);

function ImageCard({
  src,
  alt,
  className
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-[#f6f3f2] ${className ?? ""}`}>
      <Image
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 1023px) 100vw, 24vw"
        src={src}
      />
    </div>
  );
}

function CollectionCard({ product }: { product: CollectionProduct }) {
  return (
    <article className="flex flex-col">
      <ImageCard
        alt={product.name}
        className="mb-4 aspect-[4/5]"
        src={product.image}
      />
      <p className="text-[10px] uppercase tracking-[0.24em] text-[#444748]">Bela Atelier</p>
      <h5 className={`${previewHeadlineFont.className} mt-1 text-[18px] font-bold leading-tight`}>
        {product.name}
      </h5>
      <p className="mt-1 text-sm text-[#444748]">{product.price}</p>
    </article>
  );
}

function resolveSkincareCategory(name: string) {
  if (/(cleanser|sabonete)/i.test(name)) return "Limpeza";
  if (/(serum|booster|essence|tonico)/i.test(name)) return "Séruns";
  if (/(crem|balm|oleo|mist|kit)/i.test(name)) return "Hidratação";
  if (/fps|protetor/i.test(name)) return "Proteção";
  if (/eye/i.test(name)) return "Olhos";
  if (/mask|mascara|esfoliante|detox/i.test(name)) return "Máscaras";
  return "Hidratação";
}

function getPriceValue(price: string) {
  return Number(price.replace(/[^\d]/g, ""));
}

function getPreviewRating(product: CollectionProduct) {
  return (product.name.length * 17 + getPriceValue(product.price)) % 500;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function AtelierPreviewScreen() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof skincareFilters)[number]>("Todos");
  const [activeRefinement, setActiveRefinement] =
    useState<(typeof refinementFilters)[number]>("Tipo de pele");
  const [activeSort, setActiveSort] =
    useState<(typeof sortOptions)[number]>("Mais desejados");
  const [activePage, setActivePage] = useState(1);
  const carouselRef = useRef<HTMLDivElement>(null);
  const paginationResetKey = `${activeFilter}|${activeSort}|${searchQuery}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  const filteredCollectionProducts = useMemo(() => {
    const normalizedSearch = normalizeText(searchQuery.trim());

    return skincareCatalogProducts.filter((product) => {
      const category = resolveSkincareCategory(product.name);
      const matchesFilter = activeFilter === "Todos" || category === activeFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeText(`${product.name} ${product.price} ${category}`).includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  const sortedCollectionProducts = useMemo(() => {
    const products = [...filteredCollectionProducts];

    switch (activeSort) {
      case "Lançamentos":
        return products.reverse();
      case "Menor preço":
        return products.sort((a, b) => getPriceValue(a.price) - getPriceValue(b.price));
      case "Maior preço":
        return products.sort((a, b) => getPriceValue(b.price) - getPriceValue(a.price));
      case "Melhor avaliados":
        return products.sort((a, b) => getPreviewRating(b) - getPreviewRating(a));
      case "Mais desejados":
      default:
        return products;
    }
  }, [activeSort, filteredCollectionProducts]);

  const totalPages = Math.max(1, Math.ceil(sortedCollectionProducts.length / ITEMS_PER_PAGE));

  const paginatedCollectionProducts = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return sortedCollectionProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [activePage, sortedCollectionProducts]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (activePage <= 2) {
      return [1, 2, 3];
    }

    if (activePage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    }

    return [activePage - 1, activePage, activePage + 1];
  }, [activePage, totalPages]);

  useEffect(() => {
    setActivePage(1);
  }, [paginationResetKey]);

  function scrollCarousel(direction: "left" | "right") {
    carouselRef.current?.scrollBy({
      left: direction === "left" ? -240 : 240,
      behavior: "smooth"
    });
  }

  return (
    <div className={`${previewBodyFont.className} min-h-screen bg-black`}>
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#fcf9f8] text-[#1c1b1b] shadow-[0_0_0_1px_rgba(255,255,255,0.06)] lg:max-w-none lg:shadow-none">
        <div className="hidden lg:block">
          <LuxuryTopNav />
        </div>

        <header className="sticky top-0 z-40 lg:hidden">
          <div className="border-b border-white/10 bg-black/95 text-white backdrop-blur">
            <div className="relative flex min-h-[72px] items-center justify-between px-4 py-3">
              <div className="flex min-w-0 items-center gap-4">
                <button
                  aria-expanded={isDrawerOpen}
                  aria-label="Abrir menu"
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-transparent text-white transition hover:border-white/28 hover:bg-white/5"
                  type="button"
                  onClick={() => setIsDrawerOpen((value) => !value)}
                >
                  {isDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                <Link aria-label="BelaPop" className="min-w-0 shrink truncate" href="/">
                  <span
                    className={`${previewHeadlineFont.className} block truncate text-[1.95rem] font-bold leading-none tracking-[-0.05em] text-white`}
                  >
                    BelaPop
                  </span>
                </Link>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  aria-label="Buscar no catalogo"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-transparent text-white transition hover:border-white/28 hover:bg-white/5"
                  type="button"
                >
                  <Search className="h-5 w-5" />
                </button>
                <button
                  aria-label="Carrinho"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-transparent text-white transition hover:border-white/28 hover:bg-white/5"
                  type="button"
                >
                  <ShoppingBag className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="pb-12 lg:pb-20">
          <div>
          <section className="px-6 pb-12 pt-0 lg:px-0 lg:pb-0 lg:pt-0">
            <Link href="/preview/scan" className="group block">
              <div
                className="relative overflow-hidden bg-[#f6f3f2] lg:min-h-[400px]"
                style={{
                  background:
                    "linear-gradient(90deg, #f6f1ed 0%, #f3eee8 28%, #eee8e1 48%, #e7ddd2 70%, #dbc6b5 100%)"
                }}
              >
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(246,243,242,0.96) 0%, rgba(244,239,234,0.86) 24%, rgba(241,235,229,0.62) 44%, rgba(236,227,219,0.28) 66%, rgba(233,223,214,0.08) 80%, rgba(233,223,214,0) 100%)"
                  }}
                />
                <Image
                  alt="Close-up de pele iluminada"
                  className="relative z-[1] h-48 w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 lg:h-[400px] lg:object-contain lg:object-right-top"
                  height={400}
                  priority
                  sizes="100vw"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNFRqFmSxF-LiL0_W_2fIwuymOiSnxO6akSIgQ2325O8jkQVoNNyHGgjDdK_QWsyisynuhJneqokGiGw0x3zxtQA_a7O4hzmqxw1Uo5lGrnpXmvqEC4znUasqovLLJw-7VkUadU8y3OoGLRvnmFVR0qBDCPbnugBbhslljRqWhWTedVh5V4DRVCdgeMU4h-a616YiMFZre2J9VIKkEyWgmSQJLM9eb60tr6Mzpa4g110tx1EEZH2fzvAILSfJuOirv3-1WEBmTXCgR"
                  width={1600}
                />
                <div className="absolute inset-0 z-20 flex flex-col justify-center p-6 lg:px-16 lg:py-10">
                  <span className="mb-2 text-xs font-bold uppercase tracking-[0.26em] text-[#ed93d5] lg:text-[11px]">
                    Inteligencia Artificial
                  </span>
                  <h2 className={`${previewHeadlineFont.className} text-2xl font-bold leading-tight lg:max-w-[11ch] lg:text-5xl`}>
                    Skin Scan Bela
                  </h2>
                  <p className="mb-4 mt-2 max-w-[210px] text-sm leading-6 text-[#444748] lg:max-w-[30ch] lg:text-base lg:leading-7">
                    Analise sua pele em segundos e receba sua rotina personalizada.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] lg:text-[11px]">
                    <span className="underline decoration-[#ed93d5] underline-offset-4">
                      Comecar agora
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          </section>

          <section className="px-6 pb-10 lg:hidden">
            <div className="rounded-[28px] border border-black/8 bg-[#f6f3f2] p-4 lg:p-6">
              <div className="flex items-center gap-3 border-b border-black/8 pb-4 lg:pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1c1b1b] shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                  <Search className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-[10px] uppercase tracking-[0.24em] text-[#444748]" htmlFor="skincare-search">
                    Buscar skincare
                  </label>
                  <input
                    id="skincare-search"
                    className="h-11 w-full border-0 bg-transparent px-0 py-0 text-sm text-[#1c1b1b] placeholder:text-[#747878]/70 focus:outline-none focus:ring-0"
                    placeholder="Serum, limpeza, hidratacao..."
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#444748]">
                  Filtros personalizados
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden">
                  {skincareFilters.map((filter) => (
                    <button
                      key={filter}
                      className={`shrink-0 rounded-full border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                        activeFilter === filter
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-[#1c1b1b] hover:bg-black hover:text-white"
                      }`}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          </div>

          <section className="bg-[#f6f3f2] py-16 lg:py-24">
            <div className="mx-auto mb-8 flex max-w-[1440px] items-end justify-between gap-4 px-6 lg:px-8">
              <div>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[#444748]">
                  Tendencias
                </span>
                <h3 className={`${previewHeadlineFont.className} text-3xl font-bold`}>
                  Hot Products
                </h3>
              </div>
              <div className="flex items-end gap-4">
                <div className="flex gap-2">
                  <button
                    aria-label="Voltar produtos"
                    className="flex h-10 w-10 items-center justify-center border border-black/20 bg-transparent transition-colors hover:bg-white"
                    type="button"
                    onClick={() => scrollCarousel("left")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Avancar produtos"
                    className="flex h-10 w-10 items-center justify-center border border-black/20 bg-transparent transition-colors hover:bg-white"
                    type="button"
                    onClick={() => scrollCarousel("right")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <button className="border-b border-black pb-1 text-xs uppercase tracking-[0.18em]" type="button">
                  Ver Tudo
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-auto lg:grid lg:max-w-[1440px] lg:grid-cols-2 lg:overflow-visible lg:px-8 [&::-webkit-scrollbar]:hidden"
            >
              {hotProducts.map((product) => (
                <article
                  key={product.name}
                  className="min-w-0 shrink-0 basis-[calc((100%-1.5rem)/2)] snap-start bg-white lg:basis-auto"
                >
                  <ImageCard
                    alt={product.name}
                    className="aspect-[3/4] lg:aspect-[4/5]"
                    src={product.image}
                  />
                  <div className="p-3 lg:p-6">
                    <span
                      className={`text-[10px] uppercase tracking-[0.18em] ${
                        product.label === "Limited Edition" ? "font-bold text-[#ed93d5]" : "text-[#444748]"
                      }`}
                    >
                      {product.label}
                    </span>
                    <h4 className={`${previewHeadlineFont.className} mt-1 text-[17px] leading-tight lg:text-[2rem]`}>
                      {product.name}
                    </h4>
                    <p className="mb-3 mt-1 text-[13px] leading-5 text-[#444748] lg:mb-5 lg:text-base lg:leading-7">
                      {product.subtitle}
                    </p>
                    <button
                      className="min-h-12 w-full bg-black px-3 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-black/90 lg:min-h-[56px]"
                      type="button"
                    >
                      Adicionar a Sacola
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-[#fcf9f8] px-6 py-24 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 text-center">
              <h3 className={`${previewHeadlineFont.className} text-3xl font-bold`}>
                Nossa Coleção
              </h3>
              <div className="mt-5 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] lg:justify-center lg:gap-6 [&::-webkit-scrollbar]:hidden">
                {skincareFilters.map((filter) => (
                  <button
                    key={filter}
                    className={`${previewHeadlineFont.className} shrink-0 border-b pb-1 text-[1.02rem] leading-none transition-colors ${
                      activeFilter === filter
                        ? "border-[#1c1b1b] text-[#1c1b1b]"
                        : "border-transparent hover:border-[#c9b8be] hover:text-[#4f474a]"
                    }`}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:justify-center [&::-webkit-scrollbar]:hidden">
                {refinementFilters.map((filter) => (
                  <button
                    key={filter}
                    className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-medium tracking-[0.08em] transition-colors ${
                      activeRefinement === filter
                        ? "border-[#1c1b1b] bg-[#1c1b1b] text-white"
                        : "border-black/10 bg-white text-[#5f595b] hover:border-[#c9b8be] hover:text-[#1c1b1b]"
                    }`}
                    type="button"
                    onClick={() => setActiveRefinement(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="mt-5 flex flex-col items-center gap-3 lg:flex-row lg:justify-between">
                <p className="text-sm text-[#5f595b]">
                  {sortedCollectionProducts.length} produtos em skincare
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      className={`rounded-full px-3 py-2 text-[11px] tracking-[0.08em] transition-colors ${
                        activeSort === option
                          ? "bg-[#efe8e2] text-[#1c1b1b]"
                          : "text-[#6b6467] hover:text-[#1c1b1b]"
                      }`}
                      type="button"
                      onClick={() => setActiveSort(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-[11px] text-[#8a8486]">
                Curadoria refinada para explorar textura, ativos e performance.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-16 lg:grid-cols-5 lg:gap-x-6 lg:gap-y-20">
              {paginatedCollectionProducts.map((product) => (
                <CollectionCard key={product.name} product={product} />
              ))}
            </div>

            {filteredCollectionProducts.length > 6 && activeFilter === "Todos" && searchQuery.length === 0 ? (
              <div className="relative col-span-2 my-10 h-40 overflow-hidden lg:mx-auto lg:my-14 lg:h-56 lg:max-w-[960px]">
                <Image
                  alt="Ritual de beleza em atmosfera de spa"
                  className="h-full w-full object-cover"
                  height={320}
                  sizes="(max-width: 1023px) 100vw, 960px"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEMQ9E7_N7cApn9JcuOjKGV8mhsfHqj-w4EVS_e82JcpQnA-rRSQ-Re35KyRV3n4EQ3vHWcooidtRAhBbf1E2AqDkuzRVGLpOAas4VM8KhtidLFcw1Xk5M31NQ3T5MX24thF7Ccd3d0bSOJtWIyQltYNYzCuAbWn1nhUdOMEu1C5hIHHoy2aXrsunzdPFuc6egd1FiWN_2wx1NXKYhg5k0QyXIpm4-oOP64FMbz9Cxnu1W5_mF5pOgtW01NjoXgGQArbqD83ov7hbo"
                  width={720}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 px-8 text-center">
                  <p className={`${previewHeadlineFont.className} text-xl italic text-white lg:text-[2rem]`}>
                    &quot;A beleza e um ritual de autocuidado diario.&quot;
                  </p>
                </div>
              </div>
            ) : null}

            {filteredCollectionProducts.length === 0 ? (
              <div className="mt-10 rounded-[28px] border border-black/8 bg-[#f6f3f2] px-6 py-10 text-center">
                <p className={`${previewHeadlineFont.className} text-2xl`}>Nenhum item encontrado</p>
                <p className="mt-3 text-sm leading-6 text-[#444748]">
                  Tente outro termo ou troque o filtro para explorar a curadoria de skincare.
                </p>
              </div>
            ) : null}

            {filteredCollectionProducts.length > 0 && totalPages > 1 ? (
              <div className="mt-12 flex items-center justify-center gap-3 lg:mt-14">
                {visiblePages.map((page) => (
                  <button
                    key={page}
                    className={`flex h-11 min-w-[44px] items-center justify-center border px-4 text-sm font-semibold transition-colors ${
                      activePage === page
                        ? "border-black bg-black text-white"
                        : "border-black/12 bg-white text-[#1c1b1b] hover:bg-[#f6f3f2]"
                    }`}
                    type="button"
                    onClick={() => setActivePage(page)}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 3 ? (
                  <>
                    <span className="px-1 text-sm text-[#747878]">...</span>
                    <button
                      className="flex h-11 min-w-[44px] items-center justify-center border border-black/12 bg-white px-4 text-sm font-semibold text-[#1c1b1b] transition-colors hover:bg-[#f6f3f2]"
                      type="button"
                      onClick={() => setActivePage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
            </div>
          </section>

          <section className="border-t border-[#eae7e7] bg-[#fcf9f8] px-8 py-24 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-[1440px]">
            <div className="mx-auto mb-16 max-w-lg text-center">
              <span className="mb-4 block text-[9px] uppercase tracking-[0.5em] text-[#444748]/70">
                The Routine
              </span>
              <h3 className={`${previewHeadlineFont.className} text-3xl font-medium tracking-tight`}>
                O Seu Ritual BelaPop
              </h3>
              <div className="mx-auto mt-6 h-px w-10 bg-[#ed93d5]" />
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-16 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-0">
              {ritualSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <article key={step.title} className="flex flex-col items-center text-center">
                    <Icon className="mb-4 h-6 w-6 text-[#444748]" />
                    <h4 className={`${previewHeadlineFont.className} mb-2 text-base font-bold`}>
                      {step.title}
                    </h4>
                    <p className="text-[11px] font-light leading-relaxed text-[#444748]">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-20 text-center">
              <div className="mx-auto mb-2 h-px w-24 bg-black/10" />
              <span className="text-[8px] uppercase tracking-[0.3em] text-[#444748]/50">
                Dermatologicamente Testado
              </span>
            </div>
            </div>
          </section>
        </main>

        <footer className="bg-black px-8 py-16 text-left text-white lg:px-8 lg:py-20">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-12 lg:grid lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] lg:gap-10">
            <div>
              <h2
                className={`${previewHeadlineFont.className} mb-4 text-2xl font-bold uppercase tracking-[0.24em]`}
              >
                BelaPop
              </h2>
              <p className="max-w-[240px] text-[11px] font-light leading-relaxed text-white/60">
                Elevando o conceito de beleza atraves de curadoria seletiva e rituais digitais para a sua pele.
              </p>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]">{group.title}</h3>
                <nav className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <a
                      key={item}
                      className="text-[11px] text-white/60 transition-colors hover:text-white"
                      href="#"
                    >
                      {item}
                    </a>
                  ))}
                </nav>
              </div>
            ))}

            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Social</h3>
              <div className="flex gap-4">
                <button className="text-white/60 transition-opacity hover:text-white" type="button">
                  <Sparkles className="h-5 w-5" />
                </button>
                <button className="text-white/60 transition-opacity hover:text-white" type="button">
                  <Play className="h-5 w-5" />
                </button>
                <button className="text-white/60 transition-opacity hover:text-white" type="button">
                  <Mail className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Formas de Pagamento</h3>
              <div className="flex flex-wrap gap-2">
                {["VISA", "MC", "PIX", "AMEX", "APPLE"].map((method) => (
                  <div
                    key={method}
                    className="flex h-6 w-10 items-center justify-center border border-white/20 text-[8px] font-bold"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-8 lg:col-span-full lg:mt-0 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">
                (c) 2026 BelaPop. Todos os direitos reservados.
              </p>
              <div className="flex gap-4">
                <a className="text-[9px] uppercase tracking-[0.1em] text-white/40 hover:text-white" href="#">
                  Privacy Policy
                </a>
                <a className="text-[9px] uppercase tracking-[0.1em] text-white/40 hover:text-white" href="#">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {isDrawerOpen ? (
        <div
          className="fixed inset-0 z-[100] bg-[rgba(18,14,16,0.46)] backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div className="mx-auto h-full max-w-[430px]">
            <aside
              aria-label="Menu lateral"
              className="flex h-full w-[88vw] max-w-[380px] flex-col overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,rgba(16,13,15,0.98),rgba(26,20,24,0.98))] p-5 pb-7 pt-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-white/78">
                    BelaPop
                  </p>
                  <p className={`${previewHeadlineFont.className} mt-2 max-w-[14ch] text-3xl leading-[0.94] text-white`}>
                    Explore o skincare.
                  </p>
                </div>
                <button
                  aria-label="Fechar menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-[#fbf7f4] transition hover:border-[#d8a0ac]/45 hover:bg-white/10"
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="mt-6 rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
                <p className="text-[10px] uppercase tracking-[0.34em] text-white/74">
                  Curadoria de skincare
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/92">
                  Busca refinada, filtros dedicados e selecao premium para limpeza, tratamento e glow.
                </p>
              </div>

              <div className="mt-8 flex flex-col space-y-6">
                {drawerItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      className={`flex items-center gap-4 rounded-[24px] border px-4 py-4 text-sm uppercase tracking-[0.22em] ${
                        item.accent
                          ? "border-[#d8a0ac]/45 bg-[#f8eef0]/12 font-bold text-[#ed93d5]"
                          : "border-white/8 bg-white/[0.03] text-white/96"
                      }`}
                      href="#"
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </a>
                  );
                })}

                <div className="mt-2 bg-black p-6 text-white">
                  <div className="mb-4 flex items-start justify-between">
                    <Sparkles className="h-5 w-5 text-[#ed93d5]" />
                    <span className="text-[10px] uppercase tracking-[0.2em]">Loyalty</span>
                  </div>
                  <p className={`${previewHeadlineFont.className} mb-4 text-lg`}>
                    Entrar no PopClub
                  </p>
                  <button className="text-xs uppercase underline decoration-[#ed93d5] underline-offset-4" type="button">
                    Saiba Mais
                  </button>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-8">
                  <a className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-white" href="#">
                    <User className="h-4 w-4" />
                    Minha Conta
                  </a>
                  <a className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-white" href="#">
                    <MessageCircle className="h-4 w-4" />
                    Contato
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </div>
  );
}
