/**
 * Ponto de entrada único para as invariantes do módulo Admin.
 * Importar SEMPRE daqui — nunca dos arquivos individuais.
 */

export {
  autenticarAdmin,
  assertAdminAutenticado,
} from "./adminAuthInvariant";

export type { AdminAutenticado } from "./adminAuthInvariant";

export {
  comAudit,
  ACOES_COM_AUDIT_OBRIGATORIO,
} from "./auditInvariant";

export type { AcaoComAudit } from "./auditInvariant";
