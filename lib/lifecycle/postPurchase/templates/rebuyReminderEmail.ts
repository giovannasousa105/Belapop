import { firstName, primaryItem, type LifecycleTemplateRenderer } from "./shared";

export const rebuyReminderEmail: LifecycleTemplateRenderer = ({ customer, order, item, rebuyReminder }) => {
  const target = primaryItem(order, item);

  return {
    id: "rebuyReminderEmail",
    name: "Lembrete de recompra",
    channel: "email",
    type: "marketing",
    messageType: "rebuy_reminder",
    subject: `Talvez esteja na hora de repor ${target.productName}`,
    previewText: "Seu produto pode estar acabando.",
    body: [
      `Ola, ${firstName(customer)}.`,
      "",
      `Talvez esteja na hora de repor seu favorito: ${target.productName}.`,
      `A duração media para essa categoria e de ${rebuyReminder?.recommendedAfterDays ?? target.averageDurationDays ?? 45} dias.`,
      `Beneficio que vale manter na rotina: ${target.concern ?? target.routineStep}.`,
      "",
      "Antes de recomprar, confirme como esta seu estoque em casa e se a rotina ainda combina com sua pele."
    ].join("\n"),
    ctaLabel: "Recomprar agora",
    ctaHref: rebuyReminder?.ctaHref ?? `/produto/${target.productId}`,
    status: "active"
  };
};
