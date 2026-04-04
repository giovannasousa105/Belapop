"use client";

import Link from "next/link";

export function LuxuryStaticFooter() {
  return (
    <footer className="border-t border-[#DDD3CA] bg-[#EFE7DE] px-6 py-10 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.2fr_0.85fr_0.85fr_0.85fr_0.85fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#1B1A18]">BelaPop Oficial</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#5F5A55]">
              Marketplace premium de skincare com leitura de pele, curadoria editorial e uma experiencia de compra criada para desejar, descobrir e escolher com mais precisao.
            </p>
            <div className="mt-5 space-y-2 text-sm text-[#5F5A55]">
              <p>contato@belapopoficial.com.br</p>
              <p>WhatsApp Concierge</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#C88FA3]">Comprar</p>
            <div className="mt-4 space-y-3 text-sm text-[#5F5A55]">
              <Link href="/vitrine" className="block transition hover:text-[#1B1A18]">Skincare</Link>
              <Link href="/rituais" className="block transition hover:text-[#1B1A18]">Rituais</Link>
              <Link href="/vitrine" className="block transition hover:text-[#1B1A18]">Vitrine premium</Link>
              <Link href="/vitrine" className="block transition hover:text-[#1B1A18]">Mais vendidos</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#C88FA3]">Institucional</p>
            <div className="mt-4 space-y-3 text-sm text-[#5F5A55]">
              <Link href="/sobre" className="block transition hover:text-[#1B1A18]">Sobre a BelaPop</Link>
              <Link href="/belacode" className="block transition hover:text-[#1B1A18]">Beauty Intelligence</Link>
              <Link href="/diario" className="block transition hover:text-[#1B1A18]">Diario BelaPop</Link>
              <Link href="/contato" className="block transition hover:text-[#1B1A18]">Contato</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#C88FA3]">Atendimento</p>
            <div className="mt-4 space-y-3 text-sm text-[#5F5A55]">
              <Link href="/contato" className="block transition hover:text-[#1B1A18]">Entrega e frete</Link>
              <Link href="/contato" className="block transition hover:text-[#1B1A18]">Trocas e devolucoes</Link>
              <Link href="/contato" className="block transition hover:text-[#1B1A18]">Pagamento seguro</Link>
              <Link href="/contato" className="block transition hover:text-[#1B1A18]">Suporte ao cliente</Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#C88FA3]">Social</p>
            <div className="mt-4 space-y-3 text-sm text-[#5F5A55]">
              <a href="https://instagram.com/belapop.oficial" target="_blank" rel="noreferrer" className="block transition hover:text-[#C88FA3]">Instagram</a>
              <a href="https://tiktok.com/@belapop.oficial" target="_blank" rel="noreferrer" className="block transition hover:text-[#C88FA3]">TikTok</a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="block transition hover:text-[#C88FA3]">Pinterest</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="block transition hover:text-[#C88FA3]">YouTube</a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#DDD3CA] pt-5 text-xs text-[#7A736D] md:flex-row md:items-center md:justify-between">
          <p>(c) 2026 BelaPop Oficial. Todos os direitos reservados.</p>
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
