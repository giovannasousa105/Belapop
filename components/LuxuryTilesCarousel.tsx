"use client";

import { useEffect, useMemo, useRef } from "react";

export default function LuxuryTilesCarousel() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  // placeholders para futuras marcas/logos
  const items = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ id: i })), []);
  const doubled = useMemo(() => [...items, ...items], [items]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    let x = 0;
    const speed = 0.35; // ajuste de velocidade

    const step = () => {
      x += speed;
      const half = el.scrollWidth / 2;
      if (x >= half) x = 0;
      el.style.transform = `translateX(${-x}px)`;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="w-full py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-6 text-center">
          <h2 className="text-xl md:text-2xl font-serif tracking-wide text-bpBlackSoft">Marcas Selecionadas</h2>
          <p className="mt-2 text-sm text-black/60">
            Espaço reservado: em breve, os ícones das marcas que entram na curadoria BelaPop.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-white">
          <div className="py-8">
            <div
              ref={trackRef}
              className="flex w-max will-change-transform"
              style={{ transform: "translateX(0px)" }}
            >
              {doubled.map((it, idx) => (
                <div key={`${it.id}-${idx}`} className="mx-3">
                  <div
                    className="h-[120px] w-[120px] md:h-[160px] md:w-[160px] rounded-2xl
                               bg-neutral-950 border border-pink-500/30
                               shadow-[0_0_0_1px_rgba(236,72,153,0.18),_0_10px_40px_rgba(236,72,153,0.10)]
                               transition-transform duration-300 hover:-translate-y-[1px]"
                  >
                    <div className="h-full w-full rounded-2xl bg-gradient-to-b from-white/5 to-transparent" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>
    </section>
  );
}
