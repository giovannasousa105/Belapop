import { defaultRoutineHref, firstName, primaryItem, type LifecycleTemplateRenderer } from "./shared";

export const postPurchaseUsageWhatsApp: LifecycleTemplateRenderer = ({ customer, order, item }) => {
  const target = primaryItem(order, item);

  return {
    id: "postPurchaseUsageWhatsApp",
    name: "WhatsApp guia de uso",
    channel: "whatsapp",
    type: "transactional",
    messageType: "usage_guide",
    body: `Ola, ${firstName(customer)}. Seu ritual chegou. ${target.productName} entra em ${target.routineStep}, com frequencia ${target.usageFrequency}. Veja a ordem completa da sua rotina pela BelaPop.`,
    ctaLabel: "Ver minha rotina",
    ctaHref: defaultRoutineHref,
    status: "active"
  };
};
