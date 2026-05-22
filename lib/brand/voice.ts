export const brandVoice = {
  pillars: [
    "elegante",
    "claro",
    "humano",
    "confiável",
    "consultivo",
    "sofisticado"
  ],
  editorial: {
    purpose: "Inspirar, educar e reforçar a curadoria da marca.",
    traits: ["sensorial", "aspiracional", "emocional", "elegante"],
    do: [
      "Usar frases mais autorais quando o objetivo for descoberta.",
      "Manter a sofisticação sem comprometer a compreensão.",
      "Aproximar a escolha do cuidado real da cliente."
    ],
    avoid: [
      "Exagerar na poesia a ponto de esconder a ação disponível.",
      "Soar técnico demais em áreas de inspiração."
    ],
    examples: [
      "Skincare não é excesso. É inteligência de cuidado.",
      "Uma curadoria pensada para a pele real.",
      "O cuidado começa quando a escolha fica mais simples."
    ]
  },
  transactional: {
    purpose: "Reduzir dúvida e facilitar a próxima ação de compra.",
    traits: ["direto", "objetivo", "curto", "claro"],
    do: [
      "Priorizar verbos de ação em CTAs críticos.",
      "Explicar benefício e próxima etapa sem metáforas.",
      "Preservar o tom premium com linguagem simples."
    ],
    avoid: [
      "Usar termos vagos em botões ou etapas críticas.",
      "Transformar checkout, carrinho e PDP em discurso editorial."
    ],
    examples: [
      "Adicionar ao carrinho",
      "Finalizar pedido",
      "Ver recomendação",
      "Entrar na minha conta"
    ]
  }
} as const;

export type BrandVoice = typeof brandVoice;

