"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/lib/CartContext";
import {
  previewLinkButtonClass,
  previewPrimaryButtonClass,
  previewSecondaryButtonClass
} from "./luxury-preview-theme";

type ProductPreviewPurchaseActionsProps = {
  productId: string;
  sellerId: string;
  cartHref: string;
  diagnosticHref: string;
};

export function ProductPreviewPurchaseActions({
  productId,
  sellerId,
  cartHref,
  diagnosticHref
}: ProductPreviewPurchaseActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [pendingTarget, setPendingTarget] = useState<"cart" | "diagnostic" | null>(null);

  const handleAddToCart = () => {
    if (pendingTarget) return;
    setPendingTarget("cart");
    addItem(productId, 1, sellerId);
    router.push(cartHref);
  };

  const handleDiagnostic = () => {
    if (pendingTarget) return;
    setPendingTarget("diagnostic");
    router.push(diagnosticHref);
  };

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={pendingTarget !== null}
        className={`${previewPrimaryButtonClass} w-full sm:flex-1`}
      >
        {pendingTarget === "cart" ? "Adicionando..." : "Adicionar a bolsa"}
      </button>
      <button
        type="button"
        onClick={handleDiagnostic}
        disabled={pendingTarget !== null}
        className={`${previewSecondaryButtonClass} w-full sm:w-auto sm:px-6`}
      >
        Ver rotina sugerida
      </button>
      <span className={`${previewLinkButtonClass} hidden sm:inline-flex sm:min-h-0 sm:px-0`}>
        Diagnostico com contexto editorial
      </span>
    </div>
  );
}
