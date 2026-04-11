"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/CartContext";

type ProductPurchaseActionsProps = {
  containerClassName?: string;
  mode?: "single" | "dual";
  primaryClassName?: string;
  primaryLabel?: string;
  primaryTarget?: "cart" | "checkout";
  productId: string;
  secondaryClassName?: string;
  secondaryLabel?: string;
  sellerId: string;
};

export function ProductPurchaseActions({
  containerClassName = "",
  mode = "dual",
  primaryClassName = "",
  primaryLabel,
  primaryTarget = "cart",
  productId,
  secondaryClassName = "",
  secondaryLabel,
  sellerId
}: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [pendingAction, setPendingAction] = useState<"cart" | "checkout" | null>(null);

  const handleNavigate = (target: "cart" | "checkout") => {
    setPendingAction(target);
    addItem(productId, 1, sellerId);
    router.push(target === "cart" ? "/carrinho" : "/checkout");
  };

  if (mode === "single") {
    return (
      <div className={containerClassName}>
        <Button
          onClick={() => handleNavigate(primaryTarget)}
          className={primaryClassName || "w-full"}
          disabled={pendingAction !== null}
        >
          {pendingAction === primaryTarget
            ? primaryTarget === "cart"
              ? "Adicionando..."
              : "Redirecionando..."
            : primaryLabel || (primaryTarget === "cart" ? "Adicionar ao carrinho" : "Comprar agora")}
        </Button>
      </div>
    );
  }

  return (
    <div className={containerClassName || "flex flex-wrap gap-3"}>
      <Button
        onClick={() => handleNavigate("cart")}
        className={primaryClassName || "min-w-[180px] flex-1"}
        disabled={pendingAction !== null}
      >
        {pendingAction === "cart" ? "Adicionando..." : primaryLabel || "Adicionar ao carrinho"}
      </Button>
      <Button
        onClick={() => handleNavigate("checkout")}
        variant="secondary"
        className={secondaryClassName || "min-w-[180px] flex-1"}
        disabled={pendingAction !== null}
      >
        {pendingAction === "checkout" ? "Redirecionando..." : secondaryLabel || "Comprar agora"}
      </Button>
    </div>
  );
}
