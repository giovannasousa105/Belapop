import { MapPin, PackageCheck, Truck } from "lucide-react";

import type { SellerShippingPolicy } from "@/lib/catalog-standards";

type ShippingInfoCardProps = {
  className?: string;
  compact?: boolean;
  policy?: SellerShippingPolicy;
};

const fallbackPolicy: SellerShippingPolicy = {
  averageDeliveryDays: "Prazo calculado no checkout",
  coverageRegions: ["Brasil"],
  freightRules: "Envio com rastreio conforme seller e disponibilidade logistica.",
  id: "shipping-fallback",
  originAddress: "Origem informada pelo seller aprovado",
  preparationCopy: "Pedido separado com conferencia e identificacao correta.",
  postingSlaHours: 48,
  premiumShipping: false,
  trackingRequired: true
};

export function ShippingInfoCard({ className = "", compact = false, policy = fallbackPolicy }: ShippingInfoCardProps) {
  return (
    <section className={`rounded-[8px] border border-black/10 bg-white p-4 ${className}`} aria-label="Envio e entrega">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-[#f7f1ea]">
          <Truck className="h-4 w-4 text-black/75" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/52">Envio e entrega</p>
          <h3 className="mt-1 text-sm font-semibold text-black/82">
            SLA de postagem: ate {policy.postingSlaHours}h
          </h3>
          {!compact ? (
            <p className="mt-2 text-sm leading-relaxed text-black/64">
              {policy.preparationCopy ?? policy.freightRules}
            </p>
          ) : null}
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        <div className="flex items-center gap-2 text-xs text-black/65">
          <PackageCheck className="h-4 w-4 text-black/60" aria-hidden="true" />
          {policy.averageDeliveryDays}
        </div>
        <div className="flex items-center gap-2 text-xs text-black/65">
          <MapPin className="h-4 w-4 text-black/60" aria-hidden="true" />
          {policy.coverageRegions.join(", ")}
        </div>
        {!compact && policy.originAddress ? (
          <div className="flex items-center gap-2 text-xs text-black/65 sm:col-span-2">
            <MapPin className="h-4 w-4 text-black/60" aria-hidden="true" />
            Origem: {policy.originAddress}
          </div>
        ) : null}
      </div>
    </section>
  );
}
