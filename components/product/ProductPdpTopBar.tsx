import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";

type HeaderSection = "skincare" | "maquiagem" | "cabelos" | "perfumes";

const sectionLinks: Array<{ href: string; label: string; section: HeaderSection }> = [
  { href: "/skincare", label: "Skincare", section: "skincare" },
  { href: "/maquiagem", label: "Maquiagem", section: "maquiagem" },
  { href: "/cabelos", label: "Cabelos", section: "cabelos" },
  { href: "/perfumes", label: "Perfumes", section: "perfumes" }
];

export function ProductPdpTopBar({ activeSection }: { activeSection: HeaderSection }) {
  const activeLabel = sectionLinks.find((item) => item.section === activeSection)?.label ?? "Skincare";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-[#ffffffcc] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <details className="group relative">
            <summary
              aria-label="Abrir menu"
              className="inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center text-[#1c1b1b]"
            >
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute left-0 top-12 z-[70] w-[84vw] max-w-[320px] border border-black/10 bg-[#fcf9f8] p-4 shadow-[0_25px_50px_rgba(0,0,0,0.12)]">
              <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-[#747878]">
                Categoria ativa: {activeLabel}
              </p>
              <div className="space-y-2">
                {sectionLinks.map((item) => (
                  <Link
                    key={item.section}
                    href={item.href}
                    className="block border border-black/10 bg-white px-3 py-3 font-headline text-2xl leading-none text-[#1c1b1b]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Link
                  href="/catalogo"
                  className="flex min-h-11 items-center justify-center border border-black bg-black px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
                >
                  Buscar produtos
                </Link>
                <Link
                  href="/conta"
                  className="flex min-h-11 items-center justify-center border border-black/15 bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1c1b1b]"
                >
                  Minha conta
                </Link>
              </div>
            </div>
          </details>
          <Link
            href="/catalogo"
            aria-label="Buscar produtos"
            className="inline-flex h-11 w-11 items-center justify-center text-[#1c1b1b]"
          >
            <Search className="h-5 w-5" />
          </Link>
        </div>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-headline text-[1.35rem] font-bold tracking-tight text-[#1c1b1b]"
        >
          ATELIER SKN
        </Link>

        <div className="flex items-center gap-1 lg:hidden">
          <Link
            href="/carrinho"
            aria-label="Abrir sacola"
            className="inline-flex h-11 w-11 items-center justify-center text-[#1c1b1b]"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="hidden border-t border-black/5 lg:block">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            {sectionLinks.map((item) => (
              <Link
                key={item.section}
                href={item.href}
                className={`border-b pb-1 text-xs font-semibold uppercase tracking-[0.22em] ${
                  item.section === activeSection
                    ? "border-black text-black"
                    : "border-transparent text-[#5f5e5e] hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[#1c1b1b]">
            <Link
              href="/catalogo"
              aria-label="Buscar produtos"
              className="inline-flex h-10 w-10 items-center justify-center"
            >
              <Search className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/conta/favoritos"
              aria-label="Favoritos"
              className="inline-flex h-10 w-10 items-center justify-center"
            >
              <Heart className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/conta"
              aria-label="Minha conta"
              className="inline-flex h-10 w-10 items-center justify-center"
            >
              <User className="h-4.5 w-4.5" />
            </Link>
            <Link
              href="/carrinho"
              aria-label="Sacola"
              className="inline-flex h-10 w-10 items-center justify-center"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
