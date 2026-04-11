import type { ReactNode } from "react";

import { AccessDenied } from "@/components/adm/auth/AccessDenied";
import { canAccessRoute, canAccessPermissions } from "@/lib/adm/auth/guards";
import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";
import type {
  AdmPermission,
  AdmPermissionCheckMode,
  AuthenticatedAdmUser
} from "@/types/adm/auth";

type PermissionGateProps = {
  children: ReactNode;
  fallback?: ReactNode;
  permission?: AdmPermission;
  permissions?: AdmPermission[];
  mode?: AdmPermissionCheckMode;
  route?: string;
  user?: AuthenticatedAdmUser | null;
};

async function resolvePermissionGate({
  permission,
  permissions,
  mode = "all",
  route,
  user
}: Omit<PermissionGateProps, "children" | "fallback">) {
  const resolvedUser = user ?? (await getCurrentAdmUser());
  if (!resolvedUser) return false;

  const permissionsToCheck = permission ? [permission] : permissions ?? [];
  const permissionAllowed =
    permissionsToCheck.length === 0
      ? true
      : canAccessPermissions(resolvedUser, {
          requiredPermissions: permissionsToCheck,
          permissionMode: mode
        });

  const routeAllowed = route ? canAccessRoute(resolvedUser, route).allowed : true;

  return permissionAllowed && routeAllowed;
}

export async function PermissionGate({ children, fallback = null, ...props }: PermissionGateProps) {
  const allowed = await resolvePermissionGate(props);
  return allowed ? <>{children}</> : <>{fallback}</>;
}

export const Can = PermissionGate;

export async function RequirePermission({
  children,
  fallback,
  ...props
}: PermissionGateProps) {
  const allowed = await resolvePermissionGate(props);
  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <AccessDenied
      title="Permissao insuficiente"
      description="Seu perfil interno nao possui acesso para esta acao neste ambiente."
    />
  );
}
