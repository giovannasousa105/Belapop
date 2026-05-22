import { RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";

import type { SellerReturnPolicy } from "@/lib/catalog-standards";

type ReturnPolicyCardProps = {
  className?: string;
  compact?: boolean;
  policy?: SellerReturnPolicy;
};

const fallbackPolicy: SellerReturnPolicy = {
  exchangeRules: "Trocas e devoluções seguem a política BelaPop e a legislacao aplicavel.",
  fullPolicyHref: "/termos-e-condições",
  id: "return-fallback",
  packagingCondition: "Produto deve retornar com embalagem e itens recebidos quando aplicavel.",
  returnWindowDays: 7,
  reverseLogistics: "Solicitação pelo atendimento.",
  summary: "Devolucao orientada pelo atendimento BelaPop."
};

export function ReturnPolicyCard({ className = "", compact = false, policy = fallbackPolicy }: ReturnPolicyCardProps) {
  return (
    <section className={`rounded-[8px] border border-black/10 bg-white p-4 ${className}`} aria-label="Trocas e devoluções">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-[#f7f1ea]">
          <RotateCcw className="h-4 w-4 text-black/75" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/52">Trocas e devolucoes</p>
          <h3 className="mt-1 text-sm font-semibold text-black/82">{policy.returnWindowDays} dias para solicitar</h3>
          {!compact ? <p className="mt-2 text-sm leading-relaxed text-black/64">{policy.summary}</p> : null}
        </div>
      </div>

      {!compact ? (
        <>
          <div className="mt-4 flex items-start gap-2 border-t border-black/10 pt-4 text-xs leading-relaxed text-black/65">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-black/60" aria-hidden="true" />
            {policy.reverseLogistics}
          </div>
          {policy.fullPolicyHref ? (
            <Link
              href={policy.fullPolicyHref}
              className="mt-4 inline-flex text-[10px] font-semibold uppercase tracking-[0.18em] text-black underline underline-offset-4"
            >
              Ver politica completa
            </Link>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
