import { firstName, primaryItem, type LifecycleTemplateRenderer } from "./shared";

export const reviewRequestWhatsApp: LifecycleTemplateRenderer = ({ customer, order, item, reviewRequest }) => {
  const target = primaryItem(order, item);

  return {
    id: "reviewRequestWhatsApp",
    name: "WhatsApp convite avaliação real",
    channel: "whatsapp",
    type: "marketing",
    messageType: "review_request",
    body: `${firstName(customer)}, queremos saber como foi sua experiência real com ${target.productName}. Sua opiniao pode ser simples, honesta e sem pressa.`,
    ctaLabel: "Avaliar produto",
    ctaHref: reviewRequest ? `/avaliar-produto?request=${reviewRequest.id}` : "/avaliar-produto",
    status: "active"
  };
};
