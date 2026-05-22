import type {
  Customer,
  LifecycleTemplate,
  Order,
  OrderItem,
  RecommendationProduct,
  RebuyReminder,
  ReviewRequest
} from "@/lib/lifecycle/postPurchase/types";

export type TemplateContext = {
  customer: Customer;
  order: Order;
  item?: OrderItem;
  recommendations?: RecommendationProduct[];
  rebuyReminder?: RebuyReminder;
  reviewRequest?: ReviewRequest;
};

export type LifecycleTemplateRenderer = (context: TemplateContext) => LifecycleTemplate;

export const firstName = (customer: Customer) => customer.name.split(" ")[0] || customer.name;

export const formatPrice = (priceCents: number) =>
  new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(priceCents / 100);

export const listText = (items: string[]) => items.filter(Boolean).join(", ");

export const primaryItem = (order: Order, item?: OrderItem) => item ?? order.items[0];

export const defaultRoutineHref = "/minha-rotina";

export const conciergeHref = "/contato?assunto=concierge";
