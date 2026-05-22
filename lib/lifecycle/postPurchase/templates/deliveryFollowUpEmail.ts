import { conciergeHref, firstName, primaryItem, type LifecycleTemplateRenderer } from "./shared";

export const deliveryFollowUpEmail: LifecycleTemplateRenderer = ({ customer, order, item }) => {
  const target = primaryItem(order, item);

  return {
    id: "deliveryFollowUpEmail",
    name: "Acompanhamento apos entrega",
    channel: "email",
    type: "transactional",
    messageType: "delivery_follow_up",
    subject: `${firstName(customer)}, seu pedido chegou bem?`,
    previewText: "A BelaPop acompanha o recebimento e o primeiro uso.",
    body: [
      `Ola, ${firstName(customer)}.`,
      "",
      "Queremos confirmar se seu pedido chegou em perfeito estado.",
      `Para começar por ${target.productName}, use com calma e observe como sua pele responde nos primeiros dias.`,
      "",
      "Se algo chegou avariado, divergente ou se você quiser orientacao, nosso concierge pode ajudar."
    ].join("\n"),
    ctaLabel: "Preciso de ajuda",
    ctaHref: conciergeHref,
    status: "active"
  };
};
