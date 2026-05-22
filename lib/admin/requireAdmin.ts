/**
 * Autenticação e autorização do painel admin.
 *
 * Usa admin_users (migration 0800) — distinto do sistema de roles
 * existente (user_roles / resolveUserRoleState) que permanece ativo.
 *
 * Hierarquia:
 *   SUPER_ADMIN > CURADOR/OPERACIONAL/FINANCEIRO
 *
 * fn_admin_pode verifica permissões por ação — chamar via requireAdmin(acao).
 */

import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AdminRole =
  | "SUPER_ADMIN"
  | "CURADOR"
  | "OPERACIONAL"
  | "FINANCEIRO";

export interface AdminUser {
  id:     string;
  userId: string;
  role:   AdminRole;
  nome:   string | null;
}

export interface RegistrarAuditParams {
  admin_id:       string;
  acao:           string;
  tabela?:        string;
  referencia_id?: string;
  dados_antes?:   unknown;
  dados_depois?:  unknown;
  ip?:            string;
}

// ─── getAdminUser ─────────────────────────────────────────────────────────────

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("admin_users")
    .select("id, role, nome")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (!data) return null;
  return {
    id:     data.id as string,
    userId: user.id,
    role:   data.role as AdminRole,
    nome:   (data.nome as string | null) ?? null,
  };
}

// ─── requireAdmin ─────────────────────────────────────────────────────────────
// Lança 'UNAUTHORIZED' se não autenticado, 'FORBIDDEN' se sem permissão.

export async function requireAdmin(acao?: string): Promise<AdminUser> {
  const adminUser = await getAdminUser();
  if (!adminUser) throw new Error("UNAUTHORIZED");

  if (acao) {
    const admin = getSupabaseAdminClient();
    const { data } = await admin.rpc("fn_admin_pode", {
      p_user_id: adminUser.userId,
      p_acao:    acao,
    });
    if (!data) throw new Error("FORBIDDEN");
  }

  return adminUser;
}

// ─── registrarAudit ───────────────────────────────────────────────────────────
// Fire-and-forget — nunca bloqueia a operação principal.

export async function registrarAudit(params: RegistrarAuditParams): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    await admin.from("admin_audit_log").insert({
      admin_id:      params.admin_id,
      acao:          params.acao,
      tabela:        params.tabela ?? null,
      referencia_id: params.referencia_id ?? null,
      dados_antes:   params.dados_antes ?? null,
      dados_depois:  params.dados_depois ?? null,
      ip:            params.ip ?? null,
    });
  } catch {
    // Audit log nunca deve quebrar a operação principal
  }
}

// ─── Helper de resposta HTTP para rotas API ───────────────────────────────────

export function adminErrorResponse(err: unknown): { error: string; status: number } {
  const msg = err instanceof Error ? err.message : "INTERNAL_ERROR";
  if (msg === "UNAUTHORIZED") return { error: "Autenticação necessária.", status: 401 };
  if (msg === "FORBIDDEN")    return { error: "Permissão insuficiente.", status: 403 };
  return { error: "Erro interno.", status: 500 };
}
