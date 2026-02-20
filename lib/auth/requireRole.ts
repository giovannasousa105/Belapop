import "server-only";

import { redirect } from "next/navigation";

import { getPortalSession, type UserRole as PortalRole } from "@/lib/auth/getRole";

type LegacyRole = "customer" | "seller" | "admin";
type AllowedRole = PortalRole | LegacyRole;

type RequireRoleOptions = {
  redirectTo?: string;
  unauthorizedTo?: string;
};

type RequireRoleResult = {
  userId: string;
  role: PortalRole;
};

export async function requireRole(
  roles: AllowedRole | AllowedRole[],
  options: RequireRoleOptions = {}
): Promise<RequireRoleResult> {
  const normalizedAllowedRoles = (Array.isArray(roles) ? roles : [roles]).map((role) => {
    if (role === "customer") return "client";
    if (role === "seller") return "partner";
    return role;
  });

  const { userId, role } = await getPortalSession({
    loginRedirectTo: options.redirectTo ?? "/login"
  });

  if (!normalizedAllowedRoles.includes(role)) {
    redirect(options.unauthorizedTo ?? "/");
  }

  return { userId, role };
}
