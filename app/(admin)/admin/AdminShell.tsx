"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Sidebar from "@/components/admin/sidebar";
import { LuxuryButton } from "@/components/LuxuryButton";
import LogoutButton from "@/components/LogoutButton";
import PortalBackButton from "@/components/navigation/PortalBackButton";
import PortalRoleSwitcher from "@/components/PortalRoleSwitcher";
import { useAuth } from "@/lib/AuthContext";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();

  const isDashboardRoute =
    pathname === "/admin/dashboard" || pathname.startsWith("/admin/dashboard/");

  // Dashboard has its own full-screen shell (sidebar + topbar). Avoid double wrapping.
  if (isDashboardRoute) {
    return <>{children}</>;
  }

  if (!ready || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-bpGraphite/70">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Sidebar />
      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="pl-12 lg:pl-0">
              <PortalBackButton fallbackHref="/admin/dashboard" className="mb-3" />
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin BelaPop</p>
              <h2 className="text-lg font-semibold text-slate-900">Administracao institucional</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PortalRoleSwitcher variant="light" compact />
              <LuxuryButton tone="retail" size="sm" href="/admin/diario/new">
                Novo post
              </LuxuryButton>
              <Link
                href="/admin/dashboard"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Ver site
              </Link>
              <LogoutButton
                redirectTo="/admin/login"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sair
              </LogoutButton>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
