import { enfileirar } from "@/lib/crm/deliveryQueue";

const DELAY_BOAS_VINDAS_MS = 5 * 60 * 1000; // 5 minutos após PEDIDO_CONFIRMADO

// ─── Boas-vindas ──────────────────────────────────────────────────────────────

export interface BoasVindasParams {
  user_id:            string;
  email:              string;
  nome:               string | null;
  pontos_boas_vindas: number;   // 100
  antecipacao_horas:  number;   // 24 (Essencial)
  data_entrada:       string;   // formatada pt-BR
}

export async function enviarBoasVindas(params: BoasVindasParams): Promise<void> {
  const nome = params.nome ?? "você";
  await enfileirar({
    user_id:      params.user_id,
    email:        params.email,
    fluxo:        "POPCLUB_BOAS_VINDAS",
    template_id:  "PopClubBoasVindas",
    subject:      `Bem-vinda ao PopClub, ${nome}`,
    // Chega sempre 5min APÓS PEDIDO_CONFIRMADO
    agendado_para: new Date(Date.now() + DELAY_BOAS_VINDAS_MS),
    metadata: {
      nome:               params.nome,
      pontos_boas_vindas: params.pontos_boas_vindas,
      antecipacao_horas:  params.antecipacao_horas,
      data_entrada:       params.data_entrada,
    },
  });
}

// ─── Promoção de tier ─────────────────────────────────────────────────────────

export interface PromocaoTierParams {
  user_id:            string;
  email:              string;
  nome:               string | null;
  tier_anterior:      "ESSENCIAL" | "PREMIUM" | "LUXO";
  tier_novo:          "PREMIUM" | "LUXO";
  nova_antecipacao_h: number;   // 48 ou 72
  pontos_acumulados:  number;
}

const TIER_LABEL: Record<string, string> = {
  ESSENCIAL: "Essencial",
  PREMIUM:   "Premium",
  LUXO:      "Luxo",
};

export async function enviarPromocaoTier(params: PromocaoTierParams): Promise<void> {
  await enfileirar({
    user_id:     params.user_id,
    email:       params.email,
    fluxo:       "POPCLUB_PROMOCAO_TIER",
    template_id: "PopClubPromocaoTier",
    subject:     `Você subiu para ${TIER_LABEL[params.tier_novo] ?? params.tier_novo} no PopClub`,
    metadata: {
      nome:               params.nome,
      tier_anterior:      params.tier_anterior,
      tier_novo:          params.tier_novo,
      nova_antecipacao_h: params.nova_antecipacao_h,
      pontos_acumulados:  params.pontos_acumulados,
    },
  });
}
