import "server-only";

import type {
  AdmPermission,
  AdmPermissionCheckMode,
  AuthenticatedAdmUser
} from "@/types/adm/auth";

import { ADM_DEFAULT_HOME_BY_ROLE, ADM_AUTH_LOGIN_PATH } from "@/lib/adm/auth/config";
import { getAdmSessionState } from "@/lib/adm/auth/current-user";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  hasPermissions
} from "@/lib/adm/auth/permissions";
import {
  admSidebarGroups,
  findAdmRouteDefinition,
  type AdmNavGroup,
  type AdmNavItem
} from "@/lib/adm/navigation";

export { hasPermission, hasAnyPermission, hasAllPermissions };

export type RouteAccessResult = {
  allowed: boolean;
  reason: "allowed" | "unauthenticated" | "forbidden";
  item: AdmNavItem | null;
};

type PermissionedItem = {
  requiredPermissions?: AdmPermission[];
  permissionMode?: AdmPermissionCheckMode;
};

type RouteAwareItem = {
  href: string;
};

export type PermissionedAction<TAction> = TAction & PermissionedItem;

const normalizePathname = (pathname: string) => {
  if (!pathname) return "/adm";
  const pathWithoutQuery = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (pathWithoutQuery.length > 1 && pathWithoutQuery.endsWith("/")) {
    return pathWithoutQuery.slice(0, -1);
  }
  return pathWithoutQuery;
};

export function canAccessPermissions(
  user: AuthenticatedAdmUser | null | undefined,
  item: PermissionedItem
) {
  return hasPermissions(user, item.requiredPermissions ?? [], item.permissionMode ?? "all");
}

export function canAccessRoute(
  user: AuthenticatedAdmUser | null | undefined,
  pathname: string
): RouteAccessResult {
  if (!user) {
    return {
      allowed: false,
      reason: "unauthenticated",
      item: null
    };
  }

  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath === ADM_AUTH_LOGIN_PATH) {
    return {
      allowed: true,
      reason: "allowed",
      item: null
    };
  }

  const routeItem = findAdmRouteDefinition(normalizedPath);
  if (!routeItem) {
    return {
      allowed: true,
      reason: "allowed",
      item: null
    };
  }

  const allowed = canAccessPermissions(user, routeItem);
  return {
    allowed,
    reason: allowed ? "allowed" : "forbidden",
    item: routeItem
  };
}

const filterNavItems = (
  user: AuthenticatedAdmUser,
  items: AdmNavItem[]
): AdmNavItem[] =>
  items.flatMap((item) => {
    if (!canAccessPermissions(user, item)) {
      return [];
    }

    const children = item.children ? filterNavItems(user, item.children) : undefined;
    return [
      {
        ...item,
        children: children && children.length > 0 ? children : undefined
      }
    ];
  });

export function getAuthorizedAdmSidebarGroups(user: AuthenticatedAdmUser): AdmNavGroup[] {
  return admSidebarGroups
    .map((group) => ({
      ...group,
      items: filterNavItems(user, group.items)
    }))
    .filter((group) => group.items.length > 0);
}

export function getDefaultAdmLandingPath(user: AuthenticatedAdmUser) {
  const preferredPath = ADM_DEFAULT_HOME_BY_ROLE[user.role];
  if (canAccessRoute(user, preferredPath).allowed) {
    return preferredPath;
  }

  const firstVisibleRoute = getAuthorizedAdmSidebarGroups(user)
    .flatMap((group) => group.items)
    .find((item) => item.href !== ADM_AUTH_LOGIN_PATH);

  return firstVisibleRoute?.href ?? "/adm";
}

export function buildAdmLoginHref(pathname?: string, reason?: "missing" | "expired" | "invalid") {
  const params = new URLSearchParams();
  const normalizedPath = pathname ? normalizePathname(pathname) : "";

  if (normalizedPath && normalizedPath !== ADM_AUTH_LOGIN_PATH) {
    params.set("next", normalizedPath);
  }

  if (reason === "expired") {
    params.set("reason", "session-expired");
  } else if (reason === "invalid") {
    params.set("reason", "invalid-session");
  }

  const query = params.toString();
  return query ? `${ADM_AUTH_LOGIN_PATH}?${query}` : ADM_AUTH_LOGIN_PATH;
}

export async function requireAdmSession() {
  const state = await getAdmSessionState();
  return state;
}

export function filterRouteItems<TItem extends RouteAwareItem>(
  user: AuthenticatedAdmUser,
  items: TItem[]
) {
  return items.filter((item) => canAccessRoute(user, item.href).allowed);
}

export function filterPermissionedActions<TAction>(
  user: AuthenticatedAdmUser,
  actions: PermissionedAction<TAction>[]
) {
  return actions.filter((action) => canAccessPermissions(user, action));
}
