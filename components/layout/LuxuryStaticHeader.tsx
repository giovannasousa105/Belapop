"use client";

export function LuxuryStaticHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E7DDD4] bg-[#F6F1EB]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 md:px-10 lg:px-14">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-full bg-[#C88FA3]" />
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-[#C88FA3]">BelaPop Oficial</p>
            <p className="mt-1 text-sm text-[#5F5A55]">Loja, Skin Scan e PopClub no mesmo ecossistema</p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.28em] text-[#5F5A55] lg:flex">
          <a href="/catalogo" className="transition hover:text-[#C88FA3]">Loja</a>
          <a href="/skin-scan" className="transition hover:text-[#C88FA3]">Skin Scan</a>
          <a href="/popclub" className="transition hover:text-[#C88FA3]">PopClub</a>
          <a href="/diario" className="transition hover:text-[#C88FA3]">Diario</a>
          <a href="/conta" className="transition hover:text-[#C88FA3]">Conta</a>
          <a href="/carrinho" className="transition hover:text-[#C88FA3]">Carrinho</a>
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
