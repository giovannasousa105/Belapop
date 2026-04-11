import "server-only";

import { redirect } from "next/navigation";

import { getPortalSession, type UserRole as PortalRole } from "@/lib/auth/getRole";
import { pickAllowedPortalRole, portalToLegacyRole, setActiveLegacyRole } from "@/lib/auth/roleState";

type LegacyRole = "customer" | "seller" | "admin";
type AllowedRole = PortalRole | LegacyRole;

type RequireRoleOptions = {
  redirectTo?: string;
  unauthorizedTo?: string;
};

type RequireRoleResult = {
  userId: string;
  role: PortalRole;
  roles: PortalRole[];
};

export async function requireRole(
  roles: AllowedRole | AllowedRole[],
  options: RequireRoleOptions = {}
): Promise<RequireRoleResult> {
  const normalizedAllowedRoles: PortalRole[] = (Array.isArray(roles) ? roles : [roles]).map(
    (role) => {
      if (role === "customer") return "client";
      if (role === "seller") return "partner";
      return role;
    }
  );

  const { userId, role: activeRole, roles: assignedRoles } = await getPortalSession({
    loginRedirectTo: options.redirectTo ?? "/login"
  });

  const matchedRole = pickAllowedPortalRole(
    {
      activeRole: portalToLegacyRole(activeRole),
      activePortalRole: activeRole,
      assignedRoles: assignedRoles.map(portalToLegacyRole),
      assignedPortalRoles: assignedRoles
    },
    normalizedAllowedRoles
  );

  if (!matchedRole) {
    redirect(options.unauthorizedTo ?? "/");
  }

  if (matchedRole !== activeRole) {
    await setActiveLegacyRole({
      userId,
      role: portalToLegacyRole(matchedRole)
    });
  }

  return { userId, role: matchedRole, roles: assignedRoles };
}
