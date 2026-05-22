import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  TIER_LIMIARES,
  type AvaliarTierResult,
  type PopclubMembro,
  type TierEnum,
} from "./popclubTypes";

// ─── Helpers de tier ──────────────────────────────────────────────────────────

const TIERS_ORDENADOS: TierEnum[] = ["ESSENCIAL", "PREMIUM", "LUXO"];

export function calcularTierCorreto(pontos_acumulados_12m: number): TierEnum {
  if (pontos_acumulados_12m >= TIER_LIMIARES.LUXO) return "LUXO";
  if (pontos_acumulados_12m >= TIER_LIMIARES.PREMIUM) return "PREMIUM";
  return "ESSENCIAL";
}

function tierOrdinal(tier: TierEnum): number {
  return TIERS_ORDENADOS.indexOf(tier);
}

// ─── avaliarTier ──────────────────────────────────────────────────────────────
//
// Promoção: imediata ao atingir o limiar.
// Rebaixamento: anual — nunca imediato.

export async function avaliarTier(membro_id: string): Promise<AvaliarTierResult> {
  const admin = getSupabaseAdminClient();

  const { data: membro } = await admin
    .from("popclub_membros")
    .select("*")
    .eq("id", membro_id)
    .single();

  if (!membro) throw new Error(`Membro não encontrado: ${membro_id}`);

  const m = membro as PopclubMembro;
  const tierCorreto = calcularTierCorreto(m.pontos_acumulados_12m);

  // Tier igual: sem mudança
  if (tierCorreto === m.tier_atual) {
    return {
      tier_anterior: m.tier_atual,
      tier_novo: m.tier_atual,
      promovido: false,
      rebaixado: false,
    };
  }

  const isPromocao = tierOrdinal(tierCorreto) > tierOrdinal(m.tier_atual);

  // Rebaixamento via avaliarTier é PROIBIDO — apenas via job anual
  if (!isPromocao) {
    return {
      tier_anterior: m.tier_atual,
      tier_novo: m.tier_atual,
      promovido: false,
      rebaixado: false,
    };
  }

  // ── Promoção imediata ──────────────────────────────────────────────────────

  await admin
    .from("popclub_membros")
    .update({
      tier_anterior: m.tier_atual,
      tier_atual: tierCorreto,
    })
    .eq("id", membro_id);

  // Log da promoção como transação de ajuste
  await admin.from("popclub_transacoes").insert({
    membro_id,
    user_id: m.user_id,
    tipo: "AJUSTE_ADMIN",
    pontos: 0,
    saldo_apos: m.pontos_disponiveis,
    descricao: `Promoção de tier: ${m.tier_atual} → ${tierCorreto}`,
  });

  // E-mail de promoção de tier — fire-and-forget
  void (async () => {
    const { enviarPromocaoTier } = await import("@/lib/crm/flows/popclubEmails");
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", m.user_id)
      .maybeSingle();
    const ANTECIPACAO: Record<string, number> = { PREMIUM: 48, LUXO: 72 };
    await enviarPromocaoTier({
      user_id:            m.user_id,
      email:              (profile?.email as string | null) ?? "",
      nome:               (profile?.full_name as string | null) ?? null,
      tier_anterior:      m.tier_atual as "ESSENCIAL" | "PREMIUM" | "LUXO",
      tier_novo:          tierCorreto as "PREMIUM" | "LUXO",
      nova_antecipacao_h: ANTECIPACAO[tierCorreto] ?? 48,
      pontos_acumulados:  m.pontos_acumulados_12m as number,
    });
  })().catch(console.error);

  // Atualizar acessos antecipados para lotes futuros com o novo tier
  const { recalcularAcessosParaMembro } = await import("./accessGate");
  await recalcularAcessosParaMembro(membro_id, tierCorreto).catch(console.warn);

  return {
    tier_anterior: m.tier_atual,
    tier_novo: tierCorreto,
    promovido: true,
    rebaixado: false,
  };
}

// ─── processarRevisaoAnual ────────────────────────────────────────────────────
//
// Chamado pelo job diário quando data_avaliacao_tier = hoje.

export async function processarRevisaoAnual(membro_id: string): Promise<void> {
  const admin = getSupabaseAdminClient();

  const { data: membro } = await admin
    .from("popclub_membros")
    .select("*")
    .eq("id", membro_id)
    .single();

  if (!membro) return;
  const m = membro as PopclubMembro;

  const tierCorreto = calcularTierCorreto(m.pontos_acumulados_12m);
  const isRebaixamento = tierOrdinal(tierCorreto) < tierOrdinal(m.tier_atual);

  // Calcular próxima data de avaliação (+365 dias)
  const proximaAvaliacao = new Date();
  proximaAvaliacao.setFullYear(proximaAvaliacao.getFullYear() + 1);
  const proximoAviso = new Date(proximaAvaliacao.getTime() - 60 * 24 * 3600 * 1000);

  const updates: Record<string, unknown> = {
    data_avaliacao_tier: proximaAvaliacao.toISOString().slice(0, 10),
    data_rebaixamento_aviso: proximoAviso.toISOString().slice(0, 10),
  };

  if (isRebaixamento) {
    updates.tier_anterior = m.tier_atual;
    updates.tier_atual = tierCorreto;

    await admin.from("popclub_transacoes").insert({
      membro_id,
      user_id: m.user_id,
      tipo: "AJUSTE_ADMIN",
      pontos: 0,
      saldo_apos: m.pontos_disponiveis,
      descricao: `Rebaixamento anual: ${m.tier_atual} → ${tierCorreto}`,
    });

    console.log("[tierEngine] rebaixamento anual", {
      user_id: m.user_id,
      tier_anterior: m.tier_atual,
      tier_novo: tierCorreto,
    });
  }

  await admin.from("popclub_membros").update(updates).eq("id", membro_id);
}

// ─── enviarAvisoRebaixamento ──────────────────────────────────────────────────
//
// Chamado pelo job quando data_rebaixamento_aviso = hoje.

export async function enviarAvisoRebaixamento(membro_id: string): Promise<void> {
  const admin = getSupabaseAdminClient();

  const { data: membro } = await admin
    .from("popclub_membros")
    .select("*")
    .eq("id", membro_id)
    .single();

  if (!membro) return;
  const m = membro as PopclubMembro;

  const tierCorreto = calcularTierCorreto(m.pontos_acumulados_12m);
  if (tierOrdinal(tierCorreto) >= tierOrdinal(m.tier_atual)) return; // sem risco

  const limiarAtual = TIER_LIMIARES[m.tier_atual];
  const pontosNecessarios = Math.max(0, limiarAtual - m.pontos_acumulados_12m);

  // Placeholder — integrar com serviço de email
  console.log("[tierEngine] aviso de rebaixamento", {
    user_id: m.user_id,
    tier_atual: m.tier_atual,
    tier_risco: tierCorreto,
    pontos_necessarios: pontosNecessarios,
    data_avaliacao: m.data_avaliacao_tier,
  });
}
