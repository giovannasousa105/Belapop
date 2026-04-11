"use client";

/* eslint-disable @next/next/no-img-element */

import { ArrowRight, Gift, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { EditorialPreviewFrame } from "@/components/previews/belapop/editorial-preview-frame";

const productImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBPrABSgDHHJIW3IE9WGjlsmxz4r4BZ0horSwfUmBJGNu0Klc5jwbrUFDKJ4omeuwC9Fi64tV_OPtHPlTWq8WPVrXp93Lp_YxHaUP2ddXS5BOcZj_ebEqAG7DmwAR4FkD2JoMhmVeo1f1NLFbWDFTn5g8nzXXz0yyyMMSKmNAvHYcDJswT22QJiItnSeTgq8Wl94hJ4p9dZbE8RkT93u6Z7oPQ8RVQ7w_gIuOWSRcXJNrFo4mmYCUzlgTzWP0rTtUNvBf3nrsjIUD2r";

const brandExperienceCopy = ["Minima", "Baixa", "Boa", "Alta", "Maxima"] as const;

const accentItems = [
  {
    description: "Selecionamos apenas o que ha de mais sublime na dermatologia global.",
    icon: Sparkles,
    title: "Curadoria Especializada"
  },
  {
    description: "Autenticidade garantida em cada frasco, cada gota, cada ritual.",
    icon: ShieldCheck,
    title: "Qualidade Certificada"
  },
  {
    description: "Sua avaliacao desbloqueia beneficios em seu proximo pedido.",
    icon: Gift,
    title: "Mimos Exclusivos"
  }
] as const;

export function FeedbackExperience() {
  const [productRating, setProductRating] = useState(5);
  const [brandRating, setBrandRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const currentStars = hoverRating ?? productRating;

  const message = useMemo(() => {
    if (!submitted) return null;
    return "Feedback enviado com sucesso. Seu proximo ritual ja recebeu prioridade no Atelier.";
  }, [submitted]);

  return (
    <EditorialPreviewFrame mode="live">
      <div data-belapop-page="feedback-public">
        <main className="min-h-screen px-4 pb-12 pt-[104px] sm:px-6 lg:px-10 lg:pb-16 lg:pt-28">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 lg:grid-cols-12 lg:items-start lg:gap-16">
            <div className="relative lg:col-span-5">
              <div className="overflow-hidden bg-[#f6f3f2]">
                <div className="aspect-[4/5] sm:aspect-[3/4]">
                  <img
                    alt="Orquidea Imperial"
                    className="h-full w-full object-cover grayscale-[0.3] transition-all duration-700 hover:grayscale-0"
                    src={productImage}
                  />
                </div>
              </div>

              <div className="mt-6 bg-[#fcf9f8] p-6 shadow-[0_10px_40px_rgba(28,27,27,0.05)] sm:max-w-xs lg:absolute lg:-bottom-8 lg:-right-8 lg:mt-0 lg:p-10">
                <p className="mb-2 font-editorial text-2xl italic leading-tight">
                  A essencia da regeneracao.
                </p>
                <p className="text-sm leading-7 text-[#444748]">
                  Cada toque e um convite para o seu renascimento pessoal. Sinta a Orquidea Imperial.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 lg:pt-12 lg:pl-8 xl:pl-12">
              <header className="mb-12 lg:mb-16">
                <span className="mb-4 block text-[10px] uppercase tracking-[0.3em] text-[#444748]">
                  Feedback Exclusivo
                </span>
                <h1 className="font-editorial text-4xl leading-none tracking-[-0.06em] sm:text-6xl lg:text-8xl">
                  Compartilhe seu Ritual
                </h1>
                <h2 className="mt-6 max-w-xl text-lg font-light leading-8 text-[#444748] sm:text-xl lg:text-2xl">
                  Leticia, como foi sua experiencia com o{" "}
                  <span className="font-semibold text-[#1c1b1b]">
                    Soro Regenerador Orquidea Imperial?
                  </span>
                </h2>
              </header>

              <form
                className="space-y-12 lg:space-y-16"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSubmitted(true);
                }}
              >
                <section className="space-y-6">
                  <label className="text-xs font-bold uppercase tracking-[0.22em]">
                    Avaliacao do Produto
                  </label>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div
                      className="flex items-center gap-1 sm:gap-2"
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= currentStars;

                        return (
                          <button
                            key={star}
                            type="button"
                            className="inline-flex h-12 w-12 items-center justify-center transition-transform active:scale-90 sm:h-14 sm:w-14"
                            onClick={() => setProductRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            aria-label={`Avaliar com ${star} estrela${star > 1 ? "s" : ""}`}
                          >
                            <Star
                              className={`h-8 w-8 sm:h-9 sm:w-9 ${
                                active ? "fill-black text-black" : "text-black/30"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-sm italic text-[#444748]">
                      {brandExperienceCopy[productRating - 1] ?? "Excelente"}
                    </span>
                  </div>
                </section>

                <section className="space-y-6">
                  <label className="text-xs font-bold uppercase tracking-[0.22em]" htmlFor="comment">
                    Seu Relato
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    className="w-full border-0 border-b border-black/15 bg-[#f6f3f2] p-5 text-base placeholder:text-[#747878]/60 focus:border-black focus:outline-none focus:ring-0 sm:p-6 sm:text-lg"
                    placeholder="Descreva as texturas, os aromas e os resultados em sua pele..."
                    rows={5}
                    onChange={(event) => setComment(event.target.value)}
                  />
                </section>

                <section className="space-y-6 bg-[#f6f3f2] p-6 sm:p-8 lg:p-10">
                  <label className="text-xs font-bold uppercase tracking-[0.22em]">
                    Experiencia BelaPop
                  </label>
                  <p className="-mt-2 text-sm leading-7 text-[#444748]">
                    Em uma escala de 1 a 5, quao satisfeita voce esta com nossa curadoria?
                  </p>

                  <div className="flex flex-col gap-5 lg:max-w-md">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em]">
                      <span>Minima</span>
                      <span>Maxima</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const selected = value === brandRating;

                        return (
                          <button
                            key={value}
                            type="button"
                            className={`flex h-12 items-center justify-center border text-sm font-medium transition-colors sm:h-14 ${
                              selected
                                ? "border-black bg-black text-white"
                                : "border-black/12 bg-white hover:bg-black hover:text-white"
                            }`}
                            onClick={() => setBrandRating(value)}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <div className="pt-2 lg:pt-8">
                  <button
                    type="submit"
                    className="group inline-flex min-h-14 w-full items-center justify-center gap-3 bg-black px-8 text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:bg-neutral-800 sm:w-auto sm:min-w-[280px]"
                  >
                    Enviar Feedback
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  {message ? <p className="mt-4 text-sm leading-7 text-[#444748]">{message}</p> : null}
                </div>
              </form>
            </div>
          </div>
        </main>

        <section className="w-full bg-[#f6f3f2] px-4 py-16 sm:px-6 lg:mt-8 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {accentItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex flex-col gap-4">
                  <Icon className="h-8 w-8" />
                  <h3 className="font-editorial text-2xl italic">{item.title}</h3>
                  <p className="text-sm leading-7 text-[#444748]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </EditorialPreviewFrame>
  );
}
