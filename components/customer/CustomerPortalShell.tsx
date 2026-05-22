"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CircleHelp, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useMemo, useState } from "react";

import PortalRoleSwitcher from "@/components/PortalRoleSwitcher";
import PortalBackButton from "@/components/navigation/PortalBackButton";
import { useAuth } from "@/lib/AuthContext";

type NavItem = {
  label: string;
  href: string;
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    section: "Visão geral",
    items: [
      { label: "Conta", href: "/conta" },
      { label: "Favoritos", href: "/conta/favoritos" },
      { label: "PopClub", href: "/popclub" }
    ]
  },
  {
    section: "Pedidos",
    items: [
      { label: "Meus Pedidos", href: "/conta/pedidos" },
      { label: "Rastreio", href: "/conta/rastreio" },
      { label: "Devoluções", href: "/conta/devolucoes" },
      { label: "Reclamações e Suporte", href: "/conta/reclamacoes-suporte" },
      { label: "Mensagens", href: "/conta/mensagens" }
    ]
  },
  {
    section: "Conta",
    items: [
      { label: "Dados", href: "/conta/dados" },
      { label: "Endereços", href: "/conta/enderecos" },
      { label: "Segurança", href: "/conta/seguranca" },
      { label: "Pagamentos", href: "/conta/pagamentos" },
      { label: "Preferências", href: "/conta/privacidade-preferencias" }
    ]
  },
  {
    section: "Skin Intelligence",
    items: [
      { label: "Minha Rotina", href: "/conta/skincare" }
    ]
  }
];

const isItemActive = (pathname: string | null, href: string) => {
  if (!pathname) return false;
  if (href === "/conta") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function CustomerPortalShell({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const userLabel = useMemo(() => {
    if (!user?.name) return "Cliente BelaPop";
    return user.name;
  }, [user?.name]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = search.trim();
    if (!term) return;
    router.push(`/conta/pedidos?q=${encodeURIComponent(term)}`);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace("/login?tab=customer");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  const closeDrawer = () => setDrawerOpen(false);

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <div className="border-b border-white/10 px-6 py-7">
        <p className="text-xs uppercase tracking-[0.34em] text-white/78">BelaPop</p>
        <p className="mt-2 font-display text-[2rem] leading-none text-white">Painel</p>
        <p className="mt-3 text-sm text-white/92">{userLabel}</p>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-5 py-7">
        {NAV_SECTIONS.map((group) => (
          <div key={group.section}>
            <p className="px-2 text-[11px] uppercase tracking-[0.32em] text-white/68">
              {group.section}
            </p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={`group relative flex items-center rounded-xl px-4 py-2.5 text-sm transition ${
                      active
                        ? "text-white"
                        : "text-white/95 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span
                      className={`absolute bottom-2 left-0 top-2 w-[2px] rounded-full ${
                        active ? "bg-[#d14a7a]" : "bg-transparent group-hover:bg-white/20"
                      }`}
                      aria-hidden
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-5">
        <PortalRoleSwitcher variant="dark" className="mb-3" compact />
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full rounded-full border border-white/20 bg-white/[0.03] px-4 py-2.5 text-left text-sm font-medium text-white/90 transition hover:border-white/40 hover:bg-white/[0.1] hover:text-white disabled:opacity-60"
        >
          {isLoggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f3f1f5] text-bpBlackSoft">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[292px] flex-col bg-[#04060d] text-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={closeDrawer}
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col bg-[#04060d] text-white transition-transform duration-300 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menu de navegação"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={closeDrawer}
          className="absolute right-4 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        <SidebarContent onLinkClick={closeDrawer} />
      </aside>

      {/* Top header */}
      <header className="fixed inset-x-0 top-0 z-20 border-b border-black/10 bg-white/95 backdrop-blur lg:left-[292px]">
        <div className="mx-auto w-full max-w-[1400px] px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setDrawerOpen(true)}
              className="order-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-bpBlackSoft transition hover:border-black/30 lg:hidden"
            >
              <Menu size={18} />
            </button>

            <PortalBackButton
              fallbackHref="/"
              className="order-1 hidden sm:order-1 sm:flex"
            />

            <form
              onSubmit={handleSearch}
              className="order-3 flex w-full min-w-0 items-center gap-2 sm:order-2 sm:flex-1"
            >
              <label
                htmlFor="customer-portal-search"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/15 bg-bpOffWhite text-bpBlackSoft"
              >
                <Search size={18} />
              </label>
              <input
                id="customer-portal-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar pedido, produto ou protocolo"
                className="h-11 min-w-0 flex-1 rounded-full border border-black/15 bg-white px-4 text-sm text-bpBlackSoft placeholder:text-bpGraphite/70 focus:border-bpPink/50 focus:outline-none"
              />
            </form>

            <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
              <button
                type="button"
                aria-label="Notificações"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-bpBlackSoft transition hover:border-black/30 hover:text-bpBlack"
              >
                <Bell size={18} />
              </button>
              <Link
                href="/conta/reclamacoes-suporte"
                aria-label="Ajuda"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-bpBlackSoft transition hover:border-black/30 hover:text-bpBlack"
              >
                <CircleHelp size={18} />
              </Link>
              <Link
                href="/conta/dados"
                aria-label="Perfil"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white text-bpBlackSoft transition hover:border-black/30 hover:text-bpBlack"
              >
                <User size={18} />
              </Link>
              <Link
                href="/catalogo"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-bpPink/40 bg-bpPink/10 px-4 text-sm font-medium text-bpBlackSoft transition hover:border-bpPink/70 hover:bg-bpPink/20"
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Comprar</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pb-10 pt-24 sm:px-6 lg:pl-[324px] lg:pr-8 lg:pt-28">
        <div className="mx-auto w-full max-w-[1320px]">{children}</div>
      </main>
    </div>
  );
}
