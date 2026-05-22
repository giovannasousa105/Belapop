export type LoteStatus =
  | 'ABERTO'
  | 'EM_ESGOTAMENTO'
  | 'ENCERRADO'
  | 'REPOSICAO_PREVISTA'
  | 'SUSPENSO';

export type ReservaStatus = 'ATIVA' | 'CONFIRMADA' | 'EXPIRADA' | 'CANCELADA';

export type EventoTipo =
  | 'VENDA'
  | 'RESERVA'
  | 'LIBERACAO'
  | 'TRANSICAO'
  | 'REEMBOLSO'
  | 'REEMBOLSO_AUTOMATICO'
  | 'NOTIFICACAO_ESPERA';

export type UrgenciaLevel = 'none' | 'low' | 'high';

export interface Lote {
  id: string;
  produto_id: string;
  seller_id: string;
  sku_externo: string | null;
  qtd_total: number;
  qtd_disponivel: number;
  qtd_reservada: number;
  limiar_alerta_pct: number;
  status: LoteStatus;
  abertura_geral_em: string | null;
  verificado_em: string | null;
  aberto_em: string;
  encerrado_em: string | null;
  data_reposicao: string | null;
  notas_internas: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface LoteReserva {
  id: string;
  lote_id: string;
  session_id: string;
  user_id: string | null;
  quantidade: number;
  expira_em: string;
  status: ReservaStatus;
  pedido_id: string | null;
  payment_intent_id: string | null;
  stripe_session_id: string | null;
  criado_em: string;
}

export interface LoteListaEspera {
  id: string;
  lote_id: string;
  produto_id: string;
  email: string;
  user_id: string | null;
  notificado_em: string | null;
  origem: string;
  criado_em: string;
}

export interface LoteEvento {
  id: string;
  lote_id: string;
  tipo: EventoTipo;
  status_anterior: LoteStatus | null;
  status_novo: LoteStatus | null;
  delta_qtd: number;
  actor_id: string | null;
  actor_tipo: 'user' | 'admin' | 'system' | 'webhook';
  metadata: Record<string, unknown>;
  criado_em: string;
}

export interface LoteDisplayConfig {
  mostrar_contador: boolean;
  texto_estoque: string | null;
  texto_esgotado: string | null;
  mostrar_waitlist: boolean;
  urgencia_level: UrgenciaLevel;
  status: LoteStatus;
  data_reposicao: string | null;
  qtd_disponivel: number | null;
  lote_id: string;
}

export interface ReservarLoteRequest {
  session_id: string;
  quantidade: number;
  user_id?: string;
}

export interface ReservarLoteResponse {
  reserva_id: string;
  expira_em: string;
  qtd_disponivel: number;
}

export interface ListaEsperaRequest {
  email: string;
  origem: string;
  user_id?: string;
}
