"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, Gift, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { EditorialPreviewFrame } from "./editorial-preview-frame";
import {
  previewHeadlineFont,
  previewPrimaryButtonClass
} from "./luxury-preview-theme";
import { getBelapopHref, type BelapopRenderMode } from "./routes";

const productImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBPrABSgDHHJIW3IE9WGjlsmxz4r4BZ0horSwfUmBJGNu0Klc5jwbrUFDKJ4omeuwC9Fi64tV_OPtHPlTWq8WPVrXp93Lp_YxHaUP2ddXS5BOcZj_ebEqAG7DmwAR4FkD2JoMhmVeo1f1NLFbWDFTn5g8nzXXz0yyyMMSKmNAvHYcDJswT22QJiItnSeTgq8Wl94hJ4p9dZbE8RkT93u6Z7oPQ8RVQ7w_gIuOWSRcXJNrFo4mmYCUzlgTzWP0rTtUNvBf3nrsjIUD2r";

const brandExperienceCopy = ["Minima", "Baixa", "Boa", "Alta", "Maxima"] as const;

const accentItems = [
  {
    icon: Sparkles,
    title: "Curadoria Especializada",
    description: "Selecionamos apenas o que ha de mais sublime na dermatologia global."
  },
  {
    icon: ShieldCheck,
    title: "Qualidade Certificada",
    description: "Autenticidade garantida em cada frasco, cada gota, cada ritual."
  },
  {
    icon: Gift,
    title: "Mimos Exclusivos",
    description: "Sua avaliacao desbloqueia beneficios em seu proximo pedido."
  }
] as const;

type FeedbackPreviewScreenProps = {
  mode?: BelapopRenderMode;
};

export function FeedbackPreviewScreen({ mode = "preview" }: FeedbackPreviewScreenProps) {
  const [productRating, setProductRating] = useState(5);
  const [brandRating, setBrandRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>("Soro Regenerador Orquidea Imperial");

  const currentStars = hoverRating ?? productRating;

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      try {
        const response = await fetch("/api/products/search?q=serum&pageSize=6&sort=featured", {
          cache: "no-store"
        });
        if (!response.ok) return;

        const payload = (await response.json()) as {
          items?: Array<{ id: string; name: string }>;
        };
        const items = Array.isArray(payload.items) ? payload.items : [];
        const preferred =
          items.find((item) => /orquidea|orchid|serum|soro/i.test(item.name)) ?? items[0];

        if (!active || !preferred) return;
        setProductId(preferred.id);
        setProductName(preferred.name);
      } catch {
        // noop
      }
    };

    void loadProduct();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedComment = comment.trim();
    if (!normalizedComment) {
      setMessage("Descreva sua experiencia antes de enviar o feedback.");
      return;
    }

    if (!productId) {
      setMessage("Nao foi possivel vincular um produto para a avaliacao agora.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId,
          rating: productRating,
          comment: `Experiencia BelaPop: ${brandRating}/5\n\n${normalizedComment}`
        })
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        if (payload?.error === "unauthorized") {
          setMessage("Faca login para enviar sua avaliacao.");
          return;
        }
        if (payload?.error === "purchase_required") {
          setMessage("A avaliacao so fica disponivel para clientes com compra elegivel do produto.");
          return;
        }
        if (payload?.error === "invalid_payload" || payload?.error === "invalid_rating") {
          setMessage("Os dados do feedback estao incompletos.");
          return;
        }
        setMessage("Nao foi possivel enviar o feedback agora.");
        return;
      }

      setMessage("Feedback enviado com sucesso para o produto vinculado.");
      setComment("");
    } catch {
      setMessage("Nao foi possivel enviar o feedback agora.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EditorialPreviewFrame mode={mode}>
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
              <p className={`${previewHeadlineFont.className} mb-2 text-2xl italic leading-tight`}>
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
              <h1
                className={`${previewHeadlineFont.className} text-4xl leading-none tracking-[-0.06em] sm:text-6xl lg:text-8xl`}
              >
                Compartilhe seu Ritual
              </h1>
              <h2 className="mt-6 max-w-xl text-lg font-light leading-8 text-[#444748] sm:text-xl lg:text-2xl">
                Leticia, como foi sua experiencia com o{" "}
                <span className="font-semibold text-[#1c1b1b]">
                  Soro Regenerador Orquidea Imperial?
                </span>
              </h2>
            </header>

            <form className="space-y-12 lg:space-y-16" onSubmit={handleSubmit}>
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
                  disabled={submitting}
                  className={`${previewPrimaryButtonClass} w-full text-sm tracking-[0.22em] hover:bg-neutral-800 sm:w-auto sm:min-w-[280px]`}
                >
                  {submitting ? "Enviando..." : "Enviar Feedback"}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#444748]">
                  Feedback vinculado a: {productName}
                </p>
                {message ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm leading-7 text-[#444748]">{message}</p>
                    {message.includes("Faca login") ? (
                      <Link
                        href={getBelapopHref(mode, "login")}
                        className="inline-flex border-b border-black pb-1 text-[11px] font-bold uppercase tracking-[0.22em]"
                      >
                        Ir para login
                      </Link>
                    ) : null}
                  </div>
                ) : null}
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
                <h3 className={`${previewHeadlineFont.className} text-2xl italic`}>{item.title}</h3>
                <p className="text-sm leading-7 text-[#444748]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </EditorialPreviewFrame>
  );
}
