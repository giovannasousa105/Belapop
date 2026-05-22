import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type StatusRow = {
  id: string;
  skin_id: string | null;
  status: string;
  focos: string[];
  duracao_ms: number | null;
  erro_mensagem: string | null;
  criado_em: string;
  atualizado_em: string;
  user_id: string | null;
  session_bp: string | null;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ scan_id: string }> }
) {
  const { scan_id } = await context.params;

  if (!scan_id || typeof scan_id !== "string") {
    return NextResponse.json({ error: "scan_id inválido." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data: scan, error } = await admin
    .from("skin_scans")
    .select(
      "id, skin_id, status, focos, duracao_ms, erro_mensagem, criado_em, atualizado_em, user_id, session_bp"
    )
    .eq("id", scan_id)
    .maybeSingle();

  if (error || !scan) {
    return NextResponse.json({ error: "Scan não encontrado." }, { status: 404 });
  }

  const row = scan as StatusRow;

  // Verificar acesso: dono autenticado ou mesma sessão anônima
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isOwner =
    (user && row.user_id === user.id) ||
    (!row.user_id && row.session_bp); // anônimo — confiar no scan_id como token

  if (!isOwner && row.user_id) {
    // Scan pertence a um usuário autenticado diferente
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  const etapas: Record<string, string> = {
    AGUARDANDO: "Aguardando processamento...",
    PROCESSANDO_CV: "Analisando imagem...",
    SCORING: "Calculando perfil de pele...",
    RECOMENDANDO: "Selecionando produtos...",
    CONCLUIDO: "Análise concluída.",
    ERRO: "Ocorreu um erro na análise.",
  };

  return NextResponse.json({
    scan_id: row.id,
    skin_id: row.skin_id,
    status: row.status,
    descricao: etapas[row.status] ?? row.status,
    concluido: row.status === "CONCLUIDO",
    erro: row.status === "ERRO",
    erro_mensagem: row.erro_mensagem,
    duracao_ms: row.duracao_ms,
    atualizado_em: row.atualizado_em,
  });
}
