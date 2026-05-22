"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/lib/CartContext";
import type { SkinBundle } from "@/lib/skincare/skincareBundles";

type BundleAddToCartButtonProps = {
  bundle: SkinBundle;
  redirectToCart?: boolean;
  className?: string;
  label?: string;
};

export function BundleAddToCartButton({
  bundle,
  redirectToCart = false,
  className,
  label = "Adicionar kit ao carrinho"
}: BundleAddToCartButtonProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [status, setStatus] = useState<"idle" | "adding" | "added">("idle");

  const handleAddBundle = () => {
    setStatus("adding");
    bundle.products.forEach((product) => {
      addItem(product.productId, product.quantity ?? 1, product.sellerId);
    });

    window.setTimeout(() => {
      setStatus("added");
      if (redirectToCart) router.push("/carrinho");
    }, 260);
  };

  const buttonLabel =
    status === "adding" ? "Adicionando..." : status === "added" ? "Kit adicionado" : label;

  return (
    <button
      type="button"
      onClick={handleAddBundle}
      disabled={status === "adding"}
      className={
        className ??
        "inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#1c1b1b] px-5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#6c5e06] disabled:cursor-wait disabled:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1c1b1b]"
      }
      aria-label={`${label}: ${bundle.name}`}
      aria-live="polite"
    >
      <ShoppingBag className={`h-4 w-4 ${status === "adding" ? "animate-pulse" : ""}`} aria-hidden="true" />
      {buttonLabel}
    </button>
  );
}
