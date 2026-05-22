export type PopClubTierId = "essencial" | "premium" | "luxo";

export type PopClubTier = {
  id: PopClubTierId;
  label: string;
  unlockRule: string;
  summary: string;
  benefits: readonly string[];
};

export const popClubTiers = [
  {
    id: "essencial",
    label: "Essencial",
    unlockRule: "Entrada no clube",
    summary: "Para quem quer começar com prioridade real na recompra e no acesso as novidades.",
    benefits: [
      "24h de acesso antecipado em lancamentos selecionados",
      "1 ponto por R$ 1 em compras elegiveis",
      "Recompra assistida com lembrete de reposicao da rotina"
    ]
  },
  {
    id: "premium",
    label: "Premium",
    unlockRule: "A partir de 1.500 pontos",
    summary: "Para quem recompra com frequencia e quer mais vantagem pratica a cada pedido.",
    benefits: [
      "48h de acesso antecipado em lancamentos e edicoes limitadas",
      "1,25 ponto por R$ 1 e credito de R$ 50 a cada 2.000 pontos",
      "2 amostras premium em pedidos elegiveis",
      "Fila prioritaria no concierge",
      "Recompra assistida com revisao de rotina"
    ]
  },
  {
    id: "luxo",
    label: "Luxo",
    unlockRule: "A partir de 4.000 pontos",
    summary: "Para quem quer acesso maximo, tratamento prioritario e montagem de cesta com apoio humano.",
    benefits: [
      "72h de acesso antecipado em lancamentos, collabs e edicoes especiais",
      "1,5 ponto por R$ 1 e credito de R$ 120 a cada 4.000 pontos",
      "4 amostras premium em pedidos elegiveis",
      "Prioridade maxima no concierge",
      "Recompra assistida com cesta pronta para confirmacao"
    ]
  }
] as const satisfies readonly PopClubTier[];

export const popClubTierMap = Object.fromEntries(
  popClubTiers.map((tier) => [tier.id, tier])
) as Record<PopClubTierId, (typeof popClubTiers)[number]>;

export const popClubBenefitThemes = [
  {
    title: "Acesso antecipado",
    description: "Janelas de 24h, 48h e 72h para comprar antes da abertura geral."
  },
  {
    title: "Pontos e creditos",
    description: "Acumulo progressivo por compra, com creditos liberados nos niveis mais altos."
  },
  {
    title: "Amostras premium",
    description: "Envio de minis selecionadas para testar novidades com critério."
  },
  {
    title: "Concierge e recompra",
    description: "Prioridade no atendimento e apoio para repetir a rotina sem perder tempo."
  }
] as const;
