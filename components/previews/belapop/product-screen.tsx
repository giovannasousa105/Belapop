/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Droplets, Hand, Sparkles, Star } from "lucide-react";

import { CurationReasonCard } from "@/components/legal/CurationReasonCard";
import { SellerOfRecordCard } from "@/components/legal/SellerOfRecordCard";
import { TrustSignals } from "@/components/legal/TrustSignals";
import type { EditorialProduct } from "@/lib/queries/products";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import { ProductPreviewPurchaseActions } from "./product-purchase-actions";
import { previewHeadlineFont } from "./luxury-preview-theme";
import {
  getBelapopHref,
  getBelapopProductHref,
  type BelapopRenderMode
} from "./routes";

const ritualSteps = [
  {
    title: "01. Preparar",
    body: "Aqueça tres gotas entre as palmas das maos para ativar os principios botanicos.",
    icon: Droplets
  },
  {
    title: "02. Aplicar",
    body: "Massageie com movimentos ascendentes do centro do rosto para as extremidades.",
    icon: Hand
  },
  {
    title: "03. Selar",
    body: "Finalize com leves batidas para preservar brilho e elasticidade.",
    icon: Sparkles
  }
] as const;

const reviews = [
  {
    quote:
      "Simplesmente transformador. Senti minha pele recuperar a vitalidade e o viço em poucos dias.",
    name: "Helena M."
  },
  {
    quote:
      "A textura e divina. Nao pesa e a recomendacao da IA funcionou perfeitamente para a minha sensibilidade.",
    name: "Viviane S."
  },
  {
    quote:
      "Investimento que vale cada centavo. Minhas linhas suavizaram muito em duas semanas de uso.",
    name: "Claudia R."
  }
] as const;

const sampleGallery = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDLq46nOUfBvyhffSDBJYY7P6uILj7nQgbqScdmgD_TvsKOmXzQOy7ZS5y0Q4GjutdZGc-gXCyq57uQqrUkkYarEj-t8oACr646Rurkxrz4qc4_P4f-tH2DeMK16kmVV9k0k36O_ogTwOQ_AeFdYVvvh1IhyUiRCLh5FzdcHV_-nTHcUQv5wg9On3GTUIV5XiiUwsUjQIv49jrZLCVWvpJ30PAdp-J-z6XO_UxmWXJz8_3Fvur6wRI4NysnbWBLkGK-MKD8osgmXyJt",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBM6qCVXQB4Dnly-GunbiROPHYXXh0h5ldijRkUeCKRng3wI0EBYvHA1wwFTbwaqmRAnVID7Y0JgfrFbjcCcOkCSzqqMHqPH9FDg4UPjXvdDT9EVKx8Ks27SYnwFclY3Ar5wRHGoNXQA8C-1Znn-IfpBW7tgqUKamVkra3U2GYrOeaC82LQcuDnXZqdQdyEiQnrOiU7liUFedIefbxNqvB-8F3mxtDaBNwYx7P8sjdkbemcmrcbfBIYs3dtJVJ-8ukS3isrG7vXxBxm",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCT45wUFD9k3S1TXxFiVOdXKhbqXUzVpVIuQijI5n2L_eELFaD0U22sAhJRm_uO2Ue-zPuxfHZHKv_yy8onso9syNUOTA4wzoIGkZtsToDqyayrva2iyX-fd_xxyErsSbDpfcVHfzb5yAjoEmBZ_ffP6Aes5Vc8Rl4Gbi12yMe8hvNifyUszgl3UrHjOydJaYua_1k5L1wHt7LHTYt1JK19iOoZZg327a7CNisKEbIrnWo-tCV8g1TDdZ89g_LnZlbF5yK8wfEWCg4H"
] as const;

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

type ProductPreviewScreenProps = {
  mode?: BelapopRenderMode;
  product?: EditorialProduct | null;
};

export function ProductPreviewScreen({
  mode = "preview",
  product
}: ProductPreviewScreenProps) {
  const gallery = product?.gallery?.map((item) => item.url).filter(Boolean) ?? [];
  const heroImages = [...gallery, ...sampleGallery].slice(0, 3);
  const cartHref = getBelapopHref(mode, "cart");
  const diagnosticHref = getBelapopHref(mode, "diagnostico");
  const feedbackHref = getBelapopHref(mode, "feedback");
  const productTitle = product?.title ?? "Soro Regenerador Orquidea Imperial";
  const productBrand = product?.brand ?? "Orquidea Imperial";
  const priceLabel = product ? formatCurrency.format(product.price) : "R$ 1.280,00";
  const productReason =
    product?.editorialReason ??
    "Elixir de juventude formulado com tecnologia rara de orquidea para regeneracao celular profunda e acabamento luminoso.";
  const productQuote =
    product?.result?.[0] ??
    "O segredo da regeneracao celular transformado em experiencia sensorial.";
  const productBody =
    product?.result?.slice(0, 2).join(" e ") ??
    "Desenvolvido com extratos moleculares de orquideas raras, este soro redefine o contorno facial e restaura a luminosidade em sete dias de uso continuo.";

  return (
    <LuxuryPreviewFrame activeItem="Skincare" mode={mode}>
      <main className="bg-[#fcf9f8] pt-[72px]">
        <section className="grid grid-cols-1 bg-[#fcf9f8] md:grid-cols-12">
          <div className="grid grid-cols-2 gap-px bg-[#e5e2e1] md:col-span-7">
            <img
              alt="Frasco editorial"
              className="h-72 w-full object-cover sm:h-[440px] lg:h-[560px]"
              src={heroImages[0]}
            />
            <img
              alt="Textura do serum"
              className="h-72 w-full object-cover sm:h-[440px] lg:h-[560px]"
              src={heroImages[1]}
            />
            <img
              alt={productTitle}
              className="col-span-2 h-64 w-full object-cover sm:h-[360px] lg:h-[400px]"
              src={heroImages[2]}
            />
          </div>

          <div className="px-4 py-10 sm:px-6 lg:px-16 lg:py-16 md:col-span-5 md:flex md:items-center">
            <div className="max-w-xl">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#444748]">
                {productBrand}
              </p>
              <h1
                className={`${previewHeadlineFont.className} mt-4 text-4xl font-light leading-tight sm:text-5xl`}
              >
                {productTitle}
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-[#444748]">{productReason}</p>

              <div className="mt-8 space-y-2">
                <p className={`${previewHeadlineFont.className} text-3xl font-light`}>
                  {priceLabel}
                </p>
                <p className="text-sm text-[#444748]">ou 10x sem juros no ritual premium</p>
              </div>

              <div className="mt-8 flex items-start gap-4 border-l-2 border-[#ed93d5] bg-[#f6f3f2] p-5">
                <Sparkles className="mt-1 h-5 w-5 text-[#ed93d5]" />
                <p className="text-[10px] font-semibold uppercase leading-5 tracking-[0.2em]">
                  Curadoria sugerida com base no contexto da jornada exibida pela BelaPop.
                </p>
              </div>

              {mode === "live" && product?.id ? (
                <ProductPreviewPurchaseActions
                  productId={product.id}
                  sellerId={product.sellerId}
                  cartHref={cartHref}
                  diagnosticHref={diagnosticHref}
                />
              ) : (
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    href={cartHref}
                    className="inline-flex min-h-16 items-center justify-center bg-black px-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ef75ce]"
                  >
                    Adicionar a curadoria
                  </Link>
                  <Link
                    href={diagnosticHref}
                    className="text-[11px] font-bold uppercase tracking-[0.22em] underline underline-offset-4 transition-colors hover:text-[#ed93d5]"
                  >
                    Descobrir rotina completa
                  </Link>
                </div>
              )}

              <div className="mt-10">
                <SellerOfRecordCard />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <CurationReasonCard />
            <TrustSignals
              title="O que a BelaPop deixa claro neste produto"
              description="Antes da decisao de compra, a pagina informa seller, prazo estimado, pos-venda, autenticidade e suporte."
            />
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-4 py-14 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div className="order-2 lg:order-1">
              <img
                alt="Ciencia da formula"
                className="h-[420px] w-full object-cover shadow-[0_24px_60px_rgba(0,0,0,0.08)] grayscale-[30%] sm:h-[560px] lg:h-[700px]"
                src={heroImages[0]}
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#ed93d5]">
                A ciencia da beleza
              </p>
              <h2
                className={`${previewHeadlineFont.className} mt-4 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl`}
              >
                Uma obra-prima da regeneracao cutanea
              </h2>
              <div className="mt-8 space-y-6 text-base font-light leading-8 text-[#444748]">
                <p>{productReason}</p>
                <p>{productBody}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-14 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <h2
              className={`${previewHeadlineFont.className} text-center text-3xl font-light sm:text-4xl`}
            >
              O Ritual de Aplicacao
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3 lg:gap-12">
              {ritualSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <article key={step.title} className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center border border-[#e5e2e1]">
                      <Icon className="h-7 w-7 text-black" />
                    </div>
                    <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em]">
                      {step.title}
                    </p>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-[#444748]">
                      {step.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-black px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2
              className={`${previewHeadlineFont.className} text-center text-3xl font-light sm:text-4xl`}
            >
              Sinais considerados na curadoria
            </h2>
            <div className="mt-12 grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              {[
                { value: "Pele", label: "Hidratacao observada no ritual sugerido" },
                { value: "Rotina", label: "Compatibilidade com uso continuo" },
                { value: "Textura", label: "Leitura editorial de acabamento e sensorial" },
                { value: "Suporte", label: "Acompanhamento com seller e pos-venda" }
              ].map((metric) => (
                <article key={metric.label} className="space-y-4">
                  <p
                    className={`${previewHeadlineFont.className} text-5xl font-light text-[#ed93d5]`}
                  >
                    {metric.value}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">
                    {metric.label}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-14 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`${previewHeadlineFont.className} text-4xl font-light`}>
                  The Bela Experience
                </h2>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-[#ed93d5]">
                  {[0, 1, 2, 3, 4].map((item) => (
                    <Star key={item} className="h-5 w-5 fill-current" />
                  ))}
                  <span className="ml-2 text-sm text-black">4.9 / 5.0 (218 Avaliacoes)</span>
                </div>
              </div>
              <Link
                href={feedbackHref}
                className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ef75ce]"
              >
                Escrever avaliacao
              </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {reviews.map((review) => (
                <article
                  key={review.name}
                  className="bg-white p-8 shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
                >
                  <p className="text-sm italic leading-8 text-[#444748]">
                    <span>&ldquo;</span>
                    {review.quote}
                    <span>&rdquo;</span>
                  </p>
                  <div className="mt-8">
                    <p
                      className={`${previewHeadlineFont.className} text-sm uppercase tracking-[0.18em]`}
                    >
                      {review.name}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#747878]">
                      Cliente verificada
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </LuxuryPreviewFrame>
  );
}
