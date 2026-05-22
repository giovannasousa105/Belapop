import { AlertTriangle, FileCheck2, ShieldCheck } from "lucide-react";

import type { ProductAuthenticity } from "@/lib/catalog-standards";

type AuthenticityBadgeProps = {
  authenticity?: ProductAuthenticity;
  className?: string;
  compact?: boolean;
};

const labelByStatus: Record<ProductAuthenticity["status"], string> = {
  blocked: "Autenticidade bloqueada",
  pending: "Autenticidade em revisao",
  verified: "Produto Autentico"
};

export function AuthenticityBadge({ authenticity, className = "", compact = false }: AuthenticityBadgeProps) {
  const status = authenticity?.status ?? "pending";
  const Icon = status === "verified" ? ShieldCheck : status === "blocked" ? AlertTriangle : FileCheck2;
  const tone =
    status === "verified"
      ? "border-black bg-black text-white"
      : status === "blocked"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div className={`inline-flex max-w-full items-start gap-2 rounded-[8px] border px-3 py-2 ${tone} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{labelByStatus[status]}</p>
        {!compact ? (
          <p className="mt-1 text-xs leading-relaxed opacity-80">
            {authenticity?.origin ?? "Origem e nota fiscal validadas pela curadoria BelaPop."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
