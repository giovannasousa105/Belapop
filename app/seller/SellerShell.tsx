"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { href: "/seller/dashboard", label: "Dashboard" },
  { href: "/seller/products", label: "Produtos" },
  { href: "/seller/orders", label: "Pedidos" },
  { href: "/seller/profile", label: "Perfil" }
];

const isApprovedStatus = (status?: string) =>
  status === "approved" || status === "active";

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !user) return;
    if (!isApprovedStatus(user.sellerProfile?.status)) {
      router.replace("/seller/activation");
    }
  }, [ready, user, router]);

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
        {!isApprovedStatus(user.sellerProfile?.status) ? (
          <div className="mb-6 rounded-2xl border border-bpPinkSoft bg-bpPinkSoft/20 px-5 py-4 text-sm text-bpPink/90">
            Sua loja ainda nao esta aprovada. Acompanhe em{" "}
            <Link href="/seller/activation" className="text-bpBlackSoft underline">
              /seller/activation
            </Link>
            .
          </div>
        ) : null}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm lg:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">
              Painel do lojista
            </p>
            <p className="mt-1 font-display text-lg text-bpBlack">
              {user?.sellerProfile?.storeName ?? "Sua loja"}
            </p>
          </div>
          <LuxuryButton tone="retail" size="sm" href="/seller/products/new">
            Novo produto
          </LuxuryButton>
        </div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 text-xs shadow-sm lg:hidden">
          <nav className="flex flex-wrap items-center gap-3">
            {navItems.map((item) => {
              const isActive =
                item.href === "/seller/products"
                  ? pathname.startsWith("/seller/products")
                  : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-3 py-2 transition ${
                    isActive
                      ? "border-bpPink/60 text-bpBlackSoft"
                      : "border-black/10 text-bpGraphite/80 hover:border-bpPink/40 hover:text-bpBlackSoft"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={logout}
            className="text-[10px] uppercase tracking-[0.08em] text-bpGraphite/70 hover:text-bpBlackSoft"
          >
            Sair
          </button>
        </div>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="flex h-fit flex-col gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/70">
                Painel do lojista
              </p>
              <h2 className="mt-2 font-display text-2xl text-bpBlack">
                {user?.sellerProfile?.storeName ?? "Sua loja"}
              </h2>
              <p className="mt-2 text-xs text-bpGraphite/70">{user?.email}</p>
            </div>
            <nav className="flex flex-col gap-2 text-sm">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/seller/products"
                    ? pathname.startsWith("/seller/products")
                    : pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? "border-bpPink/60 bg-white text-bpBlackSoft shadow-sm"
                        : "border-black/10 text-bpGraphite/80 hover:border-bpPink/40 hover:text-bpBlackSoft"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-col gap-3">
              <LuxuryButton tone="retail" href="/seller/products/new">
                Novo produto
              </LuxuryButton>
              <LuxuryButton tone="retail" variant="outline" href="/">
                Ver site
              </LuxuryButton>
              <button
                onClick={logout}
                className="text-xs uppercase tracking-[0.08em] text-bpGraphite/70 hover:text-bpBlackSoft"
              >
                Sair
              </button>
            </div>
          </aside>
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-bpGraphite/70">
                  Painel institucional
                </p>
                <h1 className="mt-2 font-display text-2xl text-bpBlack">
                  Gestao de catalogo e operacao
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LuxuryButton tone="retail" variant="outline" href="/seller/products">
                  Gerenciar produtos
                </LuxuryButton>
                <LuxuryButton tone="retail" href="/seller/products/new">
                  Criar produto
                </LuxuryButton>
              </div>
            </header>
            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
