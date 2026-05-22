import { firstName, type LifecycleTemplateRenderer } from "./shared";

export const complementaryRecommendationWhatsApp: LifecycleTemplateRenderer = ({
  customer,
  recommendations = []
}) => {
  const primary = recommendations[0];

  return {
    id: "complementaryRecommendationWhatsApp",
    name: "WhatsApp recomendação complementar",
    channel: "whatsapp",
    type: "marketing",
    messageType: "complementary_recommendation",
    body: primary
      ? `${firstName(customer)}, pela sua escolha, ${primary.name} pode completar sua rotina com mais critério.`
      : `${firstName(customer)}, a BelaPop preparou uma recomendação complementar para sua rotina.`,
    ctaLabel: "Ver recomendação",
    ctaHref: primary?.href ?? "/minha-rotina",
    status: "active"
  };
};
