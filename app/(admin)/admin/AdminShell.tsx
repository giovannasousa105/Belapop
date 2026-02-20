"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";

const adminNav = [
  {
    title: "Painel",
    items: [
      { href: "/admin/curadoria", label: "Curadoria" },
      { href: "/admin/parceiros", label: "Parceiros" },
      { href: "/admin/pedidos", label: "Pedidos" },
      { href: "/admin/diario", label: "Diario" },
      { href: "/admin/config", label: "Config" }
    ]
  }
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();

  if (!ready || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-bpGraphite/70">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-bpBlackSoft">
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">
              Admin BelaPop
            </p>
            <h2 className="mt-1 font-display text-xl text-bpBlack">
              Administracao institucional
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LuxuryButton tone="retail" size="sm" href="/admin/diario/new">
              Novo post
            </LuxuryButton>
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70 hover:text-bpBlackSoft"
            >
              Ver site
            </Link>
            <button
              onClick={logout}
              className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70 hover:text-bpBlackSoft"
            >
              Sair
            </button>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm text-sm">
            {adminNav.map((group) => (
              <div key={group.title} className="flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">
                  {group.title}
                </p>
                <div className="flex flex-col gap-2">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`rounded-2xl border px-4 py-3 transition ${
                          isActive
                            ? "border-bpPink/60 text-bpBlackSoft shadow-sm"
                            : "border-black/10 text-bpGraphite/70 hover:border-bpPink/40 hover:text-bpBlackSoft"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>
          <div className="flex flex-col gap-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
