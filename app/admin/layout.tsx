"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";

const adminNav = [
  {
    title: "Visão",
    items: [{ href: "/admin/dashboard", label: "Dashboard" }]
  },
  {
    title: "Operação",
    items: [
      { href: "/admin/orders", label: "Pedidos" },
      { href: "/admin/products", label: "Produtos" },
      { href: "/admin/sellers", label: "Lojistas" }
    ]
  },
  {
    title: "Financeiro",
    items: [{ href: "/admin/finance", label: "Financeiro" }]
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/products/pending", label: "Moderação" },
      { href: "/admin/diario", label: "Diário" },
      { href: "/admin/campaigns", label: "Campanhas" }
    ]
  },
  {
    title: "Suporte",
    items: [{ href: "/admin/support", label: "Tickets" }]
  },
  {
    title: "Ferramentas",
    items: [
      { href: "/admin/carts", label: "Carrinhos" },
      { href: "/admin/settings", label: "Configurações" }
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role !== "admin") {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-noir-500">Carregando...</p>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-noir-500">Acesso restrito.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-noir-900">
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-noir-500">Admin BelaPop</p>
            <h2 className="mt-1 font-display text-xl text-noir-950">Administração institucional</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LuxuryButton tone="retail" size="sm" href="/admin/diario/new">
              Novo post
            </LuxuryButton>
            <Link href="/" className="text-xs uppercase tracking-[0.3em] text-noir-500 hover:text-noir-900">
              Ver site
            </Link>
            <button
              onClick={logout}
              className="text-xs uppercase tracking-[0.3em] text-noir-500 hover:text-noir-900"
            >
              Sair
            </button>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm text-sm">
            {adminNav.map((group) => (
              <div key={group.title} className="flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-[0.3em] text-noir-500">{group.title}</p>
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
                            ? "border-luxe-600/60 text-noir-900 shadow-sm"
                            : "border-black/10 text-noir-500 hover:border-luxe-600/40 hover:text-noir-900"
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
