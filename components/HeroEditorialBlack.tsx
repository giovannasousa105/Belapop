"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";

function EditorialPinkCarousel() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  const slides = useMemo(
    () => [
      { id: 1, title: "Texturas Inteligentes", desc: "Sensorial premium, resultado real." },
      { id: 2, title: "Curadoria Editorial", desc: "So o que entrega presenca e performance." },
      { id: 3, title: "Ritual Noturno", desc: "Calma, brilho, consistencia." }
    ],
    []
  );

  const doubled = useMemo(() => [...slides, ...slides], [slides]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || reduceMotion) return;

    let raf = 0;
    let x = 0;
    const speed = 0.55;
    const step = () => {
      x += speed;
      const half = el.scrollWidth / 2;
      if (x >= half) x = 0;
      el.style.transform = `translateX(${-x}px)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-pink-200/60 bg-white">
      <div className="py-6">
        <div ref={trackRef} className="flex w-max will-change-transform">
          {doubled.map((s, idx) => (
            <div key={`${s.id}-${idx}`} className="mx-4 w-[340px] md:w-[420px]">
              <div
                className="h-full rounded-2xl border border-pink-300/80
                           bg-white
                           shadow-[0_0_0_1px_rgba(247,191,209,0.7),_0_18px_50px_rgba(184,15,90,0.18)]
                           px-8 py-8 transition duration-500 hover:shadow-[0_0_0_1px_rgba(184,15,90,0.45),_0_26px_70px_rgba(184,15,90,0.22)] hover:-translate-y-[2px]"
              >
                <div className="text-bpPink text-xs tracking-[0.22em] uppercase">
                  campanha editorial
                </div>
                <div className="mt-4 font-serif text-2xl tracking-wide text-bpBlack">
                  {s.title}
                </div>
                <div className="mt-3 text-sm text-bpGraphite/80 leading-relaxed">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />
    </div>
  );
}

export default function HeroEditorialBlack() {
  const reduceMotion = useReducedMotion();
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || "/logo.svg";

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: reduceMotion ? { duration: 0 } : { staggerChildren: 0.1, delayChildren: 0.12 }
    }
  };

  const item = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
    show: reduceMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] } }
  };

  return (
    <section className="relative w-screen bg-black overflow-hidden">
      {!reduceMotion && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.12), rgba(0,0,0,0) 60%)"
            }}
          />
          <div
            className="absolute -bottom-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle at center, rgba(236,72,153,0.16), rgba(0,0,0,0) 62%)"
            }}
          />
        </div>
      )}

      <motion.div
        className="relative mx-auto max-w-6xl px-6 py-12 text-center text-white md:py-16"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item} className="tracking-[0.28em] text-xs uppercase text-white/70">
          Curadoria de Beleza
        </motion.div>

        <motion.div variants={item} className="mt-8 flex justify-center">
          <img
            src={logoUrl}
            alt="BelaPop Oficial"
            className="h-28 w-auto md:h-32"
          />
        </motion.div>

        <motion.h1
          variants={item}
          className="mt-5 font-serif text-5xl tracking-[0.14em] md:text-6xl"
        >
          BelaPop
        </motion.h1>

        <motion.p variants={item} className="mx-auto mt-6 max-w-2xl leading-relaxed text-white/75">
          Curadoria editorial de beleza e autocuidado, com linguagem sofisticada e toques de luxo
          que traduzem presenca e resultado.
        </motion.p>

        <motion.div variants={item} className="mt-10">
          <EditorialPinkCarousel />
        </motion.div>

        <motion.div variants={item} className="mt-12 flex justify-center">
          <button
            className="rounded-full border border-pink-500/60 bg-gradient-to-r from-pink-600 to-pink-500 px-10 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_15px_45px_rgba(184,15,90,0.35)] transition hover:scale-[1.01]"
          >
            Conheca a curadoria BelaPop
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
