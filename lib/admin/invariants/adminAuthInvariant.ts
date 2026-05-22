/**
 * INVARIANTE DE DOMÍNIO — TODA ROTA /api/admin/* DEVE AUTENTICAR ANTES
 *
 * Nenhuma ação admin pode acontecer sem:
 *   1. Autenticação (sessão válida)
 *   2. Autorização (user_id em admin_users com role adequado)
 *
 * O branded type AdminAutenticado garante em TypeScript que
 * funções de serviço recebem apenas admins verificados.
 *
 * Uso obrigatório:
 *   const admin = await autenticarAdmin('GERENCIAR_LOTES')
 *   await criarLote(admin, dados) // admin: AdminAutenticado
 */

import { requireAdmin } from "../requireAdmin";
import type { AdminUser } from "../requireAdmin";

// ─── Branded type ─────────────────────────────────────────────────────────────
// A propriedade __brand nunca existe em runtime — só marca o tipo.

export type AdminAutenticado = AdminUser & {
  readonly __brand: "AdminAutenticado";
};

// ─── autenticarAdmin ──────────────────────────────────────────────────────────
// Wrapper sobre requireAdmin que retorna o tipo correto.

export async function autenticarAdmin(acao?: string): Promise<AdminAutenticado> {
  const admin = await requireAdmin(acao);
  return admin as AdminAutenticado;
}

// ─── assertAdminAutenticado ───────────────────────────────────────────────────
// Type guard para verificar em runtime que o objeto passou por autenticarAdmin.

export function assertAdminAutenticado(
  obj: unknown
): asserts obj is AdminAutenticado {
  if (
    !obj ||
    typeof obj !== "object" ||
    !("id" in obj) ||
    !("userId" in obj) ||
    !("role" in obj)
  ) {
    throw new Error(
      "Operação requer AdminAutenticado — chamar autenticarAdmin() primeiro. " +
      "Nunca passar user_id direto para funções de serviço admin."
    );
  }
}
