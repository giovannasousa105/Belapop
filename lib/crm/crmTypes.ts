export type FluxoEnum =
  | "PEDIDO_CONFIRMADO" | "PEDIDO_ENVIADO" | "SCAN_RESULTADO"
  | "POPCLUB_BOAS_VINDAS" | "POPCLUB_PROMOCAO_TIER"
  | "CARRINHO_ABANDONADO_1H" | "CARRINHO_ABANDONADO_24H"
  | "WISHLIST_ESGOTANDO" | "TIER_RISCO_REBAIXAMENTO"
  | "REATIVACAO_30D" | "REATIVACAO_60D"
  | "CHECKIN_SEMANAL" | "PROGRESSO_TWIN_MENSAL"
  | "ALERTA_REGRESSAO" | "LEMBRETE_SCAN"
  | "CURADORIA_SEMANAL" | "WAITLIST_PRODUTO"
  | "LOTE_ESGOTANDO" | "RECOMPRA_ASSISTIDA";

export type GrupoEnum = "TRANSACIONAL" | "LIFECYCLE" | "PELE" | "EDITORIAL";
export type EnvioStatus = "ENFILEIRADO" | "ENVIADO" | "ENTREGUE" | "ABERTO" | "CLICADO" | "BOUNCE" | "FALHOU";
export type SupressaoMotivo = "UNSUBSCRIBE" | "BOUNCE_HARD" | "BOUNCE_SOFT_LIMITE" | "SPAM_REPORT" | "ADMIN" | "PREFERENCIA";

export const FLUXO_GRUPO: Record<FluxoEnum, GrupoEnum> = {
  PEDIDO_CONFIRMADO:      "TRANSACIONAL",
  PEDIDO_ENVIADO:         "TRANSACIONAL",
  SCAN_RESULTADO:         "TRANSACIONAL",
  POPCLUB_BOAS_VINDAS:    "TRANSACIONAL",
  POPCLUB_PROMOCAO_TIER:  "TRANSACIONAL",
  CARRINHO_ABANDONADO_1H: "LIFECYCLE",
  CARRINHO_ABANDONADO_24H:"LIFECYCLE",
  WISHLIST_ESGOTANDO:     "LIFECYCLE",
  TIER_RISCO_REBAIXAMENTO:"LIFECYCLE",
  REATIVACAO_30D:         "LIFECYCLE",
  REATIVACAO_60D:         "LIFECYCLE",
  CHECKIN_SEMANAL:        "PELE",
  PROGRESSO_TWIN_MENSAL:  "PELE",
  ALERTA_REGRESSAO:       "PELE",
  LEMBRETE_SCAN:          "PELE",
  CURADORIA_SEMANAL:      "EDITORIAL",
  WAITLIST_PRODUTO:       "EDITORIAL",
  LOTE_ESGOTANDO:         "EDITORIAL",
  RECOMPRA_ASSISTIDA:     "EDITORIAL",
};

export const FLUXOS_TRANSACIONAIS = new Set<FluxoEnum>([
  "PEDIDO_CONFIRMADO", "PEDIDO_ENVIADO", "SCAN_RESULTADO",
  "POPCLUB_BOAS_VINDAS", "POPCLUB_PROMOCAO_TIER",
]);

// Cooldowns por fluxo em horas (Redis TTL)
export const FLUXO_COOLDOWN_HORAS: Partial<Record<FluxoEnum, number>> = {
  CARRINHO_ABANDONADO_1H:  1,
  CARRINHO_ABANDONADO_24H: 24,
  CHECKIN_SEMANAL:         144,  // 6 dias
  CURADORIA_SEMANAL:       144,
  REATIVACAO_30D:          720,  // 30 dias
  REATIVACAO_60D:          1440, // 60 dias
  ALERTA_REGRESSAO:        336,  // 14 dias
  LEMBRETE_SCAN:           168,  // 7 dias
};

export const MAX_NAO_TRANSACIONAIS_POR_DIA = 1;

/**
 * Branded type — o único tipo que deliveryQueue.enfileirar aceita.
 * O suppressionGuard é o único que pode criar um EmailPermitido.
 * Garante que nenhum e-mail é enviado sem passar pelo guard.
 */
export type EmailPermitido = {
  readonly __brand: "EmailPermitido";
  readonly user_id: string;
  readonly email:   string;
  readonly fluxo:   FluxoEnum;
  readonly grupo:   GrupoEnum;
};

export interface EnfileirarParams {
  user_id: string;
  email: string;
  fluxo: FluxoEnum;
  template_id: string;
  subject: string;
  metadata: Record<string, unknown>;
  agendado_para?: Date;
  produto_id?: string; // para cooldown por produto (WAITLIST, RECOMPRA)
}

export interface EnvioRow {
  id: string;
  user_id: string | null;
  email: string;
  fluxo: FluxoEnum;
  grupo: GrupoEnum;
  status: EnvioStatus;
  provider_id: string | null;
  template_id: string | null;
  subject: string | null;
  metadata: Record<string, unknown> | null;
  agendado_para: string | null;
  enviado_em: string | null;
  erro: string | null;
  tentativas: number;
  criado_em: string;
}
