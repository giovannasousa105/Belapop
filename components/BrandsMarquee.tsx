"use client";

import { motion, useReducedMotion } from "framer-motion";

type Brand = {
  name: string;
  accent?: string;
};

const BRANDS: Brand[] = [
  { name: "Caudalíe" },
  { name: "Fenty Beauty" },
  { name: "Dior Backstage" },
  { name: "Biossance" },
  { name: "Sol de Janeiro" },
  { name: "Hermès Beauty" },
  { name: "La Mer" },
  { name: "Byredo" },
  { name: "Chanel" },
  { name: "Sisley Paris" }
];

export function BrandsMarquee() {
  const reduceMotion = useReducedMotion();
  const items = [...BRANDS, ...BRANDS]; // duplicado para looping suave

  const marqueeVariants = reduceMotion
    ? {}
    : {
        animate: {
          x: ["0%", "-50%"],
          transition: {
            ease: "linear",
            duration: 30,
            repeat: Infinity
          }
        }
      };

  return (
    <section className="relative w-screen overflow-hidden bg-white py-8">
      {/* máscaras laterais para suavizar entrada/saída */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />

      <div className="relative mx-auto max-w-none">
        <motion.div
          className="flex gap-6 px-6"
          {...marqueeVariants}
          animate={reduceMotion ? undefined : "animate"}
        >
          {items.map((brand, index) => (
            <div
              key={`${brand.name}-${index}`}
              className="min-w-[180px] md:min-w-[220px] rounded-2xl border border-black/5 bg-white shadow-md shadow-black/5 px-6 py-4 flex items-center justify-center text-center text-sm font-semibold text-noir-800"
            >
              {brand.name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
