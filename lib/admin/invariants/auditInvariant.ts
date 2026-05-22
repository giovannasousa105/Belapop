/**
 * INVARIANTE DE ARQUITETURA — TODA MODIFICAÇÃO ADMIN DEVE SER AUDITADA
 *
 * Ações que MODIFICAM dados no painel admin DEVEM registrar em admin_audit_log.
 *
 * Padrão obrigatório:
 *   const resultado = await comAudit({
 *     admin,
 *     acao: 'APROVAR_SELLER',
 *     referencia_id: seller.id,
 *     tabela: 'sellers',
 *     antes: seller,
 *     executar: () => aprovarSeller(seller.id),
 *   })
 *
 * Garantias:
 *   · Audit registrado APÓS sucesso — nunca antes
 *   · Se executar() lança, audit NÃO é registrado (ação não aconteceu)
 *   · Falha no audit nunca bloqueia a operação (fire-and-forget no registrarAudit)
 */

import { registrarAudit } from "../requireAdmin";
import type { RegistrarAuditParams } from "../requireAdmin";
import type { AdminAutenticado } from "./adminAuthInvariant";

// ─── Ações que exigem audit obrigatório ──────────────────────────────────────

export const ACOES_COM_AUDIT_OBRIGATORIO = [
  "APROVAR_SELLER",
  "REPROVAR_SELLER",
  "CRIAR_LOTE",
  "MUDAR_STATUS_LOTE",
  "APROVAR_PRODUTO",
  "REPROVAR_PRODUTO",
  "REMOVER_SUPRESSAO",
  "MARCAR_REPASSE_TRANSFERIDO",
  "AJUSTAR_TAXA_SELLER",
] as const;

export type AcaoComAudit = (typeof ACOES_COM_AUDIT_OBRIGATORIO)[number];

// ─── comAudit ─────────────────────────────────────────────────────────────────

export async function comAudit<T>(params: {
  admin:          AdminAutenticado;
  acao:           AcaoComAudit;
  referencia_id?: string;
  tabela?:        string;
  antes?:         unknown;
  executar:       () => Promise<T>;
  // Injetável para testes — default: registrarAudit de requireAdmin
  _auditFn?:      (p: RegistrarAuditParams) => Promise<void>;
}): Promise<T> {
  // Executar a ação ANTES — se lançar, audit não é registrado (correto)
  const resultado = await params.executar();

  // Registrar audit APÓS sucesso — fire-and-forget (nunca bloqueia)
  const auditFn = params._auditFn ?? registrarAudit;
  void auditFn({
    admin_id:      params.admin.id,
    acao:          params.acao,
    tabela:        params.tabela,
    referencia_id: params.referencia_id,
    dados_antes:   params.antes,
    dados_depois:  resultado,
  }).catch(() => {
    // Falha de audit nunca propaga — a operação já completou com sucesso
  });

  return resultado;
}
