"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { adminNav, isAdminNavItemActive } from "@/lib/admin/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const renderNav = () => (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {adminNav.map((group) => (
        <div key={group.section} className="mb-5">
          <p className="px-3 text-[11px] uppercase tracking-[0.2em] text-white/68">
            {group.section}
          </p>

          <div className="mt-2 space-y-1">
            {group.items.map((item) => {
              const isActive = isAdminNavItemActive(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 text-sm transition ${
                    isActive
                      ? "border border-bpPink/60 bg-bpPink/20 text-white"
                      : "border border-transparent text-white/96 hover:border-white/15 hover:bg-white/10 hover:text-white"
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
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((current) => !current)}
        className="fixed left-4 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-[#0b0b0f] text-white shadow-sm lg:hidden"
        aria-label={mobileOpen ? "Fechar menu admin" : "Abrir menu admin"}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/10 bg-[#0b0b0f] transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-xs uppercase tracking-[0.22em] text-white/78">BelaPop</p>
          <h2 className="mt-2 text-base font-semibold text-white">Admin Marketplace</h2>
        </div>

        {renderNav()}

        <div className="border-t border-white/10 px-4 py-4">
          <LogoutButton
            redirectTo="/admin/login"
            className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/90 transition hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sair
          </LogoutButton>
        </div>
      </aside>
    </>
  );
}
