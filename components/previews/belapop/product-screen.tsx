/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";

import { CommerceAssuranceStrip } from "@/components/commerce/EditorialCommercePrimitives";
import { CurationReasonCard } from "@/components/legal/CurationReasonCard";
import { SellerOfRecordCard } from "@/components/legal/SellerOfRecordCard";
import { TrustSignals } from "@/components/legal/TrustSignals";
import type { EditorialProduct } from "@/lib/queries/products";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import { ProductPreviewPurchaseActions } from "./product-purchase-actions";
import {
  previewEyebrowClass,
  previewHeadlineFont,
  previewPrimaryButtonClass,
  previewSecondaryButtonClass
} from "./luxury-preview-theme";
import { getBelapopHref, type BelapopRenderMode } from "./routes";

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
  const productTitle = product?.title ?? "Soro Regenerador Orquidea Imperial";
  const productBrand = product?.brand ?? "Orquidea Imperial";
  const priceLabel = product ? formatCurrency.format(product.price) : "R$ 1.280,00";
  const heroReason =
    product?.editorialReason ??
    "Formula escolhida para rotinas que pedem textura consistente, aplicacao confortavel e leitura clara de cuidado.";
  const textureLabel = product?.texture ?? "Textura rica";
  const ritualLabel = product?.ritual ?? "Ritual noturno";
  const badgeLabel = product?.badge ?? "Curadoria BelaPop";
  const sensationList =
    product?.sensation?.slice(0, 3) ?? ["Sensorial elegante", "Toque uniforme", "Camada confortavel"];
  const resultList =
    product?.result?.slice(0, 3) ?? ["Suporte para rotina de hidratacao", "Uso continuo", "Acabamento luminoso"];
  const howToUse =
    product?.howToUse?.slice(0, 3) ?? [
      "Aplique sobre pele limpa e seca.",
      "Distribua em movimentos suaves do centro para fora.",
      "Finalize com pressao leve para acomodar a formula."
    ];

  const purchaseFacts = [
    "Vendido por BelaPop.",
    "Prazo estimado informado apos confirmacao do pagamento.",
    "Pedido sujeito a validacao antifraude e disponibilidade operacional.",
    "Politica de reembolso e devolucao acessivel antes da compra."
  ];

  return (
    <LuxuryPreviewFrame activeItem="Skincare" mode={mode}>
      <main className="bg-[#fcf9f8] pt-[72px]">
        <section className="border-b border-black/6 bg-[#fcf9f8]">
          <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <nav className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#747878]">
              <Link href="/" className="transition-colors hover:text-black">
                Inicio
              </Link>
              <span>/</span>
              <Link href="/skincare" className="transition-colors hover:text-black">
                Skincare
              </Link>
              <span>/</span>
              <span className="text-black">{productTitle}</span>
            </nav>

            <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-14">
              <section className="space-y-4 lg:col-span-7">
                <div className="overflow-hidden bg-[#f1ece8]">
                  <img
                    alt={productTitle}
                    className="aspect-[4/5] w-full object-cover sm:aspect-[4/4.3] lg:aspect-[4/3]"
                    src={heroImages[0]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {heroImages.slice(1).map((image, index) => (
                    <div key={image} className="overflow-hidden bg-[#f1ece8]">
                      <img
                        alt={`${productTitle} detalhe ${index + 1}`}
                        className="aspect-square w-full object-cover transition-transform duration-700 hover:scale-105"
                        src={image}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <aside className="lg:col-span-5 lg:pt-4">
                <div className="rounded-[34px] border border-black/8 bg-white p-6 shadow-[0_24px_60px_rgba(36,31,32,0.05)] sm:p-8 lg:sticky lg:top-28 lg:p-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-black/10 bg-[#f6f3f2] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5b5051]">
                      {badgeLabel}
                    </span>
                    <span className="rounded-full border border-[#ecd8dc] bg-[#fcf4f5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c5d66]">
                      Produto original
                    </span>
                  </div>

                  <p className={`${previewEyebrowClass} mt-6`}>{productBrand}</p>
                  <h1
                    className={`${previewHeadlineFont.className} mt-3 text-[2.65rem] leading-[0.96] text-black sm:text-[3.35rem]`}
                  >
                    {productTitle}
                  </h1>

                  <p className="mt-5 text-base leading-7 text-[#51494a] sm:text-lg sm:leading-8">
                    {heroReason}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <InfoPill label="Textura" value={textureLabel} />
                    <InfoPill label="Ritual" value={ritualLabel} />
                    <InfoPill label="Categoria" value={product?.category ?? "Tratamento"} />
                  </div>

                  <div className="mt-8 border-t border-black/8 pt-8">
                    <p className={`${previewHeadlineFont.className} text-4xl text-black sm:text-5xl`}>
                      {priceLabel}
                    </p>
                    <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[#747878]">
                      Ate 10x sem juros no ambiente de pagamento disponivel
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
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Link href={cartHref} className={`${previewPrimaryButtonClass} w-full sm:flex-1`}>
                        Adicionar a bolsa
                      </Link>
                      <Link href={diagnosticHref} className={`${previewSecondaryButtonClass} w-full sm:w-auto`}>
                        Ver rotina sugerida
                      </Link>
                    </div>
                  )}

                  <div className="mt-8 rounded-[28px] border border-[#ebe1e2] bg-[#fcf7f7] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c5d66]">
                      Informacoes objetivas
                    </p>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-[#51494a]">
                      {purchaseFacts.map((fact) => (
                        <li key={fact} className="flex gap-3">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8c5d66]" />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-screen-2xl gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="overflow-hidden rounded-[34px] border border-black/8 bg-white lg:col-span-7">
              <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8c5d66]">
                    BelaPop match
                  </p>
                  <h2 className="mt-3 font-display text-4xl leading-[0.96] text-black sm:text-[3.15rem]">
                    Leitura editorial para sua rotina
                  </h2>
                  <p className="mt-5 text-sm leading-7 text-[#51494a] sm:text-base">
                    A recomendacao se apoia na textura da formula, no contexto de uso e na coerencia
                    com jornadas de cuidado apresentadas pela BelaPop. Nao ha promessa de resultado
                    individual nem substituicao de orientacao medica.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <MetricCard
                      label="Textura e sensorial"
                      value={textureLabel}
                      body="Formula com leitura alinhada a rotinas que pedem conforto e acabamento uniforme."
                    />
                    <MetricCard
                      label="Direcao de uso"
                      value={ritualLabel}
                      body="Encaixe editorial pensado para o momento da rotina em que o produto faz mais sentido."
                    />
                  </div>
                </div>

                <div className="overflow-hidden bg-[#f1ece8]">
                  <img
                    alt={`Visual editorial de ${productTitle}`}
                    className="h-full min-h-[280px] w-full object-cover grayscale-[6%]"
                    src={heroImages[1] ?? heroImages[0]}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-5">
              <SellerOfRecordCard className="h-full" />
              <CurationReasonCard />
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-screen-2xl">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8c5d66]">
                Detalhes do produto
              </p>
              <h2 className="mt-3 font-display text-4xl leading-[0.98] text-black sm:text-[3.2rem]">
                O que observar antes de comprar
              </h2>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <section className="rounded-[32px] border border-black/8 bg-white p-6 sm:p-8">
                <h3 className="font-display text-3xl text-black">Sensacoes e acabamento</h3>
                <ul className="mt-6 space-y-3 text-sm leading-7 text-[#51494a]">
                  {sensationList.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[32px] border border-black/8 bg-[#f6f3f2] p-6 sm:p-8">
                <h3 className="font-display text-3xl text-black">Contexto de uso</h3>
                <ul className="mt-6 space-y-3 text-sm leading-7 text-[#51494a]">
                  {resultList.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[32px] border border-black/8 bg-white p-6 sm:p-8">
                <h3 className="font-display text-3xl text-black">Modo de uso</h3>
                <ol className="mt-6 space-y-4">
                  {howToUse.map((item, index) => (
                    <li key={item} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b5051]">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-7 text-[#51494a]">{item}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-screen-2xl">
            <CommerceAssuranceStrip
              title="O que a BelaPop deixa claro nesta pagina"
              description="Seller, pagamento, prazo, pos-venda e suporte aparecem de forma concreta antes da decisao de compra."
            />

            <TrustSignals
              className="mt-6"
              title="Confianca operacional para a compra"
              description="Os sinais abaixo reforcam o que o cliente encontra nesta jornada: seller identificado, politica visivel, suporte e pos-venda rastreavel."
            />
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24">
          <div className="mx-auto flex max-w-screen-2xl flex-col gap-6 rounded-[36px] border border-black/8 bg-black px-6 py-8 text-white sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/60">
                BelaPop Skin Scan
              </p>
              <h2 className="mt-3 font-display text-4xl leading-[0.96] sm:text-[3.2rem]">
                Quer comparar com a sua rotina atual?
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
                O Skin Scan ajuda a cruzar foco de cuidado, contexto de uso e curadoria. O resultado
                nao substitui avaliacao clinica.
              </p>
            </div>

            <Link href={diagnosticHref} className={`${previewPrimaryButtonClass} bg-white text-black hover:bg-[#f3dde3]`}>
              Abrir diagnostico
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </LuxuryPreviewFrame>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-black/8 bg-[#fcf9f8] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7e6f72]">{label}</p>
      <p className="mt-1 text-sm font-medium text-black">{value}</p>
    </div>
  );
}

function MetricCard({
  body,
  label,
  value
}: {
  body: string;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[24px] border border-black/8 bg-[#fcf9f8] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#7e6f72]">
        {label}
      </p>
      <p className="mt-3 font-display text-[1.75rem] leading-[0.96] text-black">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[#51494a]">{body}</p>
    </article>
  );
}
