"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AccountHeader } from "@/components/AccountHeader";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { label: "Visao Geral", href: "/account" },
  { label: "Pedidos", href: "/account/orders" },
  { label: "Trocas e Devolucoes", href: "/account/returns" },
  { label: "Carteira", href: "/account/wallet" },
  { label: "Pagamentos", href: "/account/payments" },
  { label: "Enderecos", href: "/account/addresses" },
  { label: "Favoritos", href: "/account/favorites" },
  { label: "Avaliacoes", href: "/account/reviews" },
  { label: "Ajuda", href: "/account/support" },
  { label: "Perfil", href: "/account/profile" },
  { label: "Preferencias", href: "/account/preferences" }
];

export const AccountLayoutShell = ({ children }: { children: React.ReactNode }) => {
  const { ready, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role === "seller") {
      router.push("/seller/dashboard");
      return;
    }
    if (user.role === "admin") {
      router.push("/admin/dashboard");
    }
  }, [ready, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-bpGraphite/70">
        <p className="text-sm uppercase tracking-[0.3em] text-bpGraphite/70">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm lg:sticky lg:top-10 lg:h-fit">
          <p className="text-xs uppercase tracking-[0.4em] text-bpGraphite/70">
            Minha Conta
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center border-l-2 px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-bpPink text-bpBlack"
                      : "border-transparent text-bpGraphite/80 hover:text-bpBlackSoft"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-black/5 pt-4 text-sm text-bpGraphite/80">
            <button
              onClick={handleLogout}
              className="w-full text-left text-sm font-medium text-bpGraphite/80 transition hover:text-bpBlackSoft"
            >
              Sair
            </button>
          </div>
        </aside>
        <section className="space-y-6">
          <AccountHeader />
          <div className="space-y-6">{children}</div>
        </section>
      </div>
    </div>
  );
};
