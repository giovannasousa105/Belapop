"use client";

import { useEffect } from "react";

import { trackPurchase } from "@/lib/analytics";

export function PurchaseTracker({
  transactionId,
  itemId,
  itemName,
  itemCategory,
  price,
  quantity
}: {
  transactionId: string;
  itemId: string;
  itemName: string;
  itemCategory?: string | null;
  price: number;
  quantity: number;
}) {
  useEffect(() => {
    trackPurchase(
      transactionId,
      [
        {
          item_id: itemId,
          item_name: itemName,
          item_category: itemCategory ?? undefined,
          price,
          quantity
        }
      ],
      price * quantity
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  return null;
}
