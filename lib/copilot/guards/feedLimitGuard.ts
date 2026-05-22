/**
 * INVARIANTE DE ARQUITETURA — FEED LIMITADO A 3 CARDS
 *
 * O feed do Copilot NUNCA exibe mais de 3 interações simultaneamente.
 * O limite é enforçado no servidor (endpoint do feed), não no cliente.
 * Enforçar só no cliente = qualquer bug de estado exibe 7 cards de uma vez.
 *
 * Por quê 3: atenção é recurso escasso. Mais de 3 mensagens simultâneas
 * de qualquer canal (email, push, app) são percebidas como spam.
 * Uma consultora real não manda 7 mensagens de uma vez.
 *
 * Ordenação por prioridade (menor número = mais urgente):
 *   1: ALERTA_REGRESSAO, MARCO_ALCANCADO
 *   2: CHECKIN_SEMANAL, LEMBRETE_SCAN
 *   3: LEMBRETE_MANHA, LEMBRETE_NOITE
 *   4: NUDGE_RECOMPRA
 *
 * Regra de desempate: criado_em DESC (mais recente primeiro)
 */

import type { CopilotInteracao, InteracaoTipo } from "../copilotTypes";
import { CADENCE_RULES } from "../copilotTypes";

// ─── Constante nomeada — nunca magic number ───────────────────────────────────

export const FEED_MAX_CARDS = 3;

// ─── Tipo branded que garante que o array passou pela limitação ───────────────
// A propriedade `__feedLimitado` nunca existe em tempo de execução —
// serve apenas como marcador de tipo para o compilador.

export type FeedLimitado = readonly CopilotInteracao[] & {
  readonly __feedLimitado: true;
};

// ─── Tabela de prioridade (separada das CADENCE_RULES para leitura rápida) ───

function prioridadeDe(tipo: InteracaoTipo): number {
  return CADENCE_RULES.find((r) => r.tipo === tipo)?.prioridade ?? 99;
}

// ─── aplicarFeedLimit ─────────────────────────────────────────────────────────

export function aplicarFeedLimit(interacoes: CopilotInteracao[]): FeedLimitado {
  if (interacoes.length === 0) {
    return [] as unknown as FeedLimitado;
  }

  const ordenadas = [...interacoes].sort((a, b) => {
    const prioA = prioridadeDe(a.tipo);
    const prioB = prioridadeDe(b.tipo);

    // Prioridade menor = mais urgente = aparece primeiro
    if (prioA !== prioB) return prioA - prioB;

    // Desempate: mais recente primeiro
    return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
  });

  return ordenadas.slice(0, FEED_MAX_CARDS) as unknown as FeedLimitado;
}

// ─── assertFeedValido ─────────────────────────────────────────────────────────
// Double-check no endpoint — nunca retornar feed sem validar.

export function assertFeedValido(interacoes: readonly CopilotInteracao[]): void {
  if (interacoes.length > FEED_MAX_CARDS) {
    throw new Error(
      `FeedLimitGuard violado: ${interacoes.length} cards no feed. ` +
        `Máximo permitido: ${FEED_MAX_CARDS}. ` +
        `Chamar aplicarFeedLimit() antes de retornar o feed.`
    );
  }
}

// Uso obrigatório em GET /api/copilot/feed:
//
//   const pendentes = await buscarInteracoesPendentes(user_id)
//   const feed = aplicarFeedLimit(pendentes)
//   assertFeedValido(feed)   // double-check — nunca retornar sem validar
//   return NextResponse.json({ interacoes: feed })
