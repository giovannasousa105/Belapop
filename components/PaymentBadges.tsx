"use client";

import React from "react";

type PaymentBadgesProps = {
  tone?: "light" | "dark";
  methods?: Array<"cartao" | "pix" | "boleto">;
};

const METHOD_LABELS: Record<"cartao" | "pix" | "boleto", string> = {
  cartao: "Cartao",
  pix: "Pix",
  boleto: "Boleto"
};

export const PaymentBadges = ({ tone = "dark", methods }: PaymentBadgesProps) => {
  const badgeClass = `flex items-center justify-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
    tone === "light"
      ? "border-black/10 bg-white text-bpGraphite/80"
      : "border-white/20 text-bpOffWhite/80"
  }`;

  const resolvedMethods =
    methods && methods.length > 0 ? methods.map((item) => METHOD_LABELS[item]) : ["Stripe"];

  return (
    <div className="flex flex-wrap gap-2">
      {resolvedMethods.map((method) => (
        <span key={method} className={badgeClass}>
          {method}
        </span>
      ))}
    </div>
  );
};
