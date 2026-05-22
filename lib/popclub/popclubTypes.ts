// ─── Enums de domínio ─────────────────────────────────────────────────────────

export type TierEnum = "ESSENCIAL" | "PREMIUM" | "LUXO";
export type TierComPublico = TierEnum | "PUBLICO";

export type TransacaoTipo =
  | "COMPRA"
  | "SCAN"
  | "CHECKIN"
  | "INDICACAO"
  | "STREAK_BONUS"
  | "EXPIRACAO"
  | "RESGATE_CREDITO"
  | "AJUSTE_ADMIN"
  | "ENTRADA_CLUBE";

export type CreditoStatus = "DISPONIVEL" | "APLICADO" | "EXPIRADO" | "CANCELADO";

// ─── Limiares de tier (pontos_acumulados_12m) ─────────────────────────────────

export const TIER_LIMIARES: Record<TierEnum, number> = {
  ESSENCIAL: 0,
  PREMIUM: 500,
  LUXO: 1500,
};

// ─── Multiplicadores de pontos por tier ───────────────────────────────────────
// Aplicados em COMPRA e STREAK_BONUS

export const TIER_MULTIPLICADORES: Record<TierEnum, number> = {
  ESSENCIAL: 1.0,
  PREMIUM: 1.2,
  LUXO: 1.5,
};

// ─── Janelas de acesso antecipado por tier (em horas antes da abertura geral) ─

export const TIER_JANELAS_HORAS: Record<TierEnum, number> = {
  LUXO: 72,
  PREMIUM: 48,
  ESSENCIAL: 24,
};

// ─── Regras de ganho de pontos ────────────────────────────────────────────────

export interface EarningRule {
  tipo: TransacaoTipo;
  pontos_base: number;
  multiplicador?: number;
  teto_por_dia?: number;
  teto_por_mes?: number;
  cooldown_horas?: number;
}

export const EARNING_RULES: EarningRule[] = [
  { tipo: "COMPRA",        pontos_base: 1,   multiplicador: 1 },
  { tipo: "SCAN",          pontos_base: 50,  cooldown_horas: 720 },
  { tipo: "CHECKIN",       pontos_base: 5,   teto_por_mes: 35 },
  { tipo: "INDICACAO",     pontos_base: 200 },
  { tipo: "STREAK_BONUS",  pontos_base: 50 },
  { tipo: "ENTRADA_CLUBE", pontos_base: 100 },
];

export const EARNING_RULES_MAP = new Map<TransacaoTipo, EarningRule>(
  EARNING_RULES.map((r) => [r.tipo, r])
);

// ─── Créditos ─────────────────────────────────────────────────────────────────

export const CREDITO = {
  PONTOS_POR_BRL: 10,     // 100 pts = R$ 10 → 10 pts = R$ 1
  MINIMO_PONTOS: 100,
  TETO_PCT_PEDIDO: 0.20,  // máx 20% do valor do pedido
  VALIDADE_DIAS: 365,
} as const;

// ─── Tipos de linha de banco ──────────────────────────────────────────────────

export interface PopclubMembro {
  id: string;
  user_id: string;
  tier_atual: TierEnum;
  tier_anterior: TierEnum | null;
  pontos_disponiveis: number;
  pontos_acumulados_12m: number;
  creditos_disponiveis: number;
  data_entrada: string;
  data_avaliacao_tier: string | null;
  data_rebaixamento_aviso: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface PopclubTransacao {
  id: string;
  membro_id: string;
  user_id: string;
  tipo: TransacaoTipo;
  pontos: number;
  saldo_apos: number;
  referencia_id: string | null;
  referencia_tipo: string | null;
  descricao: string | null;
  expira_em: string | null;
  criado_em: string;
}

export interface PopclubCredito {
  id: string;
  membro_id: string;
  valor_brl: number;
  pontos_utilizados: number;
  stripe_coupon_id: string | null;
  status: CreditoStatus;
  pedido_id: string | null;
  expira_em: string;
  criado_em: string;
}

export interface PopclubAcessoAntecipado {
  id: string;
  membro_id: string;
  lote_id: string;
  tier_na_data: TierEnum;
  abertura_em: string;
  acessou_em: string | null;
  criado_em: string;
}

// ─── Resultado de operações ───────────────────────────────────────────────────

export interface CreditarPontosResult {
  pontos_creditados: number;
  saldo_novo: number;
  tier_promovido?: boolean;
  tier_novo?: TierEnum;
}

export interface AvaliarTierResult {
  tier_anterior: TierEnum;
  tier_novo: TierEnum;
  promovido: boolean;
  rebaixado: boolean;
}

export interface VerificarAcessoResult {
  tem_acesso: boolean;
  tier: TierComPublico;
  abertura_em: Date;
  tempo_restante_ms: number;
}

export interface ResgatarCreditoResult {
  credito_id: string;
  valor_brl: number;
  stripe_coupon_id: string;
}
