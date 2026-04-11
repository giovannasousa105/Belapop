"use client";

import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "@/components/adm/auth/UserMenu";
import type { AdmChromeVariant } from "@/lib/adm/dashboardTheme";
import { findAdmRouteMeta, getAdmBreadcrumbs } from "@/lib/adm/navigation";
import type { AdmMockProfileOption, AuthenticatedAdmUser } from "@/types/adm/auth";

type AdmTopbarProps = {
  onOpenMenu: () => void;
  user: AuthenticatedAdmUser;
  roleLabel: string;
  showMockSwitcher: boolean;
  mockProfiles: AdmMockProfileOption[];
  variant: AdmChromeVariant;
  maxWidthClass: string;
};

export function AdmTopbar({
  onOpenMenu,
  user,
  roleLabel,
  showMockSwitcher,
  mockProfiles,
  variant,
  maxWidthClass
}: AdmTopbarProps) {
  const pathname = usePathname();
  const route = findAdmRouteMeta(pathname);
  const breadcrumbs = getAdmBreadcrumbs(pathname);
  const isWorkspaceVariant = variant === "workspace";

  return (
    <header
      className={`sticky top-0 z-30 border-b border-[var(--adm-border)] backdrop-blur-xl ${
        isWorkspaceVariant ? "bg-[rgba(255,255,255,0.88)]" : "bg-[rgba(251,249,244,0.9)]"
      }`}
    >
      <div
        className={`mx-auto flex h-[var(--adm-header-height)] w-full ${maxWidthClass} items-center justify-between gap-4 px-4 sm:px-6 lg:px-8`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className={`inline-flex h-11 w-11 items-center justify-center border border-[var(--adm-border)] bg-white text-[var(--adm-text)] lg:hidden ${
              isWorkspaceVariant ? "rounded-xl shadow-[var(--adm-shadow-micro)]" : "rounded-full"
            }`}
            aria-label="Abrir menu do ADM"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <nav className="hidden items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--adm-text-soft)] sm:flex">
              {breadcrumbs.slice(0, 3).map((crumb, index) => {
                const isLast = index === breadcrumbs.slice(0, 3).length - 1;
                return (
                  <span key={crumb.href} className="inline-flex items-center gap-2">
                    {isLast ? (
                      <span className="font-semibold text-[var(--adm-text)]">{crumb.title}</span>
                    ) : (
                      <Link href={crumb.href} className="hover:text-[var(--adm-text)]">
                        {crumb.title}
                      </Link>
                    )}
                    {!isLast ? <span>/</span> : null}
                  </span>
                );
              })}
            </nav>
            <p
              className={`truncate text-sm text-[var(--adm-text)] ${
                isWorkspaceVariant ? "font-medium tracking-[-0.01em]" : "font-semibold"
              }`}
            >
              {route?.title ?? "Central de Controle"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`hidden h-11 w-11 items-center justify-center border border-[var(--adm-border)] bg-white text-[var(--adm-text-soft)] transition hover:text-[var(--adm-text)] sm:inline-flex ${
              isWorkspaceVariant ? "rounded-xl shadow-[var(--adm-shadow-micro)]" : "rounded-full"
            }`}
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>
          <UserMenu
            user={user}
            roleLabel={roleLabel}
            showMockSwitcher={showMockSwitcher}
            mockProfiles={mockProfiles}
            variant={variant}
          />
        </div>
      </div>
    </header>
  );
}
