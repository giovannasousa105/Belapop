/* eslint-disable react-hooks/static-components */
/* eslint-disable @next/next/no-img-element */

import {
  Bot,
  Download,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import { previewHeadlineFont } from "./luxury-preview-theme";
import {
  getBelapopHref,
  getBelapopProductHref,
  type BelapopRenderMode
} from "./routes";

type BiometricMetric = {
  label: string;
  value: string;
  qualifier: string;
  width: string;
  accent?: boolean;
};

type CuratedProduct = {
  brand: string;
  name: string;
  price: string;
  image: string;
  badge?: string;
};

const biometricMetrics: BiometricMetric[] = [
  { label: "Hidratacao", value: "84%", qualifier: "Alta", width: "84%", accent: true },
  { label: "Poros", value: "Minimos", qualifier: "Otimizados", width: "15%" },
  { label: "Sensibilidade", value: "Baixa", qualifier: "Estavel", width: "20%" },
  { label: "Textura", value: "Suave", qualifier: "Radiante", width: "92%", accent: true }
] as const;

const curatedProducts: CuratedProduct[] = [
  {
    brand: "LA MER",
    name: "Creme de la Mer - Hidratante Iconico",
    price: "R$ 2.450,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBOoeQJFNSOkAW3Cq0WnoBOyIG5vLEUD2W9z-owLVl8_L_7n7IswDtaOQOo39vEeaD0sqKF7TclXUcNmNy2HdQBt_7FdEirq7JTfFPqUme7ORGjZgbtk_iAiykH6li1VYERJbJiAaUEqcVKnzelKe1WM9h2zOgNoxND9sABkHteux5A6TLijXEhMeQVu8nZ3AwCuX1OXjuLyDfFNoyxb1UBlxb8DNvcZJzX8G2mPSUbfX9xSljXiPZgheo2jp5Po23ueMNTpum5Wl3J",
    badge: "Escolha IA"
  },
  {
    brand: "CHANEL",
    name: "Hydra Beauty Micro Serum",
    price: "R$ 890,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAkPSPvhW1sBuGfYdUMIElLuh8bkt3zONeqZBUVuS9owpMjzB48suyVWXBa6PsdYOlJqYcv2LRpiRSaiPSXg3s-vbZzksJXir6GndDxfb_Rsd7_waQ7mExCdLUmTrnL-tv20chreospOXbmHnIc-qluRCvqwnnhkXfQbR-Dq52volsm8t41GolokgwI1nYLdwQNkAw4CgjVR6YVL2Cs71FlSJN87BV_d9Mp_wTvR33G9QqzgKf-lHdHAu1cVa-FkXbRM1iGVpucGhW9"
  },
  {
    brand: "DIOR",
    name: "Capture Totale Super Potent Serum",
    price: "R$ 1.120,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBoTOIuhua06aYc68OaPCjZHv13j9zKU_afOzcMkzqoZ0o8QZCotrXZd-QfvkCY-pyj23Bpw8MVg325KArtZ-_IZ0XsEFc8oxOhPc53SGnKcyrKPxLv-IaoljYmVK3eHQ1PW5tiAicb79WrKRns3kxu-qdIck_y0y0JxnoenhZU3wUWN6RRUgT0pdAGeougWJXgzDx_TzFBnRTUHZT2vc0Pg5yX5aZSc7wPD5xPbj_1gFzGvos-G1Ut-9hSLVkKf1ypOk9lKoowZDee"
  }
] as const;

type DiagnosticPreviewScreenProps = {
  mode?: BelapopRenderMode;
  embedInPage?: boolean;
};

export function DiagnosticPreviewScreen({
  mode = "preview",
  embedInPage = false
}: DiagnosticPreviewScreenProps) {
  const Wrapper = ({
    children
  }: {
    children: ReactNode;
  }) =>
    embedInPage ? (
      <>{children}</>
    ) : (
      <LuxuryPreviewFrame activeItem="Skin Scan Bela" mode={mode}>
        {children}
      </LuxuryPreviewFrame>
    );

  return (
    <Wrapper>
      <div className={`bg-[#fcf9f8] ${embedInPage ? "" : "pt-[72px]"}`}>
        <section className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
          <header className="mb-10 sm:mb-12 lg:mb-16">
            <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-[#ef75ce]">
              Relatorio de Diagnostico IA
            </p>
            <h1
              className={`${previewHeadlineFont.className} text-4xl font-black leading-[0.92] tracking-[-0.05em] sm:text-5xl lg:text-7xl`}
            >
              DIAGNOSTICO
              <br />
              <span className="italic uppercase text-[#ef75ce]">
                Exclusivo <span className="normal-case">BelaPop</span>
              </span>
            </h1>
          </header>

          <div className="min-w-0">
              <section className="mb-8 overflow-hidden bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:mb-12">
                <div className="flex flex-col xl:flex-row">
                  <div className="relative xl:w-1/2">
                    <div className="aspect-[4/5] bg-[#f0eded]">
                      <img
                        alt="high-fashion editorial portrait of a woman with glowing clear skin, ethereal lighting, minimalist background, diagnostic digital overlays subtle"
                        className="h-full w-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYVol3XJrKccjU4GSLRXVyVMtWrZK6hYlsGx05e1VyFT9CelEcbTk2JbDqxYuJ4NrKVpJHetf0U0PtEXGOmv01JIXdq6CWoO9OsFFJeGa7DdWqs_j7kcftNqy8xJLrWDrTctl1iQoSXrRMmFjl5Eu3zRA_N8xzVDZrlkgPePQN6u7AL95UjaIAUiQuIQf36kP4sGl0yLBKkNes_0qD8FCeSbPyQKcW5YpyhZvy2zHTqtcrZsZ4tK9XrZ6ADUPkegs87Tz2YYYhjav4"
                      />
                    </div>
                    <div className="absolute left-4 top-4 bg-black/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-md sm:left-6 sm:top-6">
                      ID Biometrico: BP-99281
                    </div>
                  </div>

                  <div className="xl:w-1/2 p-6 sm:p-8 lg:p-12 xl:p-16">
                    <h2
                      className={`${previewHeadlineFont.className} mb-8 text-2xl font-light uppercase tracking-[0.1em] sm:mb-10 sm:text-3xl`}
                    >
                      SEU PERFIL
                      <br />
                      BIOMETRICO
                    </h2>

                    <div className="space-y-8 sm:space-y-10">
                      {biometricMetrics.map((metric) => (
                        <div key={metric.label}>
                          <div className="mb-3 flex items-end justify-between gap-4">
                            <span className="text-[11px] uppercase tracking-[0.24em] text-[#747878]">
                              {metric.label}
                            </span>
                            <span
                              className={`${previewHeadlineFont.className} text-right text-xl font-bold sm:text-2xl ${
                                metric.accent ? "text-[#ef75ce]" : "text-black"
                              }`}
                            >
                              {metric.value}{" "}
                              <span className="ml-1 text-[10px] font-body font-normal uppercase text-black sm:text-xs">
                                {metric.qualifier}
                              </span>
                            </span>
                          </div>
                          <div className="h-[2px] w-full bg-[#eae7e7]">
                            <div
                              className={`h-full ${metric.accent ? "bg-[#ef75ce]" : "bg-black"}`}
                              style={{ width: metric.width }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="mt-10 inline-flex min-h-16 w-full items-center justify-center gap-3 bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-black/88 sm:mt-14 sm:w-auto sm:px-8">
                      Baixar Relatorio Completo
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>

              <section className="relative mb-14 overflow-hidden border-l-4 border-l-[#ef75ce] bg-black p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:p-8 lg:mb-16 lg:p-12">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#ef75ce]/10 blur-3xl" />
                <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div className="flex justify-center sm:block">
                      <div className="relative flex h-12 w-12 items-center justify-center">
                        <span className="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-[#ef75ce]/20" />
                        <span className="relative inline-flex h-4 w-4 rounded-full bg-[#ef75ce] shadow-[0_0_14px_rgba(239,117,206,0.45)]" />
                      </div>
                    </div>

                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <Bot className="h-7 w-7 text-[#ef75ce]" />
                        <h3
                          className={`${previewHeadlineFont.className} text-xl font-black uppercase tracking-[0.14em] sm:text-2xl`}
                        >
                          SkinBela assistant
                        </h3>
                      </div>
                      <p className="max-w-4xl text-sm leading-7 text-gray-300 sm:text-[15px]">
                        <strong className="font-semibold text-white">
                          Conversa guiada pela sua pele.
                        </strong>{" "}
                        O SkinBela responde com base no seu perfil, Skin Twin e em uma base
                        priorizada por evidencia dermatologica. Quando houver fonte disponivel,
                        ele prioriza revisoes sistematicas, meta-analises, ensaios randomizados e
                        diretrizes com preferencia por{" "}
                        <span className="italic text-[#ef75ce]">
                          Cochrane, AAD, UpToDate, DynaMed, JAMA Dermatology, PubMed
                        </span>{" "}
                        e fontes brasileiras ou latino-americanas.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={getBelapopHref(mode, "concierge")}
                    className="inline-flex min-h-14 w-full items-center justify-center border border-[#ef75ce] px-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ef75ce] transition-all hover:bg-[#ef75ce] hover:text-white md:w-auto"
                  >
                    Iniciar Concierge IA
                  </Link>
                </div>
              </section>
          </div>

          <section>
            <div className="mb-8 flex flex-col gap-5 sm:mb-10 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2
                  className={`${previewHeadlineFont.className} text-3xl font-light uppercase tracking-[0.1em] sm:text-4xl lg:text-5xl`}
                >
                  CURADORIA
                  <br />
                  <span className="italic text-[#ef75ce]">EXCLUSIVA PARA VOCE</span>
                </h2>
              </div>
              <Link
                href="/vitrine"
                className="inline-flex self-start border-b border-black pb-1 text-[11px] uppercase tracking-[0.24em] transition-colors hover:border-[#ef75ce] hover:text-[#ef75ce]"
              >
                Ver toda a recomendacao
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {curatedProducts.map((product) => (
                <article key={product.name} className="flex flex-col">
                  <div className="group relative mb-5 overflow-hidden bg-[#f6f3f2] shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                    <div className="aspect-[3/4]">
                      <img
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src={product.image}
                      />
                    </div>
                    {product.badge ? (
                      <div className="absolute right-4 top-4 bg-[#ef75ce] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white">
                        {product.badge}
                      </div>
                    ) : null}
                  </div>
                  <span className={`${previewHeadlineFont.className} mb-1 text-xs font-bold uppercase tracking-[0.24em]`}>
                    {product.brand}
                  </span>
                  <h3 className="mb-3 text-lg leading-7">{product.name}</h3>
                  <p className={`${previewHeadlineFont.className} mb-5 text-2xl font-bold`}>
                    {product.price}
                  </p>
                  <Link
                    href={getBelapopProductHref(mode)}
                    className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-[#ef75ce]"
                  >
                    Comprar
                    <ShoppingBag className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </Wrapper>
  );
}
