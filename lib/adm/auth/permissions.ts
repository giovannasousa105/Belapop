import type {
  AdmPermission,
  AdmPermissionCheckMode,
  AuthenticatedAdmUser
} from "@/types/adm/auth";

export const ADM_PERMISSIONS: AdmPermission[] = [
  "view_dashboard",
  "view_quality",
  "manage_products",
  "approve_products",
  "manage_sellers",
  "manage_logistics",
  "manage_finance",
  "manage_refunds",
  "manage_documents",
  "manage_reviews",
  "manage_campaigns",
  "manage_users",
  "view_reports",
  "manage_settings",
  "view_activity_logs",
  "view_customers"
];

const toPermissionSet = (user: AuthenticatedAdmUser | null | undefined) =>
  new Set(user?.permissions ?? []);

export function hasPermission(
  user: AuthenticatedAdmUser | null | undefined,
  permission: AdmPermission
) {
  return toPermissionSet(user).has(permission);
}

export function hasAnyPermission(
  user: AuthenticatedAdmUser | null | undefined,
  permissions: readonly AdmPermission[]
) {
  const permissionSet = toPermissionSet(user);
  return permissions.some((permission) => permissionSet.has(permission));
}

export function hasAllPermissions(
  user: AuthenticatedAdmUser | null | undefined,
  permissions: readonly AdmPermission[]
) {
  const permissionSet = toPermissionSet(user);
  return permissions.every((permission) => permissionSet.has(permission));
}

export function hasPermissions(
  user: AuthenticatedAdmUser | null | undefined,
  permissions: readonly AdmPermission[],
  mode: AdmPermissionCheckMode = "all"
) {
  if (permissions.length === 0) return true;
  return mode === "any"
    ? hasAnyPermission(user, permissions)
    : hasAllPermissions(user, permissions);
}
