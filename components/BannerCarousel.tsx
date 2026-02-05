"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";

const banners = [
  {
    title: "Beauty Week BelaPop",
    subtitle: "Curadoria premium com até 20% off em ícones de skincare.",
    cta: "Explorar agora"
  },
  {
    title: "Glow Clínico",
    subtitle: "Rituais para pele luminosa com ciência e sensorialidade.",
    cta: "Ver seleção"
  },
  {
    title: "Corpo & Banho",
    subtitle: "Texturas e aromas que transformam o cotidiano.",
    cta: "Descobrir"
  }
];

export const BannerCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={banners[index].title}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex min-h-[240px] flex-col justify-between bg-belapop-rose p-8 text-white md:flex-row md:items-center"
        >
          <div className="max-w-lg space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              Campanha editorial
            </p>
            <h2 className="font-display text-3xl text-white md:text-4xl">
              {banners[index].title}
            </h2>
            <p className="text-sm text-white/80">
              {banners[index].subtitle}
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <LuxuryButton
              href="/catalogo"
              size="sm"
              tone="retail"
              className="text-xs uppercase tracking-[0.3em]"
            >
              {banners[index].cta}
            </LuxuryButton>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
