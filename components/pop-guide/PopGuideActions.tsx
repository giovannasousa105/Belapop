"use client";

import Link from "next/link";
import { MessageCircleMore, ScanFace, ShoppingBag } from "lucide-react";
import { useState } from "react";

import { dispatchConsultoraBelaPopOpen } from "@/lib/assistant/events";
import { useCart } from "@/lib/CartContext";
import { getBundleById, type ProductRecommendation } from "@/lib/content/popGuide";

type AddRoutineToCartCTAProps = {
  label: string;
  productIds?: ProductRecommendation[];
  bundleId?: string;
  origin: string;
  compact?: boolean;
};

export function AddRoutineToCartCTA({
  label,
  productIds = [],
  bundleId,
  origin,
  compact = false
}: AddRoutineToCartCTAProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    const bundle = bundleId ? getBundleById(bundleId) : null;

    if (bundle) {
      bundle.products.forEach((product) => {
        addItem(product.productId, product.quantity ?? 1, product.sellerId);
      });
    } else {
      productIds.forEach((product) => addItem(product.productId, 1, "s1"));
    }

    setAdded(true);
  };

  return (
    <div className={compact ? "grid gap-2" : "flex flex-col gap-3 sm:flex-row"}>
      <button
        type="button"
        onClick={handleAdd}
        data-origin={origin}
        className="inline-flex min-h-[52px] items-center justify-center gap-3 bg-[#111111] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#6c5e06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]"
      >
        <ShoppingBag className="h-4 w-4" />
        {added ? "Rotina adicionada" : label}
      </button>
      {added ? (
        <Link
          href="/carrinho"
          className="inline-flex min-h-[52px] items-center justify-center border border-[#111111] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#111111] transition hover:bg-[#111111] hover:text-white"
        >
          Ver carrinho
        </Link>
      ) : null}
    </div>
  );
}

export function ConciergeCTA({
  label = "Falar com concierge",
  origin,
  dark = false
}: {
  label?: string;
  origin: string;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => dispatchConsultoraBelaPopOpen({ origin, flow: "routine" })}
      className={`inline-flex min-h-[52px] items-center justify-center gap-3 px-5 text-[10px] font-bold uppercase tracking-[0.22em] transition ${
        dark
          ? "border border-white/30 text-white hover:bg-white hover:text-black"
          : "border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white"
      }`}
    >
      <MessageCircleMore className="h-4 w-4" />
      {label}
    </button>
  );
}

export function SkinScanCTA({ label = "Fazer Skin Scan" }: { label?: string }) {
  return (
    <Link
      href="/skin-scan"
      className="inline-flex min-h-[52px] items-center justify-center gap-3 border border-[#111111] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#111111] transition hover:bg-[#111111] hover:text-white"
    >
      <ScanFace className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function MobileGuideBar({
  bundleId,
  products,
  label = "Comprar rotina completa"
}: {
  bundleId?: string;
  products?: ProductRecommendation[];
  label?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ded8d2] bg-[#fcf9f8]/95 px-4 py-3 shadow-[0_-18px_48px_rgba(17,17,17,0.12)] backdrop-blur md:hidden">
      <AddRoutineToCartCTA
        label={label}
        bundleId={bundleId}
        productIds={products}
        origin="pop_guide_mobile_bar"
        compact
      />
    </div>
  );
}
