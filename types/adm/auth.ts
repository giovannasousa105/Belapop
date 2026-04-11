export type AdmRole =
  | "admin_master"
  | "curadoria"
  | "financeiro"
  | "logistica"
  | "operacao"
  | "catalogo_marca"
  | "suporte"
  | "leitura";

export type AdmPermission =
  | "view_dashboard"
  | "view_quality"
  | "manage_products"
  | "approve_products"
  | "manage_sellers"
  | "manage_logistics"
  | "manage_finance"
  | "manage_refunds"
  | "manage_documents"
  | "manage_reviews"
  | "manage_campaigns"
  | "manage_users"
  | "view_reports"
  | "manage_settings"
  | "view_activity_logs"
  | "view_customers";

export type AdmPermissionCheckMode = "all" | "any";
export type AdmUserStatus = "active" | "invited" | "suspended";

export interface AuthenticatedAdmUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: AdmRole;
  permissions: AdmPermission[];
  status: AdmUserStatus;
  lastLoginAt?: string | null;
}

export interface AdmSessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

export interface AdmSessionState {
  user: AuthenticatedAdmUser | null;
  reason: "authenticated" | "missing" | "expired" | "invalid";
}

export interface AdmMockProfileOption {
  id: string;
  name: string;
  email: string;
  role: AdmRole;
  roleLabel: string;
}
