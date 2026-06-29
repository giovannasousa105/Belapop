import type { Metadata } from "next";
import Link from "next/link";

import {
  ComplementaryProductCard,
  PostPurchaseMessagePreview,
  RebuyReminderCard,
  UsageGuideCard
} from "@/components/lifecycle";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import {
  getComplementaryRecommendations,
  mockLifecycleCustomers,
  mockLifecycleOrders,
  mockPostPurchaseMessages,
  mockRecommendationCatalog,
  mockRebuyReminders,
  mockUsageGuides
} from "@/lib/lifecycle/postPurchase";

export const metadata: Metadata = {
  title: "Minha rotina | BelaPop",
  description: "Rotina BelaPop com guia de uso, recomendações complementares, recompra e concierge."
};

export default function MinhaRotinaPage() {
  const customer = mockLifecycleCustomers[0];
  const order = mockLifecycleOrders[0];
  const recommendations = getComplementaryRecommendations(order, customer.skinProfile, mockRecommendationCatalog);
  const guide = mockUsageGuides[0];
  const rebuy = mockRebuyReminders[0];

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <BelaPopValidatedHeader activeSection="skincare" />
      <main className="mx-auto max-w-7xl px-5 pb-20 pt-28 md:px-8 lg:pt-36">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">Minha rotina BelaPop</p>
            <h1 className="mt-3 max-w-4xl font-editorial text-5xl leading-tight text-[#211c18] md:text-6xl">
              Seu ritual, organizado para usar melhor e recomprar no tempo certo.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-black/64">
              Guia de uso, recomendacoes complementares e recompra assistida conectam o pos-compra ao cuidado real da sua pele.
            </p>
          </div>
          <div className="rounded-[8px] border border-black/10 bg-white p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Skin Scan conectado</p>
            <p className="mt-2 text-sm leading-relaxed text-black/66">{customer.skinProfile?.skinScanSummary}</p>
            <Link
              href="/skin-scan"
              className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-[#211c18] underline underline-offset-4"
            >
              Atualizar leitura de pele
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <UsageGuideCard guide={guide} />
          <RebuyReminderCard reminder={rebuy} />
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/45">Complementos</p>
              <h2 className="font-editorial text-3xl text-[#211c18]">Pela sua escolha, isto pode completar a rotina.</h2>
            </div>
            <Link href="/kits" className="text-xs font-semibold uppercase tracking-[0.18em] underline underline-offset-4">
              Ver kits BelaPop
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recommendations.map((product) => (
              <ComplementaryProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          {mockPostPurchaseMessages.slice(0, 2).map((message) => (
            <PostPurchaseMessagePreview key={message.id} item={message} />
          ))}
        </section>
      </main>
      <BelaPopValidatedFooter />
    </div>
  );
}
