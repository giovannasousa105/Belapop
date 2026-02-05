"use client";

import { EmptyState } from "@/components/EmptyState";
import { PageHeading } from "@/components/PageHeading";

export default function AccountReturnsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Trocas & Devoluções"
        subtitle="Fluxos claros para manter a experiência elegante."
      />
      <EmptyState
        title="Nenhuma solicitação registrada"
        body="Quando precisar, você poderá solicitar troca ou devolução por aqui."
        ctaLabel="Ver pedidos"
        ctaHref="/account/orders"
      />
    </div>
  );
}
