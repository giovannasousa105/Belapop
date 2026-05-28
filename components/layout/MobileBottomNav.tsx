"use client";

import Link from "next/link";
import { Home, Search, Layers3, Sparkles, User } from "lucide-react";
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

  const accountHref = ready && user ? "/conta" : buildLoginHref("/conta");

  const navItems: NavItem[] = [
    { label: "Início", href: "/", icon: <Home size={20} /> },
    { label: "Buscar", href: "/catalogo", icon: <Search size={20} /> },
  ];

  const rightItems: NavItem[] = [
    { label: "Kits", href: "/kits", icon: <Layers3 size={20} /> },
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
      className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-around border-t border-black/8 bg-[#fcf9f8]/95 backdrop-blur-xl tablet:hidden"
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
          <Sparkles size={22} strokeWidth={1.6} />
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
