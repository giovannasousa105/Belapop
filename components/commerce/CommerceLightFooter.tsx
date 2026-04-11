"use client";

import Link from "next/link";

export function CommerceLightFooter() {
  return (
    <footer className="bg-[#f6f3f2] px-6 pb-32 pt-16 text-[#1c1b1b] sm:px-8 lg:px-12 lg:pb-16">
      <div className="mx-auto max-w-screen-2xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="space-y-5">
            <div className="[font-family:var(--font-playfair)] text-2xl font-semibold tracking-[-0.02em]">
              BelaPop
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#444748]">
              Curadoria de beleza com seleção precisa, parceiros verificados e experiência de compra
              transparente.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#444748]">
              Shop
            </h4>
            <div className="space-y-2 text-sm text-[#444748]">
              <Link href="/skincare" className="block transition-colors hover:text-black">
                Skincare
              </Link>
              <Link href="/maquiagem" className="block transition-colors hover:text-black">
                Maquiagem
              </Link>
              <Link href="/cabelos" className="block transition-colors hover:text-black">
                Cabelos
              </Link>
              <Link href="/perfumes" className="block transition-colors hover:text-black">
                Perfumes
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#444748]">
              Atendimento
            </h4>
            <div className="space-y-2 text-sm text-[#444748]">
              <Link href="/contato" className="block transition-colors hover:text-black">
                Contato
              </Link>
              <Link href="/rastreio" className="block transition-colors hover:text-black">
                Rastrear pedido
              </Link>
              <Link href="/termos-e-condicoes" className="block transition-colors hover:text-black">
                Termos de uso
              </Link>
              <Link href="/aviso-de-privacidade" className="block transition-colors hover:text-black">
                Privacidade
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#444748]">
              Institucional
            </h4>
            <div className="space-y-2 text-sm text-[#444748]">
              <p>63.945.608 GIOVANNA DE SOUSA FERREIRA SANTOS</p>
              <p>CNPJ 63.945.608/0001-09</p>
              <p>Rua Coromandel, 189, Bairro Amorim, Araguari/MG, CEP 38446-093</p>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-black/10 pt-8">
          <p className="text-center text-[10px] uppercase tracking-[0.18em] text-[#747878] md:text-left">
            © 2026 BelaPop Cosméticos Ltda. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
