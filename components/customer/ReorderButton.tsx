"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/lib/CartContext";
import { postCustomerReorder } from "@/lib/customer/api";

type ReorderButtonProps = {
  orderId: string;
  subOrderId?: string;
  productId?: string;
  label: string;
  className?: string;
  redirectTo?: string;
};

export function ReorderButton({
  orderId,
  subOrderId,
  productId,
  label,
  className = "",
  redirectTo = "/carrinho"
}: ReorderButtonProps) {
  const router = useRouter();
  const { replaceCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const payload = await postCustomerReorder(orderId, {
        sub_order_id: subOrderId,
        product_id: productId
      });

      replaceCart(
        payload.items.map((item) => ({
          productId: item.product_id,
          sellerId: item.seller_id,
          quantity: item.quantity
        }))
      );
      router.push(redirectTo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao preparar a recompra.";
      if (typeof window !== "undefined") window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={loading} className={className}>
      {loading ? "Preparando..." : label}
    </button>
  );
}
