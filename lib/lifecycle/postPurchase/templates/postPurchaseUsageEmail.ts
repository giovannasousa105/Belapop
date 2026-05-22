import { defaultRoutineHref, firstName, listText, primaryItem, type LifecycleTemplateRenderer } from "./shared";

export const postPurchaseUsageEmail: LifecycleTemplateRenderer = ({ customer, order, item }) => {
  const target = primaryItem(order, item);

  return {
    id: "postPurchaseUsageEmail",
    name: "Guia de uso pos-compra",
    channel: "email",
    type: "transactional",
    messageType: "usage_guide",
    subject: `${firstName(customer)}, seu ritual BelaPop começa aqui`,
    previewText: "Como usar seu produto no momento certo da rotina.",
    body: [
      `Ola, ${firstName(customer)}.`,
      "",
      "Seu ritual chegou. Agora vamos te ajudar a usar da melhor forma.",
      "",
      `${target.productName} entra em: ${target.routineStep}.`,
      `Frequencia: ${target.usageFrequency}.`,
      `Como usar: ${target.howToUse.join(" ")}`,
      `Cuidados: ${target.precautions.join(" ")}`,
      `Combina com: ${listText(target.combinesWith)}.`,
      target.avoidWith?.length ? `Evite junto com: ${listText(target.avoidWith)}.` : "",
      "",
      "Esse produto funciona melhor quando entra no momento certo da rotina."
    ]
      .filter(Boolean)
      .join("\n"),
    ctaLabel: "Ver minha rotina",
    ctaHref: defaultRoutineHref,
    status: "active"
  };
};
