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

export default function SellerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/seller/login" || pathname === "/seller/register";

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      if (!isAuthRoute) {
        router.replace("/seller/login");
      }
      return;
    }

    if (user.role !== "seller") {
      router.replace("/");
      return;
    }

    if (isAuthRoute) {
      router.replace("/seller/dashboard");
    }
  }, [ready, user, router, isAuthRoute]);

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-noir-500">Carregando...</p>
      </div>
    );
  }

  if (!user && !isAuthRoute) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-noir-500">Redirecionando...</p>
      </div>
    );
  }

  if (user && user.role !== "seller") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-noir-500">Acesso restrito.</p>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <div className="relative min-h-[100vh]">
        <div className="absolute inset-0 bg-luxe-glow opacity-80" />
        <div className="relative z-10 mx-auto flex min-h-[100vh] w-full max-w-5xl flex-col px-6 py-12">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="font-display text-lg tracking-[0.2em] text-blush-50"
            >
              BelaPop
            </Link>
            <Link
              href="/"
              className="text-xs uppercase tracking-luxe text-blush-100/70 hover:text-blush-50"
            >
              Voltar ao site
            </Link>
          </div>
          <div className="mt-8 flex-1">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-noir-900">
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm lg:hidden">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-noir-500">
              Painel do lojista
            </p>
            <p className="mt-1 font-display text-lg text-noir-950">
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
                      ? "border-luxe-600/60 text-noir-900"
                      : "border-black/10 text-noir-600 hover:border-luxe-600/40 hover:text-noir-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={logout}
            className="text-[10px] uppercase tracking-luxe text-noir-500 hover:text-noir-900"
          >
            Sair
          </button>
        </div>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="flex h-fit flex-col gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-noir-500">
                Painel do lojista
              </p>
              <h2 className="mt-2 font-display text-2xl text-noir-950">
                {user?.sellerProfile?.storeName ?? "Sua loja"}
              </h2>
              <p className="mt-2 text-xs text-noir-500">{user?.email}</p>
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
                        ? "border-luxe-600/60 bg-white text-noir-900 shadow-sm"
                        : "border-black/10 text-noir-600 hover:border-luxe-600/40 hover:text-noir-900"
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
                className="text-xs uppercase tracking-luxe text-noir-500 hover:text-noir-900"
              >
                Sair
              </button>
            </div>
          </aside>
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-luxe text-noir-500">
                  Painel institucional
                </p>
                <h1 className="mt-2 font-display text-2xl text-noir-950">
                  Gestão de catálogo e operação
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
