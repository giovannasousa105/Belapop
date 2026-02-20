"use client";

import { LuxuryButton } from "@/components/LuxuryButton";

export const SellerCTA = () => {
  return (
    <section className="bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 pb-20 pt-8">
        <div className="rounded-3xl border border-black/10 bg-white p-10 shadow-sm md:p-12">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
            Próxima etapa
          </p>
          <h2 className="mt-3 font-display text-3xl text-bpBlack md:text-4xl">
            Inicie seu cadastro institucional.
          </h2>
          <p className="mt-4 text-sm text-bpGraphite/80">
            Envie as informações da sua marca e aguarde a validação editorial,
            conforme política comercial vigente.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <LuxuryButton tone="retail" size="lg" href="/seller/register">
              Solicitar cadastro
            </LuxuryButton>
            <LuxuryButton
              tone="retail"
              variant="outline"
              size="lg"
              href="#como-funciona"
            >
              Ver passos
            </LuxuryButton>
          </div>
        </div>
      </div>
    </section>
  );
};
