import Link from "next/link";

import { legalRoutes } from "@/lib/legal/content";

type PurchaseTrustSummaryProps = {
  context: "cart" | "checkout";
  className?: string;
};

export function PurchaseTrustSummary({
  context,
  className = ""
}: PurchaseTrustSummaryProps) {
  const heading =
    context === "cart" ? "Antes de seguir para o checkout" : "Antes de concluir a compra";

  return (
    <section className={`rounded-[24px] border border-black/8 bg-white p-5 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c5d66]">
        Resumo de confianca
      </p>
      <h3 className="mt-3 font-display text-2xl text-[#1c1b1b]">{heading}</h3>

      <ul className="mt-5 space-y-3 text-sm leading-6 text-[#51494a]">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
          <span>A confirmacao do pedido esta sujeita ao pagamento e a analise antifraude.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
          <span>O prazo estimado de entrega conta depois da aprovacao e da liberacao operacional.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88fa3]" />
          <span>
            A BelaPop e a vendedora direta, salvo indicacao expressa em contrario antes da compra.
          </span>
        </li>
      </ul>

      <div className="mt-5 flex flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
        <Link
          href={`${legalRoutes.terms}#reembolso-e-devolucao`}
          className="text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4"
        >
          Politica de reembolso e devolucao
        </Link>
        <Link
          href={legalRoutes.terms}
          className="text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4"
        >
          Termos e condicoes
        </Link>
      </div>
    </section>
  );
}
