import type { ComponentType } from "react";
import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import {
  LayoutDashboard,
  Sparkles,
  Store,
  ShoppingBag,
  Truck,
  ShieldAlert,
  Wallet,
  Users,
  Settings,
} from "lucide-react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
});

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  active?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Clientes", href: "/adm/relacionamento/clientes", icon: Users },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings },
];

function resolveActiveHref(activeHref: string): string | undefined {
  return navItems
    .filter((item) => activeHref === item.href || activeHref.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function FinanceSidebar({ activeHref }: { activeHref: string }) {
  const resolvedActiveHref = resolveActiveHref(activeHref);

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[220px] flex-col border-r border-[rgba(139,94,60,0.10)] bg-[#F4F1EE] py-7">
      <div className="px-6">
        <p className={`${cormorant.className} text-xl tracking-[-0.02em] text-[#1A1714]`}>
          BelaPop
        </p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#9E9589]">
          Painel Administrativo
        </p>
      </div>

      <nav className="mt-7 flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === resolvedActiveHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-white font-semibold text-[#1A1714] shadow-[0_2px_8px_rgba(28,26,24,0.08)]"
                  : "text-[#6B5E54] hover:bg-white/60 hover:text-[#1A1714]"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-[#8B5E3C]" : "text-[#9E9589]"}`}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#8B5E3C]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pb-2">
        <div className="rounded-xl border border-[rgba(139,94,60,0.12)] bg-white p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(139,94,60,0.08)] text-[10px] font-semibold text-[#8B5E3C]">
            A
          </div>
          <p className="mt-2 text-[11px] font-semibold text-[#1A1714]">Admin BelaPop</p>
          <p className="text-[9px] uppercase tracking-[0.16em] text-[#9E9589]">Acesso Master</p>
        </div>
      </div>
    </aside>
  );
}
