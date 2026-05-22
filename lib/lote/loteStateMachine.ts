// ============================================================
// BelaPop · Lote Curado · State Machine
// lib/lote/loteStateMachine.ts
//
// Funções PURAS — sem I/O, sem efeitos colaterais.
// Testáveis unitariamente sem banco ou Redis.
//
// TRANSIÇÕES AUTOMÁTICAS (disparadas pelo sistema):
//   ABERTO           → EM_ESGOTAMENTO   qtd_disponivel <= limiar
//   EM_ESGOTAMENTO   → ABERTO           qtd sobe acima do limiar (liberação)
//   EM_ESGOTAMENTO   → ENCERRADO        qtd_disponivel = 0
//   ENCERRADO        → REPOSICAO_PREVISTA  admin define data_reposicao
//
// TRANSIÇÕES MANUAIS (apenas admin, não estão aqui):
//   qualquer → SUSPENSO
//   SUSPENSO → ABERTO
//   ENCERRADO → REPOSICAO_PREVISTA (via endpoint admin)
//
// TRANSIÇÕES PROIBIDAS (lançam erro):
//   ENCERRADO → ABERTO diretamente (criar novo lote)
//   SUSPENSO  → qualquer (requer ação admin explícita)
//   qualquer  → SUSPENSO (requer ação admin explícita)
// ============================================================

import type {
  Lote,
  LoteStatus,
  TransicaoResult,
  Qtd,
} from './loteTypes';

// ----------------------------------------------------------
// Constantes de limiar
// ----------------------------------------------------------

/** Percentual de qtd_total abaixo do qual o lote entra em EM_ESGOTAMENTO */
export const LIMIAR_ESGOTAMENTO_DEFAULT = 20; // pct

/** Abaixo de quantas unidades absolutas consideramos urgência HIGH */
export const LIMIAR_URGENCIA_HIGH_ABS = 10;

// ----------------------------------------------------------
// Cálculo do status correto dado o estado atual
// ----------------------------------------------------------

/**
 * Calcula qual deveria ser o status do lote baseado nas quantidades atuais.
 * Função pura — não faz I/O.
 *
 * Regras em ordem de prioridade:
 *   1. qtd_disponivel = 0 AND qtd_reservada = 0 → ENCERRADO
 *   2. qtd_disponivel = 0 AND qtd_reservada > 0 → EM_ESGOTAMENTO (ainda tem reservas ativas)
 *   3. qtd_disponivel <= limiar                  → EM_ESGOTAMENTO
 *   4. else                                       → ABERTO
 *
 * NUNCA calcula SUSPENSO ou REPOSICAO_PREVISTA — estes são estados manuais.
 */
export function calcularStatusCorreto(params: {
  qtd_disponivel:    Qtd;
  qtd_reservada:     Qtd;
  qtd_total:         Qtd;
  limiar_alerta_pct: number;
  status_atual:      LoteStatus;
}): LoteStatus {
  const { qtd_disponivel, qtd_reservada, qtd_total, limiar_alerta_pct, status_atual } = params;

  // Estados manuais nunca são recalculados automaticamente
  if (status_atual === 'SUSPENSO' || status_atual === 'REPOSICAO_PREVISTA') {
    return status_atual;
  }

  // Sem estoque disponível nem reservado — definitivamente encerrado
  if (qtd_disponivel === 0 && qtd_reservada === 0) {
    return 'ENCERRADO';
  }

  // Sem disponível mas com reservas ativas — aguardar resolução das reservas
  if (qtd_disponivel === 0 && qtd_reservada > 0) {
    return 'EM_ESGOTAMENTO';
  }

  // Calcular limiar em unidades absolutas
  const limiar_abs = Math.round((qtd_total * limiar_alerta_pct) / 100);

  if (qtd_disponivel <= limiar_abs) {
    return 'EM_ESGOTAMENTO';
  }

  return 'ABERTO';
}

// ----------------------------------------------------------
// Calcular se uma transição deve ocorrer
// ----------------------------------------------------------

/**
 * Dado o lote atual, retorna se há transição de status a fazer.
 * Retorna null se nenhuma transição é necessária.
 *
 * Função pura — não persiste nada.
 */
export function calcularTransicao(lote: Pick<
  Lote,
  'status' | 'qtd_disponivel' | 'qtd_reservada' | 'qtd_total' | 'limiar_alerta_pct'
>): TransicaoResult | null {
  const status_novo = calcularStatusCorreto({
    qtd_disponivel:    lote.qtd_disponivel as Qtd,
    qtd_reservada:     lote.qtd_reservada as Qtd,
    qtd_total:         lote.qtd_total as Qtd,
    limiar_alerta_pct: lote.limiar_alerta_pct,
    status_atual:      lote.status,
  });

  if (status_novo === lote.status) return null;

  return {
    transitou:       true,
    status_anterior: lote.status,
    status_novo,
  };
}

// ----------------------------------------------------------
// Validação de transições
// ----------------------------------------------------------

type TransicaoValida =
  | { valida: true }
  | { valida: false; motivo: string };

/**
 * Verifica se uma transição de status é permitida.
 * Usado pelo endpoint admin antes de aplicar mudança manual.
 */
export function validarTransicao(
  de:   LoteStatus,
  para: LoteStatus
): TransicaoValida {
  // Transições automáticas válidas
  const automaticas: Array<[LoteStatus, LoteStatus]> = [
    ['ABERTO',         'EM_ESGOTAMENTO'],
    ['EM_ESGOTAMENTO', 'ABERTO'],
    ['EM_ESGOTAMENTO', 'ENCERRADO'],
    ['ENCERRADO',      'REPOSICAO_PREVISTA'],
  ];

  // Transições manuais válidas (apenas admin)
  const manuais: Array<[LoteStatus, LoteStatus]> = [
    ['ABERTO',             'SUSPENSO'],
    ['EM_ESGOTAMENTO',     'SUSPENSO'],
    ['SUSPENSO',           'ABERTO'],
    ['REPOSICAO_PREVISTA', 'SUSPENSO'],
  ];

  const todas = [...automaticas, ...manuais];
  const permitida = todas.some(([d, p]) => d === de && p === para);

  if (permitida) return { valida: true };

  if (de === 'ENCERRADO' && para === 'ABERTO') {
    return {
      valida: false,
      motivo: 'Lote ENCERRADO não pode voltar para ABERTO diretamente. Crie um novo lote.',
    };
  }

  if (de === para) {
    return { valida: false, motivo: `Lote já está em ${de}.` };
  }

  return {
    valida: false,
    motivo: `Transição ${de} → ${para} não é permitida.`,
  };
}

// ----------------------------------------------------------
// Cálculo de display_config — puro, sem banco
// ----------------------------------------------------------

/**
 * Calcula o display_config completo baseado no lote.
 * Espelha a fn_lote_display_config do PostgreSQL para uso no Node.js
 * (ex: quando o lote vem do cache Redis e não queremos chamar o banco).
 */
export function calcularDisplayConfig(lote: Pick<
  Lote,
  'id' | 'status' | 'qtd_disponivel' | 'qtd_total' |
  'limiar_alerta_pct' | 'abertura_geral_em' | 'data_reposicao'
>) {
  const pct_restante =
    lote.qtd_total > 0
      ? (lote.qtd_disponivel / lote.qtd_total) * 100
      : 0;

  const urgencia_level =
    lote.status === 'ABERTO' && pct_restante > lote.limiar_alerta_pct
      ? 'none'
      : lote.status === 'EM_ESGOTAMENTO' && pct_restante <= 10
      ? 'high'
      : lote.status === 'EM_ESGOTAMENTO'
      ? 'low'
      : 'none';

  const texto_estoque =
    urgencia_level === 'high'
      ? `Últimas ${lote.qtd_disponivel} unidades deste lote`
      : urgencia_level === 'low'
      ? `${lote.qtd_disponivel} unidades disponíveis neste lote`
      : null;

  const texto_esgotado =
    (lote.status === 'ENCERRADO' || lote.status === 'REPOSICAO_PREVISTA') && lote.data_reposicao
      ? `Lote encerrado · reposição prevista para ${formatarData(lote.data_reposicao)}`
      : lote.status === 'ENCERRADO'
      ? 'Lote encerrado. Sem reposição prevista no momento.'
      : null;

  return {
    lote_id:           lote.id,
    status:            lote.status,
    qtd_disponivel:    lote.qtd_disponivel,
    qtd_total:         lote.qtd_total,
    mostrar_contador:  urgencia_level !== 'none',
    urgencia_level,
    texto_estoque,
    texto_esgotado,
    mostrar_waitlist:  lote.status === 'ENCERRADO' || lote.status === 'REPOSICAO_PREVISTA',
    abertura_geral_em: lote.abertura_geral_em,
    data_reposicao:    lote.data_reposicao,
  };
}

// ----------------------------------------------------------
// Helpers internos
// ----------------------------------------------------------

function formatarData(isoDate: string): string {
  const [ano, mes, dia] = isoDate.split('-');
  return `${dia}/${mes}/${ano}`;
}
