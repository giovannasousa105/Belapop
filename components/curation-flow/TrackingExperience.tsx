"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { MessageSquare, Search, Sparkles, Truck } from "lucide-react";

import { EditorialPreviewFrame } from "@/components/previews/belapop/editorial-preview-frame";

type TimelineStep = {
  active?: boolean;
  complete?: boolean;
  label: string;
};

const timelineSteps: TimelineStep[] = [
  { label: "Pedido Recebido", complete: true },
  { label: "No Atelie", complete: true },
  { label: "Em Transito", active: true },
  { label: "Saiu para Entrega" },
  { label: "Ritual Entregue" }
];

const heroProduct =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBSZbcsoRwtGZma1xtPnfazg5G6zub6oDp4T0CgeneN_tIpzSbCd1RuJnDge-KjNtq0SnTVARNcdVZvu3aZNDiKgKub1mR3jaBJZ-aZlVpDCK2xfYZps5fFHu_ffFim6L3agVcpgKOpy3HYXKdN0BDzWPX0SgKjOWvjLEfnEd9-Jd8aLjWl37jY-AAnD8QRf_zVaPOEGmekVRMo6llKZMA85omOSPgJNpzgUeB83XITHQyshgfsnxKas7KZ92_0y0yZIdadFzkewyl8";

const supportProduct =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAs4ENUUEpry-Q0eVRqe2OtjDFxasfzRMrbyUjsMYde3nEsa57ojPsAwMMQbLoVtB0r_olMJ-tj1WGn7vJRIbOoGVptBncqD07egKWxFEuLCeJSPyi8IKyK1vKC4dgpQBWCdi8GVn3NGGJmmle_go9oE-HczbnHvaqiVGDxZIxhuJEen8unlNKa9VRqjl9ZZE4XQDdf5zbXxIz_Pt6cPOyy3LtdAu72K4KXM2EPfN37QzcKNgjHevRxxV4OINflp9Ye37Xq6JV-YERT";

export function TrackingExperience() {
  return (
    <EditorialPreviewFrame mode="live">
      <div data-belapop-page="tracking-public">
        <main className="min-h-screen px-4 pb-28 pt-[104px] sm:px-6 lg:px-12 lg:pb-24 lg:pt-28">
          <header className="mx-auto mb-12 max-w-4xl lg:mb-16">
            <p className="mb-4 font-editorial text-sm italic tracking-[0.3em] text-[#444748]">
              Leticia, aproveite seu ritual de autocuidado.
            </p>
            <h1 className="font-editorial text-4xl font-bold leading-tight tracking-[-0.06em] sm:text-5xl lg:text-7xl">
              Sua Curadoria esta a Caminho
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#444748] sm:text-lg">
              Cada detalhe do seu pedido #BP-88291 esta sendo cuidado pela nossa equipe do Atelie
              para garantir que seu ritual seja impecavel.
            </p>
          </header>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-10 lg:col-span-8 lg:space-y-12">
              <section className="bg-[#f6f3f2] p-6 sm:p-8 lg:p-12">
                <div className="hidden md:block">
                  <div className="relative flex items-start justify-between">
                    <div className="absolute left-0 top-4 h-px w-full bg-[#c4c7c7]" />
                    <div className="absolute left-0 top-4 h-px w-1/2 bg-[#ed93d5]" />

                    {timelineSteps.map((step) => (
                      <div
                        key={step.label}
                        className="relative z-10 flex max-w-[88px] flex-col items-center gap-4 bg-[#f6f3f2] px-2"
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            step.complete
                              ? "bg-black text-white"
                              : step.active
                                ? "bg-[#ed93d5] text-white"
                                : "border border-[#c4c7c7] bg-white text-[#c4c7c7]"
                          }`}
                        >
                          {step.complete ? (
                            <span className="text-[10px] font-bold uppercase">OK</span>
                          ) : step.active ? (
                            <Truck className="h-4 w-4" />
                          ) : null}
                        </div>
                        <span
                          className={`text-center text-[10px] font-bold uppercase tracking-[0.2em] ${
                            step.complete
                              ? "text-black"
                              : step.active
                                ? "text-[#ed93d5]"
                                : "opacity-50"
                          }`}
                        >
                          {step.label.split(" ").map((chunk, index) => (
                            <span key={`${step.label}-${index}`} className="block">
                              {chunk}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8 md:hidden">
                  <div className="relative space-y-10">
                    <div className="absolute left-4 top-0 h-full w-px bg-[#c4c7c7]" />
                    <div className="absolute left-4 top-0 h-[66%] w-px bg-[#ed93d5]" />

                    {timelineSteps.slice(0, 4).map((step) => (
                      <div
                        key={step.label}
                        className={`relative z-10 flex items-center gap-6 ${
                          !step.complete && !step.active ? "opacity-40" : ""
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            step.complete
                              ? "bg-black text-white"
                              : step.active
                                ? "bg-[#ed93d5] text-white"
                                : "border border-[#c4c7c7] bg-white text-[#c4c7c7]"
                          }`}
                        >
                          {step.complete ? (
                            <span className="text-[10px] font-bold uppercase">OK</span>
                          ) : step.active ? (
                            <Truck className="h-4 w-4" />
                          ) : null}
                        </div>
                        <span
                          className={`text-xs font-bold uppercase tracking-[0.2em] ${
                            step.active ? "text-[#ed93d5]" : ""
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-8 border-b border-black/10 pb-10 sm:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444748]">
                    Entrega Estimada
                  </h3>
                  <p className="font-editorial text-3xl font-bold sm:text-4xl">
                    14 de Abril, 2026
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444748]">
                    Endereco de Entrega
                  </h3>
                  <p className="text-lg leading-8">
                    Rua Oscar Freire, 1024
                    <br />
                    Jardins, Sao Paulo - SP
                    <br />
                    01426-000
                  </p>
                </div>
              </section>

              <section className="space-y-6 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                  Atualizacoes do Concierge
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <span className="pt-1 text-xs text-[#444748]">09:42</span>
                    <div>
                      <p className="font-bold">Em Transito</p>
                      <p className="mt-1 text-sm leading-7 text-[#444748]">
                        O seu pedido deixou o Atelie Central em direcao ao centro de distribuicao
                        regional.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 opacity-60 sm:gap-6">
                    <span className="pt-1 text-xs text-[#444748]">Ontem</span>
                    <div>
                      <p className="font-bold">Preparacao Concluida</p>
                      <p className="mt-1 text-sm leading-7 text-[#444748]">
                        Sua curadoria foi embalada seguindo os padroes de luxo BelaPop.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-10 lg:col-span-4 lg:space-y-12">
              <section className="bg-white p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:p-8">
                <h3 className="mb-8 text-xs font-bold uppercase tracking-[0.2em]">Seu Ritual</h3>

                <div className="space-y-8">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="h-24 w-24 shrink-0 bg-[#f6f3f2]">
                      <img
                        alt="Creme de la Mer"
                        className="h-full w-full object-cover"
                        src={heroProduct}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#444748]">La Mer</p>
                      <p className="text-lg font-bold leading-tight">Creme de la Mer</p>
                      <p className="text-sm text-[#444748]">60ml</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="h-24 w-24 shrink-0 bg-[#f6f3f2]">
                      <img
                        alt="Serum Regenerador"
                        className="h-full w-full object-cover"
                        src={supportProduct}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#444748]">
                        BelaPop Selection
                      </p>
                      <p className="text-lg font-bold leading-tight">Serum Regenerador</p>
                      <p className="text-sm text-[#444748]">30ml</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-3 border-t border-black/10 pt-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#444748]">Subtotal</span>
                    <span>R$ 2.450,00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#444748]">Entrega Concierge</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#ed93d5]">
                      Gratis
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 text-lg font-bold">
                    <span>Total</span>
                    <span>R$ 2.450,00</span>
                  </div>
                </div>
              </section>

              <section className="bg-black p-8 text-white sm:p-10">
                <h4 className="font-editorial text-2xl font-bold">Atendimento Exclusivo</h4>
                <p className="mt-4 text-sm leading-7 text-white/70">
                  Duvidas sobre o seu ritual ou sobre a entrega? Nossos especialistas estao a sua
                  disposicao.
                </p>
                <Link
                  href="/feedback"
                  className="mt-8 inline-flex min-h-16 w-full items-center justify-center gap-3 bg-[#ed93d5] px-6 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-opacity hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4" />
                  Suporte de Luxo
                </Link>
              </section>
            </div>
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around bg-white/80 px-3 py-3 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:hidden">
          <Link
            href="/"
            className="flex min-h-14 flex-col items-center justify-center p-2 text-[#444748] transition-opacity hover:opacity-80"
          >
            <Sparkles className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em]">Atelier</span>
          </Link>
          <Link
            href="/catalogo"
            className="flex min-h-14 flex-col items-center justify-center p-2 text-[#444748] transition-opacity hover:opacity-80"
          >
            <Search className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em]">Search</span>
          </Link>
          <Link
            href="/rastreio"
            className="flex min-h-14 flex-col items-center justify-center p-2 text-[#ed93d5]"
          >
            <Truck className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em]">Orders</span>
          </Link>
          <Link
            href="/feedback"
            className="flex min-h-14 flex-col items-center justify-center p-2 text-[#444748] transition-opacity hover:opacity-80"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em]">Concierge</span>
          </Link>
        </nav>
      </div>
    </EditorialPreviewFrame>
  );
}
