import { BadgeCheck, FileCheck2, PackageCheck, Sparkles, Truck } from "lucide-react";

import type { VerificationBadgeType } from "@/lib/catalog-standards";

type VerifiedProductBadgeProps = {
  className?: string;
  compact?: boolean;
  type?: VerificationBadgeType;
};

const badgeConfig: Record<VerificationBadgeType, { label: string; icon: typeof BadgeCheck }> = {
  "authentic-product": { icon: BadgeCheck, label: "Produto Autentico" },
  "belapop-curation": { icon: Sparkles, label: "Curadoria BelaPop" },
  "invoice-guaranteed": { icon: FileCheck2, label: "Nota Fiscal Garantida" },
  "premium-shipping": { icon: Truck, label: "Envio Premium" },
  "seller-verified": { icon: PackageCheck, label: "Seller Verificado" }
};

export function VerifiedProductBadge({
  className = "",
  compact = false,
  type = "authentic-product"
}: VerifiedProductBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[8px] border border-black/10 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/75 ${className}`}
    >
      <Icon className="h-3.5 w-3.5 text-black" aria-hidden="true" />
      {compact ? config.label.replace("BelaPop", "BP") : config.label}
    </span>
  );
}
