import type { AdmRole } from "@/types/adm/auth";

export const ADM_AUTH_COOKIE_NAME = "belapop_adm_session";
export const ADM_AUTH_LOGIN_PATH = "/adm/login";
export const ADM_AUTH_LOGOUT_REDIRECT = "/adm/login?reason=signed-out";
export const ADM_AUTH_COOKIE_TTL_SECONDS = 60 * 60 * 12;
export const ADM_AUTH_SECRET =
  process.env.ADM_AUTH_SECRET ??
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  "belapop-adm-local-mock-secret";

export const ADM_MOCK_DEFAULT_PASSWORD = "BelaPopADM#2026";
export const ADM_ENABLE_MOCK_SHORTCUTS = process.env.NODE_ENV !== "production";

export const ADM_DEFAULT_HOME_BY_ROLE: Record<AdmRole, string> = {
  admin_master: "/adm",
  curadoria: "/adm/curadoria/produtos",
  financeiro: "/adm/financeiro",
  logistica: "/adm/operacao/logistica",
  operacao: "/adm/operacao/pedidos-criticos",
  catalogo_marca: "/adm/catalogo-marca/conteudo-vitrines",
  suporte: "/adm/relacionamento/clientes",
  leitura: "/adm/dashboard-executivo"
};
