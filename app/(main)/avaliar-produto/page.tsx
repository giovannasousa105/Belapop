import type { Metadata } from "next";
import Link from "next/link";

import { ReviewForm } from "@/components/lifecycle";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { mockReviewRequests } from "@/lib/lifecycle/postPurchase";

export const metadata: Metadata = {
  title: "Avaliar produto | BelaPop",
  description: "Compartilhe uma avaliação real sobre sua experiência com a curadoria BelaPop."
};

type ReviewPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const requestId = typeof params?.request === "string" ? params.request : undefined;
  const request =
    mockReviewRequests.find((item) => item.id === requestId) ??
    mockReviewRequests[0];

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <BelaPopValidatedHeader activeSection="skincare" />
      <main className="mx-auto max-w-5xl px-5 pb-20 pt-28 md:px-8 lg:pt-36">
        <section className="mb-8 max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Avaliacao real</p>
          <h1 className="mt-3 font-editorial text-5xl leading-tight text-[#211c18] md:text-6xl">
            Queremos entender como foi sua experiencia.
          </h1>
          <p className="mt-4 text-base leading-8 text-black/64">
            Sua opinião ajuda a BelaPop a orientar melhor outras clientes. Não buscamos elogio automático: buscamos uso real, contexto e transparência.
          </p>
        </section>

        <ReviewForm request={request} />

        <div className="mt-6 rounded-[8px] border border-black/10 bg-white p-5 text-sm leading-relaxed text-black/64">
          Precisa de ajuda com produto avariado, divergente ou duvida de uso?{" "}
          <Link href="/contato?assunto=concierge" className="font-semibold text-[#211c18] underline underline-offset-4">
            Fale com o concierge BelaPop
          </Link>
          .
        </div>
      </main>
      <BelaPopValidatedFooter />
    </div>
  );
}
