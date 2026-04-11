"use client";

export function LuxuryStaticHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E7DDD4] bg-[#F6F1EB]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 md:px-10 lg:px-14">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-[#C88FA3]" />
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-[#C88FA3]">BelaPop Oficial</p>
            <p className="mt-1 text-sm text-[#5F5A55]">Beauty Intelligence Platform</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.28em] text-[#5F5A55] lg:flex">
          <a href="/" className="transition hover:text-[#C88FA3]">Home</a>
          <a href="/skin-scan" className="transition hover:text-[#C88FA3]">Skin Scan</a>
          <a href="/vitrine" className="transition hover:text-[#C88FA3]">Vitrine</a>
          <a href="/rituais" className="transition hover:text-[#C88FA3]">Rituais</a>
          <a href="/diario" className="transition hover:text-[#C88FA3]">Diario</a>
          <a href="/sobre" className="transition hover:text-[#C88FA3]">Sobre</a>
          <a href="/contato" className="transition hover:text-[#C88FA3]">Contato</a>
        </nav>

        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.28em] text-[#5F5A55] md:gap-6">
          <a href="/login?tab=customer" className="transition hover:text-[#C88FA3]">Entrar</a>
          <a href="/conta/favoritos" className="transition hover:text-[#C88FA3]">Favoritos</a>
          <a href="/carrinho" className="transition hover:text-[#C88FA3]">Carrinho</a>
        </div>
      </div>
    </header>
  );
}
