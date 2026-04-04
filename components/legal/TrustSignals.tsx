import {
  BadgeCheck,
  CreditCard,
  Headset,
  RotateCcw,
  Truck
} from "lucide-react";

import { trustSignalItems } from "@/lib/legal/content";

const icons = [CreditCard, Truck, RotateCcw, BadgeCheck, Headset] as const;

type TrustSignalsProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function TrustSignals({
  title = "Informacoes objetivas antes da compra",
  description = "A BelaPop deixa visivel o que sustenta pagamento, envio, autenticidade, suporte e pos-venda.",
  className = ""
}: TrustSignalsProps) {
  return (
    <section
      className={`rounded-[32px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,241,242,0.72)_100%)] p-6 sm:p-8 ${className}`}
      aria-label="Sinais de confianca"
    >
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8c5d66]">
          Sinais de confianca
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight text-[#1c1b1b] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-[#5b5051] sm:text-base">{description}</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {trustSignalItems.map((item, index) => {
          const Icon = icons[index];

          return (
            <article
              key={item.title}
              className="rounded-[24px] border border-[#ebe1e2] bg-white/92 p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ecd8dc] bg-[#fcf4f5] text-[#8c5d66]">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#1c1b1b]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5b5051]">{item.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
