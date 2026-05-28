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

  const userInitial = userLabel.charAt(0).toUpperCase();

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <div className="border-b border-white/8 px-6 py-7">
        <p className="font-display text-xl tracking-[0.15em] text-white/90">BelaPop</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.5em] text-[#d4845f]/60">Curadoria exclusiva</p>
      </div>

      <div className="border-b border-white/8 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d4845f] to-[#a85a38] text-sm font-medium text-white">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white/90">{userLabel}</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4845f]/70">PopClub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {NAV_SECTIONS.map((group) => (
          <div key={group.section}>
            <p className="mb-2 px-3 text-[9px] uppercase tracking-[0.45em] text-white/30">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={`flex items-center rounded-xl px-4 py-2.5 text-sm transition ${
                      active
                        ? "border border-white/8 bg-white/8 text-white"
                        : "text-white/50 hover:bg-white/5 hover:text-white/80"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/8 px-5 py-5">
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[292px] flex-col border-r border-white/5 bg-[#0e0c0b] text-white lg:flex">
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r border-white/5 bg-[#0e0c0b] text-white transition-transform duration-300 lg:hidden ${
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
      <header className="fixed inset-x-0 top-0 z-20 border-b border-[#e8e0d8]/80 bg-[#fdfcfb]/95 shadow-[0_1px_12px_rgba(30,15,5,0.06)] backdrop-blur-md lg:left-[292px]">
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
