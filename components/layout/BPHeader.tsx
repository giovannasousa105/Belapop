"use client";

import Link from "next/link";
import { Heart, Search, ShoppingCart, User } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";

const navItems = [
  { href: "/catalogo", label: "Catalogo" },
  { href: "/#rituais", label: "Rituais" },
  { href: "/diario", label: "Diario" },
  { href: "/sobre", label: "Sobre" }
];

export function BPHeader() {
  const pathname = usePathname();
  const { user, ready: authReady } = useAuth();
  const { itemCount, ready: cartReady } = useCart();
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || "/logo.svg";

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-bpBlack text-bpOffWhite">
      <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center gap-6 px-4 md:px-8">
        <Link href="/" className="shrink-0" aria-label="BelaPop">
          <img src={logoUrl} alt="BelaPop" className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.28em] md:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/#")
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "text-bpPinkSoft" : "text-bpOffWhite/75 hover:text-bpOffWhite"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href={authReady && user ? "/minha-conta" : "/login"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-bpOffWhite/20 text-bpOffWhite/80 hover:text-bpOffWhite"
              aria-label="Conta"
            >
              <User size={16} />
            </Link>
            <Link
              href="/account/favorites"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-bpOffWhite/20 text-bpOffWhite/80 hover:text-bpOffWhite"
              aria-label="Favoritos"
            >
              <Heart size={16} />
            </Link>
            <Link
              href="/carrinho"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-bpOffWhite/20 text-bpOffWhite/80 hover:text-bpOffWhite"
              aria-label="Carrinho"
            >
              <ShoppingCart size={16} />
              {cartReady && itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-bpPink px-1 text-[10px] font-semibold text-bpOffWhite">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>

          <Button href="/catalogo" size="sm" className="hidden md:inline-flex">
            Explorar curadoria
          </Button>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/catalogo"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-bpOffWhite/20 text-bpOffWhite/80"
              aria-label="Buscar no catalogo"
            >
              <Search size={16} />
            </Link>
            <Link
              href="/carrinho"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-bpOffWhite/20 text-bpOffWhite/80"
              aria-label="Carrinho"
            >
              <ShoppingCart size={16} />
              {cartReady && itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-bpPink px-1 text-[10px] font-semibold text-bpOffWhite">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
