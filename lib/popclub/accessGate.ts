import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  TIER_JANELAS_HORAS,
  type PopclubAcessoAntecipado,
  type PopclubMembro,
  type TierComPublico,
  type TierEnum,
  type VerificarAcessoResult,
} from "./popclubTypes";

// ─── verificarAcesso ──────────────────────────────────────────────────────────

export async function verificarAcesso(
  user_id: string,
  lote_id: string,
  agora: Date = new Date()
): Promise<VerificarAcessoResult> {
  const admin = getSupabaseAdminClient();

  // Buscar lote para obter abertura geral
  const { data: lote } = await admin
    .from("lotes")
    .select("id, abertura_geral, status")
    .eq("id", lote_id)
    .single();

  // Fallback se lote não encontrado
  const aberturaGeral = lote?.abertura_geral
    ? new Date(lote.abertura_geral as string)
    : new Date(0);

  // Buscar membro e seu registro de acesso antecipado
  const { data: membro } = await admin
    .from("popclub_membros")
    .select("id, tier_atual")
    .eq("user_id", user_id)
    .eq("ativo", true)
    .single();

  if (!membro) {
    // Usuária não é membro — acesso público apenas
    const temAcesso = agora >= aberturaGeral;
    const tempoRestante = Math.max(0, aberturaGeral.getTime() - agora.getTime());
    return {
      tem_acesso: temAcesso,
      tier: "PUBLICO",
      abertura_em: aberturaGeral,
      tempo_restante_ms: tempoRestante,
    };
  }

  const m = membro as Pick<PopclubMembro, "id" | "tier_atual">;

  // Buscar acesso antecipado do membro para este lote
  const { data: acesso } = await admin
    .from("popclub_acessos_antecipados")
    .select("*")
    .eq("membro_id", m.id)
    .eq("lote_id", lote_id)
    .single();

  const aberturaEm = acesso
    ? new Date((acesso as PopclubAcessoAntecipado).abertura_em)
    : aberturaGeral;

  const tier: TierComPublico = acesso
    ? ((acesso as PopclubAcessoAntecipado).tier_na_data as TierEnum)
    : "PUBLICO";

  const temAcesso = agora >= aberturaEm;
  const tempoRestante = Math.max(0, aberturaEm.getTime() - agora.getTime());

  // Registrar primeiro acesso se ainda não registrado
  if (temAcesso && acesso && !(acesso as PopclubAcessoAntecipado).acessou_em) {
    await admin
      .from("popclub_acessos_antecipados")
      .update({ acessou_em: agora.toISOString() })
      .eq("id", (acesso as PopclubAcessoAntecipado).id);
  }

  return { tem_acesso: temAcesso, tier, abertura_em: aberturaEm, tempo_restante_ms: tempoRestante };
}

// ─── criarAcessosParaLote ─────────────────────────────────────────────────────
//
// Chamado quando um lote é publicado com abertura futura.
// Cria registros personalizados para todos os membros ativos.

export async function criarAcessosParaLote(
  lote_id: string,
  abertura_geral: Date
): Promise<void> {
  const admin = getSupabaseAdminClient();

  // Buscar todos os membros ativos (paginado)
  let offset = 0;
  const PAGE = 500;

  while (true) {
    const { data: membros } = await admin
      .from("popclub_membros")
      .select("id, tier_atual")
      .eq("ativo", true)
      .range(offset, offset + PAGE - 1);

    if (!membros || membros.length === 0) break;

    const registros = (membros as Pick<PopclubMembro, "id" | "tier_atual">[]).map((m) => {
      const janelasHoras = TIER_JANELAS_HORAS[m.tier_atual];
      const aberturaEm = new Date(abertura_geral.getTime() - janelasHoras * 3600 * 1000);
      return {
        membro_id: m.id,
        lote_id,
        tier_na_data: m.tier_atual,
        abertura_em: aberturaEm.toISOString(),
      };
    });

    // ON CONFLICT: ignorar se já existe (idempotente)
    await admin
      .from("popclub_acessos_antecipados")
      .upsert(registros, { onConflict: "membro_id,lote_id", ignoreDuplicates: true });

    if (membros.length < PAGE) break;
    offset += PAGE;
  }
}

// ─── criarAcessosParaMembroEspecifico ─────────────────────────────────────────
//
// Chamado ao criar novo membro — dá acesso aos lotes já publicados.

export async function criarAcessosParaMembroEspecifico(
  membro_id: string,
  tier: TierEnum
): Promise<void> {
  const admin = getSupabaseAdminClient();

  // Lotes com abertura futura ainda não publicados
  const { data: lotes } = await admin
    .from("lotes")
    .select("id, abertura_geral")
    .eq("status", "ABERTO")
    .gte("abertura_geral", new Date().toISOString());

  if (!lotes?.length) return;

  const janelasHoras = TIER_JANELAS_HORAS[tier];
  const registros = (lotes as { id: string; abertura_geral: string }[]).map((l) => {
    const aberturaGeral = new Date(l.abertura_geral);
    const aberturaEm = new Date(aberturaGeral.getTime() - janelasHoras * 3600 * 1000);
    return {
      membro_id,
      lote_id: l.id,
      tier_na_data: tier,
      abertura_em: aberturaEm.toISOString(),
    };
  });

  await admin
    .from("popclub_acessos_antecipados")
    .upsert(registros, { onConflict: "membro_id,lote_id", ignoreDuplicates: true });
}

// ─── recalcularAcessosParaMembro ──────────────────────────────────────────────
//
// Chamado após promoção de tier — atualiza abertura_em dos lotes ainda fechados.

export async function recalcularAcessosParaMembro(
  membro_id: string,
  tier_novo: TierEnum
): Promise<void> {
  const admin = getSupabaseAdminClient();
  const agora = new Date();
  const janelasHoras = TIER_JANELAS_HORAS[tier_novo];

  // Buscar acessos antecipados para lotes ainda não abertos
  const { data: acessos } = await admin
    .from("popclub_acessos_antecipados")
    .select("id, lote_id, abertura_em, lotes(abertura_geral)")
    .eq("membro_id", membro_id)
    .gt("abertura_em", agora.toISOString());

  if (!acessos?.length) return;

  await Promise.all(
    (acessos as unknown as Array<{
      id: string;
      lote_id: string;
      abertura_em: string;
      lotes: { abertura_geral: string } | null;
    }>).map(async (a) => {
      const aberturaGeral = a.lotes?.abertura_geral
        ? new Date(a.lotes.abertura_geral)
        : null;

      if (!aberturaGeral) return;

      const novaAbertura = new Date(aberturaGeral.getTime() - janelasHoras * 3600 * 1000);
      await admin
        .from("popclub_acessos_antecipados")
        .update({ tier_na_data: tier_novo, abertura_em: novaAbertura.toISOString() })
        .eq("id", a.id);
    })
  );
}
