/**
 * INVARIANTE DE NEGÓCIO — REBAIXAMENTO SEMPRE COM AVISO PRÉVIO
 *
 * Nenhuma membra pode perder o tier sem ter recebido aviso 60 dias antes.
 *
 * Por quê é invariante de negócio (não só UX):
 *   Membra Luxo que perde o tier silenciosamente:
 *     - Não recebe mais acesso antecipado (percebe na próxima compra)
 *     - Abre ticket de suporte → churn em 30 dias
 *
 *   Membra Luxo avisada 60 dias antes:
 *     - Faz uma compra para manter (conversão real) → LTV protegido
 *
 * Fluxo obrigatório:
 *   T-60 dias: avisar + definir data_rebaixamento_aviso
 *   T-30 dias: lembrete adicional via Copilot
 *   T-0:       rebaixar SOMENTE se pontos ainda insuficientes
 *
 * avaliarRebaixamento() com data_rebaixamento_aviso = null sempre retorna
 * AVISO_NAO_ENVIADO — nunca rebaixado: true.
 * Impossível rebaixar silenciosamente em código.
 */

import {
  calcularTierPorPontos,
  TIER_LIMIARES,
  type PontosAcumulados12m,
  type TierEnum,
} from "./pontosInvariant";

// ─── Helper de ordenação de tiers ────────────────────────────────────────────

function tierParaNumero(tier: TierEnum): number {
  return { ESSENCIAL: 0, PREMIUM: 1, LUXO: 2 }[tier];
}

// ─── Input e resultado ────────────────────────────────────────────────────────

export interface RebaixamentoInput {
  membro_id:               string;
  tier_atual:              TierEnum;
  pontos_acumulados_12m:   PontosAcumulados12m;
  data_rebaixamento_aviso: Date | null; // null = aviso NÃO enviado ainda
  data_avaliacao_tier:     Date;
}

export type RebaixamentoResult =
  | { rebaixado: false; motivo: "PONTOS_SUFICIENTES" | "AVISO_NAO_ENVIADO" | "DATA_NAO_CHEGOU" }
  | { rebaixado: true;  tier_novo: TierEnum; tier_anterior: TierEnum };

// ─── avaliarRebaixamento ──────────────────────────────────────────────────────
//
// Retorna discriminated union. O caller não pode rebaixar sem verificar.
// Guards em ordem: pontos → aviso → data → rebaixar.

export function avaliarRebaixamento(
  input: RebaixamentoInput,
  hoje:  Date
): RebaixamentoResult {

  // Guard 1: pontos suficientes — não rebaixar
  const tier_correto = calcularTierPorPontos(input.pontos_acumulados_12m);
  if (tierParaNumero(tier_correto) >= tierParaNumero(input.tier_atual)) {
    return { rebaixado: false, motivo: "PONTOS_SUFICIENTES" };
  }

  // Guard 2: aviso não enviado — NUNCA rebaixar sem aviso prévio
  // Esta é a proteção central da invariante.
  if (!input.data_rebaixamento_aviso) {
    return { rebaixado: false, motivo: "AVISO_NAO_ENVIADO" };
  }

  // Guard 3: data de avaliação não chegou ainda
  const dataAvaliacao = new Date(input.data_avaliacao_tier);
  // Comparar apenas a data, não a hora
  const hojeNormalizado = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()));
  const avaliacaoNormalizado = new Date(Date.UTC(dataAvaliacao.getUTCFullYear(), dataAvaliacao.getUTCMonth(), dataAvaliacao.getUTCDate()));

  if (hojeNormalizado < avaliacaoNormalizado) {
    return { rebaixado: false, motivo: "DATA_NAO_CHEGOU" };
  }

  // Todos os guards passaram — rebaixamento permitido
  return {
    rebaixado:     true,
    tier_anterior: input.tier_atual,
    tier_novo:     tier_correto,
  };
}

// ─── calcularDatasRebaixamento ────────────────────────────────────────────────
//
// Quando detectar risco: chamar esta função para definir o calendário
// e então enviar o e-mail de aviso.

export function calcularDatasRebaixamento(hoje: Date): {
  data_rebaixamento_aviso: Date;
  data_avaliacao_tier:     Date;
} {
  const data_avaliacao = new Date(hoje);
  data_avaliacao.setDate(data_avaliacao.getDate() + 60);

  return {
    data_rebaixamento_aviso: hoje,
    data_avaliacao_tier:     data_avaliacao,
  };
}

// ─── Payload do aviso de rebaixamento ─────────────────────────────────────────

export interface AvisoRebaixamentoPayload {
  membro_id:           string;
  email:               string;
  nome:                string;
  tier_atual:          TierEnum;
  tier_risco:          TierEnum;
  pontos_atuais:       PontosAcumulados12m;
  pontos_necessarios:  number;
  pontos_faltando:     number;
  data_avaliacao:      Date;
  dias_para_avaliacao: number; // arredondado para cima (Math.ceil)
}

export function calcularAvisoPayload(
  membro: {
    id:                    string;
    email:                 string;
    nome:                  string;
    tier_atual:            TierEnum;
    pontos_acumulados_12m: PontosAcumulados12m;
  },
  data_avaliacao: Date,
  hoje: Date
): AvisoRebaixamentoPayload {
  const tier_risco      = calcularTierPorPontos(membro.pontos_acumulados_12m);
  const pts_necessarios = TIER_LIMIARES[membro.tier_atual];
  const pts_faltando    = Math.max(0, pts_necessarios - membro.pontos_acumulados_12m);
  const dias            = Math.ceil((data_avaliacao.getTime() - hoje.getTime()) / 86400000);

  return {
    membro_id:           membro.id,
    email:               membro.email,
    nome:                membro.nome,
    tier_atual:          membro.tier_atual,
    tier_risco,
    pontos_atuais:       membro.pontos_acumulados_12m,
    pontos_necessarios:  pts_necessarios,
    pontos_faltando:     pts_faltando,
    data_avaliacao,
    dias_para_avaliacao: dias,
  };
}
