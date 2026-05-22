import { conciergeHref, firstName, type LifecycleTemplateRenderer } from "./shared";

export const deliveryFollowUpWhatsApp: LifecycleTemplateRenderer = ({ customer }) => ({
  id: "deliveryFollowUpWhatsApp",
  name: "WhatsApp acompanhamento entrega",
  channel: "whatsapp",
  type: "transactional",
  messageType: "delivery_follow_up",
  body: `Ola, ${firstName(customer)}. Seu pedido chegou em perfeito estado? Se precisar de ajuda, a BelaPop acompanha você por aqui ou pelo concierge.`,
  ctaLabel: "Preciso de ajuda",
  ctaHref: conciergeHref,
  status: "active"
});
