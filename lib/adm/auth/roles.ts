import type { AdmPermission, AdmRole } from "@/types/adm/auth";

export const ADM_ROLE_LABELS: Record<AdmRole, string> = {
  admin_master: "Admin Master",
  curadoria: "Curadoria",
  financeiro: "Financeiro",
  logistica: "Logistica",
  operacao: "Operacao",
  catalogo_marca: "Catalogo e Marca",
  suporte: "Suporte",
  leitura: "Leitura"
};

export const ADM_ROLE_PERMISSIONS: Record<AdmRole, AdmPermission[]> = {
  admin_master: [
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
  ],
  curadoria: [
    "view_dashboard",
    "view_quality",
    "manage_products",
    "approve_products",
    "manage_documents",
    "manage_reviews",
    "view_reports"
  ],
  financeiro: [
    "view_dashboard",
    "manage_finance",
    "manage_refunds",
    "view_reports",
    "view_activity_logs"
  ],
  logistica: ["view_dashboard", "manage_logistics", "view_reports"],
  operacao: [
    "view_dashboard",
    "manage_logistics",
    "manage_sellers",
    "view_reports",
    "view_activity_logs"
  ],
  catalogo_marca: [
    "view_dashboard",
    "view_quality",
    "manage_campaigns",
    "manage_reviews",
    "view_reports"
  ],
  suporte: ["view_dashboard", "view_customers", "view_reports"],
  leitura: ["view_dashboard", "view_reports"]
};

export function getRolePermissions(role: AdmRole) {
  return [...ADM_ROLE_PERMISSIONS[role]];
}

export function getAdmRoleLabel(role: AdmRole) {
  return ADM_ROLE_LABELS[role];
}
