import { CartItem } from "@/lib/types";

export const groupItemsBySeller = (items: CartItem[]) =>
  items.reduce<Record<string, CartItem[]>>((acc, item) => {
    if (!acc[item.sellerId]) {
      acc[item.sellerId] = [];
    }
    acc[item.sellerId].push(item);
    return acc;
  }, {});
