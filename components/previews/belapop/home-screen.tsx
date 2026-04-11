/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import {
  previewHeadlineFont,
  previewPrimaryButtonClass,
  previewSecondaryButtonClass
} from "./luxury-preview-theme";
import {
  getBelapopHref,
  getBelapopProductHref,
  type BelapopRenderMode
} from "./routes";

const products = [
  {
    brand: "LA MER",
    name: "Creme de la Mer - Hidratacao Profunda",
    price: "R$ 2.450,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD96gotqBFx_yo0h4yJZ5OK6V4VeYWFrzWhPSQBfV2BmWW88MGLxeRzWJ4-4hBGcPLPwH3KncNxDrLNNSGVNbdeXHFAW1sVkEuRpErhYuKF-e3_uwR8j91L2KgbzEVu6WjoOP5g_4_zTRvUusAnAkv2YdhXzG-n9eroC94OF9U9o8YK8eIog4YjigOK4N1h8m48LVM6HGXl0CfHpOfyQ1-UXkSwKZS472oCRp5-WUm4mlIpCGcRwvi43fSZ-ljn2l-f0qTe_t1yGH01"
  },
  {
    brand: "CHANEL",
    name: "No.5 L'Eau - Eau de Toilette Spray",
    price: "R$ 980,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxHbyk1nlVWNidBesO86qyn0Cu3Zkzj5foUBBTCSuWx2i_0aPwJV6DKItJSQUDPdC5r9UsEDzcmKgwKWPlW8FHqH5rFmDcHHmDBFrQhnP_SY51VNjCUJ-Q-tUAIScbcefzpRCVfF0GsiRQm1582lh261F0iXJmOEpyodMkabAuDGrIEK4yrAiOQ4S9rNkfLvQ8k9C4KL7bF4Q-adUtrx90F3YMz_mQQilSxudld-vdI50dsar9eXpRpJVX21-cr3zr4TRL1ykkl8Qq"
  },
  {
    brand: "DIOR",
    name: "Capture Totale - Soro Firmador",
    price: "R$ 840,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBib2IdKz-Lk2zywsIty000iUBgxRJVPxjhEN0jW84llYhI8SicphsP71hbbnTPq4DuaXyy0n323hO4xEwDUgNtfWJ3VkFaXgN9c5Y1LcDSTwhYPtgQZI2EzqVUBwbvayinZW2cMOUTlbEeeMbTDeOXIdh2u9hQu6uii1tPozTTXKl5kLHewtST0AG-6J2RaZH9PIevbqFnyoeISbhf0HMVku5QlfFWNhv7d-LKlMp5ui7ttJj2BLKtcqIHCrcZtXVsEaXQwKTskbXS"
  }
];

const diaryMainImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDfKssavQgXWVJGMuXtF2tsXOA1QNybmSpcx2YgImEOWaI5EPCyUZopTblVaoKFEtwOTivIGkJFX5OE1FWqhgU94MwErattaSx7PvwQn2js7qAtTgPpsNNIYoi_dU45_fVE65KowqtFqLRColX_l1Q35s_f0CTrynv-L2-Z1NwzXgnqRjXmebr1qp3fyGpO0aMnbC0sAkYVu3-v_Dyd9q6PqvGVrmgrwiJOhMKB6UZ-J-pEE9Yi07adsLPSmxGUT5wQ8b24FSvAl0rg";

const diaryFeatureImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBnCaCxumv66cNiXxJeCDTmLxTjP9TSghRJD0i8pBRrHlUA_08tn990xVShgXuEdGFz_Vh0PrcBLus6QGTOLVr6WSmzNtAINZ994aVcPQjHbv52XNHsmlyRPXbkXeBNv5vEQRVQB45JeW43D_Litgx7M6AXTv8_GXLe7NRpjwuhXz6WdpPTvaUSKeeU6PmRi7E_xWqjthIf7UYKTCINyOGzJEfLmkGOBpBT5IdCjXu-Xdy45Vp4zK7KfosvLGfuNJIDVEk2E93HoPQ8";

type HomePreviewScreenProps = {
  mode?: BelapopRenderMode;
  featuredProductHref?: string;
  spotlightHref?: string;
  curationHrefs?: string[];
};

export function HomePreviewScreen({
  mode = "preview",
  featuredProductHref,
  spotlightHref,
  curationHrefs
}: HomePreviewScreenProps) {
  const primaryProductHref = featuredProductHref ?? getBelapopProductHref(mode);
  const spotlightProductHref = spotlightHref ?? primaryProductHref;
  const productCardHrefs = curationHrefs ?? products.map(() => primaryProductHref);

  return (
    <LuxuryPreviewFrame activeItem="Skincare" mode={mode}>
      <main className="pt-[72px]">
        <section className="relative isolate overflow-hidden bg-[#1c1b1b]">
          <video
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
            loop
            muted
            playsInline
            poster="/editorial/home-hero-loop.gif"
            preload="auto"
          >
            <source src="/editorial/home-hero-loop-4k.webm" type="video/webm" />
            <source src="/editorial/home-hero-loop-4k.mp4" type="video/mp4" />
            <img
              alt="Close up of skin textures"
              className="absolute inset-0 h-full w-full object-cover"
              src="/editorial/home-hero-loop.gif"
            />
          </video>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute -left-12 bottom-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-[#dac769]/15 blur-3xl" />

          <div className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-end px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:items-center lg:py-24">
            <div className="max-w-xl">
              <span className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.32em] text-white/80">
                Essence Winter 2026
              </span>
              <h1 className={`${previewHeadlineFont.className} text-5xl font-bold leading-[0.92] tracking-[-0.05em] text-white sm:text-6xl lg:text-8xl`}>
                Redescubra
                <br />
                sua pele.
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-white/90 sm:text-lg">
                Uma abordagem consciente para a beleza que celebra a textura natural e o brilho autentico.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryProductHref}
                  className="inline-flex min-h-14 items-center justify-center bg-white px-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-black transition-colors hover:bg-[#dac769] sm:min-h-16"
                >
                  Ver colecao
                </Link>
                <Link
                  href={getBelapopHref(mode, "scan")}
                  className="inline-flex min-h-14 items-center justify-center border border-white/20 bg-black/20 px-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/10 sm:min-h-16"
                >
                  Fazer scan
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="scan" className="bg-[#fcf9f8] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto max-w-3xl">
              <h2 className={`${previewHeadlineFont.className} text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl`}>
                Analise Facial por Inteligencia Artificial
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#444748] sm:text-xl">
                Nossa tecnologia exclusiva analisa as necessidades unicas da sua pele em segundos e recomenda uma rotina personalizada de alta performance.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-2xl overflow-hidden bg-[#f6f3f2] shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
              <img
                alt="Portrait focusing on skin texture"
                className="aspect-[4/5] w-full object-cover"
                src="/editorial/home-ai-card.jpg"
              />
            </div>

            <div className="mt-8">
              <Link
                href={getBelapopHref(mode, "scan")}
                className={`${previewPrimaryButtonClass} px-8 sm:px-14`}
              >
                Iniciar scan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#f6f3f2] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:items-center">
            <div className="order-2 lg:order-1 lg:col-span-5 lg:pr-10">
              <span className="block text-[10px] font-bold uppercase tracking-[0.5em] text-[#6c5e06]">
                Top seller da semana
              </span>
              <h2 className={`${previewHeadlineFont.className} mt-5 text-4xl leading-[0.95] tracking-[-0.05em] text-[#1c1b1b] sm:text-5xl lg:text-6xl`}>
                Soro Regenerador
                <br />
                Orquidea Imperial
              </h2>
              <div className="mt-6 h-px w-24 bg-[#6c5e06]" />
              <p className={`${previewHeadlineFont.className} mt-8 text-2xl italic leading-relaxed text-[#444748]`}>
                <span>&ldquo;</span>
                O segredo da regeneracao celular transformado em experiencia sensorial.
                <span>&rdquo;</span>
              </p>
              <p className="mt-6 max-w-md text-sm leading-8 text-[#444748] sm:text-base">
                Desenvolvido com extratos moleculares de orquideas raras, este soro redefine o contorno facial e restaura a luminosidade em sete dias de uso continuo.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                <Link
                  href={spotlightProductHref}
                  className={`${previewPrimaryButtonClass} hover:bg-[#6c5e06]`}
                >
                  Comprar agora
                </Link>
                <span className={`${previewHeadlineFont.className} text-2xl`}>R$ 1.280,00</span>
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-7">
              <div className="relative mx-auto max-w-2xl">
                <div className="overflow-hidden bg-white shadow-[0_30px_80px_rgba(0,0,0,0.14)]">
                  <img
                    alt="Luxury skincare serum bottle in a minimalist marble setting"
                    className="aspect-[4/5] w-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAELPiY0PPK7707M_jedsr37glSJgndoUJEjAqypBaCkcCar-rSm0Mx8CfUxyi2fYbExegdp39FFzNvXH0m61k70z_CCTElcKxSheZAe9oYjidxFzNWN_TnIqmovi0SWbk9kAjQOgm6HAdETOxBWMgPeHPp_2hUjtpitE0P16oMZR9uicTcERU1dsBUp4S6IR5X7vc6YDj4tr7mFpt2k1hO0l57KILXQPF9XvO-EFqad0nUWyHACIV-I_XrhyX5QTfyvJdo2D8ajHA8"
                  />
                </div>
                <div className="pointer-events-none absolute right-[-24px] top-10 hidden rotate-90 xl:block">
                  <span className="text-[72px] font-extrabold uppercase tracking-[-0.05em] text-black/5">
                    Premium Elixir
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#444748]">The Selection</span>
                <h3 className={`${previewHeadlineFont.className} mt-3 text-4xl`}>Curadoria de Luxo</h3>
              </div>
              <Link
                href={primaryProductHref}
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black underline underline-offset-4"
              >
                Ver tudo
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {products.map((product, index) => (
                <Link
                  key={product.name}
                  href={productCardHrefs[index] ?? primaryProductHref}
                  className="group block"
                >
                  <div className="overflow-hidden bg-[#f6f3f2]">
                    <img
                      alt={product.name}
                      className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      src={product.image}
                    />
                  </div>
                  <h4 className="mt-5 text-xs font-bold tracking-[0.2em]">{product.brand}</h4>
                  <p className="mt-2 text-sm leading-7 text-[#444748]">{product.name}</p>
                  <span className="mt-4 block text-sm font-bold text-[#1c1b1b]">{product.price}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col items-start gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.24em] text-[#444748]">
                  Editorial BelaPop
                </span>
                <h3 className={`${previewHeadlineFont.className} mt-3 text-4xl tracking-[-0.04em] sm:text-5xl`}>
                  Diario BelaPop
                </h3>
              </div>
              <Link
                href="/diario"
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black underline underline-offset-4"
              >
                Ver tudo
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
              <article className="overflow-hidden bg-white md:col-span-7">
                <div className="flex h-full flex-col justify-between p-6 sm:p-8 lg:p-12">
                  <div>
                    <span className="mb-5 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
                      Artigo Principal
                    </span>
                    <h4 className={`${previewHeadlineFont.className} text-3xl leading-tight tracking-[-0.04em] sm:text-4xl`}>
                      A Ciencia por tras das Orquideas Imperiais.
                    </h4>
                    <p className="mt-6 max-w-2xl text-sm leading-8 text-[#444748] sm:text-base">
                      Exploramos as florestas tropicais para entender como a longevidade destas
                      flores pode ser traduzida para o rejuvenescimento da pele madura.
                    </p>
                  </div>

                  <div className="mt-8 overflow-hidden">
                    <img
                      alt="Close up of a rare white orchid"
                      className="h-64 w-full object-cover grayscale sm:h-72 lg:h-80"
                      src={diaryMainImage}
                    />
                  </div>

                  <div className="mt-8">
                    <Link
                      href="/diario"
                      className={`${previewSecondaryButtonClass} border-black px-6 hover:bg-black hover:text-white`}
                    >
                      Ler artigo
                    </Link>
                  </div>
                </div>
              </article>

              <div className="flex flex-col gap-6 md:col-span-5 lg:gap-8">
                <article className="flex-1 bg-black p-6 text-white sm:p-8 lg:p-12">
                  <span className="mb-4 block text-[10px] uppercase tracking-[0.24em] text-white/55">
                    Tendencias
                  </span>
                  <h4 className={`${previewHeadlineFont.className} text-2xl leading-tight sm:text-3xl`}>
                    Inverno 2026: o retorno do brilho natural.
                  </h4>
                  <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
                    Texturas leves, acabamento luminoso e uma pele que parece pele. O luxo agora
                    respira mais.
                  </p>
                  <Link
                    href="/diario"
                    className="mt-8 inline-flex min-h-14 items-center justify-center border border-white/20 px-6 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:bg-white/10 sm:min-h-16"
                  >
                    Ler mais
                  </Link>
                </article>

                <Link href="/diario" className="group relative block min-h-[320px] overflow-hidden">
                  <img
                    alt="Model with elegant makeup and jewelry"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    src={diaryFeatureImage}
                  />
                  <div className="absolute inset-0 bg-black/45" />
                  <div className="relative flex h-full items-end p-6 sm:p-8 lg:p-10">
                    <div>
                      <span className="mb-4 block text-[10px] uppercase tracking-[0.24em] text-white/70">
                        Entrevista
                      </span>
                      <h4 className={`${previewHeadlineFont.className} max-w-sm text-2xl leading-tight text-white sm:text-3xl`}>
                        O ritual noturno de Sofia Loren.
                      </h4>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </LuxuryPreviewFrame>
  );
}
