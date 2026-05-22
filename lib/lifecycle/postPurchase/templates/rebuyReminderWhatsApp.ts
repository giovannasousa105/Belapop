import { firstName, primaryItem, type LifecycleTemplateRenderer } from "./shared";

export const rebuyReminderWhatsApp: LifecycleTemplateRenderer = ({ customer, order, item, rebuyReminder }) => {
  const target = primaryItem(order, item);

  return {
    id: "rebuyReminderWhatsApp",
    name: "WhatsApp lembrete de recompra",
    channel: "whatsapp",
    type: "marketing",
    messageType: "rebuy_reminder",
    body: `${firstName(customer)}, talvez esteja na hora de repor ${target.productName}. A BelaPop separou a recompra e uma alternativa premium para você comparar.`,
    ctaLabel: "Recomprar agora",
    ctaHref: rebuyReminder?.ctaHref ?? `/produto/${target.productId}`,
    status: "active"
  };
};
