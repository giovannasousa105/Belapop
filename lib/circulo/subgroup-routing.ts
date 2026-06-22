export type SubgroupKey = "acne" | "spots" | "barrier" | "aging" | "shine" | "unsure";

export type SubgroupRoute = {
  url: string | null;
  label: string;
  subgroupKey: SubgroupKey;
};

// Mapeamento de preocupação de pele → sub-grupo da Comunidade BelaPop
// "shine" cai em Acne & Oleosidade (tratamento similar)
export const SUBGROUP_ROUTING: Record<SubgroupKey, SubgroupRoute> = {
  acne: {
    url: process.env.CIRCULO_WHATSAPP_SUBGROUP_ACNE_URL ?? null,
    label: "acne e oleosidade",
    subgroupKey: "acne",
  },
  spots: {
    url: process.env.CIRCULO_WHATSAPP_SUBGROUP_SPOTS_URL ?? null,
    label: "manchas e tom desigual",
    subgroupKey: "spots",
  },
  barrier: {
    url: process.env.CIRCULO_WHATSAPP_SUBGROUP_BARRIER_URL ?? null,
    label: "barreira sensibilizada",
    subgroupKey: "barrier",
  },
  aging: {
    url: process.env.CIRCULO_WHATSAPP_SUBGROUP_AGING_URL ?? null,
    label: "firmeza e linhas finas",
    subgroupKey: "aging",
  },
  shine: {
    url: process.env.CIRCULO_WHATSAPP_SUBGROUP_ACNE_URL ?? null,
    label: "brilho e poros",
    subgroupKey: "shine",
  },
  unsure: {
    url: process.env.CIRCULO_WHATSAPP_SUBGROUP_GENERAL_URL ?? null,
    label: "boas-vindas e descoberta de rotina",
    subgroupKey: "unsure",
  },
} as const;

export function getSubgroupRoute(concern: string): SubgroupRoute {
  return SUBGROUP_ROUTING[concern as SubgroupKey] ?? SUBGROUP_ROUTING.unsure;
}
