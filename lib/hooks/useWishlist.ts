"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/AuthContext";

export type WishlistItem = {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    price_cents: number;
    category: string | null;
    images: string[] | null;
    seller_id: string | null;
  } | null;
};

export const useWishlist = () => {
  const { ready, user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist");
      const json = (await res.json()) as { items: WishlistItem[] };
      setItems(json.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  const ids = useMemo(
    () => new Set(items.map((item) => item.product_id)),
    [items]
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) {
        setPromptOpen(true);
        return;
      }

      const isSaved = ids.has(productId);
      setItems((prev) =>
        isSaved
          ? prev.filter((item) => item.product_id !== productId)
          : [
              ...prev,
              { id: `local-${productId}`, product_id: productId, products: null }
            ]
      );

      const method = isSaved ? "DELETE" : "POST";
      await fetch("/api/wishlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      await load();
    },
    [ids, load, user]
  );

  return {
    items,
    loading,
    isWishlisted: (productId: string) => ids.has(productId),
    toggle,
    promptOpen,
    closePrompt: () => setPromptOpen(false)
  };
};
