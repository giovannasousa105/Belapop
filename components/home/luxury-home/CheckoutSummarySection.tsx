/* eslint-disable @next/next/no-img-element */

import { checkoutProduct } from "@/components/home/luxury-home/data";
import { headlineClassName, IconGlyph } from "@/components/home/luxury-home/shared";

export function CheckoutSummarySection() {
  return (
    <aside className="lg:col-span-5">
      <div className="space-y-10 bg-[#f6f3f2] p-6 sm:p-8 lg:sticky lg:top-32 lg:p-12">
        <h3 className={`${headlineClassName} text-2xl text-[#1c1b1b]`}>Resumo da Curadoria</h3>

        <div className="flex items-start gap-4 border-b border-black/10 pb-8 sm:gap-6">
          <div className="h-28 w-20 shrink-0 bg-white sm:h-32 sm:w-24">
            <img
              src={checkoutProduct.image}
              alt={checkoutProduct.alt}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">
              {checkoutProduct.brand}
            </span>
            <h4 className="text-sm font-medium text-[#1c1b1b]">{checkoutProduct.title}</h4>
            <span className="text-[10px] text-[#444748]">{checkoutProduct.description}</span>
            <span className="mt-4 text-sm font-bold text-[#1c1b1b]">R$ 2.450,00</span>
          </div>

          <button
            type="button"
            aria-label="Remover item"
            className="text-[#444748] transition-colors hover:text-[#ba1a1a]"
          >
            <IconGlyph name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-xs uppercase tracking-widest">
            <span className="text-[#444748]">Subtotal</span>
            <span className="text-[#1c1b1b]">R$ 2.450,00</span>
          </div>
          <div className="flex justify-between text-xs uppercase tracking-widest">
            <span className="text-[#444748]">Entrega Especial</span>
            <span className="text-[#1c1b1b]">Gratis</span>
          </div>
          <div
            className={`flex justify-between border-t border-black/15 pt-4 text-lg ${headlineClassName}`}
          >
            <span>Total</span>
            <span className="font-bold">R$ 2.450,00</span>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <button
            type="button"
            className="group flex min-h-[60px] w-full items-center justify-center gap-2 bg-black px-6 py-5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-500 hover:bg-[#ed93d5]"
          >
            <span>Concluir Curadoria</span>
            <IconGlyph
              name="arrow_forward"
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </button>
          <p className="px-4 text-center text-[10px] leading-relaxed text-[#444748]">
            Ao finalizar, voce concorda com nossos termos de servico e politica de
            privacidade de luxo.
          </p>
        </div>

        <div className="flex justify-center gap-8 pt-6 text-black/40">
          <IconGlyph name="verified_user" />
          <IconGlyph name="lock" />
          <IconGlyph name="local_shipping" />
        </div>
      </div>
    </aside>
  );
}
