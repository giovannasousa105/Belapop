import type { AdmRole } from "@/types/adm/auth";

export const ADM_AUTH_COOKIE_NAME = "belapop_adm_session";
export const ADM_AUTH_LOGIN_PATH = "/adm/login";
export const ADM_AUTH_LOGOUT_REDIRECT = "/adm/login?reason=signed-out";
export const ADM_AUTH_COOKIE_TTL_SECONDS = 60 * 60 * 12;
export const ADM_AUTH_SECRET =
  process.env.ADM_AUTH_SECRET ??
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  // Em produção sem env var: HMAC continua funcionando mas com segredo fixo conhecido —
  // garanta que ADM_AUTH_SECRET, AUTH_SECRET ou NEXTAUTH_SECRET estão setados na Vercel.
  (process.env.NODE_ENV === "production" ? "__misconfigured_set_adm_auth_secret__" : "belapop-adm-local-dev-only");

// ADM_MOCK_DEFAULT_PASSWORD removido — senha lida de ADM_ADMIN_PASSWORD em runtime.
export const ADM_ENABLE_MOCK_SHORTCUTS = process.env.NODE_ENV !== "production";

export const ADM_DEFAULT_HOME_BY_ROLE: Record<AdmRole, string> = {
  admin_master: "/adm",
  curadoria: "/adm/curadoria/produtos",
  financeiro: "/adm/financeiro",
  logistica: "/adm/operacao/logistica",
  operação: "/adm/operacao/pedidos-criticos",
  catalogo_marca: "/adm/catalogo-marca/conteudo-vitrines",
  suporte: "/adm/relacionamento/clientes",
  leitura: "/adm/dashboard-executivo"
};
