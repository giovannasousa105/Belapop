"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    title: "Luxo Parisiense",
    tag: "Edição Couture",
    body: "Paletas, fragrâncias e skincare com acabamento de alta costura para rituais noturnos.",
    cta: "Ver curadoria"
  },
  {
    title: "Sephora-Style Picks",
    tag: "Boutique Glow",
    body: "Kits assinatura, miniaturas desejo e lançamentos com seleção de concierge BelaPop.",
    cta: "Comprar agora"
  }
];

export default function HeroLuxuryPanels() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="w-full relative overflow-hidden">
      <div className="relative h-full min-h-[360px]">
        {slides.map((slide, i) => {
          const isActive = i === index;
          return (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-opacity duration-800 ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className={`rounded-[32px] border border-white/5 shadow-xl p-8 md:p-12 h-full flex flex-col justify-center text-white ${
                  i === 0
                    ? "bg-gradient-to-br from-[#0b0b10] via-[#0c0c11] to-[#b80f5a]"
                    : "bg-gradient-to-br from-[#f8dfe9] via-white to-[#fbeaf1] text-bpBlackSoft"
                }`}
              >
                <p
                  className={`text-[11px] uppercase tracking-[0.35em] ${
                    i === 0 ? "text-white/75" : "text-bpGraphite/70"
                  }`}
                >
                  {slide.tag}
                </p>
                <h3
                  className={`mt-3 font-display text-4xl md:text-5xl leading-tight ${
                    i === 0 ? "text-white" : "text-bpBlackSoft"
                  }`}
                >
                  {slide.title}
                </h3>
                <p
                  className={`mt-4 text-base md:text-lg max-w-3xl ${
                    i === 0 ? "text-white/80" : "text-bpGraphite"
                  }`}
                >
                  {slide.body}
                </p>
                <div className="mt-8">
                  <a
                    href="/catalogo"
                    className={`inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] ${
                      i === 0
                        ? "bg-white/10 border border-white/30 text-white hover:bg-white/15"
                        : "bg-[#b80f5a] text-white shadow-[0_10px_30px_rgba(184,15,90,0.25)] hover:brightness-110"
                    }`}
                  >
                    {slide.cta}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
