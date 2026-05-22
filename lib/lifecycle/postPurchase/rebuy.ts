import type { Order, RebuyReminder, ProductLifecycleCategory } from "@/lib/lifecycle/postPurchase/types";

export const rebuyDaysByCategory: Record<ProductLifecycleCategory, number> = {
  limpeza: 50,
  serum: 50,
  "serum-vitamina-c": 50,
  hidratante: 38,
  "protetor-solar": 30,
  "tonico-esfoliante": 60,
  mascara: 75,
  bundle: 50,
  outro: 60
};

export const getRebuyDaysForCategory = (category: ProductLifecycleCategory) =>
  rebuyDaysByCategory[category] ?? rebuyDaysByCategory.outro;

export const addDaysIso = (isoDate: string, days: number) => {
  const base = new Date(isoDate);
  return new Date(base.getTime() + days * 86_400_000).toISOString();
};

export function createRebuyReminders(order: Order): RebuyReminder[] {
  const deliveredAt = order.deliveredAt ?? order.confirmedAt;

  return order.items.map((item) => {
    const recommendedAfterDays = item.averageDurationDays ?? getRebuyDaysForCategory(item.category);

    return {
      id: `rebuy-${order.id}-${item.id}`,
      customerId: order.customerId,
      orderId: order.id,
      orderItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      category: item.category,
      recommendedAfterDays,
      remindAt: addDaysIso(deliveredAt, recommendedAfterDays),
      status: "scheduled",
      ctaHref: `/produto/${item.productId}`
    };
  });
}
