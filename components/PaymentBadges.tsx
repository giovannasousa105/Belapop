"use client";

import React from "react";

type PaymentBadgesProps = {
  tone?: "light" | "dark";
};

export const PaymentBadges = ({ tone = "dark" }: PaymentBadgesProps) => {
  const badgeClass = `flex items-center justify-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
    tone === "light"
      ? "border-black/10 bg-white text-bpGraphite/80"
      : "border-white/20 text-bpOffWhite/80"
  }`;

  return (
    <div className="flex flex-wrap gap-2">
      <span className={badgeClass}>Visa</span>
      <span className={badgeClass}>Mastercard</span>
      <span className={badgeClass}>Pix</span>
      <span className={badgeClass}>Boleto</span>
    </div>
  );
};
