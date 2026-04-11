"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AdmSidebar } from "@/components/adm/AdmSidebar";
import { AdmTopbar } from "@/components/adm/AdmTopbar";
import {
  executiveWorkspaceMaxWidthClass,
  type AdmChromeVariant
} from "@/lib/adm/dashboardTheme";
import type { AdmNavGroup } from "@/lib/adm/navigation";
import type { AdmMockProfileOption, AuthenticatedAdmUser } from "@/types/adm/auth";

type AdmChromeProps = {
  children: React.ReactNode;
  user: AuthenticatedAdmUser;
  roleLabel: string;
  navigationGroups: AdmNavGroup[];
  showMockSwitcher: boolean;
  mockProfiles: AdmMockProfileOption[];
};

export function AdmChrome({
  children,
  user,
  roleLabel,
  navigationGroups,
  showMockSwitcher,
  mockProfiles
}: AdmChromeProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const bypassChromeRoutes = new Set([
    "/adm/dashboard-executivo",
    "/adm/financeiro",
    "/adm/financeiro/reembolsos",
    "/adm/financeiro/repasses",
    "/adm/financeiro/auditoria",
    "/adm/financeiro/risco",
    "/adm/gestao/relatorios",
    "/adm/catalogo-marca/inteligencia",
    "/adm/catalogo-marca/campanhas",
    "/adm/catalogo-marca/conteudo-vitrines",
    "/adm/operacao/pedidos-criticos",
    "/adm/operacao/parceiros",
    "/adm/operacao/logistica",
    "/adm/operacao/comunicacao-sellers",
    "/adm/gestao/configuracoes",
    "/adm/curadoria/regras",
    "/adm/curadoria/historico-versoes",
    "/adm/curadoria/monitoramento"
  ]);
  const variant: AdmChromeVariant = bypassChromeRoutes.has(pathname) ? "workspace" : "default";
  const maxWidthClass =
    variant === "workspace" ? executiveWorkspaceMaxWidthClass : "max-w-[1560px]";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (variant === "workspace") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--adm-bg)] text-[var(--adm-text)]">
      <AdmSidebar
        mobileOpen={mobileOpen}
        groups={navigationGroups}
        onCloseMobile={() => setMobileOpen(false)}
        user={user}
        roleLabel={roleLabel}
        variant={variant}
      />

      <div className="lg:pl-[var(--adm-sidebar-width)]">
        <AdmTopbar
          onOpenMenu={() => setMobileOpen(true)}
          user={user}
          roleLabel={roleLabel}
          showMockSwitcher={showMockSwitcher}
          mockProfiles={mockProfiles}
          variant={variant}
          maxWidthClass={maxWidthClass}
        />
        <main
          className={`mx-auto w-full ${maxWidthClass} px-4 pb-10 pt-6 sm:px-6 sm:pb-12 lg:px-8 lg:pt-8`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
