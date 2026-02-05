"use client";

import { useEffect, useState } from "react";

const messages = [
  "Frete especial em compras acima de R$ 350",
  "Pix com vantagem: 5% off no checkout",
  "Curadoria BelaPop: beleza e autocuidado premium"
];

export const PromoBar = ({ tone = "dark" }: { tone?: "dark" | "light" }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const containerClass =
    tone === "light"
      ? "border-b border-black/20 bg-black text-white"
      : "border-b border-white/10 bg-black text-white";

  return (
    <div
      className={`${containerClass} text-center text-[11px] uppercase tracking-[0.3em]`}
    >
      <div className="mx-auto max-w-7xl px-6 py-2">{messages[index]}</div>
    </div>
  );
};
