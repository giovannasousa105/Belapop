import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }

  let motivo: string | null = null;
  try {
    const body = (await request.json()) as { motivo?: string };
    motivo = typeof body.motivo === "string" ? body.motivo.trim().slice(0, 1000) : null;
  } catch {
    // motivo é opcional
  }

  // Verificar se já existe solicitação pendente para evitar duplicatas
  const { data: existing } = await supabase
    .from("lgpd_solicitacoes")
    .select("id, criado_em")
    .eq("user_id", user.id)
    .eq("tipo", "EXCLUSAO")
    .in("status", ["PENDENTE", "EM_PROCESSAMENTO"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma solicitação de exclusão em andamento.", solicitacao_id: existing.id },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("lgpd_solicitacoes")
    .insert({ user_id: user.id, tipo: "EXCLUSAO", motivo })
    .select("id, criado_em")
    .single();

  if (error) {
    console.error("[lgpd/solicitar-exclusao] erro ao inserir:", error.message);
    return NextResponse.json({ error: "Erro ao registrar solicitação. Tente novamente." }, { status: 500 });
  }

  return NextResponse.json({ success: true, solicitacao_id: data.id, criado_em: data.criado_em });
}
