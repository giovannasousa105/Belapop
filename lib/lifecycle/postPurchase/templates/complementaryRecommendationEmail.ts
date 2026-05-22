import { firstName, formatPrice, type LifecycleTemplateRenderer } from "./shared";

export const complementaryRecommendationEmail: LifecycleTemplateRenderer = ({
  customer,
  recommendations = []
}) => {
  const primary = recommendations[0];

  return {
    id: "complementaryRecommendationEmail",
    name: "Recomendação complementar",
    channel: "email",
    type: "marketing",
    messageType: "complementary_recommendation",
    subject: `${firstName(customer)}, um complemento para deixar sua rotina mais completa`,
    previewText: "Uma recomendação feita a partir da sua ultima escolha.",
    body: [
      `Ola, ${firstName(customer)}.`,
      "",
      "Pela sua escolha, esse complemento pode deixar sua rotina mais completa.",
      primary
        ? `${primary.name} foi selecionado porque ${primary.reason ?? "conversa com sua rotina atual"}.`
        : "Nossa curadoria ainda esta ajustando a recomendação ideal para você.",
      primary ? `Investimento: ${formatPrice(primary.priceCents)}.` : "",
      "",
      "Menos excesso, mais critério: a ideia e completar a rotina com o que realmente faz sentido."
    ]
      .filter(Boolean)
      .join("\n"),
    ctaLabel: "Completar minha rotina",
    ctaHref: primary?.href ?? "/minha-rotina",
    status: "active"
  };
};
