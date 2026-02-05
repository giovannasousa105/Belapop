"use client";

import React from "react";

type QuoteBlockProps = {
  quote: string;
  tone?: "light" | "dark";
};

export const QuoteBlock = ({ quote, tone = "light" }: QuoteBlockProps) => {
  const isLight = tone === "light";
  return (
    <div
      className={`mx-auto max-w-4xl rounded-2xl p-10 text-center ${
        isLight ? "border border-black/10 bg-white shadow-sm" : "glass-panel"
      }`}
    >
      <p
        className={`font-display text-2xl md:text-3xl ${
          isLight ? "text-noir-950" : "text-blush-50"
        }`}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <p
        className={`mt-4 text-xs uppercase tracking-luxe ${
          isLight ? "text-noir-500" : "text-blush-100/60"
        }`}
      >
        Modo editorial BelaPop
      </p>
    </div>
  );
};
