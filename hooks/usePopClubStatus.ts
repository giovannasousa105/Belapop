"use client";

import useSWR from "swr";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

export type TierEnum = "ESSENCIAL" | "PREMIUM" | "LUXO";

export interface MembroUI {
  tier_atual: TierEnum;
  tier_anterior: TierEnum | null;
  pontos_disponiveis: number;
  pontos_acumulados_12m: number;
  creditos_disponiveis: number;
  data_entrada: string;
  data_avaliacao_tier: string | null;
  data_rebaixamento_aviso: string | null;
}

export interface TransacaoUI {
  tipo: string;
  pontos: number;
  saldo_apos: number;
  descricao: string | null;
  criado_em: string;
}

export interface CreditoUI {
  id: string;
  valor_brl: number;
  stripe_coupon_id: string | null;
  expira_em: string;
}

export interface PopclubStatusReturn {
  membro: MembroUI | null;
  tier: TierEnum | null;
  pontos_disponiveis: number;
  pontos_acumulados_12m: number;
  creditos_disponiveis: number;
  creditos_ativos: CreditoUI[];
  proximo_tier: { tier: TierEnum; pts_necessarios: number } | null;
  em_risco_rebaixamento: boolean;
  pts_para_manter_tier: number;
  data_avaliacao: string | null;
  transacoes: TransacaoUI[];
  isLoading: boolean;
  mutate: () => void;
}

// ─── Constantes de tier ───────────────────────────────────────────────────────

const TIER_LIMIARES: Record<TierEnum, number> = { ESSENCIAL: 0, PREMIUM: 500, LUXO: 1500 };
const PROXIMO_TIER: Record<TierEnum, TierEnum | null> = {
  ESSENCIAL: "PREMIUM",
  PREMIUM: "LUXO",
  LUXO: null,
};

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("popclub status unavailable");
    return r.json();
  });

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePopClubStatus(): PopclubStatusReturn {
  const { data, isLoading, mutate } = useSWR(
    "/api/popclub/status",
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60_000,
    }
  );

  const membro = (data?.membro as MembroUI | null) ?? null;
  const transacoes = (data?.transacoes as TransacaoUI[]) ?? [];
  const creditos_ativos = (data?.creditos_ativos as CreditoUI[]) ?? [];

  if (!membro) {
    return {
      membro: null,
      tier: null,
      pontos_disponiveis: 0,
      pontos_acumulados_12m: 0,
      creditos_disponiveis: 0,
      creditos_ativos: [],
      proximo_tier: null,
      em_risco_rebaixamento: false,
      pts_para_manter_tier: 0,
      data_avaliacao: null,
      transacoes: [],
      isLoading,
      mutate,
    };
  }

  const tier = membro.tier_atual;
  const proximoTierKey = PROXIMO_TIER[tier];
  const proximo_tier = proximoTierKey
    ? {
        tier: proximoTierKey,
        pts_necessarios: Math.max(0, TIER_LIMIARES[proximoTierKey] - membro.pontos_acumulados_12m),
      }
    : null;

  // Risco de rebaixamento: data_rebaixamento_aviso dentro dos próximos 30 dias
  const dataAviso = membro.data_rebaixamento_aviso
    ? new Date(membro.data_rebaixamento_aviso)
    : null;
  const em_risco_rebaixamento =
    dataAviso != null &&
    dataAviso <= new Date(Date.now() + 30 * 86400000);

  // Pontos necessários para manter o tier atual na janela de 12m
  const pts_para_manter_tier = em_risco_rebaixamento
    ? Math.max(0, TIER_LIMIARES[tier] - membro.pontos_acumulados_12m)
    : 0;

  return {
    membro,
    tier,
    pontos_disponiveis: membro.pontos_disponiveis,
    pontos_acumulados_12m: membro.pontos_acumulados_12m,
    creditos_disponiveis: membro.creditos_disponiveis,
    creditos_ativos,
    proximo_tier,
    em_risco_rebaixamento,
    pts_para_manter_tier,
    data_avaliacao: membro.data_avaliacao_tier,
    transacoes,
    isLoading,
    mutate,
  };
}
