"use client";

import CustomerPaymentMethodsPanel from "@/components/customer/CustomerPaymentMethodsPanel";

export default function ContaPagamentosPage() {
  return (
    <div className="space-y-8 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.32em] text-bpGraphite/60">Pagamentos</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Credito, debito, boleto e Pix</h1>
        <p className="mt-3 max-w-2xl text-sm text-bpGraphite/75">
          Acompanhe os meios aceitos no checkout da BelaPop e veja os cartoes salvos para
          compras futuras.
        </p>
      </section>

      <CustomerPaymentMethodsPanel />
    </div>
  );
}
