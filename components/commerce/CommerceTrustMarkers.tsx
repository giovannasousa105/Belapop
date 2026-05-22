"use client";

import {
  CreditCard,
  Headset,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck
} from "lucide-react";

import { commerceTrustMarkers } from "@/lib/legal/content";

type CommerceTrustMarkersProps = {
  className?: string;
  compact?: boolean;
};

const iconByKey = {
  authenticity: ShieldCheck,
  curation: Sparkles,
  tracking: Truck,
  exchange: RotateCcw,
  concierge: Headset,
  payment: CreditCard
} as const;

export function CommerceTrustMarkers({
  className = "",
  compact = false
}: CommerceTrustMarkersProps) {
  return (
    <section
      className={`rounded-[24px] border border-black/8 bg-white p-5 sm:p-6 ${className}`}
      aria-label="Sinais de confianca de compra"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c5d66]">
        Compra com contexto
      </p>
      <h3 className="mt-3 font-display text-2xl text-[#1c1b1b] sm:text-3xl">
        Autenticidade, curadoria, entrega, pos-venda e pagamento visiveis antes da decisao.
      </h3>

      <div className={`mt-6 grid gap-3 ${compact ? "sm:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        {commerceTrustMarkers.map((item) => {
          const Icon = iconByKey[item.key];

          return (
            <article
              key={item.key}
              className="rounded-[18px] border border-[#ebe1e2] bg-[#fcf9f8] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ecd8dc] bg-[#fcf4f5] text-[#8c5d66]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1c1b1b]">
                  {item.shortLabel}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#5b5051]">{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
