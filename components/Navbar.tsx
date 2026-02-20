"use client";

import Link from "next/link";
import { Heart, ShoppingCart, User } from "lucide-react";
import { usePathname } from "next/navigation";

import { PromoBar } from "@/components/PromoBar";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";

const categories = [
  "Maquiagem",
  "Skincare",
  "Cabelos",
  "Perfumes",
  "Corpo & Banho",
  "Acessórios",
  "Ofertas"
];

export const Navbar = () => {
  const { user, ready: authReady } = useAuth();
  const { itemCount, ready: cartReady } = useCart();
  const pathname = usePathname();
  const isRetail =
    pathname === "/" ||
    pathname === "/catalogo" ||
    pathname === "/products" ||
    pathname.startsWith("/produto/");
  const logoUrl = isRetail
    ? process.env.NEXT_PUBLIC_LOGO_DARK_URL || "/logo-dark.svg"
    : process.env.NEXT_PUBLIC_LOGO_URL || "/logo.svg";
  const actionTone = isRetail ? "text-bpGraphite" : "text-bpPinkSoft/80";
  const actionHover = isRetail ? "hover:text-bpPink" : "hover:text-bpOffWhite";

  const merchantLink = authReady
    ? user
      ? user.role === "seller"
        ? "/seller/dashboard"
        : "/lojistas"
      : "/seller/login"
    : "/seller/login";

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b backdrop-blur ${
        isRetail
          ? "border-black/10 bg-white text-bpBlackSoft shadow-sm"
          : "border-white/10 bg-bpBlack/95 text-bpOffWhite"
      }`}
    >
      <PromoBar tone="dark" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className={`font-display text-lg tracking-[0.3em] transition ${
              isRetail ? "text-bpBlack" : "text-bpOffWhite"
            }`}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="BelaPop"
                className="h-12 w-auto md:h-14"
                loading="eager"
              />
            ) : (
              <span className="inline-flex items-center text-2xl font-semibold text-bpBlack">
                BelaPop
              </span>
            )}
          </Link>
          <SearchBar
            tone={isRetail ? "light" : "dark"}
            className="md:order-none md:flex-1"
            action="/products"
          />
          <div className="flex items-center gap-4 text-xs">
            <Link
              href={
                authReady && user
                  ? user.role === "seller"
                    ? "/seller/dashboard"
                    : "/minha-conta"
                  : "/login"
              }
              className={`flex items-center gap-2 ${actionTone} ${actionHover}`}
            >
              <User size={16} />
              {authReady && user ? "Minha conta" : "Entrar"}
            </Link>
            <Link
              href="/account/favorites"
              className={`flex items-center gap-2 ${actionTone} ${actionHover}`}
            >
              <Heart size={16} />
              Favoritos
            </Link>
            <Link
              href="/carrinho"
              className={`relative flex items-center gap-2 ${actionTone} ${actionHover}`}
            >
              <ShoppingCart size={16} />
              Carrinho
              {cartReady && itemCount > 0 ? (
                <span className="absolute -right-3 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-bpPink px-1 text-[10px] font-semibold text-bpOffWhite">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
        {/* Navegação desktop */}
        <nav
          className={`hidden flex-wrap items-center gap-4 border-t pt-4 text-xs uppercase tracking-[0.3em] md:flex ${
            isRetail
              ? "border-black/10 text-bpGraphite/80"
              : "border-white/10 text-bpPinkSoft/70"
          }`}
        >
          {categories.map((category) => (
            <Link
              key={category}
              href="/products"
              className={`${
                isRetail ? "text-bpGraphite/80 hover:text-bpPink" : "text-bpPinkSoft/70 hover:text-bpOffWhite"
              } ${category === "Ofertas" ? "text-bpPink" : ""}`}
            >
              {category}
            </Link>
          ))}
          <Link
            href="/diario"
            className={`${
              isRetail ? "text-bpGraphite/80 hover:text-bpPink" : "text-bpPinkSoft/70 hover:text-bpOffWhite"
            }`}
          >
            Diário
          </Link>
          <Link
            href={merchantLink}
            className={`${
              isRetail ? "text-bpGraphite/80 hover:text-bpPink" : "text-bpPinkSoft/70 hover:text-bpOffWhite"
            }`}
          >
            Área do Lojista
          </Link>
        </nav>

        {/* Navegação mobile simplificada */}
        <div className="md:hidden">
          <div className="flex items-center justify-between pb-2">
            <p className="text-[10px] uppercase tracking-[0.35em] text-bpGraphite/70">Explorar</p>
            <Link
              href="/products"
              className="text-[11px] uppercase tracking-[0.3em] text-bpPink"
            >
              Ver tudo
            </Link>
          </div>
          <div className="flex w-full gap-2 overflow-x-auto pb-2">
            {[...categories, "Diário", "Lojista"].map((category) => (
              <Link
                key={category}
                href={
                  category === "Diário"
                    ? "/diario"
                    : category === "Lojista"
                    ? merchantLink
                    : "/products"
                }
                className="whitespace-nowrap rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-semibold text-bpGraphite shadow-sm"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

