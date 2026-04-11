import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/adm/auth/AccessDenied";
import { AdmChrome } from "@/components/adm/AdmChrome";
import {
  buildAdmLoginHref,
  canAccessRoute,
  getAuthorizedAdmSidebarGroups,
  getDefaultAdmLandingPath
} from "@/lib/adm/auth/guards";
import {
  getAdmMockProfiles,
  getAdmSessionState,
  isAdmMockShortcutEnabled
} from "@/lib/adm/auth/current-user";
import { getAdmRoleLabel } from "@/lib/adm/auth/roles";
import { findAdmRouteMeta } from "@/lib/adm/navigation";

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdmLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/adm";
  const sessionState = await getAdmSessionState();

  if (pathname === "/adm/login") {
    if (sessionState.user) {
      redirect(getDefaultAdmLandingPath(sessionState.user));
    }
    return <>{children}</>;
  }

  if (!sessionState.user) {
    redirect(
      buildAdmLoginHref(
        pathname,
        sessionState.reason === "authenticated" ? undefined : sessionState.reason
      )
    );
  }

  const currentUser = sessionState.user;
  const routeAccess = canAccessRoute(currentUser, pathname);
  const navigationGroups = getAuthorizedAdmSidebarGroups(currentUser);
  const roleLabel = getAdmRoleLabel(currentUser.role);
  const defaultLandingPath = getDefaultAdmLandingPath(currentUser);
  const showMockSwitcher = isAdmMockShortcutEnabled();
  const mockProfiles = showMockSwitcher ? getAdmMockProfiles() : [];

  if (!routeAccess.allowed) {
    const routeMeta = findAdmRouteMeta(pathname);

    return (
      <AdmChrome
        user={currentUser}
        roleLabel={roleLabel}
        navigationGroups={navigationGroups}
        showMockSwitcher={showMockSwitcher}
        mockProfiles={mockProfiles}
      >
        <AccessDenied
          title="Acesso restrito a este modulo"
          description="Seu perfil interno esta autenticado, mas nao possui permissao para abrir esta rota do ADM."
          detail={routeMeta ? `${routeMeta.title} - ${roleLabel}` : roleLabel}
          actionHref={defaultLandingPath}
          actionLabel="Voltar ao meu painel"
        />
      </AdmChrome>
    );
  }

  return (
    <AdmChrome
      user={currentUser}
      roleLabel={roleLabel}
      navigationGroups={navigationGroups}
      showMockSwitcher={showMockSwitcher}
      mockProfiles={mockProfiles}
    >
      {children}
    </AdmChrome>
  );
}
