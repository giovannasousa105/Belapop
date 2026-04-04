import Link from "next/link";

import { legalRoutes } from "@/lib/legal/content";

export function SellerOfRecordCard({ className = "" }: { className?: string }) {
  return (
    <section className={`rounded-[28px] border border-black/8 bg-white p-6 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c5d66]">
        Condicoes da compra
      </p>
      <h2 className="mt-3 font-display text-3xl leading-tight text-[#1c1b1b]">
        Vendido por BelaPop
      </h2>
      <div className="mt-5 space-y-3 text-sm leading-7 text-[#51494a]">
        <p>
          A BelaPop e a vendedora direta deste item, salvo indicacao expressa em contrario antes da
          finalizacao da compra.
        </p>
        <p>
          A marca exibida identifica o produto ou a origem da curadoria, mas nao se torna
          automaticamente a vendedora.
        </p>
        <p>
          O envio estimado e informado depois da confirmacao do pagamento, da validacao cadastral e
          da analise antifraude aplicavel.
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
        <Link
          href={`${legalRoutes.terms}#reembolso-e-devolucao`}
          className="text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4"
        >
          Politica de reembolso e devolucao
        </Link>
        <Link
          href={`${legalRoutes.terms}#pagamento-antifraude`}
          className="text-[#1c1b1b] underline decoration-[#c88fa3] underline-offset-4"
        >
          Analise antifraude e aprovacao
        </Link>
      </div>
    </section>
  );
}
