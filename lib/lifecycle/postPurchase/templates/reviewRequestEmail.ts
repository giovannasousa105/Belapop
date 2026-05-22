import { firstName, primaryItem, type LifecycleTemplateRenderer } from "./shared";

export const reviewRequestEmail: LifecycleTemplateRenderer = ({ customer, order, item, reviewRequest }) => {
  const target = primaryItem(order, item);

  return {
    id: "reviewRequestEmail",
    name: "Convite para avaliação real",
    channel: "email",
    type: "marketing",
    messageType: "review_request",
    subject: `${firstName(customer)}, como foi sua experiência real com ${target.productName}?`,
    previewText: "Sua opiniao real ajuda a curadoria a orientar melhor outras clientes.",
    body: [
      `Ola, ${firstName(customer)}.`,
      "",
      "Queremos saber como foi sua experiência real com esse produto.",
      "A avaliação pode ter nota de 1 a 5, um comentario simples e, se fizer sentido, uma foto.",
      "",
      "Não pedimos elogio. Pedimos contexto, transparencia e uso real."
    ].join("\n"),
    ctaLabel: "Avaliar produto",
    ctaHref: reviewRequest ? `/avaliar-produto?request=${reviewRequest.id}` : "/avaliar-produto",
    status: "active"
  };
};
