"use client";

import Link from "next/link";
import { Home, Search, Heart, User } from "lucide-react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";
import { buildLoginHref } from "@/lib/auth/redirects";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  const favoritesHref = ready && user ? "/conta/favoritos" : buildLoginHref("/conta/favoritos");
  const accountHref = ready && user ? "/conta" : buildLoginHref("/conta");

  const navItems: NavItem[] = [
    { label: "Início", href: "/", icon: <Home size={20} /> },
    { label: "Buscar", href: "/catalogo", icon: <Search size={20} /> },
  ];

  const rightItems: NavItem[] = [
    { label: "Desejos", href: favoritesHref, icon: <Heart size={20} /> },
    { label: "Conta", href: accountHref, icon: <User size={20} /> },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href.split("?")[0]) ?? false;
  }

  const itemClass = (href: string) =>
    `flex flex-col items-center gap-1 min-w-[44px] py-1 text-[10px] uppercase tracking-[0.12em] transition-colors ${
      isActive(href) ? "text-[#1c1b1b]" : "text-[#9a928e]"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-around border-t border-black/8 bg-[#fcf9f8]/95 backdrop-blur-xl"
      style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))", paddingTop: 6 }}
      aria-label="Navegação mobile"
    >
      {navItems.map((item) => (
        <Link key={item.label} href={item.href} className={itemClass(item.href)}>
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}

      {/* Botão central destacado — Skin Scan */}
      <Link
        href="/skin-scan"
        aria-label="Skin Scan"
        className="relative flex flex-col items-center gap-1"
        style={{ top: -10 }}
      >
        <span
          className="flex items-center justify-center rounded-full bg-[#1c1b1b] text-[#fcf9f8] shadow-[0_8px_24px_rgba(28,27,27,0.28)] transition-transform hover:scale-105"
          style={{ width: 52, height: 52 }}
          aria-hidden="true"
        >
          {/* camera-selfie aproximado com ícone SVG simples */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <span className="text-[10px] uppercase tracking-[0.12em] text-[#1c1b1b]">Scan</span>
      </Link>

      {rightItems.map((item) => (
        <Link key={item.label} href={item.href} className={itemClass(item.href)}>
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
