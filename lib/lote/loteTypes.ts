// ============================================================
// BelaPop · Lote Curado · Types
// lib/lote/loteTypes.ts
//
// Todos os tipos do domínio de lote.
// Branded types para grandezas que não podem ser trocadas.
// ============================================================

// ----------------------------------------------------------
// Branded types — o compilador rejeita trocas acidentais
// ----------------------------------------------------------

export type LoteId    = string & { readonly __brand: 'LoteId'    }
export type ReservaId = string & { readonly __brand: 'ReservaId' }
export type Qtd       = number & { readonly __brand: 'Qtd'       }

export function toLoteId(s: string):    LoteId    { return s as LoteId    }
export function toReservaId(s: string): ReservaId { return s as ReservaId }
export function toQtd(n: number): Qtd {
  if (!Number.isInteger(n)) throw new TypeError(`Qtd inválida: ${n}. Deve ser inteiro.`)
  if (n < 0)                throw new RangeError(`Qtd inválida: ${n}. Deve ser >= 0.`)
  return n as Qtd
}

// ----------------------------------------------------------
// ENUMs — espelham os tipos do banco
// ----------------------------------------------------------

export type LoteStatus =
  | 'ABERTO'
  | 'EM_ESGOTAMENTO'
  | 'ENCERRADO'
  | 'REPOSICAO_PREVISTA'
  | 'SUSPENSO'

export type ReservaStatus =
  | 'ATIVA'
  | 'CONFIRMADA'
  | 'EXPIRADA'
  | 'CANCELADA'

export type EventoTipo =
  | 'VENDA'
  | 'RESERVA'
  | 'LIBERACAO'
  | 'TRANSICAO'
  | 'REEMBOLSO'
  | 'REEMBOLSO_AUTOMATICO'
  | 'NOTIFICACAO_ESPERA'

// ----------------------------------------------------------
// Entidades do banco
// ----------------------------------------------------------

export interface Lote {
  id:                LoteId
  produto_id:        string
  seller_id:         string
  sku_externo:       string | null
  qtd_total:         Qtd
  qtd_disponivel:    Qtd
  qtd_reservada:     Qtd
  limiar_alerta_pct: number
  status:            LoteStatus
  abertura_geral_em: Date | null
  verificado_em:     Date | null
  aberto_em:         Date | null
  encerrado_em:      Date | null
  data_reposicao:    string | null   // 'YYYY-MM-DD'
  notas_internas:    string | null
  criado_em:         Date
  atualizado_em:     Date
}

export interface LoteReserva {
  id:                ReservaId
  lote_id:           LoteId
  session_id:        string
  user_id:           string | null
  quantidade:        Qtd
  expira_em:         Date
  status:            ReservaStatus
  pedido_id:         string | null
  payment_intent_id: string | null
  stripe_session_id: string | null
  criado_em:         Date
}

export interface LoteEvento {
  id:              string
  lote_id:         LoteId
  tipo:            EventoTipo
  status_anterior: LoteStatus | null
  status_novo:     LoteStatus | null
  delta_qtd:       number
  actor_id:        string | null
  actor_tipo:      'user' | 'admin' | 'system' | 'webhook'
  metadata:        Record<string, unknown>
  criado_em:       Date
}

// ----------------------------------------------------------
// Display config — retornada pela API, consumida pelo frontend
// ----------------------------------------------------------

export type UrgenciaLevel = 'none' | 'low' | 'high'

export interface LoteDisplayConfig {
  lote_id:           LoteId
  status:            LoteStatus
  qtd_disponivel:    Qtd | null
  qtd_total:         Qtd
  mostrar_contador:  boolean
  urgencia_level:    UrgenciaLevel
  texto_estoque:     string | null
  texto_esgotado:    string | null
  mostrar_waitlist:  boolean
  abertura_geral_em: Date | null
  data_reposicao:    string | null
  // Injetado pelo accessGate do PopClub (após busca de membership)
  acesso_membro?: {
    tem_acesso:        boolean
    tier:              'ESSENCIAL' | 'PREMIUM' | 'LUXO' | 'PUBLICO'
    abertura_em:       Date
    tempo_restante_ms: number
  }
}

// ----------------------------------------------------------
// Resultado de operações
// ----------------------------------------------------------

export interface ReservaResult {
  ok:         true
  reserva_id: ReservaId
  expira_em:  Date
  lote_id:    LoteId
}

export interface ReservaFalha {
  ok:     false
  motivo: 'ESGOTADO' | 'LOTE_ENCERRADO' | 'LOTE_SUSPENSO' | 'RESERVA_EXISTENTE' | 'ERRO'
}

export type ReservaOutcome = ReservaResult | ReservaFalha

export interface TransicaoResult {
  transitou:       boolean
  status_anterior: LoteStatus
  status_novo:     LoteStatus
}
