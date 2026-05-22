import "server-only";

import { createHash } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// Tipos de consentimento disponíveis
export type ConsentimentoTipo =
  | "COOKIES_ANALYTICS"
  | "COOKIES_MARKETING"
  | "EMAIL_MARKETING"
  | "BIOMETRICO_SCAN"
  | "COMPARTILHAMENTO_DADOS";

export type ConsentimentoAcao = "CONCEDIDO" | "REVOGADO";

interface RegistrarConsentimentoParams {
  tipos:      ConsentimentoTipo[];
  acao:       ConsentimentoAcao;
  user_id?:   string;
  session_id?: string;
  ip?:        string;          // IP bruto — hasheado antes de salvar
  user_agent?: string;
}

// lgpd_consentimentos é imutável: apenas INSERT, nunca UPDATE ou DELETE.
export async function registrarConsentimento(
  params: RegistrarConsentimentoParams,
): Promise<void> {
  if (!params.tipos.length) return;

  const admin    = getSupabaseAdminClient();
  const ip_hash  = params.ip
    ? createHash("sha256").update(params.ip).digest("hex")
    : null;

  const registros = params.tipos.map((tipo) => ({
    user_id:    params.user_id    ?? null,
    session_id: params.session_id ?? null,
    tipo,
    acao:       params.acao,
    ip_hash,
    user_agent: params.user_agent?.slice(0, 500) ?? null,
  }));

  const { error } = await admin
    .from("lgpd_consentimentos")
    .insert(registros);

  if (error) {
    console.error("[lgpd/consentimento] insert falhou:", error);
    throw error;
  }
}

// Consultar consentimentos ativos do usuário (último registro por tipo)
export async function consultarConsentimentos(
  user_id: string,
): Promise<Record<ConsentimentoTipo, boolean>> {
  const admin = getSupabaseAdminClient();

  const { data } = await admin
    .from("lgpd_consentimentos")
    .select("tipo, acao, criado_em")
    .eq("user_id", user_id)
    .order("criado_em", { ascending: false });

  // Para cada tipo, o registro mais recente define o estado atual
  const resultado = {} as Record<ConsentimentoTipo, boolean>;
  const vistos    = new Set<ConsentimentoTipo>();

  for (const row of data ?? []) {
    const tipo = row.tipo as ConsentimentoTipo;
    if (!vistos.has(tipo)) {
      resultado[tipo] = row.acao === "CONCEDIDO";
      vistos.add(tipo);
    }
  }

  return resultado;
}
