"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { CreditCard, Truck } from "lucide-react";

import { EditorialPreviewFrame } from "@/components/previews/belapop/editorial-preview-frame";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAXov5cSrfxp2wQo_OMAeJEPrGvqv3trO49r0MbtOeUq-5g2gUMh8WvOHGoj_K7CKlVuBpVuuFos5Evq6KM-4DVak45MXB603uuRnSI62sBAzDLcLYRATQY4zHp769Dcb81n-td-QlGB2Xdeky4txxMkTpws7qhpDTz6B3j4Dcur7lt-uDjvArrKq0r5iCtoHSwlc7qkImGOK6J40rD1x8ifjPhpi7PvuHrDu1Ge_78g7uz9bIdAr-EahX9I71Viob6IvGYibbuWpBC";

const ritualProductImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA1d3PIi7736mJnObIEYCJUoiP4bmpq9pCaEAFfBAx23a480EeJKiB41E0-vv8RV6Hy9GumivnK1Ma8Qf_6zZ13cQhOyP2mdHB2Hn-_qF-UOBcFDZDbxOizfMkGd9_GPoiwIf2d2T79xO6k5yKuXBJZYyy0pfNOSVxTju28BP4ayJWYbYczNd0Quc2Xc_4KOya7HYkvbNIi1Uq3NHLLuPykkUxLJCfI-4brER289dhN4kB6WtR6Kjk0BLtMxG8kHxRNTYSfZGzUtYvD";

const collectionImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCT5GZzXmWWAknkinKChmsDe2Ot1ArGEA5EJzKe9wXj747oeIA1uq0suNjUCInPQ7YGISMpmLN67bnVu2a3XdRUQlTDWjj2wO_SA61dDDMzwuFB6M1J9Zu0vm7o4FYmssUwAnQiA2K7tZUlIjxdQeMdJjmTTN5MAXut2Hg8UItOC72k_GMGlTFN628D05nOK6zms0_kIE3LoHtlPmUKjc8E8F84Wv19072iDCZCf1v4rKPUcs2Wd4K6sib6uGJur3dVJNGPHxnzdCP3";

export function OrderConfirmationExperience() {
  return (
    <EditorialPreviewFrame mode="live">
      <div data-belapop-page="order-confirmation-public">
        <main className="min-h-screen pt-20">
          <section className="relative w-full overflow-hidden">
            <div className="h-[340px] w-full sm:h-[420px] lg:h-[614px]">
              <img
                alt="Arranjo editorial de produtos de beleza"
                className="h-full w-full object-cover grayscale-[20%]"
                src={heroImage}
              />
            </div>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-0 left-0 z-10 w-full px-4 sm:px-6 lg:px-10">
              <div className="-mb-16 max-w-2xl bg-[#fcf9f8] p-6 shadow-sm sm:-mb-20 sm:p-8 lg:-mb-24 lg:ml-8 lg:p-12">
                <h1 className="font-editorial text-4xl font-bold leading-none tracking-[-0.06em] sm:text-5xl lg:text-7xl">
                  Sua Curadoria esta a Caminho
                </h1>
                <p className="mt-5 text-base leading-7 text-[#444748] sm:text-lg lg:text-xl">
                  Prepare o seu espaco. A sua nova jornada de autocuidado e o ritual BelaPop
                  comecam em breve. Estamos finalizando cada detalhe com a precisao que sua pele
                  merece.
                </p>
              </div>
            </div>
          </section>

          <div className="h-20 sm:h-24 lg:h-32" />

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:py-24 xl:gap-24">
            <div className="space-y-16 lg:col-span-7 lg:space-y-24">
              <section className="space-y-6">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#ed93d5]">
                  Detalhes do Pedido
                </h2>
                <div className="grid grid-cols-1 gap-6 border-b border-black/10 pb-8 sm:grid-cols-2 sm:gap-8 lg:gap-12 lg:pb-12">
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-[#444748]">
                      Numero
                    </span>
                    <p className="mt-2 text-2xl font-light sm:text-3xl">#BP-882910</p>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-[#444748]">
                      Data
                    </span>
                    <p className="mt-2 text-2xl font-light sm:text-3xl">24. Mar. 2026</p>
                  </div>
                </div>
              </section>

              <section className="space-y-8 sm:space-y-10 lg:space-y-12">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#1c1b1b]">
                  Seu Ritual Escolhido
                </h2>
                <div className="flex flex-col gap-8 bg-[#f6f3f2] p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-12 lg:p-12">
                  <div className="aspect-square w-full bg-white lg:w-1/3">
                    <img
                      alt="Creme de la Mer"
                      className="h-full w-full object-cover"
                      src={ritualProductImage}
                    />
                  </div>
                  <div className="flex-1 space-y-4 text-center lg:text-left">
                    <h3 className="font-editorial text-3xl italic sm:text-4xl">Creme de la Mer</h3>
                    <p className="text-base leading-7 text-[#444748]">
                      O toque final indispensavel. A hidratacao profunda que transforma a textura
                      da pele, revelando um brilho atemporal e sofisticado.
                    </p>
                    <div className="pt-2 sm:pt-4">
                      <span className="text-xl font-bold">R$ 2.450,00</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-8">
                <h2 className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#1c1b1b]">
                  Acompanhe seu Ritual
                </h2>
                <div className="space-y-6 bg-black p-6 text-white sm:p-8 lg:p-12">
                  <p className="text-lg leading-8 text-white/80">
                    Seu pacote esta sendo preparado em nosso atelie com luvas de seda e fragrancias
                    exclusivas.
                  </p>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Link
                      href="/rastreio"
                      className="inline-flex min-h-14 items-center justify-center bg-[#ed93d5] px-8 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-opacity hover:opacity-90 sm:min-h-16"
                    >
                      Rastrear Entrega
                    </Link>
                    <Link
                      href="/rastreio"
                      className="inline-flex min-h-14 items-center justify-center border border-white/20 px-8 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/10 sm:min-h-16"
                    >
                      Detalhes do Envio
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-10 lg:col-span-5 lg:space-y-16">
              <section className="space-y-8 bg-[#e5e2e1] p-6 sm:p-8 lg:p-12">
                <div className="space-y-4">
                  <Truck className="h-10 w-10 text-[#ed93d5]" />
                  <h4 className="font-editorial text-2xl font-bold sm:text-3xl">
                    Endereco de Entrega
                  </h4>
                  <p className="leading-7 text-[#444748]">
                    Avenida Brigadeiro Faria Lima, 3477
                    <br />
                    Itaim Bibi, Sao Paulo - SP
                    <br />
                    04538-133
                  </p>
                </div>

                <div className="space-y-4 border-t border-black/10 pt-8">
                  <h4 className="font-editorial text-2xl font-bold sm:text-3xl">
                    Metodo de Pagamento
                  </h4>
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-5 w-5" />
                    <p>Visa finalizado em **** 9902</p>
                  </div>
                </div>

                <div className="space-y-5 border-t border-black/10 pt-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] uppercase tracking-[0.22em]">Subtotal</span>
                    <span>R$ 2.450,00</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] uppercase tracking-[0.22em]">
                      Frete (Concierge)
                    </span>
                    <span className="font-bold text-[#ed93d5]">GRATIS</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-black/10 pt-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.22em]">
                      Total
                    </span>
                    <span className="font-editorial text-3xl font-bold">R$ 2.450,00</span>
                  </div>
                </div>
              </section>

              <section className="space-y-5 bg-stone-100 p-6 text-center sm:p-8 lg:p-12">
                <h5 className="font-editorial text-xl italic sm:text-2xl">
                  Precisa de assistencia especializada?
                </h5>
                <p className="px-2 text-sm leading-7 text-[#444748]">
                  Nossos curadores de beleza estao disponiveis para orientar seu ritual de
                  aplicacao e responder qualquer duvida.
                </p>
                <Link
                  className="inline-block border-b border-black pb-1 text-[11px] font-bold uppercase tracking-[0.22em]"
                  href="/skinbela/concierge"
                >
                  Fale com um Especialista
                </Link>
              </section>

              <Link href="/skincare" className="group relative block overflow-hidden">
                <img
                  alt="Colecao complementar"
                  className="w-full grayscale transition-all duration-700 group-hover:grayscale-0"
                  src={collectionImage}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="border border-white px-8 py-4 text-[11px] uppercase tracking-[0.24em] text-white">
                    Ver Colecao
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </EditorialPreviewFrame>
  );
}
