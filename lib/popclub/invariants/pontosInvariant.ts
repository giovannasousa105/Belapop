/**
 * INVARIANTE DE DOMÍNIO — DUAS GRANDEZAS, NUNCA INTERCAMBIÁVEIS
 *
 * pontos_disponiveis    = saldo que a membra pode RESGATAR agora
 * pontos_acumulados_12m = total que DEFINE o tier (últimos 12 meses)
 *
 * São grandezas independentes. Uma membra pode ter:
 *   pontos_disponiveis:    50    (já resgatou a maioria)
 *   pontos_acumulados_12m: 1200  (tier Premium mantido)
 *
 * Se a barra de progresso usar pontos_disponiveis, a membra que resgatou
 * créditos vê o tier "regredir" sem ter feito nada errado.
 * Isso causa suporte, churn e desconfiança no sistema de pontos.
 *
 * Regra: toda função que recebe pontos usa o tipo correto.
 * O compilador rejeita a troca acidental — branded types.
 */

// ─── Branded types ────────────────────────────────────────────────────────────
// A troca entre os dois tipos é erro de compilação, não de runtime.

export type PontosDisponiveis   = number & { readonly __brand: "PontosDisponiveis"   };
export type PontosAcumulados12m = number & { readonly __brand: "PontosAcumulados12m" };

// ─── Construtores — únicos pontos de criação dos tipos ───────────────────────

export function toPontosDisponiveis(n: number): PontosDisponiveis {
  if (n < 0)              throw new RangeError(`PontosDisponiveis não pode ser negativo: ${n}`);
  if (!Number.isInteger(n)) throw new TypeError(`PontosDisponiveis deve ser inteiro: ${n}`);
  return n as PontosDisponiveis;
}

export function toPontosAcumulados12m(n: number): PontosAcumulados12m {
  if (n < 0)              throw new RangeError(`PontosAcumulados12m não pode ser negativo: ${n}`);
  if (!Number.isInteger(n)) throw new TypeError(`PontosAcumulados12m deve ser inteiro: ${n}`);
  return n as PontosAcumulados12m;
}

// ─── Tier ─────────────────────────────────────────────────────────────────────

export type TierEnum = "ESSENCIAL" | "PREMIUM" | "LUXO";

export const TIER_LIMIARES: Record<TierEnum, number> = {
  ESSENCIAL: 0,
  PREMIUM:   500,
  LUXO:      1500,
} as const;

// Tier calculado SEMPRE por PontosAcumulados12m — nunca por PontosDisponiveis.
// TypeScript rejeita em compilação: calcularTierPorPontos(pontos_disponiveis)

export function calcularTierPorPontos(
  pontos: PontosAcumulados12m   // tipo enforça: não aceita PontosDisponiveis
): TierEnum {
  if (pontos >= TIER_LIMIARES.LUXO)    return "LUXO";
  if (pontos >= TIER_LIMIARES.PREMIUM) return "PREMIUM";
  return "ESSENCIAL";
}

// ─── Progresso para o próximo tier ───────────────────────────────────────────

export interface ProgressoTier {
  tier_atual:        TierEnum;
  proximo_tier:      TierEnum | null; // null se já é Luxo
  pts_atuais:        PontosAcumulados12m;
  pts_necessarios:   number;
  pts_faltando:      number;
  percentual:        number;          // 0–100
  label_obrigatorio: string;          // DEVE ser exibido na UI — distingue as grandezas
}

export function calcularProgressoTier(
  pontos: PontosAcumulados12m   // força o tipo correto — nunca PontosDisponiveis
): ProgressoTier {
  const tier_atual = calcularTierPorPontos(pontos);

  if (tier_atual === "LUXO") {
    return {
      tier_atual,
      proximo_tier:      null,
      pts_atuais:        pontos,
      pts_necessarios:   TIER_LIMIARES.LUXO,
      pts_faltando:      0,
      percentual:        100,
      label_obrigatorio: `${pontos} pts acumulados nos últimos 12 meses`,
    };
  }

  const proximo_tier: TierEnum = tier_atual === "ESSENCIAL" ? "PREMIUM" : "LUXO";
  const pts_necessarios = TIER_LIMIARES[proximo_tier];
  const pts_faltando    = Math.max(0, pts_necessarios - pontos);
  const percentual      = Math.min(100, Math.round((pontos / pts_necessarios) * 100));

  return {
    tier_atual,
    proximo_tier,
    pts_atuais:        pontos,
    pts_necessarios,
    pts_faltando,
    percentual,
    label_obrigatorio: `${pontos} pts acumulados nos últimos 12 meses`,
  };
}

// ─── Guard para UI ────────────────────────────────────────────────────────────
// Chamar antes de renderizar a barra de progresso.

export function assertProgressoComLabel(progresso: ProgressoTier): void {
  if (!progresso.label_obrigatorio || progresso.label_obrigatorio.trim() === "") {
    throw new Error(
      "ProgressoTier sem label_obrigatorio. " +
      "A barra de progresso DEVE exibir este label para distinguir " +
      "pontos_acumulados_12m de pontos_disponiveis para a usuária."
    );
  }
  if (!progresso.label_obrigatorio.includes("acumulados nos últimos 12 meses")) {
    throw new Error(
      `label_obrigatorio deve conter "acumulados nos últimos 12 meses". ` +
      `Recebido: "${progresso.label_obrigatorio}"`
    );
  }
}
