import { AlertTriangle, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

import type { StandardStatus } from "@/lib/catalog-standards";

type SellerQualityBadgeProps = {
  className?: string;
  score: number;
  status?: StandardStatus;
};

const labelByStatus: Record<StandardStatus, string> = {
  approved: "Seller Verificado",
  blocked: "Seller bloqueado",
  pending: "Seller pendente",
  review: "Em revisao"
};

export function SellerQualityBadge({ className = "", score, status = "approved" }: SellerQualityBadgeProps) {
  const Icon =
    status === "approved" ? ShieldCheck : status === "blocked" ? AlertTriangle : status === "pending" ? Clock3 : CheckCircle2;
  const tone =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "blocked"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-stone-200 bg-stone-50 text-stone-800";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone} ${className}`}
      aria-label={`${labelByStatus[status]} com score ${score}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {labelByStatus[status]} <span className="font-bold">{score}</span>
    </span>
  );
}
