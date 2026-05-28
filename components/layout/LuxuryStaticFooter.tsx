"use client";

import Link from "next/link";

export function LuxuryStaticFooter() {
  return (
    <footer className="border-t border-[#DDD3CA] bg-[#EFE7DE] px-6 py-10 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#1B1A18]">BelaPop Oficial</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#5F5A55]">
              Marketplace premium de skincare com leitura de pele, curadoria editorial e uma experiência de compra criada para desejar, descobrir e escolher com mais precisão.
            </p>
            <div className="mt-5 space-y-2 text-sm text-[#5F5A55]">
              <p>contato@belapopoficial.com.br</p>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-[#1B1A18]"
              >
                WhatsApp Concierge
              </a>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#C88FA3]">Comprar</p>
            <div className="mt-4 space-y-3 text-sm text-[#5F5A55]">
              <Link href="/skincare" className="block transition hover:text-[#1B1A18]">Skincare</Link>
              <Link href="/maquiagem" className="block transition hover:text-[#1B1A18]">Maquiagem</Link>
              <Link href="/kits" className="block transition hover:text-[#1B1A18]">Kits</Link>
              <Link href="/catalogo" className="block transition hover:text-[#1B1A18]">Catálogo completo</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#C88FA3]">Descubra</p>
            <div className="mt-4 space-y-3 text-sm text-[#5F5A55]">
              <Link href="/skin-scan" className="block transition hover:text-[#1B1A18]">Skin Scan</Link>
              <Link href="/universos" className="block transition hover:text-[#1B1A18]">Universos</Link>
              <Link href="/guias" className="block transition hover:text-[#1B1A18]">Guias</Link>
              <Link href="/popclub" className="block transition hover:text-[#1B1A18]">PopClub</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#C88FA3]">Institucional</p>
            <div className="mt-4 space-y-3 text-sm text-[#5F5A55]">
              <Link href="/sobre" className="block transition hover:text-[#1B1A18]">Sobre a BelaPop</Link>
              <Link href="/contato" className="block transition hover:text-[#1B1A18]">Contato</Link>
              <Link href="/lojistas" className="block transition hover:text-[#1B1A18]">Seja um seller</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#C88FA3]">Atendimento</p>
            <div className="mt-4 space-y-3 text-sm text-[#5F5A55]">
              <Link href="/contato" className="block transition hover:text-[#1B1A18]">Entrega e frete</Link>
              <Link href="/trocas-e-devolucoes" className="block transition hover:text-[#1B1A18]">Trocas e devoluções</Link>
              <Link href="/rastreio" className="block transition hover:text-[#1B1A18]">Rastrear pedido</Link>
              <Link href="/conta/pedidos" className="block transition hover:text-[#1B1A18]">Meus pedidos</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#C88FA3]">Social</p>
            <div className="mt-4 space-y-3 text-sm text-[#5F5A55]">
              <a href="https://instagram.com/belapopoficial" target="_blank" rel="noreferrer" className="block transition hover:text-[#C88FA3]">Instagram</a>
              <a href="https://tiktok.com/@belapopoficial" target="_blank" rel="noreferrer" className="block transition hover:text-[#C88FA3]">TikTok</a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="block transition hover:text-[#C88FA3]">Pinterest</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="block transition hover:text-[#C88FA3]">YouTube</a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#DDD3CA] pt-5 text-xs text-[#7A736D] md:flex-row md:items-center md:justify-between">
          <p>© 2026 BelaPop Oficial. Todos os direitos reservados.</p>
          <div className="flex flex-wrap gap-4 uppercase tracking-[0.18em]">
            <Link href="/aviso-de-privacidade" className="transition hover:text-[#C88FA3]">Privacidade</Link>
            <Link href="/termos-e-condicoes" className="transition hover:text-[#C88FA3]">Termos</Link>
            <Link href="/politica-de-cookies" className="transition hover:text-[#C88FA3]">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
