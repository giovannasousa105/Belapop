"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/lib/CartContext";
import { popClubPaths } from "@/lib/popclub/navigation";
import { skinScanPurchaseBundleMap, type SkinScanPurchaseBundleKey } from "@/lib/popclub/skinScanPurchaseBundles";

type SkinScanBundlePurchaseButtonProps = {
  bundleKey: SkinScanPurchaseBundleKey;
  className: string;
};

type BundleResponse = {
  items?: Array<{
    productId: string;
    sellerId: string;
    quantity: number;
  }>;
};

export function SkinScanBundlePurchaseButton({
  bundleKey,
  className
}: SkinScanBundlePurchaseButtonProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bundle = skinScanPurchaseBundleMap[bundleKey];

  const handleClick = async () => {
    setError(null);
    setPending(true);

    if (bundle.ctaKind === "concierge") {
      router.push(popClubPaths.belaCode);
      return;
    }

    try {
      const response = await fetch(`/api/skin-scan/purchase-bundles/${bundleKey}`, {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as BundleResponse & { error?: string };

      if (!response.ok || !payload.items?.length) {
        throw new Error("Não foi possível montar a rotina agora.");
      }

      payload.items.forEach((item) => {
        addItem(item.productId, item.quantity, item.sellerId);
      });

      router.push("/carrinho");
    } catch (caughtError) {
      console.error("[SkinScanBundlePurchaseButton]", caughtError);
      setError("Não foi possível montar a rotina agora.");
      setPending(false);
    }
  };

  return (
    <div className="mt-8">
      <button type="button" onClick={handleClick} className={className} disabled={pending}>
        {pending
          ? bundle.ctaKind === "concierge"
            ? "Abrindo concierge..."
            : "Montando rotina..."
          : bundle.ctaLabel}
      </button>
      {error ? <p className="mt-3 text-xs leading-relaxed text-[#b42318]">{error}</p> : null}
    </div>
  );
}
